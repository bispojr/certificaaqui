const request = require('supertest')
const app = require('../../app')

describe('GET /certificados redirect', () => {
  it('deve redirecionar para /opcoes', async () => {
    const res = await request(app).get('/certificados')
    expect(res.status).toBe(302)
    expect(res.headers.location).toBe('/opcoes')
  })

  it('não afeta rotas REST /certificados/:id', async () => {
    // Não deve redirecionar, apenas retornar 404 (mock, pois não há setup de banco aqui)
    const res = await request(app).get('/certificados/999999')
    expect(res.status).not.toBe(302)
  })
})
