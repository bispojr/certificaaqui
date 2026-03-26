const path = require('path')
const fs = require('fs')
const handlebars = require('handlebars')

describe('View: certificados/obter-lista.hbs', () => {
  let template
  beforeAll(() => {
    const filePath = path.join(
      __dirname,
      '../../views/certificados/obter-lista.hbs',
    )
    const source = fs.readFileSync(filePath, 'utf8')
    handlebars.registerHelper('eq', (a, b) => a === b)
    template = handlebars.compile(source)
  })

  it('renderiza lista de certificados emitidos', () => {
    const html = template({
      email: 'teste@exemplo.com',
      certificados: [
        {
          id: 1,
          nome: 'Certificado 1',
          status: 'emitido',
          created_at: '2026-03-26',
        },
        {
          id: 2,
          nome: 'Certificado 2',
          status: 'pendente',
          created_at: '2026-03-25',
        },
      ],
    })
    expect(html).toMatch(/Seus certificados/)
    expect(html).toMatch(/teste@exemplo.com/)
    expect(html).toMatch(/Certificado 1/)
    expect(html).toMatch(/Certificado 2/)
    expect(html).toMatch(/Baixar PDF/)
    expect(html).toMatch(/bg-success/)
    expect(html).toMatch(/bg-secondary/)
    expect(html).not.toMatch(/Nenhum certificado encontrado/)
  })

  it('renderiza alerta se lista estiver vazia', () => {
    const html = template({ email: 'vazio@exemplo.com', certificados: [] })
    expect(html).toMatch(/Nenhum certificado encontrado/)
    expect(html).toMatch(/vazio@exemplo.com/)
  })

  it('renderiza link para buscar novamente', () => {
    const html = template({ email: 'x@x.com', certificados: [] })
    expect(html).toMatch(/Buscar novamente/)
    expect(html).toMatch(/\/public\/pagina\/obter/)
  })
})
