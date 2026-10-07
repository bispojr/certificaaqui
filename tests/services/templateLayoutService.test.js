const {
  resolveTemplateConfig,
  getTemplateName,
  getBlockConfig,
} = require('../../src/services/templateLayoutService')

describe('templateLayoutService', () => {
  it('resolveTemplateConfig usa o template padrao por default', () => {
    const config = resolveTemplateConfig({})

    expect(config.template).toBe('padrao')
    expect(config.blocks.texto_base.x).toBe(270)
    expect(config.blocks.texto_base.y).toBe(200)
    expect(config.blocks.validacao.x).toBe(145)
  })

  it('resolveTemplateConfig aplica override do template_config do evento', () => {
    const config = resolveTemplateConfig({
      template_certificado: 'padrao',
      template_config: {
        texto_base: {
          x: 120,
          y: 180,
          fontSize: 16,
        },
      },
    })

    expect(config.blocks.texto_base.x).toBe(120)
    expect(config.blocks.texto_base.y).toBe(180)
    expect(config.blocks.texto_base.fontSize).toBe(16)
  })

  it('resolveTemplateConfig para nome-destaque centraliza o nome do participante', () => {
    const config = resolveTemplateConfig({
      template_certificado: 'nome-destaque',
    })

    expect(config.template).toBe('nome-destaque')
    expect(config.blocks.nome.align).toBe('center')
    expect(config.blocks.nome.fontSize).toBeGreaterThan(
      config.blocks.texto_base.fontSize,
    )
  })

  it('getTemplateName retorna padrao quando o campo é nulo ou ausente', () => {
    expect(getTemplateName({})).toBe('padrao')
    expect(getTemplateName({ template_certificado: null })).toBe('padrao')
  })

  it('getBlockConfig retorna bloco final com fallback e sobrescrita', () => {
    const event = {
      template_certificado: 'nome-destaque',
      template_config: {
        nome: {
          x: 15,
        },
      },
    }

    const block = getBlockConfig(event, 'nome')
    expect(block.x).toBe(15)
    expect(block.align).toBe('center')
    expect(block.fontWeight).toBe('bold')
  })
})
