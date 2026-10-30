const SERVICE_NAME = process.env.SERVICE_NAME || 'certifique-me'
const ENVIRONMENT = process.env.NODE_ENV || 'development'

const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

const REDACTED = '[REDACTED]'
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase()
const CURRENT_LEVEL = LEVELS[LOG_LEVEL] || LEVELS.info

const SENSITIVE_KEYS = [
  'password',
  'senha',
  'token',
  'authorization',
  'cookie',
  'email',
  'cpf',
  'cnpj',
  'secret',
  'jwt',
  'accesskey',
  'secretaccesskey',
]

function isSensitiveKey(key) {
  const normalized = String(key || '').toLowerCase()
  return SENSITIVE_KEYS.some((sensitiveKey) => normalized.includes(sensitiveKey))
}

function sanitizeError(err) {
  if (!(err instanceof Error)) {
    return err
  }

  return {
    name: err.name,
    message: err.message,
    stack: ENVIRONMENT === 'production' ? undefined : err.stack,
  }
}

function redact(value, depth = 0) {
  if (value === null || value === undefined) {
    return value
  }

  if (depth > 6) {
    return '[Truncated]'
  }

  if (value instanceof Error) {
    return sanitizeError(value)
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1))
  }

  if (typeof value === 'object') {
    const output = {}
    for (const [key, nestedValue] of Object.entries(value)) {
      if (isSensitiveKey(key)) {
        output[key] = REDACTED
      } else {
        output[key] = redact(nestedValue, depth + 1)
      }
    }
    return output
  }

  return value
}

function shouldLog(level) {
  return (LEVELS[level] || LEVELS.info) >= CURRENT_LEVEL
}

function emit(level, message, context = {}) {
  if (!shouldLog(level)) {
    return
  }

  const payload = {
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    env: ENVIRONMENT,
    level,
    message,
    ...redact(context),
  }

  const line = JSON.stringify(payload)

  if (level === 'error') {
    console.error(line)
    return
  }

  if (level === 'warn') {
    console.warn(line)
    return
  }

  console.log(line)
}

module.exports = {
  debug: (message, context) => emit('debug', message, context),
  info: (message, context) => emit('info', message, context),
  warn: (message, context) => emit('warn', message, context),
  error: (message, context) => emit('error', message, context),
}
