const { request: playwrightRequest } = require('@playwright/test')

const BASE_URL =
  process.env.BASE_URL ||
  `http://localhost:${process.env.PORT_E2E || process.env.PORT || '3000'}`

/**
 * Faz POST na API REST autenticada e retorna o corpo JSON da resposta.
 * @param {string} endpoint - ex: '/api/participantes'
 * @param {object} payload
 * @param {string} token - JWT Bearer
 * @returns {Promise<object>}
 */
async function createViaApi(endpoint, payload, token) {
  const context = await playwrightRequest.newContext({ baseURL: BASE_URL })
  try {
    const response = await context.post(endpoint, {
      data: payload,
      headers: { Authorization: `Bearer ${token}` },
    })
    return response.json()
  } finally {
    await context.dispose()
  }
}

module.exports = { createViaApi }
