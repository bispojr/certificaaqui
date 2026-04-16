const { test, expect } = require('@playwright/test')
const { loginAs } = require('./helpers/auth')
const { seedE2E, cleanE2E } = require('./setup/seed')

// Teste E2E para cadastro de evento e exibição de mensagens de erro

test.describe('Admin - Cadastro de Evento', () => {
  test.beforeAll(async () => {
    await cleanE2E()
    await seedE2E()
  })

  test.afterAll(async () => {
    await cleanE2E()
  })

  test('exibe mensagem de erro ao tentar cadastrar evento inválido', async ({
    page,
  }) => {
    await loginAs(page, 'admin.e2e@test.com', 'senha123')
    await expect(page).toHaveURL(/\/admin\/dashboard/, {
      message: 'Login falhou — verificar seed no banco E2E',
    })
    await page.goto('/admin/eventos/novo')
    // Remove validação HTML5 para que o submit chegue ao servidor sem campos preenchidos
    await page.evaluate(() => {
      document
        .querySelector('form[enctype="multipart/form-data"]')
        .setAttribute('novalidate', '')
    })
    await page.click('button[type="submit"].btn-primary')
    // Espera mensagem de erro (flash)
    const flash = page.locator('.alert.alert-danger')
    await expect(flash).toBeVisible()
  })

  test('exibe mensagem de erro ao tentar cadastrar evento com código duplicado', async ({
    page,
  }) => {
    await loginAs(page, 'admin.e2e@test.com', 'senha123')
    await expect(page).toHaveURL(/\/admin\/dashboard/, {
      message: 'Login falhou — verificar seed no banco E2E',
    })
    await page.goto('/admin/eventos/novo')
    // Preenche e cadastra um evento válido
    await page.fill('input[name="nome"]', 'Congresso E2E')
    await page.fill('input[name="codigo_base"]', 'CNG')
    await page.fill('input[name="ano"]', '2026')
    await page.click('button[type="submit"].btn-primary')
    await expect(page).toHaveURL(/\/admin\/eventos/)
    // Tenta cadastrar outro evento com o mesmo código_base
    await page.goto('/admin/eventos/novo')
    await page.fill('input[name="nome"]', 'Outro Evento')
    await page.fill('input[name="codigo_base"]', 'CNG')
    await page.fill('input[name="ano"]', '2026')
    await page.click('button[type="submit"].btn-primary')
    // Espera mensagem de erro (flash)
    const flash = page.locator('.alert.alert-danger')
    await expect(flash).toBeVisible()
    await expect(flash).toContainText(/c[oó]digo base|duplicad|já existe/iu)
  })
})
