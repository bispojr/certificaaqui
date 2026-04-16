const jwt = require('jsonwebtoken')
const { Usuario } = require('../models')

module.exports = async function authSSR(req, res, next) {
  // Mock para testes: permite injetar usuário fake via header
  if (process.env.NODE_ENV === 'test' && req.headers['x-mock-user']) {
    try {
      const mockUser = JSON.parse(req.headers['x-mock-user'])
      req.usuario = mockUser
      res.locals.usuario = mockUser
      req.session.mockUser = mockUser
      return next()
    } catch {
      return res.status(400).send('Mock user inválido')
    }
  }

  // Em modo de teste, verifica usuário persistido na sessão pelo mockLogin
  if (process.env.NODE_ENV === 'test' && req.session?.mockUser) {
    const mockUser = { ...req.session.mockUser }
    if (!mockUser.getEventos) {
      mockUser.getEventos = async () => [{ id: 1, nome: 'Evento Teste' }]
    }
    req.usuario = mockUser
    res.locals.usuario = mockUser
    return next()
  }

  const token = req.cookies?.token

  if (!token) {
    req.usuario = null
    res.locals.usuario = null
    // Se for rota SSR (admin), redireciona para login
    if (req.originalUrl.startsWith('/admin')) {
      return res.redirect('/auth/login')
    }
    return next()
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const usuario = await Usuario.findByPk(decoded.id)
    if (!usuario) {
      req.usuario = null
      res.locals.usuario = null
      if (req.originalUrl.startsWith('/admin')) {
        return res.redirect('/auth/login')
      }
      return next()
    }
    const usuarioData = {
      id: usuario.id,
      nome: usuario.nome,
      perfil: usuario.perfil,
      isAdmin: usuario.perfil === 'admin',
      isGestor: usuario.perfil === 'gestor',
    }
    req.usuario = usuarioData
    res.locals.usuario = usuarioData
    next()
  } catch {
    req.usuario = null
    res.locals.usuario = null
    if (req.originalUrl.startsWith('/admin')) {
      return res.redirect('/auth/login')
    }
    return next()
  }
}
