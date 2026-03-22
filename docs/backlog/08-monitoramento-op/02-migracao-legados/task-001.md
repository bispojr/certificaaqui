# TASK ID: MON-LEG-001

## Título
Criar `src/middlewares/auth.js` (cópia do middleware legado)

## Objetivo
Criar o arquivo `src/middlewares/auth.js` com o conteúdo do `middleware/auth.js` legado, sem alterar nenhum import ainda — isso permite que as rotas sejam migradas incrementalmente na próxima task.

## Contexto
- `middleware/auth.js` (raiz) contém middleware JWT que busca `Usuario` por `decoded.id`
- O arquivo é idêntico ao que já existe — apenas precisa ser colocado em `src/middlewares/`
- Não remover o arquivo legado ainda (isso é feito em MON-LEG-005 após todos os imports serem atualizados)

## Arquivo envolvido
- `src/middlewares/auth.js` ← CRIAR

## Passos

### Criar `src/middlewares/auth.js` com o conteúdo abaixo

```js
const jwt = require('jsonwebtoken')
const { Usuario } = require('../models')

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

> **Nota:** O `require('../models')` usa path relativo correto para `src/middlewares/` → `src/models/index.js`. O arquivo legado usa `require('../src/models')` — path diferente que não funcionaria aqui. Verificar o path antes de criar.

## Critério de aceite
- `src/middlewares/auth.js` existe e exporta função `auth`
- `require('./src/middlewares/auth')` da raiz do projeto não lança erro
- Arquivo legado `middleware/auth.js` ainda existe (não removido nesta task)
