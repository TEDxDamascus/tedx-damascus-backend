import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { UpdateCurrentUserDto } from './dto/update-current-user.dto';
import { UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('admins')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  findAdmins(@Query() query: AdminUsersQueryDto) {
    return this.usersService.findAdmins(query);
  }

  @Get('me')
  me(@Req() req: { user: { id: string } }) {
    return this.usersService.findCurrentUser(req.user.id);
  }

  @Patch('me')
  updateMe(
    @Req() req: { user: { id: string } },
    @Body() updateCurrentUserDto: UpdateCurrentUserDto,
  ) {
    return this.usersService.updateCurrentUser(
      req.user.id,
      updateCurrentUserDto,
    );
  }
}
