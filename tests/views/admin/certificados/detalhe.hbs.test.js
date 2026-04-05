const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const cheerio = require('cheerio')

describe('views/admin/certificados/detalhe.hbs', () => {
  let template
  beforeAll(() => {
    const filePath = path.join(
      process.cwd(),
      'views/admin/certificados/detalhe.hbs',
    )
    const source = fs.readFileSync(filePath, 'utf8')
    Handlebars.registerHelper('eq', (a, b) => a === b)
    template = Handlebars.compile(source)
  })

  it('exibe todos os dados principais do certificado', () => {
    const html = template({
      certificado: {
        id: 1,
        codigo: 'ABC123',
        status: 'emitido',
        nome: 'Certificado Teste',
        Participante: { nomeCompleto: 'Fulano', email: 'f@x.com' },
        Evento: { nome: 'Evento XPTO' },
        TiposCertificado: { descricao: 'Tipo A' },
        valores_dinamicos: { campo1: 'valor1', campo2: 'valor2' },
      },
      textoInterpolado: 'Texto\ncom\nquebra',
      flash: {},
    })
    const $ = cheerio.load(html)
    expect($('h2').text()).toContain('ABC123')
    expect($('.badge.bg-success').text()).toContain('emitido')
    expect($('.list-group-item').text()).toContain('Fulano')
    expect($('.list-group-item').text()).toContain('Evento XPTO')
    expect($('.list-group-item').text()).toContain('Tipo A')
    expect($('.list-group-item').text()).toContain('emitido')
    expect($('.btn-outline-primary').attr('href')).toMatch(
      /\/public\/certificados\/1\/pdf/,
    )
    expect($('.btn-outline-primary').attr('target')).toBe('_blank')
    // Aceita tanto undefined (cheerio antigo) quanto 'pre-wrap' (cheerio novo)
    const ws = $('.card-body').css('white-space')
    expect(ws === undefined || ws === 'pre-wrap').toBe(true)
    expect($('.card-body').text()).toContain('Texto')
    expect($('.card-body').text()).toContain('quebra')
  })

  it('exibe tabela de valores dinâmicos se houver', () => {
    const html = template({
      certificado: {
        valores_dinamicos: { campoA: 'A', campoB: 'B' },
        Participante: {},
        Evento: {},
        TiposCertificado: {},
      },
      textoInterpolado: '',
      flash: {},
    })
    const $ = cheerio.load(html)
    expect($('table').length).toBe(1)
    expect($('td').first().text()).toBe('campoA')
    expect($('td').eq(1).text()).toBe('A')
    expect($('td').eq(2).text()).toBe('campoB')
    expect($('td').eq(3).text()).toBe('B')
  })

  it('não exibe tabela de valores dinâmicos se vazio', () => {
    const html = template({
      certificado: {
        valores_dinamicos: null,
        Participante: {},
        Evento: {},
        TiposCertificado: {},
      },
      textoInterpolado: '',
      flash: {},
    })
    const $ = cheerio.load(html)
    expect($('table').length).toBe(0)
  })

  it('exibe mensagem flash de sucesso e erro', () => {
    const html = template({
      certificado: {
        valores_dinamicos: null,
        Participante: {},
        Evento: {},
        TiposCertificado: {},
      },
      textoInterpolado: '',
      flash: { success: 'OK', error: 'ERRO' },
    })
    const $ = cheerio.load(html)
    expect($('.alert-success').text()).toContain('OK')
    expect($('.alert-danger').text()).toContain('ERRO')
  })

  it('exibe botão Voltar para /admin/certificados', () => {
    const html = template({
      certificado: {
        id: 1,
        valores_dinamicos: null,
        Participante: {},
        Evento: {},
        TiposCertificado: {},
      },
      textoInterpolado: '',
      flash: {},
    })
    const $ = cheerio.load(html)
    expect($('a.btn-outline-secondary').attr('href')).toBe(
      '/admin/certificados',
    )
  })
})
