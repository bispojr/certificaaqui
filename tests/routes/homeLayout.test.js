const request = require('supertest')
const app = require('../../app')

describe('GET / (home) layout público', () => {
  it('deve renderizar layout com Bootstrap 5 e navbar', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    // Confirma Bootstrap 5
    expect(res.text).toMatch(
      /https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap@5\.3\.3\/dist\/css\/bootstrap\.min\.css/,
    )
    // Confirma navbar
    expect(res.text).toMatch(/<nav[^>]*navbar[^>]*>/)
    expect(res.text).toMatch(/Certifique-me/)
    expect(res.text).toMatch(/Meus Certificados/)
    expect(res.text).toMatch(/Validar/)
    expect(res.text).toMatch(/Entrar/)
    // Confirma slot body
    expect(res.text).toMatch(/Welcome to/)
  })
})
