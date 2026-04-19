const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../../../app')

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

async function seedE2E() {
  const {
    Usuario,
    Evento,
    TiposCertificados,
    Participante,
    Certificado,
    UsuarioEvento,
  } = require('../../../src/models')

  const admin = await Usuario.create({
    nome: 'Admin E2E',
    email: 'admin.e2e@test.com',
    senha: 'senha123',
    perfil: 'admin',
  })

  const evento = await Evento.create({
    nome: 'Evento E2E',
    codigo_base: 'EEE', // apenas letras
    ano: 2026,
  })

  const gestor = await Usuario.create({
    nome: 'Gestor E2E',
    email: 'gestor.e2e@test.com',
    senha: 'senha123',
    perfil: 'gestor',
    evento_id: evento.id,
  })

  // Vincula gestor ao evento na tabela de junção (necessário para getEventoIds)
  await UsuarioEvento.create({ usuario_id: gestor.id, evento_id: evento.id })

  const monitor = await Usuario.create({
    nome: 'Monitor E2E',
    email: 'monitor.e2e@test.com',
    senha: 'senha123',
    perfil: 'monitor',
    evento_id: evento.id,
  })

  const tipo = await TiposCertificados.create({
    evento_id: evento.id,
    codigo: 'EE', // apenas letras
    descricao: 'Tipo E2E',
    campo_destaque: 'nome',
    texto_base: 'Certificado de ${nome} no ${evento}',
    dados_dinamicos: { evento: 'string' },
  })

  const participante = await Participante.create({
    nomeCompleto: 'Participante E2E',
    email: 'participante.e2e@test.com',
  })

  const certificado = await Certificado.create({
    nome: 'Participante E2E',
    status: 'emitido',
    participante_id: participante.id,
    evento_id: evento.id,
    tipo_certificado_id: tipo.id,
    codigo: 'E2E-2026-001',
    valores_dinamicos: { evento: 'Evento E2E' },
  })

  // Certificado arquivado (soft-deleted) para testes de restaurar
  const certificadoArquivado = await Certificado.create({
    nome: 'Participante E2E',
    status: 'cancelado',
    participante_id: participante.id,
    evento_id: evento.id,
    tipo_certificado_id: tipo.id,
    codigo: 'E2E-2026-002',
    valores_dinamicos: { evento: 'Evento E2E' },
  })
  await certificadoArquivado.destroy()

  return {
    admin,
    gestor,
    monitor,
    evento,
    tipo,
    participante,
    certificado,
    adminToken: jwt.sign({ id: admin.id, perfil: 'admin' }, JWT_SECRET, {
      expiresIn: '1h',
    }),
    gestorToken: jwt.sign({ id: gestor.id, perfil: 'gestor' }, JWT_SECRET, {
      expiresIn: '1h',
    }),
  }
}

async function cleanE2E() {
  const { sequelize } = require('../../../src/models')
  // Limpa todas as tabelas relevantes ignorando paranoid e FKs
  await sequelize.query('TRUNCATE TABLE certificados RESTART IDENTITY CASCADE')
  await sequelize.query('TRUNCATE TABLE participantes RESTART IDENTITY CASCADE')
  await sequelize.query('TRUNCATE TABLE eventos RESTART IDENTITY CASCADE')
  await sequelize.query(
    'TRUNCATE TABLE tipos_certificados RESTART IDENTITY CASCADE',
  )
  await sequelize.query('TRUNCATE TABLE usuarios RESTART IDENTITY CASCADE')
  await sequelize.query(
    'TRUNCATE TABLE usuario_eventos RESTART IDENTITY CASCADE',
  )
}

module.exports = { seedE2E, cleanE2E }
