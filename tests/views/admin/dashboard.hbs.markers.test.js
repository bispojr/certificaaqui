const path = require('path')
const fs = require('fs')
const hbs = require('hbs')
require('../../../hbs-helpers')

describe('View: admin/dashboard.hbs — marcadores e estrutura', () => {
  let render
  beforeAll(() => {
    render = (context) => {
      const templatePath = path.join(process.cwd(), 'views/admin/dashboard.hbs')
      const template = fs.readFileSync(templatePath, 'utf8')
      const compiled = hbs.handlebars.compile(template)
      return compiled(context)
    }
  })

  it('deve conter o marcador data-testid na raiz', () => {
    const html = render({ usuario: { isAdmin: true } })
    expect(html).toMatch(/<div[^>]+data-testid="admin-dashboard-root"/)
  })

  it('deve exibir seções de domínio corretamente para admin', () => {
    const html = render({
      usuario: { isAdmin: true },
      totalEventos: 1,
      totalTipos: 1,
      totalParticipantes: 1,
      totalUsuarios: 1,
    })
    expect(html).toMatch(/Certificação/)
    expect(html).toMatch(/Eventos/)
    expect(html).toMatch(/Administração/)
  })

  it('deve exibir seções corretas para gestor', () => {
    const html = render({
      usuario: { isGestor: true },
      totalEventos: 1,
      totalTipos: 1,
      totalParticipantes: 1,
    })
    expect(html).toMatch(/Certificação/)
    expect(html).toMatch(/Eventos/)
    expect(html).not.toMatch(/Usuários/)
  })

  it('deve exibir seções corretas para monitor', () => {
    const html = render({
      usuario: { isMonitor: true },
      totalEventos: 1,
      totalParticipantes: 1,
    })
    expect(html).toMatch(/Certificação/)
    expect(html).toMatch(/Eventos/)
    expect(html).not.toMatch(/Tipos/)
    expect(html).not.toMatch(/Usuários/)
  })
})
