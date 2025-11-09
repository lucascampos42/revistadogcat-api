# API do Dashboard

Este documento detalha o endpoint da API para obter os dados do dashboard.

## Obter Dados do Dashboard

Recupera um conjunto de dados agregados para exibição no painel de controle administrativo.

- **URL:** `/dashboard`
- **Método:** `GET`
- **Autenticação:** Requer um token JWT de portador no cabeçalho `Authorization`.

### Estrutura da Resposta

A resposta é um objeto JSON que contém três propriedades principais: `cards`, `monthlyGrowth` e `userDistribution`.

```json
{
  "cards": {
    "totalUsuarios": {
      "value": 1500,
      "percentage": 15.5
    },
    "artigosPublicados": {
      "value": 250,
      "percentage": 5.2
    },
    "assinantesAtivos": {
      "value": 300,
      "percentage": -2.1
    },
    "visualizacoes": {
      "value": 120500,
      "percentage": 25.0
    }
  },
  "monthlyGrowth": [
    {
      "month": "Janeiro",
      "year": 2024,
      "count": 120
    },
    {
      "month": "Fevereiro",
      "year": 2024,
      "count": 135
    }
  ],
  "userDistribution": [
    {
      "role": "USUARIO",
      "count": 1100
    },
    {
      "role": "ASSINANTE",
      "count": 300
    },
    {
      "role": "ADMIN",
      "count": 5
    }
  ]
}
```

### Detalhes dos Campos da Resposta

#### `cards`
Um objeto contendo as métricas principais para os cards do dashboard. Cada métrica possui:
- `value`: O valor total absoluto da métrica.
- `percentage`: A variação percentual em relação ao mês anterior.

#### `monthlyGrowth`
Um array de objetos, cada um representando o crescimento de novos usuários em um mês específico nos últimos 12 meses.
- `month`: O nome do mês.
- `year`: O ano.
- `count`: O número de novos usuários registrados naquele mês.

#### `userDistribution`
Um array de objetos que mostra a distribuição de usuários por perfil (`role`).
- `role`: O nome do perfil (ex: `USUARIO`, `ASSINANTE`, `ADMIN`).
- `count`: O número total de usuários com aquele perfil.
