const request = require('supertest')
const path = require('path')

describe('Configuração de sessão - SESSION_SECRET', () => {
  let originalSessionSecret
  let app

  beforeAll(() => {
    originalSessionSecret = process.env.SESSION_SECRET
  })

  afterEach(() => {
    jest.resetModules()
    process.env.SESSION_SECRET = originalSessionSecret
  })

  it('deve lançar erro se SESSION_SECRET não estiver definida', () => {
    process.env.SESSION_SECRET = ''
    // Limpa o cache do app.js para forçar recarregamento
    const appPath = path.resolve(__dirname, '../../app.js')
    expect(() => {
      jest.resetModules()
      require(appPath)
    }).toThrow(/SESSION_SECRET não definido/)
  })

  it('não deve lançar erro se SESSION_SECRET estiver definida', () => {
    process.env.SESSION_SECRET = 'segredo-teste'
    const appPath = path.resolve(__dirname, '../../app.js')
    expect(() => {
      jest.resetModules()
      require(appPath)
    }).not.toThrow()
  })
})
