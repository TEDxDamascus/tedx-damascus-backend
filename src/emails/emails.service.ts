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

export type InlineEmailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
  cid: string;
};

export type SendPersonalizedHtmlParams = {
  to: string;
  subject: string;
  htmlMessage: string;
  imageUrl?: string;
  inlineAttachments?: InlineEmailAttachment[];
  unsubscribeUrl?: string;
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
    this.logger.log(
      `Bulk email start: recipients=${dto.emails.length} subject="${dto.subject}" hasUpload=${Boolean(image)} hasImageUrl=${Boolean(dto.imageUrl)}`,
    );

    const smtpConfig = this.getSmtpConfig();
    const transporter = this.createTransporter(smtpConfig);
    const uniqueEmails = [...new Set(dto.emails.map((email) => email.trim()))];
    const deliveries: SentEmailDto[] = [];
    const failures: SendBulkEmailResultDto['failures'] = [];

    this.logger.log(
      `Bulk email unique recipients=${uniqueEmails.length} (from ${dto.emails.length} requested)`,
    );

    for (const email of uniqueEmails) {
      try {
        this.logger.log(`Sending bulk email to ${email}...`);
        const delivery = await this.sendToRecipient(
          transporter,
          smtpConfig,
          email,
          dto.subject,
          dto.htmlMessage,
          dto.imageUrl,
          image,
          dto.unsubscribeUrls?.[email],
        );
        deliveries.push(delivery);
        this.logger.log(`Bulk email sent successfully to ${email}`);
      } catch (error) {
        const message = this.errorMessage(error);
        this.logger.error(`Failed to send email to ${email}: ${message}`, error instanceof Error ? error.stack : undefined);
        failures.push({ email, success: false, reason: message });
      }
    }

    transporter.close();

    const result = {
      message: 'Bulk email processed',
      sent: uniqueEmails.length - failures.length,
      failed: failures.length,
      deliveries,
      failures,
    };

    this.logger.log(
      `Bulk email finished: sent=${result.sent} failed=${result.failed}`,
    );
    if (failures.length > 0) {
      this.logger.warn(
        `Bulk email failures: ${failures.map((f) => `${f.email} (${f.reason ?? 'unknown'})`).join('; ')}`,
      );
    }

    return result;
  }

  async sendPersonalizedHtml(
    params: SendPersonalizedHtmlParams,
  ): Promise<SentEmailDto> {
    this.logger.log(
      `Personalized email start: to=${params.to} subject="${params.subject}" attachments=${params.inlineAttachments?.length ?? 0} hasImageUrl=${Boolean(params.imageUrl)}`,
    );

    const smtpConfig = this.getSmtpConfig();
    const transporter = this.createTransporter(smtpConfig);

    try {
      const delivery = await this.sendPersonalizedToRecipient(
        transporter,
        smtpConfig,
        params,
      );
      this.logger.log(`Personalized email sent successfully to ${params.to}`);
      return delivery;
    } catch (error) {
      const message = this.errorMessage(error);
      this.logger.error(
        `Personalized email failed for ${params.to}: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    } finally {
      transporter.close();
    }
  }

  private getSmtpConfig(): SmtpConfig {
    const host = this.config.smtpHost;
    const user = this.config.smtpUser;
    const pass = this.config.smtpPass;
    const fromEmail = this.config.smtpFromEmail || user;

    if (!host || !user || !pass || !fromEmail) {
      this.logger.error(
        `SMTP config incomplete: host=${Boolean(host)} user=${Boolean(user)} pass=${Boolean(pass)} fromEmail=${Boolean(fromEmail)}`,
      );
      throw new BadRequestException(
        'SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM_EMAIL must be configured',
      );
    }

    const smtpConfig = {
      host,
      port: this.config.smtpPort ?? 465,
      secure: this.config.smtpSecure ?? true,
      user,
      pass,
      fromEmail,
      fromName: this.config.smtpFromName ?? 'TEDx Damascus',
    };

    this.logger.log(
      `SMTP config: host=${smtpConfig.host} port=${smtpConfig.port} secure=${smtpConfig.secure} user=${smtpConfig.user} from="${smtpConfig.fromName}" <${smtpConfig.fromEmail}> passLength=${pass.length}`,
    );

    return smtpConfig;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
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
    unsubscribeUrl?: string,
  ): Promise<SentEmailDto> {
    const inlineImageCid = image ? `email-image-${Date.now()}@tedx` : undefined;
    return this.sendPersonalizedToRecipient(transporter, config, {
      to: recipient,
      subject,
      htmlMessage,
      imageUrl,
      unsubscribeUrl,
      inlineAttachments: image
        ? [
            {
              filename: image.originalname || 'email-image',
              content: image.buffer,
              contentType: image.mimetype,
              cid: inlineImageCid!,
            },
          ]
        : undefined,
    });
  }

  private async sendPersonalizedToRecipient(
    transporter: Transporter,
    config: SmtpConfig,
    params: SendPersonalizedHtmlParams,
  ): Promise<SentEmailDto> {
    const bannerAttachment = params.inlineAttachments?.find((a) =>
      a.cid.startsWith('email-image-'),
    );
    const qrAttachment = params.inlineAttachments?.find((a) =>
      a.cid.startsWith('invitation-qr-'),
    );

    const messageWithQr = qrAttachment
      ? `${params.htmlMessage}
        <div style="margin-top:24px;text-align:center;">
          <p style="margin:0 0 12px;font-size:14px;color:#555;">Your entry QR code</p>
          <img
            src="cid:${qrAttachment.cid}"
            alt="Invitation QR code"
            style="display:inline-block;width:200px;height:200px;"
          />
        </div>`
      : params.htmlMessage;

    this.logger.debug(
      `Rendering email template for ${params.to}: hasBanner=${Boolean(bannerAttachment)} hasQr=${Boolean(qrAttachment)}`,
    );

    const html = this.renderTemplate('email.html', {
      title: 'TEDx Damascus',
      image: this.buildImageHtml(
        params.imageUrl,
        bannerAttachment?.cid,
      ),
      message: messageWithQr,
      footer: 'TEDx Damascus Team',
      unsubscribe: params.unsubscribeUrl
        ? `<p style="margin:24px 0 0;font-size:12px;"><a href="${this.escapeHtml(params.unsubscribeUrl)}">Unsubscribe</a></p>`
        : '',
    });

    this.logger.log(
      `Calling SMTP sendMail: to=${params.to} from=${config.fromEmail} subject="${params.subject}" attachmentCount=${params.inlineAttachments?.length ?? 0}`,
    );

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: params.to,
      replyTo: config.fromEmail,
      subject: params.subject,
      text: this.htmlToText(params.htmlMessage),
      html,
      headers: {
        'X-Mailer': 'TEDx Damascus Mailer',
      },
      attachments: params.inlineAttachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
        cid: attachment.cid,
      })),
    });

    this.logger.log(
      `SMTP accepted message for ${params.to}: messageId=${info?.messageId ?? 'n/a'} response=${info?.response ?? 'n/a'}`,
    );

    return {
      email: params.to,
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

    this.logger.log(
      `Loading email template: path=${templatePath} source=${existsSync(distTemplatePath) ? 'dist' : 'src'}`,
    );

    let html = readFileSync(templatePath, 'utf-8');

    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(pattern, () => value);
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

  private buildImageHtml(imageUrl?: string, inlineImageCid?: string): string {
    const source = inlineImageCid ? `cid:${inlineImageCid}` : imageUrl?.trim();

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
