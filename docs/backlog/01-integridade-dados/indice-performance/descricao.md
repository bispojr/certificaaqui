# Feature: Índice de Performance em `tipo_certificado_id`

## ID da Feature

INTEG-IDX

## Domínio

Domínio 1 — Integridade de Dados

## Problema

A migration `20260324083059-create-performance-indexes.js` criou índices em `certificados.evento_id`, `certificados.participante_id` e `certificados.status`, mas **não criou** o índice em `certificados.tipo_certificado_id`.

Queries que filtram ou fazem JOIN por `tipo_certificado_id` (ex.: listar certificados de um tipo específico no dashboard, geração de relatórios por tipo) fazem full scan em `certificados`.

## Objetivo

Adicionar o índice `idx_certificados_tipo_certificado_id` na coluna `tipo_certificado_id` da tabela `certificados` via nova migration, seguindo o mesmo padrão da migration de performance existente.

## Arquivos envolvidos

- `migrations/20260411180000-add-index-certificados-tipo-certificado-id.js` ← criar (1 task)

## Tasks

- [INTEG-IDX-001](./task-001.md) — Migration para adicionar `idx_certificados_tipo_certificado_id`

## Critério de aceite da Feature

Após esta feature, todas as colunas FK de `certificados` possuem índice de performance no banco de dados PostgreSQL.
