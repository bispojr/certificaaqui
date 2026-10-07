'use strict'
const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class Evento extends Model {
    static associate(models) {
      Evento.hasMany(models.Certificado, {
        foreignKey: 'evento_id',
        as: 'certificados',
      })
      Evento.hasMany(models.TiposCertificados, {
        foreignKey: 'evento_id',
        as: 'tiposCertificados',
      })
      Evento.belongsToMany(models.Usuario, {
        through: models.UsuarioEvento,
        foreignKey: 'evento_id',
        otherKey: 'usuario_id',
        as: 'usuarios',
      })
      Evento.belongsToMany(models.Participante, {
        through: models.ParticipanteEvento,
        foreignKey: 'evento_id',
        otherKey: 'participante_id',
        as: 'participantes',
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
      url_template_base: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      texto_x: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      texto_y: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      validacao_x: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      validacao_y: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      validacao_rotacao: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      texto_tamanho_fonte: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      template_certificado: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'padrao',
        validate: {
          isIn: {
            args: [['padrao', 'nome-destaque']],
            msg: 'template_certificado deve ser "padrao" ou "nome-destaque".',
          },
        },
      },
      template_config: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
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
