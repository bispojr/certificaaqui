const { test, expect } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

test('UC-ACB-01 — matriz de conformidade inicial deve existir e conter baseline P1', async () => {
  const matrixPath = path.resolve(
    __dirname,
    '../../docs/auditorias/07/matriz-conformidade-autorizacao-escopo.md',
  )

  const content = fs.readFileSync(matrixPath, 'utf-8')

  expect(content).toContain(
    '# Matriz de Conformidade Inicial - Autorização e Escopo (Onda 0)',
  )
  expect(content).toContain('## Matriz por operação P1')
  expect(content).toContain('cert.restore')
  expect(content).toContain('evento.create')
  expect(content).toContain('participante.list')

  expect(content).toContain('- conforme: 0')
  expect(content).toContain('- nao_conforme: 25')
  expect(content).toContain('- excecao_formal: 0')
})
