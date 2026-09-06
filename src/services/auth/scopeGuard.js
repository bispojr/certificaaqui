function scopeGuard({ principal, eventoIds, requestedEventId = null } = {}) {
  const role = principal?.role ?? principal?.perfil

  if (!role) {
    throw new Error(
      'Negação segura: principal autenticado sem role para bloquear acesso.',
    )
  }

  if (role === 'admin') {
    return true
  }

  if (!Array.isArray(eventoIds) || eventoIds.length === 0) {
    throw new Error(
      'Negação segura: escopo de eventos não resolvido para perfil restrito.',
    )
  }

  if (
    requestedEventId !== null &&
    requestedEventId !== undefined &&
    requestedEventId !== ''
  ) {
    const normalized = Number(requestedEventId)
    if (Number.isFinite(normalized) && !eventoIds.includes(normalized)) {
      throw new Error(
        'Negação segura: evento solicitado fora do escopo autorizado.',
      )
    }
  }

  return true
}

module.exports = {
  scopeGuard,
}
