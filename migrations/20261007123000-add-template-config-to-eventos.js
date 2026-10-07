'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('eventos')

    if (!tableDesc.template_config) {
      await queryInterface.addColumn('eventos', 'template_config', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {},
      })
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('eventos')

    if (tableDesc.template_config) {
      await queryInterface.removeColumn('eventos', 'template_config')
    }
  },
}
