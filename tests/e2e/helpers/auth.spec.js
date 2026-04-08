const { test, expect } = require('@playwright/test')
const { loginAs, isAuthenticated } = require('./auth')
const { seedE2E, cleanE2E } = require('../setup/seed')

const adminEmail = 'admin.e2e@test.com'
const senha = 'senha123'

test.describe('auth helpers', () => {
  test.beforeAll(async () => {
    await cleanE2E()
    await seedE2E()
  })

  test('loginAs faz login SSR e redireciona para dashboard', async ({ page }) => {
    await loginAs(page, adminEmail, senha)
    expect(await isAuthenticated(page)).toBe(true)
    expect(page.url()).toContain('/admin/')
  })

  test('loginAs falha com senha errada', async ({ page }) => {
    await loginAs(page, adminEmail, 'errada')
    expect(await isAuthenticated(page)).toBe(false)
    expect(page.url()).toContain('/auth/login')
  })
})
