import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ADMIN_DEFAULT_PERMISSIONS,
  User,
  UserDocument,
  UserPermission,
  UserRole,
} from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userModel
      .findOne({ email: createUserDto.email.toLowerCase() })
      .lean();

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const role = createUserDto.role ?? UserRole.USER;
    const permissions = this.resolvePermissions(role, createUserDto.permissions);

    const createdUser = await this.userModel.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
      role,
      permissions,
    });

    return {
      message: 'User created successfully',
      data: this.toPublicUser(createdUser.toObject() as unknown as Record<string, unknown>),
    };
  }

  async findAll() {
    const users = await this.userModel
      .find()
      .select('name email role permissions is_active createdAt updatedAt')
      .lean();

    return {
      message: 'Users fetched successfully',
      data: users.map((user) =>
        this.toPublicUser(user as unknown as Record<string, unknown>),
      ),
    };
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('name email role permissions is_active createdAt updatedAt')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User fetched successfully',
      data: this.toPublicUser(user as unknown as Record<string, unknown>),
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const payload: UpdateUserDto = { ...updateUserDto };
    let currentRole: UserRole | undefined;

    if (payload.role || payload.permissions) {
      const existingUser = await this.userModel.findById(id).select('role').lean();
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }
      currentRole = existingUser.role as UserRole;
    }

    if (payload.email) {
      payload.email = payload.email.toLowerCase();
      const emailOwner = await this.userModel
        .findOne({ email: payload.email })
        .select('_id')
        .lean();

      if (emailOwner && String(emailOwner._id) !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    if (payload.role || payload.permissions) {
      const targetRole = payload.role ?? currentRole ?? UserRole.USER;
      payload.permissions = this.resolvePermissions(targetRole, payload.permissions);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      .select('name email role permissions is_active createdAt updatedAt')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User updated successfully',
      data: this.toPublicUser(user as unknown as Record<string, unknown>),
    };
  }

  async remove(id: string) {
    const user = await this.userModel
      .findByIdAndDelete(id)
      .select('name email role permissions is_active createdAt updatedAt')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User deleted successfully',
      data: this.toPublicUser(user as unknown as Record<string, unknown>),
    };
  }

  private toPublicUser(user: Record<string, unknown>) {
    const { _id, __v, password, refresh_token, ...rest } = user;
    void __v;
    void password;
    void refresh_token;
    const id =
      _id instanceof Types.ObjectId ? _id.toHexString() : String(_id ?? '');
    return { id, ...rest };
  }

  private resolvePermissions(
    role: UserRole,
    requestedPermissions?: UserPermission[],
  ): UserPermission[] {
    if (role === UserRole.SUPERADMIN) {
      return [...ADMIN_DEFAULT_PERMISSIONS];
    }

    if (role === UserRole.ADMIN) {
      if (requestedPermissions && requestedPermissions.length > 0) {
        return [...new Set(requestedPermissions)];
      }
      return [...ADMIN_DEFAULT_PERMISSIONS];
    }

    return [];
  }
}

