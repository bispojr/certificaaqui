function createConcurrencyLimiter(maxConcurrent) {
  if (!Number.isInteger(maxConcurrent) || maxConcurrent <= 0) {
    throw new Error('maxConcurrent deve ser um inteiro positivo')
  }

  let active = 0

  function tryAcquire() {
    if (active >= maxConcurrent) {
      return null
    }

    active += 1
    let released = false

    return function release() {
      if (released) {
        return
      }
      released = true
      active -= 1
    }
  }

  function getState() {
    return {
      active,
      maxConcurrent,
    }
  }

  return {
    tryAcquire,
    getState,
  }
}

module.exports = {
  createConcurrencyLimiter,
}
