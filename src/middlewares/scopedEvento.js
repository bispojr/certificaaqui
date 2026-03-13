module.exports = async function scopedEvento(req, res, next) {
  if (req.usuario.perfil === 'admin') return next()

  // Para rotas de listagem (GET sem id), gestor/monitor só pode acessar participantes do seu evento
  if (req.method === 'GET' && !req.params.id) {
    if (!req.usuario.evento_id) {
      return res
        .status(403)
        .json({ error: 'Acesso restrito ao evento vinculado.' })
    }
    // Se o token é de outro evento, bloqueia
    if (
      req.query.evento_id &&
      Number(req.query.evento_id) !== req.usuario.evento_id
    ) {
      return res
        .status(403)
        .json({ error: 'Acesso restrito ao evento vinculado.' })
    }
    req.query.evento_id = req.usuario.evento_id
    return next()
  }

  // Para rotas de consulta/alteração, buscar o evento vinculado
  const eventoId =
    req.body.evento_id || req.params.eventoId || req.usuario.evento_id
  if (eventoId && req.usuario.evento_id === eventoId) {
    return next()
  }
  return res.status(403).json({ error: 'Acesso restrito ao evento vinculado.' })
}
