const participanteService = require('../../src/services/participanteService')
const { Participante } = require('../../src/models')

jest.mock('../../src/models', () => ({
  Participante: {
    findByPk: jest.fn(),
    destroy: jest.fn(),
  },
}))

describe('participanteService', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('delete', () => {
    it('deve deletar um participante existente', async () => {
      const participanteMock = { destroy: jest.fn() }
      Participante.findByPk.mockResolvedValue(participanteMock)
      await participanteService.delete(1)
      expect(Participante.findByPk).toHaveBeenCalledWith(1)
      expect(participanteMock.destroy).toHaveBeenCalled()
    })

    it('deve retornar null se participante não existir', async () => {
      Participante.findByPk.mockResolvedValue(null)
      const result = await participanteService.delete(999)
      expect(result).toBeNull()
      expect(Participante.findByPk).toHaveBeenCalledWith(999)
    })
  })
})
