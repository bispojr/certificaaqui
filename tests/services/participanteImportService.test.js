jest.mock('../../src/services/participanteService', () => ({
  createOrLinkByEmail: jest.fn(),
}))

const participanteService = require('../../src/services/participanteService')
const participanteImportService = require('../../src/services/participanteImportService')

describe('participanteImportService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('bloqueia quando origem não é exclusiva', async () => {
    await expect(
      participanteImportService.importarParticipantes({
        eventoId: 10,
        origem: 'colado',
        conteudo: 'nomeCompleto\temail\nMaria\tmaria@exemplo.com',
        arquivoCsv: 'nomeCompleto,email\nMaria,maria@exemplo.com',
      }),
    ).rejects.toThrow(
      'Informe exatamente uma origem de dados: conteúdo colado ou arquivo CSV.',
    )
  })

  it('processa colagem tabular com sucesso parcial por linha', async () => {
    participanteService.createOrLinkByEmail.mockResolvedValueOnce({
      createdParticipante: true,
      createdLink: true,
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

    expect(participanteService.createOrLinkByEmail).toHaveBeenCalledTimes(1)
    expect(participanteService.createOrLinkByEmail).toHaveBeenCalledWith(
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

  it('contabiliza vínculo criado quando e-mail já existe', async () => {
    participanteService.createOrLinkByEmail.mockResolvedValueOnce({
      createdParticipante: false,
      createdLink: true,
    })

    const resultado = await participanteImportService.importarParticipantes({
      eventoId: 10,
      origem: 'csv',
      arquivoCsv: [
        'nomeCompleto,email,instituicao',
        'João Souza,joao@exemplo.com,USP',
      ].join('\n'),
      principal: { role: 'admin' },
    })

    expect(participanteService.createOrLinkByEmail).toHaveBeenCalledTimes(1)
    expect(resultado.totalLinhas).toBe(1)
    expect(resultado.criados).toBe(0)
    expect(resultado.vinculosCriados).toBe(1)
    expect(resultado.falhas).toBe(0)
  })
})
