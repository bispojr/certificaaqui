# TASK ID: ADMIN-TIPOS-003

## Título
Criar `views/admin/tipos-certificados/index.hbs`

## Objetivo
View Handlebars para listar tipos de certificados ativos e arquivados no painel admin, exibindo contagem de certificados vinculados.

## Contexto
- Layout: `layouts/admin`
- Dados disponíveis: `tipos` (ativos) e `arquivados` — ambos com `numCertificados`
- Botão de arquivar usa `<form method="POST" action="/admin/tipos-certificados/{{id}}/deletar">`
- Restaurar usa `<form method="POST" action="/admin/tipos-certificados/{{id}}/restaurar">`
- Flash messages via `{{#if flash.success}}` / `{{#if flash.error}}`
- Bootstrap 5 já disponível via layout admin

## Arquivos envolvidos
- `views/admin/tipos-certificados/index.hbs` ← CRIAR (incluindo diretório)

## Passos

### Criar `views/admin/tipos-certificados/index.hbs`

```hbs
{{#> layouts/admin}}
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h2>Tipos de Certificados</h2>
    <a href="/admin/tipos-certificados/novo" class="btn btn-primary">+ Novo Tipo</a>
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
        <th>Código</th>
        <th>Descrição</th>
        <th>Campo Destaque</th>
        <th>Certificados</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      {{#each tipos}}
        <tr>
          <td>{{codigo}}</td>
          <td>{{descricao}}</td>
          <td><code>{{campo_destaque}}</code></td>
          <td>{{numCertificados}}</td>
          <td>
            <a href="/admin/tipos-certificados/{{id}}/editar" class="btn btn-sm btn-secondary">Editar</a>
            <form method="POST" action="/admin/tipos-certificados/{{id}}/deletar" class="d-inline"
                  onsubmit="return confirm('Arquivar este tipo?')">
              <button type="submit" class="btn btn-sm btn-warning">Arquivar</button>
            </form>
          </td>
        </tr>
      {{else}}
        <tr><td colspan="5" class="text-center">Nenhum tipo de certificado cadastrado.</td></tr>
      {{/each}}
    </tbody>
  </table>

  {{#if arquivados.length}}
    <details class="mt-4">
      <summary class="fw-bold text-muted">Arquivados ({{arquivados.length}})</summary>
      <table class="table table-sm mt-2">
        <thead>
          <tr>
            <th>Código</th>
            <th>Descrição</th>
            <th>Certificados</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {{#each arquivados}}
            <tr>
              <td>{{codigo}}</td>
              <td>{{descricao}}</td>
              <td>{{numCertificados}}</td>
              <td>
                <form method="POST" action="/admin/tipos-certificados/{{id}}/restaurar" class="d-inline">
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

## Resultado esperado
Listagem funcional com tabela de ativos e seção `<details>` para arquivados; flash messages visíveis no topo.

## Critério de aceite
- Tabela de ativos tem colunas: Código, Descrição, Campo Destaque, Certificados, Ações
- Ações: botão "Editar" (GET) + form POST "Arquivar" com `confirm()`
- Seção arquivados só aparece quando `arquivados.length > 0`
- Restaurar usa POST para `/:id/restaurar`
