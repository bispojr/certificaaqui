'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('tipos_certificados')

    // 1. Adicionar coluna evento_id apenas se ainda não existir
    if (!tableDesc.evento_id) {
      await queryInterface.addColumn('tipos_certificados', 'evento_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'eventos', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      })
    }

    // 2. Remover unique constraint global em codigo, se existir
    const [constraints] = await queryInterface.sequelize.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'tipos_certificados'
        AND constraint_name = 'tipos_certificados_codigo_key'
        AND constraint_type = 'UNIQUE'
    `)
    if (constraints.length > 0) {
      await queryInterface.removeConstraint(
        'tipos_certificados',
        'tipos_certificados_codigo_key',
      )
    }

    // 3. Adicionar unique composto (codigo, evento_id), se ainda não existir
    const [compositeConstraints] = await queryInterface.sequelize.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'tipos_certificados'
        AND indexname = 'tipos_certificados_codigo_evento_id_key'
    `)
    if (compositeConstraints.length === 0) {
      await queryInterface.addConstraint('tipos_certificados', {
        fields: ['codigo', 'evento_id'],
        type: 'unique',
        name: 'tipos_certificados_codigo_evento_id_key',
      })
    }
  },

  async down(queryInterface, Sequelize) {
    // Reverter na ordem inversa
    const [composite] = await queryInterface.sequelize.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'tipos_certificados'
        AND constraint_name = 'tipos_certificados_codigo_evento_id_key'
        AND constraint_type = 'UNIQUE'
    `)
    if (composite.length > 0) {
      await queryInterface.removeConstraint(
        'tipos_certificados',
        'tipos_certificados_codigo_evento_id_key',
      )
    }

    const [simple] = await queryInterface.sequelize.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'tipos_certificados'
        AND constraint_name = 'tipos_certificados_codigo_key'
        AND constraint_type = 'UNIQUE'
    `)
    if (simple.length === 0) {
      await queryInterface.addConstraint('tipos_certificados', {
        fields: ['codigo'],
        type: 'unique',
        name: 'tipos_certificados_codigo_key',
      })
    }

    const tableDesc = await queryInterface.describeTable('tipos_certificados')
    if (tableDesc.evento_id) {
      await queryInterface.removeColumn('tipos_certificados', 'evento_id')
    }
  },
}
