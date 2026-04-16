# TASK ID: PERF-PAG-003

## Título

Implementar paginação server-side em `eventoSSRController.index()` e `usuarioSSRController.index()`

## Tipo

código

## Dependências

- PERF-PAG-005 (helpers `prev`/`next` disponíveis no HBS)

## Objetivo

Adicionar paginação às listagens de eventos e usuários. Ambas são queries simples (sem includes com `required: true`), portanto não há o problema de COUNT inflado presente em participantes.

## Arquivos envolvidos

- `src/controllers/eventoSSRController.js` — função `index()`
- `src/controllers/usuarioSSRController.js` — função `index()`

---

## `eventoSSRController.js`

### Situação atual

```js
eventos = await Evento.findAll({ where: searchWhere })   // admin
// ou
eventos = await Evento.findAll({ where: searchWhere, include: [...] })  // gestor
```

### Situação desejada

```js
const PAGE_SIZE = 20
const page = Math.max(1, parseInt(req.query.page) || 1)
const offset = (page - 1) * PAGE_SIZE

// Admin:
const { rows: eventos, count } = await Evento.findAndCountAll({
  where: searchWhere,
  limit: PAGE_SIZE,
  offset,
  order: [['created_at', 'DESC']],
})

// Gestor:
const { rows: eventos, count } = await Evento.findAndCountAll({
  where: searchWhere,
  include: [
    {
      association: 'usuarios',
      where: { id: req.usuario.id },
      through: { attributes: [] },
    },
  ],
  limit: PAGE_SIZE,
  offset,
  order: [['created_at', 'DESC']],
  subQuery: false,
  distinct: true,
})

const totalPages = Math.ceil(count / PAGE_SIZE)
```

Passar `pagination: { page, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }` e `q` para o template.

---

## `usuarioSSRController.js`

### Situação atual

```js
const usuarios = await Usuario.findAll({
  where,
  include: [{ model: Evento, as: 'eventos', attributes: ['id', 'nome'] }],
})
```

### Situação desejada

```js
const PAGE_SIZE = 20
const page = Math.max(1, parseInt(req.query.page) || 1)
const offset = (page - 1) * PAGE_SIZE

const { rows: usuarios, count } = await Usuario.findAll({
  where,
  include: [{ model: Evento, as: 'eventos', attributes: ['id', 'nome'] }],
  limit: PAGE_SIZE,
  offset,
  order: [['nome', 'ASC']],
  distinct: true,
})
const totalPages = Math.ceil(count / PAGE_SIZE)
```

Passar `pagination` e `q` para o template.

---

## Notas de implementação

- A listagem de "arquivados" em ambos os controllers pode permanecer sem paginação por ora — é uma seção colapsada/secundária.
- Se a task de busca FRONT-BUSCA-002 / FRONT-BUSCA-003 ainda não foi implementada, o `searchWhere` é simplesmente `{}` até lá.

## Critério de aceite

- `eventoSSRController.index()` e `usuarioSSRController.index()` usam `findAndCountAll` com `limit: 20`
- Ambas as views recebem `pagination` nos locals
- `?page=2` funciona em `/admin/eventos` e `/admin/usuarios`
- `npm run check` passa
