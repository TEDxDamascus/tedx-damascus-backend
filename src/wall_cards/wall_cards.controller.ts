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
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { OffsetPaginationDto } from '../common/pagination/dto/offset-pagination.dto';
import { WallHistoryAnswerQueryDto } from './dto/wall-history-answer-query.dto';
import { resolveWallCardsAdminUserId } from './constants/wall-cards-dev-admin.constant';
import { BlockedWordResponseDto } from './dto/blocked-word-response.dto';
import { CreateBlockedWordDto } from './dto/create-blocked-word.dto';
import { CreateWallAnswerDto } from './dto/create-wall-answer.dto';
import { ModerateWallAnswerDto } from './dto/moderate-wall-answer.dto';
import { PublishWallQuestionDto } from './dto/publish-wall-question.dto';
import { SetFeaturedAnswersDto } from './dto/set-featured-answers.dto';
import { UpdateBlockedWordDto } from './dto/update-blocked-word.dto';
import { UpdateWallQuestionDto } from './dto/update-wall-question.dto';
import { WallAnswerQueryDto } from './dto/wall-answer-query.dto';
import { WallQuestionQueryDto } from './dto/wall-question-query.dto';
import { WallAnswerResponseDto } from './dto/wall-answer-response.dto';
import {
  WallCurrentResponseDto,
  WallHistoryAnswersResponseDto,
  WallQuestionResponseDto,
} from './dto/wall-question-response.dto';
import { WallCardsService } from './wall_cards.service';

/**
 * TESTING: All routes are public (no JWT / roles).
 * Restore JwtAuthGuard + RolesGuard on admin routes before production.
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
  @ApiOperation({
    summary:
      'Question details with paginated pending and approved answers (optional status filter)',
  })
  @ApiOkResponse({ type: WallHistoryAnswersResponseDto })
  listHistoryAnswers(
    @I18n() i18n: I18nContext,
    @Param('questionId', ParseIdPipe) questionId: string,
    @Query() query: WallHistoryAnswerQueryDto,
  ) {
    return this.wallCardsService.listHistoryAnswers(
      questionId,
      query,
      i18n.lang,
    );
  }

  @Put('questions/active/featured-answers')
  @ApiOperation({ summary: 'Set up to 3 featured public answers' })
  setFeaturedAnswers(
    @I18n() i18n: I18nContext,
    @Body() dto: SetFeaturedAnswersDto,
  ) {
    return this.wallCardsService.setFeaturedAnswers(dto, i18n.lang);
  }

  @Get('blocked-words')
  @ApiOperation({ summary: 'List blocked words' })
  @ApiOkResponse({ type: [BlockedWordResponseDto] })
  listBlockedWords() {
    return this.wallCardsService.listBlockedWords();
  }

  @Post('blocked-words')
  @ApiOperation({ summary: 'Add a blocked word' })
  @ApiOkResponse({ type: BlockedWordResponseDto })
  addBlockedWord(@Body() dto: CreateBlockedWordDto) {
    return this.wallCardsService.addBlockedWord(dto);
  }

  @Patch('blocked-words/:blockwordId')
  @ApiOperation({ summary: 'Update a blocked word' })
  @ApiOkResponse({ type: BlockedWordResponseDto })
  updateBlockedWord(
    @Param('blockwordId', ParseIdPipe) blockwordId: string,
    @Body() dto: UpdateBlockedWordDto,
  ) {
    return this.wallCardsService.updateBlockedWord(blockwordId, dto);
  }

  @Delete('blocked-words/:id')
  @ApiOperation({ summary: 'Remove a blocked word' })
  removeBlockedWord(@Param('id', ParseIdPipe) id: string) {
    return this.wallCardsService.removeBlockedWord(id);
  }

  @Post('questions/publish')
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
  @ApiOperation({ summary: 'List all questions with filters' })
  listQuestionsAdmin(
    @I18n() i18n: I18nContext,
    @Query() query: WallQuestionQueryDto,
  ) {
    return this.wallCardsService.listQuestionsAdmin(query, i18n.lang);
  }

  @Get('questions/:questionId/answers')
  @ApiOperation({ summary: 'List answers for a question' })
  listAnswersAdmin(
    @I18n() i18n: I18nContext,
    @Param('questionId', ParseIdPipe) questionId: string,
    @Query() query: WallAnswerQueryDto,
  ) {
    return this.wallCardsService.listAnswersAdmin(questionId, query, i18n.lang);
  }

  @Patch('questions/:questionId')
  @ApiOperation({ summary: 'Update a question text and/or status' })
  @ApiOkResponse({ type: WallQuestionResponseDto })
  updateQuestion(
    @I18n() i18n: I18nContext,
    @Param('questionId', ParseIdPipe) questionId: string,
    @Body() dto: UpdateWallQuestionDto,
  ) {
    return this.wallCardsService.updateQuestion(questionId, dto, i18n.lang);
  }

  @Delete('questions/:questionId')
  @ApiOperation({ summary: 'Delete a question and its answers' })
  removeQuestion(
    @I18n() i18n: I18nContext,
    @Param('questionId', ParseIdPipe) questionId: string,
  ) {
    return this.wallCardsService.removeQuestion(questionId, i18n.lang);
  }

  @Get('answers/pending')
  @ApiOperation({ summary: 'Global pending answers queue' })
  listPendingAnswers(@Query() pagination: OffsetPaginationDto) {
    return this.wallCardsService.listPendingAnswers(pagination);
  }

  @Patch('answers/:id/moderate')
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
