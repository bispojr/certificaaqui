const tiposCertificadosService = require('../../src/services/tiposCertificadosService')
const { TiposCertificados } = require('../../src/models')

jest.mock('../../src/models', () => ({
  TiposCertificados: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    restore: jest.fn(),
  },
}))

describe('tiposCertificadosService', () => {
  describe('delete', () => {
    it('deve deletar um tipo de certificado existente', async () => {
      const tipoMock = { destroy: jest.fn() }
      TiposCertificados.findByPk.mockResolvedValue(tipoMock)
      await tiposCertificadosService.delete(1)
      expect(TiposCertificados.findByPk).toHaveBeenCalledWith(1)
      expect(tipoMock.destroy).toHaveBeenCalled()
    })

    it('deve retornar null se tipo de certificado não existir', async () => {
      TiposCertificados.findByPk.mockResolvedValue(null)
      const result = await tiposCertificadosService.delete(999)
      expect(result).toBeNull()
      expect(TiposCertificados.findByPk).toHaveBeenCalledWith(999)
    })
  })
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('findAll chama TiposCertificados.findAndCountAll com offset e limit', async () => {
    TiposCertificados.findAndCountAll = jest.fn().mockResolvedValue({ count: 10, rows: [{ id: 1 }] })
    const page = 2
    const perPage = 5
    const result = await tiposCertificadosService.findAll({ page, perPage })
    expect(TiposCertificados.findAndCountAll).toHaveBeenCalledWith({ offset: 5, limit: 5 })
    expect(result).toEqual({
      data: [{ id: 1 }],
      meta: {
        total: 10,
        page: 2,
        perPage: 5,
        totalPages: 2,
      },
    })
  })
  it('findAll usa valores padrão se não passar params', async () => {
    TiposCertificados.findAndCountAll = jest.fn().mockResolvedValue({ count: 0, rows: [] })
    await tiposCertificadosService.findAll()
    expect(TiposCertificados.findAndCountAll).toHaveBeenCalledWith({ offset: 0, limit: 20 })
  })

  it('findById chama TiposCertificados.findByPk', async () => {
    await tiposCertificadosService.findById(1)
    expect(TiposCertificados.findByPk).toHaveBeenCalledWith(1)
  })

  it('create chama TiposCertificados.create', async () => {
    const data = { codigo: 'TST' }
    await tiposCertificadosService.create(data)
    expect(TiposCertificados.create).toHaveBeenCalledWith(data)
  })

  it('update retorna null se não encontrar', async () => {
    TiposCertificados.findByPk.mockResolvedValue(null)
    const result = await tiposCertificadosService.update(1, {})
    expect(result).toBeNull()
  })

  it('update chama update se encontrar', async () => {
    const mockTipo = { update: jest.fn() }
    TiposCertificados.findByPk.mockResolvedValue(mockTipo)
    await tiposCertificadosService.update(1, { codigo: 'NOVO' })
    expect(mockTipo.update).toHaveBeenCalledWith({ codigo: 'NOVO' })
  })

  it('destroy retorna null se não encontrar', async () => {
    TiposCertificados.findByPk.mockResolvedValue(null)
    const result = await tiposCertificadosService.destroy(1)
    expect(result).toBeNull()
  })

  it('destroy chama destroy se encontrar', async () => {
    const mockTipo = { destroy: jest.fn() }
    TiposCertificados.findByPk.mockResolvedValue(mockTipo)
    await tiposCertificadosService.destroy(1)
    expect(mockTipo.destroy).toHaveBeenCalled()
  })

  it('restore retorna null se não encontrar', async () => {
    TiposCertificados.findByPk.mockResolvedValue(null)
    const result = await tiposCertificadosService.restore(1)
    expect(result).toBeNull()
  })

  it('restore chama restore se encontrar', async () => {
    const mockTipo = { restore: jest.fn() }
    TiposCertificados.findByPk.mockResolvedValue(mockTipo)
    await tiposCertificadosService.restore(1)
    expect(mockTipo.restore).toHaveBeenCalled()
  })
})
