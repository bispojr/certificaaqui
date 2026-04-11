# TASK ID: SEG-AUTH-004

## Título

Atualizar `certificados.route.test.js` para usar `jest.mock` + nova assinatura de `mockLogin`

## Tipo

teste

## Dependências

- SEG-AUTH-001 (blocos de mock removidos de authSSR.js)
- SEG-AUTH-002 (`tests/utils/authSSR.mock.js` criado)
- SEG-AUTH-003 (`authMocks.js` reescrito com nova assinatura)

## Objetivo

Adaptar `tests/routes/admin/certificados.route.test.js` — único arquivo de rota que usa `mockLogin` — para:
1. Interceptar o middleware `authSSR` via `jest.mock` (antes do `require` do `app`)
2. Usar a nova assinatura `mockLogin(perfil)` (síncrona, sem `agent`)
3. Limpar o estado mock após cada teste com `clearMockUser()`

## Contexto

Os demais arquivos de rota (`dashboard.route.test.js`, `usuarios.route.test.js`, `tipos-certificados.route.test.js`) **não** usam `mockLogin` — eles usam JWT real via cookie. Só `certificados.route.test.js` precisa ser adaptado.

O `jest.mock()` no Jest é **hoisted** automaticamente ao topo do arquivo de compilação — ou seja, o módulo `authSSR` é substituído **antes** de qualquer `require`, inclusive o `require('../../../app')` que carrega o Express. Isso garante que o app use o middleware mock e não o real.

### Diferença de assinatura

| Antes | Depois |
|-------|--------|
| `await mockLogin(agent, 'monitor')` | `mockLogin('monitor')` |
| `await mockLogin(agent, '...')` | `mockLogin('...')` |
| `await mockLogin(agent, perfil)` | `mockLogin(perfil)` |

O `agent` não é mais passado. A função é **síncrona** — remover `await`.

## Arquivos envolvidos

- `tests/routes/admin/certificados.route.test.js` ← alterar

## Passos

### 1. Adicionar `jest.mock` e atualizar os imports no topo do arquivo

Substituir:
```js
const { mockLogin } = require('../../utils/authMocks')
```
por:
```js
jest.mock('../../../src/middlewares/authSSR', () =>
  require('../../utils/authSSR.mock').mockAuthSSR
)
const { mockLogin, clearMockUser } = require('../../utils/authMocks')
```

> O `jest.mock` deve vir **antes** do `require('../../../app')`. O Jest faz o hoist automaticamente em tempo de compilação, mas por clareza de leitura colocá-lo no início do arquivo é a convenção.

### 2. Adicionar `afterEach` para limpar o user mock

No `describe` principal, adicionar após o `beforeEach`:
```js
afterEach(() => {
  clearMockUser()
})
```

### 3. Substituir todas as chamadas `await mockLogin(agent, perfil)` por `mockLogin(perfil)`

O arquivo contém as seguintes ocorrências (baseado na leitura do código):

```js
// No forEach de rotas:
await mockLogin(agent, perfil)          → mockLogin(perfil)

// Nos testes individuais:
await mockLogin(agent, 'monitor')       → mockLogin('monitor')
await mockLogin(agent, 'gestor')        → mockLogin('gestor')
await mockLogin(agent, 'admin')         → mockLogin('admin')
```

Aplicar a substituição em **todas** as ocorrências. Usar busca no arquivo para garantir que nenhuma ficou para trás:
```
grep "await mockLogin" tests/routes/admin/certificados.route.test.js
```
O resultado deve ser vazio após as alterações.

### 4. Verificar `agent` no `beforeEach` — manter

O `agent = request.agent(app)` no `beforeEach` deve ser mantido — ele é necessário para as requests HTTP (`await agent.get(...)`, `await agent.post(...)`). Apenas as chamadas a `mockLogin` mudam.

## Resultado esperado

- `npx jest tests/routes/admin/certificados.route.test.js` passa
- `npm run check` passa
- `grep "await mockLogin" tests/routes/admin/certificados.route.test.js` retorna zero linhas
- `grep "x-mock-user" tests/routes/admin/certificados.route.test.js` retorna zero linhas

## Critério de aceite

- Arquivo tem `jest.mock('../../../src/middlewares/authSSR', ...)` no topo
- Importa `{ mockLogin, clearMockUser }` de `authMocks`
- Todos os `await mockLogin(agent, ...)` foram substituídos por `mockLogin(...)`
- Há `afterEach(() => clearMockUser())` no describe principal
- Todos os testes passam
