import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { appConfig } from '../common/config/app.config';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';
import {
  SendBulkEmailResultDto,
  SentEmailDto,
} from './dto/send-bulk-email-result.dto';

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
};

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
  ) {}

  async sendBulk(
    dto: SendBulkEmailDto,
    image?: Express.Multer.File,
  ): Promise<SendBulkEmailResultDto> {
    const smtpConfig = this.getSmtpConfig();
    const transporter = this.createTransporter(smtpConfig);
    const uniqueEmails = [...new Set(dto.emails.map((email) => email.trim()))];
    const deliveries: SentEmailDto[] = [];
    const failures: SendBulkEmailResultDto['failures'] = [];

    for (const email of uniqueEmails) {
      try {
        const delivery = await this.sendToRecipient(
          transporter,
          smtpConfig,
          email,
          dto.subject,
          dto.htmlMessage,
          dto.imageUrl,
          image,
        );
        deliveries.push(delivery);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to send email to ${email}: ${message}`);
        failures.push({ email, success: false });
      }
    }

    transporter.close();

    return {
      message: 'Bulk email processed',
      sent: uniqueEmails.length - failures.length,
      failed: failures.length,
      deliveries,
      failures,
    };
  }

  private getSmtpConfig(): SmtpConfig {
    const host = this.config.smtpHost;
    const user = this.config.smtpUser;
    const pass = this.config.smtpPass;
    const fromEmail = this.config.smtpFromEmail || user;

    if (!host || !user || !pass || !fromEmail) {
      throw new BadRequestException(
        'SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM_EMAIL must be configured',
      );
    }

    return {
      host,
      port: this.config.smtpPort ?? 465,
      secure: this.config.smtpSecure ?? true,
      user,
      pass,
      fromEmail,
      fromName: this.config.smtpFromName ?? 'TEDx Damascus',
    };
  }

  private createTransporter(config: SmtpConfig): Transporter {
    return createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      tls: {
        servername: config.host,
      },
    });
  }

  private async sendToRecipient(
    transporter: Transporter,
    config: SmtpConfig,
    recipient: string,
    subject: string,
    htmlMessage: string,
    imageUrl?: string,
    image?: Express.Multer.File,
  ): Promise<SentEmailDto> {
    const inlineImageCid = image ? `email-image-${Date.now()}@tedx` : undefined;
    const html = this.renderTemplate('email.html', {
      title: 'TEDx Damascus',
      image: this.buildImageHtml(imageUrl, inlineImageCid),
      message: htmlMessage,
      footer: 'TEDx Damascus Team',
    });

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: recipient,
      replyTo: config.fromEmail,
      subject,
      text: this.htmlToText(htmlMessage),
      html,
      headers: {
        'X-Mailer': 'TEDx Damascus Mailer',
      },
      attachments: image
        ? [
            {
              filename: image.originalname || 'email-image',
              content: image.buffer,
              contentType: image.mimetype,
              cid: inlineImageCid,
            },
          ]
        : undefined,
    });

    return {
      email: recipient,
      success: true,
    };
  }

  private renderTemplate(
    fileName: string,
    variables: Record<string, string>,
  ): string {
    const distTemplatePath = join(__dirname, 'templates', fileName);
    const sourceTemplatePath = join(
      process.cwd(),
      'src',
      'emails',
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

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private buildImageHtml(
    imageUrl?: string,
    inlineImageCid?: string,
  ): string {
    const source = inlineImageCid
      ? `cid:${inlineImageCid}`
      : imageUrl?.trim();

    if (!source) {
      return '';
    }

    const safeUrl = this.escapeHtml(source);

    return `
      <img
        src="${safeUrl}"
        alt="TEDx Damascus"
        style="display:block;width:100%;max-width:536px;height:auto;border-radius:8px;margin:0 0 24px;"
      />
    `;
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
