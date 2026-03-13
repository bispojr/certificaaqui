const eventoSchema = require('../../src/validators/evento')

describe('Validação Zod - Evento', () => {
  it('valida um evento válido', () => {
    const data = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'CN2026'
    }
    expect(() => eventoSchema.parse(data)).not.toThrow()
  })

  it('rejeita evento com ano inválido', () => {
    const data = {
      nome: 'Congresso Nacional',
      ano: 1999,
      codigo_base: 'CN2026'
    }
    expect(() => eventoSchema.parse(data)).toThrow()
  })

  it('rejeita evento com nome curto', () => {
    const data = {
      nome: 'AB',
      ano: 2026,
      codigo_base: 'CN2026'
    }
    expect(() => eventoSchema.parse(data)).toThrow()
  })
})
