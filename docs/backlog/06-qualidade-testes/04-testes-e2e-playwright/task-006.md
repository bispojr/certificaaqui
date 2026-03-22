# TASK ID: E2E-006

## Título

Criar `tests/e2e/admin.spec.js` — CRUD painel admin com RBAC visual

## Objetivo

Cobrir os casos de uso do painel administrativo via browser: listagem, criação e cancelamento de certificados, acesso por perfil (admin vs gestor vs monitor) e verificação de restrições RBAC visíveis na interface.

## Contexto

- Rotas cobertas: `GET /admin/dashboard`, `GET /admin/certificados`, `GET /admin/certificados/novo`, `POST /admin/certificados`, `POST /admin/certificados/:id/cancelar`, `POST /admin/certificados/:id/restaurar`
- Restrições RBAC a verificar:
  - `GET /admin/usuarios` → 403 para gestor (página de erro ou redirect)
  - `POST /:id/restaurar` → não disponível para gestor (botão ausente ou 403)
  - `GET /admin/dashboard` com gestor → dashboard visível mas com escopo reduzido
- Helpers usados: `loginAs` do `tests/e2e/helpers/auth.js`
- Seed: `seedE2E()` cria todos os dados necessários incluindo certificado com código `E2E-2026-001`
- Cada teste usa `page` isolado (contexto fresh do Playwright) para evitar vazamento de cookie entre perfis

## Arquivos envolvidos

- `tests/e2e/admin.spec.js` ← CRIAR

## Passos

### Criar `tests/e2e/admin.spec.js`

```js
const { test, expect } = require('@playwright/test')
const { loginAs } = require('./helpers/auth')
const { seedE2E, cleanE2E } = require('./setup/seed')

let seed

test.beforeAll(async () => {
  seed = await seedE2E()
})

test.afterAll(async () => {
  await cleanE2E()
})

// ─── Dashboard ────────────────────────────────────────────────────────────────

test('UC-AD01 — admin acessa dashboard com sucesso', async ({ page }) => {
  await loginAs(page, 'admin.e2e@test.com', 'senha123')
  await expect(page).toHaveURL(/\/admin\/dashboard/)
  await expect(page.locator('text=/[Dd]ashboard/')).toBeVisible()
})

test('UC-AD02 — gestor acessa dashboard dentro do seu escopo', async ({
  page,
}) => {
  await loginAs(page, 'gestor.e2e@test.com', 'senha123')
  await expect(page).toHaveURL(/\/admin\/dashboard/)
})

// ─── Listagem de certificados ─────────────────────────────────────────────────

test('UC-AD03 — admin lista certificados', async ({ page }) => {
  await loginAs(page, 'admin.e2e@test.com', 'senha123')
  await page.goto('/admin/certificados')
  await expect(page.locator('text=E2E-2026-001')).toBeVisible()
})

test('UC-AD04 — gestor lista certificados do seu evento', async ({ page }) => {
  await loginAs(page, 'gestor.e2e@test.com', 'senha123')
  await page.goto('/admin/certificados')
  await expect(page).not.toHaveURL(/\/auth\/login/)
})

// ─── Formulário de novo certificado ──────────────────────────────────────────

test('UC-AD05 — admin acessa formulário de novo certificado', async ({
  page,
}) => {
  await loginAs(page, 'admin.e2e@test.com', 'senha123')
  await page.goto('/admin/certificados/novo')
  await expect(page.locator('form')).toBeVisible()
})

// ─── Cancelar certificado ─────────────────────────────────────────────────────

test('UC-AD06 — gestor cancela certificado', async ({ page }) => {
  await loginAs(page, 'gestor.e2e@test.com', 'senha123')
  await page.goto('/admin/certificados')
  // Clica no botão/link de cancelar para o certificado E2E-2026-001
  const cancelBtn = page
    .locator(`form[action*="/cancelar"] button, a[href*="/cancelar"]`)
    .first()
  await expect(cancelBtn).toBeVisible()
  await cancelBtn.click()
  await expect(page).not.toHaveURL(/error|500/)
})

// ─── Restaurar certificado — RBAC ────────────────────────────────────────────

test('UC-AD07 — gestor não vê botão de restaurar (somente admin)', async ({
  page,
}) => {
  await loginAs(page, 'gestor.e2e@test.com', 'senha123')
  await page.goto('/admin/certificados')
  // Botão de restaurar não deve existir para gestor
  const restaurarBtn = page.locator('form[action*="/restaurar"] button')
  await expect(restaurarBtn).not.toBeVisible()
})

test('UC-AD08 — admin vê e usa botão de restaurar', async ({ page }) => {
  await loginAs(page, 'admin.e2e@test.com', 'senha123')
  await page.goto('/admin/certificados')
  const restaurarBtn = page.locator('form[action*="/restaurar"] button').first()
  await expect(restaurarBtn).toBeVisible()
  await restaurarBtn.click()
  await expect(page).not.toHaveURL(/error|500/)
})

// ─── Restrição de /admin/usuarios ────────────────────────────────────────────

test('UC-AD09 — gestor não acessa /admin/usuarios (403)', async ({ page }) => {
  await loginAs(page, 'gestor.e2e@test.com', 'senha123')
  await page.goto('/admin/usuarios')
  // Deve receber 403 ou ser redirecionado — não chega na listagem
  const url = page.url()
  const has403 = await page
    .locator('text=/403|[Ff]orbidden|[Aa]cesso negado/')
    .isVisible()
  expect(has403 || !url.includes('/admin/usuarios')).toBe(true)
})

test('UC-AD10 — admin acessa /admin/usuarios com sucesso', async ({ page }) => {
  await loginAs(page, 'admin.e2e@test.com', 'senha123')
  await page.goto('/admin/usuarios')
  await expect(page).not.toHaveURL(/\/auth\/login/)
  await expect(page.locator('body')).toBeVisible()
})
```

## Critério de aceite

- UC-AD01/02: login com admin e gestor aterrissa em `/admin/dashboard`
- UC-AD03: certificado com código `E2E-2026-001` visível na listagem para admin
- UC-AD05: formulário de novo certificado abre sem erro
- UC-AD06: botão de cancelar existe e não gera erro 500
- UC-AD07: gestor não vê botão de restaurar
- UC-AD08: admin vê e consegue acionar restaurar
- UC-AD09: gestor recebe 403 ou é redirecionado ao tentar `/admin/usuarios`
- UC-AD10: admin acessa `/admin/usuarios` sem redirecionamento para login
