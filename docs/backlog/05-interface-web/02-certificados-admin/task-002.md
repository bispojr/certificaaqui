# TASK ID: CERT-ADMIN-002

## Título

Criar `views/admin/certificados/index.hbs` com filtros e modal de cancelamento

## Objetivo

View de listagem de certificados com formulário de filtros (evento, status, tipo), tabela de ativos, modal de confirmação de cancelamento e seção `<details>` de arquivados.

## Contexto

- Layout: `layouts/admin`
- Dados: `certificados`, `arquivados`, `eventos`, `tipos`, `filtros: { status, evento_id, tipo_id }`
- Cancelar: `POST /admin/certificados/:id/cancelar` — não destrói, muda status
- Arquivar (soft delete): não há rota de arquivar exposta na listagem (apenas cancelar e detalhe)
- Restaurar arquivados: `POST /admin/certificados/:id/restaurar`
- `Participante` acessado via `certificado.Participante.nomeCompleto`
- `Evento` acessado via `certificado.Evento.nome`
- Status badge: `emitido` → `bg-success`, `pendente` → `bg-warning text-dark`, `cancelado` → `bg-secondary`
- Modal Bootstrap 5 para confirmar cancelamento (evita form submit acidental)

## Arquivos envolvidos

- `views/admin/certificados/index.hbs` ← CRIAR (incluindo diretório)

## Passos

### Criar `views/admin/certificados/index.hbs`

```hbs
{{#> layouts/admin}}
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h2>Certificados</h2>
    <a href="/admin/certificados/novo" class="btn btn-primary">+ Novo Certificado</a>
  </div>

  {{#if flash.success}}<div class="alert alert-success">{{flash.success}}</div>{{/if}}
  {{#if flash.error}}<div class="alert alert-danger">{{flash.error}}</div>{{/if}}

  {{! Filtros }}
  <form method="GET" action="/admin/certificados" class="row g-2 mb-3">
    <div class="col-auto">
      <select name="evento_id" class="form-select form-select-sm">
        <option value="">Todos os eventos</option>
        {{#each eventos}}
          <option value="{{id}}" {{#if (eq (toString id) ../filtros.evento_id)}}selected{{/if}}>{{nome}}</option>
        {{/each}}
      </select>
    </div>
    <div class="col-auto">
      <select name="status" class="form-select form-select-sm">
        <option value="">Todos os status</option>
        <option value="emitido"   {{#if (eq ../filtros.status 'emitido')}}selected{{/if}}>emitido</option>
        <option value="pendente"  {{#if (eq ../filtros.status 'pendente')}}selected{{/if}}>pendente</option>
        <option value="cancelado" {{#if (eq ../filtros.status 'cancelado')}}selected{{/if}}>cancelado</option>
      </select>
    </div>
    <div class="col-auto">
      <select name="tipo_id" class="form-select form-select-sm">
        <option value="">Todos os tipos</option>
        {{#each tipos}}
          <option value="{{id}}" {{#if (eq (toString id) ../filtros.tipo_id)}}selected{{/if}}>{{descricao}}</option>
        {{/each}}
      </select>
    </div>
    <div class="col-auto">
      <button type="submit" class="btn btn-sm btn-secondary">Filtrar</button>
      <a href="/admin/certificados" class="btn btn-sm btn-outline-secondary">Limpar</a>
    </div>
  </form>

  <table class="table table-bordered table-sm">
    <thead>
      <tr>
        <th>Código</th>
        <th>Participante</th>
        <th>Evento</th>
        <th>Status</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      {{#each certificados}}
        <tr>
          <td><code>{{codigo}}</code></td>
          <td>{{Participante.nomeCompleto}}</td>
          <td>{{Evento.nome}}</td>
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
          </td>
        </tr>
      {{else}}
        <tr><td colspan="5" class="text-center">Nenhum certificado encontrado.</td></tr>
      {{/each}}
    </tbody>
  </table>

  {{! Modal de cancelamento }}
  <div class="modal fade" id="modalCancelar" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Confirmar cancelamento</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          Cancelar o certificado <strong id="modalCancelarNome"></strong>?
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Não</button>
          <form id="formCancelar" method="POST" action="">
            <button type="submit" class="btn btn-warning">Sim, cancelar</button>
          </form>
        </div>
      </div>
    </div>
  </div>

  {{#if arquivados.length}}
    <details class="mt-4">
      <summary class="fw-bold text-muted">Arquivados ({{arquivados.length}})</summary>
      <table class="table table-sm mt-2">
        <thead>
          <tr><th>Código</th><th>Participante</th><th>Evento</th><th>Ações</th></tr>
        </thead>
        <tbody>
          {{#each arquivados}}
            <tr>
              <td><code>{{codigo}}</code></td>
              <td>{{Participante.nomeCompleto}}</td>
              <td>{{Evento.nome}}</td>
              <td>
                <form method="POST" action="/admin/certificados/{{id}}/restaurar" class="d-inline">
                  <button type="submit" class="btn btn-sm btn-success">Restaurar</button>
                </form>
              </td>
            </tr>
          {{/each}}
        </tbody>
      </table>
    </details>
  {{/if}}

  <script>
    document.getElementById('modalCancelar').addEventListener('show.bs.modal', function (e) {
      const btn = e.relatedTarget
      document.getElementById('modalCancelarNome').textContent = btn.dataset.nome
      document.getElementById('formCancelar').action =
        '/admin/certificados/' + btn.dataset.id + '/cancelar'
    })
  </script>
{{/layouts/admin}}
```

**Helper necessário:** `toString` para comparar `id` (integer) com `filtros.evento_id` (string de query). Registrar em `app.js` se não existir:

```js
toString: (val) => String(val ?? '')
```

## Critério de aceite

- Filtros submetidos como GET preservam valores selecionados nos selects
- Badge de status usa cor correta em cada estado
- Botão "Cancelar" não aparece em certificados já cancelados (`{{#unless (eq status 'cancelado')}}`)
- Modal preenche nome e action corretos via `data-*` atributos
- Seção arquivados só aparece se `arquivados.length > 0`
