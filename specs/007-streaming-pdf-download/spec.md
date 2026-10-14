# Feature Specification: Streaming de Download de PDF de Certificados

> Idioma obrigatório para este artefato: português brasileiro (pt-BR), com ortografia oficial, acentuação e cedilha preservadas.

**Feature Branch**: `007-streaming-pdf-download`  
**Created**: 2026-10-14  
**Status**: Specified  
**Input**: Requisito de estabilização de infraestrutura decorrente de estouros de memória (OOM — *Out of Memory*) no Render durante o download de PDFs (`GET /api/certificados/:id/pdf`), substituindo integralmente a geração em buffer na memória heap pelo streaming direto da resposta HTTP via PDFKit (`doc.pipe(res)`), em conformidade com as diretrizes do `docs/especificacoes.md` (FR-23b, FR-42, FR-47, FR-47b, FR-47c, FR-47d, NFR-6) e o ADR 008.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Download de Certificado Emitido via Stream sem Acúmulo de Memória (Priority: P1) 🎯 MVP

Como participante ou usuário público com acesso a um certificado emitido, eu quero baixar o arquivo PDF correspondente através da rota `GET /api/certificados/:id/pdf`, recebendo o conteúdo transmitido diretamente via streaming HTTP, para que o documento seja baixado com agilidade e o servidor não sofra picos de uso de memória RAM que possam derrubar a aplicação.

**Why this priority**: É a rota pública de download de certificados em produção, alvo direto das notificações de estouro de memória no Render quando múltiplos downloads concorrentes acontecem ou arquivos de template pesados são processados.

**Independent Test**:
1. Emitir uma requisição `GET /api/certificados/:id/pdf` para um certificado existente com status `"emitido"`.
2. Verificar que a resposta HTTP possui status `200`, `Content-Type: application/pdf`, `Content-Disposition: inline; filename=certificado-{id}.pdf` e transmissão em streaming contínuo.
3. Confirmar que o conteúdo recebido inicia com os bytes canônicos de PDF (`%PDF-1.3` ou superior) e abre perfeitamente em visualizadores de PDF.
4. Monitorar que nenhum `Buffer.concat` com o arquivo completo é mantido em memória pelo serviço durante o envio.

**Acceptance Scenarios**:
1. **Given** um certificado com status `"emitido"`, **When** um cliente HTTP não autenticado realiza `GET /api/certificados/:id/pdf`, **Then** o sistema gera o PDF on-the-fly via PDFKit e o transmite por streaming diretamente para a resposta `res`, finalizando com status `200`.
2. **Given** um certificado com status `"pendente"` ou `"cancelado"`, **When** um usuário não autenticado tenta acessar `GET /api/certificados/:id/pdf`, **Then** o sistema nega a requisição retornando HTTP 404 antes de iniciar qualquer pipeline ou stream de geração gráfica de PDF (respeitando FR-23b).
3. **Given** um certificado com status `"pendente"` ou `"cancelado"`, **When** um usuário autenticado com perfil `admin` (ou `gestor` do respectivo evento) acessa a rota, **Then** o stream do PDF é gerado e transmitido com sucesso.

---

### User Story 2 - Resiliência e Liberação de Recursos em Erros ou Abortos do Cliente (Priority: P2)

Como mantenedor da infraestrutura, eu quero que conexões interrompidas prematuramente (quando o cliente fecha a aba ou cancela o download) ou falhas durante a composição do documento encerrem e destruam o fluxo do PDFKit imediatamente, para que o servidor não continue alocando buffers nem executando processamento órfão em segundo plano.

**Why this priority**: Evita vazamento de memória e processamento inútil quando usuários fecham o navegador antes do término do download ou ocorrem falhas parciais de rede.

**Independent Test**:
1. Iniciar o download de um PDF e abortar a requisição HTTP pelo cliente no meio da transmissão.
2. Confirmar que o evento `close`/`aborted` do stream HTTP dispara o encerramento do stream do PDFKit (`doc.destroy()` / cleanup).
3. Testar a ocorrência de erro de validação interna no service antes da transmissão dos cabeçalhos, confirmando envio de JSON com status 500 sem deixar streams abertos.

