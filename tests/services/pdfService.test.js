const PDFDocument = require('pdfkit')
const pdfService = require('../../src/services/pdfService')
const templateService = require('../../src/services/templateService')

jest.mock('../../src/services/r2Service', () => ({
  getFile: jest.fn().mockResolvedValue(null),
}))

const r2Service = require('../../src/services/r2Service')

describe('pdfService.generateCertificadoPdf', () => {
  it('deve usar continued:true no texto de validação para manter link junto', async () => {
    const textSpy = jest.spyOn(PDFDocument.prototype, 'text')
    jest
      .spyOn(templateService, 'interpolate')
      .mockReturnValue('Certificamos que João participou do evento.')

    const certificado = {
      codigo: 'VAL123',
      dataValues: { codigo: 'VAL123' },
      Evento: { nome: 'Evento Teste' },
      Participante: { nomeCompleto: 'João' },
      TiposCertificados: {
        texto_base: 'Certificamos que {{nome}} participou do evento.',
      },
    }

    await pdfService.generateCertificadoPdf(certificado)

    const endereco_validacao =
      process.env.ENDERECO_VALIDACAO || 'https://certificaaqui.com/validar'

    const callsWithContinued = textSpy.mock.calls.filter(
      ([text, , , opts]) =>
        typeof text === 'string' &&
        text.includes('para validar o certificado em:') &&
        opts?.continued === true,
    )
    expect(callsWithContinued).toHaveLength(1)

    const callsWithLink = textSpy.mock.calls.filter(
      ([text, opts]) =>
        typeof text === 'string' &&
        text.includes(endereco_validacao) &&
        opts?.link === endereco_validacao,
    )
    expect(callsWithLink).toHaveLength(1)

    templateService.interpolate.mockRestore()
    textSpy.mockRestore()
  }, 15000)
  it('deve gerar um Buffer PDF válido começando com %PDF', async () => {
    // Mock de dados mínimos
    const certificado = {
      codigo: 'ABC123',
      dataValues: { codigo: 'ABC123' },
      Evento: { nome: 'Evento Teste', dataValues: { nome: 'Evento Teste' } },
      Participante: { nome: 'João', dataValues: { nome: 'João' } },
      TiposCertificados: {
        texto_base: 'Certificamos que {{nome}} participou do evento.',
        dataValues: {
          texto_base: 'Certificamos que {{nome}} participou do evento.',
        },
      },
    }

    jest
      .spyOn(templateService, 'interpolate')
      .mockImplementation((tpl, vars) => {
        return `Certificamos que ${vars.nome} participou do evento.`
      })

    const buffer = await pdfService.generateCertificadoPdf(certificado)
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.slice(0, 4).toString()).toBe('%PDF')

    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve rejeitar se não houver código de validação', async () => {
    const certificado = {
      dataValues: {},
      Evento: { nome: 'Evento Teste', dataValues: { nome: 'Evento Teste' } },
      Participante: { nome: 'Maria', dataValues: { nome: 'Maria' } },
      TiposCertificados: {
        texto_base: 'Certificamos que {{nome}} participou.',
        dataValues: { texto_base: 'Certificamos que {{nome}} participou.' },
      },
    }
    jest
      .spyOn(templateService, 'interpolate')
      .mockReturnValue('Certificamos que Maria participou.')
    await expect(
      pdfService.generateCertificadoPdf(certificado),
    ).rejects.toThrow('Código de validação obrigatório')
    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve rejeitar se campos nulos ou undefined não incluírem código de validação', async () => {
    const certificado = {
      codigo: undefined,
      dataValues: {},
      Evento: null,
      Participante: undefined,
      TiposCertificados: {
        texto_base: 'Texto base',
        dataValues: { texto_base: 'Texto base' },
      },
    }
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto base')
    await expect(
      pdfService.generateCertificadoPdf(certificado),
    ).rejects.toThrow('Código de validação obrigatório')
    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve rejeitar a Promise se a interpolação lançar erro', async () => {
    const certificado = {
      codigo: 'ERR',
      dataValues: { codigo: 'ERR' },
      Evento: { nome: 'Evento', dataValues: { nome: 'Evento' } },
      Participante: { nome: 'Erro', dataValues: { nome: 'Erro' } },
      TiposCertificados: {
        texto_base: '...',
        dataValues: { texto_base: '...' },
      },
    }
    jest.spyOn(templateService, 'interpolate').mockImplementation(() => {
      throw new Error('Erro de interpolação')
    })
    await expect(
      pdfService.generateCertificadoPdf(certificado),
    ).rejects.toThrow('Erro de interpolação')
    templateService.interpolate.mockRestore()
  }, 15000)
})

