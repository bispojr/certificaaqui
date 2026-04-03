# TASK ID: ADMIN-TIPOS-001

## Título

Adicionar paginação em `tiposCertificadosService.findAll` e propagar no controller

## Objetivo

Substituir `TiposCertificados.findAll()` por `findAndCountAll` com `offset`/`limit` e atualizar o controller para ler `req.query.page`/`perPage`, devolvendo `{ data, meta }`.

## Contexto

- `src/services/tiposCertificadosService.js` linha 5: `findAll()` chama `TiposCertificados.findAll()` sem parâmetros
- `src/controllers/tiposCertificadosController.js`: método `findAll` retorna array puro
- Mesmo padrão já aplicado em CERT-API-001, ADMIN-PART-001 e ADMIN-EVT-003
- Valores padrão: `page = 1`, `perPage = 20`

## Arquivos envolvidos

- `src/services/tiposCertificadosService.js`
- `src/controllers/tiposCertificadosController.js`

## Passos

### 1. `src/services/tiposCertificadosService.js`

Substituir:

```js
async findAll() {
  return TiposCertificados.findAll()
},
```

Por:

```js
async findAll({ page = 1, perPage = 20 } = {}) {
  const offset = (page - 1) * perPage
  const { count, rows } = await TiposCertificados.findAndCountAll({
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

### 2. `src/controllers/tiposCertificadosController.js`

Substituir o método `findAll`:

```js
async findAll(req, res) {
  try {
    const tipos = await tiposCertificadosService.findAll()
    return res.status(200).json(tipos)
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
    const result = await tiposCertificadosService.findAll({ page, perPage })
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}
```

## Resultado esperado

`GET /tipos-certificados?page=1&perPage=5` devolve `{ data: [...], meta: { total, page, perPage, totalPages } }`.

## Critério de aceite

- `tiposCertificadosService.findAll({ page: 2, perPage: 5 })` chama `findAndCountAll` com `{ offset: 5, limit: 5 }`
- Resposta tem `totalPages: Math.ceil(count / perPage)`
- Sem query params usa `page=1, perPage=20`

## Metadados

- Completado em: 03/04/2026 08:26 (BRT) ✅
