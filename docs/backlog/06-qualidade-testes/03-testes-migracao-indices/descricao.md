# FEATURE 6.3 — Testes de Migração de Índices

## Objetivo

Cobrir com teste automatizado a migration de índices de performance criada em INFRA-MIGRATIONS-001, garantindo que `up` adiciona os 5 índices e que `down` os remove sem erros.

## Contexto

- As 6 migrations de tabelas já têm cobertura 100% em `tests/migrations/`
- O padrão dos testes existentes: `DROP SCHEMA / CREATE SCHEMA` no `beforeEach`, import direto do arquivo de migration, `queryInterface.describeTable` ou consulta ao catálogo do banco para verificar índices
- A migration de índices (`<timestamp>-create-performance-indexes.js`) ainda não existe — criada por INFRA-MIGRATIONS-001
- Verificação de índices no PostgreSQL: `queryInterface.showIndex('tabela')` retorna array de objetos com atributo `name`

## Índices esperados

| Nome                               | Tabela          | Coluna            |
| ---------------------------------- | --------------- | ----------------- |
| `idx_certificados_evento_id`       | `certificados`  | `evento_id`       |
| `idx_certificados_participante_id` | `certificados`  | `participante_id` |
| `idx_certificados_status`          | `certificados`  | `status`          |
| `idx_participantes_email`          | `participantes` | `email`           |
| `idx_usuarios_email`               | `usuarios`      | `email`           |

## Tasks

| ID           | Arquivo                                                 | Descrição                            |
| ------------ | ------------------------------------------------------- | ------------------------------------ |
| TEST-MIG-001 | `tests/migrations/performanceIndexes.migration.test.js` | up cria 5 índices; down remove todos |

## Dependências

### Externas

- PostgreSQL disponível (mesmo banco de testes já usado pelo projeto)

### Internas

- **INFRA-MIGRATIONS-001** — migration `<timestamp>-create-performance-indexes.js` deve existir antes de executar o teste
- Migrations de tabelas `certificados`, `participantes` e `usuarios` já existem (sem dependência nova)

## Status

⬜ 0/1 — Bloqueado pela INFRA-MIGRATIONS-001
