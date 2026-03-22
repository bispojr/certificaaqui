# TASK ID: SSR-PUB-001

## Título
Adicionar spinner de loading em `views/certificados/form-validar.hbs`

## Objetivo
Espelhar o comportamento de `form-obter.hbs`: ao submeter o formulário, desabilitar o botão e exibir um spinner Bootstrap 5 enquanto aguarda a resposta do servidor.

## Contexto
- `form-validar.hbs` atual: botão submit simples, sem `id` no form nem no botão, sem spinner
- Padrão de referência: `form-obter.hbs` usa `id="form-obter"`, `id="btn-buscar"`, `id="spinner"` com `display:none`
- O spinner SSR é simples: `.spinner-border` + `<p>` de texto; JS nativo no evento `submit`

## Arquivos envolvidos
- `views/certificados/form-validar.hbs` ← MODIFICAR

## Passos

### Substituir o conteúdo de `views/certificados/form-validar.hbs`

**Antes:**
```hbs
<form method="POST" action="/certificados/validar">
  ...
  <button type="submit" class="btn btn-primary">Validar</button>
</form>
```

**Depois** — adicionar `id` no form e botão, inserir div spinner e script:
```hbs
<div class="row justify-content-center mt-5">
  <div class="col-md-6">
    <h2>Validar certificado</h2>
    {{#if mensagem}}
    <div class="alert alert-warning">{{mensagem}}</div>
    {{/if}}
    <form method="POST" action="/certificados/validar" id="form-validar">
      <div class="mb-3">
        <label for="codigo" class="form-label">Código do certificado</label>
        <input
          type="text"
          class="form-control"
          name="codigo"
          id="codigo"
          required
        />
      </div>
      <button type="submit" class="btn btn-primary" id="btn-validar">Validar</button>
    </form>
    <div id="spinner-validar" class="text-center mt-3" style="display:none">
      <div class="spinner-border" role="status"></div>
      <p>Validando certificado...</p>
    </div>
    <script>
      document
        .getElementById('form-validar')
        .addEventListener('submit', function () {
          document.getElementById('btn-validar').disabled = true
          document.getElementById('spinner-validar').style.display = 'block'
        })
    </script>
  </div>
</div>
```

## Resultado esperado
Ao submeter o formulário de validação, o botão é desabilitado e o spinner aparece, idêntico ao comportamento de `form-obter.hbs`.

## Critério de aceite
- `id="form-validar"` no `<form>`
- `id="btn-validar"` no `<button>`
- `id="spinner-validar"` na div com `style="display:none"`
- Script desabilita botão e exibe spinner no evento `submit`
- Action do form permanece `/certificados/validar` (será corrigida por CERT-SSR-005 em Domínio 3)
