import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';
import { SendBulkEmailResultDto } from './dto/send-bulk-email-result.dto';
import { EmailsService } from './emails.service';

@ApiTags('emails')
@Controller('emails')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post('send-bulk')
  @UseInterceptors(FileInterceptor('imageUrl'))
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiOkResponse({
    description: 'Send a plain-text message to a list of email addresses',
    type: SendBulkEmailResultDto,
  })
  sendBulk(
    @Body() dto: SendBulkEmailDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<SendBulkEmailResultDto> {
    return this.emailsService.sendBulk(dto, image);
  }
}
