# TASK ID: MON-LEG-004

## Título

Atualizar imports de `../../middleware/validate` para `../middlewares/validate` em 4-5 rotas

## Objetivo

Substituir todos os `require('../../middleware/validate')` pelo novo path `require('../middlewares/validate')` nas rotas que importam o middleware legado.

## Bloqueio

**Requer MON-LEG-003 executado primeiro** — `src/middlewares/validate.js` deve existir antes de atualizar os imports.

## Arquivos envolvidos

- `src/routes/participantes.js` ← EDITAR
- `src/routes/eventos.js` ← EDITAR
- `src/routes/certificados.js` ← EDITAR
- `src/routes/usuarios.js` ← EDITAR
- `src/routes/tipos-certificados.js` ← EDITAR (se MON-ZOD-001 já foi executado)

## Passos

Em cada arquivo listado, substituir:

```js
const validate = require('../../middleware/validate')
```

por:

```js
const validate = require('../middlewares/validate')
```

## Critério de aceite

- `npm run test:ci` passa sem regressões
- `grep -r "../../middleware/validate" src/` retorna zero resultados
