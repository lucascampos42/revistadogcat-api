import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { BrevoMailService } from './brevo-mail.service';

@Module({
  imports: [ConfigModule],
  providers: [MailService, BrevoMailService],
  exports: [MailService, BrevoMailService],
})
export class MailModule {}
