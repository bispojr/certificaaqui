'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class TiposCertificados extends Model {
    static associate(models) {
      TiposCertificados.hasMany(models.Certificado, {
        foreignKey: 'tipo_certificado_id',
        as: 'certificados',
      })
    }
  }

  TiposCertificados.init(
    {
      codigo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          is: /^[A-Za-z]{2}$/,
        },
      },
      descricao: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      campo_destaque: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      texto_base: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: 'O campo texto_base é obrigatório.',
          },
        },
      },
      dados_dinamicos: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'TiposCertificados',
      tableName: 'tipos_certificados',
      paranoid: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    },
  )

  // Validação cross-field: campo_destaque deve ser "nome" ou uma chave de dados_dinamicos.
  // Implementado como hook beforeValidate para garantir que todos os campos estejam disponíveis.
  TiposCertificados.addHook('beforeValidate', (instance) => {
    const value = instance.campo_destaque
    if (value === 'nome') return
    const dados = instance.dados_dinamicos || {}
    if (!Object.keys(dados).includes(value)) {
      throw new Error(
        'campo_destaque deve ser "nome" ou uma chave de dados_dinamicos',
      )
    }
  })

  return TiposCertificados
}
