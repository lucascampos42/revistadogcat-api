import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { BrevoMailService } from './brevo-mail.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const mockBrevoMailService = {
  sendEmail: jest.fn(),
  isReady: jest.fn().mockReturnValue(true),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('MailService', () => {
  let service: MailService;
  let brevoMailService: BrevoMailService;
  let configService: ConfigService;

  beforeEach(async () => {
    // Backup do EMAIL_ENABLED
    process.env.EMAIL_ENABLED = 'true';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: BrevoMailService,
          useValue: mockBrevoMailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    brevoMailService = module.get<BrevoMailService>(BrevoMailService);
    configService = module.get<ConfigService>(ConfigService);

    // Suprimir logs durante testes
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const resetToken = 'reset_token_123';
      const frontendUrl = 'https://frontend.com';

      mockConfigService.get.mockReturnValue(frontendUrl);
      mockBrevoMailService.sendEmail.mockResolvedValue(undefined);

      await service.sendPasswordResetEmail(email, name, resetToken);

      expect(configService.get).toHaveBeenCalledWith('FRONTEND_URL');
      expect(brevoMailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: '🔑 Redefinição de Senha',
          html: expect.stringContaining(name),
          text: expect.stringContaining(frontendUrl),
        }),
      );
    });

    it('should handle password reset email sending errors', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const resetToken = 'reset_token_123';
      const frontendUrl = 'https://frontend.com';
      const error = new Error('Email sending failed');

      mockConfigService.get.mockReturnValue(frontendUrl);
      mockBrevoMailService.sendEmail.mockRejectedValue(error);

      await expect(
        service.sendPasswordResetEmail(email, name, resetToken),
      ).rejects.toThrow(error);
    });

    it('should not send email when EMAIL_ENABLED is false', async () => {
      process.env.EMAIL_ENABLED = 'false';

      const email = 'test@example.com';
      const name = 'Test User';
      const resetToken = 'reset_token_123';

      await service.sendPasswordResetEmail(email, name, resetToken);

      expect(brevoMailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const frontendUrl = 'https://frontend.com';

      mockConfigService.get.mockReturnValue(frontendUrl);
      mockBrevoMailService.sendEmail.mockResolvedValue(undefined);

      await service.sendWelcomeEmail(email, name);

      expect(configService.get).toHaveBeenCalledWith('FRONTEND_URL');
      expect(brevoMailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: '🐶🐱 Bem-vindo à Revista DogCat!',
          html: expect.stringContaining(name),
          text: expect.stringContaining(name),
        }),
      );
    });

    it('should handle welcome email sending errors', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const frontendUrl = 'https://frontend.com';
      const error = new Error('Email sending failed');

      mockConfigService.get.mockReturnValue(frontendUrl);
      mockBrevoMailService.sendEmail.mockRejectedValue(error);

      await expect(service.sendWelcomeEmail(email, name)).rejects.toThrow(
        error,
      );
    });
  });

  describe('sendSecurityAlertEmail', () => {
    it('should send security alert email successfully', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const alertType = 'login_attempt';
      const details = 'Tentativa de login de IP suspeito';

      mockBrevoMailService.sendEmail.mockResolvedValue(undefined);

      await service.sendSecurityAlertEmail(email, name, alertType, details);

      expect(brevoMailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: `🔒 Alerta de Segurança: ${alertType}`,
          html: expect.stringContaining(name),
          text: expect.stringContaining(alertType),
        }),
      );
    });

    it('should handle security alert email sending errors', async () => {
      const email = 'test@example.com';
      const name = 'Test User';
      const alertType = 'login_attempt';
      const details = 'Tentativa de login de IP suspeito';
      const error = new Error('Email sending failed');

      mockBrevoMailService.sendEmail.mockRejectedValue(error);

      await expect(
        service.sendSecurityAlertEmail(email, name, alertType, details),
      ).rejects.toThrow(error);
    });
  });

  describe('sendActivationEmail', () => {
    it('should send activation email successfully', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USUARIO' as const,
      };
      const activationToken = 'activation_token_123';

      process.env.FRONTEND_URL = 'https://frontend.com';
      mockBrevoMailService.sendEmail.mockResolvedValue(undefined);

      await service.sendActivationEmail(user as any, activationToken);

      expect(brevoMailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          subject: 'Ative sua conta - Bem-vindo!',
          html: expect.stringContaining(user.name),
          text: expect.stringContaining('Bem-vindo'),
        }),
      );
    });
  });

  describe('sendUserConfirmation', () => {
    it('should send user confirmation email successfully', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USUARIO' as const,
      };

      mockBrevoMailService.sendEmail.mockResolvedValue(undefined);

      await service.sendUserConfirmation(user as any);

      expect(brevoMailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          subject: 'Welcome to our app! Confirm your email',
          html: expect.stringContaining(user.name),
        }),
      );
    });
  });

  describe('sendSuspiciousLoginAlert', () => {
    it('should send suspicious login alert successfully', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USUARIO' as const,
      };
      const loginDetails = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date(),
      };

      mockBrevoMailService.sendEmail.mockResolvedValue(undefined);

      await service.sendSuspiciousLoginAlert(user as any, loginDetails);

      expect(brevoMailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          subject: '🚨 Alerta de Segurança - Login Suspeito Detectado',
          html: expect.stringContaining(loginDetails.ip),
        }),
      );
    });
  });

  describe('sendMultipleLoginAttemptsAlert', () => {
    it('should send multiple login attempts alert successfully', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USUARIO' as const,
      };
      const attemptCount = 5;

      mockBrevoMailService.sendEmail.mockResolvedValue(undefined);

      await service.sendMultipleLoginAttemptsAlert(user as any, attemptCount);

      expect(brevoMailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          subject: '🚨 Alerta de Segurança - Múltiplas Tentativas de Login',
          html: expect.stringContaining(attemptCount.toString()),
        }),
      );
    });
  });

  describe('sendAccountBlockedAlert', () => {
    it('should send account blocked alert successfully', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USUARIO' as const,
      };
      const blockDuration = '30 minutos';

      mockBrevoMailService.sendEmail.mockResolvedValue(undefined);

      await service.sendAccountBlockedAlert(user as any, blockDuration);

      expect(brevoMailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
          subject: '🔒 Conta Temporariamente Bloqueada',
          html: expect.stringContaining(blockDuration),
        }),
      );
    });
  });

  describe('sendEmail', () => {
    it('should send generic email successfully', async () => {
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const html = '<p>Test HTML</p>';
      const text = 'Test Text';

      mockBrevoMailService.sendEmail.mockResolvedValue(undefined);

      await service.sendEmail(to, subject, html, text);

      expect(brevoMailService.sendEmail).toHaveBeenCalledWith({
        to,
        subject,
        html,
        text,
      });
    });

    it('should handle generic email sending errors', async () => {
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const html = '<p>Test HTML</p>';
      const text = 'Test Text';
      const error = new Error('Email sending failed');

      mockBrevoMailService.sendEmail.mockRejectedValue(error);

      await expect(service.sendEmail(to, subject, html, text)).rejects.toThrow(
        error,
      );
    });
  });

  describe('Email disabled behavior', () => {
    it('should not send emails when EMAIL_ENABLED is false', async () => {
      process.env.EMAIL_ENABLED = 'false';

      await service.sendWelcomeEmail('test@example.com', 'Test User');

      expect(brevoMailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should log when email is disabled in development', async () => {
      process.env.EMAIL_ENABLED = 'false';
      process.env.NODE_ENV = 'development';

      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await service.sendWelcomeEmail('test@example.com', 'Test User');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Email desabilitado'),
      );
    });
  });
});
