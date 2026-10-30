const { Usuario } = require('../../src/models')
const onboardingService = require('../../src/services/adminOnboardingService')

jest.mock('../../src/models', () => ({
  Usuario: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}))

describe('adminOnboardingService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('existsAdmin', () => {
    it('retorna true quando já existe admin', async () => {
      Usuario.findOne.mockResolvedValue({ id: 1, perfil: 'admin' })

      await expect(onboardingService.existsAdmin()).resolves.toBe(true)
      expect(Usuario.findOne).toHaveBeenCalledWith({
        where: { perfil: 'admin' },
      })
    })

    it('retorna false quando não existe admin', async () => {
      Usuario.findOne.mockResolvedValue(null)

      await expect(onboardingService.existsAdmin()).resolves.toBe(false)
    })
  })

  describe('createFirstAdmin', () => {
    it('não cria quando já existe admin', async () => {
      Usuario.findOne.mockResolvedValueOnce({ id: 1, perfil: 'admin' })

      const result = await onboardingService.createFirstAdmin({
        nome: 'Admin',
        email: 'admin@test.com',
        senha: 'Senha@123',
      })

      expect(result).toEqual({
        created: false,
        reason: 'admin_exists',
        usuario: { id: 1, perfil: 'admin' },
      })
      expect(Usuario.create).not.toHaveBeenCalled()
    })

    it('não cria quando e-mail já está em uso', async () => {
      Usuario.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 99, email: 'admin@test.com' })

      const result = await onboardingService.createFirstAdmin({
        nome: 'Admin',
        email: 'admin@test.com',
        senha: 'Senha@123',
      })

      expect(result).toEqual({
        created: false,
        reason: 'email_in_use',
      })
      expect(Usuario.create).not.toHaveBeenCalled()
    })

    it('cria o primeiro admin quando não existe admin e nem e-mail duplicado', async () => {
      Usuario.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
      Usuario.create.mockResolvedValue({
        id: 1,
        nome: 'Primeiro Admin',
        email: 'primeiro@admin.com',
        perfil: 'admin',
      })

      const result = await onboardingService.createFirstAdmin({
        nome: 'Primeiro Admin',
        email: 'primeiro@admin.com',
        senha: 'Senha@123',
      })

      expect(Usuario.create).toHaveBeenCalledWith({
        nome: 'Primeiro Admin',
        email: 'primeiro@admin.com',
        senha: 'Senha@123',
        perfil: 'admin',
      })
      expect(result.created).toBe(true)
      expect(result.usuario).toMatchObject({
        id: 1,
        perfil: 'admin',
      })
    })

    it('trata corrida de criação retornando admin_exists após unique constraint', async () => {
      const uniqueError = new Error('duplicate key')
      uniqueError.name = 'SequelizeUniqueConstraintError'

      Usuario.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 7, perfil: 'admin' })
      Usuario.create.mockRejectedValue(uniqueError)

      const result = await onboardingService.createFirstAdmin({
        nome: 'Primeiro Admin',
        email: 'primeiro@admin.com',
        senha: 'Senha@123',
      })

      expect(result).toEqual({
        created: false,
        reason: 'admin_exists',
        usuario: { id: 7, perfil: 'admin' },
      })
    })
  })
})
