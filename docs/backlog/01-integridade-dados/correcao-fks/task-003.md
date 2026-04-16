# TASK ID: INTEG-FK-003

## Título

Testes de integridade referencial para as FKs RESTRICT

## Tipo

teste

## Dependências

- INTEG-FK-001 (FKs RESTRICT em `certificados` aplicadas no banco de teste)
- INTEG-FK-002 (FKs RESTRICT em `usuario_eventos` aplicadas no banco de teste)

## Objetivo

Criar testes de integração com banco real que verificam que as novas FK RESTRICT impedem hard deletes em entidades que possuem registros dependentes, e que permitem hard deletes quando não há dependências.

## Contexto

Não existe nenhum teste de integridade referencial no projeto (confirmado via grep). Os testes de integração com banco real usam o arquivo `tests/setup.js` e o banco de teste configurado por `config/database.js`. O padrão de testes do projeto com banco real está nos arquivos `tests/migrations/`.

## Arquivos envolvidos

- `tests/integration/integridade-referencial.test.js` ← criar (novo diretório `integration/` em `tests/`)

## Passos

1. Criar `tests/integration/integridade-referencial.test.js`:

```javascript
const {
  sequelize,
  Participante,
  Evento,
  TipoCertificado,
  Certificado,
  Usuario,
  UsuarioEvento,
} = require('../../src/models')

describe('Integridade Referencial — FK RESTRICT', () => {
  let evento, participante, tipoCertificado

  beforeAll(async () => {
    await sequelize.authenticate()
  })

  beforeEach(async () => {
    await sequelize.transaction(async (t) => {
      evento = await Evento.create(
        {
          nome: 'Evento FK Test',
          codigo_base: 'FKTEST',
          data_inicio: new Date(),
          data_fim: new Date(),
        },
        { transaction: t },
      )
      tipoCertificado = await TipoCertificado.create(
        { nome: 'Tipo FK Test', template: 'template', campos_template: [] },
        { transaction: t },
      )
      participante = await Participante.create(
        { nome: 'Part FK Test', email: `fktest+${Date.now()}@test.com` },
        { transaction: t },
      )
    })
  })

  afterEach(async () => {
    // Cleanup na ordem correta (sem FK violation)
    await Certificado.destroy({ where: {}, force: true })
    await Participante.destroy({ where: {}, force: true })
    await TipoCertificado.destroy({ where: {}, force: true })
    await Evento.destroy({ where: {}, force: true })
  })

  describe('Tabela certificados', () => {
    it('impede hard delete de participante com certificados vinculados', async () => {
      await Certificado.create({
        codigo: 'FK-TEST-001',
        participante_id: participante.id,
        evento_id: evento.id,
        tipo_certificado_id: tipoCertificado.id,
        status: 'ativo',
        dados_dinamicos: {},
      })

      await expect(
        sequelize.query(
          `DELETE FROM participantes WHERE id = ${participante.id}`,
        ),
      ).rejects.toThrow(/violates foreign key constraint/)
    })

    it('impede hard delete de evento com certificados vinculados', async () => {
      await Certificado.create({
        codigo: 'FK-TEST-002',
        participante_id: participante.id,
        evento_id: evento.id,
        tipo_certificado_id: tipoCertificado.id,
        status: 'ativo',
        dados_dinamicos: {},
      })

      await expect(
        sequelize.query(`DELETE FROM eventos WHERE id = ${evento.id}`),
      ).rejects.toThrow(/violates foreign key constraint/)
    })

    it('permite hard delete de participante sem certificados', async () => {
      await expect(
        sequelize.query(
          `DELETE FROM participantes WHERE id = ${participante.id}`,
        ),
      ).resolves.not.toThrow()
    })
  })

  describe('Tabela usuario_eventos', () => {
    let usuario

    beforeEach(async () => {
      usuario = await Usuario.create({
        nome: 'User FK Test',
        email: `userfk+${Date.now()}@test.com`,
        senha: 'SenhaForte123!',
        role: 'monitor',
      })
    })

    it('impede hard delete de usuario com vínculos em usuario_eventos', async () => {
      await UsuarioEvento.create({
        usuario_id: usuario.id,
        evento_id: evento.id,
      })

      await expect(
        sequelize.query(`DELETE FROM usuarios WHERE id = ${usuario.id}`),
      ).rejects.toThrow(/violates foreign key constraint/)
    })

    it('permite hard delete de usuario sem vínculos', async () => {
      await expect(
        sequelize.query(`DELETE FROM usuarios WHERE id = ${usuario.id}`),
      ).resolves.not.toThrow()
    })
  })
})
```

2. Garantir que o arquivo segue o padrão `jest.config.js` — verificar se o `testMatch` inclui `tests/integration/`

3. Se `jest.config.js` restringir a paths específicas, adicionar `tests/integration/**/*.test.js` ao `testMatch`

## Resultado esperado

- `npx jest tests/integration/integridade-referencial.test.js` executa e passa (com banco de teste rodando e migrations INTEG-FK-001 e INTEG-FK-002 aplicadas)
- Os 5 testes (3 em `certificados` + 2 em `usuario_eventos`) passam
- `npm run check` continua passando

## Critério de aceite

- Arquivo criado em `tests/integration/integridade-referencial.test.js`
- Testes cobrem: hard delete bloqueado quando existem dependentes (×3) e hard delete permitido quando não há dependentes (×2)
- Nenhum teste assume dados pré-existentes — cada `beforeEach` cria seus próprios dados
- `afterEach` limpa todos os registros na ordem correta sem violar FKs
