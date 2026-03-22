# TASK ID: AUTH-SSR-002

## Título

Criar `src/middlewares/authSSR.js`

## Objetivo

Criar o middleware de autenticação SSR que lê o cookie `token`, verifica o JWT, busca o usuário no banco e popula `req.usuario` e `res.locals.usuario` (incluindo helpers `isAdmin` e `isGestor` usados pelo layout `admin.hbs`).

## Contexto

O layout `views/layouts/admin.hbs` usa as propriedades:

```hbs
{{#if usuario.isAdmin}}
{{#if usuario.isGestor}}
{{usuario.nome}}
{{usuario.perfil}}
```

Portanto `res.locals.usuario` deve incluir os campos `id`, `nome`, `perfil`, `isAdmin` e `isGestor`.

Diferença do `auth.js` (API): o `authSSR.js` **não retorna 401 JSON**. Se o token for inválido ou ausente, apenas define `req.usuario = null` e chama `next()`. A proteção de rotas (redirecionar para login) é feita pelo middleware `requireAuth` que as rotas admin usarão.

O JWT_SECRET já é validado como obrigatório em `middleware/auth.js`. Usar `process.env.JWT_SECRET` diretamente (sem fallback).

O cookie se chama `token` (mesmo nome usado pelo `POST /auth/login` para setar).

## Arquivos envolvidos

- `src/middlewares/authSSR.js` ← criar (novo)

## Passos

1. Criar `src/middlewares/authSSR.js` com o seguinte conteúdo:

```js
const jwt = require('jsonwebtoken')
const { Usuario } = require('../models')

module.exports = async function authSSR(req, res, next) {
  const token = req.cookies?.token
  if (!token) {
    req.usuario = null
    res.locals.usuario = null
    return next()
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const usuario = await Usuario.findByPk(decoded.id)
    if (!usuario) {
      req.usuario = null
      res.locals.usuario = null
      return next()
    }
    const usuarioData = {
      id: usuario.id,
      nome: usuario.nome,
      perfil: usuario.perfil,
      isAdmin: usuario.perfil === 'admin',
      isGestor: usuario.perfil === 'gestor',
    }
    req.usuario = usuarioData
    res.locals.usuario = usuarioData
    next()
  } catch {
    req.usuario = null
    res.locals.usuario = null
    next()
  }
}
```

## Resultado esperado

- `src/middlewares/authSSR.js` criado
- Popula `req.usuario` e `res.locals.usuario` com `isAdmin` e `isGestor`
- Em caso de token ausente ou inválido, define `null` e chama `next()` sem erro

## Critério de aceite

- Arquivo existe em `src/middlewares/authSSR.js`
- Contém `res.locals.usuario` com campos `isAdmin` e `isGestor`
- Não retorna 401 — apenas chama `next()` em todos os casos
- `npm run check` passa sem erros

## Metadados

- Completado em: 22/03/2026 19:10 ✅
