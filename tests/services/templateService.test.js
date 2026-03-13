const templateService = require('../../src/services/templateService')

describe('templateService.interpolate', () => {
  it('substitui chaves por valores', () => {
    const texto = 'Olá, {{nome}}! Seu código é {{codigo}}.'
    const valores = { nome: 'João', codigo: 'ABC123' }
    const result = templateService.interpolate(texto, valores)
    expect(result).toBe('Olá, João! Seu código é ABC123.')
  })

  it('mantém chaves sem valor', () => {
    const texto = 'Olá, {{nome}}! Seu código é {{codigo}}.'
    const valores = { nome: 'João' }
    const result = templateService.interpolate(texto, valores)
    expect(result).toBe('Olá, João! Seu código é {{codigo}}.')
  })

  it('funciona com texto sem chaves', () => {
    const texto = 'Sem variáveis aqui.'
    const valores = { nome: 'João' }
    const result = templateService.interpolate(texto, valores)
    expect(result).toBe('Sem variáveis aqui.')
  })
})
