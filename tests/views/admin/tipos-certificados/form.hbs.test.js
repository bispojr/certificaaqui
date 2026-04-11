const fs = require('fs')
const path = require('path')
const vm = require('vm')
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

// Helper ifSelected igual ao app
Handlebars.registerHelper('ifSelected', function (val) {
  return val ? 'selected' : ''
})

describe('views/admin/tipos-certificados/form.hbs', () => {
  let template
  beforeAll(() => {
    const source = fs.readFileSync(templatePath, 'utf8')
    template = Handlebars.compile(source)
  })

  it('renderiza formulário vazio para novo tipo', () => {
    const html = template({
      tipo: null,
      flash: {},
      opcoesCampoDestaque: [{ value: 'nome', selected: true }],
    })
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
    const campoDestaque = tipo.campo_destaque || 'nome'
    const opcoesCampoDestaque = [
      { value: 'nome', selected: campoDestaque === 'nome' },
      ...Object.keys(tipo.dados_dinamicos).map((key) => ({
        value: key,
        selected: key === campoDestaque,
      })),
    ]
    const html = template({ tipo, flash: {}, opcoesCampoDestaque })
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
    const html = template({
      tipo: null,
      flash: { error: 'Erro!' },
      opcoesCampoDestaque: [{ value: 'nome', selected: true }],
    })
    const $ = cheerio.load(html)
    expect($('.alert-danger').text()).toContain('Erro!')
  })
})

// ─── Integridade do bloco <script> ───────────────────────────────────────────

describe('views/admin/tipos-certificados/form.hbs — integridade do <script>', () => {
  let template
  let scriptContent

  beforeAll(() => {
    const source = fs.readFileSync(
      path.join(
        __dirname,
        '../../../../views/admin/tipos-certificados/form.hbs',
      ),
      'utf8',
    )
    template = Handlebars.compile(source)
    // Renderiza com dados_dinamicos nulos (caso novo) para extrair o script
    const html = template({
      tipo: null,
      flash: {},
      opcoesCampoDestaque: [{ value: 'nome', selected: true }],
    })
    const $ = cheerio.load(html)
    scriptContent = $('script').last().html() || ''
  })

  it('o bloco <script> existe e não está vazio', () => {
    expect(scriptContent.trim().length).toBeGreaterThan(0)
  })

  it('o JavaScript do bloco <script> é sintaticamente válido', () => {
    expect(() => new vm.Script(scriptContent)).not.toThrow()
  })

  it('declara a variável dadosDinamicos fora de comentário', () => {
    // Garante que nenhuma linha comentada contenha a declaração
    const linhas = scriptContent.split('\n')
    const declaracao = linhas.find((l) =>
      l.replace(/\/\/.*/, '').includes('let dadosDinamicos'),
    )
    expect(declaracao).toBeDefined()
  })

  it('define a função adicionarCampo', () => {
    expect(scriptContent).toMatch(/function adicionarCampo\s*\(/)
  })

  it('define a função sincronizar', () => {
    expect(scriptContent).toMatch(/function sincronizar\s*\(/)
  })

  it('define a função atualizarPreview', () => {
    expect(scriptContent).toMatch(/function atualizarPreview\s*\(/)
  })

  it('registra listener de submit no formulário', () => {
    expect(scriptContent).toMatch(/tipoForm.*addEventListener.*submit/s)
  })

  it('registra listener de input no texto_base', () => {
    expect(scriptContent).toMatch(/texto_base.*addEventListener.*input/s)
  })

  it('serializa dados_dinamicos como JSON válido quando tipo tem campos', () => {
    const tipo = {
      id: 1,
      codigo: 'PA',
      descricao: 'Palestrante',
      dados_dinamicos: { tema: 'Tema', duracao: 'Duração' },
      campo_destaque: 'tema',
      texto_base: 'Certificamos ${nome} pelo tema ${tema}.',
    }
    const html = template({
      tipo,
      flash: {},
      opcoesCampoDestaque: [
        { value: 'nome', selected: false },
        { value: 'tema', selected: true },
        { value: 'duracao', selected: false },
      ],
    })
    const $ = cheerio.load(html)
    const script = $('script').last().html() || ''
    // O JSON de dados_dinamicos deve aparecer inline no script
    expect(script).toContain('"tema"')
    expect(script).toContain('"duracao"')
    // Deve ser sintaticamente válido também no modo edição
    expect(() => new vm.Script(script)).not.toThrow()
  })

  it('usa dados_dinamicos={} quando tipo é null', () => {
    const html = template({
      tipo: null,
      flash: {},
      opcoesCampoDestaque: [{ value: 'nome', selected: true }],
    })
    const $ = cheerio.load(html)
    const script = $('script').last().html() || ''
    // O fallback para {} deve aparecer no script
    expect(script).toContain('{}')
    expect(() => new vm.Script(script)).not.toThrow()
  })
})
