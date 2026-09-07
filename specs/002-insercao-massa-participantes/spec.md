# Feature Specification: Importação em Massa de Participantes (SSR)

**Feature Branch**: `002-insercao-massa-participantes`
**Created**: 2026-09-06
**Status**: Completed
**Input**: Requisito FR-63 adicionado à especificação funcional em docs/especificacoes.md

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Importação em massa de participantes na SSR (Priority: P1) 🎯 MVP

Como usuário autorizado (administrador ou gestor/monitor no escopo do seu evento), eu preciso importar múltiplos participantes de uma só vez colando texto de uma planilha ou enviando um arquivo CSV, para cadastrar participantes rapidamente sem ter que preencher o formulário individual repetidamente.

**Why this priority**: funcionalidade central solicitada pelos operadores do sistema para acelerar a entrada de dados em massa mantendo as validações e integridade de domínio existente.

**Independent Test**: com usuário autenticado e autorizado, acessar a interface SSR em `/admin/participantes/importar`, submeter dados via texto colado ou CSV contendo linhas válidas e inválidas, verificar que as linhas válidas são cadastradas ou vinculadas, as inválidas são reportadas por linha com feedback claro, e o CRUD individual permanece inalterado.

**Acceptance Scenarios**:

1. **Given** um usuário autorizado na tela de importação em massa SSR, **When** ele cola dados tabulares (ex.: colado do Google Sheets/Excel) ou faz upload de um arquivo CSV válido, **Then** o sistema processa cada linha, cadastra/vincula os participantes válidos e exibe resumo do lote.
2. **Given** um lote contendo linhas com erros de validação (e-mail inválido, campos obrigatórios ausentes), **When** a importação é submetida, **Then** o sistema realiza o processamento parcial, grava as linhas válidas e exibe relatório com a identificação e motivo do erro por linha.
3. **Given** uma linha da importação contendo o e-mail de um participante já cadastrado no sistema, **When** a importação é submetida no contexto de um evento, **Then** o sistema associa o participante existente ao evento sem duplicar o registro global do participante.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-63 / FR-001**: O sistema MUST permitir a inserção em massa de participantes pela interface SSR para usuários autorizados a gerenciar participantes.
- **FR-002**: O sistema MUST aceitar entrada de dados via texto colado da área de transferência (formato tabular TSV/CSV) ou via upload de arquivo CSV.
- **FR-003**: O sistema MUST processar e validar cada linha de forma independente, reutilizando os critérios de validação e regras de negócio existentes (FR-2, FR-3, FR-58, FR-59 e FR-61).
- **FR-004**: O sistema MUST suportar sucesso parcial na importação, garantindo que falhas em linhas específicas não cancelem o cadastramento das demais linhas válidas do lote.
- **FR-005**: O sistema MUST apresentar um relatório claro de resultado na tela SSR, detalhando a quantidade de registros importados com sucesso, novos vínculos criados e lista detalhada de erros identificados por linha.
- **FR-006**: O sistema MUST manter o CRUD individual de participantes funcionando sem qualquer regressão.

### Edge Cases

- Entrada contendo linhas em branco ou espaços adicionais deve ser tratada com normalização automática sem gerar falsos erros.
- Tentativa de enviar texto colado e arquivo CSV simultaneamente na mesma requisição deve ser tratada amigavelmente exigindo uma única fonte.
- Submissão com arquivo com encoding ou separador não usual (vírgula vs ponto-e-vírgula) deve ser tratada com resiliência pelo parser.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% das linhas válidas de um lote são processadas e persistem no banco de dados com vínculo correto ao evento.
- **SC-002**: 100% das linhas com erro recebem diagnóstico específico com número da linha e motivo da falha.
- **SC-003**: 0 regressão na funcionalidade pré-existente de cadastro, edição, listagem e exclusão individual de participantes.

