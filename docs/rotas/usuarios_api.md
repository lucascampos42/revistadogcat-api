# Documentação da API de Usuários e Autenticação

Esta documentação descreve os endpoints para gerenciamento de usuários e autenticação.

**Prefixo das Rotas:** `/auth` e `/users`

---

## Modelo de Dados e Enums

### Objeto User (Resposta Pública)

Este é o objeto de usuário retornado na maioria das respostas da API.

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `userId` | `string` | Identificador único do usuário. |
| `userName` | `string` | Nome de usuário único. |
| `name` | `string` | Nome completo do usuário. |
| `email` | `string` | Endereço de e-mail do usuário. |
| `avatarUrl` | `string` | URL da imagem de perfil. |
| `role` | `Role` | Nível de acesso do usuário. |
| `active` | `boolean`| Se a conta do usuário está ativa. |
| `createdAt` | `string` | Data de criação da conta. |

### Enum: `Role`

| Valor | Descrição |
| --- | --- |
| `USUARIO` | Usuário padrão com acesso a conteúdo público. |
| `DONO_PET_APROVADO` | Dono de pet com cadastro verificado. |
| `ASSINANTE` | Usuário com assinatura premium ativa. |
| `DONO_PET_APROVADO_ASSINANTE` | Dono de pet verificado e assinante. |
| `EDITOR` | Permissão para criar e gerenciar artigos. |
| `ADMIN` | Acesso total ao sistema. |
| `FUNCIONARIO` | Acesso a funcionalidades internas específicas. |

---

## Endpoints de Autenticação (`/auth`)

### 1. Registrar Novo Usuário

- **Endpoint:** `POST /auth/register`
- **Descrição:** Cria uma nova conta de usuário. Um e-mail de ativação é enviado.
- **Corpo da Requisição:** `CreateUserDto` (contém `name`, `userName`, `email`, `password`, e campos opcionais como `cpf`, `telefone`).
- **Resposta (201 Created):** Objeto do usuário criado (sem dados sensíveis) e uma mensagem de sucesso.

### 2. Ativar Conta

- **Endpoint:** `POST /auth/activate`
- **Descrição:** Ativa a conta de um usuário usando o token enviado por e-mail.
- **Corpo da Requisição:** `{ "token": "activation-token-from-email" }`
- **Resposta (200 OK):** Mensagem de sucesso.

### 3. Login

- **Endpoint:** `POST /auth/login`
- **Descrição:** Autentica um usuário e retorna um par de tokens (acesso e refresh).
- **Corpo da Requisição:** `{ "identification": "user@email.com", "password": "user_password" }`
- **Resposta (200 OK):**
  ```json
  {
    "access_token": "...",
    "refresh_token": "...",
    "user": { ... } // Objeto User
  }
  ```

### 4. Renovar Token de Acesso

- **Endpoint:** `POST /auth/refresh`
- **Descrição:** Gera um novo `access_token` usando um `refresh_token` válido.
- **Corpo da Requisição:** `{ "refreshToken": "..." }`
- **Resposta (200 OK):** Novo par de `access_token` e `refresh_token`.

### 5. Obter Perfil do Usuário Logado

- **Endpoint:** `GET /auth/me`
- **Autenticação:** 🔒 Requer `access_token`.
- **Descrição:** Retorna os dados completos do usuário autenticado.
- **Resposta (200 OK):** Objeto `User`.

### 6. Logout

- **Endpoint:** `POST /auth/logout`
- **Autenticação:** 🔒 Requer `access_token`.
- **Descrição:** Invalida os tokens do usuário no servidor (incrementa `tokenVersion`).
- **Resposta (200 OK):** Mensagem de sucesso.

### 7. Esqueci Minha Senha

- **Endpoint:** `POST /auth/forgot-password`
- **Descrição:** Inicia o fluxo de redefinição de senha. Envia um token por e-mail.
- **Corpo da Requisição:** `{ "email": "user@email.com" }`
- **Resposta (200 OK):** Mensagem de sucesso.

