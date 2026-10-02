'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('eventos')

    if (!tableDesc.validacao_rotacao) {
      await queryInterface.addColumn('eventos', 'validacao_rotacao', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      })
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('eventos')

    if (tableDesc.validacao_rotacao) {
      await queryInterface.removeColumn('eventos', 'validacao_rotacao')
    }
  },
}
