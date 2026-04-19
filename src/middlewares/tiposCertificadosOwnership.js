const { TiposCertificados } = require('../models')

/**
 * Middleware de ownership para tipos de certificados.
 *
 * Regras:
 * - admin: passa sempre
 * - GET (qualquer): passa sempre (pode visualizar qualquer tipo)
 * - POST (criação): verifica se req.body.evento_id pertence ao usuário
 * - PUT / DELETE / PATCH (mutação por :id): carrega o tipo e verifica se
 *   seu evento_id pertence ao usuário
 * - monitor: nunca pode criar/editar/deletar (403)
 */
module.exports = async function tiposCertificadosOwnership(req, res, next) {
  const usuario = req.usuario

  // Admins têm acesso irrestrito
  if (usuario.perfil === 'admin') return next()

  // Monitores não podem realizar mutações
  if (usuario.perfil === 'monitor') {
    return res.status(403).json({
      error:
        'Acesso negado: monitores não podem modificar tipos de certificados.',
    })
  }

  // Gestor: obtém eventos vinculados
  if (typeof usuario.getEventos !== 'function') {
    return res
      .status(500)
      .json({ error: 'Usuário sem método getEventos (modelo N:N)' })
  }
  const eventos = await usuario.getEventos()
  const eventosIds = eventos.map((e) => Number(e.id))

  if (!eventosIds.length) {
    return res
      .status(403)
      .json({ error: 'Acesso restrito: nenhum evento vinculado.' })
  }

  // POST (criação): valida evento_id do body
  if (req.method === 'POST') {
    const eventoId = Number(req.body.evento_id)
    if (!eventoId || !eventosIds.includes(eventoId)) {
      return res
        .status(403)
        .json({ error: 'Acesso restrito: evento não pertence ao seu escopo.' })
    }
    return next()
  }

  // PUT / DELETE / PATCH: valida evento_id do tipo existente
  const tipoId = req.params.id
  if (!tipoId) return next()

  const tipo = await TiposCertificados.findByPk(tipoId, { paranoid: false })
  if (!tipo) return next() // deixa o controller devolver 404

  if (!eventosIds.includes(Number(tipo.evento_id))) {
    return res.status(403).json({
      error: 'Acesso restrito: tipo de certificado pertence a outro evento.',
    })
  }

  return next()
}
