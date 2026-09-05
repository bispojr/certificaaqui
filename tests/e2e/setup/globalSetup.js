const { execSync } = require('child_process')

function tryStartE2EDatabase() {
  // Best effort: facilita execução local pela aba Testing.
  // Em CI normalmente o banco já vem provisionado e CI=true evita compose local.
  if (process.env.CI === 'true') return

  const commands = [
    'docker compose -f docker-compose.test.yml up -d postgres_e2e',
    'docker-compose -f docker-compose.test.yml up -d postgres_e2e',
  ]

  for (const command of commands) {
    try {
      execSync(command, { stdio: 'pipe', cwd: process.cwd() })
      return
    } catch (_error) {
      // Tenta a próxima alternativa de compose.
    }
  }
}

async function globalSetup() {
  tryStartE2EDatabase()

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
