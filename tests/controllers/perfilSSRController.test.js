const perfilSSRController = require('../../src/controllers/perfilSSRController')
const { Usuario } = require('../../src/models')
const bcrypt = require('bcryptjs')
const httpMocks = require('node-mocks-http')

jest.mock('../../src/models')
jest.mock('bcryptjs')

function mockRes() {
  const res = httpMocks.createResponse()
  res.render = jest.fn()
  res.redirect = jest.fn()
  return res
}

function mockReq(overrides = {}) {
  const req = httpMocks.createRequest()
  req.flash = jest.fn()
  req.usuario = { id: 1, nome: 'Test', perfil: 'admin' }
  return Object.assign(req, overrides)
}

describe('perfilSSRController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('formulario', () => {
    it('deve renderizar a view alterar-senha', async () => {
      const req = mockReq()
      const res = mockRes()
      await perfilSSRController.formulario(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'admin/perfil/alterar-senha',
        expect.objectContaining({
          layout: 'layouts/admin',
          title: 'Alterar Senha',
        }),
      )
    })
  })

  describe('alterarSenha', () => {
    it('deve redirecionar com erro quando novaSenha e confirmarSenha não coincidem', async () => {
      const req = mockReq({
        body: {
          senhaAtual: 'Atual@123',
          novaSenha: 'Nova@1234',
          confirmarSenha: 'Outra@999',
        },
      })
      const res = mockRes()
      await perfilSSRController.alterarSenha(req, res)
      expect(req.flash).toHaveBeenCalledWith(
        'error',
        expect.stringMatching(/coincidem/i),
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/perfil/alterar-senha')
    })

    it('deve redirecionar com erro quando nova senha é fraca', async () => {
      const req = mockReq({
        body: {
          senhaAtual: 'Atual@123',
          novaSenha: 'fraca',
          confirmarSenha: 'fraca',
        },
      })
      const res = mockRes()
      await perfilSSRController.alterarSenha(req, res)
      expect(req.flash).toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('/admin/perfil/alterar-senha')
    })

    it('deve redirecionar com erro quando usuário não é encontrado', async () => {
      Usuario.findByPk = jest.fn().mockResolvedValue(null)
      const req = mockReq({
        body: {
          senhaAtual: 'Atual@123',
          novaSenha: 'Nova@1234!',
          confirmarSenha: 'Nova@1234!',
        },
      })
      const res = mockRes()
      await perfilSSRController.alterarSenha(req, res)
      expect(req.flash).toHaveBeenCalledWith(
        'error',
        expect.stringMatching(/não encontrado/i),
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/perfil/alterar-senha')
    })

    it('deve redirecionar com erro quando senha atual está incorreta', async () => {
      Usuario.findByPk = jest
        .fn()
        .mockResolvedValue({ senha: 'hash', update: jest.fn() })
      bcrypt.compare = jest.fn().mockResolvedValue(false)
      const req = mockReq({
        body: {
          senhaAtual: 'Errada@1',
          novaSenha: 'Nova@1234!',
          confirmarSenha: 'Nova@1234!',
        },
      })
      const res = mockRes()
      await perfilSSRController.alterarSenha(req, res)
      expect(req.flash).toHaveBeenCalledWith(
        'error',
        expect.stringMatching(/incorreta/i),
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/perfil/alterar-senha')
    })

    it('deve atualizar a senha e redirecionar para dashboard quando tudo está correto', async () => {
      const updateMock = jest.fn().mockResolvedValue(true)
      Usuario.findByPk = jest
        .fn()
        .mockResolvedValue({ senha: 'hash', update: updateMock })
      bcrypt.compare = jest.fn().mockResolvedValue(true)
      const req = mockReq({
        body: {
          senhaAtual: 'Atual@123',
          novaSenha: 'Nova@1234!',
          confirmarSenha: 'Nova@1234!',
        },
      })
      const res = mockRes()
      await perfilSSRController.alterarSenha(req, res)
      expect(updateMock).toHaveBeenCalledWith({ senha: 'Nova@1234!' })
      expect(req.flash).toHaveBeenCalledWith(
        'success',
        expect.stringMatching(/sucesso/i),
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/dashboard')
    })

    it('deve redirecionar com erro em caso de exceção inesperada', async () => {
      Usuario.findByPk = jest.fn().mockRejectedValue(new Error('DB offline'))
      bcrypt.compare = jest.fn().mockResolvedValue(true)
      const req = mockReq({
        body: {
          senhaAtual: 'Atual@123',
          novaSenha: 'Nova@1234!',
          confirmarSenha: 'Nova@1234!',
        },
      })
      const res = mockRes()
      await perfilSSRController.alterarSenha(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'DB offline')
      expect(res.redirect).toHaveBeenCalledWith('/admin/perfil/alterar-senha')
    })
  })
})
