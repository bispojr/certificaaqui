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

  test('permite cadastrar e editar um evento configurando o tamanho da fonte do texto-base (texto_tamanho_fonte)', async ({
    page,
  }) => {
    await loginAs(page, 'admin.e2e@test.com', 'senha123')
    await expect(page).toHaveURL(/\/admin\/dashboard/)
    await page.goto('/admin/eventos/novo')

    await page.fill('input[name="nome"]', 'Evento Fonte E2E')
    await page.fill('input[name="codigo_base"]', 'FTE')
    await page.fill('input[name="ano"]', '2026')
    await page.fill('input[name="texto_tamanho_fonte"]', '16')
    await page.click('button[type="submit"].btn-primary')

    await expect(page).toHaveURL(/\/admin\/eventos/)

    // Localiza e clica no link de edição do evento recém-criado
    const row = page.locator('tr', { hasText: 'Evento Fonte E2E' })
    await row.locator('a', { hasText: 'Editar' }).click()

    await expect(page.locator('input[name="texto_tamanho_fonte"]')).toHaveValue(
      '16',
    )

    // Atualiza o tamanho da fonte para 18 e salva
    await page.fill('input[name="texto_tamanho_fonte"]', '18')
    await page.click('button[type="submit"].btn-primary')

    await expect(page).toHaveURL(/\/admin\/eventos/)

    // Reabre e confirma que o valor 18 foi persistido
    await page
      .locator('tr', { hasText: 'Evento Fonte E2E' })
      .locator('a', { hasText: 'Editar' })
      .click()
    await expect(page.locator('input[name="texto_tamanho_fonte"]')).toHaveValue(
      '18',
    )
  })

  test('permite cadastrar e editar um evento configurando a rotação da caixa de validação (validacao_rotacao)', async ({
    page,
  }) => {
    await loginAs(page, 'admin.e2e@test.com', 'senha123')
    await expect(page).toHaveURL(/\/admin\/dashboard/)
    await page.goto('/admin/eventos/novo')

    await page.fill('input[name="nome"]', 'Evento Rotação E2E')
    await page.fill('input[name="codigo_base"]', 'ROT')
    await page.fill('input[name="ano"]', '2026')
    await page.selectOption('select[name="validacao_rotacao"]', '90')
    await page.click('button[type="submit"].btn-primary')

    await expect(page).toHaveURL(/\/admin\/eventos/)

    // Localiza e clica no link de edição do evento recém-criado
    const row = page.locator('tr', { hasText: 'Evento Rotação E2E' })
    await row.locator('a', { hasText: 'Editar' }).click()

    await expect(page.locator('select[name="validacao_rotacao"]')).toHaveValue(
      '90',
    )

    // Atualiza a rotação para 180° e salva
    await page.selectOption('select[name="validacao_rotacao"]', '180')
    await page.click('button[type="submit"].btn-primary')

    await expect(page).toHaveURL(/\/admin\/eventos/)

    // Reabre e confirma que o valor 180° foi persistido
    await page
      .locator('tr', { hasText: 'Evento Rotação E2E' })
      .locator('a', { hasText: 'Editar' })
      .click()
    await expect(page.locator('select[name="validacao_rotacao"]')).toHaveValue(
      '180',
    )
  })
})
