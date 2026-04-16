# TASK ID: FRONT-BUSCA-001

## Título

Adicionar campo de busca `?q=` na listagem de certificados (nome do participante + código)

## Tipo

código

## Dependências

Nenhuma (independente das demais tasks de busca)

## Objetivo

Adicionar busca por texto livre na listagem de certificados, filtrando por nome do participante associado (`Participante.nome`) e pelo código do certificado (`Certificado.codigo`) via `ILIKE`. O campo de busca deve coexistir com os selects de filtro já existentes (`evento_id`, `status`, `tipo_id`).

## Arquivos envolvidos

- `src/controllers/certificadoSSRController.js` — função `index()`
- `views/admin/certificados/index.hbs` — form de filtros existente

## Modificações em `certificadoSSRController.js`

### Situação atual

```js
async function index(req, res) {
  try {
    const { status, evento_id, tipo_id } = req.query
    const where = {}
    if (status) where.status = status
    if (evento_id) where.evento_id = Number(evento_id)
    if (tipo_id) where.tipo_certificado_id = Number(tipo_id)
    // ...
```

### Situação desejada

```js
async function index(req, res) {
  try {
    const { status, evento_id, tipo_id, q } = req.query
    const where = {}
    if (status) where.status = status
    if (evento_id) where.evento_id = Number(evento_id)
    if (tipo_id) where.tipo_certificado_id = Number(tipo_id)
    if (q) {
      where[Op.or] = [
        { '$Participante.nome$': { [Op.iLike]: `%${q}%` } },
        { codigo: { [Op.iLike]: `%${q}%` } },
      ]
    }
    // Passar q para o template para manter o valor no input
    // ...
    return res.render('admin/certificados/index', {
      // ...
      filtros: { status, evento_id, tipo_id, q },
    })
```

**Nota:** A busca por `Participante.nome` requer que o `include: [Participante]` já esteja presente no `findAll` / `findAllForSSR`. Verificar se a query existente já inclui a associação. Se BACK-LIST-002 ainda não estiver implementada, adicionar `include: [{ model: Participante, attributes: ['nome'] }]` diretamente.

**Verificar imports:** `Op` já está importado em `certificadoSSRController.js`? Se não, adicionar:

```js
const { Op } = require('sequelize')
```

## Modificações em `certificados/index.hbs`

Adicionar campo de texto ao form de filtros existente (antes do botão "Filtrar"):

```hbs
<form method='GET' action='/admin/certificados' class='row g-2 mb-3'>
  {{! Selects existentes (evento_id, status, tipo_id) permanecem inalterados }}
  <div class='col-auto'>
    <input
      type='text'
      class='form-control form-control-sm'
      name='q'
      value='{{filtros.q}}'
      placeholder='Buscar por nome ou código'
    />
  </div>
  <div class='col-auto'>
    <button type='submit' class='btn btn-sm btn-secondary'>Filtrar</button>
    <a
      href='/admin/certificados'
      class='btn btn-sm btn-outline-secondary'
    >Limpar</a>
  </div>
</form>
```

## Verificação

Acessar `/admin/certificados?q=CERT-2026` e verificar que a tabela filtra por código.
Acessar `/admin/certificados?q=silva` e verificar que filtra por nome de participante (case-insensitive).
Combinar com outro filtro: `/admin/certificados?q=silva&status=emitido`.

## Critério de aceite

- Campo de texto com `name="q"` está presente no form de filtros
- `certificadoSSRController.index()` consome `req.query.q` e aplica `Op.iLike` em `codigo` e `Participante.nome`
- O valor de `q` é preservado no input após submit (via `filtros.q`)
- Filtros `evento_id`, `status`, `tipo_id` continuam funcionando combinados com `q`
- `npm run check` passa
