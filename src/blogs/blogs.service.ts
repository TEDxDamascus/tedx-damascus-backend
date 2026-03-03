import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blog, BlogDocument } from './entities/blog.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name)
    private blogModel: Model<BlogDocument>,
  ) {}

  async create(createBlogDto: CreateBlogDto) {
    const blog = new this.blogModel(createBlogDto);
    return blog.save();
  }

  async findAll(query: any) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      category,
      sort = 'createdAt',
      order = 'desc',
    } = query;

    const filter: any = {};

    if (status) filter.status = status;
    if (category) filter.category = category;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const blogs = await this.blogModel
      .find(filter)
      .populate('og_image')
      .populate('gallery') // ✅ populate gallery images
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await this.blogModel.countDocuments(filter);

    return {
      data: blogs,
      total,
      page: Number(page),
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const blog = await this.blogModel
      .findById(id)
      .populate('og_image')
      .populate('gallery');

    if (!blog) throw new NotFoundException('Blog not found');

    return blog;
  }

  async update(id: string, updateBlogDto: UpdateBlogDto) {
    const blog = await this.blogModel.findByIdAndUpdate(
      id,
      updateBlogDto,
      { new: true },
    );

    if (!blog) throw new NotFoundException('Blog not found');

    return blog;
  }

  async remove(id: string) {
    const blog = await this.blogModel.findByIdAndDelete(id);

    if (!blog) throw new NotFoundException('Blog not found');

    return { message: 'Blog deleted successfully' };
  }
}