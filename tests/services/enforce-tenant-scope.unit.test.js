const {
  enforceTenantScope,
} = require('../../src/services/auth/enforceTenantScope')

describe('enforceTenantScope', () => {
  it('permite acesso global para admin', () => {
    expect(() =>
      enforceTenantScope({
        principal: { role: 'admin' },
        eventoIds: [1, 2, 3],
      }),
    ).not.toThrow()
  })

  it('permite acesso quando o evento solicitado está no escopo', () => {
    expect(() =>
      enforceTenantScope({
        principal: { role: 'monitor' },
        eventoIds: [10, 20],
        requestedEventId: 20,
      }),
    ).not.toThrow()
  })

  it('nega acesso quando o evento solicitado está fora do escopo', () => {
    expect(() =>
      enforceTenantScope({
        principal: { role: 'gestor' },
        eventoIds: [10, 20],
        requestedEventId: 99,
      }),
    ).toThrow('fora do escopo autorizado')
  })

  it('nega acesso quando perfil restrito não possui eventos atribuídos', () => {
    expect(() =>
      enforceTenantScope({
        principal: { role: 'monitor' },
        eventoIds: [],
      }),
    ).toThrow('escopo de eventos não resolvido')
  })
})
