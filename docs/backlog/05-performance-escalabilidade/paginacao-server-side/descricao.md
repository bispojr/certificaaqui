# FEATURE: Paginação Server-Side nas Listagens do Painel Admin

## Domínio

05 — Performance e Escalabilidade

## Identificador

PERF-PAG

## Prioridade

ALTA

## Descrição

Todos os controllers SSR de listagem (`certificadoSSRController`, `participanteSSRController`, `eventoSSRController`, `usuarioSSRController`) carregam **todos os registros do banco** a cada page load via `findAll()` sem `limit`. Com volume crescente de dados, cada acesso ao painel pode trazer milhares de linhas para a memória do processo Node.js, causando:

- Spike de memória por request
- Timeout em conexões lentas
- Renderização de tabelas com centenas de linhas ilegíveis

## Estratégia de implementação

Substituir `findAll()` por `findAndCountAll({ limit: PAGE_SIZE, offset })` nas listagens ativas, onde:

```js
const PAGE_SIZE = 20
const page = Math.max(1, parseInt(req.query.page) || 1)
const offset = (page - 1) * PAGE_SIZE
```

O total de páginas é calculado como `Math.ceil(count / PAGE_SIZE)`.

## Helper Handlebars necessário

Criar um helper `pagination` em `hbs-helpers.js` que receba `{ page, totalPages, queryParams }` e retorne o HTML dos controles de navegação, ou usar um partial HBS — a abordagem de partial é mais flexível e não mistura HTML com JS.

**Alternativa preferida:** passar `pagination` como objeto para o template e renderizar inline no HBS:

```js
// No controller:
const totalPages = Math.ceil(count / PAGE_SIZE)
res.render('...', {
  // ...
  pagination: { page, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
})
```

```hbs
{{!-- No template --}}
{{#if pagination.hasPrev}}
  <a href="?page={{prev pagination.page}}&q={{q}}" class="btn btn-outline-secondary btn-sm">← Anterior</a>
{{/if}}
<span class="mx-2">Página {{pagination.page}} de {{pagination.totalPages}}</span>
{{#if pagination.hasNext}}
  <a href="?page={{next pagination.page}}&q={{q}}" class="btn btn-outline-secondary btn-sm">Próxima →</a>
{{/if}}
```

Isso requer helpers `prev` (retorna `page - 1`) e `next` (retorna `page + 1`) em `hbs-helpers.js`.

## Arquivos envolvidos

| Task | Controller | View |
|------|-----------|------|
| PERF-PAG-001 | `certificadoSSRController.js` | `certificados/index.hbs` |
| PERF-PAG-002 | `participanteSSRController.js` | `participantes/index.hbs` |
| PERF-PAG-003 | `eventoSSRController.js` | `eventos/index.hbs` |
| PERF-PAG-004 | `usuarioSSRController.js` | `usuarios/index.hbs` |
| PERF-PAG-005 | `hbs-helpers.js` | Helpers `prev`, `next`, `add`, controles de paginação |
| PERF-PAG-006 | Todas as 4 views | Controles de navegação nas views |

## Ordem de execução recomendada

1. PERF-PAG-005 (helpers) — pré-requisito para os templates
2. PERF-PAG-001 a 004 (controllers) — podem ser feitos em paralelo
3. PERF-PAG-006 (views) — após os controllers exporem os dados de paginação

## Notas sobre `findAndCountAll` com `include`

Ao usar `findAndCountAll` com `include` e `required: true`, o Sequelize por padrão inclui os JOINs no COUNT, podendo retornar contagem incorreta. Usar `{ separate: true }` nos includes ou `{ subQuery: false }` dependendo da complexidade da query.

**Para participantes** (que usam `include` com `required: true` para filtro de escopo): usar `subQuery: false` no `findAndCountAll`.

## Critério de aceite global

- Nenhum controller SSR de listagem faz `findAll()` sem `limit` na listagem de ativos
- Todas as 4 views exibem controles de paginação quando `totalPages > 1`
- `?page=2` funciona e preserva `?q=` e demais filtros
- `npm run check` passa
