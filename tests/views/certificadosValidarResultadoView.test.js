const path = require('path')
const fs = require('fs')
const handlebars = require('handlebars')
require('../../hbs-helpers-date')

describe('View: certificados/validar-resultado.hbs', () => {
  let template
  beforeAll(() => {
    const filePath = path.join(
      __dirname,
      '../../views/certificados/validar-resultado.hbs',
    )
    const source = fs.readFileSync(filePath, 'utf8')
    template = handlebars.compile(source)
  })

  it('renderiza painel verde com dados do certificado', () => {
    const html = template({
      valido: true,
      certificado: {
        id: 42,
        nome: 'Certificado Teste',
        codigo: 'ABC123',
        status: 'emitido',
        created_at: '2026-03-26',
        Participante: { nomeCompleto: 'Maria', email: 'maria@teste.com' },
        Evento: { nome: 'Evento Teste' },
        TiposCertificados: { descricao: 'Palestrante' },
      },
    })
    expect(html).toMatch(/✔ Certificado Válido/)
    expect(html).toMatch(/Certificado Teste/)
    expect(html).toMatch(/ABC123/)
    expect(html).toMatch(/Maria/)
    expect(html).toMatch(/maria@teste.com/)
    expect(html).toMatch(/Evento Teste/)
    expect(html).toMatch(/emitido/)
    // Valida formato amigável da data
    expect(html).toMatch(
      /\d{2}\/\d{2}\/\d{2}, \d{2}h\d{2}, Horário de Brasília\./,
    )
    // Garante que o tipo de certificado aparece
    expect(html).toMatch(/Tipo de Certificado[\s\S]*Palestrante/)
    expect(html).toMatch(/Tipo de Certificado[\s\S]*Palestrante/)
    expect(html).toMatch(/href='\/api\/certificados\/42\/pdf'/)
    expect(html).not.toMatch(/Inválido/)
  })

  it('renderiza painel vermelho quando inválido', () => {
    const html = template({ valido: false })
    expect(html).toMatch(/✘ Certificado Inválido/)
    expect(html).toMatch(/Nenhum certificado foi encontrado/)
    expect(html).not.toMatch(/Certificado Válido/)
  })

  it('renderiza link para validar outro código', () => {
    const html = template({ valido: false })
    // Aceita quebras de linha e espaços extras entre as palavras
    expect(html).toMatch(/Validar\s*outro\s*código/)
    expect(html).toMatch(/href='\/validar'/)
  })
})
