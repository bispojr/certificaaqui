# TASK ID: SEG-AUTH-001

## Título

Remover os dois blocos `if (process.env.NODE_ENV === 'test')` de `authSSR.js`

## Tipo

código

## Dependências

nenhuma (mas deve ser aplicada junto com ou antes de SEG-AUTH-002 para não quebrar testes de rota)

## Objetivo

Eliminar o código de bypass de autenticação do middleware de produção `authSSR.js`, deixando apenas o fluxo real via cookie JWT.

## Contexto

Os blocos a remover ficam entre as linhas 4–27 de `authSSR.js` (antes do `const token = req.cookies?.token`):

**Bloco 1 — header `x-mock-user`** (linhas 5–15):

```js
if (process.env.NODE_ENV === 'test' && req.headers['x-mock-user']) {
  try {
    const mockUser = JSON.parse(req.headers['x-mock-user'])
    req.usuario = mockUser
    res.locals.usuario = mockUser
    req.session.mockUser = mockUser
    return next()
  } catch {
    return res.status(400).send('Mock user inválido')
  }
}
```

**Bloco 2 — sessão mockUser** (linhas 17–26):

```js
if (process.env.NODE_ENV === 'test' && req.session?.mockUser) {
  const mockUser = { ...req.session.mockUser }
  if (!mockUser.getEventos) {
    mockUser.getEventos = async () => [{ id: 1, nome: 'Evento Teste' }]
  }
  req.usuario = mockUser
  res.locals.usuario = mockUser
  return next()
}
```

## Arquivos envolvidos

- `src/middlewares/authSSR.js` ← remover blocos 1 e 2

## Passos

1. Abrir `src/middlewares/authSSR.js`
2. Remover os dois blocos `if (process.env.NODE_ENV === 'test')` inteiros (incluindo linha em branco entre eles)
3. O resultado deve começar diretamente em `const token = req.cookies?.token` após a declaração da função:

```js
const jwt = require('jsonwebtoken')
const { Usuario } = require('../models')

module.exports = async function authSSR(req, res, next) {
  const token = req.cookies?.token
  if (!token) {
    // ... resto do fluxo real
```

4. **Não alterar mais nada** no arquivo

## Resultado esperado

- `grep -n "NODE_ENV" src/middlewares/authSSR.js` retorna zero linhas
- `grep -n "x-mock-user" src/middlewares/authSSR.js` retorna zero linhas
- `grep -n "mockUser" src/middlewares/authSSR.js` retorna zero linhas
- Middleware de produção contém apenas o fluxo: verificar cookie → decodificar JWT → findByPk → set req.usuario

## Critério de aceite

- Arquivo `authSSR.js` não contém nenhuma referência a `NODE_ENV`, `x-mock-user`, `mockUser` ou `mock`
- O fluxo real de autenticação (cookie JWT) permanece intacto e sem alteração
- **ATENÇÃO**: Os testes de rota que usam `mockLogin` irão FALHAR após esta task até que SEG-AUTH-002, SEG-AUTH-003 e SEG-AUTH-004 sejam aplicadas. Aplicar as quatro tasks da feature em sequência na mesma sessão de trabalho.
