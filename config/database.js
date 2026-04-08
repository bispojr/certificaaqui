require('dotenv').config()

function requiredEnv(varName, opts = {}) {
  const value = process.env[varName]
  if (!value) {
    // Permite ignorar variáveis só usadas em ambiente específico
    if (opts.optionalInProd && process.env.NODE_ENV === 'production') {
      return undefined
    }
    throw new Error(`Variável de ambiente obrigatória não definida: ${varName}`)
  }
  return value
}

function requiredEnvTest(varName) {
  return requiredEnv(varName, { optionalInProd: true })
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
    database: requiredEnvTest('DB_NAME_TEST'),
    host: requiredEnv('DB_HOST'),
    port: parseInt(requiredEnvTest('DB_PORT_TEST')), // agora opcional em prod
    dialect: 'postgres',
    logging: false,
  },
  e2e: {
    username: requiredEnv('DB_USER'),
    password: requiredEnv('DB_PASSWORD'),
    database: requiredEnvTest('DB_NAME_E2E'),
    host: requiredEnv('DB_HOST'),
    port: parseInt(requiredEnvTest('DB_PORT_E2E')),
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
}
