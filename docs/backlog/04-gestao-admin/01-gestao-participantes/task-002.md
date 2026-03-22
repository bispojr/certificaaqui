# TASK ID: ADMIN-PART-002

## Título
Criar `src/controllers/participanteSSRController.js`

## Objetivo
Criar o controller SSR com 7 métodos que gerenciam o CRUD de participantes no painel admin, incluindo busca por nome/email via `Op.iLike` e contagem de certificados por participante.

## Contexto
- `src/models/participante.js`: campos `nomeCompleto` (field: `nome_completo`), `email`, `instituicao`; `paranoid: true`; `hasMany(Certificado, { as: 'certificados' })`
- `src/models/certificado.js`: `belongsTo(Participante, { foreignKey: 'participante_id' })`
- `src/services/participanteService.js`: `findById`, `create`, `update`, `delete`, `restore` já existem
- `req.flash` disponível via `connect-flash` configurado em `app.js`
- Busca: `?q=` filtra por `nomeCompleto` ou `email` com `Op.iLike` (case-insensitive no PostgreSQL)
- Contagem de certificados via `include` com `Certificado`; `numCertificados` é derivado do length do array

## Arquivos envolvidos
- `src/controllers/participanteSSRController.js` (CRIAR)

## Passos

Criar o arquivo com o conteúdo:

```js
const participanteService = require('../services/participanteService')
const { Participante, Certificado } = require('../models')
const { Op } = require('sequelize')

module.exports = {
  async index(req, res) {
    try {
      const { q } = req.query
      const where = q
        ? {
            [Op.or]: [
              { nomeCompleto: { [Op.iLike]: `%${q}%` } },
              { email: { [Op.iLike]: `%${q}%` } },
            ],
          }
        : {}

      const participantes = await Participante.findAll({
        where,
        include: [{ model: Certificado, as: 'certificados' }],
      })
      const arquivados = await Participante.findAll({
        paranoid: false,
        where: { deleted_at: { [Op.ne]: null } },
      })

      return res.render('admin/participantes/index', {
        layout: 'layouts/admin',
        title: 'Participantes',
        participantes: participantes.map((p) => ({
          ...p.toJSON(),
          numCertificados: p.certificados ? p.certificados.length : 0,
        })),
        arquivados: arquivados.map((p) => p.toJSON()),
        q: q || '',
      })
    } catch (err) {
      req.flash('error', err.message)
      return res.redirect('/admin/dashboard')
    }
  },

  novo(req, res) {
    return res.render('admin/participantes/form', {
      layout: 'layouts/admin',
      title: 'Novo Participante',
      action: '/admin/participantes',
    })
  },

  async editar(req, res) {
    try {
      const participante = await participanteService.findById(req.params.id)
      if (!participante) {
        req.flash('error', 'Participante não encontrado.')
        return res.redirect('/admin/participantes')
      }
      return res.render('admin/participantes/form', {
        layout: 'layouts/admin',
        title: 'Editar Participante',
        action: `/admin/participantes/${req.params.id}`,
        participante: participante.toJSON(),
      })
    } catch (err) {
      req.flash('error', err.message)
      return res.redirect('/admin/participantes')
    }
  },

  async criar(req, res) {
    try {
      await participanteService.create(req.body)
      req.flash('success', 'Participante criado com sucesso.')
      return res.redirect('/admin/participantes')
    } catch (err) {
      req.flash('error', err.message)
      return res.render('admin/participantes/form', {
        layout: 'layouts/admin',
        title: 'Novo Participante',
        action: '/admin/participantes',
        participante: req.body,
      })
    }
  },

  async atualizar(req, res) {
    try {
      await participanteService.update(req.params.id, req.body)
      req.flash('success', 'Participante atualizado com sucesso.')
      return res.redirect('/admin/participantes')
    } catch (err) {
      req.flash('error', err.message)
      return res.redirect(`/admin/participantes/${req.params.id}/editar`)
    }
  },

  async deletar(req, res) {
    try {
      await participanteService.delete(req.params.id)
      req.flash('success', 'Participante removido.')
      return res.redirect('/admin/participantes')
    } catch (err) {
      req.flash('error', err.message)
      return res.redirect('/admin/participantes')
    }
  },

  async restaurar(req, res) {
    try {
      await participanteService.restore(req.params.id)
      req.flash('success', 'Participante restaurado com sucesso.')
      return res.redirect('/admin/participantes')
    } catch (err) {
      req.flash('error', err.message)
      return res.redirect('/admin/participantes')
    }
  },
}
```

## Resultado esperado
- `GET /admin/participantes` renderiza lista com contagem de certificados por participante
- `GET /admin/participantes?q=joao` filtra por nome ou email contendo "joao"
- Participantes arquivados aparecem na seção separada

## Critério de aceite
- Controller exporta os 7 métodos: `index`, `novo`, `editar`, `criar`, `atualizar`, `deletar`, `restaurar`
- `index` com `?q=` aplica `Op.iLike` no `nomeCompleto` e no `email`
- `criar` re-renderiza o form com `participante: req.body` em caso de erro (preserva os valores digitados)
- `numCertificados` é calculado via `p.certificados.length`
