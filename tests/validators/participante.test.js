const participanteSchema = require('../../src/validators/participante')

describe('Validação Zod - Participante', () => {
  it('valida um participante válido', () => {
    const data = {
      nomeCompleto: 'João Silva',
      email: 'joao@email.com',
      instituicao: 'Universidade'
    }
    expect(() => participanteSchema.parse(data)).not.toThrow()
  })

  it('rejeita participante com email inválido', () => {
    const data = {
      nomeCompleto: 'João Silva',
      email: 'email-invalido',
      instituicao: 'Universidade'
    }
    expect(() => participanteSchema.parse(data)).toThrow()
  })

  it('rejeita participante com nome curto', () => {
    const data = {
      nomeCompleto: 'Jo',
      email: 'joao@email.com',
      instituicao: 'Universidade'
    }
    expect(() => participanteSchema.parse(data)).toThrow()
  })
})
