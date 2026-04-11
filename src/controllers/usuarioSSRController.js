const { Usuario, Evento } = require('../models')
const { Op } = require('sequelize')

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
  } catch (error) {
    console.error('ERRO editar usuarioSSRController:', error)
    req.flash('error', error.message)
    return res.redirect('/admin/usuarios')
  }
}

async function novo(req, res) {
  const eventos = await Evento.findAll({ attributes: ['id', 'nome'] })
  return res.render('admin/usuarios/form', {
    layout: 'layouts/admin',
    usuario: null,
    eventos,
  })
}

async function editar(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      include: [{ model: Evento, as: 'eventos', attributes: ['id'] }],
    })
    if (!usuario) {
      req.flash('error', 'Usuário não encontrado.')
      return res.redirect('/admin/usuarios')
    }
    const todosEventos = await Evento.findAll({ attributes: ['id', 'nome'] })
    const usuarioJson = usuario.toJSON()
    const eventoIds = usuario.eventos.map((e) => e.id)
    usuarioJson.eventoIds = eventoIds
    const eventos = todosEventos.map((e) => ({
      ...e.toJSON(),
      selected: eventoIds.includes(e.id),
    }))
    return res.render('admin/usuarios/form', {
      layout: 'layouts/admin',
      usuario: usuarioJson,
      eventos,
    })
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/usuarios')
  }
}

async function criar(req, res) {
  try {
    const { nome, email, senha, perfil, eventos } = req.body
    const usuario = await Usuario.create({ nome, email, senha, perfil })
    const eventoIds = []
      .concat(eventos || [])
      .map(Number)
      .filter(Boolean)
    if (eventoIds.length > 0) {
      await usuario.setEventos(eventoIds)
    }
    req.flash('success', 'Usuário criado com sucesso.')
    return res.redirect('/admin/usuarios')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/usuarios/novo')
  }
}

async function atualizar(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.params.id)
    if (!usuario) {
      req.flash('error', 'Usuário não encontrado.')
      return res.redirect('/admin/usuarios')
    }
    const { nome, email, senha, perfil, eventos } = req.body
    const campos = { nome, email, perfil }
    if (senha && senha.trim() !== '') campos.senha = senha
    await usuario.update(campos)
    const eventoIds = []
      .concat(eventos || [])
      .map(Number)
      .filter(Boolean)
    await usuario.setEventos(eventoIds)
    req.flash('success', 'Usuário atualizado com sucesso.')
    return res.redirect('/admin/usuarios')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect(`/admin/usuarios/${req.params.id}/editar`)
  }
}

async function deletar(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.params.id)
    if (!usuario) {
      req.flash('error', 'Usuário não encontrado.')
      return res.redirect('/admin/usuarios')
    }
    await usuario.destroy()
    req.flash('success', 'Usuário arquivado.')
    return res.redirect('/admin/usuarios')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/usuarios')
  }
}

async function restaurar(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.params.id, { paranoid: false })
    if (!usuario) {
      req.flash('error', 'Usuário não encontrado.')
      return res.redirect('/admin/usuarios')
    }
    await usuario.restore()
    req.flash('success', 'Usuário restaurado.')
    return res.redirect('/admin/usuarios')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/usuarios')
  }
}

module.exports = { index, novo, editar, criar, atualizar, deletar, restaurar }
