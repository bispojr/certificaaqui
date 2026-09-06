const {
  fromApi,
  fromSSR,
} = require('../../src/services/auth/canonicalPrincipalFactory')

describe('canonicalPrincipalFactory', () => {
  it('materializa principal canônico para API e SSR com o mesmo contrato mínimo', () => {
    const usuario = {
      id: 42,
      nome: 'Maria',
      perfil: 'gestor',
      email: 'maria@example.com',
    }

    const apiPrincipal = fromApi({
      usuario,
      decodedToken: { id: usuario.id, perfil: usuario.perfil },
      rawToken: 'token-api',
    })

    const ssrPrincipal = fromSSR({
      usuario,
      decodedToken: { id: usuario.id, perfil: usuario.perfil },
      rawToken: 'token-ssr',
      sessionId: 'sess-1',
    })

    expect(apiPrincipal).toEqual({
      subjectId: 42,
      role: 'gestor',
      authChannel: 'api_bearer',
      sessionId: null,
      tokenId: 'jwt:42',
      tenantScopeMode: 'scoped_events',
    })

    expect(ssrPrincipal).toEqual({
      subjectId: 42,
      role: 'gestor',
      authChannel: 'ssr_cookie',
      sessionId: 'sess-1',
      tokenId: 'jwt:42',
      tenantScopeMode: 'scoped_events',
    })
  })

  it('não materializa campos legados nem fallback de eventos no principal canônico', () => {
    const principal = fromSSR({
      usuario: { id: 7, perfil: 'monitor' },
      decodedToken: { id: 7, perfil: 'monitor' },
      rawToken: 'token-ssr',
      sessionId: 'sess-7',
    })

    expect(principal).not.toHaveProperty('eventosIds')
    expect(principal).not.toHaveProperty('getEventos')
    expect(principal).not.toHaveProperty('isAdmin')
    expect(principal).not.toHaveProperty('isGestor')
    expect(principal).not.toHaveProperty('isMonitor')
  })
})
