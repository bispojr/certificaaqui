# TASK ID: E2E-003

## Título

Criar helpers `tests/e2e/helpers/auth.js` e `tests/e2e/helpers/api.js`

## Objetivo

Extrair lógica repetitiva de login SSR e criação de fixtures via API em helpers reutilizáveis por todos os spec files.

## Contexto

- `loginAs(page, email, senha)` navega para `/auth/login`, preenche o formulário e submete — após redirect, o cookie `token` estará armazenado no contexto do browser Playwright
- `loginAsPerfil(page, perfil, dados)` é um atalho que usa os dados do seed E2E
- `createViaApi(endpoint, payload, token)` usa `node-fetch` ou `http` nativo para POST à API REST — útil para criar fixture extra durante um teste sem abrir novo browser
- Ambos helpers recebem `baseURL` de `process.env.BASE_URL || 'http://localhost:3000'`

## Arquivos envolvidos

- `tests/e2e/helpers/auth.js` ← CRIAR
- `tests/e2e/helpers/api.js` ← CRIAR

## Passos

### Criar `tests/e2e/helpers/auth.js`

```js
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

/**
 * Realiza login SSR via formulário de /auth/login.
 * Após o login, o cookie 'token' fica armazenado no contexto do Playwright.
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} senha
 */
async function loginAs(page, email, senha) {
  await page.goto(`${BASE_URL}/auth/login`)
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="senha"]', senha)
  await page.click('button[type="submit"]')
  // Aguarda redirecionamento para o painel
  await page.waitForURL(/\/admin\/dashboard|\/auth\/login/)
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
```

### Criar `tests/e2e/helpers/api.js`

```js
const http = require('http')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

/**
 * Faz POST na API REST autenticada e retorna o corpo JSON da resposta.
 * @param {string} endpoint - ex: '/api/participantes'
 * @param {object} payload
 * @param {string} token - JWT Bearer
 * @returns {Promise<object>}
 */
function createViaApi(endpoint, payload, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload)
    const url = new URL(endpoint, BASE_URL)
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        Authorization: `Bearer ${token}`,
      },
    }
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          resolve(data)
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

module.exports = { createViaApi }
```

## Critério de aceite

- `loginAs(page, email, senha)` navega para `/auth/login`, preenche e submete o formulário
- Após `loginAs`, `page.url()` contém `/admin/` (login bem-sucedido) ou `/auth/login` (falha)
- `createViaApi('/api/participantes', { ... }, token)` retorna JSON com o registro criado
- Helpers importáveis como `require('../helpers/auth')` em qualquer spec file
