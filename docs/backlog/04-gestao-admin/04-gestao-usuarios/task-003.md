# TASK ID: ADMIN-USR-003

## Título
Criar `views/admin/usuarios/form.hbs` com multi-select de eventos e senha opcional

## Objetivo
Formulário para criar/editar usuário com seleção múltipla de eventos (multi-select com checkboxes JS), select de perfil e campo senha opcional em modo edição.

## Contexto
- Layout: `layouts/admin`
- Dados: `usuario` (null em criação; JSON com `eventoIds: number[]` em edição) e `eventos` (array `{id, nome}`)
- `<select multiple name="eventos">` com opções pré-selecionadas em edição (via `eventoIds`)
- Senha exibida sempre; em edição, placeholder "Deixe em branco para não alterar"
- `required` na senha apenas em modo criação (verificado via `{{#unless usuario}}`)
- Bootstrap 5 via layout admin

## Arquivos envolvidos
- `views/admin/usuarios/form.hbs` ← CRIAR

## Passos

### Criar `views/admin/usuarios/form.hbs`

```hbs
{{#> layouts/admin}}
  <h2>{{#if usuario}}Editar{{else}}Novo{{/if}} Usuário</h2>

  {{#if flash.error}}
    <div class="alert alert-danger">{{flash.error}}</div>
  {{/if}}

  <form method="POST"
        action="{{#if usuario}}/admin/usuarios/{{usuario.id}}{{else}}/admin/usuarios{{/if}}">

    <div class="mb-3">
      <label class="form-label">Nome</label>
      <input type="text" name="nome" class="form-control" value="{{usuario.nome}}" required>
    </div>

    <div class="mb-3">
      <label class="form-label">E-mail</label>
      <input type="email" name="email" class="form-control" value="{{usuario.email}}" required>
    </div>

    <div class="mb-3">
      <label class="form-label">Senha</label>
      <input type="password" name="senha" class="form-control"
             placeholder="{{#if usuario}}Deixe em branco para não alterar{{else}}Senha{{/if}}"
             {{#unless usuario}}required{{/unless}}>
    </div>

    <div class="mb-3">
      <label class="form-label">Perfil</label>
      <select name="perfil" class="form-select" required>
        <option value="admin"   {{#if (eq usuario.perfil 'admin')}}selected{{/if}}>admin</option>
        <option value="gestor"  {{#if (eq usuario.perfil 'gestor')}}selected{{/if}}>gestor</option>
        <option value="monitor" {{#if (eq usuario.perfil 'monitor')}}selected{{/if}}>monitor</option>
      </select>
    </div>

    <div class="mb-3">
      <label class="form-label">Eventos <small class="text-muted">(Ctrl+clique para múltiplos)</small></label>
      <select name="eventos" id="eventos" class="form-select" multiple size="6">
        {{#each eventos}}
          <option value="{{id}}"
            {{#if ../usuario}}
              {{#if (includes ../usuario.eventoIds id)}}selected{{/if}}
            {{/if}}>
            {{nome}}
          </option>
        {{/each}}
      </select>
    </div>

    <button type="submit" class="btn btn-primary">Salvar</button>
    <a href="/admin/usuarios" class="btn btn-secondary">Cancelar</a>
  </form>
{{/layouts/admin}}
```

**Helpers Handlebars necessários** — registrar em `app.js` se não existirem:
```js
eq: (a, b) => a === b,
includes: (arr, val) => Array.isArray(arr) && arr.includes(val),
```

O helper `includes` é necessário para `{{#if (includes ../usuario.eventoIds id)}}`.

## Resultado esperado
Formulário funcional com senha opcional em edição (vazio = sem alteração), seleção múltipla de eventos pré-marcada.

## Critério de aceite
- Senha sem `required` em modo edição; com `required` em modo criação
- Multi-select pré-seleciona eventos já associados ao usuário em modo edição
- Perfil select pré-selecionado em modo edição
- Formulário posts para `/admin/usuarios` (criar) ou `/admin/usuarios/:id` (editar)
