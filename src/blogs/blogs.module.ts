import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { Blog, BlogSchema } from './entities/blog.entity';
import {
  Category,
  CategorySchema,
} from '../categories/entities/category.entity';
import {
  BlogReference,
  BlogReferenceSchema,
} from '../blog-references/entities/blog-reference.entity';
import { Media, MediaSchema } from '../storage/entities/media.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Category.name, schema: CategorySchema },
      { name: BlogReference.name, schema: BlogReferenceSchema },
      { name: Media.name, schema: MediaSchema },
    ]),
  ],
  controllers: [BlogsController],
  providers: [BlogsService],
})
export class BlogsModule {}
