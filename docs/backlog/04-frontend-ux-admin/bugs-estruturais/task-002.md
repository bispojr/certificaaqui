# TASK ID: FRONT-BUG-002

## Título

Mover o form do botão "Remover" para o `<td>` de ações em `certificados/index.hbs`

## Tipo

código

## Dependências

Nenhuma (pode ser executada em paralelo com FRONT-BUG-001)

## Objetivo

O `<form>` que contém o botão "Remover" está renderizado dentro do `<td>` da coluna **Status** (ao lado do badge), causando mistura visual entre o badge de status e o botão de ação. Mover o form para o `<td>` de ações, onde ficam "Ver", "Editar" e "Cancelar".

## Arquivo envolvido

`views/admin/certificados/index.hbs`

## Situação atual (linhas ~55–78)

```hbs
<td>
  <span class="badge
    {{#if (eq status 'emitido')}}bg-success
    {{else if (eq status 'pendente')}}bg-warning text-dark
    {{else}}bg-secondary{{/if}}">
    {{status}}
  </span>
  <form method="POST" action="/admin/certificados/{{id}}/deletar" class="d-inline" onsubmit="return confirm('Remover este certificado? Esta ação pode ser desfeita em Arquivados.')">
    <button type="submit" class="btn btn-sm btn-danger">Remover</button>
  </form>
</td>
<td>
  <a href="/admin/certificados/{{id}}" class="btn btn-sm btn-info">Ver</a>
  <a href="/admin/certificados/{{id}}/editar" class="btn btn-sm btn-secondary">Editar</a>
  {{#unless (eq status 'cancelado')}}
    <button type="button" class="btn btn-sm btn-warning"
            data-bs-toggle="modal"
            data-bs-target="#modalCancelar"
            data-id="{{id}}"
            data-nome="{{nome}}">
      Cancelar
    </button>
  {{/unless}}
</td>
```

## Situação desejada

```hbs
<td>
  <span class="badge
    {{#if (eq status 'emitido')}}bg-success
    {{else if (eq status 'pendente')}}bg-warning text-dark
    {{else}}bg-secondary{{/if}}">
    {{status}}
  </span>
</td>
<td>
  <a href="/admin/certificados/{{id}}" class="btn btn-sm btn-info">Ver</a>
  <a href="/admin/certificados/{{id}}/editar" class="btn btn-sm btn-secondary">Editar</a>
  {{#unless (eq status 'cancelado')}}
    <button type="button" class="btn btn-sm btn-warning"
            data-bs-toggle="modal"
            data-bs-target="#modalCancelar"
            data-id="{{id}}"
            data-nome="{{nome}}">
      Cancelar
    </button>
  {{/unless}}
  <form method="POST" action="/admin/certificados/{{id}}/deletar" class="d-inline" onsubmit="return confirm('Remover este certificado? Esta ação pode ser desfeita em Arquivados.')">
    <button type="submit" class="btn btn-sm btn-danger">Remover</button>
  </form>
</td>
```

## Passos

1. Abrir `views/admin/certificados/index.hbs`
2. Localizar o `<form method="POST" action=".../deletar">` dentro do `<td>` de status
3. Recortar o bloco `<form>...</form>` inteiro
4. Colar ao final do `<td>` de ações, após o bloco `{{#unless (eq status 'cancelado')}}...{{/unless}}`
5. Verificar que o `<td>` de status ficou apenas com o `<span class="badge ...">{{status}}</span>`

## Critério de aceite

- `grep -n "deletar" views/admin/certificados/index.hbs` retorna apenas uma ocorrência, dentro do `<td>` de ações
- O badge de status renderiza sozinho no `<td>` de status
- O botão "Remover" aparece visualmente ao lado de "Ver", "Editar" e "Cancelar"
- `npm run check` passa
