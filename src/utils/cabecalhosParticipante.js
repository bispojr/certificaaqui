const CAMPOS_PARTICIPANTE = {
  nomeCompleto: {
    aliases: ['nomeCompleto', 'nome completo', 'nome'],
  },
  email: {
    aliases: ['email', 'e-mail', 'e mail'],
  },
  instituicao: {
    aliases: [
      'instituicao',
      'instituição',
      'instituição de ensino',
      'instituicao de ensino',
      'instituição/empresa',
      'instituicao/empresa',
    ],
  },
}

function normalizarCabecalho(valor) {
  if (typeof valor !== 'string') return ''
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function validarAliases(config) {
  const aliases = new Map()

  for (const [campo, { aliases: lista }] of Object.entries(config)) {
    for (const alias of lista) {
      const normalizado = normalizarCabecalho(alias)

      if (aliases.has(normalizado)) {
        throw new Error(
          `Alias "${alias}" está associado a mais de um campo: ${aliases.get(normalizado)} e ${campo}`,
        )
      }

      aliases.set(normalizado, campo)
    }
  }
}

validarAliases(CAMPOS_PARTICIPANTE)

const ALIAS_PARA_CAMPO = Object.entries(CAMPOS_PARTICIPANTE)
  .flatMap(([campo, config]) =>
    config.aliases.map((alias) => [normalizarCabecalho(alias), campo]),
  )
  .reduce((mapa, [alias, campo]) => {
    mapa[alias] = campo
    return mapa
  }, {})

function identificarCampo(cabecalho) {
  return ALIAS_PARA_CAMPO[normalizarCabecalho(cabecalho)] || null
}

module.exports = {
  CAMPOS_PARTICIPANTE,
  normalizarCabecalho,
  validarAliases,
  identificarCampo,
  ALIAS_PARA_CAMPO,
}

