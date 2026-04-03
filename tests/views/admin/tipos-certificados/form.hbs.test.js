const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const cheerio = require('cheerio')

const templatePath = path.join(
  __dirname,
  '../../../../views/admin/tipos-certificados/form.hbs',
)

// Simula o layout wrapper
const wrapWithLayout = (content) => `LAYOUT-START\n${content}\nLAYOUT-END`

// Simula o helper de partial do handlebars
Handlebars.registerHelper('> layouts/admin', function (options) {
  return wrapWithLayout(options.fn(this))
})

// Simula o helper json usado no template
Handlebars.registerHelper('json', function (context) {
  return JSON.stringify(context || {})
})

// Helper raw para ignorar Handlebars dentro do bloco
Handlebars.registerHelper('raw', function (options) {
  return options.fn(this)
})

// Helper eq para comparação de igualdade
Handlebars.registerHelper('eq', function (a, b) {
  return a === b
})

describe('views/admin/tipos-certificados/form.hbs', () => {
  let template
  beforeAll(() => {
    const source = fs.readFileSync(templatePath, 'utf8')
    template = Handlebars.compile(source)
  })

  it('renderiza formulário vazio para novo tipo', () => {
    const html = template({ tipo: null, flash: {} })
    const $ = cheerio.load(html)
    expect($('form#tipoForm').length).toBe(1)
    expect($('input[name="codigo"]').val()).toBe('')
    expect($('input[name="descricao"]').val()).toBe('')
    expect($('#camposContainer').length).toBe(1)
    expect($('#campo_destaque').find('option[value="nome"]').length).toBe(1)
    expect($('#preview').length).toBe(1)
  })

  it('renderiza formulário preenchido para edição', () => {
    const tipo = {
      id: 42,
      codigo: 'cert2026',
      descricao: 'Certificado de Teste',
      dados_dinamicos: { cpf: 'CPF', matricula: 'Matrícula' },
      campo_destaque: 'cpf',
      texto_base: 'Certifico que ${nome} (${cpf}) concluiu.',
    }
    const html = template({ tipo, flash: {} })
    const $ = cheerio.load(html)
    expect($('input[name="codigo"]').val()).toBe('cert2026')
    expect($('input[name="descricao"]').val()).toBe('Certificado de Teste')
    expect($('#campo_destaque').find('option[value="cpf"]').length).toBe(1)
    expect($('#campo_destaque').find('option[value="matricula"]').length).toBe(
      1,
    )
    // O selected pode não ser refletido no DOM do cheerio, então testamos o atributo
    expect($('#campo_destaque').html()).toContain('value="cpf" selected')
    expect($('#texto_base').text()).toContain('${nome}')
  })

  it('exibe mensagem de erro se flash.error', () => {
    const html = template({ tipo: null, flash: { error: 'Erro!' } })
    const $ = cheerio.load(html)
    expect($('.alert-danger').text()).toContain('Erro!')
  })
})
