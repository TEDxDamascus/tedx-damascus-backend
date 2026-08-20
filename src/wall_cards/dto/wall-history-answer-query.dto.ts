import { OffsetPaginationDto } from '../../common/pagination/dto/offset-pagination.dto';

/** Public history answers: pagination only (approved answers are always returned). */
export class WallHistoryAnswerQueryDto extends OffsetPaginationDto {}
