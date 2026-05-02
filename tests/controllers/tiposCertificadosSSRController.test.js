const tiposCertificadosSSRController = require('../../src/controllers/tiposCertificadosSSRController')
const { TiposCertificados, Certificado, Evento } = require('../../src/models')
const httpMocks = require('node-mocks-http')
const { Op } = require('sequelize')

jest.mock('../../src/models')

const adminUsuario = { perfil: 'admin' }

function mockRes() {
  const res = httpMocks.createResponse()
  res.render = jest.fn()
  res.redirect = jest.fn()
  return res
}

describe('tiposCertificadosSSRController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('index', () => {
    it('deve renderizar tipos ativos e arquivados com numCertificados', async () => {
      TiposCertificados.findAll = jest
        .fn()
        .mockResolvedValueOnce([
          {
            toJSON: () => ({
              id: 1,
              evento_id: 1,
              certificados: [{ id: 1 }, { id: 2 }],
            }),
            certificados: [{ id: 1 }, { id: 2 }],
          },
        ])
        .mockResolvedValueOnce([
          {
            toJSON: () => ({ id: 2, evento_id: 1, certificados: [{ id: 3 }] }),
            certificados: [{ id: 3 }],
          },
        ])
      const req = httpMocks.createRequest()
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.index(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'admin/tipos-certificados/index',
        expect.objectContaining({
          tipos: [expect.objectContaining({ id: 1, numCertificados: 2 })],
          arquivados: [expect.objectContaining({ id: 2, numCertificados: 1 })],
        }),
      )
    })
    it('deve redirecionar e setar flash em caso de erro', async () => {
      TiposCertificados.findAll = jest.fn().mockRejectedValue(new Error('erro'))
      const req = httpMocks.createRequest()
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.index(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'erro')
      expect(res.redirect).toHaveBeenCalledWith('/admin/tipos-certificados')
    })
  })

  describe('novo', () => {
    it('deve renderizar form com tipo null e lista de eventos', async () => {
      Evento.findAll = jest
        .fn()
        .mockResolvedValue([{ id: 1, nome: 'Evento A' }])
      const req = httpMocks.createRequest()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.novo(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'admin/tipos-certificados/form',
        expect.objectContaining({
          tipo: null,
          actionUrl: '/admin/tipos-certificados',
          opcoesCampoDestaque: [{ value: 'nome', selected: true }],
          opcoesEvento: [{ value: 1, label: 'Evento A' }],
        }),
      )
    })

    it('deve redirecionar gestor sem eventos com mensagem de erro', async () => {
      const gestorUsuario = {
        perfil: 'gestor',
        getEventos: jest.fn().mockResolvedValue([]),
      }
      const req = httpMocks.createRequest()
      req.flash = jest.fn()
      req.usuario = gestorUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.novo(req, res)
      expect(req.flash).toHaveBeenCalledWith(
        'error',
        expect.stringContaining('Nenhum evento'),
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/tipos-certificados')
    })
  })

  describe('editar', () => {
    it('deve renderizar form com tipo', async () => {
      TiposCertificados.findByPk = jest.fn().mockResolvedValue({
        toJSON: () => ({ id: 1, evento_id: 1 }),
        evento_id: 1,
      })
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.editar(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'admin/tipos-certificados/form',
        expect.objectContaining({
          tipo: { id: 1, evento_id: 1 },
          actionUrl: '/admin/tipos-certificados/1',
          opcoesCampoDestaque: [{ value: 'nome', selected: true }],
        }),
      )
    })
    it('deve redirecionar se tipo não encontrado', async () => {
      TiposCertificados.findByPk = jest.fn().mockResolvedValue(null)
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.editar(req, res)
      expect(req.flash).toHaveBeenCalledWith(
        'error',
        'Tipo de certificado não encontrado.',
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/tipos-certificados')
    })
    it('deve redirecionar em caso de erro', async () => {
      TiposCertificados.findByPk = jest
        .fn()
        .mockRejectedValue(new Error('erro'))
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.editar(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'erro')
      expect(res.redirect).toHaveBeenCalledWith('/admin/tipos-certificados')
    })
  })

  describe('criar', () => {
    it('deve criar tipo e redirecionar com sucesso', async () => {
      TiposCertificados.create = jest.fn().mockResolvedValue({})
      const req = httpMocks.createRequest({
        body: {
          evento_id: '1',
          codigo: 'A',
          descricao: 'desc',
          campo_destaque: 'nome',
          texto_base: 'base',
          dados_dinamicos_json: '{"foo": "bar"}',
        },
      })
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.criar(req, res)
      expect(TiposCertificados.create).toHaveBeenCalledWith({
        evento_id: 1,
        codigo: 'A',
        descricao: 'desc',
        campo_destaque: 'nome',
        texto_base: 'base',
        dados_dinamicos: { foo: 'bar' },
      })
      expect(req.flash).toHaveBeenCalledWith(
        'success',
        'Tipo de certificado criado com sucesso.',
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/tipos-certificados')
    })
    it('deve redirecionar para novo em caso de erro', async () => {
      TiposCertificados.create = jest.fn().mockRejectedValue(new Error('erro'))
      const req = httpMocks.createRequest({ body: { evento_id: '1' } })
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.criar(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'erro')
      expect(res.redirect).toHaveBeenCalledWith(
        '/admin/tipos-certificados/novo',
      )
    })
  })

  describe('atualizar', () => {
    it('deve atualizar tipo e redirecionar com sucesso', async () => {
      const tipo = { update: jest.fn().mockResolvedValue({}), evento_id: 1 }
      TiposCertificados.findByPk = jest.fn().mockResolvedValue(tipo)
      const req = httpMocks.createRequest({
        params: { id: 1 },
        body: {
          codigo: 'A',
          descricao: 'desc',
          campo_destaque: 'nome',
          texto_base: 'base',
          dados_dinamicos_json: '{"foo": "bar"}',
        },
      })
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.atualizar(req, res)
      expect(tipo.update).toHaveBeenCalledWith({
        codigo: 'A',
        descricao: 'desc',
        campo_destaque: 'nome',
        texto_base: 'base',
        dados_dinamicos: { foo: 'bar' },
      })
      expect(req.flash).toHaveBeenCalledWith(
        'success',
        'Tipo de certificado atualizado com sucesso.',
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/tipos-certificados')
    })
    it('deve redirecionar se tipo não encontrado', async () => {
      TiposCertificados.findByPk = jest.fn().mockResolvedValue(null)
      const req = httpMocks.createRequest({ params: { id: 1 }, body: {} })
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.atualizar(req, res)
      expect(req.flash).toHaveBeenCalledWith(
        'error',
        'Tipo de certificado não encontrado.',
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/tipos-certificados')
    })
    it('deve redirecionar para editar em caso de erro', async () => {
      TiposCertificados.findByPk = jest
        .fn()
        .mockRejectedValue(new Error('erro'))
      const req = httpMocks.createRequest({ params: { id: 1 }, body: {} })
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.atualizar(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'erro')
      expect(res.redirect).toHaveBeenCalledWith(
        '/admin/tipos-certificados/1/editar',
      )
    })
  })

  describe('deletar', () => {
    it('deve deletar tipo e redirecionar com sucesso', async () => {
      const tipo = { destroy: jest.fn().mockResolvedValue({}), evento_id: 1 }
      TiposCertificados.findByPk = jest.fn().mockResolvedValue(tipo)
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.deletar(req, res)
      expect(tipo.destroy).toHaveBeenCalled()
      expect(req.flash).toHaveBeenCalledWith(
        'success',
        'Tipo de certificado arquivado.',
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/tipos-certificados')
    })
    it('deve redirecionar se tipo não encontrado', async () => {
      TiposCertificados.findByPk = jest.fn().mockResolvedValue(null)
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.deletar(req, res)
      expect(req.flash).toHaveBeenCalledWith(
        'error',
        'Tipo de certificado não encontrado.',
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/tipos-certificados')
    })
    it('deve redirecionar em caso de erro', async () => {
      TiposCertificados.findByPk = jest
        .fn()
        .mockRejectedValue(new Error('erro'))
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.deletar(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'erro')
      expect(res.redirect).toHaveBeenCalledWith('/admin/tipos-certificados')
    })
  })

  describe('restaurar', () => {
    it('deve restaurar tipo e redirecionar com sucesso', async () => {
      const tipo = { restore: jest.fn().mockResolvedValue({}), evento_id: 1 }
      TiposCertificados.findByPk = jest.fn().mockResolvedValue(tipo)
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.restaurar(req, res)
      expect(tipo.restore).toHaveBeenCalled()
      expect(req.flash).toHaveBeenCalledWith(
        'success',
        'Tipo de certificado restaurado.',
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/tipos-certificados')
    })
    it('deve redirecionar se tipo não encontrado', async () => {
      TiposCertificados.findByPk = jest.fn().mockResolvedValue(null)
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.restaurar(req, res)
      expect(req.flash).toHaveBeenCalledWith(
        'error',
        'Tipo de certificado não encontrado.',
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/tipos-certificados')
    })
    it('deve redirecionar em caso de erro', async () => {
      TiposCertificados.findByPk = jest
        .fn()
        .mockRejectedValue(new Error('erro'))
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      req.usuario = adminUsuario
      const res = mockRes()
      await tiposCertificadosSSRController.restaurar(req, res)
      expect(req.flash).toHaveBeenCalledWith('error', 'erro')
      expect(res.redirect).toHaveBeenCalledWith('/admin/tipos-certificados')
    })
  })
})
