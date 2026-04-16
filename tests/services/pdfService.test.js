const pdfService = require('../../src/services/pdfService')
const templateService = require('../../src/services/templateService')

jest.mock('../../src/services/r2Service', () => ({
  getFile: jest.fn().mockResolvedValue(null),
}))

const r2Service = require('../../src/services/r2Service')

describe('pdfService.generateCertificadoPdf', () => {
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
