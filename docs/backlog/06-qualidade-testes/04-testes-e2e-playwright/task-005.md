# TASK ID: E2E-005

## Título

Criar `tests/e2e/auth.spec.js` — fluxo de autenticação SSR

## Objetivo

Cobrir login com credenciais válidas e inválidas, logout, redirecionamento de rota protegida sem autenticação e persistência de sessão via cookie.

## Contexto

- Rota de login: `GET /auth/login` (formulário), `POST /auth/login` (submissão)
- Rota de logout: `POST /auth/logout` (limpa cookie e redireciona para `/auth/login`)
- Após login bem-sucedido: redireciona para `/admin/dashboard`
- Após login inválido: redireciona de volta para `/auth/login` com flash de erro
- `GET /admin/dashboard` sem cookie: redireciona para `/auth/login` (302 via browser = `page.url()` = login)
- Dados: usa seed E2E (`admin.e2e@test.com`, `gestor.e2e@test.com`, senha `senha123`)

## Arquivos envolvidos

- `tests/e2e/auth.spec.js` ← CRIAR

## Passos

### Criar `tests/e2e/auth.spec.js`

```js
const { test, expect } = require('@playwright/test')
const { loginAs } = require('./helpers/auth')
const { seedE2E, cleanE2E } = require('./setup/seed')

test.beforeAll(async () => {
  await seedE2E()
})

test.afterAll(async () => {
  await cleanE2E()
})

test('UC-A01 — página de login renderiza formulário', async ({ page }) => {
  await page.goto('/auth/login')
  await expect(page.locator('input[name="email"]')).toBeVisible()
  await expect(page.locator('input[name="senha"]')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toBeVisible()
})

test('UC-A02 — login com credenciais válidas (admin) redireciona para dashboard', async ({
  page,
}) => {
  await loginAs(page, 'admin.e2e@test.com', 'senha123')
  await expect(page).toHaveURL(/\/admin\/dashboard/)
})

test('UC-A03 — login com credenciais inválidas permanece em /auth/login', async ({
  page,
}) => {
  await loginAs(page, 'admin.e2e@test.com', 'senhaerrada')
  await expect(page).toHaveURL(/\/auth\/login/)
})

test('UC-A04 — login com credenciais inválidas exibe mensagem de erro', async ({
  page,
}) => {
  await page.goto('/auth/login')
  await page.fill('input[name="email"]', 'naoexiste@test.com')
  await page.fill('input[name="senha"]', 'qualquer')
  await page.click('button[type="submit"]')
  await expect(
    page.locator('text=/inválid|incorret|não encontrad/i'),
  ).toBeVisible()
})

test('UC-A05 — rota protegida sem autenticação redireciona para /auth/login', async ({
  page,
}) => {
  await page.goto('/admin/dashboard')
  await expect(page).toHaveURL(/\/auth\/login/)
})

test('UC-A06 — login com gestor redireciona para dashboard', async ({
  page,
}) => {
  await loginAs(page, 'gestor.e2e@test.com', 'senha123')
  await expect(page).toHaveURL(/\/admin\/dashboard/)
})

test('UC-A07 — logout limpa sessão e redireciona para /auth/login', async ({
  page,
}) => {
  await loginAs(page, 'admin.e2e@test.com', 'senha123')
  await expect(page).toHaveURL(/\/admin\/dashboard/)
  // Submete o formulário de logout (POST /auth/logout)
  await page.click(
    'button[data-action="logout"], form[action="/auth/logout"] button',
  )
  await expect(page).toHaveURL(/\/auth\/login/)
})

test('UC-A08 — após logout, /admin/dashboard redireciona para /auth/login', async ({
  page,
}) => {
  await loginAs(page, 'admin.e2e@test.com', 'senha123')
  await page.click(
    'button[data-action="logout"], form[action="/auth/logout"] button',
  )
  await page.goto('/admin/dashboard')
  await expect(page).toHaveURL(/\/auth\/login/)
})
```

## Critério de aceite

- UC-A02: URL contém `/admin/dashboard` após login válido
- UC-A03: URL permanece em `/auth/login` após login inválido
- UC-A04: mensagem de erro visível na página
- UC-A05: acesso direto a rota protegida redireciona para login
- UC-A07: após logout, URL é `/auth/login`
- UC-A08: cookie limpo — nova tentativa de `/admin/dashboard` redireciona novamente
