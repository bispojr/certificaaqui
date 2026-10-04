# Feature Specification: Reconhecimento Flexível e Aliases de Cabeçalhos na Importação em Massa de Participantes

**Feature Branch**: `005-aliases-cabecalhos-importacao-participantes`  
**Created**: 2026-10-03  
**Status**: Specified  
**Input**: Especificação declarativa de aliases e normalização de cabeçalhos para inserção em lote de participantes (CSV e texto colado/TSV).

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Reconhecimento flexível e tolerante de cabeçalhos em lote (Priority: P1) 🎯 MVP

Como usuário autorizado (administrador ou gestor/monitor de evento), eu preciso importar participantes colando dados de planilhas (Excel, Google Sheets) ou enviando arquivos CSV cujos cabeçalhos contenham variações de caixa (maiúsculas/minúsculas), acentuação, espaços extras ou sinônimos semânticos comuns (ex.: "Nome", "E-mail", "Instituição de Ensino"), para que o sistema reconheça automaticamente as colunas sem exigir formatação manual estrita.

**Why this priority**: Aumenta a usabilidade e reduz erros de importação causados por divergências de formatação nos cabeçalhos gerados por softwares de planilha ou colados pelos usuários.

**Independent Test**:

1. Preparar um arquivo CSV ou texto colado com cabeçalhos variados como: `NOME COMPLETO`, `E-Mail`, `INSTITUIÇÃO DE ENSINO` ou `nome`, `e mail`, `instituição`.
2. Acessar a interface de importação em massa (`/admin/participantes/importar`).
3. Submeter os dados tanto via formulário colado (TSV) quanto via arquivo CSV.
4. Verificar se o sistema mapeia corretamente a coluna `nome` ou `NOME COMPLETO` para `nomeCompleto`, `E-mail` para `email`, e `INSTITUIÇÃO` para `instituicao`.
5. Verificar se todos os registros válidos são importados com sucesso e vinculados ao evento.

**Acceptance Scenarios**:

1. **Given** um arquivo CSV ou texto colado contendo cabeçalhos válidos com variações de caixa e acentuação (ex.: `Nome Completo`, `E-mail`, `Instituição`), **When** a importação é executada, **Then** o sistema normaliza os cabeçalhos e mapeia corretamente para os campos internos `nomeCompleto`, `email` e `instituicao`.
2. **Given** uma planilha que utiliza o alias semântico `nome` no lugar de `nomeCompleto`, **When** a importação é submetida (CSV ou colado), **Then** a coluna `nome` é interpretada como o campo `nomeCompleto`.
3. **Given** uma importação via CSV e outra via colagem contendo a mesma estrutura de cabeçalhos alternativos, **When** ambas são submetidas, **Then** ambas utilizam exatamente o mesmo resolvedor central de cabeçalhos, garantindo paridade de comportamento entre os dois fluxos.
4. **Given** uma configuração de aliases onde um mesmo alias normalizado é associado a mais de um campo interno (ex.: ambiguidade entre `nomeCompleto` e outro campo futuro `responsavel`), **When** o serviço de importação é inicializado ou validado, **Then** o sistema lança uma exceção impedindo a execução com aliases ambíguos.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST manter uma especificação declarativa de campos e seus respectivos aliases semânticos (`CAMPOS_PARTICIPANTE`) para a importação em lote de participantes.
- **FR-002**: Os campos suportados e seus aliases semânticos base MUST incluir:
  - `nomeCompleto`: `['nomeCompleto', 'nome completo', 'nome']`
  - `email`: `['email', 'e-mail', 'e mail']`
  - `instituicao`: `['instituicao', 'instituição', 'instituição de ensino', 'instituicao de ensino', 'instituição/empresa', 'instituicao/empresa']`
- **FR-003**: O sistema MUST implementar uma função de normalização de cabeçalhos (`normalizarCabecalho`) que:
  - Remove acentos e diacríticos (NFD + regex `[\u0300-\u036f]`).
  - Converte para minúsculas (`toLowerCase`).
  - Remove espaços nas extremidades (`trim`).
  - Consolida múltiplos espaços consecutivos em um único espaço (`replace(/\s+/g, ' ')`).
