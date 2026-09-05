const { scopeGuard } = require('../services/auth/scopeGuard')
const {
  resolveAuthorizationScope,
} = require('../services/auth/resolveAuthorizationScope')

module.exports = async function scopedEvento(req, res, next) {
  try {
    if (!req.usuario || !req.usuario.perfil) {
      return res.status(403).json({ error: 'Usuário não autenticado.' })
    }

    if (req.usuario.perfil === 'admin') {
      req.contextoAutorizacao = { eventoIds: null, scopeMode: 'global' }
      return next()
    }

    if (!req.contextoAutorizacao) {
      req.contextoAutorizacao = await resolveAuthorizationScope({
        usuario: req.usuario,
        principal: req.principal || { role: req.usuario.perfil },
        strict: false,
      })
    }

    const { eventoIds } = req.contextoAutorizacao
    const requestedEventId =
      req.body?.evento_id ??
      req.params?.eventoId ??
      req.params?.id ??
      req.query?.evento_id ??
      null

    if (!Array.isArray(eventoIds) || eventoIds.length === 0) {
      throw new Error(
        'Negação segura: escopo de eventos não resolvido para perfil restrito.',
      )
    }

    if (req.method === 'GET' && !req.params.id) {
      if (
        requestedEventId !== null &&
        requestedEventId !== undefined &&
        requestedEventId !== ''
      ) {
        scopeGuard({
          principal: req.principal || { role: req.usuario.perfil },
          eventoIds,
          requestedEventId,
        })
      }
      req.query.evento_id =
        req.query.evento_id ??
        (eventoIds.length === 1 ? String(eventoIds[0]) : eventoIds)
      return next()
    }

    scopeGuard({
      principal: req.principal || { role: req.usuario.perfil },
      eventoIds,
      requestedEventId,
    })
    return next()
  } catch (error) {
    const message = error.message || 'Acesso restrito.'
    if (
      message.includes('nenhum evento') ||
      message.includes('não resolvido') ||
      message.includes('escopo de eventos')
    ) {
      return res
        .status(403)
        .json({ error: 'Acesso restrito: nenhum evento vinculado.' })
    }
    if (
      message.includes('fora do escopo') ||
      message.includes('evento solicitado')
    ) {
      return res
        .status(403)
        .json({ error: 'Acesso restrito ao evento vinculado.' })
    }
    return res.status(403).json({ error: message })
  }
}
