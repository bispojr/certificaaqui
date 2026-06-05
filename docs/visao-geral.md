# CertificaAqui — Visão Geral

## Descrição

Sistema de gestão e emissão de certificados digitais para eventos.

## Tecnologias e Linguagens

- Node.js
- Express
- Sequelize ORM (PostgreSQL)
- JWT (autenticação)
- Docker
- Jest (testes)

## Frameworks e Bibliotecas

- express, sequelize, bcryptjs, jsonwebtoken, hbs, dotenv

## Estrutura de Diretórios

- src/: código principal (models, controllers, services, routes, middlewares)
- tests/: testes automatizados
- docs/: documentação técnica
- migrations/: scripts de banco
- public/: arquivos estáticos

## Módulos Principais

- Participantes
- Eventos
- Certificados
- Tipos de Certificados
- Usuários

## Stakeholders

- Organizadores de eventos
- Participantes
- Equipe técnica
- Administradores do sistema

## Glossário

- Certificado: documento digital emitido para participantes.
- Evento: atividade ou conjunto de atividades ocorrida em um período de tempo.
- Atividade: parte de um evento que ocasiona a geração de certificados.
- Tipo de Certificado: modelo de certificado parametrizável.
- Usuário: pessoa com acesso ao sistema (admin, gestor, monitor, público geral).
