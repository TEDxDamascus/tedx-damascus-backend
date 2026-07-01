import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { BlogsService } from './blogs.service';
import { Blog } from './entities/blog.entity';
import { Category } from '../categories/entities/category.entity';
import { BlogReference } from '../blog-references/entities/blog-reference.entity';

describe('BlogsService', () => {
  let service: BlogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlogsService,
        {
          provide: getModelToken(Blog.name),
          useValue: {},
        },
        {
          provide: getModelToken(Category.name),
          useValue: {},
        },
        {
          provide: getModelToken(BlogReference.name),
          useValue: {},
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
});
