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

  it('processa importação CSV utilizando variações e aliases de cabeçalhos', async () => {
    participanteService.createOrLinkByEmail.mockResolvedValueOnce({
      createdParticipante: true,
      createdLink: false,
    })

    const resultado = await participanteImportService.importarParticipantes({
      eventoId: 10,
      origem: 'csv',
      arquivoCsv: [
        'NOME COMPLETO,E-Mail,INSTITUIÇÃO DE ENSINO',
        'Ana Clara,ana@exemplo.com,Unicamp',
      ].join('\n'),
      principal: { role: 'admin' },
    })

    expect(participanteService.createOrLinkByEmail).toHaveBeenCalledWith(
      {
        nomeCompleto: 'Ana Clara',
        email: 'ana@exemplo.com',
        instituicao: 'Unicamp',
        evento_id: 10,
      },
      expect.anything(),
    )
    expect(resultado.criados).toBe(1)
  })

  it('processa importação por colagem (TSV) utilizando aliases "Nome", "e mail" e "instituição/empresa"', async () => {
    participanteService.createOrLinkByEmail.mockResolvedValueOnce({
      createdParticipante: true,
      createdLink: false,
    })

    const resultado = await participanteImportService.importarParticipantes({
      eventoId: 10,
      origem: 'colado',
      conteudo: [
        'Nome\te mail\tinstituição/empresa',
        'Carlos Lima\tcarlos@exemplo.com\tEmpresa X',
      ].join('\n'),
      principal: { role: 'admin' },
    })

    expect(participanteService.createOrLinkByEmail).toHaveBeenCalledWith(
      {
        nomeCompleto: 'Carlos Lima',
        email: 'carlos@exemplo.com',
        instituicao: 'Empresa X',
        evento_id: 10,
      },
      expect.anything(),
    )
    expect(resultado.criados).toBe(1)
  })

  describe('paridade total de processamento entre CSV e dados colados (TSV)', () => {
    it('extrai exatamente o mesmo mapeamento de campos internos via parseLines para CSV e TSV', () => {
      const csvContent = [
        'NOME COMPLETO,E-Mail,INSTITUIÇÃO DE ENSINO',
        'Ana Clara,ana@exemplo.com,Unicamp',
      ].join('\n')

      const tsvContent = [
        'NOME COMPLETO\tE-Mail\tINSTITUIÇÃO DE ENSINO',
        'Ana Clara\tana@exemplo.com\tUnicamp',
      ].join('\n')

      const csvParsed = participanteImportService.parseLines(csvContent, 'csv')
      const tsvParsed = participanteImportService.parseLines(
        tsvContent,
        'colado',
      )

      expect(csvParsed.rows.length).toBe(tsvParsed.rows.length)
      expect(csvParsed.rows[0].nomeCompleto).toBe(
        tsvParsed.rows[0].nomeCompleto,
      )
      expect(csvParsed.rows[0].email).toBe(tsvParsed.rows[0].email)
      expect(csvParsed.rows[0].instituicao).toBe(tsvParsed.rows[0].instituicao)
    })

    it('gera resultados idênticos em importarParticipantes para o mesmo conjunto de dados via CSV e colagem', async () => {
      const csvContent = [
        'Nome,e mail,instituição',
        'Carlos Lima,carlos@exemplo.com,Empresa X',
        'Linha Invalida,email-ruim,Empresa Y',
      ].join('\n')

      const tsvContent = [
        'Nome\te mail\tinstituição',
        'Carlos Lima\tcarlos@exemplo.com\tEmpresa X',
        'Linha Invalida\temail-ruim\tEmpresa Y',
      ].join('\n')

      participanteService.createOrLinkByEmail.mockResolvedValue({
        createdParticipante: true,
        createdLink: false,
      })

      const resultadoCsv =
        await participanteImportService.importarParticipantes({
          eventoId: 10,
          origem: 'csv',
          arquivoCsv: csvContent,
          principal: { role: 'admin' },
        })

      const chamadaCsv = participanteService.createOrLinkByEmail.mock.calls[0]
      participanteService.createOrLinkByEmail.mockClear()

      const resultadoTsv =
        await participanteImportService.importarParticipantes({
          eventoId: 10,
          origem: 'colado',
          conteudo: tsvContent,
          principal: { role: 'admin' },
        })

      const chamadaTsv = participanteService.createOrLinkByEmail.mock.calls[0]

      expect(resultadoCsv).toEqual(resultadoTsv)
      expect(chamadaCsv).toEqual(chamadaTsv)
    })
  })
})
