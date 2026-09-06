const participanteService = require('../../src/services/participanteService')
const { Participante } = require('../../src/models')

jest.mock('../../src/models', () => ({
  Participante: {
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    restore: jest.fn(),
  },
  ParticipanteEvento: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}))

const { ParticipanteEvento } = require('../../src/models')

describe('participanteService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('findAll chama findAndCountAll com paginação e retorna formato correto', async () => {
    Participante.findAndCountAll.mockResolvedValue({
      count: 42,
      rows: [{ id: 1 }],
    })
    const page = 2
    const perPage = 5
    const result = await participanteService.findAll({ page, perPage })
    expect(Participante.findAndCountAll).toHaveBeenCalledWith({
      offset: 5,
      limit: 5,
    })
    expect(result).toEqual({
      data: [{ id: 1 }],
      meta: { total: 42, page: 2, perPage: 5, totalPages: 9 },
    })
  })

  it('findById chama Participante.findByPk', async () => {
    await participanteService.findById(1)
    expect(Participante.findByPk).toHaveBeenCalledWith(1)
  })

  it('create chama Participante.create', async () => {
    const data = { nomeCompleto: 'Teste' }
    await participanteService.create(data)
    expect(Participante.create).toHaveBeenCalledWith(data)
  })

  it('update retorna null se não encontrar', async () => {
    Participante.findByPk.mockResolvedValue(null)
    const result = await participanteService.update(1, {})
    expect(result).toBeNull()
  })

  it('update chama update se encontrar', async () => {
    const mockParticipante = { update: jest.fn() }
    Participante.findByPk.mockResolvedValue(mockParticipante)
    await participanteService.update(1, { nomeCompleto: 'Novo' })
    expect(mockParticipante.update).toHaveBeenCalledWith({
      nomeCompleto: 'Novo',
    })
  })

  it('destroy retorna null se não encontrar', async () => {
    Participante.findByPk.mockResolvedValue(null)
    const result = await participanteService.destroy(1)
    expect(result).toBeNull()
  })

  it('destroy chama destroy se encontrar', async () => {
    const mockParticipante = { destroy: jest.fn() }
    Participante.findByPk.mockResolvedValue(mockParticipante)
    await participanteService.destroy(1)
    expect(mockParticipante.destroy).toHaveBeenCalled()
  })

  it('restore retorna null se não encontrar', async () => {
    Participante.findByPk.mockResolvedValue(null)
    const result = await participanteService.restore(1)
    expect(result).toBeNull()
  })

  it('restore chama restore se encontrar', async () => {
    const mockParticipante = { restore: jest.fn() }
    Participante.findByPk.mockResolvedValue(mockParticipante)
    await participanteService.restore(1)
    expect(mockParticipante.restore).toHaveBeenCalled()
  })

  it('createOrLinkByEmail cria participante e vínculo quando email não existe', async () => {
    Participante.findOne.mockResolvedValue(null)
    Participante.create.mockResolvedValue({ id: 8 })
    ParticipanteEvento.findOne.mockResolvedValue(null)

    const result = await participanteService.createOrLinkByEmail({
      nomeCompleto: 'Pessoa Nova',
      email: 'nova@exemplo.com',
      evento_id: 2,
    })

    expect(Participante.create).toHaveBeenCalledWith({
      nomeCompleto: 'Pessoa Nova',
      email: 'nova@exemplo.com',
      evento_id: 2,
    })
    expect(ParticipanteEvento.create).toHaveBeenCalledWith({
      participante_id: 8,
      evento_id: 2,
    })
    expect(result.createdParticipante).toBe(true)
    expect(result.createdLink).toBe(true)
  })

  it('createOrLinkByEmail cria vínculo quando email já existe', async () => {
    Participante.findOne.mockResolvedValue({ id: 3 })
    ParticipanteEvento.findOne.mockResolvedValue(null)

    const result = await participanteService.createOrLinkByEmail({
      nomeCompleto: 'Pessoa Existente',
      email: 'existente@exemplo.com',
      evento_id: 9,
    })

    expect(Participante.create).not.toHaveBeenCalled()
    expect(ParticipanteEvento.create).toHaveBeenCalledWith({
      participante_id: 3,
      evento_id: 9,
    })
    expect(result.createdParticipante).toBe(false)
    expect(result.createdLink).toBe(true)
  })
})
