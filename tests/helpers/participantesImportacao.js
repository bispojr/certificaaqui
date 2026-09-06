const fs = require('fs')
const path = require('path')

const fixturesDir = path.join(
  process.cwd(),
  'tests/fixtures/participantes-importacao',
)

function readFixture(fileName) {
  return fs.readFileSync(path.join(fixturesDir, fileName), 'utf8')
}

function payloadColadoValido() {
  return {
    evento_id: '1',
    origem: 'colado',
    conteudo: readFixture('colado.tsv'),
  }
}

function payloadCsvValido() {
  return {
    evento_id: '1',
    origem: 'csv',
    arquivoCsv: readFixture('participantes.csv'),
  }
}

async function autenticarAdminSSR(agent) {
  await agent
    .post('/login')
    .send({ email: 'admin@email.com', senha: '123456' })
    .redirects(1)
}

async function seedCenarioImportacaoSSR(sequelize) {
  await sequelize.query(
    'TRUNCATE TABLE usuario_eventos, certificados, participantes, usuarios, eventos, tipos_certificados RESTART IDENTITY CASCADE',
  )

  await sequelize.models.Evento.create({
    id: 1,
    nome: 'Evento Teste',
    codigo_base: 'PSR',
    ano: 2026,
  })

  await sequelize.models.Evento.create({
    id: 2,
    nome: 'Outro Evento',
    codigo_base: 'POT',
    ano: 2026,
  })

  await sequelize.models.TiposCertificados.create({
    id: 1,
    evento_id: 1,
    codigo: 'TP',
    descricao: 'Tipo Padrão',
    campo_destaque: 'nome',
    texto_base: 'Texto base do certificado',
    dados_dinamicos: {},
  })

  await sequelize.models.Usuario.create({
    nome: 'Admin',
    email: 'admin@email.com',
    senha: '123456',
    perfil: 'admin',
  })

  await sequelize.models.Usuario.create({
    nome: 'Gestor',
    email: 'gestor@email.com',
    senha: '123456',
    perfil: 'gestor',
  })

  await sequelize.models.Usuario.create({
    nome: 'Monitor',
    email: 'monitor@email.com',
    senha: '123456',
    perfil: 'monitor',
  })

  await sequelize.models.UsuarioEvento.create({ usuario_id: 2, evento_id: 1 })
  await sequelize.models.UsuarioEvento.create({ usuario_id: 3, evento_id: 1 })

  await sequelize.models.Participante.create({
    id: 1,
    nomeCompleto: 'Joao da Silva',
    email: 'joao@email.com',
    instituicao: 'UFSC',
  })

  await sequelize.models.Participante.create({
    id: 2,
    nomeCompleto: 'Maria Souza',
    email: 'maria@email.com',
    instituicao: 'USP',
    deleted_at: new Date(),
  })

  await sequelize.models.Participante.create({
    id: 3,
    nomeCompleto: 'Carlos Evento2',
    email: 'carlos2@email.com',
    instituicao: 'UFRJ',
  })

  await sequelize.models.Certificado.create({
    nome: 'Certificado de Participação',
    participante_id: 1,
    codigo: 'ABC123',
    evento_id: 1,
    tipo_certificado_id: 1,
    arquivo: 'cert.pdf',
  })

  await sequelize.models.Certificado.create({
    nome: 'Certificado Maria Arquivada',
    participante_id: 2,
    codigo: 'MAR01',
    evento_id: 1,
    tipo_certificado_id: 1,
    arquivo: 'cert_maria.pdf',
  })

  await sequelize.models.Certificado.create({
    nome: 'Certificado Evento2',
    participante_id: 3,
    codigo: 'EVT2',
    evento_id: 2,
    tipo_certificado_id: 1,
    arquivo: 'cert2.pdf',
  })

  await sequelize.query(
    "SELECT setval(pg_get_serial_sequence('participantes', 'id'), COALESCE(MAX(id), 1)) FROM participantes",
  )
}

module.exports = {
  readFixture,
  payloadColadoValido,
  payloadCsvValido,
  autenticarAdminSSR,
  seedCenarioImportacaoSSR,
}
