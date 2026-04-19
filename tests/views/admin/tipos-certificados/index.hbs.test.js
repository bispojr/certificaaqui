const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')
const cheerio = require('cheerio')

const templatePath = path.join(
  __dirname,
  '../../../../views/admin/tipos-certificados/index.hbs',
)
const layoutPath = path.join(__dirname, '../../../../views/layouts/admin.hbs')

// Mock layout wrapper
const wrapWithLayout = (content) => `LAYOUT-START\n${content}\nLAYOUT-END`

// Simula o helper de partial do handlebars
Handlebars.registerHelper('> layouts/admin', function (options) {
  return wrapWithLayout(options.fn(this))
})

describe('views/admin/tipos-certificados/index.hbs', () => {
  let template
  beforeAll(() => {
    const source = fs.readFileSync(templatePath, 'utf8')
    template = Handlebars.compile(source)
  })

  it('renderiza tabela de tipos ativos', () => {
    const html = template({
      tipos: [
        {
          id: 1,
          codigo: 'A',
          descricao: 'Desc',
          campo_destaque: 'nome',
          numCertificados: 2,
          podeEditar: true,
          evento: { id: 1, nome: 'Evento Teste' },
        },
      ],
      arquivados: [],
      flash: {},
    })
    expect(html).toContain('Tipos de Certificados')
    expect(html).toContain('A')
    expect(html).toContain('Desc')
    expect(html).toContain('<code>nome</code>')
    expect(html).toContain('2')
    expect(html).toContain('Editar')
    expect(html).toContain('Arquivar')
    expect(html).not.toContain('Arquivados')
  })

  it('exibe somente-leitura quando não tem ownership', () => {
    const html = template({
      tipos: [
        {
          id: 2,
          codigo: 'B',
          descricao: 'Outro',
          campo_destaque: 'nome',
          numCertificados: 0,
          podeEditar: false,
          evento: { id: 2, nome: 'Evento Alheio' },
        },
      ],
      arquivados: [],
      flash: {},
    })
    expect(html).toContain('Somente leitura')
    expect(html).not.toContain('Editar')
    expect(html).not.toContain('Arquivar')
  })

  it('renderiza mensagem de nenhum tipo cadastrado', () => {
    const html = template({ tipos: [], arquivados: [], flash: {} })
    expect(html.replace(/\s+/g, ' ')).toContain(
      'Nenhum tipo de certificado cadastrado.',
    )
  })

  it('não renderiza flash na view (responsabilidade do layout)', () => {
    const html = template({
      tipos: [],
      arquivados: [],
      flash: { success: 'ok', error: 'fail' },
    })
    const $ = cheerio.load(html)
    expect($('.alert-success').length).toBe(0)
    expect($('.alert-danger').length).toBe(0)
  })

  it('renderiza seção de arquivados quando houver', () => {
    const html = template({
      tipos: [],
      arquivados: [
        { id: 2, codigo: 'B', descricao: 'Arq', numCertificados: 1 },
      ],
      flash: {},
    })
    expect(html).toContain('Arquivados (1)')
    expect(html).toContain('Restaurar')
    expect(html).toContain('Arq')
  })
})
