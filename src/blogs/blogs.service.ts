import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { Blog, BlogDocument } from './entities/blog.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { buildLocalizedSlug, generateLocaleSlug } from './utils/blog-slug.util';
import {
  Category,
  CategoryDocument,
} from '../categories/entities/category.entity';
import {
  BlogReference,
  BlogReferenceDocument,
} from '../blog-references/entities/blog-reference.entity';

type Locale = 'ar' | 'en';

type LocalizedText = {
  ar: string;
  en: string;
};

type LocalizedTextList = {
  ar: string[];
  en: string[];
};

type LocalizedTextListInput = {
  ar?: string | string[];
  en?: string | string[];
};

type BlogResponse = BlogDocument & {
  user_name?: string | null;
  references?: BlogReferenceDocument[];
  prev_blog?: {
    id: string;
    title: LocalizedText;
  } | null;
  next_blog?: {
    id: string;
    title: LocalizedText;
  } | null;
  seo: {
    meta_title: LocalizedText;
    meta_description: LocalizedText;
    meta_keywords: LocalizedTextList;
    canonical_url: string;
    og_image: unknown;
    og_title: LocalizedText;
    og_description: LocalizedText;
  };
  json_ld: Record<Locale, Record<string, unknown>>;
};

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name)
    private blogModel: Model<BlogDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(BlogReference.name)
    private readonly blogReferenceModel: Model<BlogReferenceDocument>,
    private readonly configService: ConfigService,
  ) {}

  async create(createBlogDto: CreateBlogDto) {
    await this.assertCategoryExists(createBlogDto.category_id);
    await this.assertRelatedBlogsExist(createBlogDto.related_blogs_ids);

    try {
      const blog = new this.blogModel(this.prepareBlogPayload(createBlogDto));
      const savedBlog = await blog.save();

      return this.findOne(savedBlog.id);
    } catch (error) {
      this.handleDuplicateSlugError(error);
    }
  }

  async findAll(query: any) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      category_id,
      category,
      language,
      lang,
      sort = 'createdAt',
      order = 'desc',
    } = query;

    const filter: any = {};

    if (status) filter.status = status;
    if (category_id || category) filter.category_id = category_id || category;
    const locale = this.resolveLocaleFilter(language || lang);

    if (locale) {
      filter[`content.${locale}`] = { $exists: true, $type: 'string', $ne: '' };
    }

    if (search) {
      filter.$or = [
        { 'title.en': { $regex: search, $options: 'i' } },
        { 'title.ar': { $regex: search, $options: 'i' } },
        { 'description.en': { $regex: search, $options: 'i' } },
        { 'description.ar': { $regex: search, $options: 'i' } },
        { 'slug.en': { $regex: search, $options: 'i' } },
        { 'slug.ar': { $regex: search, $options: 'i' } },
        { 'tags.en': { $regex: search, $options: 'i' } },
        { 'tags.ar': { $regex: search, $options: 'i' } },
      ];
    }

    const blogs = await this.blogModel
      .find(filter)
      .populate('category_id')
      .populate('blog_image')
      .populate('og_image')
      .populate('gallery')
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await this.blogModel.countDocuments(filter);

    const userNamesById = await this.getUserNamesById(
      blogs.map((blog) => blog.user_id),
    );
    const referencesByBlogId = await this.getReferencesByBlogId(
      blogs.map((blog) => blog._id),
    );

    return {
      data: blogs.map((blog) =>
        this.serializeBlog(
          blog,
          undefined,
          undefined,
          userNamesById.get(this.getObjectIdString(blog.user_id) || '') ?? null,
          referencesByBlogId.get(String(blog._id)) || [],
        ),
      ),
      total,
      page: Number(page),
      lastPage: Math.ceil(total / Number(limit)),
    };
  }

  async findOne(id: string) {
    const blog = await this.blogModel
      .findById(id)
      .populate('category_id')
      .populate('blog_image')
      .populate('og_image')
      .populate('gallery');

    if (!blog) throw new NotFoundException('Blog not found');

    const [prevBlog, nextBlog] = await this.findSiblingBlogs(blog);
    const userNamesById = await this.getUserNamesById([blog.user_id]);
    const referencesByBlogId = await this.getReferencesByBlogId([blog._id]);

    return this.serializeBlog(
      blog,
      prevBlog,
      nextBlog,
      userNamesById.get(this.getObjectIdString(blog.user_id) || '') ?? null,
      referencesByBlogId.get(String(blog._id)) || [],
    );
  }

  async update(id: string, updateBlogDto: UpdateBlogDto) {
    const existingBlog = await this.blogModel.findById(id);

    if (!existingBlog) {
      throw new NotFoundException('Blog not found');
    }

    await this.assertCategoryExists(updateBlogDto.category_id);
    await this.assertRelatedBlogsExist(updateBlogDto.related_blogs_ids);

    try {
      existingBlog.set(this.prepareBlogPayload(updateBlogDto, existingBlog));
      await existingBlog.save();

      return this.findOne(id);
    } catch (error) {
      this.handleDuplicateSlugError(error);
    }
  }

  async remove(id: string) {
    const blog = await this.blogModel.findByIdAndDelete(id);

    if (!blog) throw new NotFoundException('Blog not found');

    return { message: 'Blog deleted successfully' };
  }

  private prepareBlogPayload(
    payload: Partial<CreateBlogDto>,
    existingBlog?: BlogDocument,
  ) {
    const title = this.mergeLocalizedField(existingBlog?.title, payload.title);
    const description = this.mergeLocalizedField(
      existingBlog?.description,
      payload.description,
    );
    const content = this.mergeLocalizedField(
      existingBlog?.content,
      payload.content,
    );

    return {
      ...payload,
      title,
      description,
      content,
      tags: this.mergeLocalizedStringArray(existingBlog?.tags, payload.tags),
      publishedAt: this.resolvePublishedAt(payload, existingBlog),
      slug: this.resolveSlugPayload(existingBlog, payload, title),
      meta_title: this.mergeLocalizedField(
        existingBlog?.meta_title,
        payload.meta_title,
      ),
      meta_description: this.mergeLocalizedField(
        existingBlog?.meta_description,
        payload.meta_description,
      ),
      meta_keywords: this.mergeLocalizedStringArray(
        existingBlog?.meta_keywords,
        payload.meta_keywords,
      ),
      og_title: this.mergeLocalizedField(
        existingBlog?.og_title,
        payload.og_title,
      ),
      og_description: this.mergeLocalizedField(
        existingBlog?.og_description,
        payload.og_description,
      ),
    };
  }

  private async assertCategoryExists(categoryId?: string) {
    if (!categoryId) {
      return;
    }

    const categoryExists = await this.categoryModel.exists({ _id: categoryId });

    if (!categoryExists) {
      throw new NotFoundException('Category not found');
    }
  }

  private async assertRelatedBlogsExist(relatedBlogIds?: string[]) {
    if (!relatedBlogIds?.length) {
      return;
    }

    const uniqueIds = [...new Set(relatedBlogIds)];
    const existingCount = await this.blogModel.countDocuments({
      _id: { $in: uniqueIds },
    });

    if (existingCount !== uniqueIds.length) {
      throw new NotFoundException('One or more related blogs were not found');
    }
  }

  private resolvePublishedAt(
    payload: Partial<CreateBlogDto>,
    existingBlog?: BlogDocument,
  ): Date | undefined {
    if (payload.publishedAt) {
      return new Date(payload.publishedAt);
    }

    if (existingBlog?.publishedAt) {
      return existingBlog.publishedAt;
    }

    if (payload.status === 'published' && !existingBlog?.publishedAt) {
      return new Date();
    }

    return existingBlog?.publishedAt;
  }

  private resolveSlugPayload(
    existingBlog: BlogDocument | undefined,
    payload: Partial<CreateBlogDto>,
    title: LocalizedText,
  ): LocalizedText {
    if (!existingBlog) {
      return buildLocalizedSlug(title, payload.slug);
    }

    return {
      ar: this.resolveLocaleSlugValue(
        'ar',
        existingBlog.slug?.ar,
        payload.slug?.ar,
        payload.title?.ar,
        title.ar,
      ),
      en: this.resolveLocaleSlugValue(
        'en',
        existingBlog.slug?.en,
        payload.slug?.en,
        payload.title?.en,
        title.en,
      ),
    };
  }

  private resolveLocaleSlugValue(
    locale: Locale,
    currentSlug: string | undefined,
    providedSlug: string | undefined,
    incomingTitle: string | undefined,
    mergedTitle: string,
  ): string {
    if (providedSlug?.trim()) {
      return providedSlug.trim();
    }

    if (incomingTitle !== undefined) {
      return generateLocaleSlug(mergedTitle, locale);
    }

    return currentSlug || '';
  }

  private mergeLocalizedField(
    currentValue?: Partial<LocalizedText>,
    nextValue?: Partial<LocalizedText>,
  ): LocalizedText {
    return {
      ar: nextValue?.ar ?? currentValue?.ar ?? '',
      en: nextValue?.en ?? currentValue?.en ?? '',
    };
  }

  private mergeLocalizedStringArray(
    currentValue?: Partial<LocalizedTextListInput>,
    nextValue?: Partial<LocalizedTextListInput>,
  ): LocalizedTextList {
    return {
      ar: this.normalizeStringArray(nextValue?.ar ?? currentValue?.ar),
      en: this.normalizeStringArray(nextValue?.en ?? currentValue?.en),
    };
  }

  private normalizeStringArray(value?: string | string[]): string[] {
    if (Array.isArray(value)) {
      return value.map((item) => item.trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  private serializeBlog(
    blog: BlogDocument,
    prevBlog?: BlogDocument | null,
    nextBlog?: BlogDocument | null,
    userName?: string | null,
    references: BlogReferenceDocument[] = [],
  ): BlogResponse {
    const resolvedMetaTitle = this.resolveLocalizedFallback(
      blog.meta_title,
      blog.title,
    );
    const resolvedMetaDescription = this.resolveLocalizedFallback(
      blog.meta_description,
      blog.description,
    );
    const resolvedOgTitle = this.resolveLocalizedFallback(
      blog.og_title,
      resolvedMetaTitle,
    );
    const resolvedOgDescription = this.resolveLocalizedFallback(
      blog.og_description,
      resolvedMetaDescription,
    );
    const canonicalUrl =
      blog.canonical_url || this.buildCanonicalUrl(blog.slug.en);
    const blogImage = this.resolveMedia(blog.blog_image);
    const ogImage = this.resolveMedia(blog.og_image || blog.blog_image || null);

    return {
      ...blog.toObject(),
      user_name: userName ?? null,
      references,
      blog_image: blogImage,
      og_image: this.resolveMedia(blog.og_image),
      prev_blog: this.serializeSiblingBlog(prevBlog),
      next_blog: this.serializeSiblingBlog(nextBlog),
      seo: {
        meta_title: resolvedMetaTitle,
        meta_description: resolvedMetaDescription,
        meta_keywords: this.mergeLocalizedStringArray(blog.meta_keywords),
        canonical_url: canonicalUrl,
        og_image: ogImage,
        og_title: resolvedOgTitle,
        og_description: resolvedOgDescription,
      },
      json_ld: {
        ar: this.buildJsonLd(blog, 'ar', ogImage),
        en: this.buildJsonLd(blog, 'en', ogImage),
      },
    } as BlogResponse;
  }

  private resolveLocaleFilter(language?: unknown): Locale | null {
    if (language !== 'ar' && language !== 'en') {
      return null;
    }

    return language;
  }

  private async getReferencesByBlogId(blogIds: unknown[]) {
    const uniqueBlogIds = [
      ...new Set(
        blogIds.map((blogId) => this.getObjectIdString(blogId)).filter(Boolean),
      ),
    ] as string[];

    if (!uniqueBlogIds.length) {
      return new Map<string, BlogReferenceDocument[]>();
    }

    const references = await this.blogReferenceModel
      .find({
        blog_id: {
          $in: uniqueBlogIds.map((blogId) => new Types.ObjectId(blogId)),
        },
      })
      .sort({ createdAt: -1 });

    return references.reduce((referencesByBlogId, reference) => {
      const blogId = String(reference.blog_id);
      const blogReferences = referencesByBlogId.get(blogId) || [];

      blogReferences.push(reference);
      referencesByBlogId.set(blogId, blogReferences);

      return referencesByBlogId;
    }, new Map<string, BlogReferenceDocument[]>());
  }

  private async getUserNamesById(userIds: unknown[]) {
    const uniqueUserIds = [
      ...new Set(
        userIds.map((userId) => this.getObjectIdString(userId)).filter(Boolean),
      ),
    ] as string[];

    if (!uniqueUserIds.length) {
      return new Map<string, string>();
    }

    const users = await this.blogModel.db
      .collection('users')
      .find({
        _id: { $in: uniqueUserIds.map((userId) => new Types.ObjectId(userId)) },
      })
      .project({
        name: 1,
        full_name: 1,
        first_name: 1,
        last_name: 1,
        username: 1,
        email: 1,
      })
      .toArray();

    return new Map(
      users.map((user) => [String(user._id), this.resolveUserName(user)]),
    );
  }

  private getObjectIdString(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return Types.ObjectId.isValid(value) ? value : null;
    }

    if (value instanceof Types.ObjectId) {
      return String(value);
    }

    if (typeof value === 'object' && '_id' in value) {
      return this.getObjectIdString((value as { _id?: unknown })._id);
    }

    const stringValue = String(value);

    return Types.ObjectId.isValid(stringValue) ? stringValue : null;
  }

  private resolveUserName(user: Record<string, unknown>): string | null {
    const name = user.name;

    if (typeof name === 'string' && name.trim()) {
      return name.trim();
    }

    if (name && typeof name === 'object') {
      const localizedName = name as Record<string, unknown>;
      const englishName = localizedName.en;
      const arabicName = localizedName.ar;

      if (typeof englishName === 'string' && englishName.trim()) {
        return englishName.trim();
      }

      if (typeof arabicName === 'string' && arabicName.trim()) {
        return arabicName.trim();
      }
    }

    const fullName = user.full_name;

    if (typeof fullName === 'string' && fullName.trim()) {
      return fullName.trim();
    }

    const nameParts = [user.first_name, user.last_name]
      .filter(
        (part): part is string =>
          typeof part === 'string' && Boolean(part.trim()),
      )
      .map((part) => part.trim());

    if (nameParts.length) {
      return nameParts.join(' ');
    }

    const username = user.username;

    if (typeof username === 'string' && username.trim()) {
      return username.trim();
    }

    const email = user.email;

    return typeof email === 'string' && email.trim() ? email.trim() : null;
  }

  private resolveLocalizedFallback(
    preferred?: Partial<LocalizedText>,
    fallback?: Partial<LocalizedText>,
  ): LocalizedText {
    return {
      ar: preferred?.ar?.trim() || fallback?.ar?.trim() || '',
      en: preferred?.en?.trim() || fallback?.en?.trim() || '',
    };
  }

  private buildCanonicalUrl(slug: string): string {
    const websiteUrl =
      this.configService.get<string>('APP_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:3000';

    return `${websiteUrl.replace(/\/$/, '')}/blogs/${slug}`;
  }

  private buildJsonLd(blog: BlogDocument, locale: Locale, image: unknown) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      inLanguage: locale,
      mainEntityOfPage:
        blog.canonical_url || this.buildCanonicalUrl(blog.slug[locale]),
      url: blog.canonical_url || this.buildCanonicalUrl(blog.slug[locale]),
      headline: blog.title?.[locale] || '',
      description: this.resolveLocalizedFallback(
        blog.meta_description,
        blog.description,
      )[locale],
      image: this.extractImageUrl(image),
      author: {
        '@type': 'Organization',
        name:
          this.configService.get<string>('BLOG_AUTHOR_NAME') || 'TEDx Damascus',
      },
      datePublished: blog.publishedAt || blog.createdAt,
      dateModified: blog.updatedAt,
    };
  }

  private extractImageUrl(image: unknown): string | null {
    if (!image || typeof image !== 'object') {
      return null;
    }

    const possibleUrl = (image as Record<string, unknown>).url;

    if (typeof possibleUrl === 'string' && this.isAbsoluteUrl(possibleUrl)) {
      return possibleUrl;
    }

    const storagePath = this.extractMediaPath(image);

    if (!storagePath) {
      return typeof possibleUrl === 'string' ? possibleUrl : null;
    }

    return this.buildSupabaseMediaUrl(storagePath);
  }

  private async findSiblingBlogs(blog: BlogDocument) {
    if (blog.status !== 'published') {
      return [null, null] as const;
    }

    const publishedBlogs = await this.blogModel
      .find({ status: 'published' })
      .select('_id title publishedAt createdAt')
      .lean();

    const orderedBlogs = [...publishedBlogs].sort((left, right) => {
      const leftDate = new Date(left.publishedAt || left.createdAt).getTime();
      const rightDate = new Date(
        right.publishedAt || right.createdAt,
      ).getTime();

      if (leftDate !== rightDate) {
        return leftDate - rightDate;
      }

      return String(left._id).localeCompare(String(right._id));
    });

    const currentIndex = orderedBlogs.findIndex(
      (item) => String(item._id) === String(blog._id),
    );

    if (currentIndex === -1) {
      return [null, null] as const;
    }

    const [prevBlog, nextBlog] = await Promise.all([
      orderedBlogs[currentIndex - 1]
        ? this.blogModel.findById(orderedBlogs[currentIndex - 1]._id)
        : null,
      orderedBlogs[currentIndex + 1]
        ? this.blogModel.findById(orderedBlogs[currentIndex + 1]._id)
        : null,
    ]);

    return [prevBlog, nextBlog] as const;
  }

  private serializeSiblingBlog(blog?: BlogDocument | null) {
    if (!blog) {
      return null;
    }

    return {
      id: String(blog._id),
      title: this.mergeLocalizedField(blog.title),
    };
  }

  private resolveMedia(media: unknown) {
    if (!media || typeof media !== 'object') {
      return media;
    }

    const mediaObject = media as Record<string, unknown>;
    const absoluteUrl = this.extractImageUrl(media);

    return {
      ...mediaObject,
      url: absoluteUrl || mediaObject.url || null,
      absolute_url: absoluteUrl,
    };
  }

  private extractMediaPath(media: unknown): string | null {
    if (!media || typeof media !== 'object') {
      return null;
    }

    const mediaObject = media as Record<string, unknown>;
    const possiblePathKeys = ['path', 'file_path', 'storage_path', 'key'];

    for (const key of possiblePathKeys) {
      const value = mediaObject[key];

      if (typeof value === 'string' && value.trim()) {
        return value.replace(/^\/+/, '');
      }
    }

    if (
      typeof mediaObject.url === 'string' &&
      !this.isAbsoluteUrl(mediaObject.url)
    ) {
      return mediaObject.url.replace(/^\/+/, '');
    }

    return null;
  }

  private buildSupabaseMediaUrl(path: string): string {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') ||
      this.configService.get<string>('NEXT_PUBLIC_SUPABASE_URL');
    const bucket =
      this.configService.get<string>('SUPABASE_STORAGE_BUCKET') ||
      this.configService.get<string>('SUPABASE_BUCKET') ||
      this.configService.get<string>('SUPABASE_MEDIA_BUCKET');

    if (!supabaseUrl || !bucket) {
      return path;
    }

    return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${bucket}/${path}`;
  }

  private isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
  }

  private handleDuplicateSlugError(error: unknown): never {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      throw new ConflictException(
        'Slug must be unique for both Arabic and English locales',
      );
    }

    throw error;
  }
}
