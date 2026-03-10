'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Atividade extends Model {
    static associate(models) {
      // Relacionamentos: evento, tipo_atividade, participacoes
      // Atividade.belongsTo(models.Evento, { foreignKey: 'evento_id' });
      // Atividade.belongsTo(models.TipoAtividade, { foreignKey: 'tipo_atividade_id' });
      // Atividade.hasMany(models.Participacao, { foreignKey: 'atividade_id' });
    }
  }

  Atividade.init({
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('liberado', 'suspenso'),
      allowNull: false,
      defaultValue: 'liberado'
    },
    dados_dinamicos: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    evento_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tipo_atividade_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Atividade',
    tableName: 'atividades',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  });

  return Atividade;
};
