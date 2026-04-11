# TASK ID: FRONT-BUSCA-003

## Título

Adicionar campo de busca `?q=` na listagem de usuários (nome + e-mail)

## Tipo

código

## Dependências

Nenhuma (independente das demais tasks de busca)

## Objetivo

Adicionar busca por texto livre na listagem de usuários, filtrando por `Usuario.nome` e `Usuario.email` via `ILIKE`. Idêntico ao padrão de participantes — apenas usuários com perfil `admin` acessam esta rota.

## Arquivos envolvidos

- `src/controllers/usuarioSSRController.js` — função `index()`
- `views/admin/usuarios/index.hbs`

## Modificações em `usuarioSSRController.js`

### Situação atual

```js
async function index(req, res) {
  try {
    const usuarios = await Usuario.findAll({
      include: [{ model: Evento, as: 'eventos', attributes: ['id', 'nome'] }],
    })
    const arquivados = await Usuario.findAll({
      paranoid: false,
      where: { deleted_at: { [Op.ne]: null } },
    })
    return res.render('admin/usuarios/index', {
      layout: 'layouts/admin',
      usuarios,
      arquivados,
    })
```

### Situação desejada

```js
async function index(req, res) {
  try {
    const { q } = req.query
    const where = {}
    if (q) {
      where[Op.or] = [
        { nome: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
      ]
    }

    const usuarios = await Usuario.findAll({
      where,
      include: [{ model: Evento, as: 'eventos', attributes: ['id', 'nome'] }],
    })
    const arquivados = await Usuario.findAll({
      paranoid: false,
      where: { deleted_at: { [Op.ne]: null }, ...where },
    })
    return res.render('admin/usuarios/index', {
      layout: 'layouts/admin',
      usuarios,
      arquivados,
      q,
    })
```

**Nota:** `Op` já está importado no topo do arquivo (`const { Op } = require('sequelize')`). Confirmar antes de adicionar import duplicado. Há também um `console.error` na função — confirmar com BACK-REQ se deve ser removido ou mantido.

## Modificações em `usuarios/index.hbs`

Adicionar form de busca antes da tabela (após cabeçalho + remoção dos blocos de flash se FRONT-BUG-001 já foi executado):

```hbs
<form method='GET' action='/admin/usuarios' class='mb-3 d-flex gap-2'>
  <input
    type='text'
    class='form-control'
    name='q'
    value='{{q}}'
    placeholder='Buscar por nome ou e-mail'
  />
  <button type='submit' class='btn btn-outline-secondary'>Buscar</button>
  {{#if q}}
    <a href='/admin/usuarios' class='btn btn-outline-secondary'>Limpar</a>
  {{/if}}
</form>
```

## Verificação

```
GET /admin/usuarios?q=esdras
GET /admin/usuarios?q=@gmail.com
```

Resultado esperado: tabela filtra usuários cujo `nome` ou `email` contenha o termo (case-insensitive).

## Critério de aceite

- Form de busca com `name="q"` está presente na view
- `usuarioSSRController.index()` aplica `Op.iLike` em `nome` e `email`
- O valor de `q` é preservado no input após submit
- Busca também filtra a seção de arquivados (spreading `where` na query de arquivados)
- `npm run check` passa
