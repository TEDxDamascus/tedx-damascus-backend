import { IsOptional, IsString } from 'class-validator';
import { OffsetPaginationDto } from '../../common/pagination/dto/offset-pagination.dto';

export class AdminUsersQueryDto extends OffsetPaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