describe('pdfService - seleção de template de fundo (R2)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    r2Service.getFile.mockResolvedValue(null)
  })

  const baseCertificado = (urlTemplateBase) => ({
    codigo: 'TST001',
    nome: 'João da Silva',
    valores_dinamicos: {},
    Evento: { nome: 'Evento Teste', url_template_base: urlTemplateBase },
    Participante: { nomeCompleto: 'João da Silva' },
    TiposCertificados: { texto_base: 'Certificamos que ${nome} participou.' },
  })

  it('deve usar url_template_base do evento quando definida', async () => {
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')
    await pdfService.generateCertificadoPdf(
      baseCertificado('https://cdn.example.com/templates/custom.jpg'),
    )
    expect(r2Service.getFile).toHaveBeenCalledWith(
      'https://cdn.example.com/templates/custom.jpg',
    )
    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve usar "template/padrao.jpg" quando url_template_base é nula', async () => {
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')
    await pdfService.generateCertificadoPdf(baseCertificado(null))
    expect(r2Service.getFile).toHaveBeenCalledWith('template/padrao.jpg')
    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve usar "template/padrao.jpg" quando url_template_base é undefined', async () => {
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')
    await pdfService.generateCertificadoPdf(baseCertificado(undefined))
    expect(r2Service.getFile).toHaveBeenCalledWith('template/padrao.jpg')
    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve usar "template/padrao.jpg" quando Evento é nulo', async () => {
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')
    const cert = {
      ...baseCertificado(null),
      Evento: null,
    }
    await pdfService.generateCertificadoPdf(cert)
    expect(r2Service.getFile).toHaveBeenCalledWith('template/padrao.jpg')
    templateService.interpolate.mockRestore()
  }, 15000)
})

describe('pdfService - fonte Lato-Medium do R2', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    r2Service.getFile.mockResolvedValue(null)
  })

  const baseCert = () => ({
    codigo: 'FONT01',
    nome: 'Participante Teste',
    valores_dinamicos: {},
    Evento: { nome: 'Evento Fonte', url_template_base: null },
    Participante: { nomeCompleto: 'Participante Teste' },
    TiposCertificados: { texto_base: 'Certificamos que ${nome} participou.' },
  })

  it('deve tentar buscar a fonte Lato-Medium.ttf do R2', async () => {
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')
    await pdfService.generateCertificadoPdf(baseCert())
    expect(r2Service.getFile).toHaveBeenCalledWith('fontes/Lato-Medium.ttf')
    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve gerar PDF mesmo quando a fonte não está disponível no R2', async () => {
    r2Service.getFile.mockResolvedValue(null)
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')
    const buffer = await pdfService.generateCertificadoPdf(baseCert())
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.slice(0, 4).toString()).toBe('%PDF')
    templateService.interpolate.mockRestore()
  }, 15000)
})

describe('pdfService - coordenadas configuráveis por evento', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    r2Service.getFile.mockResolvedValue(null)
  })

  it('deve gerar PDF com coordenadas customizadas sem erro', async () => {
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')
    const cert = {
      codigo: 'COORD1',
      nome: 'Participante',
      valores_dinamicos: {},
      Evento: {
        nome: 'Evento Custom',
        url_template_base: null,
        texto_x: 300,
        texto_y: 250,
        validacao_x: 100,
        validacao_y: 500,
      },
      Participante: { nomeCompleto: 'Participante' },
      TiposCertificados: { texto_base: 'Certificamos que ${nome}.' },
    }
    const buffer = await pdfService.generateCertificadoPdf(cert)
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.slice(0, 4).toString()).toBe('%PDF')
    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve usar valores padrão quando coordenadas não estão definidas no evento', async () => {
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')
    const cert = {
      codigo: 'DEF01',
      nome: 'Participante',
      valores_dinamicos: {},
      Evento: { nome: 'Evento Padrão', url_template_base: null },
      Participante: { nomeCompleto: 'Participante' },
      TiposCertificados: { texto_base: 'Certificamos que ${nome}.' },
    }
    const buffer = await pdfService.generateCertificadoPdf(cert)
    expect(Buffer.isBuffer(buffer)).toBe(true)
    templateService.interpolate.mockRestore()
  }, 15000)
})

