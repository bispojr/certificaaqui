const certificadoSSRController = require('../../src/controllers/certificadoSSRController')
const {
  Certificado,
  Participante,
  Evento,
  TiposCertificados,
} = require('../../src/models')
const certificadoService = require('../../src/services/certificadoService')
const httpMocks = require('node-mocks-http')

jest.mock('../../src/models')
jest.mock('../../src/services/certificadoService')

function mockRes() {
  const res = httpMocks.createResponse()
  res.render = jest.fn()
  res.redirect = jest.fn()
  res.flash = jest.fn()
  return res
}

describe('certificadoSSRController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetAllMocks()
  })

  describe('index', () => {
    it('deve renderizar certificados e arquivados para admin', async () => {
      const req = httpMocks.createRequest({
        usuario: { perfil: 'admin', getEventos: jest.fn() },
        query: {},
      })
      req.flash = jest.fn()
      Certificado.findAll = jest
        .fn()
        .mockResolvedValueOnce(['cert1'])
        .mockResolvedValueOnce(['arq1'])
      Evento.findAll = jest.fn().mockResolvedValue(['ev1'])
      TiposCertificados.findAll = jest.fn().mockResolvedValue(['tipo1'])
      const res = mockRes()
      await certificadoSSRController.index(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'admin/certificados/index',
        expect.objectContaining({
          certificados: ['cert1'],
          arquivados: ['arq1'],
          eventos: ['ev1'],
          tipos: ['tipo1'],
        }),
      )
    })
  })

  describe('detalhe', () => {
    it('deve renderizar detalhe do certificado', async () => {
      const certificado = {
        id: 1,
        TiposCertificado: { texto_base: 'TEXTO' },
        valores_dinamicos: { nome: 'X' },
      }
      Certificado.findByPk = jest.fn().mockResolvedValue(certificado)
      jest.mock('../../src/services/templateService', () => ({
        interpolate: () => 'INTERPOLADO',
      }))
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      const res = mockRes()
      await certificadoSSRController.detalhe(req, res)
      expect(res.render).toHaveBeenCalled()
    })
  })

  describe('novo', () => {
    it('deve renderizar form de novo certificado', async () => {
      Participante.findAll = jest.fn().mockResolvedValue(['p1'])
      Evento.findAll = jest.fn().mockResolvedValue(['e1'])
      TiposCertificados.findAll = jest.fn().mockResolvedValue(['t1'])
      const req = httpMocks.createRequest()
      req.flash = jest.fn()
      const res = mockRes()
      await certificadoSSRController.novo(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'admin/certificados/form',
        expect.any(Object),
      )
    })
  })

  describe('editar', () => {
    it('deve renderizar form de edição', async () => {
      Certificado.findByPk = jest
        .fn()
        .mockResolvedValue({ toJSON: () => ({ id: 1 }) })
      Participante.findAll = jest.fn().mockResolvedValue(['p1'])
      Evento.findAll = jest.fn().mockResolvedValue(['e1'])
      TiposCertificados.findAll = jest.fn().mockResolvedValue(['t1'])
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      const res = mockRes()
      await certificadoSSRController.editar(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'admin/certificados/form',
        expect.any(Object),
      )
    })
  })

  describe('criar', () => {
    it('deve criar certificado e redirecionar', async () => {
      certificadoService.create = jest.fn().mockResolvedValue({})
      const req = httpMocks.createRequest({
        body: {
          nome: 'A',
          participante_id: 1,
          evento_id: 1,
          tipo_certificado_id: 1,
          valores_dinamicos_json: '{}',
        },
      })
      req.flash = jest.fn()
      const res = mockRes()
      await certificadoSSRController.criar(req, res)
      expect(certificadoService.create).toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('/admin/certificados')
    })
  })

  describe('atualizar', () => {
    it('deve atualizar certificado e redirecionar', async () => {
      const update = jest.fn()
      Certificado.findByPk = jest.fn().mockResolvedValue({ update })
      const req = httpMocks.createRequest({
        params: { id: 1 },
        body: {
          nome: 'A',
          participante_id: 1,
          evento_id: 1,
          tipo_certificado_id: 1,
          valores_dinamicos_json: '{}',
        },
      })
      req.flash = jest.fn()
      const res = mockRes()
      await certificadoSSRController.atualizar(req, res)
      expect(update).toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('/admin/certificados')
    })
  })

  describe('cancelar', () => {
    it('deve cancelar certificado', async () => {
      const update = jest.fn()
      Certificado.findByPk = jest.fn().mockResolvedValue({ update })
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      const res = mockRes()
      await certificadoSSRController.cancelar(req, res)
      expect(update).toHaveBeenCalledWith({ status: 'cancelado' })
      expect(res.redirect).toHaveBeenCalledWith('/admin/certificados')
    })
  })

  describe('deletar', () => {
    it('deve remover (soft delete) certificado e redirecionar', async () => {
      const destroy = jest.fn()
      Certificado.findByPk = jest.fn().mockResolvedValue({ destroy })
      const req = httpMocks.createRequest({ params: { id: 1 } })
      req.flash = jest.fn()
      const res = mockRes()
      await certificadoSSRController.deletar(req, res)
      expect(destroy).toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('/admin/certificados')
    })

    it('deve exibir erro se certificado não encontrado', async () => {
      Certificado.findByPk = jest.fn().mockResolvedValue(null)
      const req = httpMocks.createRequest({ params: { id: 999 } })
      req.flash = jest.fn()
      const res = mockRes()
      await certificadoSSRController.deletar(req, res)
      expect(req.flash).toHaveBeenCalledWith(
        'error',
        'Certificado não encontrado.',
      )
      expect(res.redirect).toHaveBeenCalledWith('/admin/certificados')
    })
  })
})
