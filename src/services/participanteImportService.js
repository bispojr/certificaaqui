const { Participante } = require('../../src/models')
const participanteService = require('./participanteService')
const participanteSchema = require('../validators/participante')

function splitDelimitedLine(line, delimiter) {
  const values = []
  let current = ''
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]

    if (character === '"') {
      const nextCharacter = line[index + 1]
      if (insideQuotes && nextCharacter === '"') {
        current += '"'
        index += 1
        continue
      }
      insideQuotes = !insideQuotes
      continue
    }

    if (!insideQuotes && character === delimiter) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += character
  }

  values.push(current.trim())
  return values
}

function formatValidationErrors(error) {
  return error.issues.map((issue) => {
    const field = issue.path[0]

    if (field === 'email') return 'email inválido'
    if (field === 'nomeCompleto') return 'nomeCompleto inválido'
    return issue.message
  })
}

function parseLines(rawContent, origem) {
  const delimiter = origem === 'csv' ? ',' : '\t'
  const rawLines = rawContent.split(/\r?\n/)
  const nonEmptyLines = rawLines.filter((line) => line.trim() !== '')

  if (nonEmptyLines.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = splitDelimitedLine(nonEmptyLines[0], delimiter).map((value) =>
    value.trim(),
  )

  const rows = nonEmptyLines.slice(1).map((line) => {
    const values = splitDelimitedLine(line, delimiter)
    const row = {}

    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })

    return row
  })

  return { headers, rows }
}

async function importarParticipantes({
  eventoId,
  origem,
  conteudo,
  arquivoCsv,
  principal = null,
  eventoIds = null,
} = {}) {
  const rawContent = origem === 'csv' ? arquivoCsv : conteudo

  if (!eventoId) {
    throw new Error('eventoId é obrigatório')
  }

  if (!['colado', 'csv'].includes(origem)) {
    throw new Error('origem inválida')
  }

  if (!rawContent || rawContent.trim() === '') {
    throw new Error('conteúdo de importação é obrigatório')
  }

  const { rows } = parseLines(rawContent, origem)

  let criados = 0
  let vinculosCriados = 0
  let falhas = 0
  const errosPorLinha = []

  for (const [index, row] of rows.entries()) {
    const numeroLinha = index + 1
    const validation = participanteSchema.safeParse({
      nomeCompleto: row.nomeCompleto ?? row.nome_completo,
      email: row.email,
      instituicao: row.instituicao,
    })

    if (!validation.success) {
      falhas += 1
      errosPorLinha.push({
        numeroLinha,
        nomeCompleto: row.nomeCompleto ?? row.nome_completo ?? '',
        email: row.email ?? '',
        instituicao: row.instituicao ?? '',
        status: 'invalida',
        erros: formatValidationErrors(validation.error),
      })
      continue
    }

    const dadosNormalizados = validation.data
    const participanteExistente = await Participante.findOne({
      where: { email: dadosNormalizados.email },
      paranoid: false,
    })

    if (participanteExistente) {
      vinculosCriados += 1
      continue
    }

    await participanteService.create(
      {
        ...dadosNormalizados,
        evento_id: eventoId,
      },
      {
        principal,
        eventoIds,
      },
    )

    criados += 1
  }

  return {
    totalLinhas: rows.length,
    linhasProcessadas: rows.length,
    criados,
    vinculosCriados,
    falhas,
    errosPorLinha,
  }
}

module.exports = {
  importarParticipantes,
  splitDelimitedLine,
  parseLines,
  formatValidationErrors,
}
