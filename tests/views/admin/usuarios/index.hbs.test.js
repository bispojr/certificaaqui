const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const cheerio = require('cheerio')

describe('views/admin/usuarios/index.hbs', () => {
  let template
  beforeAll(() => {
    const filePath = path.join(
      process.cwd(),
      'views/admin/usuarios/index.hbs',
    )
    const source = fs.readFileSync(filePath, 'utf8')
    // Helper eq para badge
    Handlebars.registerHelper('eq', (a, b) => a === b)
    template = Handlebars.compile(source)
  })

  it('renderiza lista de usuários com badge de perfil e eventos', () => {
    const html = template({
      usuarios: [
        { id: 1, nome: 'Admin', email: 'a@a.com', perfil: 'admin', eventos: [{}, {}] },
        { id: 2, nome: 'Gestor', email: 'g@g.com', perfil: 'gestor', eventos: [{}] },
        { id: 3, nome: 'Monitor', email: 'm@m.com', perfil: 'monitor', eventos: [] },
      ],
      arquivados: [],
      flash: {},
    })
    const $ = cheerio.load(html)
    // Badge de perfil
    expect($('.badge.bg-danger').text()).toContain('admin')
    expect($('.badge.bg-warning').text()).toContain('gestor')
    expect($('.badge.bg-info').text()).toContain('monitor')
    // Contagem de eventos
    expect($('td').filter((i, el) => $(el).text() === '2').length).toBeGreaterThan(0)
    expect($('td').filter((i, el) => $(el).text() === '1').length).toBeGreaterThan(0)
    expect($('td').filter((i, el) => $(el).text() === '0').length).toBeGreaterThan(0)
    // Botão de arquivar
    expect($('form[action="/admin/usuarios/1/deletar"]').length).toBe(1)
    expect($('form[action="/admin/usuarios/2/deletar"]').length).toBe(1)
    expect($('form[action="/admin/usuarios/3/deletar"]').length).toBe(1)
    // Confirmar antes de arquivar
    expect($('form[onsubmit*="confirm"]').length).toBe(3)
  })

  it('renderiza seção de arquivados apenas se houver', () => {
    const html = template({
      usuarios: [],
      arquivados: [
        { id: 10, nome: 'Usuário Arquivado', email: 'x@x.com', perfil: 'monitor' },
      ],
      flash: {},
    })
    const $ = cheerio.load(html)
    expect($('details summary').text()).toContain('Arquivados (1)')
    expect($('form[action="/admin/usuarios/10/restaurar"]').length).toBe(1)
  })

  it('não renderiza seção de arquivados se vazio', () => {
    const html = template({ usuarios: [], arquivados: [], flash: {} })
    const $ = cheerio.load(html)
    expect($('details summary').length).toBe(0)
  })

  it('exibe mensagem de sucesso e erro', () => {
    const html = template({ usuarios: [], arquivados: [], flash: { success: 'ok', error: 'fail' } })
    const $ = cheerio.load(html)
    expect($('.alert-success').text()).toContain('ok')
    expect($('.alert-danger').text()).toContain('fail')
  })
})
