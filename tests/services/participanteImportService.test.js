jest.mock('../../src/models', () => ({
  Participante: {
    findOne: jest.fn(),
  },
}))

jest.mock('../../src/services/participanteService', () => ({
  create: jest.fn(),
}))

const { Participante } = require('../../src/models')
const participanteService = require('../../src/services/participanteService')
const participanteImportService = require('../../src/services/participanteImportService')

describe('participanteImportService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('processa colagem tabular com sucesso parcial por linha', async () => {
    Participante.findOne.mockResolvedValueOnce(null)
    participanteService.create.mockResolvedValueOnce({
      id: 1,
      email: 'maria@exemplo.com',
    })

    const resultado = await participanteImportService.importarParticipantes({
      eventoId: 10,
      origem: 'colado',
      conteudo: [
        'nomeCompleto\temail\tinstituicao',
        'Maria Silva\tmaria@exemplo.com\tIFSP',
        'Linha Ruim\tnao-email\tUSP',
      ].join('\n'),
      principal: { role: 'admin' },
    })

    expect(Participante.findOne).toHaveBeenCalledTimes(1)
    expect(participanteService.create).toHaveBeenCalledTimes(1)
    expect(participanteService.create).toHaveBeenCalledWith(
      {
        nomeCompleto: 'Maria Silva',
        email: 'maria@exemplo.com',
        instituicao: 'IFSP',
        evento_id: 10,
      },
      expect.objectContaining({ principal: { role: 'admin' } }),
    )
    expect(resultado).toEqual({
      totalLinhas: 2,
      linhasProcessadas: 2,
      criados: 1,
      vinculosCriados: 0,
      falhas: 1,
      errosPorLinha: [
        {
          numeroLinha: 2,
          nomeCompleto: 'Linha Ruim',
          email: 'nao-email',
          instituicao: 'USP',
          status: 'invalida',
          erros: ['email inválido'],
        },
      ],
    })
  })

  it('processa CSV com cabeçalho e ignora linhas em branco', async () => {
    Participante.findOne.mockResolvedValueOnce(null)
    participanteService.create.mockResolvedValueOnce({ id: 2 })

    const resultado = await participanteImportService.importarParticipantes({
      eventoId: 10,
      origem: 'csv',
      arquivoCsv: [
        'nomeCompleto,email,instituicao',
        'João Souza,joao@exemplo.com,USP',
        '',
      ].join('\n'),
      principal: { role: 'admin' },
    })

    expect(Participante.findOne).toHaveBeenCalledTimes(1)
    expect(participanteService.create).toHaveBeenCalledWith(
      {
        nomeCompleto: 'João Souza',
        email: 'joao@exemplo.com',
        instituicao: 'USP',
        evento_id: 10,
      },
      expect.any(Object),
    )
    expect(resultado.totalLinhas).toBe(1)
    expect(resultado.criados).toBe(1)
    expect(resultado.falhas).toBe(0)
  })
})