### 8. Redefinir Senha

- **Endpoint:** `POST /auth/reset-password`
- **Descrição:** Define uma nova senha usando o token de redefinição.
- **Corpo da Requisição:** `{ "token": "...", "password": "new_password", "passwordConfirmation": "new_password" }`
- **Resposta (200 OK):** Mensagem de sucesso.

---

## Endpoints de Gerenciamento de Usuários (`/users`)

### 1. Listar Usuários

- **Endpoint:** `GET /users`
- **Autenticação:** 🔒 `ADMIN`
- **Descrição:** Retorna uma lista paginada de todos os usuários.
- **Query Params:** `page`, `limit`, `search`, `role`.
- **Resposta (200 OK):** Objeto de paginação com a lista de usuários.

### 2. Obter Usuário por ID

- **Endpoint:** `GET /users/{id}`
- **Autenticação:** 🔒 Requer `access_token`.
- **Descrição:** Retorna o perfil público de um usuário específico.
- **Resposta (200 OK):** Objeto `User`.

### 3. Atualizar Próprio Perfil

- **Endpoint:** `PATCH /users/profile`
- **Autenticação:** 🔒 Requer `access_token`.
- **Descrição:** Permite que o usuário autenticado atualize seu próprio perfil (`name`, `userName`, `telefone`, etc.).
- **Resposta (200 OK):** Objeto `User` atualizado.

### 4. Upload de Avatar

- **Endpoint:** `POST /users/avatar-upload`
- **Autenticação:** 🔒 Requer `access_token`.
- **Descrição:** Faz o upload de uma imagem de avatar para o usuário autenticado.
- **Corpo da Requisição:** `multipart/form-data` com o campo `avatar`.
- **Resposta (200 OK):** `{ "avatarUrl": "..." }`

### 5. Bloquear Usuário

- **Endpoint:** `PATCH /users/{id}/block`
- **Autenticação:** 🔒 `ADMIN`
- **Descrição:** Bloqueia a conta de um usuário.
- **Resposta (200 OK):** Objeto `User` atualizado.

### 6. Desbloquear Usuário

- **Endpoint:** `PATCH /users/{id}/unblock`
- **Autenticação:** 🔒 `ADMIN`
- **Descrição:** Desbloqueia a conta de um usuário.
- **Resposta (200 OK):** Objeto `User` atualizado.

### 7. Atualizar Role de Usuário

- **Endpoint:** `PATCH /users/{id}/role`
- **Autenticação:** 🔒 `ADMIN`
- **Descrição:** Altera o nível de acesso (role) de um usuário.
- **Corpo da Requisição:** `{ "role": "ASSINANTE" }`
- **Resposta (200 OK):** Objeto `User` atualizado.

---

## Tratamento de Erros de Autenticação (401 Unauthorized)

Quando uma requisição a um endpoint protegido falha, a API retorna uma das seguintes mensagens de erro para facilitar o tratamento no frontend:

| Mensagem | Causa Provável |
| --- | --- |
| `Token de acesso é obrigatório` | O header `Authorization` com o Bearer token não foi enviado. |
| `Token de acesso expirado` | O `access_token` enviado ultrapassou seu tempo de vida (ex: 15 minutos). |
| `Token de acesso inválido` | O token está malformado, com assinatura incorreta ou qualquer outro erro de validação. |
| `Token de acesso revogado` | O token é válido, mas sua versão (`tokenVersion`) não corresponde à do usuário no banco, indicando que um logout ou troca de senha ocorreu. |
| `Usuário associado ao token não foi encontrado` | O usuário referenciado no token foi deletado do sistema. |

---

## Guia de Integração Frontend (Fluxo de Tokens)

O fluxo recomendado permanece o mesmo: use o `access_token` para chamadas de API e o `refresh_token` para obter um novo `access_token` quando receber um erro `401 Unauthorized` com a mensagem `Token de acesso expirado`.
