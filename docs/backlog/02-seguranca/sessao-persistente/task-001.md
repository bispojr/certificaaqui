# TASK ID: SEG-SES-001

## Título

Instalar `connect-pg-simple` e criar migration da tabela `user_sessions`

## Tipo

banco / dependência

## Dependências

nenhuma

## Objetivo

Instalar a dependência `connect-pg-simple` como pacote de produção e criar a migration Sequelize que cria a tabela `user_sessions` conforme o schema exigido pela biblioteca.

## Contexto

O `connect-pg-simple` exige uma tabela com o seguinte schema (DDL oficial da biblioteca):

```sql
CREATE TABLE "user_sessions" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);
ALTER TABLE "user_sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX "IDX_session_expire" ON "user_sessions" ("expire");
```

A biblioteca também aceita que a tabela seja criada via a opção `createTableIfMissing: true`, mas o padrão do projeto é manter schema controlado por migrations versionadas.

## Arquivos envolvidos

- `package.json` ← `npm install connect-pg-simple` (não editar manualmente — usar comando npm)
- `migrations/20260411190000-create-user-sessions.js` ← criar

## Passos

### 1. Instalar a dependência

```bash
npm install connect-pg-simple
```

Verificar que `connect-pg-simple` aparece em `dependencies` (não `devDependencies`) no `package.json`.

### 2. Criar a migration

```javascript
'use strict'

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
      ) WITH (OIDS=FALSE);

      CREATE INDEX IF NOT EXISTS "IDX_session_expire"
        ON "user_sessions" ("expire");
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "IDX_session_expire";
      DROP TABLE IF EXISTS "user_sessions";
    `)
  },
}
```

Notas:
- Usar `CREATE TABLE IF NOT EXISTS` e `CREATE INDEX IF NOT EXISTS` para tornar a migration idempotente
- Usar `queryInterface.sequelize.query()` com SQL raw porque o schema da tabela não mapeia para um model Sequelize

## Resultado esperado

- `node -e "require('connect-pg-simple')"` não lança erro (dependência instalada)
- Após `npx sequelize-cli db:migrate`, a tabela `user_sessions` existe no banco com o índice `IDX_session_expire`
- `npm run check` passa

## Critério de aceite

- `connect-pg-simple` listado em `dependencies` no `package.json`
- Migration criada com `IF NOT EXISTS` nos DDLs
- `down` faz cleanup completo (DROP INDEX + DROP TABLE)
