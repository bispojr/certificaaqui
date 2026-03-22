# TASK ID: E2E-004

## Título
Criar `tests/e2e/publico.spec.js` — fluxo público de consulta e validação

## Objetivo
Cobrir os casos de uso públicos (sem login): busca de certificados por e-mail, validação por código, exibição de certificado inválido e acesso à página inicial.

## Contexto
- Rotas cobertas: `GET /`, `POST /public/pagina/buscar`, `POST /public/pagina/validar`
- Dados vêm do seed E2E: participante com e-mail `participante.e2e@test.com`, código `E2E-2026-001`
- Comandos Playwright: `page.goto`, `page.fill`, `page.click`, `page.locator`, `expect(page).toHaveURL`, `expect(locator).toBeVisible`
- `beforeAll`: chama `seedE2E()`; `afterAll`: chama `cleanE2E()`

## Arquivos envolvidos
- `tests/e2e/publico.spec.js` ← CRIAR

## Passos

### Criar `tests/e2e/publico.spec.js`

```js
const { test, expect } = require('@playwright/test')
const { seedE2E, cleanE2E } = require('./setup/seed')

let seed

test.beforeAll(async () => {
  seed = await seedE2E()
})

test.afterAll(async () => {
  await cleanE2E()
})

test('UC-P01 — página inicial carrega sem erros', async ({ page }) => {
  await page.goto('/')
  await expect(page).not.toHaveURL(/error/)
  await expect(page.locator('body')).toBeVisible()
})

test('UC-P02 — acessa página de busca de certificados', async ({ page }) => {
  await page.goto('/public/pagina/buscar')
  await expect(page.locator('form')).toBeVisible()
  await expect(page.locator('input[name="email"]')).toBeVisible()
})

test('UC-P03 — busca certificados por e-mail válido', async ({ page }) => {
  await page.goto('/public/pagina/buscar')
  await page.fill('input[name="email"]', 'participante.e2e@test.com')
  await page.click('button[type="submit"]')
  await expect(page.locator('text=Participante E2E')).toBeVisible()
})

test('UC-P04 — busca com e-mail sem certificados não exibe erro 500', async ({ page }) => {
  await page.goto('/public/pagina/buscar')
  await page.fill('input[name="email"]', 'nenhum@test.com')
  await page.click('button[type="submit"]')
  await expect(page).not.toHaveURL(/500|error/)
})

test('UC-P05 — acessa página de validação de certificado', async ({ page }) => {
  await page.goto('/public/pagina/validar')
  await expect(page.locator('input[name="codigo"]')).toBeVisible()
})

test('UC-P06 — valida certificado com código existente', async ({ page }) => {
  await page.goto('/public/pagina/validar')
  await page.fill('input[name="codigo"]', 'E2E-2026-001')
  await page.click('button[type="submit"]')
  await expect(page.locator('text=/válido|Participante E2E/i')).toBeVisible()
})

test('UC-P07 — valida certificado com código inválido', async ({ page }) => {
  await page.goto('/public/pagina/validar')
  await page.fill('input[name="codigo"]', 'INVALIDO-000')
  await page.click('button[type="submit"]')
  await expect(page.locator('text=/inválido|não encontrado/i')).toBeVisible()
})
```

## Critério de aceite
- Todos os testes passam com servidor rodando e banco seedado
- UC-P03: texto "Participante E2E" visível após busca por e-mail
- UC-P06: texto indicando certificado válido visível após código correto
- UC-P07: texto indicando inválido visível após código errado
- Nenhum teste depende de ordem de execução
