# TASK ID: SEG-LOG-001

## Título

Remover `console.log` com objeto completo de certificado de `pdfService.js`

## Tipo

código

## Dependências

nenhuma

## Objetivo

Remover a linha `console.log('PDFService certificado:', certificado)` (linha 14 de `src/services/pdfService.js`) que vaza dados pessoais do participante em stdout.

## Contexto

O log está envolvido em um commentário "// Log para depuração" e foi introduzido como auxílio ao desenvolvimento. Não tem valor operacional em produção. O objeto `certificado` contém nome, email (via Participante), dados dinâmicos e associações completas — todos dados pessoais conforme a LGPD.

A linha de remoção está dentro do callback de uma `new Promise((resolve, reject) => {...})`:

```js
// Log para depuração          ← remover comentário também
console.log('PDFService certificado:', certificado)   ← remover
```

## Arquivos envolvidos

- `src/services/pdfService.js` ← remover linhas 13-14 (comentário + console.log)

## Passos

1. Abrir `src/services/pdfService.js`
2. Localizar o bloco entre o `try {` e o `if (!certificado.codigo)` — está exatamente assim:

```js
try {
  // Log para depuração
  console.log('PDFService certificado:', certificado)
  if (!certificado.codigo) {
```

3. Remover as duas linhas do comentário e do `console.log`, resultando em:

```js
try {
  if (!certificado.codigo) {
```

4. **Não alterar mais nada** no arquivo nesta task — a substituição por log seguro é feita na SEG-LOG-002

## Resultado esperado

- Nenhum `console.log` no arquivo que referencie o objeto `certificado`
- A geração de PDF continua funcionando normalmente (o log não afetava a lógica)
- `npm run check` passa

## Critério de aceite

- `grep "console.log" src/services/pdfService.js` não retorna nenhuma linha
- `npm run check` passa
