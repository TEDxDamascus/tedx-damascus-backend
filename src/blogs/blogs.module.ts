import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { PublicBlogsController } from './public-blogs.controller';
import { Blog, BlogSchema } from './entities/blog.entity';
import {
  BlogPermission,
  BlogPermissionSchema,
} from './entities/blog-permission.entity';
import {
  Category,
  CategorySchema,
} from '../categories/entities/category.entity';
import {
  BlogReference,
  BlogReferenceSchema,
} from '../blog-references/entities/blog-reference.entity';
import { Media, MediaSchema } from '../storage/entities/media.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: BlogPermission.name, schema: BlogPermissionSchema },
      { name: Category.name, schema: CategorySchema },
      { name: BlogReference.name, schema: BlogReferenceSchema },
      { name: Media.name, schema: MediaSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BlogsController, PublicBlogsController],
  providers: [BlogsService],
})
export class BlogsModule {}
