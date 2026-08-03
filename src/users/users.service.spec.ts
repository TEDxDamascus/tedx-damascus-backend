import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import {
  User,
  UserDocument,
  UserPermission,
  UserRole,
} from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let userModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    countDocuments: jest.Mock;
  };

  beforeEach(async () => {
    userModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: userModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('returns only minimal admin user fields', async () => {
    const admin = {
      _id: 'admin-id',
      name: 'Admin User',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      is_active: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      password: 'hashed-password',
      refresh_token: 'refresh-token',
      permissions: ['blogs:read'],
    };
    const query = createFindQuery([admin]);
    userModel.find.mockReturnValue(query);
    userModel.countDocuments.mockResolvedValue(1);

    const result = await service.findAdmins({ page: 1, limit: 10 });

    expect(userModel.find).toHaveBeenCalledWith({ role: UserRole.ADMIN });
    expect(query.select).toHaveBeenCalledWith(
      'name email role is_active description profile_image createdAt',
    );
    expect(result.data).toEqual([
      {
        id: 'admin-id',
        name: 'Admin User',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: admin.createdAt,
      },
    ]);
    expect(result.data[0]).not.toHaveProperty('password');
    expect(result.data[0]).not.toHaveProperty('refresh_token');
    expect(result.data[0]).not.toHaveProperty('permissions');
  });

  it('filters admins by escaped name or email search', async () => {
    const query = createFindQuery([]);
    userModel.find.mockReturnValue(query);
    userModel.countDocuments.mockResolvedValue(0);

    await service.findAdmins({ search: 'admin+test@example.com' });

    const expectedFilter = {
      role: UserRole.ADMIN,
      $or: [
        { name: { $regex: 'admin\\+test@example\\.com', $options: 'i' } },
        { email: { $regex: 'admin\\+test@example\\.com', $options: 'i' } },
      ],
    };
    expect(userModel.find).toHaveBeenCalledWith(expectedFilter);
    expect(userModel.countDocuments).toHaveBeenCalledWith(expectedFilter);
  });

  it('returns an admin by id with their permissions', async () => {
    const admin = {
      _id: 'admin-id',
      name: 'Admin User',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      permissions: [UserPermission.BLOGS_READ],
      is_active: true,
    };
    const query = createFindOneQuery(admin);
    userModel.findOne.mockReturnValue(query);

    const result = await service.findAdminById('admin-id');

    expect(userModel.findOne).toHaveBeenCalledWith({
      _id: 'admin-id',
      role: UserRole.ADMIN,
    });
    expect(query.select).toHaveBeenCalledWith(
      'name email role permissions is_active createdAt updatedAt',
    );
    expect(result.data).toEqual({
      id: 'admin-id',
      name: 'Admin User',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      permissions: [UserPermission.BLOGS_READ],
      is_active: true,
    });
  });

  it('returns all available permissions', () => {
    expect(service.findAllPermissions().data).toEqual(
      Object.values(UserPermission),
    );
  });
});

function createFindQuery(users: Partial<UserDocument>[]) {
  const query = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(users),
  };

  return query;
}

function createFindOneQuery(user: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(user),
  };
}
