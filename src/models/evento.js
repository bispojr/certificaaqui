'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Evento extends Model {
    static associate(models) {
      Evento.hasMany(models.Certificado, {
        foreignKey: 'evento_id',
        as: 'certificados',
      })
    }
  }

  Evento.init(
    {
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      codigo_base: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          is: {
            args: /^[A-Za-z]{3}$/,
            msg: 'O campo codigo_base deve conter exatamente três letras (apenas caracteres alfabéticos).',
          },
        },
      },
      ano: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Evento',
      tableName: 'eventos',
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  )

  return Evento
}
