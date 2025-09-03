# Documentação da API de Autenticação

Esta documentação descreve os endpoints para autenticação de usuários.

**Prefixo da Rota:** `/auth`

---

## Modelo de Dados e Enums

### Objeto User (Resposta de Autenticação)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `userId` | `string` | Identificador único do usuário. |
| `userName` | `string` | Nome de usuário único. |
| `name` | `string` | Nome completo do usuário. |
| `email` | `string` | Endereço de e-mail do usuário. |
| `avatarUrl` | `string` | URL da imagem de perfil. |
| `role` | `Role` | Nível de acesso do usuário. |

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
- **Descrição:** Cria uma nova conta de usuário, que já nasce **ativa**.
- **Corpo da Requisição:** `CreateUserDto` (contendo `name`, `email`, `password`, etc.).
- **Resposta (201 Created):** Mensagem de sucesso e os dados do usuário criado.

### 2. Login

- **Endpoint:** `POST /auth/login`
- **Descrição:** Autentica um usuário e retorna um token de acesso e os dados do usuário.
- **Corpo da Requisição:** `{ "identification": "user@email.com", "password": "user_password" }`
- **Resposta (200 OK):**
  ```json
  {
    "access_token": "...",
    "user": { ... } // Objeto User (Resposta de Autenticação)
  }
  ```

### 3. Obter Perfil do Usuário Logado

- **Endpoint:** `GET /auth/me`
- **Autenticação:** 🔒 Requer `access_token`.
- **Descrição:** Retorna os dados básicos do usuário autenticado (os mesmos dados retornados no momento do login).
- **Resposta (200 OK):** Objeto `User` (Resposta de Autenticação).

### 4. Logout

- **Endpoint:** `POST /auth/logout`
- **Autenticação:** 🔒 Requer `access_token`.
- **Descrição:** Invalida o token de acesso atual no servidor. O cliente também deve remover o token localmente.
- **Resposta (200 OK):** Mensagem de sucesso.

### 5. Esqueci Minha Senha

- **Endpoint:** `POST /auth/forgot-password`
- **Descrição:** Inicia o fluxo de redefinição de senha. Envia um token por e-mail.
- **Corpo da Requisição:** `{ "email": "user@email.com" }`
- **Resposta (200 OK):** Mensagem de sucesso.

### 6. Redefinir Senha

- **Endpoint:** `POST /auth/reset-password`
- **Descrição:** Define uma nova senha usando o token de redefinição.
- **Corpo da Requisição:** `{ "token": "...", "password": "new_password", "passwordConfirmation": "new_password" }`
- **Resposta (200 OK):** Mensagem de sucesso.

---

## Tratamento de Erros de Autenticação (401 Unauthorized)

Quando uma requisição a um endpoint protegido falha, a API retorna uma das seguintes mensagens de erro para facilitar o tratamento no frontend:

| Mensagem | Causa Provável |
| --- | --- |
| `Token de acesso é obrigatório` | O header `Authorization` com o Bearer token não foi enviado. |
| `Token de acesso expirado` | O `access_token` enviado ultrapassou seu tempo de vida. O usuário precisa fazer login novamente. |
| `Token de acesso inválido` | O token está malformado ou com assinatura incorreta. |
| `Token de acesso revogado` | O token é válido, mas o usuário fez logout ou trocou a senha. O usuário precisa fazer login novamente. |
| `Usuário associado ao token não foi encontrado` | O usuário referenciado no token foi deletado do sistema. |

---

## Guia de Integração Frontend (Fluxo de Tokens)

Com a remoção do refresh token, o fluxo de autenticação foi simplificado:

1.  **Login:** Após o login, armazene o `access_token` de forma segura (ex: em memória ou `localStorage`).
2.  **Requisições:** Envie o `access_token` no cabeçalho `Authorization` de todas as requisições para endpoints protegidos (`Authorization: Bearer <token>`).
3.  **Token Expirado:** Se uma requisição retornar um erro `401 Unauthorized`, a sessão do usuário expirou. Você deve limpar o token armazenado e redirecionar o usuário para a tela de login.
4.  **Logout:** Ao fazer logout, chame o endpoint `POST /auth/logout` e remova o `access_token` do armazenamento local.
