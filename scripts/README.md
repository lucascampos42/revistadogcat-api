# 🛠️ Scripts de Gerenciamento de Usuários

Scripts utilitários para gerenciar usuários da API Revista DogCat.

---

## 📋 Scripts Disponíveis

### 1. Verificar Usuário (`check`)

Verifica o status de um usuário e corrige problemas automaticamente.

**Uso:**

```bash
npm run user:check admin@admin.com
```

**O que faz:**

- ✅ Mostra todas as informações do usuário
- ✅ Detecta se está bloqueado
- ✅ Desbloqueia automaticamente se estiver bloqueado
- ✅ Reseta tentativas de login se necessário
- ✅ Testa a senha padrão ("Senha123")
- ✅ Mostra data de criação e último erro

**Exemplo de saída:**

```
🔍 Verificando usuário: admin@admin.com

📋 Informações do Usuário:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID:           cmgilujpb0000bsl0at150n6d
Nome:         Admin User
Email:        admin@admin.com
Username:     admin
Role:         ADMIN
Ativo:        ✅ Sim
Bloqueado:    ✅ Não
Tentativas:   0
Tem senha:    ✅ Sim
Criado em:    08/10/2025, 20:13:35
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Verificação concluída!
```

---

### 2. Resetar Senha (`reset`)

Reseta a senha de um usuário e desbloqueia a conta.

**Uso:**

```bash
npm run user:reset admin@admin.com NovaSenha123
```

**O que faz:**

- ✅ Define uma nova senha
- ✅ Desbloqueia a conta automaticamente
- ✅ Reseta tentativas de login
- ✅ Limpa data de bloqueio

**Exemplo de saída:**

```
🔑 Resetando senha para: admin@admin.com

✅ Senha resetada com sucesso!
   Nova senha: NovaSenha123
```

---

### 3. Listar Usuários (`list`)

Lista todos os usuários do sistema com seus status.

**Uso:**

```bash
npm run user:list
```

**O que mostra:**

- ✅ Status (Ativo, Bloqueado, Inativo)
- ✅ Email
- ✅ Role (papel)
- ✅ Tentativas de login

**Exemplo de saída:**

```
📋 Listando todos os usuários:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Ativo | admin@admin.com                | ADMIN           | Tentativas: 0
🔒 Bloqueado | user@example.com          | USUARIO         | Tentativas: 20
❌ Inativo | inactive@example.com         | USUARIO         | Tentativas: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total: 3 usuários
```

---

## 🚀 Uso Rápido

### Problema: Usuário Bloqueado

```bash
# Verificar e desbloquear automaticamente
npm run user:check usuario@example.com
```

### Problema: Esqueci a Senha

```bash
# Resetar para senha padrão
npm run user:reset usuario@example.com Senha123
```

### Problema: Conta não Funciona

```bash
# 1. Verificar o usuário
npm run user:check usuario@example.com

# 2. Se não tiver senha, resetar
npm run user:reset usuario@example.com Senha123

# 3. Tentar login novamente
```

---

## 🔍 Casos de Uso Comuns

### 1. Usuário Admin Não Consegue Logar

```bash
# Verificar o que está errado
npm run user:check admin@admin.com

# Se aparecer "Tem senha: ❌ Não", resetar:
npm run user:reset admin@admin.com Senha123

# Testar login com:
# Email: admin@admin.com
# Senha: Senha123
```

### 2. Conta Bloqueada por Tentativas

```bash
# O comando check já desbloqueia automaticamente
npm run user:check usuario@example.com

# Ou via API (requer autenticação de Admin):
# POST /users/{userId}/unblock
```

### 3. Verificar Todos os Usuários Bloqueados

```bash
npm run user:list
# Procure por linhas com 🔒 Bloqueado
```

---

## 📊 Status Possíveis

| Ícone | Status    | Descrição                        |
| ----- | --------- | -------------------------------- |
| ✅    | Ativo     | Usuário normal, pode fazer login |
| 🔒    | Bloqueado | Excedeu tentativas de login (20) |
| ❌    | Inativo   | Conta desativada manualmente     |

