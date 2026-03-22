# TASK ID: CERT-SSR-002

## Título
Criar `views/certificados/validar-resultado.hbs`

## Objetivo
Criar a view Handlebars que exibe o resultado da validação de um certificado — painel verde quando válido, painel vermelho quando inválido.

## Contexto
- A view será renderizada pelo `POST /public/pagina/validar` (criado em CERT-SSR-004)
- Variáveis disponíveis no template: `valido` (boolean), `certificado` (objeto — presente apenas quando `valido: true`)
- Quando `valido: true`, `certificado` tem: `nome`, `codigo`, `status`, `created_at`, `Participante.nome`, `Participante.email`, `Evento.nome`
- Usar layout padrão `layout.hbs`
- Bootstrap 5 disponível via CDN

## Arquivos envolvidos
- `views/certificados/validar-resultado.hbs` (CRIAR)

## Passos

Criar o arquivo com o conteúdo:

```hbs
<div class="row justify-content-center mt-5">
  <div class="col-md-7">
    {{#if valido}}
    <div class="card border-success">
      <div class="card-header bg-success text-white">
        <h4 class="mb-0">✔ Certificado Válido</h4>
      </div>
      <div class="card-body">
        <dl class="row">
          <dt class="col-sm-4">Nome</dt>
          <dd class="col-sm-8">{{certificado.nome}}</dd>

          <dt class="col-sm-4">Código</dt>
          <dd class="col-sm-8"><code>{{certificado.codigo}}</code></dd>

          <dt class="col-sm-4">Participante</dt>
          <dd class="col-sm-8">{{certificado.Participante.nome}}</dd>

          <dt class="col-sm-4">E-mail</dt>
          <dd class="col-sm-8">{{certificado.Participante.email}}</dd>

          <dt class="col-sm-4">Evento</dt>
          <dd class="col-sm-8">{{certificado.Evento.nome}}</dd>

          <dt class="col-sm-4">Status</dt>
          <dd class="col-sm-8">{{certificado.status}}</dd>

          <dt class="col-sm-4">Emitido em</dt>
          <dd class="col-sm-8">{{certificado.created_at}}</dd>
        </dl>
        <a href="/public/certificados/{{certificado.id}}/pdf" class="btn btn-success" target="_blank">
          Baixar PDF
        </a>
      </div>
    </div>
    {{else}}
    <div class="card border-danger">
      <div class="card-header bg-danger text-white">
        <h4 class="mb-0">✘ Certificado Inválido</h4>
      </div>
      <div class="card-body">
        <p class="text-danger">Nenhum certificado foi encontrado com este código.</p>
      </div>
    </div>
    {{/if}}

    <a href="/public/pagina/validar" class="btn btn-link mt-3">← Validar outro código</a>
  </div>
</div>
```

## Resultado esperado
- `valido: true` → painel verde com dados do certificado e link de PDF
- `valido: false` → painel vermelho com mensagem de erro

## Critério de aceite
- View renderiza sem erro quando `valido: false` e `certificado` é `undefined`
- Painel verde inclui link para `/public/certificados/:id/pdf`
- Link "Validar outro código" aponta para `/public/pagina/validar`
