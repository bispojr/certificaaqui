# TASK ID: FRONT-BUSCA-002

## Título

Adicionar campo de busca `?q=` na listagem de eventos (nome + código_base)

## Tipo

código

## Dependências

Nenhuma (independente das demais tasks de busca)

## Objetivo

Adicionar busca por texto livre na listagem de eventos, filtrando por `Evento.nome` e `Evento.codigo_base` via `ILIKE`. O controller `eventoSSRController.index()` atualmente não possui nenhum filtro por query string — será o primeiro.

## Arquivos envolvidos

- `src/controllers/eventoSSRController.js` — função `index()`
- `views/admin/eventos/index.hbs`

## Modificações em `eventoSSRController.js`

### Situação atual

```js
async index(req, res) {
  try {
    let eventos, arquivados
    if (req.usuario.perfil === 'admin') {
      eventos = await Evento.findAll()
      arquivados = await Evento.findAll({
        paranoid: false,
        where: { deleted_at: { [Op.ne]: null } },
      })
    } else if (req.usuario.perfil === 'gestor') {
      eventos = await Evento.findAll({ include: [...] })
      // ...
    }
    return res.render('admin/eventos/index', { ... })
```

### Situação desejada

```js
async index(req, res) {
  try {
    const { q } = req.query
    const searchWhere = {}
    if (q) {
      searchWhere[Op.or] = [
        { nome: { [Op.iLike]: `%${q}%` } },
        { codigo_base: { [Op.iLike]: `%${q}%` } },
      ]
    }

    let eventos, arquivados
    if (req.usuario.perfil === 'admin') {
      eventos = await Evento.findAll({ where: searchWhere })
      arquivados = await Evento.findAll({
        paranoid: false,
        where: { deleted_at: { [Op.ne]: null }, ...searchWhere },
      })
    } else if (req.usuario.perfil === 'gestor') {
      eventos = await Evento.findAll({
        where: searchWhere,
        include: [...], // include existente de associação de usuário
      })
      // idem para arquivados
    }
    return res.render('admin/eventos/index', {
      layout: 'layouts/admin',
      title: 'Eventos',
      eventos: eventos.map((e) => e.toJSON()),
      arquivados: arquivados.map((e) => e.toJSON()),
      q,
    })
```

**Nota:** `Op` já está importado no topo do arquivo (`const { Op } = require('sequelize')`). Confirmar antes de adicionar import duplicado.

## Modificações em `eventos/index.hbs`

Adicionar form de busca antes da tabela (padrão equivalente ao de participantes):

```hbs
<form method='GET' action='/admin/eventos' class='mb-3 d-flex gap-2'>
  <input
    type='text'
    class='form-control'
    name='q'
    value='{{q}}'
    placeholder='Buscar por nome ou código base'
  />
  <button type='submit' class='btn btn-outline-secondary'>Buscar</button>
  {{#if q}}
    <a href='/admin/eventos' class='btn btn-outline-secondary'>Limpar</a>
  {{/if}}
</form>
```

Inserir após o cabeçalho `<h2>` / botão "+ Novo Evento" e antes da `<table>`.

## Verificação

```
GET /admin/eventos?q=CBIE
GET /admin/eventos?q=2026
```

Resultado esperado: tabela filtra eventos cujo `nome` ou `codigo_base` contenha o termo (case-insensitive).

## Critério de aceite

- Form de busca com `name="q"` está presente na view
- `eventoSSRController.index()` aplica `Op.iLike` em `nome` e `codigo_base`
- Busca funciona tanto para admin (sem include de usuário) quanto para gestor (com include)
- O valor de `q` é preservado no input após submit
- `npm run check` passa
