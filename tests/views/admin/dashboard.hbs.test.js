const path = require('path')
const fs = require('fs')
const hbs = require('hbs')
require('../../../hbs-helpers')

describe('View: admin/dashboard.hbs', () => {
  let render
  beforeAll(() => {
    render = (context) => {
      const templatePath = path.join(process.cwd(), 'views/admin/dashboard.hbs')
      const template = fs.readFileSync(templatePath, 'utf8')
      const compiled = hbs.handlebars.compile(template)
      return compiled(context)
    }
  })

  it('deve renderizar cards corretos para admin', () => {
    const html = render({
      usuario: { isAdmin: true, nome: 'Admin', perfil: 'admin' },
      totalEventos: 2,
      totalTipos: 4,
      totalParticipantes: 10,
      totalUsuarios: 3,
    })
    expect(html).toMatch(/Eventos/)
    expect(html).toMatch(/Tipos/)
    expect(html).toMatch(/Participantes/)
    expect(html).toMatch(/Usuários/)
    expect(html).toMatch(/2/)
    expect(html).toMatch(/4/)
    expect(html).toMatch(/10/)
    expect(html).toMatch(/3/)
  })

  it('deve renderizar cards corretos para gestor', () => {
    const html = render({
      usuario: { isGestor: true, nome: 'Gestor', perfil: 'gestor' },
      totalCertificados: 2,
      totalParticipantes: 7,
    })
    expect(html).toMatch(/Certificados/)
    expect(html).toMatch(/Participantes/)
    expect(html).toMatch(/Eventos/)
    expect(html).not.toMatch(/Usuários/)
    expect(html).toMatch(/2/)
    expect(html).toMatch(/7/)
  })

  it('deve renderizar cards corretos para monitor', () => {
    const html = render({
      usuario: { isMonitor: true, nome: 'Monitor', perfil: 'monitor' },
      totalCertificados: 1,
      totalParticipantes: 4,
    })
    expect(html).toMatch(/Certificados/)
    expect(html).toMatch(/Participantes/)
    expect(html).toMatch(/Eventos/)
    expect(html).not.toMatch(/Usuários/)
    expect(html).toMatch(/1/)
    expect(html).toMatch(/4/)
  })
})
