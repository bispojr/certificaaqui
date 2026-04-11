const request = require('supertest')
const app = require('../../../app')
const { mockLogin } = require('../../utils/authMocks')
const {
  Certificado,
  Participante,
  Evento,
  TiposCertificados,
} = require('../../../src/models')

describe('Admin SSR Certificados - Ordem e RBAC', () => {
  let agent
  let certId

  beforeAll(async () => {
    const [participante] = await Participante.findOrCreate({
      where: { email: 'participante_rota@certifique.me' },
      defaults: {
        nomeCompleto: 'Participante Rota Teste',
        email: 'participante_rota@certifique.me',
        instituicao: 'Inst. Teste',
      },
    })
    const [evento] = await Evento.findOrCreate({
      where: { codigo_base: 'RTA', ano: 2026 },
      defaults: { nome: 'Evento Rota Teste', codigo_base: 'RTA', ano: 2026 },
    })
    const [tipo] = await TiposCertificados.findOrCreate({
      where: { codigo: 'RT' },
      defaults: {
        codigo: 'RT',
        descricao: 'Tipo Rota Teste',
        campo_destaque: 'nome',
        texto_base: 'Certificado de ${nome_completo}.',
        dados_dinamicos: {},
      },
    })
    const cert = await Certificado.create({
      nome: 'Certificado Rota Teste',
      status: 'emitido',
      participante_id: participante.id,
      evento_id: evento.id,
      tipo_certificado_id: tipo.id,
      valores_dinamicos: {},
    })
    certId = cert.id
  })

  beforeEach(async () => {
    agent = request.agent(app)
  })

  const rotas = [
    {
      method: 'get',
      url: '/admin/certificados',
      perfil: 'monitor',
      status: 200,
    },
    {
      method: 'get',
      url: '/admin/certificados/novo',
      perfil: 'gestor',
      status: 200,
    },
    {
      method: 'post',
      url: '/admin/certificados',
      perfil: 'gestor',
      status: 302,
    },
    {
      method: 'post',
      url: '/admin/certificados/0/cancelar',
      perfil: 'gestor',
      status: 302,
    },
    {
      method: 'post',
      url: '/admin/certificados/0/restaurar',
      perfil: 'admin',
      status: 302,
    },
  ]

  rotas.forEach(({ method, url, perfil, status }) => {
    it(`${method.toUpperCase()} ${url} permite perfil ${perfil}`, async () => {
      await mockLogin(agent, perfil)
      const res = await agent[method](url)
      expect(res.status).toBe(status)
    })
  })

  it('GET /admin/certificados/:id permite perfil monitor', async () => {
    await mockLogin(agent, 'monitor')
    const res = await agent.get(`/admin/certificados/${certId}`)
    expect(res.status).toBe(200)
  })

  it('GET /admin/certificados/:id/editar permite perfil gestor', async () => {
    await mockLogin(agent, 'gestor')
    const res = await agent.get(`/admin/certificados/${certId}/editar`)
    expect(res.status).toBe(200)
  })

  it('POST /admin/certificados/:id permite perfil gestor', async () => {
    await mockLogin(agent, 'gestor')
    const res = await agent.post(`/admin/certificados/${certId}`)
    expect(res.status).toBe(302)
  })

  it('GET /admin/certificados/novo NÃO é capturado como /:id', async () => {
    await mockLogin(agent, 'gestor')
    const res = await agent.get('/admin/certificados/novo')
    expect(res.status).toBe(200)
    expect(res.text).not.toMatch(/Detalhe do Certificado/) // ou outro texto do detalhe
  })

  it('POST /admin/certificados/0/cancelar bloqueia monitor', async () => {
    await mockLogin(agent, 'monitor')
    const res = await agent.post('/admin/certificados/0/cancelar')
    expect(res.status).toBe(403)
  })

  it('POST /admin/certificados/0/restaurar bloqueia gestor', async () => {
    await mockLogin(agent, 'gestor')
    const res = await agent.post('/admin/certificados/0/restaurar')
    expect(res.status).toBe(403)
  })

  it('POST /admin/certificados/0/restaurar bloqueia monitor', async () => {
    await mockLogin(agent, 'monitor')
    const res = await agent.post('/admin/certificados/0/restaurar')
    expect(res.status).toBe(403)
  })

  it('preenche nome automaticamente se tipo não tem campos dinâmicos', async () => {
    // Cria participante e tipo de certificado sem campos dinâmicos
    const participante = await Participante.create({
      nomeCompleto: 'Fulano',
      email: 'fulano-auto@ex.com',
    })
    const evento = await Evento.create({
      nome: 'Festa Auto',
      ano: 2026,
      codigo_base: 'FST',
    })
    const tipo = await TiposCertificados.create({
      codigo: 'NP',
      descricao: 'Na pista',
      campo_destaque: 'nome',
      texto_base: 'Certificamos ${nome}',
      dados_dinamicos: {},
    })

    await mockLogin(agent, 'gestor')
    const res = await agent.post('/admin/certificados').send({
      participante_id: participante.id,
      evento_id: evento.id,
      tipo_certificado_id: tipo.id,
      status: 'emitido',
      // não envia nome!
    })
    expect(res.status).toBe(302)
    const cert = await Certificado.findOne({
      where: { participante_id: participante.id, tipo_certificado_id: tipo.id },
    })
    expect(cert).toBeTruthy()
    expect(cert.nome).toBe('Fulano')
  })
})
