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
  await expect(page.locator('h1, h2, h3')).toBeVisible()
})

test('UC-P02 — busca de certificados por e-mail', async ({ page }) => {
  await page.goto('/')
  await page.fill('input[name="email"]', 'participante.e2e@test.com')
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]'),
  ])
  await expect(page.locator('text=Seus certificados')).toBeVisible()
  await expect(page.locator('text=Participante E2E')).toBeVisible()
})

test('UC-P03 — validação de certificado por código', async ({ page }) => {
  await page.goto('/public/pagina/validar')
  await page.fill('input[name="codigo"]', 'E2E-2026-001')
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]'),
  ])
  await expect(page.locator('text=Certificado Válido')).toBeVisible()
  await expect(page.locator('text=Participante E2E')).toBeVisible()
})

test('UC-P04 — exibe mensagem para certificado inválido', async ({ page }) => {
  await page.goto('/public/pagina/validar')
  await page.fill('input[name="codigo"]', 'CODIGO-INVALIDO')
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]'),
  ])
  await expect(
    page.locator('text=Nenhum certificado foi encontrado'),
  ).toBeVisible()
})
