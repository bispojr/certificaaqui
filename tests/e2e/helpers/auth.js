const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

/**
 * Realiza login SSR via formulário de /auth/login.
 * Após o login, o cookie 'token' fica armazenado no contexto do Playwright.
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} senha
 */
async function loginAs(page, email, senha) {
  // Limpa cookies para evitar loop de redirecionamento com token expirado/anterior
  await page.context().clearCookies()
  await page.goto(`${BASE_URL}/auth/login`)
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="senha"]', senha)
  await page.click('button[type="submit"]')
  // Aguarda redirecionamento para o painel no novo padrão /:papel/:id
  await page.waitForURL(/\/(admin|gestor|monitor)\/\d+/)
}

/**
 * Verifica se o usuário está autenticado buscando elemento exclusivo do painel.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
async function isAuthenticated(page) {
  return page.url().includes('/admin/')
}

module.exports = { loginAs, isAuthenticated }
