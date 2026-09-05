function normalizeEventosIds(legacyUsuario) {
  if (Array.isArray(legacyUsuario.eventosIds)) {
    return legacyUsuario.eventosIds
      .map((eventoId) => Number(eventoId))
      .filter((eventoId) => Number.isFinite(eventoId))
  }

  if (Array.isArray(legacyUsuario.eventos)) {
    return legacyUsuario.eventos
      .map((evento) => Number(evento?.id))
      .filter((eventoId) => Number.isFinite(eventoId))
  }

  return []
}

function createFallbackGetEventos(legacyUsuario) {
  const eventosIds = normalizeEventosIds(legacyUsuario)
  return async () => eventosIds.map((eventoId) => ({ id: eventoId }))
}

function resolveGetEventos(legacyUsuario) {
  if (typeof legacyUsuario.getEventos === 'function') {
    return legacyUsuario.getEventos.bind(legacyUsuario)
  }

  return createFallbackGetEventos(legacyUsuario)
}

function toLegacyUsuario(principal, legacyUsuario = {}) {
  if (!principal) {
    throw new Error('principal canônico é obrigatório para adaptar o legado')
  }

  const role = principal.role
  const subjectId = principal.subjectId

  return {
    ...legacyUsuario,
    id: legacyUsuario.id ?? subjectId,
    nome: legacyUsuario.nome ?? null,
    email: legacyUsuario.email ?? null,
    perfil: legacyUsuario.perfil ?? role,
    isAdmin: role === 'admin',
    isGestor: role === 'gestor',
    isMonitor: role === 'monitor',
    subjectId,
    role,
    authChannel: principal.authChannel,
    sessionId: principal.sessionId ?? null,
    tokenId: principal.tokenId ?? null,
    tenantScopeMode: principal.tenantScopeMode,
    principal,
    getEventos: resolveGetEventos(legacyUsuario),
  }
}

module.exports = {
  toLegacyUsuario,
}