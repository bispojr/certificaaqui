'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TiposCertificados extends Model {
    static associate(models) {
      TiposCertificados.hasMany(models.Certificado, { foreignKey: 'tipo_certificado_id', as: 'certificados' });
    }
  }

  TiposCertificados.init({
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
      allowNull: false,
      validate: {
        campoValido(value) {
          // 'nome' é sempre válido
          if (value === 'nome') return;
          // Precisa acessar dados_dinamicos do this
          const dados = this.dados_dinamicos || {};
          if (!Object.keys(dados).includes(value)) {
            throw new Error('campo_destaque deve ser "nome" ou uma chave de dados_dinamicos');
          }
        }
      }
    },
    texto_base: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'O campo texto_base é obrigatório.'
        }
      }
    },
    dados_dinamicos: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'TiposCertificados',
    tableName: 'tipos_certificados',
    paranoid: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  });

  return TiposCertificados;
};
