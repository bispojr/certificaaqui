const path = require('path')
const fs = require('fs')
const handlebars = require('handlebars')

// Helper 'or' para uso em templates (equivalente ao usado no projeto)
handlebars.registerHelper('or', function() {
  // Remove o último argumento (options)
  const args = Array.prototype.slice.call(arguments, 0, -1)
  return args.some(Boolean)
})
const cheerio = require('cheerio')

describe('View: admin/dashboard.hbs com resourceMeta', () => {
  let template
  beforeAll(() => {
    const filePath = path.join(__dirname, '../../views/admin/dashboard.hbs')
    const source = fs.readFileSync(filePath, 'utf8')
    template = handlebars.compile(source)
  })

  it('renderiza ícones e labels dos grupos e recursos conforme resourceMeta', () => {
    const resourceMeta = {
      grupos: {
        certificacao: { icon: 'fa-certificate', label: 'Certificação' },
        eventos: { icon: 'fa-calendar-days', label: 'Eventos' },
        administracao: { icon: 'fa-user-shield', label: 'Administração' }
      },
      eventos: { icon: 'fa-calendar-alt', label: 'Eventos' },
      participantes: { icon: 'fa-user-graduate', label: 'Participantes' },
      certificados: { icon: 'fa-certificate', label: 'Certificados' },
      tiposCertificados: { icon: 'fa-layer-group', label: 'Tipos de Certificado' },
      usuarios: { icon: 'fa-users-cog', label: 'Usuários' }
    }
    const html = template({
      resourceMeta,
      totalEventos: 1,
      totalTipos: 2,
      totalParticipantes: 3,
      totalUsuarios: 4,
      totalCertificados: 5,
      totalCertificadosPendentes: 6,
      usuario: { isAdmin: true, isGestor: true }
    })
    const $ = cheerio.load(html)
    // Grupos
    expect($('h5 i.fa-certificate').length).toBeGreaterThan(0)
    expect($('h5').text()).toMatch(/Certificação/)
    expect($('h5 i.fa-calendar-days').length).toBeGreaterThan(0)
    expect($('h5').text()).toMatch(/Eventos/)
    expect($('h5 i.fa-user-shield').length).toBeGreaterThan(0)
    expect($('h5').text()).toMatch(/Administração/)
    // Recursos
    expect($('i.fa-calendar-alt.card-icon').length).toBeGreaterThan(0)
    expect($('i.fa-user-graduate.card-icon').length).toBeGreaterThan(0)
    expect($('i.fa-certificate.card-icon').length).toBeGreaterThan(0)
    expect($('i.fa-layer-group.card-icon').length).toBeGreaterThan(0)
    expect($('i.fa-users-cog.card-icon').length).toBeGreaterThan(0)
  })
})
