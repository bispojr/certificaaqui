const certificadoSchema = require('../../src/validators/certificado')

describe('Validação Zod - Certificado', () => {
  it('valida um certificado válido', () => {
    const data = {
      nome: 'Certificado de Participação',
      status: 'emitido',
      participante_id: 1,
      evento_id: 2,
      tipo_certificado_id: 3
    }
    expect(() => certificadoSchema.parse(data)).not.toThrow()
  })

  it('valida um certificado com status pendente', () => {
    const data = {
      nome: 'Certificado de Participação',
      status: 'pendente',
      participante_id: 1,
      evento_id: 2,
      tipo_certificado_id: 3
    }
    expect(() => certificadoSchema.parse(data)).not.toThrow()
  })

  it('rejeita certificado com status inválido', () => {
    const data = {
      nome: 'Certificado de Participação',
      status: 'invalido',
      participante_id: 1,
      evento_id: 2,
      tipo_certificado_id: 3
    }
    expect(() => certificadoSchema.parse(data)).toThrow()
  })

  it('rejeita certificado com nome curto', () => {
    const data = {
      nome: 'Ce',
      status: 'emitido',
      participante_id: 1,
      evento_id: 2,
      tipo_certificado_id: 3
    }
    expect(() => certificadoSchema.parse(data)).toThrow()
  })
})
