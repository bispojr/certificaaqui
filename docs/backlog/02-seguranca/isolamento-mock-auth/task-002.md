# TASK ID: SEG-AUTH-002

## Título

Criar `tests/utils/authSSR.mock.js` — utilitário de mock de autenticação para testes de rota

## Tipo

teste / utilitário

## Dependências

nenhuma (pode ser criado antes ou depois de SEG-AUTH-001)

## Objetivo

Centralizar a lógica de mock de autenticação em um arquivo de utilitário de testes, exportando:

- `mockAuthSSR`: middleware Express que injeta o usuário atual em `req.usuario` / `res.locals.usuario`
- `setMockUser(user)`: setter para configurar o usuário por teste
- `clearMockUser()`: limpa o usuário (para uso no `afterEach`)

## Como funciona o mecanismo

Quando um arquivo de teste declara:

```js
jest.mock(
  '../../../src/middlewares/authSSR',
  () => require('../../utils/authSSR.mock').mockAuthSSR,
)
```

O Jest **hoist** essa declaração ao topo do arquivo (antes de qualquer `require`). Quando `app.js` é carregado pela linha `const app = require('../../../app')`, ele obtém a versão mock do módulo `authSSR`. O Express registra o middleware mock, não o real.

Em cada teste, `setMockUser(...)` configura qual usuário o middleware mock irá injetar.

## Arquivos envolvidos

- `tests/utils/authSSR.mock.js` ← criar

## Passos

1. Criar `tests/utils/authSSR.mock.js` com o seguinte conteúdo:

```js
// tests/utils/authSSR.mock.js
// Middleware mock de autenticação SSR para uso exclusivo em testes de rota.
// NÃO importar em código de produção.

let currentUser = null

function setMockUser(user) {
  currentUser = user
}

function clearMockUser() {
  currentUser = null
}

function mockAuthSSR(req, res, next) {
  if (currentUser) {
    req.usuario = currentUser
    res.locals.usuario = currentUser
  } else {
    req.usuario = null
    res.locals.usuario = null
  }
  next()
}

module.exports = { mockAuthSSR, setMockUser, clearMockUser }
```

## Notas de implementação

- O `currentUser` é uma variável de módulo (singleton no processo Jest). Como Jest isola cada arquivo de teste em um `require` cache separado por padrão (\*), o estado não vaza entre arquivos de teste.
  - (\*) A menos que se use `jest.resetModules()` ou `--runInBand`; não é o caso aqui.
- `clearMockUser()` deve ser chamado no `afterEach` de cada arquivo de rota para evitar estado residual entre testes dentro do mesmo arquivo.
- O middleware **não** recria `getEventos` nem adiciona métodos especiais — os testes de rota que precisam dessas propriedades devem incluí-las diretamente no objeto passado a `setMockUser`.

## Resultado esperado

- Arquivo criado em `tests/utils/authSSR.mock.js`
- `node -e "const m = require('./tests/utils/authSSR.mock'); console.log(Object.keys(m))"` imprime `[ 'mockAuthSSR', 'setMockUser', 'clearMockUser' ]`

## Critério de aceite

- Arquivo criado com as três exportações
- Nenhuma referência a `process.env.NODE_ENV` no arquivo
- Nenhum import de modelos ou serviços de produção
