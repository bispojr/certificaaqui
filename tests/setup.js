// Garante que JWT_SECRET está definido para todos os testes
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'jwt_secret_teste'
}
const { sequelize } = require('../src/models')
const { execSync } = require('child_process')

// Configuração global para testes
beforeAll(async () => {
  // Executa todas as migrations antes dos testes
  execSync('npx sequelize-cli db:migrate --env test', { stdio: 'inherit' })
})

afterAll(async () => {
  // Fecha conexão após todos os testes
  await sequelize.close()
})

// Limpa dados entre testes se necessário
beforeEach(async () => {
  // Cada teste começa com banco limpo
  // Adicionar limpeza específica se necessário
})
