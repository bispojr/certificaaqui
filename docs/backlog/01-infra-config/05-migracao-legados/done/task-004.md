# TASK ID: INFRA-LEGADOS-004

## Título

Atualizar imports em `usuarios.js` e `auth.test.js`

## Objetivo

Substituir os imports legados em `src/routes/usuarios.js` e `tests/middleware/auth.test.js`, completando a atualização de todos os arquivos que referenciam os middlewares legados.

## Contexto

**Pré-requisito:** TASK-001 já executada.

Estado atual:

```js
// src/routes/usuarios.js (linhas 4 e 5)
const auth = require('../../middleware/auth')
const validate = require('../../middleware/validate')

// tests/middleware/auth.test.js (linha 10)
const auth = require('../../middleware/auth')
```

Para `tests/middleware/auth.test.js`, o path correto a partir de `tests/middleware/` para `src/middlewares/` é:

```js
const auth = require('../../src/middlewares/auth')
```

## Arquivos envolvidos

- `src/routes/usuarios.js` ← editar
- `tests/middleware/auth.test.js` ← editar

## Passos

1. Em `src/routes/usuarios.js`, substituir:
   - `require('../../middleware/auth')` → `require('../middlewares/auth')`
   - `require('../../middleware/validate')` → `require('../middlewares/validate')`

2. Em `tests/middleware/auth.test.js`, substituir:
   - `require('../../middleware/auth')` → `require('../../src/middlewares/auth')`

3. Não alterar nenhuma outra linha dos arquivos.

## Resultado esperado

- `usuarios.js` importa `auth` e `validate` de `../middlewares/`
- `auth.test.js` importa `auth` de `../../src/middlewares/auth`
- Nenhum arquivo em `src/routes/` ou `tests/` referencia mais `../../middleware/auth` ou `../../middleware/validate`

## Critério de aceite

- `grep -r "../../middleware/auth" src/ tests/` não retorna nenhum resultado
- `grep -r "../../middleware/validate" src/ tests/` não retorna nenhum resultado
- `npm run check` passa sem erros

## Metadados

- Completado em: 2026-03-25 22:17 (BRT) ✅
