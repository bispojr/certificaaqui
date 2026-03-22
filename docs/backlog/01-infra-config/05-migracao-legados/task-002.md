# TASK ID: INFRA-LEGADOS-002

## Título
Atualizar imports de `auth` e `validate` em `participantes.js` e `eventos.js`

## Objetivo
Substituir os imports legados `../../middleware/auth` e `../../middleware/validate` pelas versões novas em `src/middlewares/` nos arquivos de rota `participantes.js` e `eventos.js`.

## Contexto

**Pré-requisito:** TASK-001 já executada (`src/middlewares/auth.js` e `src/middlewares/validate.js` existem).

Estado atual dos dois arquivos:
```js
// src/routes/participantes.js (linhas 4 e 6)
const auth = require('../../middleware/auth')
const validate = require('../../middleware/validate')

// src/routes/eventos.js (linhas 4 e 7)
const auth = require('../../middleware/auth')
const validate = require('../../middleware/validate')
```

Path correto a partir de `src/routes/` para `src/middlewares/`:
```js
const auth = require('../middlewares/auth')
const validate = require('../middlewares/validate')
```

## Arquivos envolvidos

- `src/routes/participantes.js` ← editar (linha 4 e linha com validate)
- `src/routes/eventos.js` ← editar (linha 4 e linha com validate)

## Passos

1. Em `src/routes/participantes.js`, substituir:
   - `require('../../middleware/auth')` → `require('../middlewares/auth')`
   - `require('../../middleware/validate')` → `require('../middlewares/validate')`

2. Em `src/routes/eventos.js`, substituir:
   - `require('../../middleware/auth')` → `require('../middlewares/auth')`
   - `require('../../middleware/validate')` → `require('../middlewares/validate')`

3. Não alterar nenhuma outra linha dos arquivos.

## Resultado esperado

- `participantes.js` e `eventos.js` importam `auth` e `validate` de `../middlewares/`
- Nenhuma outra linha foi alterada

## Critério de aceite

- Nenhuma ocorrência de `../../middleware/` em `participantes.js` ou `eventos.js`
- `npm run check` passa sem erros
