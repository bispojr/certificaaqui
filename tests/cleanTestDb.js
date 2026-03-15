const { sequelize } = require('../src/models')

async function cleanTestDb() {
  // Lista de tabelas principais do domínio
  const tables = [
    'certificados',
    'participantes',
    'eventos',
    'tipos_certificados',
    'usuarios',
    'usuario_eventos',
  ]
  const tableList = tables.map((t) => `\"${t}\"`).join(', ')
  // Trunca todas as tabelas e reinicia os IDs
  await sequelize.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`)
}

if (require.main === module) {
  cleanTestDb()
    .then(() => {
      console.log('Banco de testes limpo com sucesso.')
      process.exit(0)
    })
    .catch((err) => {
      console.error('Erro ao limpar banco de testes:', err)
      process.exit(1)
    })
}

module.exports = cleanTestDb
