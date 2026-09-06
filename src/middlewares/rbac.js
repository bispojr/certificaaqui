const { getMinimumRole } = require('../services/auth/operationPolicyCatalog')

const roles = ['monitor', 'gestor', 'admin']

function resolveRequiredRole(requiredRole) {
  if (typeof requiredRole !== 'string') {
    return 'monitor'
  }

  if (roles.includes(requiredRole)) {
    return requiredRole
  }

  return getMinimumRole(requiredRole)
}

module.exports = function rbac(requiredRole) {
  const normalizedRequiredRole = resolveRequiredRole(requiredRole)

  return function (req, res, next) {
    if (!req.usuario || !req.usuario.perfil) {
      return res
        .status(403)
        .json({ error: 'Usuário não autenticado ou sem perfil.' })
    }

    const userRoleIndex = roles.indexOf(req.usuario.perfil)
    const requiredRoleIndex = roles.indexOf(normalizedRequiredRole)

    if (userRoleIndex === -1 || requiredRoleIndex === -1) {
      return res.status(403).json({ error: 'Perfil inválido.' })
    }

    if (userRoleIndex >= requiredRoleIndex) {
      return next()
    }

    return res
      .status(403)
      .json({ error: 'Acesso negado: perfil insuficiente.' })
  }
}
