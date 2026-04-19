// Middleware para validar se o usuário autenticado tem o papel e id corretos para acessar a rota
// Uso: deve ser aplicado após o middleware de autenticação (auth)

module.exports = function authorizeUser(req, res, next) {
  const { papel, id } = req.params
  const usuario = req.usuario
  if (!usuario) return res.status(401).json({ error: 'Não autenticado' })
  if (usuario.perfil !== papel || usuario.id !== Number(id)) {
    // Admin pode acessar recursos de outros perfis
    if (usuario.perfil !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado: papel/id não conferem.' })
    }
  }
  next()
}
