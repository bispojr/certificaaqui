# TASK ID: SEG-SES-004

## Título

Adicionar `DATABASE_URL` e `SESSION_SECRET` ao `.env.example`

## Tipo

configuração / documentação

## Dependências

- SEG-SES-001 (dependência instalada)
- SEG-SES-002 (store usa `DATABASE_URL`)

## Objetivo

Atualizar `.env.example` para documentar as variáveis de ambiente necessárias para sessões persistentes, garantindo que novos desenvolvedores e deploys saibam quais variáveis configurar.

## Contexto

`.env.example` atual:

```
JWT_SECRET=sua_chave_jwt_super_secreta
# Exemplo de variáveis de ambiente para Certifique-me

DB_USER=postgres
DB_PASSWORD=senha_segura
DB_NAME=certificados_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME_TEST=certificados_db_test
DB_PORT_TEST=5433
NODE_ENV=development
```

Variáveis ausentes:

- `DATABASE_URL` — usada pelo `connect-pg-simple` como `conString`
- `SESSION_SECRET` — já está sendo checada em `app.js` com `throw` se ausente, mas não está documentada no `.env.example`

## Arquivos envolvidos

- `.env.example` ← adicionar variáveis

## Passos

1. Adicionar ao final de `.env.example`:

```
SESSION_SECRET=troque-por-uma-string-aleatoria-de-pelo-menos-32-caracteres
DATABASE_URL=postgresql://postgres:senha_segura@localhost:5432/certificados_db
```

2. Reorganizar para que o comentário `# Exemplo de variáveis...` fique no topo (atualmente está na linha 2, depois de `JWT_SECRET`). Mover `JWT_SECRET` para abaixo do comentário cabeçalho:

```
# Exemplo de variáveis de ambiente para Certifique-me
# Copiar este arquivo para .env e preencher os valores

# Segredos de autenticação
JWT_SECRET=sua_chave_jwt_super_secreta
SESSION_SECRET=troque-por-uma-string-aleatoria-de-pelo-menos-32-caracteres

# Banco de dados (desenvolvimento)
DB_USER=postgres
DB_PASSWORD=senha_segura
DB_NAME=certificados_db
DB_HOST=localhost
DB_PORT=5432

# Banco de dados (testes)
DB_NAME_TEST=certificados_db_test
DB_PORT_TEST=5433

# URL de conexão (usada por connect-pg-simple para store de sessão)
DATABASE_URL=postgresql://postgres:senha_segura@localhost:5432/certificados_db

# Ambiente
NODE_ENV=development
```

## Notas de implementação

- `DATABASE_URL` deve refletir os mesmos valores de `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` e `DB_NAME` já presentes no arquivo — só muda o formato (URL)
- Em Docker, `DATABASE_URL` já está definida no `docker-compose.yml` (`postgresql://postgres:password@postgres:5432/certificados_db`) — o `.env.example` é para ambiente local sem Docker
- `SESSION_SECRET` deve ser uma string aleatória longa. O `.env.example` deve mostrar o formato esperado sem revelar um valor real

## Resultado esperado

- `.env.example` documentado com todas as variáveis necessárias para o ambiente funcionar
- `grep "SESSION_SECRET" .env.example` retorna a linha com a variável
- `grep "DATABASE_URL" .env.example` retorna a linha com a variável

## Critério de aceite

- As variáveis `SESSION_SECRET` e `DATABASE_URL` estão presentes no `.env.example` com valores de exemplo (não valores reais)
- O arquivo está organizado com comentários de seção legíveis
