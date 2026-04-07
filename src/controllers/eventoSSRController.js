const eventoService = require('../services/eventoService')
const { Evento } = require('../models')
const { Op } = require('sequelize')

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
          include: [{
            association: 'usuarios',
            where: { id: req.usuario.id },
            through: { attributes: [] },
          }],
        })
        arquivados = await Evento.findAll({
          paranoid: false,
          where: { deleted_at: { [Op.ne]: null } },
          include: [{
            association: 'usuarios',
            where: { id: req.usuario.id },
            through: { attributes: [] },
          }],
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
      await eventoService.create(req.body)
      req.flash('success', 'Evento criado com sucesso.')
      return res.redirect('/admin/eventos')
    } catch (err) {
      req.flash('error', err.message)
      return res.render('admin/eventos/form', {
        layout: 'layouts/admin',
        title: 'Novo Evento',
        action: '/admin/eventos',
        evento: req.body,
      })
    }
  },

  async atualizar(req, res) {
    try {
      await eventoService.update(req.params.id, req.body)
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
