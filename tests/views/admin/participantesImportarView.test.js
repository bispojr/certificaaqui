const path = require('path')
const fs = require('fs')
const Handlebars = require('handlebars')

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

  it('renderiza o formulário de importação com os campos obrigatórios', () => {
    const html = template({})
    expect(html).toMatch(/Importação em massa/)
    expect(html).toMatch(/<form[^>]+method='POST'[^>]+action='\/admin\/participantes\/importar'/i)
    expect(html).toMatch(/name='evento_id'/)
    expect(html).toMatch(/name='origem'/)
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

