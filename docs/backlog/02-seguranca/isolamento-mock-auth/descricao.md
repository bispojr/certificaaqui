# Feature: Isolamento do Código de Mock de Autenticação

## ID da Feature

SEG-AUTH

## Domínio

Domínio 2 — Segurança

## Problema

`src/middlewares/authSSR.js` contém dois blocos condicionais:

```js
if (process.env.NODE_ENV === 'test' && req.headers['x-mock-user']) { ... }
if (process.env.NODE_ENV === 'test' && req.session?.mockUser) { ... }
```

Esses blocos permitem:
1. Injetar um usuário arbitrário via header HTTP `x-mock-user` (objeto JSON sem autenticação)
2. Reusar esse usuário de sessões anteriores

Se `NODE_ENV` for configurado incorretamente como `'test'` em produção (erro de deploy, variável não definida com fallback errado), qualquer agente que envie o header `x-mock-user` acessa o sistema sem credenciais.

Classificação: **OWASP A07:2021 — Identification and Authentication Failures**

## Objetivo

Remover os blocos de mock de `authSSR.js` (middleware de produção) e centralizar a lógica de mock em um utilitário de teste. Os testes de rota continuam funcionando via `jest.mock()` que substitui o módulo antes da carga do app.

## Mecanismo de mock pós-refatoração

Os testes de rota que usam `supertest` importam `app.js`. Como o Jest é quem carrega os módulos, um `jest.mock('../../../src/middlewares/authSSR', factory)` declarado no topo do arquivo de teste **intercepta o `require` dentro de `app.js`**, substituindo o middleware real pela versão mock antes que o Express registre as rotas.

O utilitário `tests/utils/authSSR.mock.js` exporta:
- `mockAuthSSR`: função middleware que lê `currentUser` de um closure global
- `setMockUser(user)`: define o usuário atual para as próximas requests

Cada teste de rota usa `setMockUser(...)` no `beforeEach` para simular o perfil desejado.

## Arquivos envolvidos

- `src/middlewares/authSSR.js` ← remover 2 blocos
- `tests/utils/authSSR.mock.js` ← criar
- `tests/utils/authMocks.js` ← atualizar `mockLogin`
- `tests/routes/admin/certificados.route.test.js` ← atualizar

## Tasks

- [SEG-AUTH-001](./task-001.md) — Remover blocos de mock de `authSSR.js`
- [SEG-AUTH-002](./task-002.md) — Criar `tests/utils/authSSR.mock.js`
- [SEG-AUTH-003](./task-003.md) — Atualizar `authMocks.js` para usar o mock module
- [SEG-AUTH-004](./task-004.md) — Atualizar testes de rota para usar o novo mecanismo

## Critério de aceite da Feature

- `grep -n "NODE_ENV.*test" src/middlewares/authSSR.js` não retorna nenhuma linha
- Os testes `tests/routes/admin/*.route.test.js` passam sem depender de blocos de mock em produção
- `npm run check` passa
