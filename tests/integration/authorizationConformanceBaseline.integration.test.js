const fs = require('fs')
const path = require('path')

function parseTable(content) {
  return content
    .split('\n')
    .filter((line) => line.trim().startsWith('|'))
    .filter((line) => !line.includes('---'))
    .slice(1)
    .map((line) => {
      const cells = line.split('|').map((cell) => cell.trim())
      return {
        operationKey: cells[1],
        apiProfile: cells[7],
        ssrProfile: cells[8],
      }
    })
    .filter((row) => row.operationKey)
}

function parseOperationKeys(content, operationKeyColumnIndex) {
  return content
    .split('\n')
    .filter((line) => line.trim().startsWith('|'))
    .filter((line) => !line.includes('---'))
    .slice(1)
    .map(
      (line) =>
        line.split('|').map((cell) => cell.trim())[operationKeyColumnIndex],
    )
    .filter(Boolean)
}

describe('Onda 0 - equivalência API/SSR por quíntuplo (integration)', () => {
  const apiPath = path.resolve(
    __dirname,
    '../../docs/auditorias/07/baseline-operacoes-api.md',
  )
  const ssrPath = path.resolve(
    __dirname,
    '../../docs/auditorias/07/baseline-operacoes-ssr.md',
  )
  const quintuploPath = path.resolve(
    __dirname,
    '../../docs/auditorias/07/baseline-operacoes-quintuplo.md',
  )

  test('deve manter mapeamento coerente entre inventários API/SSR e baseline por quíntuplo', () => {
    const apiContent = fs.readFileSync(apiPath, 'utf-8')
    const ssrContent = fs.readFileSync(ssrPath, 'utf-8')
    const quintuploContent = fs.readFileSync(quintuploPath, 'utf-8')

    const apiOperationKeys = new Set(parseOperationKeys(apiContent, 1))
    const ssrOperationKeys = new Set(parseOperationKeys(ssrContent, 1))
    const quintuploRows = parseTable(quintuploContent)

    for (const row of quintuploRows) {
      if (row.operationKey === 'dashboard.view') {
        expect(ssrOperationKeys.has(row.operationKey)).toBe(true)
        continue
      }
      expect(apiOperationKeys.has(row.operationKey)).toBe(true)
      expect(ssrOperationKeys.has(row.operationKey)).toBe(true)
    }
  })

  test('deve evidenciar divergências críticas conhecidas de perfil mínimo', () => {
    const quintuploContent = fs.readFileSync(quintuploPath, 'utf-8')
    const rows = parseTable(quintuploContent)
    const byKey = Object.fromEntries(rows.map((row) => [row.operationKey, row]))

    expect(byKey['cert.restore'].apiProfile).toBe('monitor')
    expect(byKey['cert.restore'].ssrProfile).toBe('admin')

    expect(byKey['evento.delete'].apiProfile).toBe('monitor')
    expect(byKey['evento.delete'].ssrProfile).toBe('admin')

    expect(byKey['cert.create'].apiProfile).toBe('monitor')
    expect(byKey['cert.create'].ssrProfile).toBe('gestor')
  })
})