describe('pdfService - rotação da caixa de validação (validacao_rotacao)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    r2Service.getFile.mockResolvedValue(null)
  })

  it('deve chamar save(), rotate() e restore() com a rotação e origem configuradas', async () => {
    const saveSpy = jest.spyOn(PDFDocument.prototype, 'save')
    const rotateSpy = jest.spyOn(PDFDocument.prototype, 'rotate')
    const restoreSpy = jest.spyOn(PDFDocument.prototype, 'restore')
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')

    const cert = {
      codigo: 'ROT90',
      nome: 'Participante Rotação',
      valores_dinamicos: {},
      Evento: {
        nome: 'Evento 90 graus',
        validacao_x: 150,
        validacao_y: 550,
        validacao_rotacao: 90,
      },
      Participante: { nomeCompleto: 'Participante Rotação' },
      TiposCertificados: { texto_base: 'Certificamos que ${nome}.' },
    }

    const buffer = await pdfService.generateCertificadoPdf(cert)
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(saveSpy).toHaveBeenCalled()
    expect(rotateSpy).toHaveBeenCalledWith(90, { origin: [150, 550] })
    expect(restoreSpy).toHaveBeenCalled()

    templateService.interpolate.mockRestore()
    saveSpy.mockRestore()
    rotateSpy.mockRestore()
    restoreSpy.mockRestore()
  }, 15000)

  it.each([0, 90, 180, 270])(
    'deve gerar PDF válido para a rotação de %i graus',
    async (angulo) => {
      jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')
      const cert = {
        codigo: `ROT_${angulo}`,
        nome: 'Participante',
        valores_dinamicos: {},
        Evento: {
          nome: `Evento ${angulo} graus`,
          validacao_rotacao: angulo,
        },
        Participante: { nomeCompleto: 'Participante' },
        TiposCertificados: { texto_base: 'Certificamos que ${nome}.' },
      }
      const buffer = await pdfService.generateCertificadoPdf(cert)
      expect(Buffer.isBuffer(buffer)).toBe(true)
      expect(buffer.slice(0, 4).toString()).toBe('%PDF')
      templateService.interpolate.mockRestore()
    },
    15000,
  )

  it('deve usar rotação 0 como padrão quando validacao_rotacao for nula ou indefinda', async () => {
    const rotateSpy = jest.spyOn(PDFDocument.prototype, 'rotate')
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')

    const cert = {
      codigo: 'ROT_DEF',
      nome: 'Participante',
      valores_dinamicos: {},
      Evento: {
        nome: 'Evento Sem Rotação',
        validacao_rotacao: null,
      },
      Participante: { nomeCompleto: 'Participante' },
      TiposCertificados: { texto_base: 'Certificamos que ${nome}.' },
    }

    const buffer = await pdfService.generateCertificadoPdf(cert)
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(rotateSpy).toHaveBeenCalledWith(0, { origin: [145, 545] })

    templateService.interpolate.mockRestore()
    rotateSpy.mockRestore()
  }, 15000)
})

describe('pdfService - tamanho da fonte do texto-base (texto_tamanho_fonte)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    r2Service.getFile.mockResolvedValue(null)
  })

  it('deve aplicar o tamanho da fonte configurado em evento.texto_tamanho_fonte', async () => {
    const fontSizeSpy = jest.spyOn(PDFDocument.prototype, 'fontSize')
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')

    const cert = {
      codigo: 'FONT16',
      nome: 'Participante',
      valores_dinamicos: {},
      Evento: {
        nome: 'Evento Fonte 16',
        texto_tamanho_fonte: 16,
      },
      Participante: { nomeCompleto: 'Participante' },
      TiposCertificados: { texto_base: 'Certificamos que ${nome}.' },
    }

    const buffer = await pdfService.generateCertificadoPdf(cert)
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(fontSizeSpy).toHaveBeenCalledWith(16)

    templateService.interpolate.mockRestore()
    fontSizeSpy.mockRestore()
  }, 15000)

  it('deve aplicar o fallback dinâmico (14pt para texto curto <= 400) quando texto_tamanho_fonte for nulo ou indefinido', async () => {
    const fontSizeSpy = jest.spyOn(PDFDocument.prototype, 'fontSize')
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto curto')

    const cert = {
      codigo: 'FONT_DEF_SHORT',
      nome: 'Participante',
      valores_dinamicos: {},
      Evento: {
        nome: 'Evento Fonte Nula',
        texto_tamanho_fonte: null,
      },
      Participante: { nomeCompleto: 'Participante' },
      TiposCertificados: { texto_base: 'Certificamos que ${nome}.' },
    }

    const buffer = await pdfService.generateCertificadoPdf(cert)
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(fontSizeSpy).toHaveBeenCalledWith(14)

    templateService.interpolate.mockRestore()
    fontSizeSpy.mockRestore()
  }, 15000)

  it('deve aplicar o fallback dinâmico (10pt para texto longo > 400) quando texto_tamanho_fonte for nulo ou indefinido', async () => {
    const fontSizeSpy = jest.spyOn(PDFDocument.prototype, 'fontSize')
    const textoLongo = 'A'.repeat(401)
    jest.spyOn(templateService, 'interpolate').mockReturnValue(textoLongo)

    const cert = {
      codigo: 'FONT_DEF_LONG',
      nome: 'Participante',
      valores_dinamicos: {},
      Evento: {
        nome: 'Evento Fonte Nula',
        texto_tamanho_fonte: null,
      },
      Participante: { nomeCompleto: 'Participante' },
      TiposCertificados: { texto_base: 'Certificamos que ${nome}.' },
    }

    const buffer = await pdfService.generateCertificadoPdf(cert)
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(fontSizeSpy).toHaveBeenCalledWith(10)

    templateService.interpolate.mockRestore()
    fontSizeSpy.mockRestore()
  }, 15000)
})
