import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitFormDto } from './dto/submit-form.dto';
import { OffsetPaginationDto } from '../common/pagination/dto/offset-pagination.dto';
import { TARGET_ROLES } from './entities/form-template.schema';
import {
  FormSubmissionResponseDto,
  FormTemplateSchemaResponseDto,
  FormTemplateSummaryResponseDto,
} from './dto/form-responses.dto';
import { FormAvailabilityGuard } from './guards/form-availability.guard';

@ApiTags('forms')
@ApiBearerAuth('bearer')
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  @ApiOperation({
    summary: 'Admin: Create form template',
    description:
      'Creates a new form template in Draft status. Questions are added separately using the questions endpoints.',
  })
  @ApiCreatedResponse({ type: FormTemplateSummaryResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  create(@Body() dto: CreateFormTemplateDto) {
    return this.formsService.create(dto);
  }

  @Get('available')
  @ApiOperation({ summary: 'User: List published forms for role' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: TARGET_ROLES,
    description:
      'Target role of the current user. Defaults to Attender when omitted or invalid.',
  })
  @ApiOkResponse({ type: [FormTemplateSummaryResponseDto] })
  listAvailable(@Query('role') role: (typeof TARGET_ROLES)[number]) {
    if (!role || !TARGET_ROLES.includes(role)) {
      role = 'Attender';
    }
    return this.formsService.listAvailableForms(role);
  }

  @Get()
  @ApiOperation({ summary: 'Admin: List all form templates' })
  @ApiOkResponse({ type: [FormTemplateSummaryResponseDto] })
  findAll() {
    return this.formsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: Get form template by ID' })
  @ApiOkResponse({ type: FormTemplateSummaryResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid form template ID' })
  findOne(@Param('id') id: string) {
    return this.formsService.findOneForAdmin(id);
  }

  @Get(':id/schema')
  @ApiOperation({
    summary: 'Get published form schema',
    description:
      'Returns the structure of a published form, including questions, types, configs, and options.',
  })
  @ApiOkResponse({ type: FormTemplateSchemaResponseDto })
  @ApiBadRequestResponse({ description: 'Form is not published or ID is invalid' })
  getSchema(@Param('id') id: string) {
    return this.formsService.getFormSchema(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Admin: Update form template',
    description:
      'Updates metadata of a form template. Only Draft templates can be modified.',
  })
  @ApiOkResponse({ type: FormTemplateSummaryResponseDto })
  @ApiBadRequestResponse({
    description:
      'Cannot modify a published form or invalid form template ID.',
  })
  update(@Param('id') id: string, @Body() dto: UpdateFormTemplateDto) {
    return this.formsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Admin: Delete form template',
    description:
      'Deletes a form template. Only Draft templates can be deleted.',
  })
  @ApiBadRequestResponse({
    description:
      'Cannot modify a published form or invalid form template ID.',
  })
  remove(@Param('id') id: string) {
    return this.formsService.remove(id);
  }

  @Post(':id/questions')
  @ApiOperation({
    summary: 'Admin: Add question',
    description:
      'Adds a new question to a Draft form. The question type and config determine the expected answer shape.',
  })
  @ApiOkResponse({ type: FormTemplateSchemaResponseDto })
  @ApiBadRequestResponse({
    description:
      'Form template is not Draft, invalid form ID, or invalid question payload.',
  })
  addQuestion(@Param('id') formId: string, @Body() dto: CreateQuestionDto) {
    return this.formsService.addQuestion(formId, dto);
  }

  @Patch(':id/questions/:questionId')
  @ApiOperation({
    summary: 'Admin: Update question',
    description:
      'Updates an existing question on a Draft form. Supports changing type, config, and options.',
  })
  @ApiOkResponse({ type: FormTemplateSchemaResponseDto })
  @ApiBadRequestResponse({
    description:
      'Form template is not Draft, invalid IDs, or invalid question payload.',
  })
  updateQuestion(
    @Param('id') formId: string,
    @Param('questionId') questionId: string,
    @Body() dto: Partial<CreateQuestionDto>,
  ) {
    return this.formsService.updateQuestion(formId, questionId, dto);
  }

  @Delete(':id/questions/:questionId')
  @ApiOperation({
    summary: 'Admin: Remove question',
    description: 'Removes a question from a Draft form.',
  })
  @ApiOkResponse({ type: FormTemplateSchemaResponseDto })
  @ApiBadRequestResponse({
    description: 'Form template is not Draft or invalid IDs.',
  })
  removeQuestion(
    @Param('id') formId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.formsService.removeQuestion(formId, questionId);
  }

  @Post(':id/publish')
  @ApiOperation({
    summary: 'Admin: Publish form',
    description:
      'Marks a Draft form as Published, making it available to users with the targetRole.',
  })
  @ApiOkResponse({ type: FormTemplateSummaryResponseDto })
  @ApiBadRequestResponse({
    description: 'Form is already published or ID is invalid.',
  })
  publish(@Param('id') id: string) {
    return this.formsService.publish(id);
  }

  @Post(':id/unpublish')
  @ApiOperation({
    summary: 'Admin: Unpublish form',
    description:
      'Marks a Published form as Draft again. Published forms cannot be edited until they are unpublished.',
  })
  @ApiOkResponse({ type: FormTemplateSummaryResponseDto })
  @ApiBadRequestResponse({
    description: 'Form is not published or ID is invalid.',
  })
  unpublish(@Param('id') id: string) {
    return this.formsService.unpublish(id);
  }

  @Post(':id/submit')
  @UseGuards(FormAvailabilityGuard)
  @ApiOperation({
    summary: 'User: Submit form',
    description:
      'Submits answers for a published form. Answer value shapes depend on question types (see SubmitFormDto).',
  })
  @ApiHeader({
    name: 'x-user-id',
    required: false,
    description:
      'User ID submitting the form. If omitted, a placeholder ID is used (for development).',
  })
  @ApiCreatedResponse({ type: FormSubmissionResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error or invalid form ID.' })
  @ApiForbiddenResponse({
    description:
      'Form not published, not yet open, submission window closed, or submission limit reached.',
  })
  @ApiResponse({
    status: 410,
    description: 'Form has expired (expires_at).',
  })
  @ApiBody({ type: SubmitFormDto })
  submit(
    @Param('id') formId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: SubmitFormDto,
  ) {
    const uid = userId || '000000000000000000000000';
    return this.formsService.submitForm(formId, uid, dto);
  }

  @Get(':id/submissions')
  @ApiOperation({ summary: 'Admin: List submissions' })
  @ApiOkResponse({
    description:
      'Paginated list of submissions for the form. items is an array of FormSubmissionResponseDto.',
  })
  listSubmissions(
    @Param('id') formId: string,
    @Query() pagination: OffsetPaginationDto,
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    return this.formsService.listSubmissions(formId, page, limit);
  }

  @Get(':id/submissions/:submissionId')
  @ApiOperation({ summary: 'Admin: View submission' })
  @ApiOkResponse({
    description:
      'Returns the form schema and a single submission mapped as FormSubmissionResponseDto.',
  })
  getSubmission(
    @Param('id') formId: string,
    @Param('submissionId') submissionId: string,
  ) {
    return this.formsService.getSubmission(formId, submissionId);
  }

  @Get(':id/my-submission')
  @ApiOperation({
    summary: 'User: View own submission',
    description:
      'Returns the published form schema and the current user’s answers keyed by question ID.',
  })
  @ApiHeader({
    name: 'x-user-id',
    required: false,
    description:
      'User ID whose submission should be returned. If omitted, a placeholder ID is used (for development).',
  })
  @ApiOkResponse({
    description:
      'Object containing { schema, answers }. schema matches FormTemplateSchemaResponseDto; answers is a map of questionId to value.',
  })
  getMySubmission(
    @Param('id') formId: string,
    @Headers('x-user-id') userId: string,
  ) {
    const uid = userId || '000000000000000000000000';
    return this.formsService.getMySubmission(formId, uid);
  }
}
