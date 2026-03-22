# Feature: Gerenciamento de Schema (Migrations)

## Descrição

Controle versionado do schema do banco de dados via Sequelize migrations.
Todas as tabelas principais já foram criadas. Resta criar a migration de índices de performance.

## Tasks implementadas

- ✅ Migrations de tabelas criadas: `eventos`, `tipos_certificados`, `participantes`, `certificados`, `usuarios`, `usuario_eventos`
- ✅ `tests/setup.js` atualizado para rodar `db:migrate` em vez de `sync`

## Tasks pendentes

- ⬜ [TASK-001] Criar migration de índices de performance nos campos mais consultados
- ⬜ [TASK-002] Criar teste de migração para verificar criação e remoção dos índices

## Dependências

### Externas (de outras features)

Nenhuma — esta feature não depende de outras.

### Internas (ordem entre tasks desta feature)

- TASK-001 → TASK-002 — o teste de migração referencia o arquivo criado em TASK-001; substituir `<TIMESTAMP>` no `require` pelo timestamp real gerado.
