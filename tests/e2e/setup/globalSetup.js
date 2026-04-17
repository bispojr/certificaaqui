const { execSync } = require('child_process')

async function globalSetup() {
  execSync('NODE_ENV=e2e npx sequelize-cli db:migrate', {
    stdio: 'inherit',
    cwd: process.cwd(),
  })

  // Garante banco limpo no início de cada sessão de testes
  // (protege contra execuções anteriores interrompidas sem afterAll)
  const { cleanE2E } = require('./seed')
  await cleanE2E()
}

module.exports = globalSetup
