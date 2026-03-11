'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TipoAtividade extends Model {
    static associate(models) {
      // TipoAtividade.hasMany(models.Atividade, { foreignKey: 'tipo_atividade_id' });
    }
  }

  TipoAtividade.init({
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[A-Za-z]{2}$/
      }
    },
    descricao: {
      type: DataTypes.STRING,
      allowNull: false
    },
    campo_destaque: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'TipoAtividade',
    tableName: 'tipos_atividade',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  });

  return TipoAtividade;
};
