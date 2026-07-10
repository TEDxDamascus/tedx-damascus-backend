import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { BlogsService } from './blogs.service';
import { Blog } from './entities/blog.entity';
import { BlogPermission } from './entities/blog-permission.entity';
import { Category } from '../categories/entities/category.entity';
import { BlogReference } from '../blog-references/entities/blog-reference.entity';
import { Media } from '../storage/entities/media.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { BlogAuthorType } from './enums/blog-author-type.enum';

describe('BlogsService', () => {
  let service: BlogsService;
  let blogModel: {
    exists: jest.Mock;
    findById: jest.Mock;
    prototype: { save: jest.Mock };
  };
  let userModel: { findById: jest.Mock };
  let mediaModel: { exists: jest.Mock };
  let usersService: { findAuthorCandidates: jest.Mock };

  const adminUserId = new Types.ObjectId().toHexString();
  const mediaId = new Types.ObjectId().toHexString();

  beforeEach(async () => {
    blogModel = {
      exists: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      prototype: { save: jest.fn() },
    };

    userModel = {
      findById: jest.fn(),
    };

    mediaModel = {
      exists: jest.fn().mockResolvedValue({ _id: mediaId }),
    };

    usersService = {
      findAuthorCandidates: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogsService,
        {
          provide: getModelToken(Blog.name),
          useValue: blogModel,
        },
        {
          provide: getModelToken(BlogPermission.name),
          useValue: {},
        },
        {
          provide: getModelToken(Category.name),
          useValue: {
            exists: jest.fn().mockResolvedValue(null),
          },
        },
        {
          provide: getModelToken(BlogReference.name),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: getModelToken(Media.name),
          useValue: mediaModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BlogsService>(BlogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects publishing a blog without author fields', async () => {
    await expect(
      service.create({
        title: { ar: 'عنوان', en: 'Title' },
        content: { ar: 'محتوى', en: 'Content' },
        status: 'published',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects both author_image and author_image_url', async () => {
    await expect(
      service.create({
        title: { ar: 'عنوان', en: 'Title' },
        content: { ar: 'محتوى', en: 'Content' },
        author_type: BlogAuthorType.EXTERNAL,
        author_description: { ar: 'وصف', en: 'Description' },
        author_image: mediaId,
        author_image_url: 'https://example.com/author.jpg',
      }),
    ).rejects.toThrow('Provide author_image or author_image_url, not both');
  });

  it('allows draft blogs without author fields', async () => {
    const savedBlog = {
      id: new Types.ObjectId().toHexString(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const BlogModelMock = jest
      .fn()
      .mockImplementation((payload: Record<string, unknown>) => ({
        ...payload,
        ...savedBlog,
      }));

    (service as unknown as { blogModel: typeof blogModel }).blogModel =
      Object.assign(BlogModelMock, blogModel);

    jest.spyOn(service, 'findOne').mockResolvedValue({ id: savedBlog.id } as never);

    const result = await service.create({
      title: { ar: 'عنوان', en: 'Title' },
      content: { ar: 'محتوى', en: 'Content' },
      status: 'draft',
    });

    expect(result).toEqual({ id: savedBlog.id });
  });

  it('snapshots admin author fields when creating a published blog', async () => {
    const savedPayload: Record<string, unknown> = {};

    userModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            name: 'Moeyn',
            description: { ar: 'وصف', en: 'Bio' },
            profile_image: new Types.ObjectId(mediaId),
            role: UserRole.ADMIN,
            is_active: true,
          }),
        }),
      }),
    });

    const BlogModelMock = jest
      .fn()
      .mockImplementation((payload: Record<string, unknown>) => {
        Object.assign(savedPayload, payload);

        return {
          ...payload,
          id: new Types.ObjectId().toHexString(),
          save: jest.fn().mockResolvedValue(undefined),
        };
      });

    (service as unknown as { blogModel: typeof blogModel }).blogModel =
      Object.assign(BlogModelMock, blogModel);

    jest.spyOn(service, 'findOne').mockResolvedValue({} as never);

    await service.create({
      title: { ar: 'عنوان', en: 'Title' },
      content: { ar: 'محتوى', en: 'Content' },
      status: 'published',
      author_type: BlogAuthorType.ADMIN,
      author_user_id: adminUserId,
    });

    expect(savedPayload.author_type).toBe(BlogAuthorType.ADMIN);
    expect(savedPayload.author_name).toEqual({ en: 'Moeyn' });
    expect(savedPayload.author_description).toEqual({
      ar: 'وصف',
      en: 'Bio',
    });
    expect(String(savedPayload.author_user_id)).toBe(adminUserId);
    expect(savedPayload.author_image_url).toBeUndefined();
  });

  it('stores external author with image URL', async () => {
    const savedPayload: Record<string, unknown> = {};

    const BlogModelMock = jest
      .fn()
      .mockImplementation((payload: Record<string, unknown>) => {
        Object.assign(savedPayload, payload);

        return {
          ...payload,
          id: new Types.ObjectId().toHexString(),
          save: jest.fn().mockResolvedValue(undefined),
        };
      });

    (service as unknown as { blogModel: typeof blogModel }).blogModel =
      Object.assign(BlogModelMock, blogModel);

    jest.spyOn(service, 'findOne').mockResolvedValue({} as never);

    await service.create({
      title: { ar: 'عنوان', en: 'Title' },
      content: { ar: 'محتوى', en: 'Content' },
      status: 'published',
      author_type: BlogAuthorType.EXTERNAL,
      author_name: { en: 'Sarah Guest' },
      author_description: { ar: 'وصف', en: 'Writer' },
      author_image_url: 'https://example.com/sarah.jpg',
    });

    expect(savedPayload.author_type).toBe(BlogAuthorType.EXTERNAL);
    expect(savedPayload.author_name).toEqual({ en: 'Sarah Guest' });
    expect(savedPayload.author_image_url).toBe('https://example.com/sarah.jpg');
    expect(savedPayload.author_image).toBeUndefined();
    expect(savedPayload.author_user_id).toBeUndefined();
  });

  it('returns author options from users service', async () => {
    usersService.findAuthorCandidates.mockResolvedValue([
      {
        id: adminUserId,
        name: 'Moeyn',
        description: { ar: '', en: 'Bio' },
        image: { url: '/media/avatar.png' },
      },
    ]);

    const result = await service.getAuthorOptions();

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(adminUserId);
  });
});
