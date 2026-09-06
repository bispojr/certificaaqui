async function resolveAuthorizationScope({
  usuario,
  principal,
  requestedEventId = null,
  strict = true,
} = {}) {
  const role = principal?.role ?? usuario?.perfil

  if (!role) {
    throw new Error(
      'Negação segura: principal autenticado sem role para escopo.',
    )
  }

  if (role === 'admin') {
    return { eventoIds: null, scopeMode: 'global' }
  }

  if (!usuario) {
    throw new Error(
      'Negação segura: usuário não autenticado para resolução de escopo.',
    )
  }

  let eventos = []

  if (typeof usuario.getEventos === 'function') {
    const resolvedEventos = await usuario.getEventos()
    eventos = Array.isArray(resolvedEventos) ? resolvedEventos : []
  } else if (Array.isArray(usuario.eventos)) {
    eventos = usuario.eventos
  }

  const eventoIds = Array.from(
    new Set(
      eventos
        .map((evento) => Number(evento?.id ?? evento))
        .filter((value) => Number.isFinite(value)),
    ),
  )

  if ((!eventoIds.length || eventoIds.length === 0) && strict) {
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

  return {
    eventoIds,
    scopeMode: 'scoped_events',
  }
}

module.exports = {
  resolveAuthorizationScope,
}
