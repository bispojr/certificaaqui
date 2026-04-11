const { dashboard } = require('../../src/controllers/dashboardController')
const {
  Usuario,
  Evento,
  TiposCertificados,
  Participante,
  Certificado,
} = require('../../src/models')

// Utilitário para mockar req/res
function mockReqRes(usuario) {
  const req = { usuario }
  const res = {
    render: jest.fn(),
    status: jest.fn().mockReturnThis(),
  }
  return { req, res }
}

describe('dashboardController.dashboard', () => {
    it('retorna dados completos de certificados para admin', async () => {
      jest.spyOn(Evento, 'count').mockResolvedValue(10)
      jest.spyOn(TiposCertificados, 'count').mockResolvedValue(5)
      jest.spyOn(Participante, 'count').mockResolvedValue(20)
      jest.spyOn(Usuario, 'count').mockResolvedValue(3)
      jest.spyOn(Certificado, 'count')
        .mockResolvedValueOnce(100) // totalCertificados
        .mockResolvedValueOnce(7)   // totalCertificadosPendentes
      const ultimosCertificadosFake = [
        { id: 1, codigo: 'ABC123', status: 'emitido', created_at: '2026-04-10', Participante: { nomeCompleto: 'Fulano' }, Evento: { nome: 'Evento X' }, TiposCertificados: { descricao: 'Palestra' } },
      ]
      jest.spyOn(Certificado, 'findAll').mockResolvedValue(ultimosCertificadosFake)
      const { req, res } = mockReqRes({ perfil: 'admin' })
      await dashboard(req, res)
      expect(res.render).toHaveBeenCalledWith(
        'admin/dashboard',
        expect.objectContaining({
          totalEventos: 10,
          totalTipos: 5,
          totalParticipantes: 20,
          totalUsuarios: 3,
          totalCertificados: 100,
          totalCertificadosPendentes: 7,
          ultimosCertificados: ultimosCertificadosFake,
        }),
      )
    })
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('retorna contagens de admin', async () => {
    jest.spyOn(Evento, 'count').mockResolvedValue(10)
    jest.spyOn(TiposCertificados, 'count').mockResolvedValue(5)
    jest.spyOn(Participante, 'count').mockResolvedValue(20)
    jest.spyOn(Usuario, 'count').mockResolvedValue(3)
    const { req, res } = mockReqRes({ perfil: 'admin' })
    await dashboard(req, res)
    expect(res.render).toHaveBeenCalledWith(
      'admin/dashboard',
      expect.objectContaining({
        totalEventos: 10,
        totalTipos: 5,
        totalParticipantes: 20,
        totalUsuarios: 3,
      }),
    )
  })

  it('retorna contagens de gestor/monitor com eventos', async () => {
    const usuarioFake = { eventos: [{ id: 1 }, { id: 2 }] }
    jest.spyOn(Usuario, 'findByPk').mockResolvedValue(usuarioFake)
    jest
      .spyOn(Certificado, 'count')
      .mockImplementation(({ where, distinct, col }) => {
        if (distinct) return Promise.resolve(7) // participantes distintos
        return Promise.resolve(15) // total certificados
      })
    const { req, res } = mockReqRes({ perfil: 'gestor', id: 42 })
    await dashboard(req, res)
    expect(res.render).toHaveBeenCalledWith(
      'admin/dashboard',
      expect.objectContaining({
        totalCertificados: 15,
        totalParticipantes: 7,
      }),
    )
  })

  it('retorna [0,0] se gestor/monitor sem eventos', async () => {
    const usuarioFake = { eventos: [] }
    jest.spyOn(Usuario, 'findByPk').mockResolvedValue(usuarioFake)
    const certificadoCount = jest.spyOn(Certificado, 'count')
    const { req, res } = mockReqRes({ perfil: 'monitor', id: 99 })
    await dashboard(req, res)
    expect(res.render).toHaveBeenCalledWith(
      'admin/dashboard',
      expect.objectContaining({
        totalCertificados: 0,
        totalParticipantes: 0,
      }),
    )
    expect(certificadoCount).not.toHaveBeenCalled()
  })

  it('renderiza erro 500 em caso de exceção', async () => {
    jest.spyOn(Evento, 'count').mockRejectedValue(new Error('Falha'))
    jest.spyOn(TiposCertificados, 'count').mockResolvedValue(0)
    jest.spyOn(Participante, 'count').mockResolvedValue(0)
    jest.spyOn(Usuario, 'count').mockResolvedValue(0)
    jest.spyOn(Certificado, 'count').mockResolvedValue(0)
    jest.spyOn(Certificado, 'findAll').mockResolvedValue([])
    const { req, res } = mockReqRes({ perfil: 'admin' })
    await dashboard(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.render).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: 'Falha' }),
    )
  })
})
