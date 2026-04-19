const request = require('supertest')
const app = require('../../app')
const { Participante, Certificado, sequelize } = require('../../src/models')

// Utilitário para limpar e popular o banco de dados de teste
async function setupDb() {
  // Limpa tabelas relacionadas para garantir ambiente limpo
  await sequelize.query(
    'TRUNCATE TABLE usuario_eventos, certificados, participantes, usuarios, eventos, tipos_certificados RESTART IDENTITY CASCADE',
  )
  // Evento 1 (vinculado ao gestor/monitor)
  await sequelize.models.Evento.create({
    id: 1,
    nome: 'Evento Teste',
    codigo_base: 'PSR',
    ano: 2026,
  })
  // Evento 2 (não vinculado ao gestor/monitor)
  await sequelize.models.Evento.create({
    id: 2,
    nome: 'Outro Evento',
    codigo_base: 'POT',
    ano: 2026,
  })

  // Cria tipo de certificado necessário para o certificado
  await sequelize.models.TiposCertificados.destroy({ where: {}, force: true })
  await sequelize.models.TiposCertificados.create({
    id: 1,
    evento_id: 1,
    codigo: 'TP',
    descricao: 'Tipo Padrão',
    campo_destaque: 'nome',
    texto_base: 'Texto base do certificado',
    dados_dinamicos: {},
  })

  // Cria usuários para login SSR
  await sequelize.models.Usuario.destroy({ where: {}, force: true })
  // Admin (id: 1)
  await sequelize.models.Usuario.create({
    nome: 'Admin',
    email: 'admin@email.com',
    senha: '123456',
    perfil: 'admin',
  })
  // Gestor (id: 2)
  await sequelize.models.Usuario.create({
    nome: 'Gestor',
    email: 'gestor@email.com',
    senha: '123456',
    perfil: 'gestor',
  })
  // Monitor (id: 3)
  await sequelize.models.Usuario.create({
    nome: 'Monitor',
    email: 'monitor@email.com',
    senha: '123456',
    perfil: 'monitor',
  })

  // Vincula gestor e monitor ao evento 1
  await sequelize.models.UsuarioEvento.destroy({ where: {}, force: true })
  await sequelize.models.UsuarioEvento.create({ usuario_id: 2, evento_id: 1 }) // gestor
  await sequelize.models.UsuarioEvento.create({ usuario_id: 3, evento_id: 1 }) // monitor

  await Certificado.destroy({ where: {}, force: true })
  await Participante.destroy({ where: {}, force: true, paranoid: false })

  // Participantes do evento 1
  await Participante.create({
    id: 1,
    nomeCompleto: 'João da Silva',
    email: 'joao@email.com',
    instituicao: 'UFSC',
  })
  await Participante.create({
    id: 2,
    nomeCompleto: 'Maria Souza',
    email: 'maria@email.com',
    instituicao: 'USP',
    deleted_at: new Date(),
  })
  // Participante do evento 2
  await Participante.create({
    id: 3,
    nomeCompleto: 'Carlos Evento2',
    email: 'carlos2@email.com',
    instituicao: 'UFRJ',
  })

  await Certificado.create({
    nome: 'Certificado de Participação',
    participante_id: 1,
    codigo: 'ABC123',
    evento_id: 1,
    tipo_certificado_id: 1,
    arquivo: 'cert.pdf',
  })
  await Certificado.create({
    nome: 'Certificado Maria Arquivada',
    participante_id: 2,
    codigo: 'MAR01',
    evento_id: 1,
    tipo_certificado_id: 1,
    arquivo: 'cert_maria.pdf',
  })
  await Certificado.create({
    nome: 'Certificado Evento2',
    participante_id: 3,
    codigo: 'EVT2',
    evento_id: 2,
    tipo_certificado_id: 1,
    arquivo: 'cert2.pdf',
  })
}

