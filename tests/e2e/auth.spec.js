const { test, expect } = require('@playwright/test')

test.describe('Página de login', () => {
  test('exibe o formulário de login', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('h4')).toHaveText('Entrar')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="senha"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toHaveText('Entrar')
  })

  test('exibe erro ao tentar login com credenciais inválidas', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'invalido@test.com')
    await page.fill('input[name="senha"]', 'senhaerrada')
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]'),
    ])
    // Após o redirect, deve voltar para /auth/login
    await expect(page).toHaveURL(/\/auth\/login/)
    // Verifica que pelo menos um alerta de erro é visível (flash do backend)
    await expect(page.locator('.alert-danger').first()).toBeVisible()
  })

  test('rota /admin/dashboard redireciona para login sem autenticação', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
