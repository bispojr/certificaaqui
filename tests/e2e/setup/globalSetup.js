const { execSync } = require('child_process')

async function globalSetup() {
  execSync('NODE_ENV=e2e npx sequelize-cli db:migrate', {
    stdio: 'inherit',
    cwd: process.cwd(),
  })
}

module.exports = globalSetup