describe('Gestor/Monitor SSR - Participante', () => {
  beforeAll(async () => {
    await sequelize.sync()
  })
  beforeEach(async () => {
    await setupDb()
  })

  it('GET /admin/participantes (gestor) só vê participantes do evento vinculado', async () => {
    const agent = request.agent(app)
    await agent
      .post('/auth/login')
      .send({ email: 'gestor@email.com', senha: '123456' })
      .redirects(1)
    const res = await agent.get('/admin/participantes')
    expect(res.status).toBe(200)
    // Participantes do evento 1 aparecem
    expect(res.text).toMatch(/<td>João da Silva<\/td>/)
    expect(res.text).toMatch(/<details[\s\S]*Maria Souza[\s\S]*<\/details>/)
    // Participante de outro evento NÃO aparece
    expect(res.text).not.toMatch(/Carlos Evento2/)
  })

  it('GET /admin/participantes (monitor) só vê participantes do evento vinculado', async () => {
    const agent = request.agent(app)
    await agent
      .post('/auth/login')
      .send({ email: 'monitor@email.com', senha: '123456' })
      .redirects(1)
    const res = await agent.get('/admin/participantes')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/<td>João da Silva<\/td>/)
    expect(res.text).toMatch(/<details[\s\S]*Maria Souza[\s\S]*<\/details>/)
    expect(res.text).not.toMatch(/Carlos Evento2/)
  })
})

describe('Admin SSR - Participante', () => {
  beforeAll(async () => {
    await sequelize.sync()
  })
  beforeEach(async () => {
    await setupDb()
  })

  it('GET /admin/participantes vê todos os participantes de todos os eventos', async () => {
    const agent = request.agent(app)
    await agent
      .post('/auth/login')
      .send({ email: 'admin@email.com', senha: '123456' })
      .redirects(1)
    const res = await agent.get('/admin/participantes')
    expect(res.status).toBe(200)
    // Participantes de ambos eventos aparecem
    expect(res.text).toMatch(/<td>João da Silva<\/td>/)
    expect(res.text).toMatch(/<td>Carlos Evento2<\/td>/)
    expect(res.text).toMatch(/<details[\s\S]*Maria Souza[\s\S]*<\/details>/)
  })

  it('GET /admin/participantes lista participantes ativos e arquivados separados', async () => {
    const agent = request.agent(app)
    await agent
      .post('/auth/login')
      .send({ email: 'admin@email.com', senha: '123456' })
      .redirects(1)
    const res = await agent.get('/admin/participantes')
    if (res.status !== 200) {
      console.log('Erro resposta /admin/participantes:', res.text)
    }
    expect(res.status).toBe(200)
    // Participante ativo na tabela principal
    expect(res.text).toMatch(/<td>João da Silva<\/td>/)
    // Arquivado não na tabela principal
    const mainTable = res.text
      .split("<table class='table table-bordered'>")[1]
      .split('</table>')[0]
    expect(mainTable).not.toContain('Maria Souza')
    // Arquivado na seção <details>
    expect(res.text).toMatch(/<details[\s\S]*Maria Souza[\s\S]*<\/details>/)
    // Verifica cabeçalho correto
    expect(res.text).toContain('<th>Certificados</th>')
  })

  it('GET /admin/participantes?q=joao filtra por nome/email', async () => {
    const agent = request.agent(app)
    await agent
      .post('/auth/login')
      .send({ email: 'admin@email.com', senha: '123456' })
      .redirects(1)
    const res = await agent.get('/admin/participantes?q=joao')
    if (res.status !== 200) {
      console.log('Erro resposta /admin/participantes?q=joao:', res.text)
    }
    expect(res.status).toBe(200)
    // Participante ativo na tabela principal
    expect(res.text).toMatch(/<td>João da Silva<\/td>/)
    // Arquivado não na tabela principal
    const mainTable = res.text
      .split("<table class='table table-bordered'>")[1]
      .split('</table>')[0]
    expect(mainTable).not.toContain('Maria Souza')
    // Arquivado na seção <details>
    expect(res.text).toMatch(/<details[\s\S]*Maria Souza[\s\S]*<\/details>/)
  })
})
