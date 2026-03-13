const roles = ['monitor', 'gestor', 'admin']

module.exports = function rbac(requiredRole) {
  return function (req, res, next) {
    if (!req.usuario || !req.usuario.perfil) {
      return res
        .status(403)
        .json({ error: 'Usuário não autenticado ou sem perfil.' })
    }
    const userRoleIndex = roles.indexOf(req.usuario.perfil)
    const requiredRoleIndex = roles.indexOf(requiredRole)
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
