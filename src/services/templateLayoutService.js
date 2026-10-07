const DEFAULT_TEMPLATE = 'padrao'

const TEMPLATE_DEFINITIONS = {
  padrao: {
    nome: {
      x: 0,
      y: 0,
      width: 0,
      align: 'left',
      fontFamily: 'Lato-Medium',
      fontSize: 14,
      fontWeight: 'normal',
      color: '#111827',
      rotation: 0,
    },
    texto_base: {
      x: 270,
      y: 200,
      width: 480,
      align: 'justify',
      fontFamily: 'Lato-Medium',
      fontSize: 14,
      fontWeight: 'normal',
      color: '#111827',
      rotation: 0,
    },
    validacao: {
      x: 145,
      y: 545,
      width: 0,
      align: 'left',
      fontFamily: 'Lato-Medium',
      fontSize: 9.5,
      fontWeight: 'normal',
      color: '#111827',
      rotation: 0,
    },
  },
  'nome-destaque': {
    nome: {
      x: 0,
      y: 240,
      width: 595,
      align: 'center',
      fontFamily: 'Lato-Medium',
      fontSize: 28,
      fontWeight: 'bold',
      color: '#0f172a',
      rotation: 0,
    },
    texto_base: {
      x: 170,
      y: 330,
      width: 260,
      align: 'justify',
      fontFamily: 'Lato-Medium',
      fontSize: 14,
      fontWeight: 'normal',
      color: '#111827',
      rotation: 0,
    },
    validacao: {
      x: 145,
      y: 545,
      width: 0,
      align: 'left',
      fontFamily: 'Lato-Medium',
      fontSize: 9.5,
      fontWeight: 'normal',
      color: '#111827',
      rotation: 0,
    },
  },
}

function getTemplateName(evento = {}) {
  const template = evento.template_certificado || DEFAULT_TEMPLATE
  return template === 'padrao' || template === 'nome-destaque'
    ? template
    : DEFAULT_TEMPLATE
}

function mergeBlockConfig(baseBlock, userOverride = {}) {
  const sanitizedOverride = Object.fromEntries(
    Object.entries(userOverride).filter(([, value]) => value != null),
  )

  return {
    ...baseBlock,
    ...sanitizedOverride,
  }
}

function resolveTemplateConfig(evento = {}) {
  const template = getTemplateName(evento)
  const templateConfig = evento.template_config || {}
  const baseTemplate =
    TEMPLATE_DEFINITIONS[template] || TEMPLATE_DEFINITIONS[DEFAULT_TEMPLATE]

  const legacyOverrides = {
    texto_base: {
      x: evento.texto_x,
      y: evento.texto_y,
      fontSize: evento.texto_tamanho_fonte,
    },
    validacao: {
      x: evento.validacao_x,
      y: evento.validacao_y,
      rotation: evento.validacao_rotacao,
    },
  }

  const blocks = {}
  Object.keys(baseTemplate).forEach((blockKey) => {
    const baseBlock = baseTemplate[blockKey]
    const eventOverride = legacyOverrides[blockKey] || {}
    const override = templateConfig[blockKey] || {}
    blocks[blockKey] = mergeBlockConfig(baseBlock, {
      ...eventOverride,
      ...override,
    })
  })

  return {
    template,
    blocks,
  }
}

function getBlockConfig(evento = {}, blockName = 'texto_base') {
  const config = resolveTemplateConfig(evento)
  return config.blocks[blockName] || config.blocks.texto_base
}

module.exports = {
  DEFAULT_TEMPLATE,
  TEMPLATE_DEFINITIONS,
  getTemplateName,
  resolveTemplateConfig,
  getBlockConfig,
}
