'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('eventos')
    if (!tableDesc.url_template_base) {
      await queryInterface.addColumn('eventos', 'url_template_base', {
        type: Sequelize.STRING,
        allowNull: true,
      })
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('eventos')
    if (tableDesc.url_template_base) {
      await queryInterface.removeColumn('eventos', 'url_template_base')
    }
  },
}