**Acceptance Scenarios**:
1. **Given** uma requisição de download de PDF em andamento, **When** o cliente aborta a conexão TCP prematuramente, **Then** o serviço de PDF captura o encerramento e interrompe o pipeline do PDFKit liberando os manipuladores de eventos e referências em memória.
2. **Given** uma falha irrecuperável antes de os cabeçalhos HTTP serem enviados (ex.: dados inválidos no modelo ou tipo sem texto-base), **When** a rota processa a exceção, **Then** é retornado HTTP 500 com JSON descritivo sem corromper o stream de saída.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O serviço de PDF (`src/services/pdfService.js`) MUST fornecer o método de streaming `streamCertificadoPdf(certificado, writableStream)` que canalize o documento PDFKit diretamente para o stream de destino utilizando `doc.pipe(writableStream)`, invocando `doc.end()` e gerenciando adequadamente o ciclo de vida e erros do stream.
- **FR-002**: O endpoint `GET /api/certificados/:id/pdf` em `src/routes/api.js` MUST configurar os cabeçalhos HTTP adequados (`Content-Type: application/pdf`, `Content-Disposition: inline; filename=certificado-${id}.pdf`) e utilizar exclusivamente o método de streaming `streamCertificadoPdf` para responder à requisição.
- **FR-003**: O serviço `src/services/pdfService.js` NÃO DEVE manter métodos legados que gerem ou acumulem o arquivo completo como `Buffer` na memória heap (`Buffer.concat`), consolidando uma única API pública baseada em streams e eliminando código morto.
- **FR-004**: O sistema MUST preservar integralmente as regras de autorização de download definidas em **FR-23b**: certificados `"pendente"` ou `"cancelado"` só iniciam a geração para `admin` ou `gestor` do escopo do evento; caso contrário, retornam HTTP 404 sem alocar nenhum recurso de PDF.
- **FR-005**: O sistema MUST preservar integralmente a conformidade visual e funcional dos certificados (**FR-47**, **FR-47b**, **FR-47c**, **FR-47d**): tamanho A4 paisagem, template de fundo do R2, fonte Lato-Medium (com fallback Helvetica), parâmetros posicionais (`texto_x/y`, `texto_tamanho_fonte`, `validacao_x/y`, `validacao_rotacao`) e link com código de validação.

### Non-Functional & Architecture Requirements

- **NFR-001 (Consumo de Memória)**: A rota de geração de PDF não deve acumular chunks binários em array de Buffers na memória heap da aplicação. O consumo de RAM por requisição de PDF deve ser limitado ao buffer de transporte do Node.js/TCP.
- **NFR-002 (Arquitetura e Contrato)**: Alinhamento com a diretriz do ADR 008 (*Geração on-the-fly sem persistência*), consolidando a intenção original de envio direto como stream HTTP.
- **NFR-003 (Limpeza e Fechamento de Streams)**: Em caso de falha ou cancelamento (`res.on('close')`), o stream de leitura do PDFKit deve ser finalizado e desvinculado para prevenir memory leaks e referências órfãs no Garbage Collector da V8.
- **NFR-004 (Adequação da Suíte de Testes)**: Toda a suíte de testes unitários (`tests/services/pdfService.test.js`) e testes de rota (`tests/routes/api.test.js`) deve ser atualizada para testar diretamente o contrato de streaming com streams em memória (`stream.PassThrough`), garantindo que os testes reflitam rigorosamente o comportamento de produção.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: O endpoint `GET /api/certificados/:id/pdf` responde via streaming com `Content-Type: application/pdf` sem alocar buffers unificados em RAM.
- **SC-002**: Sob testes de carga concorrente ou downloads repetidos, o consumo de memória RAM do processo Node.js permanece estável sem disparar o limite de 512 MB do Render.
- **SC-003**: 100% dos testes unitários e de integração refatorados passam com sucesso (`npm run test:ci`).
- **SC-004**: Os PDFs transmitidos por streaming são byte a byte funcionalmente idênticos aos gerados pelo fluxo anterior (mesmo layout, textos, fontes, rotações e links).

---

## Assumptions

- O cliente HTTP que consome `/api/certificados/:id/pdf` aceita respostas em streaming padrão do protocolo HTTP/1.1 (Chunked transfer encoding).
- O ambiente do Render continuará operando com limites de memória padrão do plano web service, beneficiando-se imediatamente da eliminação do acúmulo de buffers.
