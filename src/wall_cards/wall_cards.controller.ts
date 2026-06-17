import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { OffsetPaginationDto } from '../common/pagination/dto/offset-pagination.dto';
import { UserPermission, UserRole } from '../users/entities/user.entity';
import { resolveWallCardsAdminUserId } from './constants/wall-cards-dev-admin.constant';
import { BlockedWordResponseDto } from './dto/blocked-word-response.dto';
import { CreateBlockedWordDto } from './dto/create-blocked-word.dto';
import { CreateWallAnswerDto } from './dto/create-wall-answer.dto';
import { ModerateWallAnswerDto } from './dto/moderate-wall-answer.dto';
import { PublishWallQuestionDto } from './dto/publish-wall-question.dto';
import { SetFeaturedAnswersDto } from './dto/set-featured-answers.dto';
import { WallAnswerQueryDto } from './dto/wall-answer-query.dto';
import { WallQuestionQueryDto } from './dto/wall-question-query.dto';
import { WallAnswerResponseDto } from './dto/wall-answer-response.dto';
import {
  WallCurrentResponseDto,
  WallQuestionResponseDto,
} from './dto/wall-question-response.dto';
import { WallCardsService } from './wall_cards.service';

/**
 * Public wall-card routes remain open; admin moderation routes require roles and permissions.
 */
@ApiTags('wall-cards')
@Controller('wall-cards')
export class WallCardsController {
  constructor(private readonly wallCardsService: WallCardsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get active question and featured answers' })
  @ApiOkResponse({ type: WallCurrentResponseDto })
  getCurrent(@I18n() i18n: I18nContext) {
    return this.wallCardsService.getCurrent(i18n.lang);
  }

  @Post('current/answers')
  @ApiOperation({ summary: 'Submit an answer to the active question' })
  @ApiOkResponse({ type: WallAnswerResponseDto })
  submitAnswer(
    @I18n() i18n: I18nContext,
    @Body() dto: CreateWallAnswerDto,
  ) {
    return this.wallCardsService.submitAnswer(dto, i18n.lang);
  }

  @Get('history')
  @ApiOperation({ summary: 'Paginated history of past questions' })
  listHistory(
    @I18n() i18n: I18nContext,
    @Query() query: WallQuestionQueryDto,
  ) {
    return this.wallCardsService.listHistory(query, i18n.lang);
  }

  @Get('history/:questionId/answers')
  @ApiOperation({ summary: 'Paginated public answers for a question' })
  listHistoryAnswers(
    @I18n() i18n: I18nContext,
    @Param('questionId', ParseIdPipe) questionId: string,
    @Query() pagination: OffsetPaginationDto,
  ) {
    return this.wallCardsService.listPublicAnswers(
      questionId,
      pagination,
      i18n.lang,
    );
  }

  @Put('questions/active/featured-answers')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.WALL_CARDS_UPDATE)
  @ApiOperation({ summary: 'Set up to 3 featured public answers' })
  setFeaturedAnswers(
    @I18n() i18n: I18nContext,
    @Body() dto: SetFeaturedAnswersDto,
  ) {
    return this.wallCardsService.setFeaturedAnswers(dto, i18n.lang);
  }

  @Get('blocked-words')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.WALL_CARDS_BLOCKED_WORDS_MANAGE)
  @ApiOperation({ summary: 'List blocked words' })
  @ApiOkResponse({ type: [BlockedWordResponseDto] })
  listBlockedWords() {
    return this.wallCardsService.listBlockedWords();
  }

  @Post('blocked-words')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.WALL_CARDS_BLOCKED_WORDS_MANAGE)
  @ApiOperation({ summary: 'Add a blocked word' })
  @ApiOkResponse({ type: BlockedWordResponseDto })
  addBlockedWord(@Body() dto: CreateBlockedWordDto) {
    return this.wallCardsService.addBlockedWord(dto);
  }

  @Delete('blocked-words/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.WALL_CARDS_BLOCKED_WORDS_MANAGE)
  @ApiOperation({ summary: 'Remove a blocked word' })
  removeBlockedWord(@Param('id', ParseIdPipe) id: string) {
    return this.wallCardsService.removeBlockedWord(id);
  }

  @Post('questions/publish')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.WALL_CARDS_UPDATE)
  @ApiOperation({ summary: 'Publish a new question (replaces active)' })
  @ApiOkResponse({ type: WallQuestionResponseDto })
  publishQuestion(
    @I18n() i18n: I18nContext,
    @Body() dto: PublishWallQuestionDto,
    @Headers('x-admin-user-id') adminUserIdHeader?: string,
  ) {
    return this.wallCardsService.publishQuestion(
      dto,
      resolveWallCardsAdminUserId(adminUserIdHeader),
      i18n.lang,
    );
  }

  @Get('questions')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.WALL_CARDS_READ)
  @ApiOperation({ summary: 'List all questions with filters' })
  listQuestionsAdmin(
    @I18n() i18n: I18nContext,
    @Query() query: WallQuestionQueryDto,
  ) {
    return this.wallCardsService.listQuestionsAdmin(query, i18n.lang);
  }

  @Get('questions/:questionId/answers')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.WALL_CARDS_READ)
  @ApiOperation({ summary: 'List answers for a question' })
  listAnswersAdmin(
    @I18n() i18n: I18nContext,
    @Param('questionId', ParseIdPipe) questionId: string,
    @Query() query: WallAnswerQueryDto,
  ) {
    return this.wallCardsService.listAnswersAdmin(questionId, query, i18n.lang);
  }

  @Get('answers/pending')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.WALL_CARDS_MODERATE)
  @ApiOperation({ summary: 'Global pending answers queue' })
  listPendingAnswers(@Query() pagination: OffsetPaginationDto) {
    return this.wallCardsService.listPendingAnswers(pagination);
  }

  @Patch('answers/:id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.WALL_CARDS_MODERATE)
  @ApiOperation({ summary: 'Moderate a pending answer (approve/decline)' })
  @ApiOkResponse({ type: WallAnswerResponseDto })
  moderateAnswer(
    @I18n() i18n: I18nContext,
    @Param('id', ParseIdPipe) id: string,
    @Body() dto: ModerateWallAnswerDto,
    @Headers('x-admin-user-id') adminUserIdHeader?: string,
  ) {
    return this.wallCardsService.moderateAnswer(
      id,
      dto,
      resolveWallCardsAdminUserId(adminUserIdHeader),
      i18n.lang,
    );
  }
}
