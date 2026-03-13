const { sequelize } = require('../../src/models')

// Teste de migration para usuario_eventos

describe('Migration: usuario_eventos', () => {
  it('tabela usuario_eventos deve existir', async () => {
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name = 'usuario_eventos' AND table_schema = 'public'"
    )
    expect(results.length).toBe(1)
  })

  it('deve ter colunas usuario_id e evento_id', async () => {
    const [results] = await sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'usuario_eventos' AND column_name IN ('usuario_id', 'evento_id')"
    )
    const colunas = results.map(r => r.column_name)
    expect(colunas).toEqual(expect.arrayContaining(['usuario_id', 'evento_id']))
  })
})
