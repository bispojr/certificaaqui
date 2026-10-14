# Tasks: Streaming de Download de PDF de Certificados

> Idioma obrigatório para este artefato: português brasileiro (pt-BR).

**Input**: Artefatos de especificação de `/specs/007-streaming-pdf-download/spec.md`

---

## Phase 1: Serviço de PDF (`src/services/pdfService.js`)

- [x] T001 Implementar o método `streamCertificadoPdf(certificado, writableStream)` em `src/services/pdfService.js` canalizando a renderização diretamente com `doc.pipe(writableStream)` e invocando `doc.end()`.
- [x] T002 Remover o método antigo `generateCertificadoPdf` e a acumulação em `Buffer.concat(buffers)`, eliminando o código legado e retenção de buffers na memória.
- [x] T003 Implementar tratamento de erros e cleanup no pipeline do stream para garantir que o `PDFDocument` seja fechado/destruído em caso de exceção ou interrupção.

---

## Phase 2: Rota HTTP (`src/routes/api.js`)

- [x] T004 Atualizar a rota `GET /api/certificados/:id/pdf` para configurar os headers HTTP (`Content-Type: application/pdf`, `Content-Disposition`) e invocar `pdfService.streamCertificadoPdf(certificado, res)`.
- [x] T005 Monitorar o evento de encerramento da conexão pelo cliente (`res.on('close')`) para interromper o stream do PDFKit caso o download seja cancelado no meio do envio.
- [x] T006 Garantir o fluxo de erro: retornar HTTP 404 para status não autorizados antes do stream (conforme FR-23b) e tratar falhas antes do envio dos headers.

---

## Phase 3: Atualização da Suíte de Testes

- [ ] T007 Refatorar os testes unitários em `tests/services/pdfService.test.js` para chamar diretamente `streamCertificadoPdf`, utilizando streams em memória (`stream.PassThrough`), testando chunks, eventos de conclusão, tratamento de erro e asserções visuais.
- [ ] T008 Atualizar os testes de integração em `tests/routes/api.test.js` para validar o download via streaming HTTP e os cabeçalhos da resposta.
- [ ] T009 Executar toda a suíte de testes (`npm run test:ci`) para garantir 100% de cobertura e zero regressão.
