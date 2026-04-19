const { test, expect } = require('@playwright/test')
const { loginAs } = require('./helpers/auth')
const { seedE2E, cleanE2E } = require('./setup/seed')

test.beforeAll(async () => {
  await cleanE2E()
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
  await expect(page).toHaveURL(/\/admin\/\d+/)
})

test('UC-A03 — login com credenciais inválidas permanece em /auth/login', async ({
  page,
}) => {
  await page.goto('/auth/login')
  await page.fill('input[name="email"]', 'admin.e2e@test.com')
  await page.fill('input[name="senha"]', 'senhaerrada')
  await page.click('button[type="submit"]')
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
    page.locator('text=/inválid|incorret|não encontrad/i').first(),
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
  await expect(page).toHaveURL(/\/gestor\/\d+/)
})

test('UC-A07 — logout limpa sessão e redireciona para /auth/login', async ({
  page,
}) => {
  await loginAs(page, 'admin.e2e@test.com', 'senha123')
  await expect(page).toHaveURL(/\/admin\/\d+/)
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
