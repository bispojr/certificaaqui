# TASK ID: PERF-PAG-002

## Título

Implementar paginação server-side em `participanteSSRController.index()`

## Tipo

código

## Dependências

- PERF-PAG-005 (helpers `prev`/`next` disponíveis no HBS)

## Objetivo

Substituir `Participante.findAll()` por `findAndCountAll` com `limit: 20` e `offset` na listagem de participantes ativos.

## Arquivo envolvido

`src/controllers/participanteSSRController.js` — função `index()`

## Situação atual (resumo)

```js
const participantes = await Participante.findAll({
  where: textWhere,
  include: [{
    model: Certificado,
    as: 'certificados',
    where: eventoIds ? certWhere : undefined,
    required: eventoIds ? true : false,
  }],
})
const arquivados = await Participante.findAll({
  paranoid: false,
  where: { deleted_at: { [Op.ne]: null } },
  include: eventoIds ? [...] : [],
})
```

## Situação desejada

```js
const PAGE_SIZE = 20
const page = Math.max(1, parseInt(req.query.page) || 1)
const offset = (page - 1) * PAGE_SIZE

const { rows: participantes, count } = await Participante.findAndCountAll({
  where: textWhere,
  include: [
    {
      model: Certificado,
      as: 'certificados',
      where: eventoIds ? certWhere : undefined,
      required: eventoIds ? true : false,
    },
  ],
  limit: PAGE_SIZE,
  offset,
  order: [['nome', 'ASC']],
  subQuery: false, // IMPORTANTE: evitar COUNT incorreto com include + required
  distinct: true, // Contar participantes distintos, não linhas de JOIN
})
const totalPages = Math.ceil(count / PAGE_SIZE)
```

**Nota crítica sobre `subQuery` e `distinct`:** Quando `include` tem `required: true`, o Sequelize gera um subselect com COUNT que pode dobrar resultados. Usar `{ subQuery: false, distinct: true }` resolve o problema para este caso.

## Dados a passar para o template

```js
return res.render('admin/participantes/index', {
  // ...campos existentes...
  q,
  pagination: {
    page,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  },
})
```

## Preservação de query params na paginação

O link "Próxima" na view deve preservar `?q=` junto com `?page=`. Verificar que o template de paginação (PERF-PAG-006) inclui todos os query params relevantes nos hrefs.

## Critério de aceite

- `participanteSSRController.index()` usa `findAndCountAll` com `limit: 20` e `distinct: true`
- `?q=silva&page=2` retorna a segunda página de participantes filtrados por "silva"
- A contagem do total não é inflada pelo JOIN com certificados
- `npm run check` passa
