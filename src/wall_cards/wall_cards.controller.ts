import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { OffsetPaginationDto } from '../common/pagination/dto/offset-pagination.dto';
import { UserRole } from '../users/entities/user.entity';
import { CreateWallAnswerDto } from './dto/create-wall-answer.dto';
import { PublishWallQuestionDto } from './dto/publish-wall-question.dto';
import { WallAnswerQueryDto } from './dto/wall-answer-query.dto';
import { WallQuestionQueryDto } from './dto/wall-question-query.dto';
import { WallAnswerResponseDto } from './dto/wall-answer-response.dto';
import {
  WallCurrentResponseDto,
  WallQuestionResponseDto,
} from './dto/wall-question-response.dto';
import { WallCardsService } from './wall_cards.service';

type AuthRequest = Request & { user?: { id: string } };

@ApiTags('wall-cards')
@Controller('wall-cards')
export class WallCardsController {
  constructor(private readonly wallCardsService: WallCardsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Public: Get active question and public answers' })
  @ApiOkResponse({ type: WallCurrentResponseDto })
  getCurrent(
    @I18n() i18n: I18nContext,
    @Query() pagination: OffsetPaginationDto,
  ) {
    return this.wallCardsService.getCurrent(i18n.lang, pagination);
  }

  @Post('current/answers')
  @ApiOperation({ summary: 'Public: Submit an answer to the active question' })
  @ApiOkResponse({ type: WallAnswerResponseDto })
  submitAnswer(
    @I18n() i18n: I18nContext,
    @Body() dto: CreateWallAnswerDto,
  ) {
    return this.wallCardsService.submitAnswer(dto, i18n.lang);
  }

  @Get('history')
  @ApiOperation({ summary: 'Public: Paginated history of past questions' })
  listHistory(
    @I18n() i18n: I18nContext,
    @Query() query: WallQuestionQueryDto,
  ) {
    return this.wallCardsService.listHistory(query, i18n.lang);
  }

  @Get('history/:questionId/answers')
  @ApiOperation({ summary: 'Public: Paginated public answers for a question' })
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

  @Post('questions/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Admin: Publish a new question (replaces active)' })
  @ApiOkResponse({ type: WallQuestionResponseDto })
  publishQuestion(
    @I18n() i18n: I18nContext,
    @Body() dto: PublishWallQuestionDto,
    @Req() req: AuthRequest,
  ) {
    return this.wallCardsService.publishQuestion(
      dto,
      req.user!.id,
      i18n.lang,
    );
  }

  @Get('questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Admin: List all questions with filters' })
  listQuestionsAdmin(
    @I18n() i18n: I18nContext,
    @Query() query: WallQuestionQueryDto,
  ) {
    return this.wallCardsService.listQuestionsAdmin(query, i18n.lang);
  }

  @Get('questions/:questionId/answers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Admin: List answers for a question' })
  listAnswersAdmin(
    @I18n() i18n: I18nContext,
    @Param('questionId', ParseIdPipe) questionId: string,
    @Query() query: WallAnswerQueryDto,
  ) {
    return this.wallCardsService.listAnswersAdmin(questionId, query, i18n.lang);
  }

  @Get('answers/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Admin: Global pending answers queue' })
  listPendingAnswers(@Query() pagination: OffsetPaginationDto) {
    return this.wallCardsService.listPendingAnswers(pagination);
  }

  @Patch('answers/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Admin: Approve a pending answer' })
  @ApiOkResponse({ type: WallAnswerResponseDto })
  approveAnswer(
    @I18n() i18n: I18nContext,
    @Param('id', ParseIdPipe) id: string,
    @Req() req: AuthRequest,
  ) {
    return this.wallCardsService.approveAnswer(id, req.user!.id, i18n.lang);
  }
}
