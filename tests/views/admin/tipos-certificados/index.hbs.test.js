const fs = require('fs')
const path = require('path')
const Handlebars = require('handlebars')

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

  it('renderiza mensagem de nenhum tipo cadastrado', () => {
    const html = template({ tipos: [], arquivados: [], flash: {} })
    expect(html).toContain('Nenhum tipo de certificado cadastrado.')
  })

  it('renderiza flash de sucesso e erro', () => {
    const html = template({
      tipos: [],
      arquivados: [],
      flash: { success: 'ok', error: 'fail' },
    })
    expect(html).toContain('alert alert-success')
    expect(html).toContain('ok')
    expect(html).toContain('alert alert-danger')
    expect(html).toContain('fail')
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
