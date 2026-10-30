const { monitorEventLoopDelay } = require('perf_hooks')
const logger = require('../utils/logger')

let started = false

function toMb(bytes) {
  return Number((bytes / 1024 / 1024).toFixed(2))
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

function resolveThresholds() {
  const memoryLimitMb = parsePositiveInt(process.env.MEMORY_LIMIT_MB, 0)

  const warnDefault = memoryLimitMb > 0 ? Math.floor(memoryLimitMb * 0.7) : 350
  const criticalDefault = memoryLimitMb > 0 ? Math.floor(memoryLimitMb * 0.85) : 450

  return {
    warnRssMb: parsePositiveInt(process.env.MEMORY_WARN_RSS_MB, warnDefault),
    criticalRssMb: parsePositiveInt(
      process.env.MEMORY_CRITICAL_RSS_MB,
      criticalDefault,
    ),
  }
}

function buildSnapshot(eventLoopDelay) {
  const memory = process.memoryUsage()

  return {
    pid: process.pid,
    uptimeSec: Math.floor(process.uptime()),
    rssMb: toMb(memory.rss),
    heapUsedMb: toMb(memory.heapUsed),
    heapTotalMb: toMb(memory.heapTotal),
    externalMb: toMb(memory.external),
    arrayBuffersMb: toMb(memory.arrayBuffers || 0),
    eventLoopLagMeanMs: Number((eventLoopDelay.mean / 1e6).toFixed(2)),
    eventLoopLagMaxMs: Number((eventLoopDelay.max / 1e6).toFixed(2)),
  }
}

function startRuntimeMonitor() {
  if (started) {
    return
  }

  if (process.env.NODE_ENV === 'test') {
    return
  }

  started = true

  const sampleIntervalMs = parsePositiveInt(
    process.env.MEMORY_MONITOR_INTERVAL_MS,
    60000,
  )

  const thresholds = resolveThresholds()
  const eventLoopDelay = monitorEventLoopDelay({ resolution: 20 })
  eventLoopDelay.enable()

  logger.info('runtime.monitor.started', {
    sampleIntervalMs,
    warnRssMb: thresholds.warnRssMb,
    criticalRssMb: thresholds.criticalRssMb,
  })

  const timer = setInterval(() => {
    const snapshot = buildSnapshot(eventLoopDelay)

    if (snapshot.rssMb >= thresholds.criticalRssMb) {
      logger.error('runtime.memory.critical', snapshot)
    } else if (snapshot.rssMb >= thresholds.warnRssMb) {
      logger.warn('runtime.memory.warn', snapshot)
    } else {
      logger.info('runtime.memory.sample', snapshot)
    }

    eventLoopDelay.reset()
  }, sampleIntervalMs)

  timer.unref()

  process.on('warning', (warning) => {
    logger.warn('runtime.process.warning', {
      warning: {
        name: warning.name,
        message: warning.message,
        stack:
          process.env.NODE_ENV === 'production' ? undefined : warning.stack,
      },
    })
  })

  process.on('unhandledRejection', (reason) => {
    logger.error('runtime.unhandled_rejection', {
      reason: reason instanceof Error ? reason : { message: String(reason) },
    })
  })
}

module.exports = {
  startRuntimeMonitor,
}
