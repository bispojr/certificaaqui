# Feature: Remoção de Log com Dados Pessoais (LGPD / OWASP A09)

## ID da Feature

SEG-LOG

## Domínio

Domínio 2 — Segurança

## Problema

`src/services/pdfService.js`, linha 14, emite:

```js
console.log('PDFService certificado:', certificado)
```

O objeto `certificado` passado ao método `generateCertificadoPdf()` contém todas as associações carregadas (nome do participante, dados dinâmicos, evento, tipo de certificado), expondo dados pessoais em stdout em qualquer ambiente — incluindo produção.

Violações:
- **LGPD art. 46**: dado pessoal exposto sem finalidade legítima em log
- **OWASP A09:2021 — Security Logging and Monitoring Failures**: log com dado sensível sem controle

## Objetivo

Remover o `console.log` irrestrito e substituir por log mínimo que registre apenas o ID do certificado, mantendo rastreabilidade sem vazar dados pessoais.

## Arquivos envolvidos

- `src/services/pdfService.js` ← alterar linha 14

## Tasks

- [SEG-LOG-001](./task-001.md) — Remover `console.log` com objeto completo
- [SEG-LOG-002](./task-002.md) — Substituir por log estruturado com ID apenas

## Critério de aceite da Feature

Após esta feature, `pdfService.js` não emite nenhum dado pessoal em stdout. Um log mínimo de rastreabilidade com o ID é emitido. `npm run check` passa.
