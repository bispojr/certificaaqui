'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class ParticipanteEvento extends Model {
    static associate() {
      // N:N handled in Participante and Evento
    }
  }

  ParticipanteEvento.init(
    {
      participante_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'participantes', key: 'id' },
      },
      evento_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'eventos', key: 'id' },
      },
    },
    {
      sequelize,
      modelName: 'ParticipanteEvento',
      tableName: 'participante_eventos',
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  )

  return ParticipanteEvento
}
