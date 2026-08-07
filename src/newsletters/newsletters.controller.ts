import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OffsetPaginationDto } from '../common/pagination/dto/offset-pagination.dto';
import { UserPermission, UserRole } from '../users/entities/user.entity';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { UnsubscribeNewsletterDto } from './dto/unsubscribe-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { NewsletterUnsubscribePageRenderer } from './newsletter-unsubscribe-page.renderer';
import { NewsletterService } from './newsletters.service';

@ApiTags('newsletters')
@Controller('newsletters')
export class NewslettersController {
  constructor(
    private readonly newsletterService: NewsletterService,
    private readonly unsubscribePageRenderer: NewsletterUnsubscribePageRenderer,
  ) {}

  @Post('subscribe')
  @ApiOperation({
    summary: 'Subscribe an email address',
    description:
      'Normalizes the email (trim + lowercase). A new email is created as active; an existing inactive subscriber is reactivated; an active subscriber is not duplicated.',
  })
  @ApiBody({ type: SubscribeNewsletterDto })
  @ApiOkResponse({
    description: 'The normalized email and its subscription result.',
  })
  subscribe(@Body() dto: SubscribeNewsletterDto) {
    return this.newsletterService.subscribe(dto);
  }

  @Get('unsubscribe')
  @ApiProduces('text/html')
  @ApiOperation({
    summary: 'Unsubscribe from an email link',
    description:
      'Public endpoint used by the opaque token embedded in every newsletter. It displays a confirmation form and does not change the subscription by opening the link.',
  })
  @ApiOkResponse({
    description: 'A confirmation page for a valid unsubscribe token.',
  })
  async unsubscribeConfirmation(
    @Query() query: UnsubscribeNewsletterDto,
    @Res() response: Response,
  ) {
    await this.newsletterService.validateUnsubscribeToken(query.token);
    response.type('html').send(
      this.unsubscribePageRenderer.renderConfirmation(query.token),
    );
  }

  @Post('unsubscribe')
  @ApiOperation({
    summary: 'Confirm unsubscribe from an email link',
    description:
      'Consumes a valid opaque token once and changes the matching subscription to inactive.',
  })
  @ApiOkResponse({ description: 'The subscription is inactive.' })
  unsubscribe(@Query() query: UnsubscribeNewsletterDto) {
    return this.newsletterService.unsubscribeByToken(query.token);
  }

  @Patch('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Update the current account subscription',
    description:
      'Uses the email from the current JWT, so the client never sends an email address. Set isActive to false to unsubscribe or true to subscribe again.',
  })
  @ApiOkResponse({
    description: 'The current account subscription was updated.',
  })
  updateOwnSubscription(
    @Req() req: { user: { email: string } },
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.newsletterService.updateOwnSubscription(
      req.user.email,
      dto.isActive,
    );
  }

  @Get('subscribers')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.NEWSLETTERS_READ)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'List active subscribers',
    description:
      'Returns active subscribers only, with page and limit pagination. Requires the newsletters:read permission.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiOkResponse({ description: 'Paginated active subscriber list.' })
  getSubscribers(@Query() pagination: OffsetPaginationDto) {
    return this.newsletterService.getSubscribers(pagination);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.NEWSLETTERS_CREATE)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Create a newsletter draft',
    description:
      'Creates a draft only; no email is sent. The draft can be edited until it is sent.',
  })
  @ApiCreatedResponse({ description: 'Newsletter draft created.' })
  createNewsletter(
    @Req() req: { user: { id: string } },
    @Body() dto: CreateNewsletterDto,
  ) {
    return this.newsletterService.createNewsletter(dto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.NEWSLETTERS_READ)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'List newsletter history',
    description:
      'Returns drafts and sent newsletters with pagination, status, sender, send time, and delivery counts.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiOkResponse({ description: 'Paginated newsletter history.' })
  getNewsletters(@Query() pagination: OffsetPaginationDto) {
    return this.newsletterService.getNewsletters(pagination);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.NEWSLETTERS_READ)
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id', description: 'Newsletter MongoDB ObjectId' })
  @ApiOperation({ summary: 'Get one newsletter and its delivery history' })
  @ApiOkResponse({ description: 'Newsletter details.' })
  getNewsletter(@Param('id') id: string) {
    return this.newsletterService.getNewsletter(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.NEWSLETTERS_UPDATE)
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id', description: 'Newsletter MongoDB ObjectId' })
  @ApiOperation({
    summary: 'Update a newsletter draft',
    description: 'Only newsletters with draft status can be changed.',
  })
  @ApiOkResponse({ description: 'Draft updated.' })
  @ApiConflictResponse({
    description: 'Sent or currently sending newsletters cannot be edited.',
  })
  updateNewsletter(@Param('id') id: string, @Body() dto: UpdateNewsletterDto) {
    return this.newsletterService.updateNewsletter(id, dto);
  }

  @Post(':id/send')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Permissions(UserPermission.NEWSLETTERS_SEND)
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id', description: 'Newsletter MongoDB ObjectId' })
  @ApiOperation({
    summary: 'Send a draft newsletter once',
    description:
      'Atomically marks the draft as sending, emails every active subscriber through EmailsService, then records sentBy, sentAt, successful deliveries, and failed deliveries. A sent newsletter cannot be sent again.',
  })
  @ApiOkResponse({
    description: 'Newsletter processing completed with sent and failed counts.',
  })
  @ApiConflictResponse({
    description: 'The newsletter is already sending or was sent previously.',
  })
  sendNewsletter(
    @Param('id') id: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.newsletterService.sendNewsletter(id, req.user.id);
  }
}
