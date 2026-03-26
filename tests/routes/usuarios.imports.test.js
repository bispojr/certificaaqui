// Teste sentinela para garantir que os imports de auth e validate estão corretos após a migração

describe('Import de middlewares em usuarios.js', () => {
  it('importa auth corretamente', () => {
    const usuarios = require('../../src/routes/usuarios')
    const auth = require('../../src/middlewares/auth')
    expect(typeof auth).toBe('function')
    // O router deve usar o middleware auth em pelo menos uma rota
    const stack = usuarios.stack || usuarios.router?.stack
    const hasAuth =
      stack &&
      stack.some(
        (layer) =>
          (layer.handle && layer.handle.name === 'auth') ||
          (layer.route &&
            layer.route.stack.some(
              (mw) => mw.handle && mw.handle.name === 'auth',
            )),
      )
    expect(hasAuth).toBe(true)
  })
  it('importa validate corretamente', () => {
    const validate = require('../../src/middlewares/validate')
    expect(typeof validate).toBe('function')
  })
})
