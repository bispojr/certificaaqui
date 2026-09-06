const path = require('path')
const fs = require('fs')
const Handlebars = require('handlebars')

describe('admin/participantes/index.hbs', () => {
  let template
  beforeAll(() => {
    const filePath = path.join(
      process.cwd(),
      'views/admin/participantes/index.hbs',
    )
    const source = fs.readFileSync(filePath, 'utf8')
    template = Handlebars.compile(source)
  })

  it('renderiza campo de busca GET com name="q"', () => {
    const html = template({ participantes: [], arquivados: [], q: 'abc' })
    expect(html).toMatch(/<form[^>]+method='GET'/i)
    expect(html).toMatch(/name='q'/)
    expect(html).toMatch(/value='abc'/)
  })

  it('renderiza coluna Certificados com numCertificados', () => {
    const participantes = [
      {
        id: 1,
        nomeCompleto: 'Fulano',
        email: 'f@x.com',
        instituicao: 'Inst',
        numCertificados: 3,
      },
    ]
    const html = template({ participantes, arquivados: [], q: '' })
    expect(html).toMatch(/<th>Certificados<\/th>/)
    expect(html).toMatch(/<td>3<\/td>/)
  })

  it('exibe mensagem Nenhum participante encontrado', () => {
    const html = template({ participantes: [], arquivados: [], q: '' })
    expect(html).toMatch(/Nenhum participante\s*encontrado/)
  })

  it('renderiza seção arquivados em <details> com forms POST', () => {
    const arquivados = [{ id: 2, nomeCompleto: 'Zé', email: 'z@x.com' }]
    const html = template({ participantes: [], arquivados, q: '' })
    expect(html).toMatch(/<details/)
    expect(html).toMatch(/Participantes arquivados/)
    expect(html).toMatch(
      /<form[^>]+method='POST'[^>]+action='\/admin\/participantes\/2\/restaurar'/,
    )
    expect(html).toMatch(/Restaurar/)
  })

  it('renderiza a área de importação em massa com textarea, upload e feedback', () => {
    const html = template({
      participantes: [],
      arquivados: [],
      q: '',
      resultadoImportacao: {
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
            erros: ['email inválido'],
          },
        ],
      },
    })

    expect(html).toMatch(/Importação em massa/)
    expect(html).toMatch(/name='origem'/)
    expect(html).toMatch(/name='conteudo'/)
    expect(html).toMatch(/name='arquivoCsv'/)
    expect(html).toMatch(/Importação concluída/)
    expect(html).toMatch(/1 participantes criados/)
    expect(html).toMatch(/1 falhas/)
    expect(html).toMatch(/Linha 2/)
    expect(html).toMatch(/email inválido/)
  })
})
