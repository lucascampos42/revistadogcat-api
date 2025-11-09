# Revista DogCat API

API backend para plataforma de revista digital focada em pets, desenvolvida com [NestJS](https://nestjs.com/) e [Prisma](https://www.prisma.io/). A aplicação oferece um sistema completo de gestão de usuários com diferentes níveis de acesso específicos para o modelo de negócio de uma revista de pets.

Criado e mantido por [lucascampos42](https://github.com/lucascampos42).

## 🚀 Stack Tecnológica

### Core

- **[NestJS](https://nestjs.com/)** v11 - Framework Node.js progressivo com TypeScript
- **[Prisma](https://www.prisma.io/)** v6 - ORM de próxima geração com type-safety
- **[TypeScript](https://www.typescriptlang.org/)** v5 - Superset tipado do JavaScript
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional

### Autenticação & Segurança

- **[Passport](https://www.passportjs.org/)** - Middleware de autenticação
- **[JWT](https://jwt.io/)** - JSON Web Tokens para autenticação stateless
- **[bcrypt](https://www.npmjs.com/package/bcrypt)** - Hash de senhas
- **[@nestjs/throttler](https://www.npmjs.com/package/@nestjs/throttler)** - Rate limiting

### Validação & Transformação

- **[class-validator](https://www.npmjs.com/package/class-validator)** - Validação de DTOs
- **[class-transformer](https://www.npmjs.com/package/class-transformer)** - Transformação de objetos

### Documentação & API

- **[@nestjs/swagger](https://www.npmjs.com/package/@nestjs/swagger)** - Documentação OpenAPI
- **[@scalar/nestjs-api-reference](https://www.npmjs.com/package/@scalar/nestjs-api-reference)** - Interface moderna para documentação
- **[@compodoc/compodoc](https://www.npmjs.com/package/@compodoc/compodoc)** - Documentação do código

### E-mail & Notificações

- **[@nestjs-modules/mailer](https://www.npmjs.com/package/@nestjs-modules/mailer)** - Sistema de e-mail
- **[nodemailer](https://www.npmjs.com/package/nodemailer)** - Envio de e-mails

### Testes

- **[Jest](https://jestjs.io/)** - Framework de testes
- **[Supertest](https://www.npmjs.com/package/supertest)** - Testes de integração HTTP

### Desenvolvimento

- **[ESLint](https://eslint.org/)** - Linting de código
- **[Prettier](https://prettier.io/)** - Formatação de código
- **[Docker](https://www.docker.com/)** - Containerização (opcional)

## 🛠️ Tecnologias Utilizadas

### Core Technologies

- **Framework:** [NestJS](https://nestjs.com/) - Framework Node.js progressivo para construir aplicações server-side eficientes e escaláveis.
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/) - Superset do JavaScript que adiciona tipagem estática.
- **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) - Sistema de gerenciamento de banco de dados relacional.
- **ORM:** [Prisma](https://www.prisma.io/) - ORM de próxima geração para Node.js e TypeScript.

### Funcionalidades de Segurança

- **Autenticação:** Sistema completo com JWT (login, registro e refresh tokens)
- **Autorização:** RBAC com 5 roles específicos para revista de pets
- **Notificações de Segurança:** Alertas por e-mail para atividades suspeitas
- **Rate Limiting:** Proteção contra ataques de força bruta
- **Logs de Auditoria:** Rastreamento completo de ações dos usuários

### Qualidade e Desenvolvimento

- **Validação:** [class-validator](https://github.com/typestack/class-validator) e [class-transformer](https://github.com/typestack/class-transformer)
- **Documentação:** [Swagger](https://swagger.io/) com interface Scalar para documentação interativa
- **Testes:** [Jest](https://jestjs.io/) com cobertura de testes unitários e de integração
- **Linting:** [ESLint](https://eslint.org/) e [Prettier](https://prettier.io/) para qualidade de código
- **Containerização:** [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)

## 📋 Funcionalidades Principais

### Gestão de Usuários

- **Registro e Login:** Sistema completo de autenticação com JWT
- **Perfis de Usuário:** Diferentes tipos de usuários (comum, dono de pet, assinante, etc.)
- **Verificação de Conta:** Sistema de verificação por e-mail
- **Recuperação de Senha:** Reset seguro de senhas
- **Bloqueio/Desbloqueio:** Controle administrativo de contas

### Sistema de Roles Específico para Revista de Pets

- **5 Níveis de Acesso:** Desde usuário comum até admin
- **Controle Granular:** Permissões específicas por funcionalidade
- **Escalabilidade:** Sistema preparado para novos roles

### Segurança Avançada

- **Rate Limiting:** Proteção contra ataques automatizados
- **Logs de Auditoria:** Rastreamento completo de ações
- **Notificações de Segurança:** Alertas automáticos por e-mail
- **Validação Robusta:** DTOs com validação completa

### Ferramentas de Desenvolvimento

- **Docker:** Ambiente containerizado completo ([DOCKER.md](./DOCKER.md))
- **Cliente de API:** Coleção do [Bruno](https://www.usebruno.com/) para testes
- **Documentação Interativa:** Swagger com interface Scalar
- **Testes Automatizados:** Cobertura completa com Jest

## Como Começar

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (v20 ou superior)
- [Docker](https://www.docker.com/) (opcional, para rodar com Docker)
- [NPM](https://www.npmjs.com/)

### Instalação

1.  Clone o repositório:
    ```bash
    git clone <URL_DO_REPOSITORIO>
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```

### Configuração do Banco de Dados

1.  Copie o arquivo `.env.example` para `.env`:
    ```bash
    cp .env.example .env
    ```
2.  Adicione a sua URL de conexão do PostgreSQL no arquivo `.env`:
    ```
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
    ```
3.  Rode as migrações do Prisma para criar as tabelas no banco de dados:
    ```bash
    npx prisma migrate dev
    ```

## ⚙️ Configuração de Ambiente

### Variáveis de Ambiente

O projeto utiliza diferentes arquivos de configuração para cada ambiente:

- **`.env`** - Desenvolvimento local
- **`.env.test`** - Testes automatizados
- **`.env.docker`** - Ambiente Docker

### Principais Variáveis

```bash
# Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# JWT
JWT_SECRET="seu-jwt-secret-super-seguro"
JWT_TTL="15m"                    # Token de acesso
JWT_REFRESH_SECRET="refresh-secret"
JWT_REFRESH_TTL="7d"             # Token de refresh

# E-mail
EMAIL_ENABLED=true               # Ativar/desativar envio de e-mails
MAIL_HOST="smtp.gmail.com"
MAIL_PORT=587
MAIL_USER="seu-email@gmail.com"
MAIL_PASS="sua-senha-de-app"
MAIL_FROM="noreply@seudominio.com"

# Rate Limiting
THROTTLE_TTL=60                  # Janela de tempo (segundos)
THROTTLE_LIMIT=10                # Máximo de requests por janela

# Aplicação
PORT=3099
NODE_ENV="development"
```

### Configuração de E-mail

Para configurar o envio de e-mails:

1. **Gmail:** Use senhas de aplicativo (App Passwords)
2. **Outros provedores:** Configure SMTP conforme documentação
3. **Desenvolvimento:** Defina `EMAIL_ENABLED=false` para desabilitar

### Segurança

⚠️ **Importante:**

- Nunca commite arquivos `.env` com dados sensíveis
- Use senhas fortes para JWT secrets
- Configure rate limiting adequadamente
- Use HTTPS em produção

### Populando o Banco de Dados (Seeding)

Este projeto inclui um script de seed para popular o banco de dados com dados iniciais. Atualmente, ele cria um usuário administrador padrão.

Para rodar o script de seed, execute o seguinte comando:

```bash
npm run seed
```

O usuário administrador será criado com as seguintes credenciais:

- **E-mail:** `admin@admin.com`
- **Senha:** `12345678`
- **Role:** `ADMIN`

### Roles Disponíveis

O sistema possui 5 tipos de usuários com diferentes níveis de acesso:

- **`USUARIO_COMUM`** - Usuários básicos da plataforma (role padrão)
- **`DONO_PET_CADASTRADO`** - Donos de pet que se cadastraram na plataforma
- **`ASSINANTE`** - Usuários com assinatura ativa da revista
- **`DONO_PET_APROVADO_ASSINANTE`** - Donos de pet aprovados com assinatura premium
- **`ADMIN`** - Administradores do sistema com acesso total

## 🚀 Comandos Disponíveis

### Desenvolvimento

```bash
# Iniciar em modo de desenvolvimento (com hot reload)
npm run start:dev

# Iniciar em modo debug
npm run start:debug

# Iniciar aplicação + documentação simultaneamente
npm run start:all

# Build para produção
npm run build

# Iniciar versão de produção
npm run start:prod
```

### Banco de Dados

```bash
# Executar migrações
npx prisma migrate dev

# Executar migrações para ambiente de teste
npm run test:migrate

# Popular banco com dados iniciais
npm run seed

# Visualizar banco de dados (Prisma Studio)
npx prisma studio

# Gerar cliente Prisma após mudanças no schema
npx prisma generate
```

### Qualidade de Código

```bash
# Executar linting
npm run lint

# Formatar código
npm run format

# Gerar documentação do código
npm run compodoc
```

### Docker (Opcional)

```bash
# Construir e iniciar containers
docker-compose up --build

# Iniciar containers em background
docker-compose up -d

# Parar containers
docker-compose down
```

A aplicação estará disponível em `http://localhost:3099`.

## Notificações de Segurança

O sistema inclui notificações automáticas por e-mail para eventos de segurança importantes:

### Tipos de Alertas

- **Login Suspeito:** Detecta logins após longos períodos de inatividade (30+ dias)
- **Múltiplas Tentativas de Login:** Alerta a partir da 3ª tentativa de login falhada
- **Conta Bloqueada:** Notifica quando a conta é temporariamente bloqueada por excesso de tentativas

### Configuração

As notificações são controladas pela variável de ambiente `EMAIL_ENABLED` no arquivo `.env`:

```env
# Controla o envio de e-mails (ativação de conta e notificações de segurança)
EMAIL_ENABLED=true
```

### Personalização

Os templates de e-mail estão localizados em `src/core/mail/templates/` e podem ser customizados conforme necessário.

## 🔐 Sistema de Roles e Permissões

### Hierarquia de Acesso

O sistema implementa um controle de acesso baseado em roles (RBAC) específico para o modelo de negócio de uma revista de pets:

```
ADMIN (Acesso Total)
├── Gerenciar todos os usuários
├── Bloquear/desbloquear contas
├── Alterar roles de usuários
├── Acesso a logs do sistema
└── Todas as funcionalidades da plataforma

DONO_PET_APROVADO_ASSINANTE (Premium)
├── Conteúdo exclusivo para assinantes
├── Funcionalidades premium
├── Perfil verificado como dono de pet
└── Benefícios de assinante

ASSINANTE (Assinatura Ativa)
├── Conteúdo exclusivo para assinantes
├── Funcionalidades premium
└── Acesso prioritário

DONO_PET_CADASTRADO (Verificado)
├── Funcionalidades básicas
├── Perfil verificado como dono de pet
└── Conteúdo público

USUARIO_COMUM (Padrão)
├── Funcionalidades básicas
├── Conteúdo público
└── Acesso limitado
```

### Implementação Técnica

- **Guards:** `@Roles()` decorator para proteger endpoints
- **Middleware:** Verificação automática de permissões
- **DTOs:** Validação de roles em requests
- **Database:** Enum `Role` no Prisma schema

### Exemplos de Uso

```typescript
// Endpoint apenas para administradores
@Roles(Role.ADMIN)
@Get('users')
findAllUsers() { ... }

// Endpoint para assinantes e admins
@Roles(Role.ASSINANTE, Role.DONO_PET_APROVADO_ASSINANTE, Role.ADMIN)
@Get('premium-content')
getPremiumContent() { ... }
```

## 🏗️ Arquitetura do Projeto

### Estrutura de Pastas

```
src/
├── application/              # Módulos de aplicação
│   ├── auth/                # Autenticação e autorização
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── entities/        # Entidades de domínio
│   │   ├── strategies/      # Estratégias JWT
│   │   └── repositories/    # Repositórios de auth
│   ├── user/                # Gestão de usuários
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.module.ts
│   │   ├── dto/             # DTOs do usuário
│   │   ├── entities/        # Entidades do usuário
│   │   ├── mappers/         # Mapeadores de dados
│   │   └── repositories/    # Repositórios
│   └── home/                # Endpoint de saúde
├── core/                     # Funcionalidades centrais
│   ├── config/              # Configurações da aplicação
│   ├── decorators/          # Decorators customizados (@Roles)
│   ├── dto/                 # DTOs base
│   ├── entities/            # Entidades base
│   ├── exceptions/          # Exceções customizadas
│   ├── filters/             # Exception filters
│   ├── guards/              # Guards de autenticação/autorização (RolesGuard)
│   ├── interceptors/        # Interceptors
│   ├── interfaces/          # Interfaces compartilhadas
│   ├── mail/                # Sistema de e-mail
│   ├── middleware/          # Middlewares (UserActionLogger)
│   ├── utils/               # Utilitários
│   └── validators/          # Validadores customizados
├── shared/                   # Utilitários compartilhados
│   ├── constants/           # Constantes
│   ├── enums/               # Enumerações (Role enum)
│   ├── interfaces/          # Interfaces
│   └── utils/               # Funções utilitárias
├── prisma/                   # Configuração do Prisma
│   ├── migrations/          # Migrações do banco
│   └── schema.prisma        # Schema do banco (com roles)
└── main.ts                   # Ponto de entrada da aplicação
```

### Princípios Arquiteturais

- **🏛️ Clean Architecture:** Separação clara entre camadas
- **📦 Modularidade:** Cada feature é um módulo independente
- **🔄 Repository Pattern:** Abstração da camada de dados
- **🛡️ SOLID Principles:** Código maintível e extensível
- **🎯 Domain-Driven Design:** Foco no domínio do negócio
- **🔒 Security First:** Segurança em todas as camadas

### Fluxo de Dados

```
Client Request → Controller → Service → Repository → Database
                     ↓
              Guards/Interceptors
                     ↓
              Exception Filters
                     ↓
               Response
```

## 🧪 Testes

O projeto possui uma suíte completa de testes unitários e de integração (e2e) usando Jest.

### Configuração para Testes E2E

Antes de executar os testes e2e, certifique-se de:

1. **Configurar banco de dados de teste:**

   ```bash
   # Copiar arquivo de configuração de teste
   cp .env.example .env.test

   # Editar .env.test com URL do banco de teste
   # DATABASE_URL="postgresql://user:password@localhost:5432/nest_test"
   ```

2. **Executar migrações no banco de teste:**
   ```bash
   npm run test:migrate
   ```

### Comandos de Teste

```bash
# Executar todos os testes unitários
npm run test

# Executar testes em modo watch (re-executa ao salvar)
npm run test:watch

# Executar testes com relatório de cobertura
npm run test:cov

# Executar testes em modo debug
npm run test:debug

# Executar testes end-to-end (e2e)
npm run test:e2e
```

### Estrutura de Testes

```
test/
├── app.e2e-spec.ts          # Testes da aplicação principal
├── auth.e2e-spec.ts         # Testes de autenticação
├── user.e2e-spec.ts         # Testes de usuários
├── jest-e2e.json            # Configuração Jest para e2e
├── setup-e2e.ts             # Setup global para testes e2e
└── test-app.module.ts       # Módulo de teste

src/
└── **/*.spec.ts              # Testes unitários (ao lado dos arquivos)
```

### Cobertura de Testes

O projeto mantém alta cobertura de testes:

- **Testes Unitários:** Services, Repositories, Guards, Interceptors
- **Testes E2E:** Endpoints da API, Autenticação, Autorização
- **Mocks:** Banco de dados, E-mail, Serviços externos

### Executando Testes em CI/CD

```bash
# Comando completo para pipeline CI/CD
npm run lint && npm run test:cov && npm run test:e2e
```

## 📚 Documentação

### Principais Endpoints da API

#### Autenticação

- **POST** `/auth/login` - Fazer login (retorna tokens + dados do usuário)
- **POST** `/auth/register` - Registrar novo usuário
- **POST** `/auth/refresh` - Renovar tokens (retorna tokens + dados do usuário)
- **GET** `/auth/me` - **Obter perfil do usuário autenticado** 🔐
- **POST** `/auth/logout` - Fazer logout
- **POST** `/auth/forgot-password` - Solicitar redefinição de senha
- **POST** `/auth/reset-password` - Redefinir senha
- **POST** `/auth/activate` - Ativar conta
- **POST** `/auth/resend-activation` - Reenviar email de ativação

#### Usuários

- **GET** `/users` - Listar usuários (Admin)
- **GET** `/users/:id` - Obter usuário por ID
- **PUT** `/users/:id` - Atualizar usuário
- **DELETE** `/users/:id` - Excluir usuário

> 🔐 **Rota de Perfil:** Use `GET /auth/me` com token Bearer para obter os dados completos do usuário autenticado (userId, userName, name, email, role, avatarUrl).

### Documentação da API (OpenAPI/Swagger)

O projeto gera automaticamente documentação da API usando OpenAPI 3.0 com interface moderna do Scalar.

**Acessar a documentação:**

- **Desenvolvimento:** `http://localhost:3099/docs`
- **Produção:** `https://seu-dominio.com/docs`

**Características:**

- 📋 Documentação automática de todos os endpoints
- 🔧 Interface interativa para testar APIs
- 📝 Schemas de request/response detalhados
- 🔐 Suporte para autenticação JWT
- 📱 Interface responsiva e moderna

### Documentação do Código

Utilizamos [Compodoc](https://compodoc.app/) para gerar documentação automática dos módulos, serviços e controladores.

```bash
# Gerar documentação estática
npx compodoc -p tsconfig.json

# Gerar e servir documentação (modo watch)
npm run compodoc

# Iniciar app + documentação simultaneamente
npm run start:all
```

**A documentação inclui:**

- 🏗️ Arquitetura e estrutura dos módulos
- 📊 Gráficos de dependências
- 📖 Documentação de classes e métodos
- 🔍 Busca integrada
- 📈 Métricas de cobertura

### Cliente de API (Bruno)

O projeto inclui uma coleção completa do [Bruno](https://www.usebruno.com/) para testar a API:

```
bruno/
├── auth/                     # Endpoints de autenticação
│   ├── login.bru
│   ├── register.bru
│   ├── forgot-password.bru
│   └── reset-password.bru
├── users/                    # Endpoints de usuários
│   ├── get-all-users.bru
│   ├── get-user-by-id.bru
│   ├── update-user.bru
│   └── delete-user.bru
└── environments/             # Configurações de ambiente
    ├── local.bru
    └── docker.bru
```

**Para usar:**

1. Instale o [Bruno](https://www.usebruno.com/)
2. Abra a pasta `bruno/` no Bruno
3. Configure o ambiente (local/docker)
4. Execute as requisições

## Licença

Este projeto é licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.
