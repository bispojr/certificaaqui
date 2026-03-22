# TASK ID: INFRA-LEGADOS-001

## Título
Criar `src/middlewares/auth.js` e `src/middlewares/validate.js`

## Objetivo
Criar as versões corretas de `auth.js` e `validate.js` dentro de `src/middlewares/`, substituindo os arquivos legados que estão na raiz do projeto em `middleware/`.

## Contexto

O arquivo `middleware/auth.js` atual usa:
```js
const { Usuario } = require('../src/models')
```
Esse path é relativo à posição atual (`middleware/`) e aponta para `src/models`. Ao mover para `src/middlewares/`, o path correto passa a ser:
```js
const { Usuario } = require('../models')
```

O arquivo `middleware/validate.js` não possui imports com path relativo, portanto pode ser copiado sem alterações.

O conteúdo completo do `middleware/auth.js` atual é:
```js
const jwt = require('jsonwebtoken')
const { Usuario } = require('../src/models')

const secret = process.env.JWT_SECRET
if (!secret) throw new Error('JWT_SECRET não configurado')

module.exports = async function auth(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, secret)
    const usuario = await Usuario.findByPk(decoded.id)
    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado' })
    }
    req.usuario = usuario
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' })
  }
}
```

O conteúdo completo do `middleware/validate.js` atual é:
```js
const { ZodError } = require('zod')

module.exports = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body)
    next()
  } catch (err) {
    if (err instanceof ZodError) {
      return res
        .status(400)
        .json({ error: 'Erro de validação', detalhes: err.errors })
    }
    next(err)
  }
}
```

## Arquivos envolvidos

- `src/middlewares/auth.js` ← criar (novo)
- `src/middlewares/validate.js` ← criar (novo)

## Passos

1. Criar `src/middlewares/auth.js` com o conteúdo do arquivo legado, alterando **apenas** o path do require de models:
   - De: `require('../src/models')`
   - Para: `require('../models')`

2. Criar `src/middlewares/validate.js` com o conteúdo idêntico ao `middleware/validate.js` atual (sem alterações, pois não há path relativo).

3. **Não remover** os arquivos legados ainda — isso é feito na TASK-005 após todos os imports serem atualizados.

## Resultado esperado

- `src/middlewares/auth.js` criado com `require('../models')` correto
- `src/middlewares/validate.js` criado com conteúdo idêntico ao legado
- Os arquivos legados `middleware/auth.js` e `middleware/validate.js` ainda existem (não remover)

## Critério de aceite

- `src/middlewares/auth.js` existe e contém `require('../models')` (sem `../src/`)
- `src/middlewares/validate.js` existe e contém `ZodError`
- `npm run check` ainda passa (imports dos routes ainda apontam para o legado nesta etapa)
