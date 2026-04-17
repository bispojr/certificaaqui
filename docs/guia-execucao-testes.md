# Guia de Execução — Testes e Servidor Local

> Última atualização: 2026-04-17 10:51 (BRT)

Este guia descreve como executar os testes (Jest e Playwright) e como subir o servidor local com dados de seed para inspeção visual. Também explica os **conflitos de banco** que surgem quando essas atividades se misturam.

---

## Bancos de dados por ambiente

| Ambiente | Banco | Porta |
|---|---|---|
| `development` | `certificados_test` | 5432 |
| `test` (Jest) | `certificados_test` | 5433 |
| `e2e` (Playwright) | `certificados_e2e` | 5434 |

> Jest e Playwright usam bancos **diferentes**. Não interferem entre si.
> O servidor `development` (porta 5432) é o único que pode conflitar com a inspeção visual manual.

---

## 1. Testes Jest

### Via linha de comando

```bash
# Suite completa (recomendado antes de commitar)
npm run test:ci

# Suite completa com lint e formatação
npm run check

# Apenas um grupo específico
npm run test:models
npm run test:routes

# Um arquivo específico
npx jest tests/routes/authSSR.test.js

# Um teste específico pelo nome
npx jest --testNamePattern="deve criar um participante"

# Modo watch (re-executa ao salvar)
npm run test:watch
```

**Banco utilizado:** `certificados_test` (porta 5433). O Jest cria e limpa os dados automaticamente via `setup.js`.

### Via aba Testing do VS Code

1. Abra a aba **Testing** (ícone de frasco na barra lateral, ou `Ctrl+Shift+T`)
2. Expanda o grupo **Jest** na árvore
3. Para rodar tudo: clique no ▶ no topo do grupo
4. Para rodar um arquivo: clique no ▶ ao lado do arquivo
5. Para rodar um teste individual: clique no ▶ ao lado do teste

> **Não** há necessidade de parar nenhum servidor antes de rodar o Jest. Ele não depende de um processo em execução.

---

## 2. Testes Playwright (E2E)

### Via linha de comando

```bash
# Suite completa (modo headless — sem janela de browser)
npx playwright test
# ou via script npm
npm run test:e2e

# Um arquivo específico
npx playwright test tests/e2e/admin.spec.js

# Um teste específico pelo nome
npx playwright test --grep "UC-AD01"

# Com browser visível (útil para depuração)
npx playwright test --headed

# Modo debug interativo (pausa em cada passo)
npx playwright test --debug

# Ver relatório HTML da última execução
npx playwright show-report
```

**Banco utilizado:** `certificados_e2e` (porta 5434). O `globalSetup` garante banco limpo e migrado antes de cada execução.

### Via aba Testing do VS Code

1. Abra a aba **Testing**
2. Expanda o grupo **Playwright** na árvore
3. Para rodar tudo: clique no ▶ no topo do grupo Playwright
4. Para rodar um spec: clique no ▶ ao lado do arquivo `.spec.js`
5. Para rodar um teste individual: clique no ▶ ao lado do teste

> **Atenção:** O Playwright sobe e gerencia o servidor `NODE_ENV=e2e` automaticamente na porta 3000 (configurado em `playwright.config.js` → `webServer`). Se a porta 3000 já estiver ocupada por outro processo, o Playwright **reutiliza** o servidor existente (comportamento definido por `reuseExistingServer`).

---

## 3. Servidor local com seed para inspeção visual

Use este fluxo quando quiser **ver a aplicação com os olhos** — navegar pelas telas, testar fluxos manualmente, inspecionar o estado visual.

### Passo a passo

**Terminal 1 — subir o servidor:**
```bash
NODE_ENV=development node ./bin/www
# ou simplesmente
npm start
```

O servidor ficará disponível em: **http://localhost:3000**

**Terminal 2 — popular o banco com dados de seed:**
```bash
NODE_ENV=development node -e "
process.env.NODE_ENV = 'development';
const { seedE2E, cleanE2E } = require('./tests/e2e/setup/seed');
cleanE2E().then(() => seedE2E()).then(() => {
  console.log('Seed aplicado com sucesso.');
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
"
```

**Credenciais criadas pelo seed:**

| Perfil | E-mail | Senha |
|---|---|---|
| Admin | `admin.e2e@test.com` | `senha123` |
| Gestor | `gestor.e2e@test.com` | `senha123` |
| Monitor | `monitor.e2e@test.com` | `senha123` |

Acesse **http://localhost:3000/auth/login** e entre com qualquer uma dessas credenciais.

### Limpar o banco após a inspeção

```bash
NODE_ENV=development node -e "
process.env.NODE_ENV = 'development';
const { cleanE2E } = require('./tests/e2e/setup/seed');
cleanE2E().then(() => { console.log('Banco limpo.'); process.exit(0); });
"
```

---

## Por que as execuções podem entrar em conflito

### Conflito: servidor manual + Playwright (aba Testing ou CLI)

O Playwright usa `reuseExistingServer: true` fora de CI. Se a porta 3000 já tiver um servidor `development` rodando, o Playwright **vai usá-lo** — mas com banco `development` em vez de `e2e`. Resultado: dados errados, testes falham.

**Regra:** Antes de rodar Playwright, pare o servidor `development`.

```bash
# Parar qualquer processo na porta 3000
kill $(lsof -t -i:3000) 2>/dev/null || true
```

### Conflito: banco sujo entre execuções de Playwright

Se o Playwright for interrompido (Ctrl+C, crash, parada pelo VS Code) antes do `afterAll` de cada spec, os dados do seed ficam no banco `e2e`. Na próxima execução, o `seedE2E` tenta criar os mesmos registros e falha com erro de chave única.

**Solução já aplicada:** O `globalSetup.js` executa `cleanE2E()` no início de toda sessão, garantindo banco limpo independente do estado anterior.

### Conflito: Jest + Playwright rodando simultaneamente

Não há conflito de banco (bancos separados), mas ambos podem tentar subir um servidor na porta 3000. Evite rodar `npm run test:ci` e `npx playwright test` em paralelo no mesmo terminal.

---

## Resumo rápido

| O que fazer | Comando |
|---|---|
| Rodar Jest completo | `npm run test:ci` |
| Rodar Playwright completo | `npx playwright test` |
| Ver Playwright com browser | `npx playwright test --headed` |
| Depurar um spec passo a passo | `npx playwright test --debug tests/e2e/admin.spec.js` |
| Subir servidor + seed visual | `npm start` + seed no Terminal 2 |
| Parar servidor na porta 3000 | `kill $(lsof -t -i:3000)` |
| Limpar banco E2E manualmente | `cleanE2E()` via node (ver acima) |
