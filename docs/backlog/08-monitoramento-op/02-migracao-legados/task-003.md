# TASK ID: MON-LEG-003

## Título

Criar `src/middlewares/validate.js` (cópia do middleware legado)

## Objetivo

Criar o arquivo `src/middlewares/validate.js` com o conteúdo do `middleware/validate.js` legado, sem alterar nenhum import ainda — permite que as rotas sejam migradas na próxima task (MON-LEG-004).

## Contexto

- `middleware/validate.js` (raiz) — 10 linhas, exporta `(schema) => (req, res, next)`
- Não remover o arquivo legado ainda (isso é feito em MON-LEG-005 após todos os imports serem atualizados)

## Arquivo envolvido

- `src/middlewares/validate.js` ← CRIAR

## Passos

### Criar `src/middlewares/validate.js`

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

## Critério de aceite

- `src/middlewares/validate.js` existe e exporta função de middleware
- Arquivo legado `middleware/validate.js` ainda existe (não removido nesta task)
- `require('./src/middlewares/validate')` da raiz do projeto não lança erro
