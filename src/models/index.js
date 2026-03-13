'use strict';

const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '..', '..', 'config', 'database.js'))[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}


const certificado = require('./certificado')(sequelize, Sequelize.DataTypes);
const evento = require('./evento')(sequelize, Sequelize.DataTypes);
const participante = require('./participante')(sequelize, Sequelize.DataTypes);
const tipos_certificados = require('./tipos_certificados')(sequelize, Sequelize.DataTypes);
const usuario = require('./usuario')(sequelize, Sequelize.DataTypes);

db.Certificado = certificado;
db.Evento = evento;
db.Participante = participante;
db.TiposCertificados = tipos_certificados;
db.Usuario = usuario;

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;