---

## 🔐 Sistema de Bloqueio

### Como Funciona

1. Usuário erra a senha **20 vezes**
2. Conta é **bloqueada por 15 minutos**
3. Campo `blocked` = `true`
4. Campo `loginAttempts` resetado para 0
5. Campo `blockedUntil` com data/hora do desbloqueio

### Desbloqueio Automático

- ✅ Após 15 minutos, o sistema permite login
- ✅ Campo `blocked` volta para `false`
- ✅ Tentativas resetadas

### Desbloqueio Manual

**Opção 1: Script (Recomendado)**

```bash
npm run user:check usuario@example.com
```

**Opção 2: API (Admin)**

```bash
POST /users/{userId}/unblock
Authorization: Bearer {admin-token}
```

**Opção 3: Frontend**

- Login como Admin
- Painel Admin → Usuários
- Editar usuário bloqueado
- Clicar em "🔓 Desbloquear Login"

---

## 🛡️ Segurança

### Senhas Padrão

⚠️ **IMPORTANTE:** Após resetar com senha padrão, o usuário deve alterá-la!

Senhas padrão comuns:

- `Senha123` - Para testes e desenvolvimento
- `Admin123` - Para contas admin (trocar imediatamente)

### Boas Práticas

1. ✅ Sempre use senhas fortes em produção
2. ✅ Force troca de senha no primeiro login
3. ✅ Não compartilhe senhas por email/chat
4. ✅ Use o sistema de bloqueio (20 tentativas)
5. ✅ Monitore tentativas de login suspeitas

---

## 🐛 Troubleshooting

### Erro: "Usuário não encontrado"

```bash
# Verificar se o email está correto
npm run user:list

# Procurar pelo email na lista
```

### Erro: "Cannot connect to database"

```bash
# Verificar se o .env está configurado
cat .env | grep DATABASE_URL

# Verificar se o banco está rodando
npx prisma studio
```

### Usuário Continua Bloqueado Após Check

```bash
# Forçar reset completo
npm run user:reset usuario@example.com NovaSenha123

# Isso limpa tudo: bloqueio, tentativas, senha
```

---

## 📝 Logs e Debug

### Ver Logs de Login

```bash
# Iniciar a aplicação em modo debug
npm run start:debug

# Filtrar logs de auth
docker logs revistadogcat-api | grep "auth"
```

### Ver Tentativas de Login no Banco

```bash
# Abrir Prisma Studio
npx prisma studio

# Navegar para tabela "User"
# Ordenar por "loginAttempts" (decrescente)
```

---

## 🔄 Manutenção

### Limpar Bloqueios Antigos

Execute periodicamente para limpar bloqueios expirados:

```bash
# Criar script de manutenção
npx prisma db execute --sql "
UPDATE User
SET blocked = false,
    blockedUntil = NULL
WHERE blocked = true
  AND blockedUntil < NOW()
"
```

### Monitorar Tentativas de Login

```bash
# Ver usuários com muitas tentativas
npm run user:list | grep "Tentativas: [5-9]"
npm run user:list | grep "Tentativas: 1[0-9]"
npm run user:list | grep "Tentativas: 20"
```

---

## 💡 Dicas

1. **Desbloqueio Rápido:** Use `npm run user:check` - é automático!
2. **Reset Rápido:** Use `npm run user:reset` com senha temporária
3. **Visualização:** Use `npm run user:list` para overview geral
4. **Em Produção:** Prefira usar a API `/users/:id/unblock`
5. **Logs:** Sempre verifique os logs após operações críticas

---

## 📞 Suporte

**Problemas com scripts?**

- Verifique se está na pasta correta: `revistadogcat-api/`
- Verifique se o `.env` está configurado
- Verifique se o banco está acessível

**Problemas com bloqueio?**

- Use `npm run user:check` primeiro
- Verifique o campo `blockedUntil`
- Use `npm run user:reset` se necessário

---

**Desenvolvido para Revista DogCat** 🐶🐱  
Janeiro 2025
