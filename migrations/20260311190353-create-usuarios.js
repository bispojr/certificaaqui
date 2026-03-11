'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.createTable('usuarios', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        nome: {
          type: Sequelize.STRING,
          allowNull: false
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        senha: {
          type: Sequelize.STRING,
          allowNull: false
        },
        perfil: {
          type: Sequelize.ENUM('admin', 'gestor', 'monitor'),
          allowNull: false
        },
        evento_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'eventos',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      });
  },

  async down (queryInterface, Sequelize) {
      await queryInterface.dropTable('usuarios', {});
  }
};
