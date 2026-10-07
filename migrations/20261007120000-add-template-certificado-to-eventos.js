'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('eventos')

    if (!tableDesc.template_certificado) {
      await queryInterface.addColumn('eventos', 'template_certificado', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'padrao',
      })
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('eventos')

    if (tableDesc.template_certificado) {
      await queryInterface.removeColumn('eventos', 'template_certificado')
    }
  },
}
