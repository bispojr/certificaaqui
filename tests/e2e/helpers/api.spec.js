const { test, expect } = require('@playwright/test')
const { createViaApi } = require('./api')
const { seedE2E, cleanE2E } = require('../setup/seed')

test.describe('api helpers', () => {
  let adminToken

  test.beforeAll(async () => {
    await cleanE2E()
    const seed = await seedE2E()
    adminToken = seed.adminToken
  })

  test('createViaApi cria participante via API REST', async () => {
    const payload = {
      nomeCompleto: 'Participante API Teste',
      email: 'api.participante@test.com',
    }
    const result = await createViaApi('/participantes', payload, adminToken)
    expect(result).toHaveProperty('id')
    expect(result.nomeCompleto).toBe(payload.nomeCompleto)
    expect(result.email).toBe(payload.email)
  })
})
