module.exports = async function scopedEvento(req, res, next) {
  if (req.usuario.perfil === 'admin') return next()

  // Carrega eventos vinculados ao usuário (N:N)
  if (typeof req.usuario.getEventos !== 'function') {
    return res
      .status(500)
      .json({ error: 'Usuário sem método getEventos (modelo N:N)' })
  }
  const eventos = await req.usuario.getEventos()
  const eventosIds = eventos.map((e) => Number(e.id))

  // Se não houver eventos vinculados, bloqueia
  if (!eventosIds.length) {
    return res
      .status(403)
      .json({ error: 'Acesso restrito: nenhum evento vinculado.' })
  }


  // Para rotas de listagem (GET sem eventoId), força filtro pelo(s) evento(s) do usuário
  if (req.method === 'GET' && !req.params.eventoId) {
    if (req.query.evento_id) {
      if (!eventosIds.includes(Number(req.query.evento_id))) {
        return res
          .status(403)
          .json({ error: 'Acesso restrito ao evento vinculado.' })
      }
    } else {
      req.query.evento_id = eventosIds.length === 1 ? eventosIds[0] : eventosIds
    }
    return next()
  }

  // Para rotas de consulta/alteração, buscar o evento alvo
  const eventoId = req.body.evento_id || req.params.eventoId || req.params.id
  if (eventoId && eventosIds.includes(Number(eventoId))) {
    return next()
  }

  return res.status(403).json({ error: 'Acesso restrito ao evento vinculado.' })
}
