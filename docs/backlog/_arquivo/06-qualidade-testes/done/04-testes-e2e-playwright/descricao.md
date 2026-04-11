# FEATURE 6.4 — Testes E2E com Playwright

## Objetivo

Cobrir os fluxos de ponta a ponta do sistema via browser automatizado: fluxo público de consulta/validação, autenticação SSR e operações do painel admin, garantindo integração real entre frontend Handlebars e backend Express.

## Contexto

- Playwright opera contra servidor Express real iniciado antes da suíte
- Banco dedicado de testes (mesmo do Jest) — seeds via API ou SQL direto
- Cada `spec.js` é independente: seed próprio + cleanup no `afterAll`
- `loginAs(page, perfil)` simula login SSR e obtém cookie `token`
- `createViaApi(endpoint, payload)` cria fixtures via API REST (Bearer token admin)
- Estrutura de arquivos: `tests/e2e/`

## Casos de uso cobertos

| Spec              | Casos de uso                                                                        |
| ----------------- | ----------------------------------------------------------------------------------- |
| `publico.spec.js` | UC-P01–UC-P10: busca por e-mail, validação por código, PDF, certificado inexistente |
| `auth.spec.js`    | UC-A01–UC-A11: login, logout, tentativa inválida, redirecionamento por perfil       |
| `admin.spec.js`   | UC-AD01–UC-AD10: CRUD painel admin, RBAC visual por perfil                          |

## Tasks

| ID         | Arquivo(s)                                              | Descrição                                             |
| ---------- | ------------------------------------------------------- | ----------------------------------------------------- |
| ✅ E2E-001 | `playwright.config.js`                                  | Instalar `@playwright/test` e criar configuração base |
| ✅ E2E-002 | `tests/e2e/setup/seed.js`                               | Seed E2E com dados mínimos por perfil                 |
| ✅ E2E-003 | `tests/e2e/helpers/auth.js`, `tests/e2e/helpers/api.js` | Helpers `loginAs` e `createViaApi`                    |
| ✅ E2E-004 | `tests/e2e/publico.spec.js`                             | Fluxo público (busca, validação, PDF)                 |
| ✅ E2E-005 | `tests/e2e/auth.spec.js`                                | Fluxo de autenticação SSR                             |
| ✅ E2E-006 | `tests/e2e/admin.spec.js`                               | CRUD painel admin com RBAC                            |

## Dependências

### Externas

- `@playwright/test` instalado via `npm install --save-dev @playwright/test`
- `npx playwright install chromium` para instalar browser
- Servidor Express acessível localmente (porta configurável via `BASE_URL`)

### Internas

- **FEATURE 5.2** (dashboard admin) — `GET /admin/dashboard` deve existir
- **FEATURE 5.3** (fluxo público SSR) — `POST /public/pagina/buscar` e `/validar` devem existir
- **FEATURE 5.4** (certificados admin SSR) — `GET /admin/certificados` e CRUD devem existir
- **FEATURE 2.2** (authSSR) — rotas `/auth/login` e `/auth/logout` devem existir

## Status

⬜ 0/6 — Bloqueado pelas features 5.2, 5.3 e 5.4
