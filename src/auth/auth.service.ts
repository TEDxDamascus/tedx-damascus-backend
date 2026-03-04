import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { Model } from 'mongoose';
import {
  User,
  UserDocument,
  UserPermission,
  UserRole,
} from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.toLowerCase();

    const existingUser = await this.userModel.findOne({ email }).lean();
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      role: UserRole.USER,
      is_active: true,
    });

    const tokens = await this.generateTokens({
      sub: String(user._id),
      email: user.email,
      role: user.role,
      permissions: user.permissions ?? [],
    });

    if (user.role !== UserRole.SUPERADMIN) {
      await this.persistRefreshToken(String(user._id), tokens.refreshToken);
    }

    return {
      message: 'User registered successfully',
      data: {
        access_token: tokens.accessToken,
        ...(user.role !== UserRole.SUPERADMIN
          ? { refresh_token: tokens.refreshToken }
          : {}),
        user: {
          id: String(user._id),
          email: user.email,
          role: user.role,
          permissions: user.permissions ?? [],
          is_active: user.is_active,
        },
      },
    };
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.toLowerCase();

    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .lean();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens({
      sub: String(user._id),
      email: user.email,
      role: user.role,
      permissions: user.permissions ?? [],
    });

    if (user.role !== UserRole.SUPERADMIN) {
      await this.persistRefreshToken(String(user._id), tokens.refreshToken);
    }

    return {
      message: 'Login successful',
      data: {
        access_token: tokens.accessToken,
        ...(user.role !== UserRole.SUPERADMIN
          ? { refresh_token: tokens.refreshToken }
          : {}),
        user: {
          id: String(user._id),
          email: user.email,
          role: user.role,
          permissions: user.permissions ?? [],
          is_active: user.is_active,
        },
      },
    };
  }

  private async generateTokens(payload: {
    sub: string;
    email: string;
    role: string;
    permissions?: UserPermission[];
  }) {
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      this.configService.get<string>('JWT_SECRET') ??
      'dev-secret';
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d';

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as StringValue,
    });

    return { accessToken, refreshToken };
  }

  private async persistRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(userId, {
      refresh_token: hashedRefreshToken,
    });
  }
}
