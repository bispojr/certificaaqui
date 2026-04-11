# TASK ID: SEG-AUTH-003

## Título

Atualizar `tests/utils/authMocks.js` para usar `setMockUser` em vez do header `x-mock-user`

## Tipo

teste / utilitário

## Dependências

- SEG-AUTH-002 (`tests/utils/authSSR.mock.js` criado)

## Objetivo

Reescrever `tests/utils/authMocks.js` para que `mockLogin(perfil)` chame `setMockUser(...)` diretamente, sem enviar requests para `/admin/dashboard` e sem depender do header `x-mock-user`.

## Contexto

O `authMocks.js` atual (linhas 7–22):

```js
async function mockLogin(agent, perfil = 'monitor') {
  const fakeUser = {
    id: 999, nome: 'Usuário Teste', email: 'teste@certifique.me',
    perfil,
    getEventos: async () => [{ id: 1, nome: 'Evento Teste' }],
  }
  await agent
    .get('/admin/dashboard')
    .set('x-mock-user', JSON.stringify(fakeUser))
}
```

Problemas do approach atual:
1. Depende do header `x-mock-user` que existia em `authSSR.js` (será removido pela SEG-AUTH-001)
2. Faz uma request extra a `/admin/dashboard` antes de cada teste (overhead desnecessário)
3. A persistência em sessão significa que o estado de autenticação "vaza" entre requests do mesmo agent, mas dependia de session cookie (frágil)

## Arquivos envolvidos

- `tests/utils/authMocks.js` ← reescrever

## Passos

1. Reescrever `tests/utils/authMocks.js`:

```js
// tests/utils/authMocks.js
const { setMockUser, clearMockUser } = require('./authSSR.mock')

/**
 * Define o usuário mock para o próximo teste SSR.
 * Deve ser chamado em beforeEach. Chamar clearMockUser() em afterEach.
 *
 * @param {'monitor'|'gestor'|'admin'} perfil
 * @param {Partial<{id: number, nome: string, email: string}>} overrides
 */
function mockLogin(perfil = 'monitor', overrides = {}) {
  const fakeUser = {
    id: 999,
    nome: 'Usuário Teste',
    email: 'teste@certifique.me',
    perfil,
    isAdmin: perfil === 'admin',
    isGestor: perfil === 'gestor',
    getEventos: async () => [{ id: 1, nome: 'Evento Teste' }],
    ...overrides,
  }
  setMockUser(fakeUser)
  return fakeUser
}

module.exports = { mockLogin, clearMockUser }
```

2. Observar que a assinatura muda: `mockLogin(agent, perfil)` → `mockLogin(perfil, overrides)`. O `agent` não é mais necessário — o mock é configurado via `setMockUser`, não via request. Todos os callers precisarão ser atualizados (SEG-AUTH-004).

3. Re-exportar `clearMockUser` para que os test files possam importar tudo de um só módulo.

## Resultado esperado

- `authMocks.js` não contém mais `await agent.get(...)` nem `x-mock-user`
- `mockLogin` é síncrona (sem `async`)
- `npm run check` pode ainda falhar nesta etapa se SEG-AUTH-004 não foi aplicada — esperado

## Critério de aceite

- Arquivo `authMocks.js` não importa `supertest` nem faz requests HTTP
- Exporta `{ mockLogin, clearMockUser }`
- A função `mockLogin(perfil)` chama `setMockUser` com os campos `isAdmin`, `isGestor` calculados corretamente
