# Pesquisa - FR-63 - Importação em Massa de Participantes

## Objetivo

Definir o menor conjunto de mudanças para incorporar a inserção em massa de participantes na SSR, reaproveitando o CRUD unitário e preservando as regras já consolidadas de validação, escopo e soft delete.

## Decisão 1: Reutilizar a criação unitária existente

- Decision: a importação em massa deve chamar o caminho atual de criação de participante linha a linha, em vez de duplicar regras de negócio.
- Rationale: o service atual já centraliza `create`, validação e escopo; reutilizá-lo reduz divergência e mantém FR-2/FR-3/FR-58/FR-59/FR-61 coerentes.
- Alternatives considered:
  - Criar um fluxo paralelo de persistência para importação: rejeitado por duplicar validação e aumentar risco de inconsistência.
  - Fazer `bulkCreate` direto no controller: rejeitado por contornar as regras de negócio existentes.

## Decisão 2: Aceitar duas origens de entrada na SSR

- Decision: suportar duas entradas de importação no painel de participantes: texto colado da área de transferência e arquivo CSV.
- Rationale: cobre os dois usos citados no requisito sem alterar a experiência do CRUD individual.
- Alternatives considered:
  - Suportar apenas CSV: rejeitado por não cobrir o caso de colagem do Google Sheets.
  - Suportar apenas colagem: rejeitado por não cobrir o upload de CSV solicitado.

## Decisão 3: Processamento linha a linha com sucesso parcial

- Decision: cada linha deve ser validada e processada de forma independente, com relatório de erros por linha e sem abortar o lote inteiro.
- Rationale: o requisito explicitamente pede que linhas inválidas não impeçam as válidas; isso favorece usabilidade e reduz retrabalho.
- Alternatives considered:
  - Transação única para o lote inteiro: rejeitada porque um erro isolado bloquearia os registros válidos.
  - Ignorar linhas inválidas sem relatório: rejeitado por reduzir rastreabilidade para o usuário.

## Decisão 4: Importação sem nova persistência

- Decision: não criar nova tabela para lotes de importação; o resultado pode ser calculado em memória e apresentado na resposta SSR.
- Rationale: a feature é operacional e transitória; a persistência adicional não é necessária para cumprir FR-63.
- Alternatives considered:
  - Registrar lotes de importação no banco: rejeitado por aumentar o escopo sem ganho funcional imediato.

## Decisão 5: Testes focados na borda nova

- Decision: escrever testes unitários para normalização/parsing e testes de integração/SSR para o fluxo de importação, preservando os testes existentes de CRUD.
- Rationale: a maior superfície de risco está na transformação da entrada e na orquestração do controller.
- Alternatives considered:
  - Cobrir apenas o controller com mocks: rejeitado por não validar o comportamento do parser.
  - Cobrir apenas a UI: rejeitado por não verificar as regras de linha e os relatórios parciais.

## Clarificações pendentes

Nenhuma. O FR-63 já define a extensão necessária para o escopo atual.