- **FR-004**: O sistema MUST gerar dinamicamente o mapa invertido de aliases normalizados para campos internos (`ALIAS_PARA_CAMPO`), evitando a manutenção manual redundante de combinações de maiúsculas/minúsculas e acentos.
- **FR-005**: O sistema MUST validar a integridade da lista de aliases (`validarAliases`), detectando e rejeitando qualquer alias que esteja associado a múltiplos campos internos.
- **FR-006**: O serviço de importação (`participanteImportService.js`) MUST utilizar este resolvedor único de cabeçalhos de forma compartilhada tanto para o fluxo de arquivo CSV quanto para o fluxo de texto colado (TSV).
- **FR-007**: Cabeçalhos não reconhecidos pelo resolvedor MUST ser ignorados ou mantidos sem quebrar o mapeamento dos campos válidos identificados.

### Non-Functional & Architecture Requirements

- **NFR-001**: **Arquitetura Declarativa e Desacoplada**: A definição de aliases e a lógica de normalização devem ser isoladas em um módulo reutilizável/testável (ex.: `src/utils/cabecalhosParticipante.js` ou em módulo auxiliar do serviço de importação).
- **NFR-002**: **Paridade de Fluxos**: O parser de CSV e o parser de texto colado DEVEM consumir exatamente a mesma função `identificarCampo(cabecalho)`.
- **NFR-003**: **Testabilidade Dividida por Responsabilidade**: Os testes unitários (Jest) devem ser explicitamente divididos em:
  1. Teste da especificação de aliases (garantindo o contrato de aliases semânticos).
  2. Teste da função de normalização (garantindo equivalência visual, espaços, acentos e caixa).

---

## Data Model & Architecture Changes

### Mapeamento Declarativo de Campos e Aliases

```js
const CAMPOS_PARTICIPANTE = {
  nomeCompleto: {
    aliases: ['nomeCompleto', 'nome completo', 'nome'],
  },
  email: {
    aliases: ['email', 'e-mail', 'e mail'],
  },
  instituicao: {
    aliases: [
      'instituicao',
      'instituição',
      'instituição de ensino',
      'instituicao de ensino',
      'instituição/empresa',
      'instituicao/empresa',
    ],
  },
}
```

### Pipeline de Normalização e Resolução

1. **Normalização**:

   ```js
   function normalizarCabecalho(valor) {
     if (typeof valor !== 'string') return ''
     return valor
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '')
       .trim()
       .toLowerCase()
       .replace(/\s+/g, ' ')
   }
   ```

2. **Validação de Ambiguidades**:

   ```js
   function validarAliases(config) {
     const aliases = new Map()

     for (const [campo, { aliases: lista }] of Object.entries(config)) {
       for (const alias of lista) {
         const normalizado = normalizarCabecalho(alias)

         if (aliases.has(normalizado)) {
           throw new Error(
             `Alias "${alias}" está associado a mais de um campo: ${aliases.get(normalizado)} e ${campo}`,
           )
         }

         aliases.set(normalizado, campo)
       }
     }
   }
   ```

3. **Construção Dinâmica do Mapa Invertido**:

   ```js
   validarAliases(CAMPOS_PARTICIPANTE)

   const ALIAS_PARA_CAMPO = Object.entries(CAMPOS_PARTICIPANTE)
     .flatMap(([campo, config]) =>
       config.aliases.map((alias) => [normalizarCabecalho(alias), campo]),
     )
     .reduce((mapa, [alias, campo]) => {
       mapa[alias] = campo
       return mapa
     }, {})

   function identificarCampo(cabecalho) {
     return ALIAS_PARA_CAMPO[normalizarCabecalho(cabecalho)] || null
   }
   ```

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% das variações de caixa (ex.: `NOME COMPLETO`, `Nome Completo`, `nome completo`), acentuação (`instituição` vs `instituicao`) e hífens/espaços (`e-mail` vs `email` vs `e mail`) para os campos suportados são resolvidas corretamente para os campos internos `nomeCompleto`, `email` e `instituicao`.
- **SC-002**: 100% das importações via CSV e colagem compartilham o mesmo mecanismo de resolução de cabeçalhos sem divergências.
- **SC-003**: 0 regressões nas importações existentes que já utilizavam os cabeçalhos padrão `nomeCompleto`, `email`, `instituicao`.
- **SC-004**: Cobertura de testes unitários cobrindo separadamente as regras de normalização de strings e a matriz de aliases declarados.
