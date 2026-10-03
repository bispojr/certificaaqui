# Tasks: Configuração do Tamanho da Fonte do Texto-Base do Certificado

> Idioma obrigatório para este artefato: português brasileiro (pt-BR).

**Input**: Artefatos de especificação de `/specs/004-tamanho-fonte-texto-base/spec.md`

---

## Phase 1: Database & Model (Migração e Schema)

- [x] T001 Criar migration Sequelize para adicionar a coluna `texto_tamanho_fonte` (INTEGER, null) na tabela `eventos`.
- [x] T002 Atualizar o model `Evento` (`src/models/evento.js`) com a definição do campo `texto_tamanho_fonte`.
- [x] T003 Atualizar a validação Zod (`src/validators/evento.js`) para incluir `texto_tamanho_fonte` (inteiro, opcional, nulo).

---

## Phase 2: Backend & Controllers (SSR & API)

- [x] T004 Atualizar `src/controllers/eventoSSRController.js` para capturar `texto_tamanho_fonte` no tratamento dos campos de layout do body e sanitizá-lo para inteiro ou `null`.
- [x] T005 Atualizar `src/controllers/eventoController.js` para garantir suporte e persistência do campo na API REST se aplicável.

---

## Phase 3: Interface Web (SSR View)

- [ ] T006 Atualizar a view `views/admin/eventos/form.hbs` adicionando o campo de formulário para tamanho da fonte (`texto_tamanho_fonte`) na seção "Posição do texto-base no certificado".

---

## Phase 4: Serviço de PDF (PDFKit Rendering)

- [ ] T007 Atualizar `src/services/pdfService.js` para extrair `texto_tamanho_fonte` de `certificado.Evento`.
- [ ] T008 Implementar o uso de `doc.fontSize(tamanhoFonte)` em `src/services/pdfService.js`, aplicando fallback para `texto.length > 400 ? 10 : 14` quando `texto_tamanho_fonte` for nulo ou indefinido.

---

## Phase 5: Testes & Validação

- [ ] T009 Criar/atualizar testes em `tests/validators/evento.test.js`, `tests/controllers/eventoSSRController.test.js`, `tests/services/pdfService.test.js` e `tests/views/eventosView.test.js`.
- [ ] T010 Validar manualmente no ambiente de desenvolvimento a alteração do campo em `/admin/eventos/:id/editar` e a geração do PDF correspondente.
