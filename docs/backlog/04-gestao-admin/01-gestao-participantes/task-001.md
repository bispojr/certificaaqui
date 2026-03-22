# TASK ID: ADMIN-PART-001

## Título

Adicionar paginação em `participanteService.findAll` e propagar no controller

## Objetivo

Substituir `Participante.findAll()` por `findAndCountAll` com `offset`/`limit` e atualizar o controller para ler `req.query.page`/`perPage`, devolvendo `{ data, meta }`.

## Contexto

- `src/services/participanteService.js` linha 5: `findAll()` chama `Participante.findAll()` sem parâmetros
- `src/controllers/participanteController.js`: método `findAll` chama `participanteService.findAll()` e retorna o array direto
- Convenção: `{ data: rows, meta: { total, page, perPage, totalPages } }` — mesma estrutura do CERT-API-001
- Valores padrão: `page = 1`, `perPage = 20`

## Arquivos envolvidos

- `src/services/participanteService.js`
- `src/controllers/participanteController.js`

## Passos

### 1. `src/services/participanteService.js`

Substituir:

```js
async findAll() {
  return Participante.findAll()
},
```

Por:

```js
async findAll({ page = 1, perPage = 20 } = {}) {
  const offset = (page - 1) * perPage
  const { count, rows } = await Participante.findAndCountAll({
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

### 2. `src/controllers/participanteController.js`

Substituir o método `findAll`:

```js
async findAll(req, res) {
  try {
    const participantes = await participanteService.findAll()
    return res.status(200).json(participantes)
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
    const result = await participanteService.findAll({ page, perPage })
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}
```

## Resultado esperado

`GET /participantes?page=2&perPage=5` devolve:

```json
{
  "data": [...],
  "meta": { "total": 42, "page": 2, "perPage": 5, "totalPages": 9 }
}
```

## Critério de aceite

- `participanteService.findAll({ page: 2, perPage: 5 })` chama `findAndCountAll` com `{ offset: 5, limit: 5 }`
- Resposta tem formato `{ data, meta }` com `totalPages` calculado
- `GET /participantes` sem query params usa `page=1, perPage=20`
