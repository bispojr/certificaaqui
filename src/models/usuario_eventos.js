// Model de associação N:N entre Usuario e Evento
'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class UsuarioEvento extends Model {
    static associate() {
      // N:N handled in Usuario and Evento
    }
  }

  UsuarioEvento.init(
    {
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
      },
      evento_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'eventos', key: 'id' },
      },
    },
    {
      sequelize,
      modelName: 'UsuarioEvento',
      tableName: 'usuario_eventos',
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  )

  return UsuarioEvento
}
