const { test, expect } = require('@playwright/test')

// Teste para a página principal pública
// Verifica se o tema Brite está aplicado e a navbar tem texto preto

test('Layout público usa tema Brite e navbar com texto preto', async ({ page }) => {
  await page.goto('/')
  // Verifica se o link do tema Brite está presente
  const bootswatchLink = page.locator('link[href*="bootswatch@5.3.8/dist/brite/bootstrap.min.css"]')
  await expect(bootswatchLink).toHaveCount(1)
  await expect(bootswatchLink).toHaveAttribute('href', /bootswatch@5.3.8\/dist\/brite\/bootstrap\.min\.css/)

  // Verifica se a navbar tem fundo primário e texto preto
  const navbar = page.locator('nav.navbar.bg-primary')
  await expect(navbar).toBeVisible()
  // Os links devem ter texto preto
  const navLinks = navbar.locator('a.nav-link.text-black')
  await expect(navLinks).toHaveCount(3)
})

// Teste para a página principal do admin
const { loginAs } = require('./helpers/auth')
const { seedE2E, cleanE2E } = require('./setup/seed')

test.describe('Layout admin usa tema Brite e navbar com texto preto', () => {
  test.beforeAll(async () => {
    await cleanE2E()
    await seedE2E()
  })

  test.afterAll(async () => {
    await cleanE2E()
  })

  test('navbar admin com tema e links corretos', async ({ page }) => {
    await loginAs(page, 'admin.e2e@test.com', 'senha123')
    await page.goto('/admin/dashboard')
    // Verifica se o link do tema Brite está presente
    const bootswatchLink = page.locator('link[href*="bootswatch@5.3.8/dist/brite/bootstrap.min.css"]')
    await expect(bootswatchLink).toHaveCount(1)
    await expect(bootswatchLink).toHaveAttribute('href', /bootswatch@5.3.8\/dist\/brite\/bootstrap\.min\.css/)

    // Verifica se a navbar tem fundo claro e texto preto
    const navbar = page.locator('nav.navbar.navbar-expand-lg.navbar-light.bg-light')
    await expect(navbar).toBeVisible()
    // Os links devem ter texto preto (5 links: Certificados, Participantes, Eventos, Tipos, Usuários)
    const navLinks = navbar.locator('a.nav-link.text-black')
    await expect(navLinks).toHaveCount(3)
  })
})
