const tiposCertificadosSchema = require('../../src/validators/tipos_certificados')

describe('Validação Zod - TiposCertificados', () => {
  it('valida um tipo de certificado válido', () => {
    const valido = {
      evento_id: 1,
      codigo: 'AB',
      descricao: 'Certificado de Participação',
      campo_destaque: 'nome',
      texto_base: 'Certificamos que...',
      dados_dinamicos: { cargaHoraria: 10 },
    }
    expect(() => tiposCertificadosSchema.parse(valido)).not.toThrow()
  })

  it('rejeita código inválido', () => {
    const invalido = {
      codigo: 'A1',
      descricao: 'Certificado',
      campo_destaque: 'nome',
      texto_base: 'Texto',
    }
    expect(() => tiposCertificadosSchema.parse(invalido)).toThrow()
  })

  it('rejeita ausência de campo obrigatório', () => {
    const invalido = {
      codigo: 'CD',
      descricao: '',
      campo_destaque: 'nome',
      texto_base: 'Texto',
    }
    expect(() => tiposCertificadosSchema.parse(invalido)).toThrow()
  })

  it('aceita dados_dinamicos ausente', () => {
    const valido = {
      evento_id: 2,
      codigo: 'EF',
      descricao: 'Outro',
      campo_destaque: 'nome',
      texto_base: 'Base',
    }
    expect(() => tiposCertificadosSchema.parse(valido)).not.toThrow()
  })
})
