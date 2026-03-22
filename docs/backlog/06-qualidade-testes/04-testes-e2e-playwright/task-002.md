# TASK ID: E2E-002

## Título

Criar `tests/e2e/setup/seed.js` — seed E2E com dados mínimos por perfil

## Objetivo

Criar script de seed que popula o banco de testes com dados mínimos necessários para a suíte E2E: um usuário por perfil (admin, gestor, monitor), um evento, um tipo de certificado, um participante e um certificado emitido com código.

## Contexto

- O seed usa a API REST autenticada como admin (Bearer token) para criar fixtures de forma realista
- Usuários precisam de senha em texto plano para login SSR — o seed os cria via `POST /api/usuarios` que faz hash internamente
- O seed é chamado via `require` ou `import` nos `beforeAll` dos spec files, não rodado diretamente
- Expõe função `seedE2E()` que retorna objeto com todos os IDs/tokens criados
- Expõe função `cleanE2E()` para teardown — trunca as tabelas via conexão direta ao banco

## Arquivos envolvidos

- `tests/e2e/setup/seed.js` ← CRIAR

## Passos

### Criar `tests/e2e/setup/seed.js`

```js
const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../../../app')
const { sequelize } = require('../../../src/models')

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

async function seedE2E() {
  // Admin inicial criado direto (sem rota pública de criação de admin)
  const {
    Usuario,
    Evento,
    TiposCertificados,
    Participante,
    Certificado,
  } = require('../../../src/models')

  const admin = await Usuario.create({
    nome: 'Admin E2E',
    email: 'admin.e2e@test.com',
    senha: await require('bcryptjs').hash('senha123', 10),
    perfil: 'admin',
  })

  const evento = await Evento.create({
    nome: 'Evento E2E',
    codigo_base: 'E2E',
    ano: 2026,
  })

  const gestor = await Usuario.create({
    nome: 'Gestor E2E',
    email: 'gestor.e2e@test.com',
    senha: await require('bcryptjs').hash('senha123', 10),
    perfil: 'gestor',
    evento_id: evento.id,
  })

  const monitor = await Usuario.create({
    nome: 'Monitor E2E',
    email: 'monitor.e2e@test.com',
    senha: await require('bcryptjs').hash('senha123', 10),
    perfil: 'monitor',
    evento_id: evento.id,
  })

  const tipo = await TiposCertificados.create({
    codigo: 'E2',
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
  await sequelize.query(
    'TRUNCATE TABLE certificados, tipos_certificados, participantes, usuario_eventos, usuarios, eventos RESTART IDENTITY CASCADE',
  )
}

module.exports = { seedE2E, cleanE2E }
```

## Critério de aceite

- `seedE2E()` retorna objeto com todos os registros criados e tokens válidos
- `cleanE2E()` remove todos os dados sem erros
- Certificado tem `codigo: 'E2E-2026-001'` para uso nos testes de validação pública
- Senhas criadas como hash bcrypt — login SSR funciona com `senha123`
