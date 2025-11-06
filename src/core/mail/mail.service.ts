import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { BrevoMailService } from './brevo-mail.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly brevoMailService: BrevoMailService,
  ) {}

  private isEmailEnabled(): boolean {
    return process.env.EMAIL_ENABLED === 'true';
  }

  private async sendEmailIfEnabled(
    emailOptions: {
      to: string;
      subject: string;
      html?: string;
      text?: string;
    },
    logMessage: string,
  ): Promise<void> {
    if (!this.isEmailEnabled()) {
      this.logger.log(`📧 Email desabilitado: ${logMessage}`);
      return;
    }

    try {
      await this.brevoMailService.sendEmail(emailOptions);
      this.logger.log(`✅ ${logMessage}`);
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar email: ${logMessage}`,
        error.message,
      );
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(
          '🚀 Modo desenvolvimento: Email seria enviado em produção',
        );
        return;
      }
      throw error;
    }
  }

  async sendUserConfirmation(user: User): Promise<void> {
    const { email, name } = user;

    await this.sendEmailIfEnabled(
      {
        to: email,
        subject: 'Welcome to our app! Confirm your email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4CAF50;">Bem-vindo, ${name}! 🎉</h1>
            <p>Obrigado por se cadastrar na Revista DogCat!</p>
          </div>
        `,
        text: `Bem-vindo, ${name}! Obrigado por se cadastrar na Revista DogCat!`,
      },
      `Email de confirmação enviado para: ${email}`,
    );
  }

  async sendActivationEmail(
    user: User,
    activationToken: string,
  ): Promise<void> {
    const { email, name } = user;
    const activationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/activate?token=${activationToken}`;

    await this.sendEmailIfEnabled(
      {
        to: email,
        subject: 'Ative sua conta - Bem-vindo!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4CAF50;">Bem-vindo, ${name}! 🎉</h1>

            <p>Obrigado por se cadastrar na Revista DogCat!</p>

            <p>Para ativar sua conta, clique no botão abaixo:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${activationUrl}"
                 style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Ativar Conta
              </a>
            </div>

            <p style="color: #666; font-size: 12px;">
              Ou copie e cole este link no seu navegador:<br>
              <a href="${activationUrl}">${activationUrl}</a>
            </p>

            <p style="color: #666; font-size: 12px;">
              Este link expira em 24 horas.
            </p>
          </div>
        `,
        text: `Bem-vindo, ${name}! Para ativar sua conta, acesse: ${activationUrl}`,
      },
      `Email de ativação enviado para: ${email}`,
    );

    // Log da URL de ativação em desenvolvimento quando email está desabilitado
    if (process.env.NODE_ENV === 'development' && !this.isEmailEnabled()) {
      this.logger.log(`🔗 URL de ativação: ${activationUrl}`);
    }
  }

  async sendSuspiciousLoginAlert(
    user: User,
    loginDetails: { ip: string; userAgent: string; timestamp: Date },
  ): Promise<void> {
    const { email, name } = user;

    await this.sendEmailIfEnabled(
      {
        to: email,
        subject: '🚨 Alerta de Segurança - Login Suspeito Detectado',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f44336;">🚨 Alerta de Segurança</h1>

            <p>Olá, ${name}!</p>

            <p>Detectamos um login suspeito em sua conta.</p>

            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #856404;">Detalhes do Login:</h3>
              <p style="margin: 5px 0;"><strong>IP:</strong> ${loginDetails.ip}</p>
              <p style="margin: 5px 0;"><strong>Navegador:</strong> ${loginDetails.userAgent}</p>
              <p style="margin: 5px 0;"><strong>Data/Hora:</strong> ${loginDetails.timestamp.toLocaleString('pt-BR')}</p>
            </div>

            <p>Se não foi você, recomendamos alterar sua senha imediatamente.</p>
          </div>
        `,
        text: `Alerta de Segurança: Detectamos um login suspeito em sua conta. IP: ${loginDetails.ip}`,
      },
      `Alerta de login suspeito enviado para: ${email}`,
    );
  }

  async sendMultipleLoginAttemptsAlert(
    user: User,
    attemptCount: number,
  ): Promise<void> {
    const { email, name } = user;

    await this.sendEmailIfEnabled(
      {
        to: email,
        subject: '🚨 Alerta de Segurança - Múltiplas Tentativas de Login',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f44336;">🚨 Alerta de Segurança</h1>

            <p>Olá, ${name}!</p>

            <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #c62828;">Múltiplas Tentativas de Login</h3>
              <p>Detectamos <strong>${attemptCount} tentativas</strong> de login em sua conta.</p>
              <p style="margin: 5px 0;"><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>

            <p>Por segurança, sua conta pode ser temporariamente bloqueada.</p>
          </div>
        `,
        text: `Alerta: Detectamos ${attemptCount} tentativas de login em sua conta.`,
      },
      `Alerta de múltiplas tentativas enviado para: ${email}`,
    );
  }

  async sendAccountBlockedAlert(
    user: User,
    blockDuration: string,
  ): Promise<void> {
    const { email, name } = user;

    await this.sendEmailIfEnabled(
      {
        to: email,
        subject: '🔒 Conta Temporariamente Bloqueada',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f44336;">🔒 Conta Bloqueada</h1>

            <p>Olá, ${name}!</p>

            <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #c62828;">Bloqueio Temporário</h3>
              <p>Sua conta foi temporariamente bloqueada devido a múltiplas tentativas de login falhadas.</p>
              <p style="margin: 5px 0;"><strong>Duração do bloqueio:</strong> ${blockDuration}</p>
              <p style="margin: 5px 0;"><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>

            <p>O bloqueio será removido automaticamente após o período indicado.</p>
          </div>
        `,
        text: `Sua conta foi temporariamente bloqueada por ${blockDuration}.`,
      },
      `Alerta de conta bloqueada enviado para: ${email}`,
    );
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const frontendUrl = this.configService.get('FRONTEND_URL');

    await this.sendEmailIfEnabled(
      {
        to: email,
        subject: '🐶🐱 Bem-vindo à Revista DogCat!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4CAF50;">Bem-vindo, ${name}! 🎉</h1>

            <p>É um prazer tê-lo conosco na Revista DogCat!</p>

            <p>Explore nosso conteúdo sobre o mundo pet:</p>

            <ul>
              <li>📰 Artigos e notícias</li>
              <li>🐕 Dicas de cuidados com cães</li>
              <li>🐈 Dicas de cuidados com gatos</li>
              <li>❤️ Histórias de adoção</li>
              <li>🏆 Eventos e exposições</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/auth/login"
                 style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Acessar Plataforma
              </a>
            </div>
          </div>
        `,
        text: `Bem-vindo, ${name}! É um prazer tê-lo conosco na Revista DogCat!`,
      },
      `Email de boas-vindas enviado para: ${email}`,
    );
  }

  async sendSecurityAlertEmail(
    email: string,
    name: string,
    alertType: string,
    details: any,
  ): Promise<void> {
    await this.sendEmailIfEnabled(
      {
        to: email,
        subject: `🔒 Alerta de Segurança: ${alertType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f44336;">🔒 Alerta de Segurança</h1>

            <p>Olá, ${name}!</p>

            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #856404;">${alertType}</h3>
              <p>${JSON.stringify(details)}</p>
              <p style="margin: 5px 0;"><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        `,
        text: `Alerta de Segurança: ${alertType}`,
      },
      `Alerta de segurança enviado para: ${email}`,
    );
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/auth/reset-password?token=${resetToken}`;

    await this.sendEmailIfEnabled(
      {
        to: email,
        subject: '🔑 Redefinição de Senha',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2196F3;">Redefinir Senha</h1>

            <p>Olá, ${name}!</p>

            <p>Recebemos uma solicitação para redefinir sua senha.</p>

            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                ⚠️ Se você não solicitou esta alteração, ignore este email.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #2196F3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Redefinir Senha
              </a>
            </div>

            <p style="color: #666; font-size: 12px;">
              Ou copie e cole este link no seu navegador:<br>
              <a href="${resetUrl}">${resetUrl}</a>
            </p>

            <p style="color: #666; font-size: 12px;">
              Este link expira em 1 hora.
            </p>
          </div>
        `,
        text: `Redefinir senha: ${resetUrl}`,
      },
      `Email de redefinição de senha enviado para: ${email}`,
    );

    // Log da URL em desenvolvimento
    if (process.env.NODE_ENV === 'development' && !this.isEmailEnabled()) {
      this.logger.log(`🔗 URL de reset: ${resetUrl}`);
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    await this.sendEmailIfEnabled(
      {
        to,
        subject,
        html,
        text,
      },
      `Email genérico enviado para: ${to}`,
    );
  }
}
