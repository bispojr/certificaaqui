const { test, expect } = require('@playwright/test')
const { loginAs } = require('./helpers/auth')
const { seedE2E, cleanE2E } = require('./setup/seed')

const adminLinks = [
  { url: '/admin/dashboard', label: 'Dashboard' },
  { url: '/admin/certificados', label: 'Certificados' },
  { url: '/admin/participantes', label: 'Participantes' },
  { url: '/admin/eventos', label: 'Eventos' },
  { url: '/admin/tipos-certificados', label: 'Tipos' },
  { url: '/admin/usuarios', label: 'Usuários' },
]

test.describe('Navbar do Admin usa layout correto', () => {
  test.beforeAll(async () => {
    await seedE2E()
  })

  test.afterAll(async () => {
    await cleanE2E()
  })

  for (const { url, label } of adminLinks) {
    test(`Navbar preta presente em ${url}`, async ({ page }) => {
      await loginAs(page, 'admin.e2e@test.com', 'senha123')
      await page.goto(url)
      // Verifica se a navbar preta do admin está presente
      const navbar = page.locator('nav.navbar.navbar-dark.bg-dark')
      await expect(navbar).toBeVisible()
      // Verifica se o título contém "Admin"
      await expect(page).toHaveTitle(/Admin/)
      // Verifica se o link da navbar está presente
      await expect(
        navbar.locator(`a.nav-link:text-is("${label}")`),
      ).toBeVisible()
    })
  }
})
