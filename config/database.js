require('dotenv').config();

function requiredEnv(varName) {
  if (!process.env[varName]) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${varName}`);
  }
  return process.env[varName];
}

module.exports = {
  development: {
    username: requiredEnv('DB_USER'),
    password: requiredEnv('DB_PASSWORD'),
    database: requiredEnv('DB_NAME'),
    host: requiredEnv('DB_HOST'),
    port: parseInt(requiredEnv('DB_PORT'), 10),
    dialect: 'postgres',
    logging: console.log,
  },
  test: {
    username: requiredEnv('DB_USER'),
    password: requiredEnv('DB_PASSWORD'),
    database: requiredEnv('DB_NAME_TEST'),
    host: requiredEnv('DB_HOST'),
    port: parseInt(requiredEnv('DB_PORT_TEST'), 10),
    dialect: 'postgres',
    logging: false,
  },
  production: {
    username: requiredEnv('DB_USER'),
    password: requiredEnv('DB_PASSWORD'),
    database: requiredEnv('DB_NAME'),
    host: requiredEnv('DB_HOST'),
    port: parseInt(requiredEnv('DB_PORT'), 10),
    dialect: 'postgres',
    logging: false,
    ssl: true,
  },
};