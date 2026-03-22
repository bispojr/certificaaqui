# Feature: Testes de Integração SSR (Rotas Admin e Públicas)

## Domínio
06 — Qualidade e Testes

## Objetivo
Criar testes de integração com supertest cobrindo as rotas SSR que ainda não possuem cobertura:
- `/auth/*` (login SSR, logout SSR)
- `/public/pagina/*` (fluxo público SSR: opcoes, buscar, validar)
- `/admin/*` (dashboard, certificados, participantes, eventos, tipos, usuários)

## Contexto técnico
- Padrão existente: `supertest(app)` + `setupFilesAfterEnv: ['tests/setup.js']` (DB real, migrations)
- Testes SSR verificam `res.status` e `res.text` (HTML) — não JSON
- Autenticação SSR: cookie `token=<JWT>` gerado manualmente no `beforeAll` do teste
  - `authSSR.js` (a criar em `02-ssr-cookie` TASK-002) lê `req.cookies.token`
  - Para simular: `.set('Cookie', 'token=<jwt>')` no supertest
- Flash messages: redirecionamentos com `302 + Location` — verificar via `res.header.location`
- Geração de JWT para cookie: `jwt.sign({ id, perfil }, JWT_SECRET)`
- Arquivos ficam em `tests/routes/` (project `routes` no jest.config.js)
- `res.locals.usuario` precisa de `{ isAdmin, isGestor }` — populado por `authSSR`; nos testes, o JWT injetado via cookie precisa ter `perfil` para o middleware derivar esses flags

## Estado atual
- `tests/routes/certificadosPublicViews.test.js` — cobre GET das views estáticas públicas ✅
- Nenhum teste cobre as rotas POST do fluxo público SSR
- Nenhum teste cobre `/auth/login`, `/auth/logout`
- Nenhum teste cobre `/admin/*`

## Tasks
- task-001: Criar `tests/routes/authSSR.test.js` — `GET /auth/login`, `POST /auth/login` (sucesso + credenciais inválidas), `POST /auth/logout`
- task-002: Criar `tests/routes/publicSSR.test.js` — `POST /public/pagina/buscar` e `POST /public/pagina/validar`
- task-003: Criar `tests/routes/adminDashboard.test.js` — `GET /admin/dashboard` por perfil (redirect sem auth, 200 admin, 200 gestor)
- task-004: Criar `tests/routes/adminCertificados.test.js` — `GET /admin/certificados`, `GET /admin/certificados/novo`, `POST /admin/certificados`, `POST /:id/cancelar`
- task-005: Criar `tests/routes/adminEntidades.test.js` — smoke tests para `/admin/participantes`, `/admin/eventos`, `/admin/tipos-certificados`, `/admin/usuarios`

## Dependências

### Externas (de outras features)
- **`02-ssr-cookie` TASK-002** — `authSSR.js` deve existir (os testes simulam o cookie que esse middleware lê)
- **`02-ssr-cookie` TASK-003/004** — `src/routes/auth.js` registrado em `app.js` para `AUTH-SSR` tests
- **`02-gestao-eventos` ADMIN-EVT-005/006** — `src/routes/admin.js` registrado em `app.js` para todos os testes admin
- **Feature `02-certificados-admin` CERT-ADMIN-005** — rotas de certificados em admin.js
- task-005 depende das rotas de participantes, eventos, tipos e usuários estarem em admin.js (features Domínio 4)

### Internas (ordem entre tasks desta feature)
- task-001, 002, 003, 004, 005 → independentes entre si (arquivos separados)
- task-003 pode ser executada antes de 004 e 005 (dashboard é independente)
