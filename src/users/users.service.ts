import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const createdUser = await this.userModel.create(createUserDto);
    return {
      message: 'User created successfully',
      data: this.toPublicUser(
        this.omitPassword(
        createdUser.toObject() as unknown as {
          password?: string;
        } & Record<string, unknown>,
        ),
      ),
    };
  }

  async findAll() {
    const users = await this.userModel
      .find()
      .select('email role createdAt updatedAt')
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
      .select('email role createdAt updatedAt')
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
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true, runValidators: true })
      .select('email role createdAt updatedAt')
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
      .select('email role createdAt updatedAt')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: 'User deleted successfully',
      data: this.toPublicUser(user as unknown as Record<string, unknown>),
    };
  }

  private omitPassword(user: { password?: string } & Record<string, unknown>) {
    const { password, ...safeUser } = user;
    void password;
    return safeUser;
  }

  private toPublicUser(user: Record<string, unknown>) {
    const { _id, __v, ...rest } = user;
    void __v;
    const id =
      _id instanceof Types.ObjectId ? _id.toHexString() : String(_id ?? '');
    return { id, ...rest };
  }
}
