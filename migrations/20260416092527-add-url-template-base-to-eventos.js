'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('eventos', 'url_template_base', {
      type: Sequelize.STRING,
      allowNull: true,
    })
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('eventos', 'url_template_base')
  },
}
