# PERF-PAG-004 — Helpers Handlebars para paginação e partial de controles

## Identificador

PERF-PAG-004

## Feature

paginacao-server-side

## Domínio

05 — Performance e Escalabilidade

## Prioridade

ALTA

## Pré-requisitos

- PERF-PAG-001, PERF-PAG-002 e PERF-PAG-003 implementados (controllers já passam objeto `pagination` para as views)

## Descrição

Os controllers agora passam um objeto `pagination` para cada view de listagem. Faltam:

1. Dois helpers Handlebars aritméticos simples — `prev` e `next` — que os controles de navegação usarão para calcular o número da página anterior e da próxima.
2. Um partial `views/partials/pagination.hbs` que renderize os controles de navegação reutilizáveis em todas as views.

A estratégia para preservar query params (filtros, busca `?q=`) é passar do controller uma string `queryString` pré-montada, sem o parâmetro `page`, que o partial concatena ao href de cada botão.

---

## Alterações necessárias

### 1. `hbs-helpers.js` — adicionar `prev` e `next` dentro de `registerHelpers`

Localização: dentro da função `registerHelpers(handlebarsInstance)`, logo após o helper `toString`.

```js
handlebarsInstance.registerHelper('prev', function (page) {
  return Number(page) - 1
})
handlebarsInstance.registerHelper('next', function (page) {
  return Number(page) + 1
})
```

**Regra de posicionamento:** inserir antes da chave de fechamento `}` da função `registerHelpers`, mantendo o padrão de indentação existente (2 espaços).

---

### 2. `views/partials/pagination.hbs` — novo arquivo partial

Criar em `views/partials/pagination.hbs` com o seguinte conteúdo:

```hbs
{{#if pagination.totalPages}}
<nav aria-label="Navegação de páginas" class="mt-3">
  <div class="d-flex justify-content-between align-items-center">
    <div class="text-muted small">
      Página {{pagination.page}} de {{pagination.totalPages}}
      ({{pagination.count}} registros)
    </div>
    <ul class="pagination pagination-sm mb-0">
      <li class="page-item {{#unless pagination.hasPrev}}disabled{{/unless}}">
        <a class="page-link"
           href="?page={{prev pagination.page}}&{{pagination.queryString}}"
           aria-label="Anterior">
          &laquo; Anterior
        </a>
      </li>
      <li class="page-item {{#unless pagination.hasNext}}disabled{{/unless}}">
        <a class="page-link"
           href="?page={{next pagination.page}}&{{pagination.queryString}}"
           aria-label="Próxima">
          Próxima &raquo;
        </a>
      </li>
    </ul>
  </div>
</nav>
{{/if}}
```

**Notas de implementação:**

- `pagination.queryString` é uma string sem `page=`, ex.: `q=joao&status=ativo` — montada pelo controller.
- O href resulta em `?page=2&q=joao&status=ativo` — concatenação simples, sem encoding manual.
- O `&` no template HBS é renderizado como literal por ser contexto de atributo href (não HTML body).
- Classe `disabled` no `<li>` é suficiente para Bootstrap 5 desabilitar visualmente; não é necessário `tabindex="-1"`.

---

### 3. Controllers — adicionar `queryString` ao objeto `pagination`

Cada controller que já passa `pagination` (PERF-PAG-001 a 003) deve incluir também `queryString`.

Exemplo para `certificadoSSRController.index()`:

```js
const params = new URLSearchParams()
if (req.query.q) params.set('q', req.query.q)
if (req.query.evento_id) params.set('evento_id', req.query.evento_id)
if (req.query.tipo_id) params.set('tipo_id', req.query.tipo_id)
if (req.query.status) params.set('status', req.query.status)

res.render('certificados/index', {
  // ... demais variáveis
  pagination: {
    page,
    totalPages,
    count,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    queryString: params.toString(),
  },
})
```

Adaptar analogamente para `participanteSSRController` (`q`), `eventoSSRController` (`q`) e `usuarioSSRController` (`q`).

---

## Critérios de aceite

- [ ] `hbs-helpers.js` contém helpers `prev` e `next` dentro de `registerHelpers`, registrados tanto no `hbs.handlebars` quanto no `Handlebars` puro (via o bloco `try/catch` existente).
- [ ] `views/partials/pagination.hbs` existe e renderiza sem erro com dados mínimos `{ pagination: { page: 1, totalPages: 3, count: 55, hasPrev: false, hasNext: true, queryString: 'q=teste' } }`.
- [ ] Botão "Anterior" aparece desabilitado na página 1.
- [ ] Botão "Próxima" aparece desabilitado na última página.
- [ ] O href dos botões preserva os query params existentes ao navegar entre páginas.
- [ ] Nenhum teste existente quebra após adicionar os helpers.

## Estimativa

P (até 1h)
