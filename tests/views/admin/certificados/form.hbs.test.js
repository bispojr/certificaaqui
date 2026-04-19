const path = require('path')
const fs = require('fs')
const Handlebars = require('handlebars')
const cheerio = require('cheerio')

// Importa e executa o hbs-helpers para registrar helpers no Handlebars global
require('../../../../hbs-helpers')

describe('admin/certificados/form.hbs', () => {
  let template
  beforeAll(() => {
    const filePath = path.join(
      __dirname,
      '../../../../views/admin/certificados/form.hbs',
    )
    const source = fs.readFileSync(filePath, 'utf8')
    template = Handlebars.compile(source)
  })

  function render(context) {
    return template(context)
  }

  it('renderiza selects de participante, evento e tipo', () => {
    const html = render({
      participantes: [{ id: 1, nomeCompleto: 'Fulano', email: 'f@a.com' }],
      eventos: [{ id: 2, nome: 'Evento X' }],
      tipos: [{ id: 3, descricao: 'Tipo Y' }],
      certificado: null,
      flash: {},
    })
    const $ = cheerio.load(html)
    expect($('select[name="participante_id"] option').length).toBe(2)
    expect($('select[name="evento_id"] option').length).toBe(2)
    expect($('select[name="tipo_certificado_id"] option').length).toBe(2)
  })

  it('pré-seleciona valores em modo edição', () => {
    const html = render({
      participantes: [{ id: 1, nomeCompleto: 'Fulano', email: 'f@a.com' }],
      eventos: [{ id: 2, nome: 'Evento X' }],
      tipos: [{ id: 3, descricao: 'Tipo Y' }],
      certificado: {
        participante_id: 1,
        evento_id: 2,
        tipo_certificado_id: 3,
        status: 'emitido',
        valores_dinamicos: { campo1: 'abc' },
      },
      flash: {},
    })
    const $ = cheerio.load(html)
    expect($('select[name="participante_id"] option[selected]').val()).toBe('1')
    expect($('select[name="evento_id"] option[selected]').val()).toBe('2')
    expect($('select[name="tipo_certificado_id"] option[selected]').val()).toBe(
      '3',
    )
    expect($('select[name="status"] option[selected]').val()).toBe('emitido')
  })

  it('inclui campo hidden para valores_dinamicos_json', () => {
    const html = render({
      participantes: [],
      eventos: [],
      tipos: [],
      certificado: null,
      flash: {},
    })
    const $ = cheerio.load(html)
    expect($('#valores_dinamicos_json').length).toBe(1)
    expect($('#camposDinamicosContainer').length).toBe(1)
  })

  it('não renderiza flash na view (responsabilidade do layout)', () => {
    const html = render({
      participantes: [],
      eventos: [],
      tipos: [],
      certificado: null,
      flash: { success: 'OK', error: 'ERRO' },
    })
    const $ = cheerio.load(html)
    expect($('.alert-success').length).toBe(0)
    expect($('.alert-danger').length).toBe(0)
  })

  it('embute dados_dinamicos dos tipos no HTML sem usar fetch', () => {
    const html = render({
      participantes: [],
      eventos: [],
      tipos: [
        { id: 10, descricao: 'Palestra', dados_dinamicos: { tema: 'Tema', palestrante: 'Palestrante' } },
        { id: 11, descricao: 'Minicurso', dados_dinamicos: { instrutor: 'Instrutor' } },
      ],
      certificado: null,
      flash: {},
    })

    // Garante que os dados estão embutidos diretamente no HTML
    expect(html).toContain("tiposData['10']")
    expect(html).toContain("tiposData['11']")
    expect(html).toContain('"tema"')
    expect(html).toContain('"instrutor"')

    // Garante que NÃO há chamada fetch para a API de tipos
    expect(html).not.toContain("fetch('/tipos-certificados/")
    expect(html).not.toContain('fetch("/tipos-certificados/')
  })
})
