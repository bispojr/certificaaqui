const { test, expect } = require('@playwright/test')
const { seedE2E, cleanE2E } = require('./setup/seed')

let seed

test.beforeAll(async () => {
  await cleanE2E()
  seed = await seedE2E()
})

test.afterAll(async () => {
  await cleanE2E()
})

test('UC-P01 — página inicial carrega sem erros', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/')
  await expect(page.locator('.brand-name')).toBeVisible()
})

test('UC-P02 — busca de certificados por e-mail', async ({ page }) => {
  await page.goto('/')
  await page.fill('input[name="email"]', 'participante.e2e@test.com')
  await page.click('button[type="submit"]')
  await expect(page.locator('text=Seus certificados')).toBeVisible()
  await expect(page.locator('text=Participante E2E').first()).toBeVisible()
})

test('UC-P03 — validação de certificado por código', async ({ page }) => {
  await page.goto('/validar')
  await page.fill('input[name="codigo"]', 'E2E-2026-001')
  await page.click('button[type="submit"]')
  await expect(page.locator('text=Certificado Válido')).toBeVisible()
  await expect(page.locator('dt:has-text("Participante") + dd')).toHaveText(
    'Participante E2E',
  )
  await expect(page.locator('text=Evento E2E')).toBeVisible()

  // Garante que o tipo de certificado aparece
  await expect(
    page.locator('dt:has-text("Tipo de Certificado") + dd'),
  ).toHaveText('Palestrante')

  // Assert formato amigável da data
  const dataText = await page
    .locator('dt:has-text("Emitido em") + dd')
    .textContent()
  // Exemplo: 02/05/26, 21h47, Horário de Brasília.
  expect(dataText).toMatch(
    /\d{2}\/\d{2}\/\d{2}, \d{2}h\d{2}, Horário de Brasília\./,
  )
})

test('UC-P04 — exibe mensagem para certificado inválido', async ({ page }) => {
  await page.goto('/validar')
  await page.fill('input[name="codigo"]', 'CODIGO-INVALIDO')
  await page.click('button[type="submit"]')
  await expect(
    page.locator('text=Nenhum certificado foi encontrado'),
  ).toBeVisible()
})
