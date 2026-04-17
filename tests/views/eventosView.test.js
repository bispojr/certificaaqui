const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

describe('views/admin/eventos', () => {
  describe('index.hbs', () => {
    const viewPath = path.join(__dirname, '../../views/admin/eventos/index.hbs')
    let html
    beforeAll(() => {
      html = fs.readFileSync(viewPath, 'utf8')
    })
    it('exibe mensagem quando lista de eventos está vazia', () => {
      expect(html).toMatch(/{{else}}[\s\S]*Nenhum evento cadastrado\./)
    })
    it('botão Remover tem confirm()', () => {
      expect(html).toMatch(
        /onsubmit="return confirm\('Remover este evento\?'\)"/,
      )
    })
    it('seção de arquivados usa <details> e summary', () => {
      expect(html).toMatch(/<details[\s\S]*<summary[^>]*>Eventos arquivados/)
    })
    it('exibe coluna URL template base', () => {
      expect(html).toMatch(/<th>URL template base<\/th>/)
    })
    it('exibe valor da url_template_base se presente', () => {
      expect(html).toMatch(/{{#if url_template_base}}[\s\S]*{{url_template_base}}/)
    })
  })

  describe('form.hbs', () => {
    const viewPath = path.join(__dirname, '../../views/admin/eventos/form.hbs')
    let html
    beforeAll(() => {
      html = fs.readFileSync(viewPath, 'utf8')
    })
    it('campo codigo_base tem pattern e maxlength corretos', () => {
      expect(html).toMatch(/name='codigo_base'[\s\S]*pattern='\[A-Za-z\]\{3\}'/)
      expect(html).toMatch(/name='codigo_base'[\s\S]*maxlength='3'/)
    })
    it('campo texto_x existe no formulário', () => {
      expect(html).toMatch(/name='texto_x'/)
    })
    it('campo texto_y existe no formulário', () => {
      expect(html).toMatch(/name='texto_y'/)
    })
    it('campo validacao_x existe no formulário', () => {
      expect(html).toMatch(/name='validacao_x'/)
    })
    it('campo validacao_y existe no formulário', () => {
      expect(html).toMatch(/name='validacao_y'/)
    })
    it('seção de posição do texto-base existe', () => {
      expect(html).toMatch(/Posição do texto-base no certificado/)
    })
    it('seção de posição da validação existe', () => {
      expect(html).toMatch(/Posição da validação no certificado/)
    })
  })
})
