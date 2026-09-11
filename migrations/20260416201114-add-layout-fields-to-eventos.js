'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('eventos')

    if (!tableDesc.texto_x) {
      await queryInterface.addColumn('eventos', 'texto_x', {
        type: Sequelize.INTEGER,
        allowNull: true,
      })
    }
    if (!tableDesc.texto_y) {
      await queryInterface.addColumn('eventos', 'texto_y', {
        type: Sequelize.INTEGER,
        allowNull: true,
      })
    }
    if (!tableDesc.validacao_x) {
      await queryInterface.addColumn('eventos', 'validacao_x', {
        type: Sequelize.INTEGER,
        allowNull: true,
      })
    }
    if (!tableDesc.validacao_y) {
      await queryInterface.addColumn('eventos', 'validacao_y', {
        type: Sequelize.INTEGER,
        allowNull: true,
      })
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('eventos')

    if (tableDesc.texto_x) await queryInterface.removeColumn('eventos', 'texto_x')
    if (tableDesc.texto_y) await queryInterface.removeColumn('eventos', 'texto_y')
    if (tableDesc.validacao_x) await queryInterface.removeColumn('eventos', 'validacao_x')
    if (tableDesc.validacao_y) await queryInterface.removeColumn('eventos', 'validacao_y')
  },
}

