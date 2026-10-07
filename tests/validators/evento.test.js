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

  it('valida template_certificado com valores permitidos e default padrao', () => {
    const dataDefault = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'ABC',
    }
    expect(eventoSchema.parse(dataDefault).template_certificado).toBe('padrao')

    const dataPadrao = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'ABC',
      template_certificado: 'padrao',
    }
    expect(eventoSchema.parse(dataPadrao).template_certificado).toBe('padrao')

    const dataDestaque = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'ABC',
      template_certificado: 'nome-destaque',
    }
    expect(eventoSchema.parse(dataDestaque).template_certificado).toBe(
      'nome-destaque',
    )
  })

  it('rejeita template_certificado inválido', () => {
    const data = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'ABC',
      template_certificado: 'customizado',
    }
    expect(() => eventoSchema.parse(data)).toThrow()
  })

  it('valida validacao_rotacao com valor numérico e define default 0 quando omitido', () => {
    const data = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'ABC',
    }
    const parsed = eventoSchema.parse(data)
    expect(parsed.validacao_rotacao).toBe(0)

    const dataWithRotation = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'ABC',
      validacao_rotacao: 90,
    }
    const parsedRotation = eventoSchema.parse(dataWithRotation)
    expect(parsedRotation.validacao_rotacao).toBe(90)
  })

  it('rejeita validacao_rotacao que não é número inteiro', () => {
    const data = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'ABC',
      validacao_rotacao: 45.5,
    }
    expect(() => eventoSchema.parse(data)).toThrow()
  })

  it('valida texto_tamanho_fonte com inteiro, nulo ou omitido', () => {
    const dataWithFont = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'ABC',
      texto_tamanho_fonte: 16,
    }
    expect(eventoSchema.parse(dataWithFont).texto_tamanho_fonte).toBe(16)

    const dataWithNull = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'ABC',
      texto_tamanho_fonte: null,
    }
    expect(eventoSchema.parse(dataWithNull).texto_tamanho_fonte).toBeNull()

    const dataOmitted = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'ABC',
    }
    expect(eventoSchema.parse(dataOmitted).texto_tamanho_fonte).toBeUndefined()
  })

  it('rejeita texto_tamanho_fonte que não é número inteiro', () => {
    const data = {
      nome: 'Congresso Nacional',
      ano: 2026,
      codigo_base: 'ABC',
      texto_tamanho_fonte: 14.5,
    }
    expect(() => eventoSchema.parse(data)).toThrow()
  })
})
