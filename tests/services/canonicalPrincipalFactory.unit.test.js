const {
  fromApi,
  fromSSR,
} = require('../../src/services/auth/canonicalPrincipalFactory')
const {
  toLegacyUsuario,
} = require('../../src/services/auth/legacyPrincipalAdapter')

describe('canonicalPrincipalFactory + legacyPrincipalAdapter', () => {
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

  it('adapta principal canônico para a visão legada com flags e getEventos', async () => {
    const principal = {
      subjectId: 7,
      role: 'monitor',
      authChannel: 'ssr_cookie',
      sessionId: 'sess-7',
      tokenId: 'jwt:7',
      tenantScopeMode: 'scoped_events',
    }

    const legado = toLegacyUsuario(principal, {
      nome: 'Monitor Exemplo',
      email: 'monitor@example.com',
      eventosIds: ['10', '20', 'abc'],
    })

    expect(legado).toEqual(
      expect.objectContaining({
        id: 7,
        nome: 'Monitor Exemplo',
        email: 'monitor@example.com',
        perfil: 'monitor',
        isAdmin: false,
        isGestor: false,
        isMonitor: true,
        subjectId: 7,
        role: 'monitor',
        authChannel: 'ssr_cookie',
        sessionId: 'sess-7',
        tokenId: 'jwt:7',
        tenantScopeMode: 'scoped_events',
      }),
    )

    await expect(legado.getEventos()).resolves.toEqual([{ id: 10 }, { id: 20 }])
  })
})
