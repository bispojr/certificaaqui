const {
  getMinimumRole,
  OPERATION_POLICY_CATALOG,
} = require('../../src/services/auth/operationPolicyCatalog')
const {
  evaluateOperationConformance,
  assertOperationConformance,
} = require('../../src/services/auth/operationConformanceService')

describe('operationPolicyCatalog', () => {
  it('contém perfil mínimo para operações críticas', () => {
    expect(getMinimumRole('certificado.read')).toBe('monitor')
    expect(getMinimumRole('certificado.write')).toBe('gestor')
    expect(getMinimumRole('evento.read')).toBe('monitor')
    expect(getMinimumRole('usuario.manage')).toBe('admin')
  })

  it('exporta catálogo completo de operações', () => {
    expect(OPERATION_POLICY_CATALOG.certificado.read).toBe('monitor')
    expect(OPERATION_POLICY_CATALOG.evento.write).toBe('gestor')
  })
})

describe('operationConformanceService', () => {
  it('identifica conformidade quando API e SSR exigem o mesmo perfil mínimo', () => {
    const result = evaluateOperationConformance({
      apiOperationKey: 'certificado.read',
      ssrOperationKey: 'certificado.read',
    })

    expect(result.isConformant).toBe(true)
    expect(result.minimumRoles.api).toBe('monitor')
    expect(result.minimumRoles.ssr).toBe('monitor')
  })

  it('detecta drift quando API e SSR têm perfis mínimos divergentes', () => {
    expect(() =>
      assertOperationConformance({
        apiOperationKey: 'certificado.write',
        ssrOperationKey: 'certificado.read',
      }),
    ).toThrow('drift de perfil mínimo')
  })
})
