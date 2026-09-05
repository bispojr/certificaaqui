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

test('UC-A09 — login via API e SSR materializa a mesma identidade canônica na interface', async ({
  page,
  baseURL,
}) => {
  const response = await page.request.post('/usuarios/login', {
    data: { email: 'admin.e2e@test.com', senha: 'senha123' },
  })
  expect(response.ok()).toBeTruthy()
  const { token } = await response.json()

  await page.context().addCookies([
    {
      name: 'token',
      value: token,
      url: baseURL,
    },
  ])

  await page.goto('/admin/dashboard')
  await expect(page.locator('text=Admin E2E (admin)')).toBeVisible()
  await expect(
    page.locator('a.text-decoration-none[href="/admin/usuarios"]'),
  ).toBeVisible()

  await page.context().clearCookies()

  await loginAs(page, 'gestor.e2e@test.com', 'senha123')
  await expect(page.locator('text=Gestor E2E (gestor)')).toBeVisible()
  await expect(
    page.locator('a.text-decoration-none[href="/admin/usuarios"]'),
  ).toHaveCount(0)
  await expect(
    page.locator('a.text-decoration-none[href="/admin/tipos-certificados"]'),
  ).toBeVisible()
})
