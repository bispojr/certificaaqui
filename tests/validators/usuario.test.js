const usuarioSchema = require('../../src/validators/usuario')

describe('Validação Zod - Usuario', () => {
  it('valida um usuario válido', () => {
    const valido = {
      nome: 'Maria Silva',
      email: 'maria@email.com',
      senha: '123456',
      perfil: 'admin',
      evento_id: 1,
    }
    expect(() => usuarioSchema.parse(valido)).not.toThrow()
  })

  it('rejeita email inválido', () => {
    const invalido = {
      nome: 'João',
      email: 'joaoemail.com',
      senha: '123456',
      perfil: 'gestor',
    }
    expect(() => usuarioSchema.parse(invalido)).toThrow()
  })

  it('rejeita perfil inválido', () => {
    const invalido = {
      nome: 'Ana',
      email: 'ana@email.com',
      senha: '123456',
      perfil: 'visitante',
    }
    expect(() => usuarioSchema.parse(invalido)).toThrow()
  })

  it('rejeita senha curta', () => {
    const invalido = {
      nome: 'Carlos',
      email: 'carlos@email.com',
      senha: '123',
      perfil: 'monitor',
    }
    expect(() => usuarioSchema.parse(invalido)).toThrow()
  })

  it('aceita evento_id ausente ou nulo', () => {
    const semEvento = {
      nome: 'Paula',
      email: 'paula@email.com',
      senha: 'abcdef',
      perfil: 'monitor',
    }
    const eventoNulo = {
      nome: 'Paula',
      email: 'paula@email.com',
      senha: 'abcdef',
      perfil: 'monitor',
      evento_id: null,
    }
    expect(() => usuarioSchema.parse(semEvento)).not.toThrow()
    expect(() => usuarioSchema.parse(eventoNulo)).not.toThrow()
  })
})
