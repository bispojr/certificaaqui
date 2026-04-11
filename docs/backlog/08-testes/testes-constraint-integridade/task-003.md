# Task: TEST-INTEG-003 — Teste de integração: constraint de banco rejeita INSERT direto duplicado

## Identificador
TEST-INTEG-003

## Feature
testes-constraint-integridade

## Prioridade
ALTA

## Contexto

Após implementação de **INTEG-PREV-001**, a tabela `certificados` possuirá o índice único parcial:

```sql
UNIQUE (participante_id, evento_id, tipo_certificado_id) WHERE deleted_at IS NULL
```

A verificação em `certificadoService.create()` (INTEG-PREV-002) é a primeira linha de defesa. A constraint de banco é a segunda linha — garante integridade mesmo se o service for contornado (ex.: acesso direto, outro processo, bug de concorrência).

Este teste valida que a constraint de banco funciona independentemente do service.

---

## O que implementar

### Localização
Novo arquivo: `tests/migrations/certificados-unique-constraint.test.js`

> Recomendado como arquivo separado pois usa `sequelize.query()` diretamente e precisa de setup/teardown específico de banco. Não misturar com testes de unidade de service.

### Setup necessário

```javascript
const { sequelize, Certificado } = require('../../src/models')

beforeAll(async () => {
  // Limpar e criar dados mínimos de suporte
  await sequelize.query('TRUNCATE TABLE certificados RESTART IDENTITY CASCADE')
  // Criar participante, evento e tipo de certificado mínimos para satisfazer as FKs
  // ... (reutilizar helpers de setupDb de outros arquivos de teste ou criar localmente)
})

afterAll(async () => {
  await sequelize.query('TRUNCATE TABLE certificados RESTART IDENTITY CASCADE')
})
```

### Cenário 1 — INSERT duplicado ativo deve falhar

```javascript
describe('Constraint única parcial em certificados', () => {
  it('deve rejeitar INSERT de certificado com mesma combinação ativa', async () => {
    // Arrange — criar o primeiro certificado
    await Certificado.create({
      participante_id: 1,
      evento_id: 1,
      tipo_certificado_id: 1,
      codigo: 'EVT-26-PT-1',
      nome: 'Cert 1',
      arquivo: 'cert1.pdf',
    })

    // Act — tentar criar segundo com mesma tripla (sem deleted_at)
    const promise = Certificado.create({
      participante_id: 1,
      evento_id: 1,
      tipo_certificado_id: 1,
      codigo: 'EVT-26-PT-2',
      nome: 'Cert 2',
      arquivo: 'cert2.pdf',
    })

    // Assert — banco deve rejeitar com erro de unique constraint
    await expect(promise).rejects.toThrow()
    // O erro do Sequelize para unique violation é SequelizeUniqueConstraintError
    await expect(promise).rejects.toMatchObject({
      name: 'SequelizeUniqueConstraintError',
    })
  })
})
```

### Cenário 2 — INSERT após soft delete do original deve funcionar

```javascript
  it('deve permitir INSERT quando o certificado anterior foi soft-deleted', async () => {
    // Arrange — soft delete do certificado existente
    const existente = await Certificado.findOne({
      where: { participante_id: 1, evento_id: 1, tipo_certificado_id: 1 },
    })
    await existente.destroy() // paranoid soft delete

    // Act — criar novo com mesma tripla
    const novo = await Certificado.create({
      participante_id: 1,
      evento_id: 1,
      tipo_certificado_id: 1,
      codigo: 'EVT-26-PT-3',
      nome: 'Cert 3 após restore',
      arquivo: 'cert3.pdf',
    })

    // Assert
    expect(novo).toBeDefined()
    expect(novo.id).toBeDefined()
    expect(novo.deleted_at).toBeNull()
  })
```

---

## Dependências

- **INTEG-PREV-001** deve estar implementado (migration com índice único parcial)
- Este teste **falha** antes da migration ser aplicada ao banco de teste
- O banco de teste deve rodar as migrations automaticamente no setup — verificar `tests/setup.js`

## Verificação prévia

Confirmar se `tests/setup.js` executa migrations antes dos testes:

```bash
grep -n "migrate\|sync\|umzug" tests/setup.js
```

Se não executar migrations, adicionar `sequelize.sync({ alter: true })` ou configurar o `umzug` para ambiente de teste.

## Arquivo alvo
`tests/migrations/certificados-unique-constraint.test.js`

## Critério de conclusão
- Teste **falha** antes de INTEG-PREV-001 ser aplicado ao banco de teste
- Teste **passa** com o índice único parcial aplicado
- O segundo cenário (soft delete + novo INSERT) passa sem erro
- Todos os outros testes continuam passando
