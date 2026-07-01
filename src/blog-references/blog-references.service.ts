import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BlogReference,
  BlogReferenceDocument,
} from './entities/blog-reference.entity';
import { CreateBlogReferenceDto } from './dto/create-blog-reference.dto';
import { UpdateBlogReferenceDto } from './dto/update-blog-reference.dto';
import { Blog, BlogDocument } from '../blogs/entities/blog.entity';

@Injectable()
export class BlogReferencesService {
  constructor(
    @InjectModel(BlogReference.name)
    private readonly blogReferenceModel: Model<BlogReferenceDocument>,
    @InjectModel(Blog.name)
    private readonly blogModel: Model<BlogDocument>,
  ) {}

  async create(createBlogReferenceDto: CreateBlogReferenceDto) {
    await this.assertBlogExists(createBlogReferenceDto.blog_id);

    const reference = await this.blogReferenceModel.create(
      createBlogReferenceDto,
    );

    return this.findOne(reference.id);
  }

  async findAll(query: { blog_id?: string } = {}) {
    const filter = query.blog_id ? { blog_id: query.blog_id } : {};

    return this.blogReferenceModel.find(filter).sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const reference = await this.blogReferenceModel.findById(id);

    if (!reference) {
      throw new NotFoundException('Blog reference not found');
    }

    return reference;
  }

  async update(id: string, updateBlogReferenceDto: UpdateBlogReferenceDto) {
    if (updateBlogReferenceDto.blog_id) {
      await this.assertBlogExists(updateBlogReferenceDto.blog_id);
    }

    const reference = await this.blogReferenceModel.findByIdAndUpdate(
      id,
      updateBlogReferenceDto,
      { new: true, runValidators: true },
    );

    if (!reference) {
      throw new NotFoundException('Blog reference not found');
    }

    return reference;
  }

  async remove(id: string) {
    const reference = await this.blogReferenceModel.findByIdAndDelete(id);

    if (!reference) {
      throw new NotFoundException('Blog reference not found');
    }

    return { message: 'Blog reference deleted successfully' };
  }

  private async assertBlogExists(blogId: string) {
    const blogExists = await this.blogModel.exists({ _id: blogId });

    if (!blogExists) {
      throw new NotFoundException('Blog not found');
    }
  }
}
