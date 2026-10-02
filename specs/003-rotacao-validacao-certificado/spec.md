# Feature Specification: Configuração de Rotação da Caixa de Validação do Certificado

**Feature Branch**: `003-rotacao-validacao-certificado`  
**Created**: 2026-10-01  
**Status**: Completed  
**Input**: Requisito de customização visual para posicionamento e rotação da caixa de validação nos certificados por evento.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Configuração de rotação na view de evento e renderização no PDF (Priority: P1) 🎯 MVP

Como administrador ou gestor de evento, eu preciso configurar o ângulo de rotação (ex.: 0°, 90°, 180°, 270°) da caixa de texto de validação do certificado na tela de edição do evento, para que a mensagem de validação se adeque ao layout do template do certificado (ex.: bordas verticais ou laterais).

**Why this priority**: Permite flexibilidade de design nos templates de certificado sem exigir alteração manual no código-fonte para cada evento.

**Independent Test**:

1. Acessar a interface SSR de edição de evento (`/admin/eventos/:id/editar`).
2. Alterar o campo de rotação da validação para `90` graus (ou selecionar `90°`).
3. Salvar o formulário e verificar que o valor foi persistido.
4. Gerar/baixar o PDF de um certificado pertencente a este evento.
5. Confirmar visualmente no PDF gerado que a caixa de texto com o código de validação e link foi rotacionada em 90 graus em relação às coordenadas (X, Y) configuradas, mantendo os demais elementos (texto-base) na orientação normal.

**Acceptance Scenarios**:

1. **Given** um gestor na tela de criação ou edição de evento SSR (`views/admin/eventos/form.hbs`), **When** ele seleciona/informa um ângulo de rotação (ex.: 0°, 90°, 180°, 270°) para a caixa de validação e salva, **Then** o valor é persistido no banco de dados no campo `validacao_rotacao`.
2. **Given** um evento com `validacao_rotacao` configurado em `90` graus, **When** o PDF do certificado é gerado via `pdfService.js`, **Then** o PDFKit aplica a rotação de 90° ancorada no ponto `(validacao_x, validacao_y)` apenas para o bloco da validação, restaurando o contexto original para não afetar outros elementos.
3. **Given** um evento legado ou sem valor definido para `validacao_rotacao` (nulo ou indefindo), **When** o certificado é gerado, **Then** o sistema assume o valor padrão de `0` graus (sem rotação).

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O modelo `Evento` e a tabela `eventos` MUST conter a coluna `validacao_rotacao` (INTEGER, opcional, valor padrão `0`).
- **FR-002**: A view SSR de formulário de eventos (`views/admin/eventos/form.hbs`) MUST disponibilizar um campo de formulário (ex.: `<select>` com opções 0°, 90°, 180°, 270° ou campo numérico de graus) na seção "Posição da validação no certificado".
- **FR-003**: Os controladores de evento (`eventoSSRController.js` e `eventoController.js`) e os validadores Zod (`validators/evento.js`) MUST aceitar, validar e persistir o parâmetro `validacao_rotacao`.
- **FR-004**: O serviço de geração de PDF (`pdfService.js`) MUST ler a propriedade `validacao_rotacao` do evento e aplicar a rotação no PDFKit utilizando `doc.save()`, `doc.rotate(validacaoRotacao, { origin: [validacaoX, validacaoY] })` para o bloco de validação, seguido obrigatoriamente por `doc.restore()`.

### Non-Functional & Architecture Requirements

- **NFR-001**: Migração isolada de banco de dados (`sequelize-cli`) para adição da coluna `validacao_rotacao` na tabela `eventos`.
- **NFR-002**: Isolamento de efeito colateral: o uso de `doc.rotate()` no PDFKit DEVE ser envolvido por `doc.save()` e `doc.restore()` para garantir que a rotação afete exclusivamente a caixa de texto de validação.

---

## Data Model Changes

### Tabela `eventos`

Adição do campo:

- `validacao_rotacao`: `INTEGER` (permite nulo, `defaultValue: 0`).

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% dos eventos editados com novos valores de rotação persistem e exibem a rotação selecionada no formulário de evento SSR.
- **SC-002**: Os PDFs gerados refletem a rotação configurada exatamente no bloco de validação sem alterar o posicionamento nem a rotação do texto principal do certificado.
- **SC-003**: 0 quebra em eventos existentes (garantia de fallback para `0` graus na ausência do campo).
