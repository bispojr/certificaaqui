require('dotenv').config()
const fs = require('fs')
const path = require('path')
const r2Service = require('../../src/services/r2Service')

describe('R2 Service', () => {
  const filePath = path.join(__dirname, 'arquivo-teste.txt')
  const key = 'testes/arquivo-teste.txt'
  const fileContent = Buffer.from('Conteúdo de teste para upload no R2')

  beforeAll(() => {
    fs.writeFileSync(filePath, fileContent)
  })

  afterAll(() => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  })

  test('upload, download e remoção de arquivo no R2', async () => {
    // Upload
    await expect(
      r2Service.uploadFile(key, fileContent, 'text/plain'),
    ).resolves.toBeDefined()

    // Download
    const result = await r2Service.getFile(key)
    expect(result.Body.toString()).toBe(fileContent.toString())

    // Remover
    await expect(r2Service.deleteFile(key)).resolves.toBeDefined()
  }, 10000)
})
