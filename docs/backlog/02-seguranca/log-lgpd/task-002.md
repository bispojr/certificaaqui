# TASK ID: SEG-LOG-002

## Título

Adicionar log de rastreabilidade mínimo (ID apenas) em `pdfService.js`

## Tipo

código

## Dependências

- SEG-LOG-001 (console.log removido)

## Objetivo

Adicionar log estruturado mínimo que registre o ID do certificado sendo processado, sem expor qualquer dado pessoal. Mantém rastreabilidade operacional sem violar LGPD.

## Contexto

Após SEG-LOG-001, o `try {}` de `generateCertificadoPdf()` começa diretamente no `if (!certificado.codigo)`. Adicionar uma única linha de log antes dessa verificação, usando apenas `certificado.id`.

## Arquivos envolvidos

- `src/services/pdfService.js` ← adicionar linha após o `try {`

## Passos

1. Localizar o bloco (após SEG-LOG-001 aplicada):

```js
try {
  if (!certificado.codigo) {
```

2. Inserir o log mínimo:

```js
try {
  console.info(`[pdfService] Gerando PDF para certificado id=${certificado.id}`)
  if (!certificado.codigo) {
```

## Notas de implementação

- Usar `console.info` em vez de `console.log` para distinguir informações operacionais de logs de debug
- O formato `id=<valor>` é estruturado e facilmente parseável por ferramentas de log (ex.: Papertrail, Loki)
- Se o projeto adotar um logger centralizado no futuro (ex.: `winston`), esta linha deve ser atualizada para usar `logger.info(...)`

## Resultado esperado

- `npm run check` passa
- `grep "console.info" src/services/pdfService.js` retorna a linha adicionada
- Nenhuma referência ao nome, email ou dados dinâmicos do participante nos logs

## Critério de aceite

- Arquivo `pdfService.js` tem exatamente um `console.info` que usa apenas `certificado.id`
- Nenhum `console.log` permanece no arquivo
- Testes existentes de `pdfService` (se houver) continuam passando
