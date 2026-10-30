const { createConcurrencyLimiter } = require('../../src/utils/concurrencyLimiter')

describe('concurrencyLimiter', () => {
  it('deve adquirir e liberar slots corretamente', () => {
    const limiter = createConcurrencyLimiter(2)

    const releaseA = limiter.tryAcquire()
    const releaseB = limiter.tryAcquire()
    const releaseC = limiter.tryAcquire()

    expect(typeof releaseA).toBe('function')
    expect(typeof releaseB).toBe('function')
    expect(releaseC).toBeNull()
    expect(limiter.getState()).toEqual({ active: 2, maxConcurrent: 2 })

    releaseA()
    expect(limiter.getState()).toEqual({ active: 1, maxConcurrent: 2 })

    const releaseD = limiter.tryAcquire()
    expect(typeof releaseD).toBe('function')
    expect(limiter.getState()).toEqual({ active: 2, maxConcurrent: 2 })

    releaseB()
    releaseD()
    expect(limiter.getState()).toEqual({ active: 0, maxConcurrent: 2 })
  })

  it('não deve decrementar duas vezes ao chamar release repetidamente', () => {
    const limiter = createConcurrencyLimiter(1)
    const release = limiter.tryAcquire()

    expect(limiter.getState().active).toBe(1)

    release()
    release()

    expect(limiter.getState().active).toBe(0)
  })

  it('deve lançar erro para limite inválido', () => {
    expect(() => createConcurrencyLimiter(0)).toThrow(
      'maxConcurrent deve ser um inteiro positivo',
    )
    expect(() => createConcurrencyLimiter(-1)).toThrow(
      'maxConcurrent deve ser um inteiro positivo',
    )
    expect(() => createConcurrencyLimiter(1.5)).toThrow(
      'maxConcurrent deve ser um inteiro positivo',
    )
  })
})
