  it('incrementa corretamente o número no código de validação', async () => {
    TiposCertificados.findByPk.mockResolvedValue({
      dados_dinamicos: {},
      codigo: 'PT',
    })
    Evento.findByPk.mockResolvedValue({
      codigo_base: 'EDC',
      ano: 2025,
    })
    // Simula 3 inserções, count retorna 0, 1, 2
    Certificado.count = jest.fn()
    Certificado.create = jest.fn()
    Certificado.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2)
    Certificado.create
      .mockResolvedValueOnce({ id: 1, codigo: 'EDC-25-PT-1' })
      .mockResolvedValueOnce({ id: 2, codigo: 'EDC-25-PT-2' })
      .mockResolvedValueOnce({ id: 3, codigo: 'EDC-25-PT-3' })
    const data1 = { tipo_certificado_id: 1, evento_id: 2, valores_dinamicos: {} }
    const data2 = { tipo_certificado_id: 1, evento_id: 2, valores_dinamicos: {} }
    const data3 = { tipo_certificado_id: 1, evento_id: 2, valores_dinamicos: {} }
    const result1 = await certificadoService.create({ ...data1 })
    const result2 = await certificadoService.create({ ...data2 })
    const result3 = await certificadoService.create({ ...data3 })
    expect(Certificado.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ codigo: 'EDC-25-PT-1' })
    )
    expect(Certificado.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ codigo: 'EDC-25-PT-2' })
    )
    expect(Certificado.create).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ codigo: 'EDC-25-PT-3' })
    )
    expect(result1.codigo).toBe('EDC-25-PT-1')
    expect(result2.codigo).toBe('EDC-25-PT-2')
    expect(result3.codigo).toBe('EDC-25-PT-3')
  })
const certificadoService = require('../../src/services/certificadoService')
const { Certificado } = require('../../src/models')

jest.mock('../../src/models', () => ({
  Certificado: {
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    restore: jest.fn(),
  },
  TiposCertificados: {
    findByPk: jest.fn(),
  },
  Evento: {
    findByPk: jest.fn(),
  },
}))
const { TiposCertificados, Evento } = require('../../src/models')
describe('create', () => {

  beforeEach(() => {
    Certificado.create.mockReset()
    TiposCertificados.findByPk.mockReset()
    Evento.findByPk.mockReset()
    Certificado.count && Certificado.count.mockReset && Certificado.count.mockReset()
  })
  it('gera código de validação correto', async () => {
    TiposCertificados.findByPk.mockResolvedValue({
      dados_dinamicos: {},
      codigo: 'PT',
    })
    Evento.findByPk.mockResolvedValue({
      codigo_base: 'EDC',
      ano: 2025,
    })
    Certificado.count = jest.fn().mockResolvedValue(0)
    Certificado.create.mockResolvedValue({ id: 10, codigo: 'EDC-25-PT-1' })
    const data = {
      tipo_certificado_id: 1,
      evento_id: 2,
      valores_dinamicos: {},
    }
    const result = await certificadoService.create(data)
    expect(Certificado.create).toHaveBeenCalledWith(
      expect.objectContaining({ codigo: 'EDC-25-PT-1' })
    )
    expect(result).toEqual({ id: 10, codigo: 'EDC-25-PT-1' })
  })

  it('lança erro 404 se tipo não encontrado', async () => {
    TiposCertificados.findByPk.mockResolvedValue(null)
    await expect(
      certificadoService.create({
        tipo_certificado_id: 999,
        valores_dinamicos: {},
      }),
    ).rejects.toMatchObject({ statusCode: 404 })
    expect(Certificado.create).not.toHaveBeenCalled()
  })

  it('lança erro 422 se faltar campos dinâmicos', async () => {
    TiposCertificados.findByPk.mockResolvedValue({
      dados_dinamicos: { campo1: {}, campo2: {} },
    })
    Evento.findByPk.mockResolvedValue({ codigo_base: 'EDC', ano: 2025 })
    await expect(
      certificadoService.create({
        tipo_certificado_id: 1,
        evento_id: 2,
        valores_dinamicos: { campo1: 'ok' },
      }),
    ).rejects.toMatchObject({ statusCode: 422, camposFaltantes: ['campo2'] })
    expect(Certificado.create).not.toHaveBeenCalled()
  })

  it('cria normalmente se todos os campos dinâmicos presentes', async () => {
    TiposCertificados.findByPk.mockResolvedValue({
      dados_dinamicos: { campo1: {}, campo2: {} },
    })
    Evento.findByPk.mockResolvedValue({ codigo_base: 'EDC', ano: 2025 })
    Certificado.create.mockResolvedValue({ id: 1 })
    Certificado.count = jest.fn().mockResolvedValue(0)
    const result = await certificadoService.create({
      tipo_certificado_id: 1,
      evento_id: 2,
      valores_dinamicos: { campo1: 'ok', campo2: 'ok' },
    })
    expect(Certificado.create).toHaveBeenCalled()
    expect(result).toEqual({ id: 1 })
  })

  it('cria normalmente se dados_dinamicos for null', async () => {
    TiposCertificados.findByPk.mockResolvedValue({ dados_dinamicos: null })
    Evento.findByPk.mockResolvedValue({ codigo_base: 'EDC', ano: 2025 })
    Certificado.create.mockResolvedValue({ id: 2 })
    Certificado.count = jest.fn().mockResolvedValue(0)
    const result = await certificadoService.create({
      tipo_certificado_id: 1,
      evento_id: 2,
      valores_dinamicos: {},
    })
    expect(Certificado.create).toHaveBeenCalled()
    expect(result).toEqual({ id: 2 })
  })
})

