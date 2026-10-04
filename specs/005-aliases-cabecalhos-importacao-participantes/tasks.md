# Tasks: Reconhecimento Flexível e Aliases de Cabeçalhos na Importação em Massa de Participantes

> Idioma obrigatório para este artefato: português brasileiro (pt-BR).

**Input**: Artefatos de especificação de `/specs/005-aliases-cabecalhos-importacao-participantes/spec.md`

---

## Phase 1: Engine de Normalização e Aliases Declarativos

- [x] T001 Criar o módulo declarativo de aliases e normalização de cabeçalhos (`src/utils/cabecalhosParticipante.js` ou helper equivalente) contendo:
  - Configuração declarativa `CAMPOS_PARTICIPANTE` para `nomeCompleto`, `email` e `instituicao`.
  - Função `normalizarCabecalho(valor)` (NFD, remoção de diacríticos, lowercase, trim, múltiplos espaços).
  - Função `validarAliases(config)` contra ambiguidades entre campos.
  - Função `identificarCampo(cabecalho)` para resolução dinâmica do campo interno.

---

## Phase 2: Integração com o Serviço de Importação

- [x] T002 Atualizar `src/services/participanteImportService.js` para utilizar a função `identificarCampo(cabecalho)` no processamento das colunas.
- [x] T003 Mapear dinamicamente os cabeçalhos brutos da primeira linha (CSV e texto colado) para os nomes internos dos campos (`nomeCompleto`, `email`, `instituicao`) de forma transparente antes da validação do schema Zod.

---

## Phase 3: Testes Unitários e de Integração

- [x] T004 Criar suíte de testes unitários para a especificação de aliases e a normalização de cabeçalhos (ex.: `tests/utils/cabecalhosParticipante.test.js` ou `tests/services/participanteImportService.test.js`):
  - Testes parametrizados para `normalizarCabecalho` (verificando caixa, acentos, hífens, espaços extras).
  - Testes parametrizados para `identificarCampo` (garantindo que todos os aliases mapeiam para os campos corretos).
  - Teste de exceção para `validarAliases` com configurações ambíguas.
- [x] T005 Atualizar/ampliar os testes de integração em `tests/services/participanteImportService.test.js` e `tests/e2e/participantes-importacao.spec.js` para submeter CSV e textos colados utilizando variações de cabeçalhos (ex.: `Nome`, `E-mail`, `INSTITUIÇÃO DE ENSINO`).

---

## Phase 4: Validação Final e Paridade

- [ ] T006 Garantir paridade total no processamento entre arquivos CSV e dados colados (TSV).
- [ ] T007 Executar a suíte de testes do Jest e Playwright para verificar 0 regressão na importação em massa de participantes.

