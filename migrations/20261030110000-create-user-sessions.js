'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_sessions', {
      sid: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      sess: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      expire: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    })

    await queryInterface.addIndex('user_sessions', ['expire'], {
      name: 'idx_user_sessions_expire',
    })
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('user_sessions', 'idx_user_sessions_expire')
    await queryInterface.dropTable('user_sessions')
  },
}
