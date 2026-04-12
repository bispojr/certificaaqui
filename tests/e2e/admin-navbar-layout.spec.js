const { test, expect } = require('@playwright/test')
const { loginAs } = require('./helpers/auth')
const { seedE2E, cleanE2E } = require('./setup/seed')

const adminLinks = [
  { url: '/admin/certificados', label: 'Certificados' },
  { url: '/admin/participantes', label: 'Participantes' },
  { url: '/admin/eventos', label: 'Eventos' },
  { url: '/admin/tipos-certificados', label: 'Tipos' },
  { url: '/admin/usuarios', label: 'Usuários' },
]

test.describe('Navbar do Admin usa layout correto', () => {
  test.beforeAll(async () => {
    await cleanE2E()
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
      const navbar = page.locator('nav.navbar.navbar-light.bg-light')
      await expect(navbar).toBeVisible()
      // Verifica se o título contém "Admin"
      await expect(page).toHaveTitle(/Admin/)
      // Descobre e abre o dropdown correto antes de verificar o item
      let dropdownToggleSelector = null;
      if (["Certificados", "Tipos", "Pendentes"].includes(label)) {
        dropdownToggleSelector = 'a.nav-link.dropdown-toggle:text-is("Certificação")';
      } else if (["Eventos", "Participantes"].includes(label)) {
        dropdownToggleSelector = 'a.nav-link.dropdown-toggle:text-is("Eventos")';
      } else if (label === "Usuários") {
        dropdownToggleSelector = 'a.nav-link.dropdown-toggle:text-is("Administração")';
      }
      if (dropdownToggleSelector) {
        await navbar.locator(dropdownToggleSelector).click();
      }
      await expect(
        navbar.locator(`a.dropdown-item:text-is("${label}")`),
      ).toBeVisible()
    })
  }
})
