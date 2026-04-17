const eventoService = require('../services/eventoService')
const { Evento } = require('../models')
const { Op } = require('sequelize')
const r2Service = require('../services/r2Service')

/**
 * Builda a key R2 para o template base do evento.
 * Formato: templates/<slug-nome>/<ano>/base.<ext>
 */
function buildTemplateKey(nome, ano, mimetype) {
  const slug = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  const ext = mimetype === 'image/png' ? 'png' : 'jpg'
  return `templates/${slug}/${ano}/base.${ext}`
}

/**
 * Se houver arquivo em req.file, faz upload ao R2 e retorna a key.
 * Caso contrário, retorna null.
 */
async function handleTemplateUpload(req) {
  if (!req.file) return null
  const { nome, ano } = req.body
  const key = buildTemplateKey(nome, String(ano), req.file.mimetype)
  await r2Service.uploadFile(key, req.file.buffer, req.file.mimetype)
  return key
}

module.exports = {
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
        eventos = await Evento.findAll({
          include: [
            {
              association: 'usuarios',
              where: { id: req.usuario.id },
              through: { attributes: [] },
            },
          ],
        })
        arquivados = await Evento.findAll({
          paranoid: false,
          where: { deleted_at: { [Op.ne]: null } },
          include: [
            {
              association: 'usuarios',
              where: { id: req.usuario.id },
              through: { attributes: [] },
            },
          ],
        })
      } else {
        eventos = []
        arquivados = []
      }
      return res.render('admin/eventos/index', {
        layout: 'layouts/admin',
        title: 'Eventos',
        eventos: eventos.map((e) => e.toJSON()),
        arquivados: arquivados.map((e) => e.toJSON()),
      })
    } catch (err) {
      req.flash('error', err.message)
      return res.redirect('/admin/dashboard')
    }
  },

  novo(req, res) {
    return res.render('admin/eventos/form', {
      layout: 'layouts/admin',
      title: 'Novo Evento',
      action: '/admin/eventos',
    })
  },

  async editar(req, res) {
    try {
      const evento = await eventoService.findById(req.params.id)
      if (!evento) {
        req.flash('error', 'Evento não encontrado.')
        return res.redirect('/admin/eventos')
      }
      return res.render('admin/eventos/form', {
        layout: 'layouts/admin',
        title: 'Editar Evento',
        action: `/admin/eventos/${req.params.id}`,
        evento: evento.toJSON(),
      })
    } catch (err) {
      req.flash('error', err.message)
      return res.redirect('/admin/eventos')
    }
  },

  async criar(req, res) {
    try {
      const urlTemplateBase = await handleTemplateUpload(req)
      const data = { ...req.body }
      if (urlTemplateBase) data.url_template_base = urlTemplateBase
      for (const field of [
        'texto_x',
        'texto_y',
        'validacao_x',
        'validacao_y',
      ]) {
        if (data[field] === '' || data[field] === undefined) data[field] = null
        else data[field] = parseInt(data[field], 10) || null
      }
      await eventoService.create(data)
      req.flash('success', 'Evento criado com sucesso.')
      return res.redirect('/admin/eventos')
    } catch (err) {
      const errorMessage =
        err.name === 'SequelizeUniqueConstraintError'
          ? 'Já existe um evento com este código base.'
          : err.message
      return res.render('admin/eventos/form', {
        layout: 'layouts/admin',
        title: 'Novo Evento',
        action: '/admin/eventos',
        evento: req.body,
        flash: { error: [errorMessage], success: [] },
      })
    }
  },

  async atualizar(req, res) {
    try {
      const urlTemplateBase = await handleTemplateUpload(req)
      const data = { ...req.body }
      if (urlTemplateBase) data.url_template_base = urlTemplateBase
      for (const field of [
        'texto_x',
        'texto_y',
        'validacao_x',
        'validacao_y',
      ]) {
        if (data[field] === '' || data[field] === undefined) data[field] = null
        else data[field] = parseInt(data[field], 10) || null
      }
      await eventoService.update(req.params.id, data)
      req.flash('success', 'Evento atualizado com sucesso.')
      return res.redirect('/admin/eventos')
    } catch (err) {
      req.flash('error', err.message)
      return res.redirect(`/admin/eventos/${req.params.id}/editar`)
    }
  },

  async deletar(req, res) {
    try {
      await eventoService.delete(req.params.id)
      req.flash('success', 'Evento removido.')
      return res.redirect('/admin/eventos')
    } catch (err) {
      req.flash('error', err.message)
      return res.redirect('/admin/eventos')
    }
  },

  async restaurar(req, res) {
    try {
      await eventoService.restore(req.params.id)
      req.flash('success', 'Evento restaurado com sucesso.')
      return res.redirect('/admin/eventos')
    } catch (err) {
      req.flash('error', err.message)
      return res.redirect('/admin/eventos')
    }
  },
}
