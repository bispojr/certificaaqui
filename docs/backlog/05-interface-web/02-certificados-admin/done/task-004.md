# TASK ID: CERT-ADMIN-004

## Título

Criar `views/admin/certificados/form.hbs` com campos dinâmicos carregados via `fetch`

## Objetivo

Formulário para criar/editar certificado. Quando o usuário seleciona um `TipoCertificado`, o formulário faz `fetch` para a API REST (`GET /tipos-certificados/:id`) e renderiza dinamicamente os campos de `dados_dinamicos` como `<input>`, serializando os valores em `<input type="hidden" name="valores_dinamicos_json">` antes do submit.

## Contexto

- Layout: `layouts/admin`
- Dados: `certificado` (null em criação; JSON com includes em edição), `participantes`, `eventos`, `tipos`
- `dados_dinamicos`: objeto `{ chave: rótulo }` — cada chave vira um campo do formulário
- Em modo edição: pré-preenche campos de `valores_dinamicos` existentes
- `GET /tipos-certificados/:id` (API REST existente) retorna o tipo com `dados_dinamicos`
- Serialização final: `valores_dinamicos_json = JSON.stringify({ chave: valor, ... })`

## Arquivos envolvidos

- `views/admin/certificados/form.hbs` ← CRIAR

## Passos

### Criar `views/admin/certificados/form.hbs`

```hbs
{{#> layouts/admin}}
  <h2>{{#if certificado}}Editar{{else}}Novo{{/if}} Certificado</h2>

  {{#if flash.error}}<div class="alert alert-danger">{{flash.error}}</div>{{/if}}

  <form id="certForm" method="POST"
        action="{{#if certificado}}/admin/certificados/{{certificado.id}}{{else}}/admin/certificados{{/if}}">

    <div class="mb-3">
      <label class="form-label">Participante</label>
      <select name="participante_id" class="form-select" required>
        <option value="">Selecione...</option>
        {{#each participantes}}
          <option value="{{id}}"
            {{#if (eq (toString id) (toString ../certificado.participante_id))}}selected{{/if}}>
            {{nomeCompleto}} — {{email}}
          </option>
        {{/each}}
      </select>
    </div>

    <div class="mb-3">
      <label class="form-label">Evento</label>
      <select name="evento_id" class="form-select" required>
        <option value="">Selecione...</option>
        {{#each eventos}}
          <option value="{{id}}"
            {{#if (eq (toString id) (toString ../certificado.evento_id))}}selected{{/if}}>
            {{nome}}
          </option>
        {{/each}}
      </select>
    </div>

    <div class="mb-3">
      <label class="form-label">Tipo de Certificado</label>
      <select name="tipo_certificado_id" id="tipoSelect" class="form-select" required>
        <option value="">Selecione...</option>
        {{#each tipos}}
          <option value="{{id}}"
            {{#if (eq (toString id) (toString ../certificado.tipo_certificado_id))}}selected{{/if}}>
            {{descricao}}
          </option>
        {{/each}}
      </select>
    </div>

    <div class="mb-3">
      <label class="form-label">Status</label>
      <select name="status" class="form-select">
        <option value="emitido"   {{#if (eq certificado.status 'emitido')}}selected{{/if}}>emitido</option>
        <option value="pendente"  {{#if (eq certificado.status 'pendente')}}selected{{/if}}>pendente</option>
        <option value="cancelado" {{#if (eq certificado.status 'cancelado')}}selected{{/if}}>cancelado</option>
      </select>
    </div>

    <div id="camposDinamicos" class="mb-3" style="display:none">
      <label class="form-label fw-bold">Campos do Certificado</label>
      <div id="camposDinamicosContainer"></div>
      <input type="hidden" name="valores_dinamicos_json" id="valores_dinamicos_json">
    </div>

    <button type="submit" class="btn btn-primary">Salvar</button>
    <a href="/admin/certificados" class="btn btn-secondary">Cancelar</a>
  </form>

  <script>
    // Valores já existentes em modo edição
    const valoresExistentes = {{{json certificado.valores_dinamicos}}} || {};

    async function carregarCampos(tipoId) {
      if (!tipoId) {
        document.getElementById('camposDinamicos').style.display = 'none';
        return;
      }
      try {
        const res = await fetch('/tipos-certificados/' + tipoId);
        const tipo = await res.json();
        const container = document.getElementById('camposDinamicosContainer');
        container.innerHTML = '';
        const campos = tipo.dados_dinamicos || {};
        Object.entries(campos).forEach(([chave, rotulo]) => {
          const div = document.createElement('div');
          div.className = 'mb-2';
          div.innerHTML = `
            <label class="form-label">${rotulo} <small class="text-muted">(${chave})</small></label>
            <input type="text" class="form-control campo-dinamico"
                   data-chave="${chave}"
                   value="${valoresExistentes[chave] || ''}">
          `;
          container.appendChild(div);
        });
        document.getElementById('camposDinamicos').style.display = 'block';
        sincronizarJson();
      } catch (e) {
        console.error('Erro ao carregar campos:', e);
      }
    }

    function sincronizarJson() {
      const obj = {};
      document.querySelectorAll('.campo-dinamico').forEach(input => {
        obj[input.dataset.chave] = input.value;
      });
      document.getElementById('valores_dinamicos_json').value = JSON.stringify(obj);
    }

    document.getElementById('tipoSelect').addEventListener('change', function () {
      carregarCampos(this.value);
    });

    document.getElementById('certForm').addEventListener('submit', sincronizarJson);

    // Em modo edição, carrega campos do tipo já selecionado
    const tipoInicial = document.getElementById('tipoSelect').value;
    if (tipoInicial) carregarCampos(tipoInicial);
  </script>
{{/layouts/admin}}
```

**Helpers necessários** (registrar em `app.js` se não existirem):

```js
json: (obj) => JSON.stringify(obj ?? null),
toString: (val) => String(val ?? ''),
eq: (a, b) => a === b,
```

## Critério de aceite

- Selecionar tipo dispara `fetch` para `/tipos-certificados/:id`
- Campos dinâmicos aparecem abaixo do select de tipo com rótulos corretos
- Em modo edição, campos pré-preenchidos com `valoresExistentes[chave]`
- `valores_dinamicos_json` serializado antes do submit via `sincronizarJson()`
- Em modo edição, tipo inicial já carregado na montagem da página (`carregarCampos(tipoInicial)`)

## Metadados

- Completado em: 05/04/2026 10:53 ✅
