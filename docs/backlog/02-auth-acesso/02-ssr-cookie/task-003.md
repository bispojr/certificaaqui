# TASK ID: AUTH-SSR-003

## Título
Criar `src/routes/auth.js` — rotas de login e logout SSR

## Objetivo
Criar o arquivo de rotas SSR de autenticação com `GET /auth/login`, `POST /auth/login` e `POST /auth/logout`, usando cookie `httpOnly` para armazenar o JWT e flash messages para erros.

## Contexto

**Pré-requisito:** TASK-001 (`views/auth/login.hbs`) e TASK-002 (`authSSR.js`) já executadas.

Lógica esperada:

**GET /auth/login:**
- Se `req.usuario` já estiver populado (cookie válido), redirecionar para `/admin/dashboard`
- Caso contrário, renderizar `auth/login` com `{ title: 'Login', layout: 'layout' }`

**POST /auth/login:**
- Receber `email` e `senha` do `req.body`
- Buscar usuário com `Usuario.findOne({ where: { email } })`
- Validar senha com `bcrypt.compare`
- Em caso de sucesso: gerar JWT com `jwt.sign({ id, perfil }, JWT_SECRET, { expiresIn: '1h' })`, setar cookie `token` com `httpOnly: true, sameSite: 'lax'`, redirecionar para `/admin/dashboard`
- Em caso de falha: `req.flash('error', 'Credenciais inválidas')` + redirect para `/auth/login`

**POST /auth/logout:**
- Limpar cookie `token` com `res.clearCookie('token')`
- Redirecionar para `/auth/login`

O `bcrypt` e `jwt` já são dependências do projeto (`bcryptjs` e `jsonwebtoken`).

A rota deve usar `authSSR` importado de `../middlewares/authSSR`.

## Arquivos envolvidos

- `src/routes/auth.js` ← criar (novo)

## Passos

1. Criar `src/routes/auth.js`:

```js
const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Usuario } = require('../models')
const authSSR = require('../middlewares/authSSR')

const JWT_SECRET = process.env.JWT_SECRET

// GET /auth/login
router.get('/login', authSSR, (req, res) => {
  if (req.usuario) return res.redirect('/admin/dashboard')
  res.render('auth/login', { title: 'Login', layout: 'layout' })
})

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body
    const usuario = await Usuario.findOne({ where: { email } })
    if (!usuario) {
      req.flash('error', 'Credenciais inválidas')
      return res.redirect('/auth/login')
    }
    const valid = await bcrypt.compare(senha, usuario.senha)
    if (!valid) {
      req.flash('error', 'Credenciais inválidas')
      return res.redirect('/auth/login')
    }
    const token = jwt.sign(
      { id: usuario.id, perfil: usuario.perfil },
      JWT_SECRET,
      { expiresIn: '1h' },
    )
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' })
    return res.redirect('/admin/dashboard')
  } catch {
    req.flash('error', 'Erro interno. Tente novamente.')
    return res.redirect('/auth/login')
  }
})

// POST /auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token')
  return res.redirect('/auth/login')
})

module.exports = router
```

## Resultado esperado

- `src/routes/auth.js` criado com 3 rotas
- Login bem-sucedido seta cookie `httpOnly` e redireciona para `/admin/dashboard`
- Falha de login usa flash e redireciona de volta com mensagem de erro
- Logout limpa o cookie e redireciona para `/auth/login`

## Critério de aceite

- Arquivo existe em `src/routes/auth.js`
- Cookie `token` setado com `httpOnly: true`
- Não expõe detalhes do erro (mensagem genérica "Credenciais inválidas")
- `npm run check` passa sem erros