describe('certificadoService', () => {
  describe('cancel', () => {
    it('deve cancelar um certificado existente', async () => {
      const certificadoMock = { update: jest.fn() }
      Certificado.findByPk.mockResolvedValue(certificadoMock)
      await certificadoService.cancel(1)
      expect(Certificado.findByPk).toHaveBeenCalledWith(1)
      expect(certificadoMock.update).toHaveBeenCalledWith({
        status: 'cancelado',
      })
    })

    it('deve retornar null se certificado não existir', async () => {
      Certificado.findByPk.mockResolvedValue(null)
      const result = await certificadoService.cancel(999)
      expect(result).toBeNull()
      expect(Certificado.findByPk).toHaveBeenCalledWith(999)
    })
  })
  describe('delete', () => {
    it('deve deletar um certificado existente', async () => {
      const certificadoMock = { destroy: jest.fn() }
      Certificado.findByPk.mockResolvedValue(certificadoMock)
      await certificadoService.delete(1)
      expect(Certificado.findByPk).toHaveBeenCalledWith(1)
      expect(certificadoMock.destroy).toHaveBeenCalled()
    })

    it('deve retornar null se certificado não existir', async () => {
      Certificado.findByPk.mockResolvedValue(null)
      const result = await certificadoService.delete(999)
      expect(result).toBeNull()
      expect(Certificado.findByPk).toHaveBeenCalledWith(999)
    })
  })
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('findAll', () => {
    it('chama findAndCountAll com offset e limit corretos', async () => {
      Certificado.findAndCountAll.mockResolvedValue({ count: 20, rows: [] })
      await certificadoService.findAll({ page: 2, perPage: 5 })
      expect(Certificado.findAndCountAll).toHaveBeenCalledWith({
        offset: 5,
        limit: 5,
      })
    })

    it('retorna { data, meta } com estrutura correta', async () => {
      const rows = [{ id: 1 }, { id: 2 }]
      Certificado.findAndCountAll.mockResolvedValue({ count: 12, rows })
      const result = await certificadoService.findAll({ page: 1, perPage: 10 })
      expect(result).toEqual({
        data: rows,
        meta: { total: 12, page: 1, perPage: 10, totalPages: 2 },
      })
    })

    it('usa page=1 e perPage=10 como defaults', async () => {
      Certificado.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
      await certificadoService.findAll()
      expect(Certificado.findAndCountAll).toHaveBeenCalledWith({
        offset: 0,
        limit: 10,
      })
    })
  })

  it('findById chama Certificado.findByPk', async () => {
    await certificadoService.findById(1)
    expect(Certificado.findByPk).toHaveBeenCalledWith(1)
  })

  it('create chama Certificado.create', async () => {
    const data = { nome: 'Certificado Teste' }
    await certificadoService.create(data)
    expect(Certificado.create).toHaveBeenCalledWith(data)
  })

  it('update retorna null se não encontrar', async () => {
    Certificado.findByPk.mockResolvedValue(null)
    const result = await certificadoService.update(1, {})
    expect(result).toBeNull()
  })

  it('update chama update se encontrar', async () => {
    const mockCertificado = { update: jest.fn() }
    Certificado.findByPk.mockResolvedValue(mockCertificado)
    await certificadoService.update(1, { nome: 'Novo' })
    expect(mockCertificado.update).toHaveBeenCalledWith({ nome: 'Novo' })
  })

  it('destroy retorna null se não encontrar', async () => {
    Certificado.findByPk.mockResolvedValue(null)
    const result = await certificadoService.destroy(1)
    expect(result).toBeNull()
  })

  it('destroy chama destroy se encontrar', async () => {
    const mockCertificado = { destroy: jest.fn() }
    Certificado.findByPk.mockResolvedValue(mockCertificado)
    await certificadoService.destroy(1)
    expect(mockCertificado.destroy).toHaveBeenCalled()
  })

  it('restore retorna null se não encontrar', async () => {
    Certificado.findByPk.mockResolvedValue(null)
    const result = await certificadoService.restore(1)
    expect(result).toBeNull()
  })

  it('restore chama restore se encontrar', async () => {
    const mockCertificado = { restore: jest.fn() }
    Certificado.findByPk.mockResolvedValue(mockCertificado)
    await certificadoService.restore(1)
    expect(mockCertificado.restore).toHaveBeenCalled()
  })
})
