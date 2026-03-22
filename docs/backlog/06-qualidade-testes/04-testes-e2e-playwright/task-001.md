# TASK ID: E2E-001

## Título

Instalar `@playwright/test` e criar `playwright.config.js`

## Objetivo

Configurar o ambiente Playwright no projeto: instalar a dependência, criar o arquivo de configuração base e registrar o script `test:e2e` no `package.json`.

## Contexto

- O projeto usa Jest para testes unitários e de integração — Playwright é adicionado como runner E2E separado, sem interferir no Jest
- `playwright.config.js` na raiz do projeto, apontando para `tests/e2e/`
- `BASE_URL` lida de `process.env.BASE_URL` com fallback para `http://localhost:3000`
- Apenas Chromium é necessário (projeto acadêmico)
- `webServer` do Playwright inicia o Express automaticamente antes da suíte se o servidor não estiver rodando

## Arquivos envolvidos

- `package.json` ← EDITAR (adicionar `test:e2e` em scripts)
- `playwright.config.js` ← CRIAR

## Passos

### 1. Instalar dependência

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

### 2. Criar `playwright.config.js`

```js
// @ts-check
const { defineConfig, devices } = require('@playwright/test')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node ./bin/www',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 15_000,
  },
})
```

### 3. Adicionar script em `package.json`

No objeto `scripts`, adicionar:

```json
"test:e2e": "playwright test"
```

## Critério de aceite

- `npx playwright test --list` lista os spec files sem erros
- `npm run test:e2e` executa sem interferir em `npm test` (Jest)
- `BASE_URL` configurável via variável de ambiente
