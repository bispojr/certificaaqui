# Feature: Dashboard Administrativo

## Domínio

05 — Interface Web (SSR / Handlebars)

## Objetivo

Página inicial do painel admin com cards de contagens adaptados ao perfil do usuário autenticado:

- **admin**: 4 cards — total de Eventos, Tipos de Certificados, Participantes e Usuários
- **gestor/monitor**: 2 cards — Certificados emitidos e Participantes dos seus eventos vinculados

## Contexto técnico

- Layout: `views/layouts/admin.hbs` — rota de destino é `href='/admin/dashboard'` já presente na navbar
- `admin.hbs` usa `{{#if usuario.isAdmin}}` e `{{#if usuario.isGestor}}` — propriedades booleanas populadas por `authSSR.js` em `res.locals.usuario`
- `admin.hbs` flash: `{{#each flash.success}}` / `{{#each flash.error}}` (connect-flash retorna arrays)
- `req.usuario` populado por `authSSR.js` com `{ id, nome, email, perfil, isAdmin, isGestor }`
- Para gestor/monitor: re-buscar do DB com `include: [Evento as 'eventos']` para obter `eventoIds` escopados
- `src/routes/admin.js` criado por ADMIN-EVT-005 — esta feature apenas adiciona a rota dashboard
- Registro do `adminRouter` em `app.js` já coberto por ADMIN-EVT-006

## Estado atual

- Nenhum `dashboardController.js` existe
- Nenhuma `views/admin/dashboard.hbs` existe
- `src/routes/admin.js` a ser criado em ADMIN-EVT-005 (Domínio 4)

## Tasks

✅ task-001: Criar `src/controllers/dashboardController.js`
✅ task-002: Criar `views/admin/dashboard.hbs`

✅ task-003: Adicionar rota `GET /admin/dashboard` em `src/routes/admin.js`

## Dependências

### Externas (de outras features)

- **`02-ssr-cookie` TASK-002** — `src/middlewares/authSSR.js` deve existir antes de DASH-003; o controller acessa `req.usuario.perfil`
- **`02-gestao-eventos` ADMIN-EVT-005** — `src/routes/admin.js` deve existir antes de DASH-003
- **`02-gestao-eventos` ADMIN-EVT-006** — registra `adminRouter` em `app.js`; a rota `/admin/dashboard` só fica acessível após esse passo

### Internas (ordem entre tasks desta feature)

- DASH-001 e DASH-002 → independentes entre si
- DASH-003 → depende de DASH-001 (controller deve existir para ser importado) e de `src/routes/admin.js` existir (ADMIN-EVT-005)
