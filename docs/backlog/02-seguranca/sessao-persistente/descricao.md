# Feature: Sessões Persistentes com `connect-pg-simple`

## ID da Feature

SEG-SES

## Domínio

Domínio 2 — Segurança

## Problema

`app.js` configura `express-session` sem `store` explícito, resultando em **MemoryStore** (padrão do express-session). O MemoryStore:

- Perde todas as sessões ao reiniciar o processo (deploy, crash)
- Não é compartilhável entre múltiplos workers (ex.: PM2 cluster, Docker replicas)
- Vaza memória proporcional ao número de sessões ativas

O PostgreSQL já é dependência do projeto — é a solução natural para persistência de sessões sem adicionar nova infraestrutura.

## Objetivo

Substituir MemoryStore por `connect-pg-simple` usando a conexão PostgreSQL já disponível. Garantir que as opções de cookie seguem boas práticas de segurança (httpOnly, sameSite, secure condicional).

## Arquivos envolvidos

- `package.json` ← adicionar dependência
- `app.js` ← configurar store e cookie options
- `migrations/20260411190000-create-user-sessions.js` ← criar tabela
- `.env.example` ← adicionar `DATABASE_URL`

## Tasks

- [SEG-SES-001](./task-001.md) — Instalar `connect-pg-simple` e criar migration da tabela `user_sessions`
- [SEG-SES-002](./task-002.md) — Configurar `express-session` com o novo store em `app.js`
- [SEG-SES-003](./task-003.md) — Configurar opções de cookie seguras em `app.js`
- [SEG-SES-004](./task-004.md) — Adicionar `DATABASE_URL` ao `.env.example` e garantir fallback em testes

## Critério de aceite da Feature

- `express-session` em `app.js` usa `connect-pg-simple` como store
- Tabela `user_sessions` existe no banco após migrations
- Cookie tem `httpOnly: true`, `sameSite: 'strict'`, `secure` ativo apenas em produção
- `npm run check` passa (testes usam fallback sem store PostgreSQL quando `DATABASE_URL` não está definido)
