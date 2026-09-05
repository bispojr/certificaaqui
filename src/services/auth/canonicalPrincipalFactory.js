function resolveSubjectId(usuario, decodedToken) {
  const rawId = decodedToken?.id ?? decodedToken?.sub ?? usuario?.id
  if (rawId === undefined || rawId === null) {
    throw new Error('Não foi possível resolver subjectId do principal canônico')
  }
  const asNumber = Number(rawId)
  return Number.isFinite(asNumber) ? asNumber : String(rawId)
}

function resolveRole(usuario, decodedToken) {
  const role = usuario?.perfil ?? decodedToken?.perfil ?? decodedToken?.role
  if (!role) {
    throw new Error('Não foi possível resolver role do principal canônico')
  }
  return role
}

function resolveTenantScopeMode(role) {
  return role === 'admin' ? 'global' : 'scoped_events'
}

function resolveTokenId({ decodedToken, rawToken, subjectId, authChannel }) {
  if (decodedToken?.jti) return String(decodedToken.jti)
  if (decodedToken?.tokenId) return String(decodedToken.tokenId)
  if (rawToken) return `jwt:${subjectId}`
  return `${authChannel}:${subjectId}`
}

function createCanonicalPrincipal({
  subjectId,
  role,
  authChannel,
  tenantScopeMode,
  sessionId = null,
  tokenId = null,
}) {
  if (!authChannel) {
    throw new Error('authChannel é obrigatório no principal canônico')
  }
  if (!sessionId && !tokenId) {
    throw new Error(
      'sessionId ou tokenId é obrigatório no principal canônico',
    )
  }

  return {
    subjectId,
    role,
    authChannel,
    sessionId,
    tokenId,
    tenantScopeMode,
  }
}

function fromApi({ usuario, decodedToken, rawToken }) {
  const subjectId = resolveSubjectId(usuario, decodedToken)
  const role = resolveRole(usuario, decodedToken)
  const authChannel = 'api_bearer'

  return createCanonicalPrincipal({
    subjectId,
    role,
    authChannel,
    tokenId: resolveTokenId({ decodedToken, rawToken, subjectId, authChannel }),
    tenantScopeMode: resolveTenantScopeMode(role),
  })
}

function fromSSR({
  usuario,
  decodedToken,
  rawToken,
  sessionId = null,
  authChannel = 'ssr_cookie',
}) {
  const subjectId = resolveSubjectId(usuario, decodedToken)
  const role = resolveRole(usuario, decodedToken)

  return createCanonicalPrincipal({
    subjectId,
    role,
    authChannel,
    sessionId,
    tokenId: resolveTokenId({ decodedToken, rawToken, subjectId, authChannel }),
    tenantScopeMode: resolveTenantScopeMode(role),
  })
}

module.exports = {
  createCanonicalPrincipal,
  fromApi,
  fromSSR,
}
