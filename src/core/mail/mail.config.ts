import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  // Configuração do Brevo
  brevo: {
    apiKey: process.env.BREVO_API_KEY,
    senderName: process.env.BREVO_SENDER_NAME || 'Revista DogCat',
    senderEmail: process.env.BREVO_SENDER_EMAIL,
  },
}));
