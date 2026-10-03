'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('eventos')

    if (!tableDesc.texto_tamanho_fonte) {
      await queryInterface.addColumn('eventos', 'texto_tamanho_fonte', {
        type: Sequelize.INTEGER,
        allowNull: true,
      })
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('eventos')

    if (tableDesc.texto_tamanho_fonte) {
      await queryInterface.removeColumn('eventos', 'texto_tamanho_fonte')
    }
  },
}
