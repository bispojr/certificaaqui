# Feature: Autenticação SSR (Cookie-based)

## Descrição

Login via formulário web, token JWT armazenado em cookie `httpOnly`, redirecionamento pós-login e limpeza de cookie no logout.

## Tasks implementadas

- ✅ `express-session` e `connect-flash` configurados em `app.js`

## Tasks pendentes

- ⬜ [TASK-001] Criar `views/auth/login.hbs` — formulário de login com suporte a flash messages
- ⬜ [TASK-002] Criar `src/middlewares/authSSR.js` — lê cookie `token`, verifica JWT, popula `req.usuario` e `res.locals.usuario`
- ⬜ [TASK-003] Criar `src/routes/auth.js` — `GET /auth/login`, `POST /auth/login`, `POST /auth/logout`
- ⬜ [TASK-004] Registrar rota `/auth` no `app.js`

## Dependências

### Externas (de outras features)

Nenhuma — esta feature é pré-requisito para todas as features SSR do Domínio 4.

> **BLOQUEANTE:** `src/middlewares/authSSR.js` (TASK-002) é exigido por todas as features de gestão admin (Domínio 4). Execute esta feature antes de qualquer feature do Domínio 4.

### Internas (ordem entre tasks desta feature)

- 001 → 002 → 003 → 004 (sequencial)
- TASK-002 precisa da view criada em TASK-001 para redirecionar o login; TASK-003 usa `authSSR` de TASK-002; TASK-004 registra a rota de TASK-003 no `app.js`.
