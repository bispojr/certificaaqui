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
    const html = template({ participantes: [], arquivados: [], q: 'abc', usuario: { perfil: 'admin', id: 1 } })
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
    const html = template({ participantes, arquivados: [], q: '', usuario: { perfil: 'admin', id: 1 } })
    expect(html).toMatch(/<th>Certificados<\/th>/)
    expect(html).toMatch(/<td>3<\/td>/)
  })

  it('exibe mensagem Nenhum participante encontrado', () => {
    const html = template({ participantes: [], arquivados: [], q: '', usuario: { perfil: 'admin', id: 1 } })
    expect(html).toMatch(/Nenhum participante\s*encontrado/)
  })

  it('renderiza seção arquivados em <details> com forms POST', () => {
    const arquivados = [{ id: 2, nomeCompleto: 'Zé', email: 'z@x.com' }]
    const html = template({ participantes: [], arquivados, q: '', usuario: { perfil: 'admin', id: 1 } })
    expect(html).toMatch(/<details/)
    expect(html).toMatch(/Participantes arquivados/)
    expect(html).toMatch(
      /<form[^>]+method='POST'[^>]+action='\/admin\/1\/participantes\/2\/restaurar'/,
    )
    expect(html).toMatch(/Restaurar/)
  })
})
