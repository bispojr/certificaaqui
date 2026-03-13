const { Usuario, sequelize } = require('../../src/models')
const bcrypt = require('bcryptjs')

describe('Usuario Model', () => {
  beforeEach(async () => {
    await Usuario.destroy({ where: {}, force: true })
  })

  test('deve criar usuario com dados válidos e hash de senha', async () => {
    const usuario = await Usuario.create({
      nome: 'Admin',
      email: 'admin@email.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    expect(usuario.nome).toBe('Admin')
    expect(usuario.email).toBe('admin@email.com')
    expect(usuario.perfil).toBe('admin')
    expect(usuario.senha).not.toBe('senha123')
    expect(await bcrypt.compare('senha123', usuario.senha)).toBe(true)
  })

  test('não deve criar usuario sem email', async () => {
    await expect(
      Usuario.create({
        nome: 'Sem Email',
        senha: 'senha123',
        perfil: 'admin',
      }),
    ).rejects.toThrow()
  })

  test('não deve criar usuario com email inválido', async () => {
    await expect(
      Usuario.create({
        nome: 'Invalido',
        email: 'email_invalido',
        senha: 'senha123',
        perfil: 'admin',
      }),
    ).rejects.toThrow()
  })

  test('não deve criar usuario com perfil inválido', async () => {
    await expect(
      Usuario.create({
        nome: 'Perfil Errado',
        email: 'perfil@email.com',
        senha: 'senha123',
        perfil: 'superuser',
      }),
    ).rejects.toThrow()
  })

  test('não deve criar usuario sem senha', async () => {
    await expect(
      Usuario.create({
        nome: 'Sem Senha',
        email: 'sem@senha.com',
        perfil: 'admin',
      }),
    ).rejects.toThrow()
  })

  test('não deve criar usuario com email duplicado', async () => {
    await Usuario.create({
      nome: 'Primeiro',
      email: 'dup@email.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    await expect(
      Usuario.create({
        nome: 'Segundo',
        email: 'dup@email.com',
        senha: 'senha456',
        perfil: 'admin',
      }),
    ).rejects.toThrow()
  })

  test('deve atualizar senha e gerar novo hash', async () => {
    const usuario = await Usuario.create({
      nome: 'Update',
      email: 'update@email.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    usuario.senha = 'novaSenha'
    await usuario.save()
    expect(await bcrypt.compare('novaSenha', usuario.senha)).toBe(true)
  })

  test('soft delete deve funcionar', async () => {
    const usuario = await Usuario.create({
      nome: 'Deletar',
      email: 'del@email.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    await usuario.destroy()
    const found = await Usuario.findByPk(usuario.id)
    expect(found).toBeNull()
    const deleted = await Usuario.findOne({
      where: { id: usuario.id },
      paranoid: false,
    })
    expect(deleted).not.toBeNull()
    expect(deleted.deleted_at).not.toBeNull()
  })

  test('deve permitir restaurar usuario deletado', async () => {
    const usuario = await Usuario.create({
      nome: 'Restaurar',
      email: 'rest@email.com',
      senha: 'senha123',
      perfil: 'admin',
    })
    await usuario.destroy()
    await usuario.restore()
    const restored = await Usuario.findByPk(usuario.id)
    expect(restored).not.toBeNull()
    expect(restored.deleted_at).toBeNull()
  })
})
