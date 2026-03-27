# TASK ID: CERT-SSR-001

## Título

Criar `views/certificados/obter-lista.hbs`

## Objetivo

Criar a view Handlebars que exibe a lista de certificados de um participante com link para download do PDF de cada um.

## Contexto

- A view será renderizada pelo `POST /public/pagina/buscar` (criado em CERT-SSR-004)
- Variáveis disponíveis no template: `certificados` (array), `email` (string)
- Cada item de `certificados` tem: `id`, `nome`, `status`, `created_at`
- A rota de PDF já existe: `GET /public/certificados/:id/pdf`
- Usar layout padrão `layout.hbs` (default do express-handlebars)
- Bootstrap 5 já disponível via CDN no layout

## Arquivos envolvidos

- `views/certificados/obter-lista.hbs` (CRIAR)

## Passos

Criar o arquivo com o conteúdo:

```hbs
<div class="row justify-content-center mt-5">
  <div class="col-md-8">
    <h2>Seus certificados</h2>
    <p class="text-muted">E-mail: <strong>{{email}}</strong></p>

    {{#if certificados.length}}
    <div class="list-group mt-3">
      {{#each certificados}}
      <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
        <div>
          <strong>{{this.nome}}</strong>
          <span class="badge bg-{{#if (eq this.status 'emitido')}}success{{else}}secondary{{/if}} ms-2">
            {{this.status}}
          </span>
        </div>
        <a href="/public/certificados/{{this.id}}/pdf" class="btn btn-sm btn-outline-primary" target="_blank">
          Baixar PDF
        </a>
      </div>
      {{/each}}
    </div>
    {{else}}
    <div class="alert alert-warning mt-3">
      Nenhum certificado encontrado para este e-mail.
    </div>
    {{/if}}

    <a href="/public/pagina/obter" class="btn btn-link mt-3">← Buscar novamente</a>
  </div>
</div>
```

## Resultado esperado

`POST /public/pagina/buscar` com e-mail válido renderiza uma lista com links "Baixar PDF" para cada certificado.

## Critério de aceite

- View renderiza sem erro quando `certificados` é array vazio
- Link de PDF aponta para `/public/certificados/:id/pdf`
- Link "Buscar novamente" aponta para `/public/pagina/obter`

## Metadados

- Completado em: 2026-03-26 20:23 (BRT) ✅
