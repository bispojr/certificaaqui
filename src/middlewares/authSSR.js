const jwt = require('jsonwebtoken')
const { Usuario } = require('../models')
const { fromSSR } = require('../services/auth/canonicalPrincipalFactory')

function setAnonymous(req, res) {
  req.usuario = null
  req.principal = null
  res.locals.usuario = null
  res.locals.principal = null
}

function setAuthenticated(req, res, usuarioData, principal) {
  req.usuario = usuarioData
  req.principal = principal
  res.locals.usuario = usuarioData
  res.locals.principal = principal
}

module.exports = async function authSSR(req, res, next) {
  // Mock para testes: permite injetar usuário fake via header
  if (process.env.NODE_ENV === 'test' && req.headers['x-mock-user']) {
    try {
      const mockUser = JSON.parse(req.headers['x-mock-user'])
      const principal = fromSSR({
        usuario: mockUser,
        decodedToken: { id: mockUser.id, perfil: mockUser.perfil },
        sessionId: req.sessionID || req.session?.id || 'test-mock-session',
        authChannel: 'ssr_test_mock',
      })

      setAuthenticated(req, res, mockUser, principal)
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
    const principal = fromSSR({
      usuario: mockUser,
      decodedToken: { id: mockUser.id, perfil: mockUser.perfil },
      sessionId: req.sessionID || req.session?.id || 'test-mock-session',
      authChannel: 'ssr_test_mock',
    })

    setAuthenticated(req, res, mockUser, principal)
    return next()
  }

  const token = req.cookies?.token

  if (!token) {
    setAnonymous(req, res)
    // Se for rota SSR (admin), redireciona para login
    if (req.originalUrl.startsWith('/admin')) {
      return res.redirect('/login')
    }
    return next()
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const usuario = await Usuario.findByPk(decoded.id)
    if (!usuario) {
      setAnonymous(req, res)
      if (req.originalUrl.startsWith('/admin')) {
        return res.redirect('/login')
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
    const principal = fromSSR({
      usuario,
      decodedToken: decoded,
      rawToken: token,
      sessionId: req.sessionID || req.session?.id || null,
    })

    setAuthenticated(req, res, usuarioData, principal)
    next()
  } catch {
    setAnonymous(req, res)
    if (req.originalUrl.startsWith('/admin')) {
      return res.redirect('/login')
    }
    return next()
  }
}
