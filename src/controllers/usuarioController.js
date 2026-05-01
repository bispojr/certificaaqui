const { Usuario } = require('../models')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('JWT_SECRET não configurado')

module.exports = {
  async updateEventos(req, res) {
    const { papel, id, usuarioId } = req.params
    // Só admin pode acessar/gerenciar usuários
    if (
      !req.usuario ||
      req.usuario.perfil !== 'admin' ||
      req.usuario.id !== Number(id) ||
      papel !== 'admin'
    ) {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    try {
      const usuario = await Usuario.findByPk(usuarioId)
      if (!usuario)
        return res.status(404).json({ error: 'Usuário não encontrado' })
      const { eventos } = req.body
      if (!Array.isArray(eventos))
        return res.status(400).json({ error: 'Eventos deve ser um array' })
      // Checa duplicidade
      if (new Set(eventos).size !== eventos.length)
        return res
          .status(400)
          .json({ error: 'Eventos duplicados não são permitidos' })
      // Checa existência dos eventos
      const eventosExistentes = await usuario.sequelize.models.Evento.findAll({
        where: { id: eventos },
      })
      if (eventosExistentes.length !== eventos.length)
        return res.status(400).json({ error: 'Um ou mais eventos não existem' })
      await usuario.setEventos(eventos)
      await usuario.reload({ include: 'eventos' })
      return res.status(200).json(usuario)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  },
  async login(req, res) {
    const { email, senha } = req.body
    const usuario = await Usuario.findOne({ where: { email } })
    if (!usuario)
      return res.status(401).json({ error: 'Usuário não encontrado' })
    const valid = await bcrypt.compare(senha, usuario.senha)
    if (!valid) return res.status(401).json({ error: 'Senha inválida' })
    const token = jwt.sign(
      { id: usuario.id, perfil: usuario.perfil },
      JWT_SECRET,
      { expiresIn: '1h' },
    )
    return res.json({ token })
  },

  async logout(req, res) {
    // Logout é stateless com JWT, apenas orienta o frontend a descartar o token
    return res.status(200).json({ message: 'Logout realizado' })
  },

  async me(req, res) {
    if (!req.usuario) return res.status(401).json({ error: 'Não autenticado' })
    const usuario = await Usuario.findByPk(req.usuario.id)
    if (!usuario)
      return res.status(404).json({ error: 'Usuário não encontrado' })
    return res.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    })
  },

  async create(req, res) {
    const { papel, id } = req.params
    // Só admin pode acessar/gerenciar usuários
    if (
      !req.usuario ||
      req.usuario.perfil !== 'admin' ||
      req.usuario.id !== Number(id) ||
      papel !== 'admin'
    ) {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    try {
      const { nome, email, senha, perfil, eventos } = req.body
      if (Array.isArray(eventos)) {
        // Checa duplicidade
        if (new Set(eventos).size !== eventos.length) {
          return res
            .status(400)
            .json({ error: 'Eventos duplicados não são permitidos' })
        }
        // Checa existência dos eventos
        const eventosExistentes = await Usuario.sequelize.models.Evento.findAll(
          { where: { id: eventos } },
        )
        if (eventosExistentes.length !== eventos.length) {
          return res
            .status(400)
            .json({ error: 'Um ou mais eventos não existem' })
        }
      }
      const usuario = await Usuario.create({ nome, email, senha, perfil })
      if (Array.isArray(eventos) && eventos.length > 0) {
        await usuario.setEventos(eventos)
      }
      await usuario.reload({ include: 'eventos' })
      return res.status(201).json(usuario)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  },
}
