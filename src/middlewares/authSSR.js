const jwt = require('jsonwebtoken')
const { Usuario } = require('../models')

module.exports = async function authSSR(req, res, next) {
  const token = req.cookies?.token
  if (!token) {
    req.usuario = null
    res.locals.usuario = null
    return next()
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const usuario = await Usuario.findByPk(decoded.id)
    if (!usuario) {
      req.usuario = null
      res.locals.usuario = null
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
    return next()
  }
}
