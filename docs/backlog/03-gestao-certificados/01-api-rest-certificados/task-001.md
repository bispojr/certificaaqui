# TASK ID: CERT-API-001

## Título
Adicionar paginação em `certificadoService.findAll` e propagar no controller

## Objetivo
Substituir `Certificado.findAll()` por `findAndCountAll` com `offset`/`limit` e atualizar o controller para ler `req.query.page` e `req.query.perPage`, devolvendo `{ data, meta }`.

## Contexto
- `src/services/certificadoService.js` linha 11-13: `findAll()` chama `Certificado.findAll()` sem parâmetros
- `src/controllers/certificadoController.js` linha 13-17: `findAll` chama `certificadoService.findAll()` e devolve o array direto
- Convenção de paginação já acordada: `{ data: rows, meta: { total, page, perPage, totalPages } }`
- Valores padrão: `page = 1`, `perPage = 10`

## Arquivos envolvidos
- `src/services/certificadoService.js`
- `src/controllers/certificadoController.js`

## Passos

### 1. `src/services/certificadoService.js`
Substituir:
```js
async findAll() {
  return Certificado.findAll()
},
```
Por:
```js
async findAll({ page = 1, perPage = 10 } = {}) {
  const offset = (page - 1) * perPage
  const { count, rows } = await Certificado.findAndCountAll({
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

### 2. `src/controllers/certificadoController.js`
Substituir o método `findAll`:
```js
async findAll(req, res) {
  try {
    const certificados = await certificadoService.findAll()
    return res.status(200).json(certificados)
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
    const perPage = parseInt(req.query.perPage, 10) || 10
    const result = await certificadoService.findAll({ page, perPage })
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}
```

## Resultado esperado
`GET /certificados?page=2&perPage=5` devolve:
```json
{
  "data": [...],
  "meta": { "total": 42, "page": 2, "perPage": 5, "totalPages": 9 }
}
```

## Critério de aceite
- `certificadoService.findAll({ page: 2, perPage: 5 })` chama `findAndCountAll` com `{ offset: 5, limit: 5 }`
- Resposta tem formato `{ data, meta }` com todas as 4 chaves em `meta`
- `GET /certificados` sem query params usa `page=1, perPage=10`
