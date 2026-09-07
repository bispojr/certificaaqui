const path = require('path')
const fs = require('fs')
const Handlebars = require('handlebars')
require('../../../hbs-helpers')

describe('admin/participantes/importar.hbs', () => {
  let template

  beforeAll(() => {
    const filePath = path.join(
      process.cwd(),
      'views/admin/participantes/importar.hbs',
    )
    const source = fs.readFileSync(filePath, 'utf8')
    template = Handlebars.compile(source)
  })

  it('renderiza o formulário de importação com o select de Nome de Evento e customizações de arquivo', () => {
    const eventos = [
      { id: 1, nome: 'Evento Alfa' },
      { id: 2, nome: 'Evento Beta' },
    ]
    const html = template({ eventos })
    expect(html).toMatch(/Importação em massa/)
    expect(html).toMatch(
      /<form[^>]+method='POST'[^>]+action='\/admin\/participantes\/importar'/i,
    )
    expect(html).toMatch(/Nome de Evento/)
    expect(html).toMatch(/select[^>]+name='evento_id'/)
    expect(html).toMatch(/Evento Alfa/)
    expect(html).toMatch(/Evento Beta/)
    expect(html).toMatch(/name='origem'/)
    expect(html).toMatch(/option value='csv' selected/)
    expect(html).toMatch(/Escolha o arquivo/)
    expect(html).toMatch(/Nenhum arquivo escolhido/)
    expect(html).toMatch(/name='conteudo'/)
    expect(html).toMatch(/name='arquivoCsv'/)
    expect(html).toMatch(/href='\/admin\/participantes'/)
  })

  it('renderiza a mensagem de conclusão e os erros por linha quando resultadoImportacao é fornecido', () => {
    const html = template({
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

    expect(html).toMatch(/Importação concluída/)
    expect(html).toMatch(/1 participantes criados/)
    expect(html).toMatch(/1 falhas/)
    expect(html).toMatch(/Linha 2/)
    expect(html).toMatch(/Linha Ruim/)
    expect(html).toMatch(/email inválido/)
  })
})
