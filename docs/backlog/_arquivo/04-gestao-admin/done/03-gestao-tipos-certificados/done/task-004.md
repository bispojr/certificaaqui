# TASK ID: ADMIN-TIPOS-004

## Título

Criar `views/admin/tipos-certificados/form.hbs` com editor JSONB dinâmico

## Objetivo

Formulário para criar/editar tipo de certificado, incluindo:

- Editor dinâmico de campos (`dados_dinamicos`) via JS — adicionar/remover pares chave→rótulo
- `<select id="campo_destaque">` populado dinamicamente via JS a partir dos campos da lista + opção fixa "nome"
- `<input type="hidden" name="dados_dinamicos_json">` serializado antes do submit
- Preview ao vivo de `texto_base` com substituição de `${chave}` pelos rótulos dos campos

## Contexto

- Layout: `layouts/admin`
- Em modo edição: `tipo` tem `dados_dinamicos` (objeto JS) e demais campos preenchidos
- `beforeValidate` hook valida `campo_destaque ∈ keys(dados_dinamicos) ∪ {nome}`
- Bootstrap 5 disponível via layout admin

## Arquivos envolvidos

- `views/admin/tipos-certificados/form.hbs` ← CRIAR (incluindo diretório)

## Passos

### Criar `views/admin/tipos-certificados/form.hbs`

```hbs
{{#> layouts/admin}}
  <h2>{{#if tipo}}Editar{{else}}Novo{{/if}} Tipo de Certificado</h2>

  {{#if flash.error}}
    <div class="alert alert-danger">{{flash.error}}</div>
  {{/if}}

  <form id="tipoForm"
        method="POST"
        action="{{#if tipo}}/admin/tipos-certificados/{{tipo.id}}{{else}}/admin/tipos-certificados{{/if}}">

    <div class="mb-3">
      <label class="form-label">Código</label>
      <input type="text" name="codigo" class="form-control" value="{{tipo.codigo}}" required>
    </div>

    <div class="mb-3">
      <label class="form-label">Descrição</label>
      <input type="text" name="descricao" class="form-control" value="{{tipo.descricao}}" required>
    </div>

    <div class="mb-3">
      <label class="form-label">Campos Dinâmicos <small class="text-muted">(chave → rótulo)</small></label>
      <div id="camposContainer"></div>
      <button type="button" class="btn btn-sm btn-outline-secondary mt-1" onclick="adicionarCampo()">
        + Adicionar campo
      </button>
      <input type="hidden" name="dados_dinamicos_json" id="dados_dinamicos_json">
    </div>

    <div class="mb-3">
      <label class="form-label">Campo Destaque</label>
      <select name="campo_destaque" id="campo_destaque" class="form-select" required>
        <option value="nome" {{#if (eq tipo.campo_destaque "nome")}}selected{{/if}}>nome (fixo)</option>
      </select>
    </div>

    <div class="mb-3">
      <label class="form-label">Texto Base</label>
      <textarea name="texto_base" id="texto_base" class="form-control" rows="5">{{tipo.texto_base}}</textarea>
      <div class="mt-2">
        <label class="form-label text-muted">Preview</label>
        <div id="preview" class="border rounded p-2 bg-light" style="min-height:60px;white-space:pre-wrap;"></div>
      </div>
    </div>

    <button type="submit" class="btn btn-primary">Salvar</button>
    <a href="/admin/tipos-certificados" class="btn btn-secondary">Cancelar</a>
  </form>

  <script>
    // Dados iniciais (edição)
    let dadosDinamicos = {{{json tipo.dados_dinamicos}}};
    if (!dadosDinamicos || typeof dadosDinamicos !== 'object') dadosDinamicos = {};

    function adicionarCampo(chave = '', rotulo = '') {
      const container = document.getElementById('camposContainer');
      const idx = Date.now();
      const div = document.createElement('div');
      div.className = 'd-flex gap-2 mb-1 campo-row';
      div.dataset.idx = idx;
      div.innerHTML = `
        <input type="text" placeholder="chave (sem espaços)" class="form-control campo-chave"
               value="${chave}" oninput="sincronizar()">
        <input type="text" placeholder="rótulo" class="form-control campo-rotulo"
               value="${rotulo}" oninput="sincronizar()">
        <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.campo-row').remove(); sincronizar()">✕</button>
      `;
      container.appendChild(div);
      sincronizar();
    }

    function sincronizar() {
      const obj = {};
      document.querySelectorAll('.campo-row').forEach(row => {
        const chave = row.querySelector('.campo-chave').value.trim();
        const rotulo = row.querySelector('.campo-rotulo').value.trim();
        if (chave) obj[chave] = rotulo;
      });
      document.getElementById('dados_dinamicos_json').value = JSON.stringify(obj);

      // Atualiza select campo_destaque
      const sel = document.getElementById('campo_destaque');
      const atual = sel.value;
      while (sel.options.length > 1) sel.remove(1); // mantém 'nome'
      Object.keys(obj).forEach(k => {
        const opt = new Option(k, k, false, k === atual);
        sel.add(opt);
      });

      atualizarPreview();
    }

    function atualizarPreview() {
      const texto = document.getElementById('texto_base').value;
      const obj = {};
      document.querySelectorAll('.campo-row').forEach(row => {
        const chave = row.querySelector('.campo-chave').value.trim();
        const rotulo = row.querySelector('.campo-rotulo').value.trim();
        if (chave) obj[chave] = `[${rotulo || chave}]`;
      });
      obj['nome'] = '[nome]';
      const preview = texto.replace(/\$\{(\w+)\}/g, (_, k) => obj[k] || `\${${k}}`);
      document.getElementById('preview').textContent = preview;
    }

    document.getElementById('texto_base').addEventListener('input', atualizarPreview);

    // Popula campos existentes em modo edição
    Object.entries(dadosDinamicos).forEach(([k, v]) => adicionarCampo(k, v));
    if (Object.keys(dadosDinamicos).length === 0) sincronizar();

    // Serializa antes do submit
    document.getElementById('tipoForm').addEventListener('submit', () => {
      sincronizar();
    });
  </script>
{{/layouts/admin}}
```

**Observação:** O helper `{{json ...}}` precisa estar registrado no express-handlebars (serializa objeto para JSON inline). Se não existir, registrar em `app.js`:

```js
// em hbs helpers
json: (obj) => JSON.stringify(obj ?? null)
```

## Resultado esperado

Formulário funcional com editor JSONB dinâmico, select `campo_destaque` auto-populado e preview ao vivo.

## Critério de aceite

- "+ Adicionar campo" adiciona par chave/rótulo
- `dados_dinamicos_json` é serializado antes do submit
- `campo_destaque` sempre tem opção "nome" + opções dos campos dinâmicos
- Em modo edição, campos preenchidos com dados do `tipo`
- Preview atualiza ao digitar em `texto_base`

## Metadados

- Completado em: 03/04/2026 18:26 (BRT) ✅
