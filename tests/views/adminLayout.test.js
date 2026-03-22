const hbs = require('hbs')
const path = require('path')
const fs = require('fs')

describe('views/layouts/admin.hbs', () => {
  it('deve renderizar navbar administrativa completa para admin', () => {
    const layoutPath = path.join(__dirname, '../../views/layouts/admin.hbs')
    const source = fs.readFileSync(layoutPath, 'utf8')
    const template = hbs.handlebars.compile(source)
    const html = template({
      title: 'Painel',
      usuario: { nome: 'Admin', perfil: 'admin', isAdmin: true },
      flash: {},
      body: '<div>Conteúdo do painel</div>',
    })
    // Confirma Bootstrap 5
    expect(html).toMatch(
      /https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap@5\.3\.3\/dist\/css\/bootstrap\.min\.css/,
    )
    // Confirma navbar admin
    expect(html).toMatch(/Certifique-me Admin/)
    expect(html).toMatch(/Dashboard/)
    expect(html).toMatch(/Certificados/)
    expect(html).toMatch(/Participantes/)
    expect(html).toMatch(/Eventos/)
    expect(html).toMatch(/Tipos/)
    expect(html).toMatch(/Usuários/)
    // Confirma usuário e perfil
    // Aceita quebras de linha e espaços entre nome e perfil
    expect(html).toMatch(/Admin[\s\S]*\(admin\)/)
    // Confirma botão de logout (aceita atributos extras)
    expect(html).toMatch(
      /<form[^>]+action=['\"]?\/auth\/logout['\"]?[^>]*method=['\"]?POST['\"]?[^>]*>/,
    )
    // Confirma slot body
    expect(html).toMatch(/Conteúdo do painel/)
  })
})
