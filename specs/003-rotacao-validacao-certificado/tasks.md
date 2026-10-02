# Tasks: Configuração de Rotação da Caixa de Validação do Certificado

> Idioma obrigatório para este artefato: português brasileiro (pt-BR).

**Input**: Artefatos de especificação de `/specs/003-rotacao-validacao-certificado/spec.md`

---

## Phase 1: Database & Model (Migração e Schema)

- [x] T001 Criar migration Sequelize para adicionar a coluna `validacao_rotacao` (INTEGER, null, default 0) na tabela `eventos`.
- [x] T002 Atualizar o model `Evento` (`src/models/evento.js`) com a definição do campo `validacao_rotacao`.
- [x] T003 Atualizar a validação Zod (`src/validators/evento.js`) para incluir `validacao_rotacao` (inteiro, opcional, padrão 0).

---

## Phase 2: Backend & Controllers (SSR & API)

- [x] T004 Atualizar `src/controllers/eventoSSRController.js` para capturar `validacao_rotacao` do body da requisição e salvar no modelo.
- [x] T005 Atualizar `src/controllers/eventoController.js` para garantir suporte ao campo na API REST se aplicável.

---

## Phase 3: Interface Web (SSR View)

- [x] T006 Atualizar a view `views/admin/eventos/form.hbs` adicionando o campo de formulário para seleção da rotação (ex.: 0°, 90°, 180°, 270°) na seção "Posição da validação no certificado".

---

## Phase 4: Serviço de PDF (PDFKit Rendering)

- [x] T007 Atualizar `src/services/pdfService.js` para extrair `validacao_rotacao` de `certificado.Evento`.
- [x] T008 Implementar o bloco `doc.save()`, `doc.rotate(validacaoRotacao, { origin: [validacaoX, validacaoY] })`, renderização do texto de validação e `doc.restore()` em `src/services/pdfService.js`.

---

## Phase 5: Testes & Validação

- [x] T009 Criar/atualizar testes unitários em `tests/services/pdfService.test.js` ou `tests/controllers/eventoSSRController.test.js` cobrindo a rotação.
- [x] T010 Validar manualmente a emissão de PDF com rotação de 0°, 90°, 180° e 270°.
