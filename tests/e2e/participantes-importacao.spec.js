const { test, expect } = require('@playwright/test')
const { loginAs } = require('./helpers/auth')
const { seedE2E, cleanE2E } = require('./setup/seed')

test.describe('Importacao em massa de participantes (SSR)', () => {
  test.beforeAll(async () => {
    await cleanE2E()
    await seedE2E()
  })

  test.afterAll(async () => {
    await cleanE2E()
  })

  test('admin importa por colagem com sucesso parcial', async ({ page }) => {
    await loginAs(page, 'admin.e2e@test.com', 'senha123')
    await page.goto('/admin/participantes')
    await page.click('a:has-text("+ Em lote")')
    await expect(page).toHaveURL(/.*\/admin\/participantes\/importar/)

    await page.fill('input[name="evento_id"]', '1')
    await page.selectOption('select[name="origem"]', 'colado')
    await page.fill(
      'textarea[name="conteudo"]',
      [
        'nomeCompleto\temail\tinstituicao',
        'Novo E2E\tnovo.e2e@test.com\tIFSP',
        'Linha Ruim\tnao-email\tUSP',
      ].join('\n'),
    )

    await page.click('button:has-text("Importar")')

    await expect(page.locator('text=Importação concluída')).toBeVisible()
    await expect(page.locator('text=1 participantes criados')).toBeVisible()
    await expect(page.locator('text=1 falhas')).toBeVisible()
    await expect(page.locator('text=Linha 2')).toBeVisible()
    await expect(page.locator('text=email inválido')).toBeVisible()

    await page.goto('/admin/participantes')
    await expect(page.locator('table tbody')).toContainText('Novo E2E')
  })
})
