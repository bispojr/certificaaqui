const http = require('http')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

/**
 * Faz POST na API REST autenticada e retorna o corpo JSON da resposta.
 * @param {string} endpoint - ex: '/api/participantes'
 * @param {object} payload
 * @param {string} token - JWT Bearer
 * @returns {Promise<object>}
 */
function createViaApi(endpoint, payload, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload)
    const url = new URL(endpoint, BASE_URL)
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        Authorization: `Bearer ${token}`,
      },
    }
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          resolve(data)
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

module.exports = { createViaApi }
