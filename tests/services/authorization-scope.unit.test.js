const {
  resolveAuthorizationScope,
} = require('../../src/services/auth/resolveAuthorizationScope')
const { scopeGuard } = require('../../src/services/auth/scopeGuard')

describe('resolveAuthorizationScope', () => {
  it('retorna escopo global para admin', async () => {
    const scope = await resolveAuthorizationScope({
      usuario: { perfil: 'admin' },
      principal: { role: 'admin' },
    })

    expect(scope).toEqual({ eventoIds: null, scopeMode: 'global' })
  })

  it('resolve eventoIds para gestor usando getEventos', async () => {
    const usuario = {
      perfil: 'gestor',
      getEventos: async () => [{ id: '10' }, { id: 20 }, { id: 'abc' }],
    }

    const scope = await resolveAuthorizationScope({
      usuario,
      principal: { role: 'gestor' },
    })

    expect(scope).toEqual({ eventoIds: [10, 20], scopeMode: 'scoped_events' })
  })

  it('lança erro em falha determinística para perfis restritos', async () => {
    const usuario = {
      perfil: 'monitor',
      getEventos: async () => [],
    }

    await expect(
      resolveAuthorizationScope({
        usuario,
        principal: { role: 'monitor' },
      }),
    ).rejects.toThrow(/escopo.*não resolvido|nenhum evento/i)
  })
})

describe('scopeGuard', () => {
  it('permite acesso global de admin', () => {
    expect(scopeGuard({ principal: { role: 'admin' }, eventoIds: null })).toBe(
      true,
    )
  })

  it('nega acesso com escopo ausente para perfil restrito', () => {
    expect(() =>
      scopeGuard({ principal: { role: 'monitor' }, eventoIds: [] }),
    ).toThrow(/escopo.*não resolvido|negacao segura|restrito/i)
  })

  it('nega evento fora do escopo', () => {
    expect(() =>
      scopeGuard({
        principal: { role: 'gestor' },
        eventoIds: [10, 20],
        requestedEventId: 99,
      }),
    ).toThrow(/fora do escopo|negacao segura|restrito/i)
  })
})
