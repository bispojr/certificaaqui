# Feature Specification: Configuração do Tamanho da Fonte do Texto-Base do Certificado

**Feature Branch**: `004-tamanho-fonte-texto-base`  
**Created**: 2026-10-02  
**Status**: Specified  
**Input**: Requisito de customização visual para tamanho da fonte do texto-base nos certificados por evento no formulário de edição de evento (`/admin/eventos/:id/editar`).

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Configuração do tamanho da fonte do texto-base na view de evento e renderização no PDF (Priority: P1) 🎯 MVP

Como administrador ou gestor de evento, eu preciso configurar o tamanho da fonte do texto-base (ex.: 12pt, 14pt, 16pt) na tela de edição do evento (`/admin/eventos/:id/editar`), para que a formatação e visualização do texto principal se adeqüem ao layout do template de fundo do certificado.

**Why this priority**: Permite ajustar a escala tipográfica do texto principal para diferentes templates gráficos de certificado sem depender de cálculo automático fixo ou alteração manual no código-fonte.

**Independent Test**:

1. Acessar a interface SSR de edição de evento (`/admin/eventos/:id/editar`).
2. Alterar o campo de tamanho da fonte do texto-base para um valor específico (ex.: `16`).
3. Salvar o formulário e verificar que o valor foi persistido e permanece preenchido ao reabrir a edição.
4. Gerar/baixar o PDF de um certificado pertencente a este evento via `/api/certificados/:id/pdf`.
5. Confirmar que o PDFKit renderiza o bloco de texto-base com o tamanho de fonte configurado (16pt).
6. Limpar o campo (deixando-o vazio/nulo) e verificar que o PDF é gerado com o fallback padrão (cálculo dinâmico baseado em tamanho do texto: 10pt se > 400 caracteres, senão 14pt).

**Acceptance Scenarios**:

1. **Given** um gestor na tela de criação ou edição de evento SSR (`views/admin/eventos/form.hbs`), **When** ele informa um valor inteiro para o tamanho da fonte do texto-base (ex.: 16) e salva, **Then** o valor é persistido no banco de dados na coluna `texto_tamanho_fonte`.
2. **Given** um evento com `texto_tamanho_fonte` configurado em `16`, **When** o PDF do certificado é gerado via `pdfService.js`, **Then** o PDFKit aplica `doc.fontSize(16)` especificamente para a renderização do bloco de texto-base.
3. **Given** um evento sem valor definido para `texto_tamanho_fonte` (nulo ou indefinido), **When** o certificado é gerado, **Then** o sistema utiliza o comportamento legado padrão de fallback dinâmico: `texto.length > 400 ? 10 : 14`.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O modelo `Evento` e a tabela `eventos` MUST conter a coluna `texto_tamanho_fonte` (INTEGER, opcional, permitindo valor nulo).
- **FR-002**: A view SSR de formulário de eventos (`views/admin/eventos/form.hbs`) MUST disponibilizar um campo de formulário numérico `<input type="number">` com `name="texto_tamanho_fonte"`, `id="texto_tamanho_fonte"`, `min="6"`, `max="72"`, e placeholder indicativo (ex.: `Ex.: 14`) na seção "Posição do texto-base no certificado".
- **FR-003**: Os controladores de evento (`eventoSSRController.js` e `eventoController.js`) e os validadores Zod (`validators/evento.js`) MUST aceitar, sanitizar (conversão para inteiro ou `null`) e persistir o parâmetro `texto_tamanho_fonte`.
- **FR-004**: O serviço de geração de PDF (`pdfService.js`) MUST ler a propriedade `texto_tamanho_fonte` de `certificado.Evento`. Se informada (número positivo), deve ser usada em `doc.fontSize(...)`; se nula ou indefinida, deve aplicar o fallback `texto.length > 400 ? 10 : 14`.

### Non-Functional & Architecture Requirements

- **NFR-001**: Migração isolada de banco de dados (`sequelize-cli`) para adição da coluna `texto_tamanho_fonte` na tabela `eventos`.
- **NFR-002**: Garantia de não regressão: a alteração do tamanho da fonte do texto-base DEVE afetar exclusivamente o bloco de texto-base, mantendo inalterados a caixa de validação (9.5pt) e os demais parâmetros de layout (`texto_x`, `texto_y`, `validacao_x`, `validacao_y`, `validacao_rotacao`).

---

## Data Model Changes

### Tabela `eventos`

Adição do campo:

- `texto_tamanho_fonte`: `INTEGER` (permite nulo, `allowNull: true`).

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% dos eventos editados em `/admin/eventos/:id/editar` com novos valores de tamanho da fonte persistem o valor no banco e exibem o valor preenchido no formulário.
- **SC-002**: Os PDFs gerados refletem o tamanho de fonte configurado para o texto-base sem alterar a posição nem a rotação/tamanho da caixa de validação.
- **SC-003**: 0 quebra em eventos existentes (garantia de fallback dinâmico `texto.length > 400 ? 10 : 14` na ausência do campo).
