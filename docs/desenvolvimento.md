# CertificaAqui — Desenvolvimento

## Setup Local

1. Instale dependências: `npm install`
2. Configure `.env` a partir de `.env.example`
3. Rode migrations: `npx sequelize db:migrate`
4. Inicie o servidor: `npm start`

## Variáveis de Ambiente

- DATABASE_URL
- JWT_SECRET
- PORT
- DB_USER
- DB_PASSWORD
- DB_NAME
- DB_HOST
- DB_PORT
- DB_NAME_TEST
- DB_PORT_TEST
- NODE_ENV

## Rodando Testes

- Testes unitários e integração: `npm test`
- Testes com Docker: `npm run test:docker`

## Estrutura de Testes

- tests/models: testes de models
- tests/routes: testes de rotas
- tests/controllers: testes de controladores
- tests/services: testes de serviços

## Linter e Formatter

- ESLint: `npm run lint`
- Prettier: `npm run format`
