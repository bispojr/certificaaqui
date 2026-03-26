const certificadoService = require('../../src/services/certificadoService')
const { Certificado } = require('../../src/models')

jest.mock('../../src/models', () => ({
  Certificado: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    restore: jest.fn(),
  },
}))

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

  it('findAll chama findAndCountAll com offset/limit padrão', async () => {
    Certificado.findAndCountAll = jest
      .fn()
      .mockResolvedValue({ count: 12, rows: [{ id: 1 }, { id: 2 }] })
    const result = await certificadoService.findAll()
    expect(Certificado.findAndCountAll).toHaveBeenCalledWith({
      offset: 0,
      limit: 10,
    })
    expect(result).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      meta: { total: 12, page: 1, perPage: 10, totalPages: 2 },
    })
  })

  it('findAll chama findAndCountAll com page/perPage customizados', async () => {
    Certificado.findAndCountAll = jest
      .fn()
      .mockResolvedValue({ count: 42, rows: Array(5).fill({ id: 99 }) })
    const result = await certificadoService.findAll({ page: 2, perPage: 5 })
    expect(Certificado.findAndCountAll).toHaveBeenCalledWith({
      offset: 5,
      limit: 5,
    })
    expect(result.meta).toEqual({
      total: 42,
      page: 2,
      perPage: 5,
      totalPages: 9,
    })
    expect(Array.isArray(result.data)).toBe(true)
    expect(result.data.length).toBe(5)
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
