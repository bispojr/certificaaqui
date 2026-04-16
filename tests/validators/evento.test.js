const eventoSchema = require('../../src/validators/evento')

describe('Validação Zod - Evento', () => {
  it('valida um evento válido', () => {
    const data = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'ABC',
    }
    expect(() => eventoSchema.parse(data)).not.toThrow()
  })

  it('rejeita evento com ano inválido', () => {
    const data = {
      nome: 'Congresso Nacional',
      ano: 1999,
      codigo_base: 'ABC',
    }
    expect(() => eventoSchema.parse(data)).toThrow()
  })

  it('rejeita evento com nome curto', () => {
    const data = {
      nome: 'AB',
      ano: 2026,
      codigo_base: 'ABC',
    }
    expect(() => eventoSchema.parse(data)).toThrow()
  })

  it('valida evento com url_template_base válida', () => {
    const data = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'ABC',
      url_template_base: 'https://storage.example.com/templates/cert.pdf',
    }
    expect(() => eventoSchema.parse(data)).not.toThrow()
  })

  it('valida evento sem url_template_base (campo opcional)', () => {
    const data = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'ABC',
    }
    expect(() => eventoSchema.parse(data)).not.toThrow()
  })

  it('rejeita url_template_base com valor que não é URL', () => {
    const data = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'ABC',
      url_template_base: 'nao-e-uma-url',
    }
    expect(() => eventoSchema.parse(data)).toThrow()
  })
})
