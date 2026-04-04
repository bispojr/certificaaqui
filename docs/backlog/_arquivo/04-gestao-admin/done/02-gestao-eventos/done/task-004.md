# TASK ID: ADMIN-EVT-004

## Título

Criar `views/admin/eventos/index.hbs` e `views/admin/eventos/form.hbs`

## Objetivo

Criar as duas views Handlebars para a gestão de eventos no painel admin: listagem com seção de arquivados e formulário compartilhado criar/editar.

## Contexto

- Ambas usam `layout: 'layouts/admin'` (passado pelo controller)
- `index.hbs` recebe: `eventos[]`, `arquivados[]`, `title`
  - Cada evento tem: `id`, `nome`, `codigo_base`, `ano`
  - Ações: Editar (link GET), Remover (form POST com confirm), Restaurar (form POST)
- `form.hbs` recebe: `evento?` (modo edição), `action`, `title`
  - Campo `codigo_base` com `pattern="[A-Za-z]{3}"` e `maxlength="3"` conforme validação do model
- `views/layouts/admin.hbs` já existe (criado em TASK-028-D)

## Arquivos envolvidos

- `views/admin/eventos/index.hbs` (CRIAR)
- `views/admin/eventos/form.hbs` (CRIAR)

## Passos

### 1. Criar `views/admin/eventos/index.hbs`:

```hbs
<div class='d-flex justify-content-between align-items-center mb-3'>
  <h1>Eventos</h1>
  <a href='/admin/eventos/novo' class='btn btn-primary'>+ Novo Evento</a>
</div>

<table class='table table-bordered'>
  <thead>
    <tr>
      <th>Nome</th>
      <th>Código base</th>
      <th>Ano</th>
      <th>Ações</th>
    </tr>
  </thead>
  <tbody>
    {{#each eventos}}
      <tr>
        <td>{{nome}}</td>
        <td><code>{{codigo_base}}</code></td>
        <td>{{ano}}</td>
        <td>
          <a
            href='/admin/eventos/{{id}}/editar'
            class='btn btn-sm btn-warning'
          >Editar</a>
          <form
            method='POST'
            action='/admin/eventos/{{id}}/deletar'
            class='d-inline'
            onsubmit="return confirm('Remover este evento?')"
          >
            <button type='submit' class='btn btn-sm btn-danger'>Remover</button>
          </form>
        </td>
      </tr>
    {{else}}
      <tr>
        <td colspan='4' class='text-center text-muted'>Nenhum evento cadastrado.</td>
      </tr>
    {{/each}}
  </tbody>
</table>

{{#if arquivados.length}}
  <details class='mt-4'>
    <summary class='btn btn-link'>Eventos arquivados ({{arquivados.length}})</summary>
    <table class='table table-bordered mt-2'>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Código base</th>
          <th>Ano</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {{#each arquivados}}
          <tr class='table-secondary'>
            <td>{{nome}}</td>
            <td><code>{{codigo_base}}</code></td>
            <td>{{ano}}</td>
            <td>
              <form
                method='POST'
                action='/admin/eventos/{{id}}/restaurar'
                class='d-inline'
              >
                <button
                  type='submit'
                  class='btn btn-sm btn-success'
                >Restaurar</button>
              </form>
            </td>
          </tr>
        {{/each}}
      </tbody>
    </table>
  </details>
{{/if}}
```

### 2. Criar `views/admin/eventos/form.hbs`:

```hbs
<h2>{{title}}</h2>
<div class='row mt-3'>
  <div class='col-md-6'>
    <form method='POST' action='{{action}}'>
      <div class='mb-3'>
        <label for='nome' class='form-label'>
          Nome do evento
          <span class='text-danger'>*</span>
        </label>
        <input
          type='text'
          class='form-control'
          name='nome'
          id='nome'
          value='{{evento.nome}}'
          required
        />
      </div>
      <div class='mb-3'>
        <label for='codigo_base' class='form-label'>
          Código base (3 letras)
          <span class='text-danger'>*</span>
        </label>
        <input
          type='text'
          class='form-control'
          name='codigo_base'
          id='codigo_base'
          value='{{evento.codigo_base}}'
          required
          pattern='[A-Za-z]{3}'
          maxlength='3'
          title='Exatamente 3 letras sem números ou símbolos'
        />
      </div>
      <div class='mb-3'>
        <label for='ano' class='form-label'>
          Ano
          <span class='text-danger'>*</span>
        </label>
        <input
          type='number'
          class='form-control'
          name='ano'
          id='ano'
          value='{{evento.ano}}'
          required
          min='2000'
          max='2100'
        />
      </div>
      <button type='submit' class='btn btn-primary'>Salvar</button>
      <a href='/admin/eventos' class='btn btn-secondary ms-2'>Cancelar</a>
    </form>
  </div>
</div>
```

## Resultado esperado

- `GET /admin/eventos/novo` → formulário em branco
- `GET /admin/eventos/:id/editar` → formulário com campos preenchidos
- `GET /admin/eventos` → tabela com eventos ativos e seção colapsável de arquivados

## Critério de aceite

- `form.hbs`: campo `codigo_base` tem `pattern="[A-Za-z]{3}"` e `maxlength="3"`
- `index.hbs`: botão "Remover" abre `confirm()` antes de submeter
- `index.hbs`: seção de arquivados usa `<details>` e só aparece quando `arquivados.length > 0`
- `index.hbs`: `{{else}}` do `{{#each}}` exibe mensagem quando lista vazia

## Metadados

- Completado em: 22/03/2026 21:17 ✅
