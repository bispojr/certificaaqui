'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('eventos', 'texto_x', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
    await queryInterface.addColumn('eventos', 'texto_y', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
    await queryInterface.addColumn('eventos', 'validacao_x', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
    await queryInterface.addColumn('eventos', 'validacao_y', {
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('eventos', 'texto_x')
    await queryInterface.removeColumn('eventos', 'texto_y')
    await queryInterface.removeColumn('eventos', 'validacao_x')
    await queryInterface.removeColumn('eventos', 'validacao_y')
  },
}
