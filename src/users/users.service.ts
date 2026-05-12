import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateCurrentUserDto } from './dto/update-current-user.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
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
  private readonly publicUserSelection =
    'name email role permissions is_active createdAt updatedAt';

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
    const permissions = this.resolvePermissions(
      role,
      createUserDto.permissions,
    );

    const createdUser = await this.userModel.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
      role,
      permissions,
    });

    return {
      message: 'User created successfully',
      data: this.toPublicUser(
        createdUser.toObject() as unknown as Record<string, unknown>,
      ),
    };
  }

  async findAll() {
    const users = await this.userModel
      .find()
      .select(this.publicUserSelection)
      .lean();

    return {
      message: 'Users fetched successfully',
      data: users.map((user) =>
        this.toPublicUser(user as unknown as Record<string, unknown>),
      ),
    };
  }

  async findOne(id: string) {
    return {
      message: 'User fetched successfully',
      data: await this.findPublicUserByIdOrFail(id),
    };
  }

  async findCurrentUser(id: string) {
    return {
      message: 'Current user fetched successfully',
      data: await this.findPublicUserByIdOrFail(id),
    };
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    actor?: { id: string; role: string },
  ) {
    const payload: UpdateUserDto = { ...updateUserDto };
    const isSuperadminSelfAction = this.isSuperadminSelfAction(actor, id);

    if (isSuperadminSelfAction && payload.role !== undefined) {
      throw new BadRequestException('Superadmin cannot change their own role');
    }

    if (isSuperadminSelfAction && payload.is_active === false) {
      throw new BadRequestException('Superadmin cannot disable themselves');
    }

    await this.prepareMutableCredentials(payload, id);

    if (payload.role) {
      const normalizedRole = payload.role;
      const nextPermissions = this.resolvePermissions(normalizedRole);
      const user = await this.userModel
        .findByIdAndUpdate(
          id,
          { ...payload, permissions: nextPermissions },
          { new: true, runValidators: true },
        )
        .select(this.publicUserSelection)
        .lean();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        message: 'User updated successfully',
        data: this.toPublicUser(user as unknown as Record<string, unknown>),
      };
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      .select(this.publicUserSelection)
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User updated successfully',
      data: this.toPublicUser(user as unknown as Record<string, unknown>),
    };
  }

  async updateCurrentUser(
    id: string,
    updateCurrentUserDto: UpdateCurrentUserDto,
  ) {
    const payload: UpdateCurrentUserDto = { ...updateCurrentUserDto };

    await this.prepareMutableCredentials(payload, id);

    const user = await this.userModel
      .findByIdAndUpdate(id, payload, { new: true, runValidators: true })
      .select(this.publicUserSelection)
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'Current user updated successfully',
      data: this.toPublicUser(user as unknown as Record<string, unknown>),
    };
  }

  async updatePermissions(
    id: string,
    updateUserPermissionsDto: UpdateUserPermissionsDto,
  ) {
    const user = await this.userModel.findById(id).select('role').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = user.role;
    if (role === UserRole.USER) {
      throw new BadRequestException(
        'Regular users do not support custom permissions',
      );
    }

    if (role === UserRole.SUPERADMIN) {
      throw new BadRequestException(
        'Superadmin permissions are fixed and cannot be edited',
      );
    }

    const permissions = this.permissionsFromModules(updateUserPermissionsDto);

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        { permissions },
        { new: true, runValidators: true },
      )
      .select(this.publicUserSelection)
      .lean();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User permissions updated successfully',
      data: this.toPublicUser(
        updatedUser as unknown as Record<string, unknown>,
      ),
    };
  }

  async remove(id: string) {
    const user = await this.userModel
      .findByIdAndDelete(id)
      .select(this.publicUserSelection)
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User deleted successfully',
      data: this.toPublicUser(user as unknown as Record<string, unknown>),
    };
  }

  async setActive(
    id: string,
    isActive: boolean,
    actor?: { id: string; role: string },
  ) {
    if (!isActive && this.isSuperadminSelfAction(actor, id)) {
      throw new BadRequestException('Superadmin cannot disable themselves');
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        { is_active: isActive },
        { new: true, runValidators: true },
      )
      .select(this.publicUserSelection)
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: isActive
        ? 'User enabled successfully'
        : 'User disabled successfully',
      data: this.toPublicUser(user as unknown as Record<string, unknown>),
    };
  }

  private toPublicUser(user: Record<string, unknown>) {
    const { _id, __v, password, refresh_token, ...rest } = user;
    void __v;
    void password;
    void refresh_token;
    const id =
      _id instanceof Types.ObjectId
        ? _id.toHexString()
        : typeof _id === 'string'
          ? _id
          : '';
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

  private permissionsFromModules(
    payload: UpdateUserPermissionsDto,
  ): UserPermission[] {
    const users = payload.users ?? {};
    const permissions: UserPermission[] = [];

    if (users.create) {
      permissions.push(UserPermission.USERS_CREATE);
    }
    if (users.read) {
      permissions.push(UserPermission.USERS_READ);
    }
    if (users.update) {
      permissions.push(UserPermission.USERS_UPDATE);
    }
    if (users.delete) {
      permissions.push(UserPermission.USERS_DELETE);
    }

    return permissions;
  }

  private isSuperadminSelfAction(
    actor: { id: string; role: string } | undefined,
    targetUserId: string,
  ): boolean {
    return actor?.role === UserRole.SUPERADMIN && actor.id === targetUserId;
  }

  private async findPublicUserByIdOrFail(id: string) {
    const user = await this.userModel
      .findById(id)
      .select(this.publicUserSelection)
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(user as unknown as Record<string, unknown>);
  }

  private async prepareMutableCredentials<
    T extends { email?: string; password?: string },
  >(payload: T, targetUserId: string) {
    if (payload.email) {
      payload.email = payload.email.toLowerCase();
      const emailOwner = await this.userModel
        .findOne({ email: payload.email })
        .select('_id')
        .lean();

      if (emailOwner && String(emailOwner._id) !== targetUserId) {
        throw new ConflictException('Email already in use');
      }
    }

    if (payload.password) {
      payload.password = (await bcrypt.hash(
        payload.password,
        10,
      )) as T['password'];
    }
  }
}
