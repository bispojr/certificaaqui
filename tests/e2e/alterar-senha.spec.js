const { test, expect } = require('@playwright/test')
const { loginAs } = require('./helpers/auth')
const { seedE2E, cleanE2E } = require('./setup/seed')

test.describe('Alterar senha — perfil do usuário', () => {
  test.beforeAll(async () => {
    await cleanE2E()
    await seedE2E()
  })

  test.afterAll(async () => {
    await cleanE2E()
  })

  test('navbar exibe dropdown com opção "Alterar senha"', async ({ page }) => {
    await loginAs(page, 'admin.e2e@test.com', 'senha123')
    await expect(page).toHaveURL(/\/admin\//)

    const userDropdown = page.locator('#navbarUserMenu')
    await expect(userDropdown).toBeVisible()
    await userDropdown.click()

    const alterarSenhaLink = page.locator(
      'a[href="/admin/perfil/alterar-senha"]',
    )
    await expect(alterarSenhaLink).toBeVisible()
  })

  test('acessa formulário de alterar senha via dropdown', async ({ page }) => {
    await loginAs(page, 'admin.e2e@test.com', 'senha123')

    const userDropdown = page.locator('#navbarUserMenu')
    await userDropdown.click()
    await page.click('a[href="/admin/perfil/alterar-senha"]')

    await expect(page).toHaveURL(/\/admin\/perfil\/alterar-senha/)
    await expect(page.locator('input[name="senhaAtual"]')).toBeVisible()
    await expect(page.locator('input[name="novaSenha"]')).toBeVisible()
    await expect(page.locator('input[name="confirmarSenha"]')).toBeVisible()
  })

  test('botão salvar inicia desabilitado e habilita ao preencher senha válida', async ({
    page,
  }) => {
    await loginAs(page, 'admin.e2e@test.com', 'senha123')
    await page.goto('/admin/perfil/alterar-senha')

    const btnSalvar = page.locator('button[type="submit"]#btnSalvar')
    await expect(btnSalvar).toBeDisabled()

    await page.fill('input[name="novaSenha"]', 'Nova@1234!')
    await page.fill('input[name="confirmarSenha"]', 'Nova@1234!')

    await expect(btnSalvar).toBeEnabled()
  })

  test('exibe feedback visual ao digitar senha fraca', async ({ page }) => {
    await loginAs(page, 'admin.e2e@test.com', 'senha123')
    await page.goto('/admin/perfil/alterar-senha')

    await page.fill('input[name="novaSenha"]', 'fraca')

    // Requisito de tamanho mínimo deve aparecer como não satisfeito
    const reqTamanho = page.locator('#req-tamanho')
    await expect(reqTamanho).toContainText('8 caracteres')
    // Botão deve permanecer desabilitado
    await expect(page.locator('#btnSalvar')).toBeDisabled()
  })

  test('exibe erro quando as senhas não coincidem', async ({ page }) => {
    await loginAs(page, 'admin.e2e@test.com', 'senha123')
    await page.goto('/admin/perfil/alterar-senha')

    await page.fill('input[name="senhaAtual"]', 'senha123')
    await page.fill('input[name="novaSenha"]', 'Nova@1234!')
    await page.fill('input[name="confirmarSenha"]', 'Diferente@1!')

    const feedback = page.locator('#confirmarFeedback')
    await expect(feedback).toContainText('não coincidem')
    await expect(page.locator('#btnSalvar')).toBeDisabled()
  })

  test('altera senha com sucesso e redireciona para dashboard', async ({
    page,
  }) => {
    // Usa gestor para não conflitar com outras sessões
    await loginAs(page, 'gestor.e2e@test.com', 'senha123')
    await page.goto('/admin/perfil/alterar-senha')

    await page.fill('input[name="senhaAtual"]', 'senha123')
    await page.fill('input[name="novaSenha"]', 'Nova@1234!')
    await page.fill('input[name="confirmarSenha"]', 'Nova@1234!')

    await page.click('#btnSalvar')

    await expect(page).toHaveURL(/\/admin\/dashboard/)
    await expect(page.locator('.alert-success')).toContainText('sucesso')
  })

  test('exibe erro ao informar senha atual incorreta', async ({ page }) => {
    await loginAs(page, 'admin.e2e@test.com', 'senha123')
    await page.goto('/admin/perfil/alterar-senha')

    await page.fill('input[name="senhaAtual"]', 'SenhaErrada@9')
    await page.fill('input[name="novaSenha"]', 'Nova@1234!')
    await page.fill('input[name="confirmarSenha"]', 'Nova@1234!')

    await page.click('#btnSalvar')

    await expect(page).toHaveURL(/\/admin\/perfil\/alterar-senha/)
    await expect(page.locator('.alert-danger')).toContainText('incorreta')
  })

  test('redireciona para login ao tentar acessar sem autenticação', async ({
    page,
  }) => {
    await page.goto('/admin/perfil/alterar-senha')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
