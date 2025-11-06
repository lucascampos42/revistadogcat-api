import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Importar SDK do Brevo
const brevo = require('@getbrevo/brevo');

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: number;
  params?: Record<string, any>;
}

@Injectable()
export class BrevoMailService {
  private readonly logger = new Logger(BrevoMailService.name);
  private apiInstance: any;
  private senderEmail: string;
  private senderName: string;
  private isConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('mail.brevo.apiKey');
    this.senderEmail =
      this.configService.get<string>('mail.brevo.senderEmail') || '';
    this.senderName =
      this.configService.get<string>('mail.brevo.senderName') ||
      'Revista DogCat';

    if (!apiKey) {
      this.logger.warn(
        '⚠️  Brevo API Key não configurada. Emails não serão enviados.',
      );
      return;
    }

    if (!this.senderEmail) {
      this.logger.warn(
        '⚠️  Brevo Sender Email não configurado. Emails não serão enviados.',
      );
      return;
    }

    try {
      // Criar instância da API
      this.apiInstance = new brevo.TransactionalEmailsApi();

      // Configurar API Key
      this.apiInstance.setApiKey(
        brevo.TransactionalEmailsApiApiKeys.apiKey,
        apiKey,
      );

      this.isConfigured = true;
      this.logger.log('✅ Brevo configurado com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro ao configurar Brevo:', error);
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    if (!this.isConfigured || !this.apiInstance) {
      this.logger.warn('Brevo não configurado. Email não enviado:', {
        to: options.to,
        subject: options.subject,
      });
      return;
    }

    try {
      const sendSmtpEmail = new brevo.SendSmtpEmail();

      // Configurar remetente
      sendSmtpEmail.sender = {
        email: this.senderEmail,
        name: this.senderName,
      };

      // Configurar destinatários
      if (Array.isArray(options.to)) {
        sendSmtpEmail.to = options.to.map((email) => ({ email }));
      } else {
        sendSmtpEmail.to = [{ email: options.to }];
      }

      // Configurar assunto
      sendSmtpEmail.subject = options.subject;

      // Se for usar template do Brevo
      if (options.templateId) {
        sendSmtpEmail.templateId = options.templateId;
        sendSmtpEmail.params = options.params || {};
      } else {
        // Usar HTML/texto direto
        if (options.html) {
          sendSmtpEmail.htmlContent = options.html;
        }
        if (options.text) {
          sendSmtpEmail.textContent = options.text;
        }
      }

      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

      const recipients = Array.isArray(options.to)
        ? options.to.join(', ')
        : options.to;

      this.logger.log(
        `✉️  Email enviado com sucesso via Brevo para ${recipients}`,
      );

      // Log do resultado se disponível
      if (result && result.body) {
        this.logger.debug(`Brevo Response: ${JSON.stringify(result.body)}`);
      }
    } catch (error) {
      const recipients = Array.isArray(options.to)
        ? options.to.join(', ')
        : options.to;

      this.logger.error(
        `❌ Erro ao enviar email via Brevo para ${recipients}:`,
        error,
      );

      // Em desenvolvimento, não falhar completamente
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(
          '⚠️  Modo desenvolvimento: continuando apesar do erro',
        );
        return;
      }

      throw error;
    }
  }

  async sendTemplateEmail(
    to: string | string[],
    templateId: number,
    params: Record<string, any>,
  ): Promise<void> {
    return this.sendEmail({
      to,
      subject: '', // O assunto virá do template
      templateId,
      params,
    });
  }

  /**
   * Verifica se o serviço está configurado e pronto para uso
   */
  isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Retorna informações sobre a configuração atual
   */
  getConfig() {
    return {
      configured: this.isConfigured,
      senderEmail: this.senderEmail,
      senderName: this.senderName,
    };
  }
}
