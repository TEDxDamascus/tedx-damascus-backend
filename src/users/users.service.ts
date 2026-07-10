import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { UpdateCurrentUserDto } from './dto/update-current-user.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import {
  ADMIN_DEFAULT_PERMISSIONS,
  SUPERADMIN_DEFAULT_PERMISSIONS,
  User,
  UserDocument,
  UserPermission,
  UserRole,
} from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { OffsetPaginationDto } from '../common/pagination/dto/offset-pagination.dto';

@Injectable()
export class UsersService {
  private readonly publicUserSelection =
    'name email role permissions is_active description profile_image createdAt updatedAt';
  private readonly adminUserSelection =
    'name email role is_active description profile_image createdAt';

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    actor?: { id: string; role: string },
  ) {
    this.assertCanCreateUser(actor, createUserDto);

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

  async findAll(pagination: OffsetPaginationDto) {
    const page = pagination.page ?? 1;
    const limit = Math.min(pagination.limit ?? 10, 100);
    const filter = { role: UserRole.USER };

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(this.publicUserSelection)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      statusCode: 200,
      message: 'Users fetched successfully',
      data: users.map((user) =>
        this.toPublicUser(user as unknown as Record<string, unknown>),
      ),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findAdmins(query: AdminUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);
    const filter: Record<string, unknown> = { role: UserRole.ADMIN };
    const search = query.search?.trim();

    if (search) {
      const escapedSearch = this.escapeRegex(search);
      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const [admins, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select(this.adminUserSelection)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      statusCode: 200,
      message: 'Admin users fetched successfully',
      data: admins.map((admin) =>
        this.toAdminUser(admin as unknown as Record<string, unknown>),
      ),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findAuthorCandidates() {
    const users = await this.userModel
      .find({
        role: { $in: [UserRole.ADMIN, UserRole.SUPERADMIN] },
        is_active: true,
      })
      .select('name description profile_image')
      .populate('profile_image')
      .sort({ name: 1 })
      .lean();

    return users.map((user) => {
      const record = user as unknown as Record<string, unknown>;
      const id =
        record._id instanceof Types.ObjectId
          ? record._id.toHexString()
          : String(record._id ?? '');

      return {
        id,
        name: record.name ?? null,
        description: record.description ?? { ar: '', en: '' },
        image: record.profile_image ?? null,
      };
    });
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
    const targetUser = await this.findUserRoleByIdOrFail(id);

    this.assertCanUpdateUser(actor, targetUser.role, payload);

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
    actor?: { id: string; role: string },
  ) {
    const user = await this.userModel.findById(id).select('role').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = user.role;
    if (actor?.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Only superadmin can change permissions');
    }

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

    const permissions = [
      ...new Set(updateUserPermissionsDto.permissions ?? []),
    ];

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

  async remove(id: string, actor?: { id: string; role: string }) {
    const targetUser = await this.findUserRoleByIdOrFail(id);
    if (
      [UserRole.ADMIN, UserRole.SUPERADMIN].includes(targetUser.role) &&
      actor?.role !== UserRole.SUPERADMIN
    ) {
      throw new ForbiddenException(
        'Only superadmin can delete admin and superadmin accounts',
      );
    }

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
    if (actor?.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Only superadmin can change active status');
    }

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
      _id instanceof Types.ObjectId ? _id.toHexString() : String(_id ?? '');
    return { id, ...rest };
  }

  private toAdminUser(user: Record<string, unknown>) {
    const { _id, name, email, role, is_active, createdAt } = user;
    const id =
      _id instanceof Types.ObjectId ? _id.toHexString() : String(_id ?? '');

    return {
      id,
      name,
      email,
      role,
      isActive: is_active,
      createdAt,
    };
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private resolvePermissions(
    role: UserRole,
    requestedPermissions?: UserPermission[],
  ): UserPermission[] {
    if (role === UserRole.SUPERADMIN) {
      return [...SUPERADMIN_DEFAULT_PERMISSIONS];
    }

    if (role === UserRole.ADMIN) {
      if (requestedPermissions && requestedPermissions.length > 0) {
        return [...new Set(requestedPermissions)];
      }
      return [...ADMIN_DEFAULT_PERMISSIONS];
    }

    return [];
  }

  private isSuperadminSelfAction(
    actor: { id: string; role: string } | undefined,
    targetUserId: string,
  ): boolean {
    return actor?.role === UserRole.SUPERADMIN && actor.id === targetUserId;
  }

  private assertCanUpdateUser(
    actor: { id: string; role: string } | undefined,
    targetRole: UserRole,
    payload: UpdateUserDto,
  ) {
    if (actor?.role === UserRole.SUPERADMIN) {
      return;
    }

    if ([UserRole.ADMIN, UserRole.SUPERADMIN].includes(targetRole)) {
      throw new ForbiddenException(
        'Only superadmin can modify admin and superadmin accounts',
      );
    }

    if (
      payload.role !== undefined ||
      payload.permissions !== undefined ||
      payload.is_active !== undefined
    ) {
      throw new ForbiddenException(
        'Only superadmin can change role, permissions, or active status',
      );
    }
  }

  private assertCanCreateUser(
    actor: { id: string; role: string } | undefined,
    payload: CreateUserDto,
  ) {
    if (actor?.role === UserRole.SUPERADMIN) {
      return;
    }

    if (
      [UserRole.ADMIN, UserRole.SUPERADMIN].includes(payload.role as UserRole)
    ) {
      throw new ForbiddenException(
        'Only superadmin can create admin and superadmin accounts',
      );
    }

    if (payload.role !== undefined) {
      throw new ForbiddenException('Only superadmin can set user roles');
    }

    if (payload.permissions !== undefined) {
      throw new ForbiddenException('Only superadmin can set permissions');
    }

    if (payload.is_active !== undefined) {
      throw new ForbiddenException('Only superadmin can set active status');
    }
  }

  private async findUserRoleByIdOrFail(id: string) {
    const user = await this.userModel.findById(id).select('role').lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async findPublicUserByIdOrFail(id: string) {
    const user = await this.userModel
      .findById(id)
      .select(this.publicUserSelection)
      .populate('profile_image')
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
