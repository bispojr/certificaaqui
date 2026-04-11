const usuarioSSRController = require('../../src/controllers/usuarioSSRController')
const { Usuario, Evento } = require('../../src/models')
const httpMocks = require('node-mocks-http')
const { Op } = require('sequelize')

jest.mock('../../src/models')

function mockRes() {
  const res = httpMocks.createResponse()
  res.render = jest.fn()
  res.redirect = jest.fn()
  return res
}

describe('usuarioSSRController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  describe('index', () => {
    it('deve renderizar usuários ativos e arquivados', async () => {
      Usuario.findAll = jest
        .fn()
        .mockResolvedValueOnce([{ id: 1 }])
        .mockResolvedValueOnce([{ id: 2 }])
      const req = httpMocks.createRequest()
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.index(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'admin/usuarios/index',
        expect.objectContaining({
          usuarios: [{ id: 1 }],
          arquivados: [{ id: 2 }],
        }),
      )
    })
    it('deve redirecionar e setar flash em caso de erro', async () => {
      Usuario.findAll = jest.fn().mockRejectedValue(new Error('erro'))
      const req = httpMocks.createRequest()
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.index(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'erro')
      expect(res.redirect).toHaveBeenCalledWith('/admin/usuarios')
    })
  })

  describe('novo', () => {
    it('deve renderizar form com usuario null e eventos', async () => {
      Evento.findAll = jest.fn().mockResolvedValue([
        {
          id: 1,
          nome: 'E1',
          toJSON() {
            return { id: 1, nome: 'E1' }
          },
        },
      ])
      const req = httpMocks.createRequest()
      const res = mockRes()
      await usuarioSSRController.novo(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'admin/usuarios/form',
        expect.objectContaining({
          usuario: null,
          eventos: expect.arrayContaining([
            expect.objectContaining({ id: 1, nome: 'E1' }),
          ]),
        }),
      )
    })
  })

  describe('editar', () => {
    it('deve renderizar form com usuario e eventoIds', async () => {
      Usuario.findByPk = jest.fn().mockResolvedValue({
        toJSON: () => ({ id: 1, eventos: [{ id: 10 }, { id: 20 }] }),
        eventos: [{ id: 10 }, { id: 20 }],
      })
      Evento.findAll = jest.fn().mockResolvedValue([
        {
          id: 1,
          nome: 'E1',
          toJSON() {
            return { id: 1, nome: 'E1' }
          },
        },
      ])
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.editar(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'admin/usuarios/form',
        expect.objectContaining({
          usuario: expect.objectContaining({ id: 1, eventoIds: [10, 20] }),
          eventos: expect.arrayContaining([
            expect.objectContaining({ id: 1, nome: 'E1' }),
          ]),
        }),
      )
    })
    it('deve redirecionar se usuario não encontrado', async () => {
      Usuario.findByPk = jest.fn().mockResolvedValue(null)
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.editar(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'Usuário não encontrado.')
      expect(res.redirect).toHaveBeenCalledWith('/admin/usuarios')
    })
    it('deve redirecionar em caso de erro', async () => {
      Usuario.findByPk = jest.fn().mockRejectedValue(new Error('erro'))
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.editar(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'erro')
      expect(res.redirect).toHaveBeenCalledWith('/admin/usuarios')
    })
  })

  describe('criar', () => {
    it('deve criar usuario, setar eventos e redirecionar', async () => {
      Usuario.create = jest.fn().mockResolvedValue({ setEventos: jest.fn() })
      const req = httpMocks.createRequest({
        body: {
          nome: 'A',
          email: 'a@a.com',
          senha: '123',
          perfil: 'admin',
          eventos: [1, 2],
        },
      })
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.criar(req, res)
      expect(Usuario.create).toHaveBeenCalledWith({
        nome: 'A',
        email: 'a@a.com',
        senha: '123',
        perfil: 'admin',
      })
      expect(req.flash).toHaveBeenCalledWith(
        'success',
        'Usuário criado com sucesso.',
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/usuarios')
    })
    it('deve redirecionar para novo em caso de erro', async () => {
      Usuario.create = jest.fn().mockRejectedValue(new Error('erro'))
      const req = httpMocks.createRequest({ body: {} })
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.criar(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'erro')
      expect(res.redirect).toHaveBeenCalledWith('/admin/usuarios/novo')
    })
  })

  describe('atualizar', () => {
    it('deve atualizar usuario, setar eventos e redirecionar', async () => {
      const usuario = { update: jest.fn(), setEventos: jest.fn() }
      Usuario.findByPk = jest.fn().mockResolvedValue(usuario)
      const req = httpMocks.createRequest({
        params: { id: 1 },
        body: {
          nome: 'A',
          email: 'a@a.com',
          senha: '123',
          perfil: 'admin',
          eventos: [1, 2],
        },
      })
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.atualizar(req, res)
      expect(usuario.update).toHaveBeenCalledWith({
        nome: 'A',
        email: 'a@a.com',
        perfil: 'admin',
        senha: '123',
      })
      expect(usuario.setEventos).toHaveBeenCalled()
      expect(req.flash).toHaveBeenCalledWith(
        'success',
        'Usuário atualizado com sucesso.',
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/usuarios')
    })
    it('não inclui senha se campo vazio', async () => {
      const usuario = { update: jest.fn(), setEventos: jest.fn() }
      Usuario.findByPk = jest.fn().mockResolvedValue(usuario)
      const req = httpMocks.createRequest({
        params: { id: 1 },
        body: {
          nome: 'A',
          email: 'a@a.com',
          senha: '',
          perfil: 'admin',
          eventos: [1, 2],
        },
      })
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.atualizar(req, res)
      expect(usuario.update).toHaveBeenCalledWith({
        nome: 'A',
        email: 'a@a.com',
        perfil: 'admin',
      })
    })
    it('deve redirecionar se usuario não encontrado', async () => {
      Usuario.findByPk = jest.fn().mockResolvedValue(null)
      const req = httpMocks.createRequest({ params: { id: 1 }, body: {} })
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.atualizar(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'Usuário não encontrado.')
      expect(res.redirect).toHaveBeenCalledWith('/admin/usuarios')
    })
    it('deve redirecionar para editar em caso de erro', async () => {
      Usuario.findByPk = jest.fn().mockRejectedValue(new Error('erro'))
      const req = httpMocks.createRequest({ params: { id: 1 }, body: {} })
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.atualizar(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'erro')
      expect(res.redirect).toHaveBeenCalledWith('/admin/usuarios/1/editar')
    })
  })

  describe('deletar', () => {
    it('deve deletar usuario e redirecionar', async () => {
      const usuario = { destroy: jest.fn() }
      Usuario.findByPk = jest.fn().mockResolvedValue(usuario)
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.deletar(req, res)
      expect(usuario.destroy).toHaveBeenCalled()
      expect(req.flash).toHaveBeenCalledWith('success', 'Usuário arquivado.')
      expect(res.redirect).toHaveBeenCalledWith('/admin/usuarios')
    })
    it('deve redirecionar se usuario não encontrado', async () => {
      Usuario.findByPk = jest.fn().mockResolvedValue(null)
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.deletar(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'Usuário não encontrado.')
      expect(res.redirect).toHaveBeenCalledWith('/admin/usuarios')
    })
    it('deve redirecionar em caso de erro', async () => {
      Usuario.findByPk = jest.fn().mockRejectedValue(new Error('erro'))
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.deletar(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'erro')
      expect(res.redirect).toHaveBeenCalledWith('/admin/usuarios')
    })
  })

  describe('restaurar', () => {
    it('deve restaurar usuario e redirecionar', async () => {
      const usuario = { restore: jest.fn() }
      Usuario.findByPk = jest.fn().mockResolvedValue(usuario)
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.restaurar(req, res)
      expect(usuario.restore).toHaveBeenCalled()
      expect(req.flash).toHaveBeenCalledWith('success', 'Usuário restaurado.')
      expect(res.redirect).toHaveBeenCalledWith('/admin/usuarios')
    })
    it('deve redirecionar se usuario não encontrado', async () => {
      Usuario.findByPk = jest.fn().mockResolvedValue(null)
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.restaurar(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'Usuário não encontrado.')
      expect(res.redirect).toHaveBeenCalledWith('/admin/usuarios')
    })
    it('deve redirecionar em caso de erro', async () => {
      Usuario.findByPk = jest.fn().mockRejectedValue(new Error('erro'))
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      const res = mockRes()
      await usuarioSSRController.restaurar(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'erro')
      expect(res.redirect).toHaveBeenCalledWith('/admin/usuarios')
    })
  })
})
