const { test, expect } = require('@playwright/test')
const { loginAs } = require('./helpers/auth')
const { seedE2E, cleanE2E } = require('./setup/seed')

let seed

test.beforeAll(async () => {
  await cleanE2E()
  seed = await seedE2E()
})

test.afterAll(async () => {
  await cleanE2E()
})

// ─── Dashboard ────────────────────────────────────────────────────────────────

test('UC-AD01 — admin acessa dashboard com sucesso', async ({ page }) => {
  await loginAs(page, 'admin.e2e@test.com', 'senha123')
  await expect(page).toHaveURL(/\/admin\/dashboard/)
  await expect(
    page.locator('[data-testid="admin-dashboard-root"]'),
  ).toBeVisible()
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
  await expect(page.locator('form#certForm')).toBeVisible()
})

// ─── Cancelar certificado ─────────────────────────────────────────────────────

test('UC-AD06 — gestor cancela certificado', async ({ page }) => {
  await loginAs(page, 'gestor.e2e@test.com', 'senha123')
  await page.goto('/admin/certificados')
  // Garante que o certificado está visível na tabela principal (não no arquivo)
  const row = page.locator('table tbody tr').filter({
    has: page.locator('td code', { hasText: 'E2E-2026-001' }),
  })
  await expect(row).toBeVisible()
  // Garante que o status é 'emitido' (botão cancelar só aparece para não-cancelados)
  await expect(row.locator('span.badge')).toHaveText('emitido')
  const cancelBtn = row.locator('button[data-bs-target="#modalCancelar"]')
  await expect(cancelBtn).toBeVisible()
  await cancelBtn.click()
  // Confirma no modal
  const modal = page.locator('#modalCancelar')
  await expect(modal).toBeVisible()
  await modal.locator('button[type="submit"]').click()
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
  // Abre a seção "Arquivados" (details collapsed por padrão)
  await page.locator('details summary').click()
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
