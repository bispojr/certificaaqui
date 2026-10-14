const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../../app')
const {
  Participante,
  Certificado,
  Evento,
  TiposCertificados,
  Usuario,
} = require('../../src/models')
const pdfService = require('../../src/services/pdfService')

describe('API Routes - /api/certificados/:id/pdf Streaming & Headers', () => {
  let participante, certificado, evento, tipo

  beforeEach(async () => {
    await Certificado.sequelize.query(
      'TRUNCATE TABLE "usuario_eventos", "usuarios", "certificados", "tipos_certificados", "participantes", "eventos" RESTART IDENTITY CASCADE',
    )

    evento = await Evento.create({
      nome: 'Evento Teste API',
      codigo_base: 'EAP',
      ano: 2026,
      created_at: new Date(),
      updated_at: new Date(),
    })
    tipo = await TiposCertificados.create({
      evento_id: evento.id,
      codigo: 'CT',
      descricao: 'Tipo Teste',
      campo_destaque: 'nomeCompleto',
      texto_base: 'Certificado para ${nomeCompleto}',
      dados_dinamicos: { nomeCompleto: { tipo: 'string', obrigatorio: true } },
    })
    participante = await Participante.create({
      nomeCompleto: 'Participante Streaming',
      email: 'streaming@teste.com',
      instituicao: 'Universidade Streaming',
    })
    certificado = await Certificado.create({
      nome: 'Certificado Streaming Teste',
      status: 'emitido',
      participante_id: participante.id,
      evento_id: evento.id,
      tipo_certificado_id: tipo.id,
      codigo: 'STREAM123',
    })
  })

  afterEach(async () => {
    await Certificado.sequelize.query(
      'TRUNCATE TABLE "usuario_eventos", "usuarios", "certificados", "tipos_certificados", "participantes", "eventos" RESTART IDENTITY CASCADE',
    )
  })

  it('deve responder via streaming HTTP com cabeçalhos corretos para certificado emitido', async () => {
    const streamSpy = jest.spyOn(pdfService, 'streamCertificadoPdf')

    const res = await request(app).get(
      `/api/certificados/${certificado.id}/pdf`,
    )

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('application/pdf')
    expect(res.headers['content-disposition']).toBe(
      `inline; filename=certificado-${certificado.id}.pdf`,
    )
    expect(streamSpy).toHaveBeenCalled()
    expect(Buffer.isBuffer(res.body)).toBe(true)
    expect(res.body.slice(0, 4).toString()).toBe('%PDF')

    streamSpy.mockRestore()
  }, 10000)

  it('deve receber chunks progressivos via stream HTTP', (done) => {
    const chunks = []
    const req = request(app)
      .get(`/api/certificados/${certificado.id}/pdf`)
      .buffer(false)

    req.on('response', (res) => {
      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe('application/pdf')
      expect(res.headers['content-disposition']).toBe(
        `inline; filename=certificado-${certificado.id}.pdf`,
      )

      res.on('data', (chunk) => {
        chunks.push(chunk)
      })

      res.on('end', () => {
        expect(chunks.length).toBeGreaterThan(0)
        const fullBuffer = Buffer.concat(chunks)
        expect(fullBuffer.slice(0, 4).toString()).toBe('%PDF')
        done()
      })
    })

    req.end()
  }, 10000)

  it('deve retornar 404 para certificado inexistente sem iniciar stream', async () => {
    const streamSpy = jest.spyOn(pdfService, 'streamCertificadoPdf')

    const res = await request(app).get('/api/certificados/999999/pdf')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: 'Certificado não encontrado ou indisponível publicamente',
    })
    expect(streamSpy).not.toHaveBeenCalled()

    streamSpy.mockRestore()
  })

  it('deve retornar 404 para certificado pendente em requisição pública anônima', async () => {
    const pendente = await Certificado.create({
      nome: 'Certificado Pendente API',
      status: 'pendente',
      participante_id: participante.id,
      evento_id: evento.id,
      tipo_certificado_id: tipo.id,
      codigo: 'PENDAPI01',
    })

    const streamSpy = jest.spyOn(pdfService, 'streamCertificadoPdf')

    const res = await request(app).get(`/api/certificados/${pendente.id}/pdf`)

    expect(res.status).toBe(404)
    expect(res.body).toEqual({
      error: 'Certificado não encontrado ou indisponível publicamente',
    })
    expect(streamSpy).not.toHaveBeenCalled()

    streamSpy.mockRestore()
  })

  it('deve permitir admin autenticado baixar certificado pendente com streaming e cabeçalhos corretos', async () => {
    const pendente = await Certificado.create({
      nome: 'Certificado Pendente Admin API',
      status: 'pendente',
      participante_id: participante.id,
      evento_id: evento.id,
      tipo_certificado_id: tipo.id,
      codigo: 'PENDADMIN01',
    })

    const admin = await Usuario.create({
      nome: 'Admin API Teste',
      email: 'admin-api@teste.com',
      senha: 'senha123',
      perfil: 'admin',
    })

    const tokenAdmin = jwt.sign(
      { id: admin.id, perfil: admin.perfil },
      process.env.JWT_SECRET,
    )

    const res = await request(app)
      .get(`/api/certificados/${pendente.id}/pdf`)
      .set('Authorization', `Bearer ${tokenAdmin}`)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('application/pdf')
    expect(res.headers['content-disposition']).toBe(
      `inline; filename=certificado-${pendente.id}.pdf`,
    )
    expect(res.body.slice(0, 4).toString()).toBe('%PDF')
  }, 10000)

  it('deve permitir gestor do evento baixar certificado pendente autenticado', async () => {
    const pendente = await Certificado.create({
      nome: 'Certificado Pendente Gestor API',
      status: 'pendente',
      participante_id: participante.id,
      evento_id: evento.id,
      tipo_certificado_id: tipo.id,
      codigo: 'PENDGESTOR01',
    })

    const gestor = await Usuario.create({
      nome: 'Gestor API Teste',
      email: 'gestor-api@teste.com',
      senha: 'senha123',
      perfil: 'gestor',
    })
    await gestor.addEvento(evento)

    const tokenGestor = jwt.sign(
      { id: gestor.id, perfil: gestor.perfil },
      process.env.JWT_SECRET,
    )

    const res = await request(app)
      .get(`/api/certificados/${pendente.id}/pdf`)
      .set('Cookie', [`token=${tokenGestor}`])

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('application/pdf')
    expect(res.headers['content-disposition']).toBe(
      `inline; filename=certificado-${pendente.id}.pdf`,
    )
    expect(res.body.slice(0, 4).toString()).toBe('%PDF')
  }, 10000)

  it('deve negar gestor fora do escopo do evento para certificado pendente (retorna 404)', async () => {
    const pendente = await Certificado.create({
      nome: 'Certificado Pendente Fora Escopo',
      status: 'pendente',
      participante_id: participante.id,
      evento_id: evento.id,
      tipo_certificado_id: tipo.id,
      codigo: 'PENDFORA01',
    })

    const outroEvento = await Evento.create({
      nome: 'Outro Evento',
      codigo_base: 'OUT',
      ano: 2026,
      created_at: new Date(),
      updated_at: new Date(),
    })

    const gestorOutro = await Usuario.create({
      nome: 'Gestor Outro Evento',
      email: 'gestor-outro@teste.com',
      senha: 'senha123',
      perfil: 'gestor',
    })
    await gestorOutro.addEvento(outroEvento)

    const tokenGestorOutro = jwt.sign(
      { id: gestorOutro.id, perfil: gestorOutro.perfil },
      process.env.JWT_SECRET,
    )

    const res = await request(app)
      .get(`/api/certificados/${pendente.id}/pdf`)
      .set('Cookie', [`token=${tokenGestorOutro}`])

    expect(res.status).toBe(404)
    expect(res.body.error).toBe(
      'Certificado não encontrado ou indisponível publicamente',
    )
  })

  it('deve retornar 500 com JSON descritivo e remover Content-Disposition quando ocorrer falha antes do stream', async () => {
    const spy = jest
      .spyOn(pdfService, 'streamCertificadoPdf')
      .mockRejectedValueOnce(new Error('Falha no pipeline de renderização'))

    const res = await request(app).get(
      `/api/certificados/${certificado.id}/pdf`,
    )

    expect(res.status).toBe(500)
    expect(res.headers['content-type']).toContain('application/json')
    expect(res.headers['content-disposition']).toBeUndefined()
    expect(res.body).toEqual({
      error: 'Erro ao gerar PDF',
      detalhe: 'Falha no pipeline de renderização',
    })

    spy.mockRestore()
  })

  it('deve lidar com encerramento prematuro da conexão pelo cliente', async () => {
    const spy = jest
      .spyOn(pdfService, 'streamCertificadoPdf')
      .mockImplementationOnce(async (cert, res) => {
        res.destroy()
      })

    await expect(
      request(app).get(`/api/certificados/${certificado.id}/pdf`),
    ).rejects.toThrow()

    spy.mockRestore()
  })
})
