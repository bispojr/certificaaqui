# TASK ID: INFRA-LEGADOS-003

## Título

Atualizar imports de `auth` e `validate` em `certificados.js` e `tipos-certificados.js`

## Objetivo

Substituir os imports legados `../../middleware/auth` e `../../middleware/validate` pelas versões novas em `src/middlewares/` nos arquivos de rota `certificados.js` e `tipos-certificados.js`.

## Contexto

**Pré-requisito:** TASK-001 já executada.

Estado atual:

```js
// src/routes/certificados.js (linhas 4 e 7)
const auth = require('../../middleware/auth')
const validate = require('../../middleware/validate')

// src/routes/tipos-certificados.js (linha 4 — apenas auth, sem validate)
const auth = require('../../middleware/auth')
```

## Arquivos envolvidos

- `src/routes/certificados.js` ← editar
- `src/routes/tipos-certificados.js` ← editar

## Passos

1. Em `src/routes/certificados.js`, substituir:
   - `require('../../middleware/auth')` → `require('../middlewares/auth')`
   - `require('../../middleware/validate')` → `require('../middlewares/validate')`

2. Em `src/routes/tipos-certificados.js`, substituir:
   - `require('../../middleware/auth')` → `require('../middlewares/auth')`
   - (não há `validate` nesse arquivo — não adicionar)

3. Não alterar nenhuma outra linha dos arquivos.

## Resultado esperado

- `certificados.js` importa `auth` e `validate` de `../middlewares/`
- `tipos-certificados.js` importa `auth` de `../middlewares/` (sem `validate`)

## Critério de aceite

- Nenhuma ocorrência de `../../middleware/` em `certificados.js` ou `tipos-certificados.js`
- `npm run check` passa sem erros
