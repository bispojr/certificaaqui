const httpMocks = require('node-mocks-http')
const certificadoSSRController = require('../../src/controllers/certificadoSSRController')
const certificadoService = require('../../src/services/certificadoService')

jest.mock('../../src/services/certificadoService')

function mockRes() {
  const res = httpMocks.createResponse()
  res.render = jest.fn()
  res.redirect = jest.fn()
  res.flash = jest.fn()
  return res
}

describe('certificadoSSRController.criar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve criar certificado e gerar código de validação', async () => {
    certificadoService.create.mockResolvedValue({ id: 1, codigo: 'EDC-25-PT-1' })
    const req = httpMocks.createRequest({
      body: {
        nome: 'Teste',
        status: 'emitido',
        participante_id: 1,
        evento_id: 2,
        tipo_certificado_id: 3,
        valores_dinamicos_json: '{}',
      },
      flash: jest.fn(),
    })
    const res = mockRes()
    await certificadoSSRController.criar(req, res)
    expect(certificadoService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Teste',
        status: 'emitido',
        participante_id: 1,
        evento_id: 2,
        tipo_certificado_id: 3,
        valores_dinamicos: {},
      })
    )
    expect(res.redirect).toHaveBeenCalledWith('/admin/certificados')
  })
})
