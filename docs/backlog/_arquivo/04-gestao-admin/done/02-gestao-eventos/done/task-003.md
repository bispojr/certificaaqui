# TASK ID: ADMIN-EVT-003

## Título

Adicionar paginação em `eventoService.findAll` e propagar no controller

## Objetivo

Substituir `Evento.findAll()` por `findAndCountAll` com `offset`/`limit` e atualizar o controller para ler `req.query.page`/`perPage`, devolvendo `{ data, meta }`.

## Contexto

- `src/services/eventoService.js` linha 5: `findAll()` chama `Evento.findAll()` sem parâmetros
- `src/controllers/eventoController.js`: método `findAll` retorna o array direto sem paginação
- Mesmo padrão já adotado em CERT-API-001 e ADMIN-PART-001
- Valores padrão: `page = 1`, `perPage = 20`
- O teste `'findAll chama Evento.findAll'` em `eventoService.test.js` precisará ser atualizado — mas isso NÃO faz parte desta task para manter escopo simples; será coberto por task separada se necessário

## Arquivos envolvidos

- `src/services/eventoService.js`
- `src/controllers/eventoController.js`

## Passos

### 1. `src/services/eventoService.js`

Substituir:

```js
async findAll() {
  return Evento.findAll()
},
```

Por:

```js
async findAll({ page = 1, perPage = 20 } = {}) {
  const offset = (page - 1) * perPage
  const { count, rows } = await Evento.findAndCountAll({
    offset,
    limit: perPage,
  })
  return {
    data: rows,
    meta: {
      total: count,
      page,
      perPage,
      totalPages: Math.ceil(count / perPage),
    },
  }
},
```

### 2. `src/controllers/eventoController.js`

Substituir o método `findAll`:

```js
async findAll(req, res) {
  try {
    const eventos = await eventoService.findAll()
    return res.status(200).json(eventos)
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}
```

Por:

```js
async findAll(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1
    const perPage = parseInt(req.query.perPage, 10) || 20
    const result = await eventoService.findAll({ page, perPage })
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}
```

## Resultado esperado

`GET /eventos?page=1&perPage=5` devolve:

```json
{
  "data": [...],
  "meta": { "total": 12, "page": 1, "perPage": 5, "totalPages": 3 }
}
```

## Critério de aceite

- `eventoService.findAll({ page: 2, perPage: 5 })` chama `findAndCountAll` com `{ offset: 5, limit: 5 }`
- Resposta tem formato `{ data, meta }` com `totalPages` calculado
- `GET /eventos` sem query params usa `page=1, perPage=20`

## Observação

O teste existente `'findAll chama Evento.findAll'` em `eventoService.test.js` vai falhar após esta task. Atualizar o mock adicionando `findAndCountAll: jest.fn()` e reescrever o teste para o novo contrato.

## Metadados

- Completado em: 02/04/2026 16:40 ✅
