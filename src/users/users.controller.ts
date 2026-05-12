import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateCurrentUserDto } from './dto/update-current-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
