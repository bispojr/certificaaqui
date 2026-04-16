const { test, expect } = require('@playwright/test')
const { loginAs } = require('./helpers/auth')
const { seedE2E, cleanE2E } = require('./setup/seed')

test.describe('Dashboard Admin — cards de certificados', () => {
  test.beforeAll(async () => {
    await cleanE2E()
    await seedE2E()
  })

  test.afterAll(async () => {
    await cleanE2E()
  })

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin.e2e@test.com', 'senha123')
    await expect(page).toHaveURL(/\/admin\/dashboard/)
  })

  test('Exibe card Certificados', async ({ page }) => {
    const card = page.locator('a[href="/admin/certificados"] .card-label', {
      hasText: 'Certificados',
    })
    await expect(card).toBeVisible()
    // O número deve ser visível
    const value = card.locator('..').locator('.card-value.text-info')
    await expect(value).toBeVisible()
  })

  test('Exibe card Pendentes', async ({ page }) => {
    const card = page.locator('.card-label', { hasText: 'Pendentes' })
    await expect(card).toBeVisible()
    // O número deve ser visível
    const value = card.locator('..').locator('.card-value.text-warning')
    await expect(value).toBeVisible()
  })

  test('Links dos cards estão corretos', async ({ page }) => {
    const totalLink = page.locator(
      'a[href="/admin/certificados"] .card-label',
      { hasText: 'Certificados' },
    )
    await expect(totalLink).toBeVisible()
    const pendentesLink = page.locator(
      'a[href="/admin/certificados?status=pendente"] .card-label',
      { hasText: 'Pendentes' },
    )
    await expect(pendentesLink).toBeVisible()
  })

  test('Dashboard exibe 6 cards na mesma row', async ({ page }) => {
    // Seleciona todos os cards dentro da row principal do admin
    const cards = page.locator('.row.g-4 > div.col-12.col-sm-6.col-xl-4')
    await expect(cards).toHaveCount(6)
  })

  test('Layout não quebra em telas sm (responsivo)', async ({ page }) => {
    // Simula viewport de celular
    await page.setViewportSize({ width: 575, height: 900 })
    await page.goto('/admin/dashboard')
    // Todos os cards devem continuar visíveis
    const cards = page.locator('.row.g-4 > div.col-12.col-sm-6.col-xl-4')
    await expect(cards).toHaveCount(6)
    // Cards devem estar empilhados (não lado a lado)
    // Verifica se o topo do segundo card está abaixo do primeiro
    const box1 = await cards.nth(0).boundingBox()
    const box2 = await cards.nth(1).boundingBox()
    expect(box2.y).toBeGreaterThan(box1.y)
  })
})
