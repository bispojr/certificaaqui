// Teste sentinela para garantir que o import de auth está correto após a migração

describe('Import de middleware auth em auth.test.js', () => {
  it('importa auth corretamente', () => {
    const auth = require('../../src/middlewares/auth')
    expect(typeof auth).toBe('function')
  })
})
