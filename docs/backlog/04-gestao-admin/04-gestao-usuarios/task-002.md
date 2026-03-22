# TASK ID: ADMIN-USR-002

## Título
Criar `views/admin/usuarios/index.hbs`

## Objetivo
View Handlebars para listar usuários ativos e arquivados no painel admin, exibindo perfil e quantidade de eventos associados.

## Contexto
- Layout: `layouts/admin`
- Dados: `usuarios` (array com `eventos` incluído) e `arquivados` (array sem include)
- Perfil badge: `admin` → `badge-danger`, `gestor` → `badge-warning`, `monitor` → `badge-info`
- Arquivar: `<form method="POST" action="/admin/usuarios/{{id}}/deletar">`
- Restaurar: `<form method="POST" action="/admin/usuarios/{{id}}/restaurar">`
- Flash via `{{#if flash.success}}` / `{{#if flash.error}}`
- Bootstrap 5 via layout admin

## Arquivos envolvidos
- `views/admin/usuarios/index.hbs` ← CRIAR (incluindo diretório)

## Passos

### Criar `views/admin/usuarios/index.hbs`

```hbs
{{#> layouts/admin}}
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h2>Usuários</h2>
    <a href="/admin/usuarios/novo" class="btn btn-primary">+ Novo Usuário</a>
  </div>

  {{#if flash.success}}
    <div class="alert alert-success">{{flash.success}}</div>
  {{/if}}
  {{#if flash.error}}
    <div class="alert alert-danger">{{flash.error}}</div>
  {{/if}}

  <table class="table table-bordered">
    <thead>
      <tr>
        <th>Nome</th>
        <th>E-mail</th>
        <th>Perfil</th>
        <th>Eventos</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      {{#each usuarios}}
        <tr>
          <td>{{nome}}</td>
          <td>{{email}}</td>
          <td>
            <span class="badge
              {{#if (eq perfil 'admin')}}bg-danger
              {{else if (eq perfil 'gestor')}}bg-warning text-dark
              {{else}}bg-info text-dark{{/if}}">
              {{perfil}}
            </span>
          </td>
          <td>{{eventos.length}}</td>
          <td>
            <a href="/admin/usuarios/{{id}}/editar" class="btn btn-sm btn-secondary">Editar</a>
            <form method="POST" action="/admin/usuarios/{{id}}/deletar" class="d-inline"
                  onsubmit="return confirm('Arquivar este usuário?')">
              <button type="submit" class="btn btn-sm btn-warning">Arquivar</button>
            </form>
          </td>
        </tr>
      {{else}}
        <tr><td colspan="5" class="text-center">Nenhum usuário cadastrado.</td></tr>
      {{/each}}
    </tbody>
  </table>

  {{#if arquivados.length}}
    <details class="mt-4">
      <summary class="fw-bold text-muted">Arquivados ({{arquivados.length}})</summary>
      <table class="table table-sm mt-2">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Perfil</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {{#each arquivados}}
            <tr>
              <td>{{nome}}</td>
              <td>{{email}}</td>
              <td>{{perfil}}</td>
              <td>
                <form method="POST" action="/admin/usuarios/{{id}}/restaurar" class="d-inline">
                  <button type="submit" class="btn btn-sm btn-success">Restaurar</button>
                </form>
              </td>
            </tr>
          {{/each}}
        </tbody>
      </table>
    </details>
  {{/if}}
{{/layouts/admin}}
```

**Observação:** O helper `eq` deve estar registrado no express-handlebars. Se não existir, registrar em `app.js`:
```js
eq: (a, b) => a === b
```

## Resultado esperado
Listagem com badge de perfil colorido, contagem de eventos e seção arquivados expansível.

## Critério de aceite
- Badge de perfil usa cores diferentes por nível
- `eventos.length` exibe número de eventos do usuário
- Seção arquivados só aparece quando `arquivados.length > 0`
- Confirmar antes de arquivar via `confirm()`
