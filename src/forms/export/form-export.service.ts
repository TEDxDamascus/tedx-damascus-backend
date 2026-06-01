import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { existsSync, readFileSync } from 'fs';
import { Model, Types } from 'mongoose';
import { join } from 'path';
import puppeteer, { Browser } from 'puppeteer';
import {
  FormTemplate,
  FormTemplateDocument,
} from '../entities/form-template.schema';
import {
  FormSubmission,
  FormSubmissionDocument,
} from '../entities/form-submission.schema';
import { QuestionWithId } from '../utils/form-question-tree.util';
import { formTemplateIdFilter } from '../utils/form-template-id-filter.util';
import { ExportSubmissionPdfDto } from './dto/export-submission-pdf.dto';
import {
  buildExportItems,
  renderExportItemsHtml,
} from './utils/build-export-items.util';
import { ExportLocale } from './utils/format-answer-for-display.util';
import { escapeHtml } from './utils/escape-html.util';

const TEMPLATE_FILES: Record<ExportLocale, string> = {
  en: 'submission-export.en.html',
  ar: 'submission-export.ar.html',
};

@Injectable()
export class FormExportService implements OnModuleDestroy {
  private browser: Browser | null = null;
  private browserPromise: Promise<Browser> | null = null;

  constructor(
    @InjectModel(FormTemplate.name)
    private readonly formTemplateModel: Model<FormTemplateDocument>,
    @InjectModel(FormSubmission.name)
    private readonly formSubmissionModel: Model<FormSubmissionDocument>,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
    this.browserPromise = null;
  }

  async exportSubmissionPdf(
    formId: string,
    dto: ExportSubmissionPdfDto,
  ): Promise<Buffer> {
    return this.buildPdfBuffer(
      formId,
      dto.userId,
      dto.questionIds,
      dto.locale,
    );
  }

  private async buildPdfBuffer(
    formId: string,
    userId: string,
    questionIds: string[],
    locale: ExportLocale,
  ): Promise<Buffer> {
    if (!Types.ObjectId.isValid(formId)) {
      throw new BadRequestException('Invalid form template ID');
    }
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const template = await this.formTemplateModel.findById(formId).exec();
    if (!template) {
      throw new NotFoundException('Form template not found');
    }

    const submission = await this.formSubmissionModel
      .findOne({
        ...formTemplateIdFilter(formId),
        userId: new Types.ObjectId(userId),
        $or: [{ status: 'submitted' }, { status: { $exists: false } }],
      })
      .exec();

    if (!submission) {
      throw new NotFoundException(
        'No submitted answers found for this user on this form',
      );
    }

    const answersByQuestionId = this.normalizeAnswers(submission);
    const questions = template.questions as QuestionWithId[];
    const items = buildExportItems(
      questions,
      questionIds,
      answersByQuestionId,
      locale,
    );
    const itemsHtml = renderExportItemsHtml(items);

    const formName =
      template.name[locale] ||
      template.name.en ||
      template.name.ar ||
      'Form';

    const html = this.renderTemplate(locale, {
      formName: escapeHtml(formName),
      userId: escapeHtml(userId),
      itemsHtml,
    });

    return this.htmlToPdf(html);
  }

  private normalizeAnswers(
    submission: FormSubmissionDocument,
  ): Record<string, unknown> {
    const answers: Record<string, unknown> = {};
    for (const answer of submission.answers) {
      const qId = answer.questionId?.toString();
      if (!qId) continue;

      let value: unknown = answer.value;
      if (value instanceof Date) {
        value = value.toISOString();
      } else if (Array.isArray(value)) {
        value = value.map((item) =>
          item instanceof Types.ObjectId ? item.toString() : item,
        );
      } else if (value instanceof Types.ObjectId) {
        value = value.toString();
      } else if (value && typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(obj)) {
          if (val instanceof Date) {
            result[key] = val.toISOString();
          } else if (val instanceof Types.ObjectId) {
            result[key] = val.toString();
          } else {
            result[key] = val;
          }
        }
        value = result;
      }
      answers[qId] = value;
    }
    return answers;
  }

  private renderTemplate(
    locale: ExportLocale,
    variables: Record<string, string>,
  ): string {
    const fileName = TEMPLATE_FILES[locale];
    const distTemplatePath = join(__dirname, 'templates', fileName);
    const sourceTemplatePath = join(
      process.cwd(),
      'src',
      'forms',
      'export',
      'templates',
      fileName,
    );
    const templatePath = existsSync(distTemplatePath)
      ? distTemplatePath
      : sourceTemplatePath;
    let html = readFileSync(templatePath, 'utf-8');

    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(pattern, value);
    }

    return html;
  }

  private async getBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }
    if (!this.browserPromise) {
      this.browserPromise = this.launchBrowser();
    }
    return this.browserPromise;
  }

  private async launchBrowser(): Promise<Browser> {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ...(executablePath ? { executablePath } : {}),
      });
      return this.browser;
    } catch (err) {
      this.browserPromise = null;
      const detail = err instanceof Error ? err.message : String(err);
      throw new InternalServerErrorException(
        `PDF export requires Chrome. Run "pnpm puppeteer:install" after install, or set PUPPETEER_EXECUTABLE_PATH to a local Chrome/Chromium binary. ${detail}`,
      );
    }
  }

  private async htmlToPdf(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();

    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }
}
