const fs = require('fs')
const path = require('path')

function parseMarkdownTableRows(content) {
  return content
    .split('\n')
    .filter((line) => line.trim().startsWith('|'))
    .filter((line) => !line.includes('---'))
    .slice(1)
    .map((line) => line.split('|').map((cell) => cell.trim()))
}

describe('Onda 0 - baseline por quíntuplo (unit)', () => {
  const baselinePath = path.resolve(
    __dirname,
    '../../docs/auditorias/07/baseline-operacoes-quintuplo.md',
  )

  test('deve conter operações P1 mínimas e cobertura inicial de quíntuplos', () => {
    const content = fs.readFileSync(baselinePath, 'utf-8')

    expect(content).toContain('# Baseline por Operação (Quíntuplo) - Onda 0')
    expect(content).toContain('## Quíntuplos Prioritários P1')

    const rows = parseMarkdownTableRows(content)
    const operationKeys = rows.map((row) => row[1]).filter(Boolean)

    expect(operationKeys.length).toBeGreaterThanOrEqual(20)
    expect(operationKeys).toContain('cert.create')
    expect(operationKeys).toContain('cert.restore')
    expect(operationKeys).toContain('participante.list')
    expect(operationKeys).toContain('tipo.create')
    expect(operationKeys).toContain('evento.delete')
  })

  test('deve registrar pelo menos um caso equivalente e um não equivalente', () => {
    const content = fs.readFileSync(baselinePath, 'utf-8')

    expect(content).toContain('equivalente')
    expect(content).toContain('nao_equivalente')
  })
})
