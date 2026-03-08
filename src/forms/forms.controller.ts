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
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitFormDto } from './dto/submit-form.dto';
import { OffsetPaginationDto } from '../common/pagination/dto/offset-pagination.dto';
import { TARGET_ROLES } from './entities/form-template.schema';

@ApiTags('forms')
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post()
  @ApiOperation({ summary: 'Admin: Create form template' })
  create(@Body() dto: CreateFormTemplateDto) {
    return this.formsService.create(dto);
  }

  @Get('available')
  @ApiOperation({ summary: 'User: List published forms for role' })
  listAvailable(@Query('role') role: (typeof TARGET_ROLES)[number]) {
    if (!role || !TARGET_ROLES.includes(role)) {
      role = 'Attender';
    }
    return this.formsService.listAvailableForms(role);
  }

  @Get()
  @ApiOperation({ summary: 'Admin: List all form templates' })
  findAll() {
    return this.formsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: Get form template by ID' })
  findOne(@Param('id') id: string) {
    return this.formsService.findOne(id);
  }

  @Get(':id/schema')
  @ApiOperation({ summary: 'Get published form schema' })
  getSchema(@Param('id') id: string) {
    return this.formsService.getFormSchema(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: Update form template' })
  update(@Param('id') id: string, @Body() dto: UpdateFormTemplateDto) {
    return this.formsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Delete form template' })
  remove(@Param('id') id: string) {
    return this.formsService.remove(id);
  }

  @Post(':id/questions')
  @ApiOperation({ summary: 'Admin: Add question' })
  addQuestion(@Param('id') formId: string, @Body() dto: CreateQuestionDto) {
    return this.formsService.addQuestion(formId, dto);
  }

  @Patch(':id/questions/:questionId')
  @ApiOperation({ summary: 'Admin: Update question' })
  updateQuestion(
    @Param('id') formId: string,
    @Param('questionId') questionId: string,
    @Body() dto: Partial<CreateQuestionDto>,
  ) {
    return this.formsService.updateQuestion(formId, questionId, dto);
  }

  @Delete(':id/questions/:questionId')
  @ApiOperation({ summary: 'Admin: Remove question' })
  removeQuestion(
    @Param('id') formId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.formsService.removeQuestion(formId, questionId);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Admin: Publish form' })
  publish(@Param('id') id: string) {
    return this.formsService.publish(id);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Admin: Unpublish form' })
  unpublish(@Param('id') id: string) {
    return this.formsService.unpublish(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'User: Submit form' })
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
  getSubmission(
    @Param('id') formId: string,
    @Param('submissionId') submissionId: string,
  ) {
    return this.formsService.getSubmission(formId, submissionId);
  }

  @Get(':id/my-submission')
  @ApiOperation({ summary: 'User: View own submission' })
  getMySubmission(
    @Param('id') formId: string,
    @Headers('x-user-id') userId: string,
  ) {
    const uid = userId || '000000000000000000000000';
    return this.formsService.getMySubmission(formId, uid);
  }
}
