'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('certificados', 'codigo', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('certificados', 'codigo')
  },
}
