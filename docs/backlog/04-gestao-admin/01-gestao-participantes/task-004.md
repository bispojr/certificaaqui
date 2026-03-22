# TASK ID: ADMIN-PART-004

## Título
Criar `views/admin/participantes/form.hbs`

## Objetivo
Criar o formulário Handlebars compartilhado para criação e edição de participantes, com preenchimento dinâmico dos campos no modo edição.

## Contexto
- Usa `layout: 'layouts/admin'` (passado pelo controller)
- Variáveis: `participante?` (presente apenas em modo edição), `action` (URL do POST), `title`
- Campos do modelo: `nomeCompleto` (obrigatório), `email` (obrigatório, type=email), `instituicao` (opcional)
- No modo edição, `participante.nomeCompleto`, `participante.email`, `participante.instituicao` estão preenchidos

## Arquivos envolvidos
- `views/admin/participantes/form.hbs` (CRIAR)

## Passos

Criar o arquivo com o conteúdo:

```hbs
<h2>{{title}}</h2>
<div class="row mt-3">
  <div class="col-md-6">
    <form method="POST" action="{{action}}">
      <div class="mb-3">
        <label for="nomeCompleto" class="form-label">
          Nome completo <span class="text-danger">*</span>
        </label>
        <input
          type="text"
          class="form-control"
          name="nomeCompleto"
          id="nomeCompleto"
          value="{{participante.nomeCompleto}}"
          required
        />
      </div>
      <div class="mb-3">
        <label for="email" class="form-label">
          E-mail <span class="text-danger">*</span>
        </label>
        <input
          type="email"
          class="form-control"
          name="email"
          id="email"
          value="{{participante.email}}"
          required
        />
      </div>
      <div class="mb-3">
        <label for="instituicao" class="form-label">Instituição</label>
        <input
          type="text"
          class="form-control"
          name="instituicao"
          id="instituicao"
          value="{{participante.instituicao}}"
        />
      </div>
      <button type="submit" class="btn btn-primary">Salvar</button>
      <a href="/admin/participantes" class="btn btn-secondary ms-2">Cancelar</a>
    </form>
  </div>
</div>
```

## Resultado esperado
- `GET /admin/participantes/novo` renderiza formulário em branco
- `GET /admin/participantes/:id/editar` renderiza formulário com dados do participante preenchidos
- Em caso de erro no POST, controller re-renderiza com `participante: req.body` para preservar o que o usuário digitou

## Critério de aceite
- Campo `email` tem `type="email"` e `required`
- Campo `nomeCompleto` tem `required`
- Campo `instituicao` NÃO tem `required`
- `action` é dinâmico via `{{action}}`
- Botão "Cancelar" aponta para `/admin/participantes`
