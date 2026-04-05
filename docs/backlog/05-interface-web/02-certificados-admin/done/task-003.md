# TASK ID: CERT-ADMIN-003

## Título

Criar `views/admin/certificados/detalhe.hbs` com texto interpolado e link de PDF

## Objetivo

View de detalhe de um certificado exibindo dados completos, texto do certificado com interpolação já processada pelo controller e link para download do PDF.

## Contexto

- Layout: `layouts/admin`
- Dados: `certificado` (JSON com includes), `textoInterpolado` (string processada pelo controller via `templateService.interpolate`)
- `certificado.Participante.nomeCompleto`, `certificado.Evento.nome`, `certificado.TiposCertificado.descricao`
- Link PDF: `GET /public/certificados/:id/pdf` (rota pública existente)
- Status badge segue mesmo padrão de `index.hbs`
- Exibe `valores_dinamicos` como tabela chave→valor para facilitar inspeção

## Arquivos envolvidos

- `views/admin/certificados/detalhe.hbs` ← CRIAR

## Passos

### Criar `views/admin/certificados/detalhe.hbs`

```hbs
{{#> layouts/admin}}
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h2>Certificado <code>{{certificado.codigo}}</code></h2>
    <div>
      <a href="/public/certificados/{{certificado.id}}/pdf"
         class="btn btn-outline-primary" target="_blank">
        Baixar PDF
      </a>
      <a href="/admin/certificados/{{certificado.id}}/editar" class="btn btn-secondary">Editar</a>
      <a href="/admin/certificados" class="btn btn-outline-secondary">Voltar</a>
    </div>
  </div>

  {{#if flash.success}}<div class="alert alert-success">{{flash.success}}</div>{{/if}}
  {{#if flash.error}}<div class="alert alert-danger">{{flash.error}}</div>{{/if}}

  <div class="row g-3">
    <div class="col-md-6">
      <div class="card">
        <div class="card-header fw-bold">Dados</div>
        <ul class="list-group list-group-flush">
          <li class="list-group-item">
            <span class="text-muted">Participante:</span>
            {{certificado.Participante.nomeCompleto}}
            <small class="text-muted">({{certificado.Participante.email}})</small>
          </li>
          <li class="list-group-item">
            <span class="text-muted">Evento:</span> {{certificado.Evento.nome}}
          </li>
          <li class="list-group-item">
            <span class="text-muted">Tipo:</span> {{certificado.TiposCertificado.descricao}}
          </li>
          <li class="list-group-item">
            <span class="text-muted">Status:</span>
            <span class="badge
              {{#if (eq certificado.status 'emitido')}}bg-success
              {{else if (eq certificado.status 'pendente')}}bg-warning text-dark
              {{else}}bg-secondary{{/if}}">
              {{certificado.status}}
            </span>
          </li>
        </ul>
      </div>
    </div>

    {{#if certificado.valores_dinamicos}}
      <div class="col-md-6">
        <div class="card">
          <div class="card-header fw-bold">Valores Dinâmicos</div>
          <table class="table table-sm mb-0">
            <tbody>
              {{#each certificado.valores_dinamicos}}
                <tr>
                  <td class="text-muted fw-bold">{{@key}}</td>
                  <td>{{this}}</td>
                </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
      </div>
    {{/if}}
  </div>

  {{#if textoInterpolado}}
    <div class="card mt-3">
      <div class="card-header fw-bold">Texto do Certificado</div>
      <div class="card-body" style="white-space: pre-wrap;">{{textoInterpolado}}</div>
    </div>
  {{/if}}
{{/layouts/admin}}
```

**Observação:** `{{#each certificado.valores_dinamicos}}` itera sobre as chaves de um objeto JSONB via Handlebars — funciona porque o objeto é serializado ao passar por `toJSON()` no controller.

## Critério de aceite

- Link de PDF abre em nova aba (`target="_blank"`) via rota pública `/public/certificados/:id/pdf`
- `textoInterpolado` exibido com `white-space: pre-wrap` para preservar quebras de linha
- Tabela de `valores_dinamicos` só aparece se o campo não for nulo/vazio
- Status badge usa mesmas cores de `index.hbs`
- Botão "Voltar" leva para `/admin/certificados`

## Metadados

- Completado em: 04/04/2026 21:12 ✅
