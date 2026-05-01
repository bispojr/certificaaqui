const senhaForteSchema = require('../../src/validators/senhaForte')

describe('senhaForteSchema', () => {
  const senhasValidas = [
    'Abc@1234',
    'M1nha!Senha',
    'Segur@nc4',
    'P@ssw0rd!',
    'Complexa#2026',
  ]

  const senhasInvalidas = [
    { valor: 'Ab1!', motivo: 'menos de 8 caracteres' },
    { valor: 'SEMPEQUENA1!', motivo: 'sem letra minúscula' },
    { valor: 'semmaiuscula1!', motivo: 'sem maiúscula' },
    { valor: 'SemNumero!abc', motivo: 'sem número' },
    { valor: 'SemEspecial1abc', motivo: 'sem especial' },
    { valor: 'abcdefgh', motivo: 'só letras minúsculas' },
    { valor: '12345678', motivo: 'só números' },
    { valor: '', motivo: 'vazia' },
  ]

  it.each(senhasValidas)('aceita senha válida: %s', (senha) => {
    const resultado = senhaForteSchema.safeParse(senha)
    expect(resultado.success).toBe(true)
  })

  it.each(senhasInvalidas)(
    'rejeita senha inválida ($valor): $motivo',
    ({ valor }) => {
      const resultado = senhaForteSchema.safeParse(valor)
      expect(resultado.success).toBe(false)
    },
  )

  it('retorna mensagem de erro para senha sem maiúscula', () => {
    const resultado = senhaForteSchema.safeParse('minhasemnum1!')
    expect(resultado.success).toBe(false)
    const mensagens = resultado.error.errors.map((e) => e.message)
    expect(mensagens.some((m) => /maiúscula/i.test(m))).toBe(true)
  })

  it('retorna mensagem de erro para senha sem especial', () => {
    const resultado = senhaForteSchema.safeParse('SemEspecial1')
    expect(resultado.success).toBe(false)
    const mensagens = resultado.error.errors.map((e) => e.message)
    expect(mensagens.some((m) => /especial/i.test(m))).toBe(true)
  })

  it('retorna mensagem de erro para senha muito curta', () => {
    const resultado = senhaForteSchema.safeParse('Ab1!')
    expect(resultado.success).toBe(false)
    const mensagens = resultado.error.errors.map((e) => e.message)
    expect(mensagens.some((m) => /mínimo 8/i.test(m))).toBe(true)
  })
})
