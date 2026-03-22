# TASK ID: ADMIN-PART-003

## Título
Criar `views/admin/participantes/index.hbs`

## Objetivo
Criar a view de listagem de participantes do painel admin com campo de busca GET, tabela com coluna `numCertificados` e seção colapsável de participantes arquivados com botão "Restaurar".

## Contexto
- Usa `layout: 'layouts/admin'` (passado pelo controller)
- Variáveis: `participantes[]`, `arquivados[]`, `q` (string da busca atual)
- Cada `participante` tem: `id`, `nomeCompleto`, `email`, `instituicao`, `numCertificados`
- Cada `arquivado` tem: `id`, `nomeCompleto`, `email`
- Ações: Editar (link GET), Remover (form POST com `confirm()`), Restaurar (form POST)

## Arquivos envolvidos
- `views/admin/participantes/index.hbs` (CRIAR)

## Passos

Criar o arquivo com o conteúdo:

```hbs
<div class="d-flex justify-content-between align-items-center mb-3">
  <h1>Participantes</h1>
  <a href="/admin/participantes/novo" class="btn btn-primary">+ Novo Participante</a>
</div>

<form method="GET" action="/admin/participantes" class="mb-3 d-flex gap-2">
  <input
    type="text"
    class="form-control"
    name="q"
    value="{{q}}"
    placeholder="Buscar por nome ou e-mail"
  />
  <button type="submit" class="btn btn-outline-secondary">Buscar</button>
  {{#if q}}
  <a href="/admin/participantes" class="btn btn-outline-danger">Limpar</a>
  {{/if}}
</form>

<table class="table table-bordered">
  <thead>
    <tr>
      <th>Nome</th>
      <th>E-mail</th>
      <th>Instituição</th>
      <th>Certificados</th>
      <th>Ações</th>
    </tr>
  </thead>
  <tbody>
    {{#each participantes}}
    <tr>
      <td>{{nomeCompleto}}</td>
      <td>{{email}}</td>
      <td>{{instituicao}}</td>
      <td>{{numCertificados}}</td>
      <td>
        <a href="/admin/participantes/{{id}}/editar" class="btn btn-sm btn-warning">Editar</a>
        <form
          method="POST"
          action="/admin/participantes/{{id}}/deletar"
          class="d-inline"
          onsubmit="return confirm('Remover este participante?')"
        >
          <button type="submit" class="btn btn-sm btn-danger">Remover</button>
        </form>
      </td>
    </tr>
    {{else}}
    <tr>
      <td colspan="5" class="text-center text-muted">Nenhum participante encontrado.</td>
    </tr>
    {{/each}}
  </tbody>
</table>

{{#if arquivados.length}}
<details class="mt-4">
  <summary class="btn btn-link">Participantes arquivados ({{arquivados.length}})</summary>
  <table class="table table-bordered mt-2">
    <thead>
      <tr>
        <th>Nome</th>
        <th>E-mail</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      {{#each arquivados}}
      <tr class="table-secondary">
        <td>{{nomeCompleto}}</td>
        <td>{{email}}</td>
        <td>
          <form method="POST" action="/admin/participantes/{{id}}/restaurar" class="d-inline">
            <button type="submit" class="btn btn-sm btn-success">Restaurar</button>
          </form>
        </td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</details>
{{/if}}
```

## Resultado esperado
- `GET /admin/participantes` renderiza tabela com 5 colunas e campo de busca
- `?q=` preenche o input e exibe botão "Limpar"
- Seção de arquivados aparece apenas quando `arquivados.length > 0`
- Botão "Remover" abre diálogo de confirmação antes de submeter

## Critério de aceite
- Campo de busca usa `method="GET"` com `name="q"`
- Tabela principal tem coluna `Certificados` com `{{numCertificados}}`
- `{{else}}` do `{{#each}}` exibe mensagem "Nenhum participante encontrado."
- Seção arquivados usa `<details>` e form POST separado por registros
