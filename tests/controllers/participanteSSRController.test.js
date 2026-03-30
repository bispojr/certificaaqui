const request = require('supertest')
const app = require('../../app')
const { Participante, Certificado, sequelize } = require('../../src/models')
const participanteService = require('../../src/services/participanteService')

// Utilitário para limpar e popular o banco de dados de teste
async function setupDb() {
  // Limpa tabelas relacionadas para garantir ambiente limpo
  await sequelize.query(
    'TRUNCATE TABLE usuario_eventos, certificados, participantes, usuarios, eventos, tipos_certificados RESTART IDENTITY CASCADE',
  )
  await sequelize.models.Evento.create({
    id: 1,
    nome: 'Evento Teste',
    codigo_base: 'ABC',
    ano: 2026,
  })

  // Cria tipo de certificado necessário para o certificado
  await sequelize.models.TiposCertificados.destroy({ where: {}, force: true })
  await sequelize.models.TiposCertificados.create({
    id: 1,
    codigo: 'TP',
    descricao: 'Tipo Padrão',
    campo_destaque: 'nome',
    texto_base: 'Texto base do certificado',
    dados_dinamicos: {},
  })
  // Cria usuário admin para login SSR
  await sequelize.models.Usuario.destroy({ where: {}, force: true })
  await sequelize.models.Usuario.create({
    nome: 'Admin',
    email: 'admin@email.com',
    senha: '123456',
    perfil: 'admin',
  })
  await Certificado.destroy({ where: {}, force: true })
  await Participante.destroy({ where: {}, force: true, paranoid: false })
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
  await Certificado.create({
    nome: 'Certificado de Participação',
    participante_id: 1,
    codigo: 'ABC123',
    evento_id: 1,
    tipo_certificado_id: 1,
    arquivo: 'cert.pdf',
  })
}

describe('Admin SSR - Participante', () => {
  beforeAll(async () => {
    await sequelize.sync()
  })
  beforeEach(async () => {
    await setupDb()
  })

  it('GET /admin/participantes lista participantes e arquivados', async () => {
    const agent = request.agent(app)
    // Simula login SSR admin
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

  // Testes para criar, editar, deletar, restaurar podem ser adicionados conforme necessário
})
