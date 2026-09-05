function normalizeEventIds(eventoIds) {
  if (eventoIds === null || eventoIds === undefined) {
    return []
  }

  if (!Array.isArray(eventoIds)) {
    return []
  }

  return Array.from(
    new Set(
      eventoIds
        .map((eventoId) => Number(eventoId))
        .filter((value) => Number.isFinite(value)),
    ),
  )
}

function enforceTenantScope({
  principal,
  eventoIds,
  requestedEventId = null,
  operationKey = null,
} = {}) {
  const role = principal?.role ?? principal?.perfil

  if (!role) {
    throw new Error(
      'Negação segura: principal autenticado sem role para bloquear acesso.',
    )
  }

  if (role === 'admin') {
    return {
      role,
      eventoIds: null,
      scopeMode: 'global',
      operationKey,
      ok: true,
    }
  }

  const normalizedEventoIds = normalizeEventIds(eventoIds)

  if (normalizedEventoIds.length === 0) {
    throw new Error(
      'Negação segura: escopo de eventos não resolvido para perfil restrito.',
    )
  }

  if (
    requestedEventId !== null &&
    requestedEventId !== undefined &&
    requestedEventId !== ''
  ) {
    const normalizedRequestedId = Number(requestedEventId)
    if (
      Number.isFinite(normalizedRequestedId) &&
      !normalizedEventoIds.includes(normalizedRequestedId)
    ) {
      throw new Error(
        'Negação segura: evento solicitado fora do escopo autorizado.',
      )
    }
  }

  return {
    role,
    eventoIds: normalizedEventoIds,
    scopeMode: 'scoped_events',
    operationKey,
    ok: true,
  }
}

module.exports = {
  enforceTenantScope,
}
