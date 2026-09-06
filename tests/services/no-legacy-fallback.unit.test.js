const fs = require('fs')
const path = require('path')

const { fromSSR } = require('../../src/services/auth/canonicalPrincipalFactory')

describe('no-legacy-fallback', () => {
  it('remove o adaptador legado do contrato de autenticação', () => {
    const legacyAdapterPath = path.resolve(
      __dirname,
      '../../src/services/auth/legacyPrincipalAdapter.js',
    )

    expect(fs.existsSync(legacyAdapterPath)).toBe(false)
  })

  it('preserva apenas o contrato canônico do principal sem campos legados', () => {
    const principal = fromSSR({
      usuario: { id: 11, perfil: 'gestor' },
      decodedToken: { id: 11, perfil: 'gestor' },
      rawToken: 'token-legacy-safety',
      sessionId: 'session-legacy-safety',
    })

    expect(principal).toMatchObject({
      subjectId: 11,
      role: 'gestor',
      authChannel: 'ssr_cookie',
      sessionId: 'session-legacy-safety',
      tenantScopeMode: 'scoped_events',
    })
    expect(principal).not.toHaveProperty('isAdmin')
    expect(principal).not.toHaveProperty('eventosIds')
    expect(principal).not.toHaveProperty('getEventos')
  })
})
