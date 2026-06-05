# CertificaAqui — Deploy

## Deploy com Docker

1. Configure `.env` para produção
2. Rode `docker-compose up -d` para iniciar app e banco

## Migrations em Produção

- Rode `npx sequelize db:migrate` após subir o container

## Atualização

- Pare containers: `docker-compose down`
- Atualize código e dependências
- Rode migrations novamente
- Reinicie containers

## Backup

- Realize backup do banco PostgreSQL antes de atualizações

## Monitoramento

- Health check: `GET /health`
- Logs: consulte logs do container
