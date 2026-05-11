const fs = require('fs')
const path = require('path')

describe('views/auth/onboarding.hbs', () => {
  const viewPath = path.join(__dirname, '../../views/auth/onboarding.hbs')
  let html

  beforeAll(() => {
    html = fs.readFileSync(viewPath, 'utf8')
  })

  it('existe em views/auth/onboarding.hbs', () => {
    expect(fs.existsSync(viewPath)).toBe(true)
  })

  it("contém <form action='/onboarding' method='POST'>", () => {
    expect(html).toMatch(
      /<form[^>]+action=['"]?\/onboarding['"]?[^>]*method=['"]?POST['"]?/,
    )
  })

  it('contém os campos nome, email, senha e confirmarSenha', () => {
    expect(html).toMatch(/name=['"]nome['"]/)
    expect(html).toMatch(/name=['"]email['"]/)
    expect(html).toMatch(/name=['"]senha['"]/)
    expect(html).toMatch(/name=['"]confirmarSenha['"]/)
  })
})
