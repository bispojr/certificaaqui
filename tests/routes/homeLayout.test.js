const request = require('supertest')
const app = require('../../app')

describe('GET / (home) layout público', () => {
  it('deve renderizar layout Google-like minimalista', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    // Confirma Bootstrap 5
    expect(res.text).toMatch(/https:\/\/cdn\.jsdelivr\.net\/npm\/bootswatch@5\.3\.8\/dist\/brite\/bootstrap\.min\.css/)
    // Confirma nome e logo
    expect(res.text).toMatch(/CertificaAqui/)
    expect(res.text).toMatch(/logo\.svg/)
    // Confirma links do topo
    expect(res.text).toMatch(/Validar/)
    expect(res.text).toMatch(/Entrar/)
    // Confirma campo de busca
    expect(res.text).toMatch(/placeholder='Digite seu e-mail para buscar seus certificados'/)
    // Confirma botão
    expect(res.text).toMatch(/Buscar certificados/)
  })
})
