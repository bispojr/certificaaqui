const { PassThrough } = require('stream')
const PDFDocument = require('pdfkit')
const pdfService = require('../../src/services/pdfService')
const templateService = require('../../src/services/templateService')

jest.mock('../../src/services/r2Service', () => ({
  getFile: jest.fn().mockResolvedValue(null),
}))

const r2Service = require('../../src/services/r2Service')

// Helper para converter stream em Buffer para asserções
async function streamToBuffer(certificado) {
  const stream = new PassThrough()
  const chunks = []
  stream.on('data', (chunk) => chunks.push(chunk))
  await pdfService.streamCertificadoPdf(certificado, stream)
  return Buffer.concat(chunks)
}

describe('pdfService.streamCertificadoPdf', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    r2Service.getFile.mockResolvedValue(null)
  })

  it('deve transmitir chunks via PassThrough e gerar PDF válido começando com %PDF', async () => {
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

    const stream = new PassThrough()
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))

    await pdfService.streamCertificadoPdf(certificado, stream)

    expect(chunks.length).toBeGreaterThan(0)
    const buffer = Buffer.concat(chunks)
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.slice(0, 4).toString()).toBe('%PDF')

    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve aceitar TiposCertificado (singular)', async () => {
    const certificado = {
      codigo: 'ABC123',
      Evento: { nome: 'Evento Teste' },
      Participante: { nomeCompleto: 'Maria' },
      TiposCertificado: {
        texto_base: 'Certificamos que {{nome}} participou.',
      },
    }

    jest
      .spyOn(templateService, 'interpolate')
      .mockReturnValue('Certificamos que Maria participou.')

    const buffer = await streamToBuffer(certificado)
    expect(buffer.slice(0, 4).toString()).toBe('%PDF')

    templateService.interpolate.mockRestore()
  }, 15000)

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

    await streamToBuffer(certificado)

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

  it('deve lançar erro se writableStream não for fornecido ou for inválido', async () => {
    const certificado = {
      codigo: 'VAL123',
      Evento: { nome: 'Evento Teste' },
      Participante: { nomeCompleto: 'João' },
      TiposCertificados: { texto_base: 'Certificamos que...' },
    }

    await expect(
      pdfService.streamCertificadoPdf(certificado, null),
    ).rejects.toThrow('Writable stream inválido ou não fornecido')

    await expect(
      pdfService.streamCertificadoPdf(certificado, {}),
    ).rejects.toThrow('Writable stream inválido ou não fornecido')
  })

  it('deve lançar erro se o stream já estiver destruído ou encerrado antes da geração', async () => {
    const certificado = {
      codigo: 'VAL123',
      Evento: { nome: 'Evento Teste' },
      Participante: { nomeCompleto: 'João' },
      TiposCertificados: { texto_base: 'Certificamos que...' },
    }

    const stream = new PassThrough()
    stream.destroy()

    await expect(
      pdfService.streamCertificadoPdf(certificado, stream),
    ).rejects.toThrow('Stream encerrado antes do início da geração do PDF')
  })

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
    const stream = new PassThrough()
    await expect(
      pdfService.streamCertificadoPdf(certificado, stream),
    ).rejects.toThrow('Código de validação obrigatório')
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
    const stream = new PassThrough()
    await expect(
      pdfService.streamCertificadoPdf(certificado, stream),
    ).rejects.toThrow('Código de validação obrigatório')
  }, 15000)

  it('deve rejeitar se tipo de certificado for nulo ou sem texto_base', async () => {
    const certificadoSemTipo = {
      codigo: 'VAL123',
      Evento: { nome: 'Evento Teste' },
      Participante: { nomeCompleto: 'João' },
    }
    const stream = new PassThrough()
    await expect(
      pdfService.streamCertificadoPdf(certificadoSemTipo, stream),
    ).rejects.toThrow('Tipo de certificado inválido ou sem texto_base')

    const certificadoTextoVazio = {
      codigo: 'VAL123',
      Evento: { nome: 'Evento Teste' },
      Participante: { nomeCompleto: 'João' },
      TiposCertificados: { texto_base: '' },
    }
    await expect(
      pdfService.streamCertificadoPdf(certificadoTextoVazio, stream),
    ).rejects.toThrow('Tipo de certificado inválido ou sem texto_base')
  })

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
    const stream = new PassThrough()
    await expect(
      pdfService.streamCertificadoPdf(certificado, stream),
    ).rejects.toThrow('Erro de interpolação')
    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve rejeitar e destruir doc quando o stream for fechado prematuramente', async () => {
    const certificado = {
      codigo: 'VAL123',
      Evento: { nome: 'Evento Teste' },
      Participante: { nomeCompleto: 'João' },
      TiposCertificados: { texto_base: 'Certificamos...' },
    }
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto')

    const stream = new PassThrough()
    stream.once('data', () => {
      stream.emit('close')
    })

    await expect(
      pdfService.streamCertificadoPdf(certificado, stream),
    ).rejects.toThrow('Stream fechado prematuramente')
    templateService.interpolate.mockRestore()
  })

  it('deve rejeitar e destruir doc quando o stream emitir erro', async () => {
    const certificado = {
      codigo: 'VAL123',
      Evento: { nome: 'Evento Teste' },
      Participante: { nomeCompleto: 'João' },
      TiposCertificados: { texto_base: 'Certificamos...' },
    }
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto')

    const stream = new PassThrough()
    stream.once('data', () => {
      stream.emit('error', new Error('Falha no writable stream'))
    })

    await expect(
      pdfService.streamCertificadoPdf(certificado, stream),
    ).rejects.toThrow('Falha no writable stream')
    templateService.interpolate.mockRestore()
  })

  it('deve rejeitar se doc emitir erro durante a geração', async () => {
    const certificado = {
      codigo: 'VAL123',
      Evento: { nome: 'Evento Teste' },
      Participante: { nomeCompleto: 'João' },
      TiposCertificados: { texto_base: 'Certificamos...' },
    }
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto')

    const docError = new Error('Erro interno do PDFKit')
    jest.spyOn(PDFDocument.prototype, 'pipe').mockImplementation(function () {
      process.nextTick(() => this.emit('error', docError))
      return this
    })

    const stream = new PassThrough()
    await expect(
      pdfService.streamCertificadoPdf(certificado, stream),
    ).rejects.toThrow('Erro interno do PDFKit')

    PDFDocument.prototype.pipe.mockRestore()
    templateService.interpolate.mockRestore()
  })
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
    await streamToBuffer(
      baseCertificado('https://cdn.example.com/templates/custom.jpg'),
    )
    expect(r2Service.getFile).toHaveBeenCalledWith(
      'https://cdn.example.com/templates/custom.jpg',
    )
    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve usar "template/padrao.jpg" quando url_template_base é nula', async () => {
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')
    await streamToBuffer(baseCertificado(null))
    expect(r2Service.getFile).toHaveBeenCalledWith('template/padrao.jpg')
    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve usar "template/padrao.jpg" quando url_template_base é undefined', async () => {
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')
    await streamToBuffer(baseCertificado(undefined))
    expect(r2Service.getFile).toHaveBeenCalledWith('template/padrao.jpg')
    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve usar "template/padrao.jpg" quando Evento é nulo', async () => {
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')
    const cert = {
      ...baseCertificado(null),
      Evento: null,
    }
    await streamToBuffer(cert)
    expect(r2Service.getFile).toHaveBeenCalledWith('template/padrao.jpg')
    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve desenhar imagem de fundo quando retornada pelo R2', async () => {
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')
    const imageSpy = jest
      .spyOn(PDFDocument.prototype, 'image')
      .mockImplementation(function () {
        return this
      })
    r2Service.getFile.mockImplementation(async (key) => {
      if (key === 'template/padrao.jpg') {
        return { Body: Buffer.from('fake-image-bytes') }
      }
      return null
    })

    try {
      await streamToBuffer(baseCertificado(null))
      expect(imageSpy).toHaveBeenCalled()
    } finally {
      imageSpy.mockRestore()
      templateService.interpolate.mockRestore()
    }
  })
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
    await streamToBuffer(baseCert())
    expect(r2Service.getFile).toHaveBeenCalledWith('fontes/Lato-Medium.ttf')
    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve gerar PDF mesmo quando a fonte não está disponível no R2', async () => {
    r2Service.getFile.mockResolvedValue(null)
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')
    const buffer = await streamToBuffer(baseCert())
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.slice(0, 4).toString()).toBe('%PDF')
    templateService.interpolate.mockRestore()
  }, 15000)

  it('deve aplicar fonte do R2 quando retornada com sucesso', async () => {
    jest.spyOn(templateService, 'interpolate').mockReturnValue('Texto ok')
    const fakeFont = Buffer.from('fake-font-bytes')
    const originalFont = PDFDocument.prototype.font
    const fontSpy = jest
      .spyOn(PDFDocument.prototype, 'font')
      .mockImplementation(function (src, size) {
        if (src === fakeFont) {
          return originalFont.call(this, 'Helvetica', size)
        }
        return originalFont.call(this, src, size)
      })
    r2Service.getFile.mockImplementation(async (key) => {
      if (key === 'fontes/Lato-Medium.ttf') {
        return { Body: fakeFont }
      }
      return null
    })

    try {
      await streamToBuffer(baseCert())
      expect(fontSpy).toHaveBeenCalledWith(fakeFont)
    } finally {
      fontSpy.mockRestore()
      templateService.interpolate.mockRestore()
    }
  })
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
    const buffer = await streamToBuffer(cert)
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
    const buffer = await streamToBuffer(cert)
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

    const buffer = await streamToBuffer(cert)
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
      const buffer = await streamToBuffer(cert)
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

    const buffer = await streamToBuffer(cert)
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

    const buffer = await streamToBuffer(cert)
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

    const buffer = await streamToBuffer(cert)
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

    const buffer = await streamToBuffer(cert)
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(fontSizeSpy).toHaveBeenCalledWith(10)

    templateService.interpolate.mockRestore()
    fontSizeSpy.mockRestore()
  }, 15000)
})
