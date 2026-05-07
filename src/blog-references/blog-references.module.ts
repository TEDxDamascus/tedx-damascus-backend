import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogReferencesController } from './blog-references.controller';
import { BlogReferencesService } from './blog-references.service';
import {
  BlogReference,
  BlogReferenceSchema,
} from './entities/blog-reference.entity';
import { Blog, BlogSchema } from '../blogs/entities/blog.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlogReference.name, schema: BlogReferenceSchema },
      { name: Blog.name, schema: BlogSchema },
    ]),
  ],
  controllers: [BlogReferencesController],
  providers: [BlogReferencesService],
})
export class BlogReferencesModule {}
