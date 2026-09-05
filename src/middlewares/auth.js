const jwt = require('jsonwebtoken')
const { Usuario } = require('../models')
const { fromApi } = require('../services/auth/canonicalPrincipalFactory')
const {
  resolveAuthorizationScope,
} = require('../services/auth/resolveAuthorizationScope')

const secret = process.env.JWT_SECRET
if (!secret) throw new Error('JWT_SECRET não configurado')

module.exports = async function auth(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.principal = null
    req.contextoAutorizacao = { eventoIds: null, scopeMode: 'global' }
    return res.status(401).json({ error: 'Token não fornecido' })
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, secret)
    const usuario = await Usuario.findByPk(decoded.id)
    if (!usuario) {
      req.principal = null
      req.contextoAutorizacao = { eventoIds: null, scopeMode: 'global' }
      return res.status(401).json({ error: 'Usuário não encontrado' })
    }
    req.usuario = usuario
    req.principal = fromApi({ usuario, decodedToken: decoded, rawToken: token })
    try {
      req.contextoAutorizacao = await resolveAuthorizationScope({
        usuario,
        principal: req.principal,
        strict: false,
      })
    } catch {
      req.contextoAutorizacao = { eventoIds: [], scopeMode: 'scoped_events' }
    }
    next()
  } catch {
    req.principal = null
    req.contextoAutorizacao = { eventoIds: null, scopeMode: 'global' }
    return res.status(401).json({ error: 'Token inválido' })
  }
}
