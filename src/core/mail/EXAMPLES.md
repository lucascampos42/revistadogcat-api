# 📧 Exemplos de Uso - Brevo Email Service

Este documento contém exemplos práticos de como usar o serviço de email com Brevo na aplicação Revista DogCat.

---

## 📋 Índice

1. [Configuração Básica](#configuração-básica)
2. [Envio de Email Simples](#envio-de-email-simples)
3. [Email com HTML](#email-com-html)
4. [Usando Templates do Brevo](#usando-templates-do-brevo)
5. [Emails Transacionais](#emails-transacionais)
6. [Emails em Massa](#emails-em-massa)
7. [Anexos (Futuro)](#anexos-futuro)
8. [Tratamento de Erros](#tratamento-de-erros)

---

## Configuração Básica

### Injetar o Serviço

```typescript
import { Injectable } from '@nestjs/common';
import { BrevoMailService } from '@/core/mail/brevo-mail.service';
import { MailService } from '@/core/mail/mail.service';

@Injectable()
export class MeuService {
  constructor(
    private readonly mailService: MailService, // Serviço unificado
    private readonly brevoService: BrevoMailService, // Serviço específico do Brevo
  ) {}
}
```

---

## Envio de Email Simples

### Exemplo 1: Email de Texto Puro

```typescript
async enviarEmailSimples() {
  await this.brevoService.sendEmail({
    to: 'usuario@example.com',
    subject: 'Bem-vindo à Revista DogCat!',
    text: 'Olá! Obrigado por se cadastrar na nossa plataforma.',
  });
}
```

### Exemplo 2: Email para Múltiplos Destinatários

```typescript
async enviarParaVarios() {
  await this.brevoService.sendEmail({
    to: [
      'usuario1@example.com',
      'usuario2@example.com',
      'usuario3@example.com',
    ],
    subject: 'Novidades da Revista DogCat',
    text: 'Confira as novidades desta semana!',
  });
}
```

---

## Email com HTML

### Exemplo 3: Email HTML Básico

```typescript
async enviarEmailHTML() {
  await this.brevoService.sendEmail({
    to: 'usuario@example.com',
    subject: '🐶 Nova Edição Disponível',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h1 style="color: #4CAF50;">Nova Edição!</h1>
        <p>Olá,</p>
        <p>A nova edição da Revista DogCat já está disponível!</p>
        <a href="https://revistadogcat.com.br/edicoes"
           style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Acessar Revista
        </a>
      </div>
    `,
    text: 'Nova Edição! A nova edição da Revista DogCat já está disponível!',
  });
}
```

### Exemplo 4: Email HTML Complexo

```typescript
async enviarNewsletterHTML(usuario: User) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff;">

              <!-- Header -->
              <tr>
                <td style="padding: 40px 30px; text-align: center; background-color: #4CAF50;">
                  <h1 style="color: #ffffff; margin: 0;">🐶🐱 Revista DogCat</h1>
                </td>
              </tr>

              <!-- Conteúdo -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333;">Olá, ${usuario.name}!</h2>
                  <p style="color: #666666; line-height: 1.6;">
                    Confira as novidades desta semana sobre o mundo pet!
                  </p>

                  <!-- Artigo em Destaque -->
                  <div style="background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="color: #4CAF50; margin-top: 0;">📰 Artigo em Destaque</h3>
                    <p style="color: #666666;">
                      <strong>Como cuidar do seu pet no verão</strong><br>
                      Dicas essenciais para manter seu amigo de quatro patas saudável nos dias quentes.
                    </p>
                    <a href="https://revistadogcat.com.br/artigos/cuidados-verao"
                       style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px;">
                      Ler Artigo
                    </a>
                  </div>

                  <!-- Call to Action -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://revistadogcat.com.br"
                       style="display: inline-block; background-color: #2196F3; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 16px;">
                      Visitar Site
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #f4f4f4; text-align: center;">
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    Revista DogCat - Sua fonte de informação sobre pets<br>
                    <a href="https://revistadogcat.com.br/unsubscribe" style="color: #999999;">Cancelar inscrição</a>
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await this.brevoService.sendEmail({
    to: usuario.email,
    subject: '📬 Newsletter Semanal - Revista DogCat',
    html: htmlContent,
    text: `Olá ${usuario.name}, confira as novidades desta semana sobre o mundo pet!`,
  });
}
```

---

## Usando Templates do Brevo

### Exemplo 5: Email com Template ID

Primeiro, crie um template no dashboard do Brevo com variáveis como `{{ params.name }}`, `{{ params.activationUrl }}`, etc.

```typescript
async enviarEmailComTemplate(usuario: User, activationToken: string) {
  const activationUrl = `${process.env.FRONTEND_URL}/auth/activate?token=${activationToken}`;

  await this.brevoService.sendTemplateEmail(
    usuario.email,
    123, // ID do template no Brevo
    {
      name: usuario.name,
      activationUrl: activationUrl,
      expiresIn: '24 horas',
    }
  );
}
```

### Exemplo 6: Template Condicional

```typescript
async enviarEmailPersonalizado(usuario: User) {
  // Escolher template baseado no tipo de usuário
  const templateId = usuario.role === 'ADMIN' ? 456 : 789;

  await this.brevoService.sendTemplateEmail(
    usuario.email,
    templateId,
    {
      name: usuario.name,
      role: usuario.role,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
    }
  );
}
```

---

## Emails Transacionais

### Exemplo 7: Email de Ativação de Conta

```typescript
async enviarEmailAtivacao(usuario: User, token: string) {
  const activationUrl = `${process.env.FRONTEND_URL}/auth/activate?token=${token}`;

  await this.brevoService.sendEmail({
    to: usuario.email,
    subject: '🔐 Ative sua conta - Revista DogCat',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">Bem-vindo, ${usuario.name}! 🎉</h1>

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
    text: `Bem-vindo, ${usuario.name}! Para ativar sua conta, acesse: ${activationUrl}`,
  });
}
```

### Exemplo 8: Email de Reset de Senha

```typescript
async enviarEmailResetSenha(email: string, nome: string, token: string) {
  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;

  await this.brevoService.sendEmail({
    to: email,
    subject: '🔑 Redefinição de Senha - Revista DogCat',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2196F3;">Redefinir Senha</h1>

        <p>Olá, ${nome}!</p>

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
          Este link expira em 1 hora.
        </p>
      </div>
    `,
  });
}
```

### Exemplo 9: Email de Confirmação de Pedido

```typescript
async enviarConfirmacaoPedido(pedido: any) {
  await this.brevoService.sendEmail({
    to: pedido.usuario.email,
    subject: `✅ Pedido #${pedido.id} Confirmado`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">Pedido Confirmado! ✅</h1>

        <p>Olá, ${pedido.usuario.name}!</p>

        <p>Seu pedido foi confirmado com sucesso!</p>

        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">📦 Detalhes do Pedido</h3>
          <p><strong>Número do Pedido:</strong> #${pedido.id}</p>
          <p><strong>Data:</strong> ${new Date(pedido.createdAt).toLocaleDateString('pt-BR')}</p>
          <p><strong>Total:</strong> R$ ${pedido.total.toFixed(2)}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/pedidos/${pedido.id}"
             style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Ver Pedido
          </a>
        </div>
      </div>
    `,
  });
}
```

---

## Emails em Massa

### Exemplo 10: Newsletter para Múltiplos Usuários

```typescript
async enviarNewsletterGeral(usuarios: User[]) {
  // Enviar em lotes de 100 para não atingir limites
  const batchSize = 100;

  for (let i = 0; i < usuarios.length; i += batchSize) {
    const batch = usuarios.slice(i, i + batchSize);

    const promises = batch.map(usuario =>
      this.brevoService.sendEmail({
        to: usuario.email,
        subject: '📰 Newsletter Mensal - Revista DogCat',
        html: this.gerarHTMLNewsletter(usuario),
      })
    );

    // Aguardar lote atual antes de processar próximo
    await Promise.all(promises);

    // Pequeno delay entre lotes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

private gerarHTMLNewsletter(usuario: User): string {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h1>Olá, ${usuario.name}!</h1>
      <p>Confira as novidades deste mês...</p>
    </div>
  `;
}
```

### Exemplo 11: Notificação para Administradores

```typescript
async notificarAdministradores(assunto: string, mensagem: string) {
  // Buscar todos os admins
  const admins = await this.userRepository.findByRole('ADMIN');

  const emails = admins.map(admin => admin.email);

  await this.brevoService.sendEmail({
    to: emails,
    subject: `🔔 [Admin] ${assunto}`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2 style="color: #f44336;">Notificação Administrativa</h2>
        <p>${mensagem}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Esta é uma notificação automática do sistema.
        </p>
      </div>
    `,
  });
}
```

---

## Anexos (Futuro)

### Exemplo 12: Email com Anexo (Planejado)

```typescript
// NOTA: Recurso ainda não implementado, mas planejado
async enviarEmailComAnexo(usuario: User, arquivo: Buffer) {
  // Implementação futura
  await this.brevoService.sendEmail({
    to: usuario.email,
    subject: '📎 Documento Anexado',
    html: '<p>Segue o documento solicitado.</p>',
    // attachments: [{
    //   filename: 'documento.pdf',
    //   content: arquivo,
    // }],
  });
}
```

---

## Tratamento de Erros

### Exemplo 13: Try-Catch Básico

```typescript
async enviarEmailSeguro(usuario: User) {
  try {
    await this.brevoService.sendEmail({
      to: usuario.email,
      subject: 'Teste',
      text: 'Mensagem de teste',
    });

    console.log('Email enviado com sucesso!');

  } catch (error) {
    console.error('Erro ao enviar email:', error);

    // Registrar erro no sistema de logs
    // this.logger.error('Falha no envio de email', error);
  }
}
```

### Exemplo 14: Retry com Fallback

```typescript
async enviarEmailComRetentativa(usuario: User, maxTentativas = 3) {
  let tentativas = 0;

  while (tentativas < maxTentativas) {
    try {
      await this.brevoService.sendEmail({
        to: usuario.email,
        subject: 'Email Importante',
        html: '<p>Conteúdo importante...</p>',
      });

      return { success: true };

    } catch (error) {
      tentativas++;

      if (tentativas >= maxTentativas) {
        // Última tentativa falhou, usar fallback
        console.error(`Falha após ${maxTentativas} tentativas`);

        // Notificar admin sobre falha
        await this.notificarFalhaEnvio(usuario.email, error);

        return { success: false, error };
      }

      // Aguardar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000 * tentativas));
    }
  }
}

private async notificarFalhaEnvio(emailDestino: string, error: any) {
  // Notificar administradores sobre falha no envio
  await this.notificarAdministradores(
    'Falha no Envio de Email',
    `Não foi possível enviar email para ${emailDestino}. Erro: ${error.message}`
  );
}
```

### Exemplo 15: Validação Antes do Envio

```typescript
async enviarEmailValidado(usuario: User, assunto: string, conteudo: string) {
  // Validações
  if (!usuario.email || !this.validarEmail(usuario.email)) {
    throw new Error('Email inválido');
  }

  if (!assunto || assunto.trim().length === 0) {
    throw new Error('Assunto não pode estar vazio');
  }

  if (!conteudo || conteudo.trim().length === 0) {
    throw new Error('Conteúdo não pode estar vazio');
  }

  // Verificar se o serviço está configurado
  if (!this.brevoService.isReady()) {
    throw new Error('Serviço de email não está configurado');
  }

  // Enviar email
  try {
    await this.brevoService.sendEmail({
      to: usuario.email,
      subject: assunto,
      html: conteudo,
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
}

private validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

---

## 🎯 Casos de Uso Reais

### Caso de Uso 1: Sistema de Ativação de Conta

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly mailService: MailService,
    private readonly brevoService: BrevoMailService,
  ) {}

  async registrarUsuario(dto: CreateUserDto) {
    // 1. Criar usuário no banco
    const usuario = await this.userRepository.create(dto);

    // 2. Gerar token de ativação
    const token = this.gerarTokenAtivacao();
    await this.saveActivationToken(usuario.id, token);

    // 3. Enviar email de ativação
    await this.brevoService.sendEmail({
      to: usuario.email,
      subject: '🎉 Bem-vindo à Revista DogCat!',
      html: this.templateAtivacao(usuario.name, token),
    });

    return usuario;
  }

  private templateAtivacao(nome: string, token: string): string {
    const url = `${process.env.FRONTEND_URL}/auth/activate?token=${token}`;
    return `
      <div style="font-family: Arial, sans-serif;">
        <h1>Bem-vindo, ${nome}! 🐶🐱</h1>
        <p>Clique no botão abaixo para ativar sua conta:</p>
        <a href="${url}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Ativar Conta
        </a>
      </div>
    `;
  }
}
```

### Caso de Uso 2: Notificação de Nova Publicação

```typescript
@Injectable()
export class PublicacaoService {
  constructor(private readonly brevoService: BrevoMailService) {}

  async publicarNovaEdicao(edicao: Edicao) {
    // 1. Publicar edição
    await this.edicaoRepository.publicar(edicao);

    // 2. Buscar usuários inscritos na newsletter
    const inscritos = await this.userRepository.findNewsletterSubscribers();

    // 3. Enviar notificação em lotes
    const batchSize = 100;
    for (let i = 0; i < inscritos.length; i += batchSize) {
      const batch = inscritos.slice(i, i + batchSize);

      await Promise.all(
        batch.map((usuario) =>
          this.brevoService.sendEmail({
            to: usuario.email,
            subject: `📚 Nova Edição: ${edicao.titulo}`,
            html: this.templateNovaEdicao(usuario, edicao),
          }),
        ),
      );

      // Delay entre lotes
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}
```

---

## 📊 Monitoramento

### Exemplo 16: Log de Envios

```typescript
async enviarComLog(usuario: User, assunto: string, conteudo: string) {
  const inicio = Date.now();

  try {
    await this.brevoService.sendEmail({
      to: usuario.email,
      subject: assunto,
      html: conteudo,
    });

    const duracao = Date.now() - inicio;

    // Registrar sucesso
    await this.emailLogRepository.create({
      destinatario: usuario.email,
      assunto: assunto,
      status: 'ENVIADO',
      duracao: duracao,
      timestamp: new Date(),
    });

  } catch (error) {
    // Registrar falha
    await this.emailLogRepository.create({
      destinatario: usuario.email,
      assunto: assunto,
      status: 'FALHOU',
      erro: error.message,
      timestamp: new Date(),
    });

    throw error;
  }
}
```

---

## 🔧 Configurações Avançadas

### Verificar Status do Serviço

```typescript
async verificarStatusEmail() {
  const config = this.brevoService.getConfig();

  return {
    configured: config.configured,
    provider: 'Brevo',
    senderEmail: config.senderEmail,
    senderName: config.senderName,
    ready: this.brevoService.isReady(),
  };
}
```

---

## 📝 Notas Importantes

1. **Limite de Envios**: Plano gratuito do Brevo permite 300 emails/dia
2. **Rate Limiting**: Adicione delays entre envios em massa
3. **Templates**: Prefira usar templates do Brevo para melhor manutenção
4. **Validação**: Sempre valide emails antes de enviar
5. **Monitoramento**: Use o dashboard do Brevo para acompanhar métricas
6. **Fallback**: Mantenha configuração SMTP para emergências

---

**Desenvolvido para Revista DogCat** 🐶🐱
