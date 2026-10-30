const logger = require('../utils/logger')

function bytesToNumber(contentLength) {
  if (!contentLength) {
    return null
  }

  const parsed = Number(contentLength)
  return Number.isFinite(parsed) ? parsed : null
}

function httpLogger(req, res, next) {
  const startedAt = process.hrtime.bigint()

  res.on('finish', () => {
    const elapsedNs = process.hrtime.bigint() - startedAt
    const durationMs = Number(elapsedNs) / 1e6

    logger.info('http.request.completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      contentLength: bytesToNumber(res.getHeader('content-length')),
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    })
  })

  next()
}

module.exports = httpLogger
