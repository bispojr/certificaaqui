# TASK ID: MON-LEG-002

## Título

Atualizar imports de `../../middleware/auth` para `../middlewares/auth` em 5 rotas + 1 teste

## Objetivo

Substituir todos os `require('../../middleware/auth')` pelo novo path `require('../middlewares/auth')` nas 5 rotas que importam o middleware legado, e atualizar `tests/middleware/auth.test.js`.

## Bloqueio

**Requer MON-LEG-001 executado primeiro** — `src/middlewares/auth.js` deve existir antes de atualizar os imports.

## Arquivos envolvidos (6 edições)

- `src/routes/participantes.js` ← EDITAR linha 4
- `src/routes/eventos.js` ← EDITAR linha 4
- `src/routes/certificados.js` ← EDITAR linha 4
- `src/routes/tipos-certificados.js` ← EDITAR linha 4
- `src/routes/usuarios.js` ← EDITAR linha 4
- `tests/middleware/auth.test.js` ← EDITAR linha 10

## Passos

Em cada arquivo listado, substituir:

```js
const auth = require('../../middleware/auth')
```

por:

```js
const auth = require('../middlewares/auth')
```

> **Exceção:** em `tests/middleware/auth.test.js`, o path relativo é diferente — substituir:
>
> ```js
> const auth = require('../../middleware/auth')
> ```
>
> por:
>
> ```js
> const auth = require('../../src/middlewares/auth')
> ```

## Critério de aceite

- `npm run test:ci` passa sem regressões
- Nenhum arquivo usa `require('../../middleware/auth')` após esta task
- `grep -r "middleware/auth" src/` retorna zero resultados
