# TASK ID: PERF-PAG-001

## Título

Implementar paginação server-side em `certificadoSSRController.index()`

## Tipo

código

## Dependências

- PERF-PAG-005 (helpers `prev`/`next` disponíveis no HBS)
- BACK-LIST-002 (recomendado: `findAllForSSR` centralizado no service)

## Objetivo

Substituir as chamadas `Certificado.findAll()` (sem limit) na listagem de ativos por `findAndCountAll` com `limit: 20` e `offset` calculado a partir de `req.query.page`, expondo dados de paginação para o template.

## Arquivo envolvido

`src/controllers/certificadoSSRController.js` — função `index()`

## Lógica de paginação a adicionar

```js
const PAGE_SIZE = 20
const page = Math.max(1, parseInt(req.query.page) || 1)
const offset = (page - 1) * PAGE_SIZE
```

## Modificações na query de ativos

### Situação atual (após BACK-LIST-002)

```js
const { certificados, arquivados } = await certificadoService.findAllForSSR({
  where,
  eventoIds,
})
```

### Situação desejada

Se `findAllForSSR` já suporta paginação (aceita `limit` e `offset`):

```js
const { certificados, count, arquivados } =
  await certificadoService.findAllForSSR({
    where,
    eventoIds,
    limit: PAGE_SIZE,
    offset,
  })
const totalPages = Math.ceil(count / PAGE_SIZE)
```

Se `findAllForSSR` ainda não foi implementado ou não suporta paginação, usar diretamente:

```js
const { rows: certificados, count } = await Certificado.findAndCountAll({
  where: eventoIds ? { ...where, evento_id: { [Op.in]: eventoIds } } : where,
  include: [Participante, Evento, TiposCertificados],
  limit: PAGE_SIZE,
  offset,
  order: [['created_at', 'DESC']],
})
const totalPages = Math.ceil(count / PAGE_SIZE)
```

**Nota:** A seção "Arquivados" não precisa de paginação nesta task — carregar todos os arquivados é aceitável dado que arquivados são exceção, não regra. Revisar se volumes reais indicam necessidade futura.

## Dados a passar para o template

```js
return res.render('admin/certificados/index', {
  // ...campos existentes...
  pagination: {
    page,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  },
})
```

## Critério de aceite

- `certificadoSSRController.index()` usa `limit: 20` e `offset` calculado a partir de `page`
- O objeto `pagination` é passado para o template
- Acessar `/admin/certificados?page=2` funciona e retorna registros da segunda página
- Os filtros `?status=`, `?evento_id=`, `?tipo_id=`, `?q=` continuam funcionando com paginação
- `npm run check` passa
