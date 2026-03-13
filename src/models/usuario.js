'use strict'
const { Model } = require('sequelize')
const bcrypt = require('bcryptjs')

module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    static associate(models) {
      Usuario.belongsToMany(models.Evento, {
        through: models.UsuarioEvento,
        foreignKey: 'usuario_id',
        otherKey: 'evento_id',
        as: 'eventos',
      })
    }
  }

  Usuario.init(
    {
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      senha: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      perfil: {
        type: DataTypes.ENUM('admin', 'gestor', 'monitor'),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Usuario',
      tableName: 'usuarios',
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      hooks: {
        beforeCreate: async (usuario) => {
          if (usuario.senha) {
            usuario.senha = await bcrypt.hash(usuario.senha, 10)
          }
        },
        beforeUpdate: async (usuario) => {
          if (usuario.changed('senha')) {
            usuario.senha = await bcrypt.hash(usuario.senha, 10)
          }
        },
      },
    },
  )

  return Usuario
}
