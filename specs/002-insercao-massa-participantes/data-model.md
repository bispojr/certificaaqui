# Data Model - Importação em Massa de Participantes

## Escopo

Modelo conceitual para a nova interação SSR de importação em massa. Não há novas entidades persistentes; o fluxo reaproveita `Participante` e o vínculo de evento já existente na regra de negócio.

## Entidade: ImportacaoParticipantesRequest

Campos:

- `evento_id` (integer, obrigatório)
- `origem` (enum: `colado|csv`, obrigatório)
- `conteudo` (string, obrigatório quando `origem = colado`)
- `arquivoCsv` (arquivo, obrigatório quando `origem = csv`)
- `usuarioId` (integer, obrigatório)

Regras:

- O evento selecionado define o escopo da importação inteira.
- O conteúdo bruto pode vir de texto colado ou de um arquivo CSV, mas nunca dos dois ao mesmo tempo.

## Entidade: ImportacaoParticipanteLinha

Campos:

- `numeroLinha` (integer, obrigatório)
- `nomeCompleto` (string, obrigatório)
- `email` (string, obrigatório)
- `instituicao` (string, opcional)
- `status` (enum: `valida|invalida|processada`, obrigatório)
- `erros` (array<string>, obrigatório)

Regras:

- Cada linha é validada com as mesmas regras de criação individual.
- Linhas inválidas não interrompem o restante do lote.
- A linha deve ser associada ao `evento_id` escolhido no request.

## Entidade: ImportacaoParticipantesResultado

Campos:

- `totalLinhas` (integer, obrigatório)
- `linhasProcessadas` (integer, obrigatório)
- `criados` (integer, obrigatório)
- `vinculosCriados` (integer, obrigatório)
- `falhas` (integer, obrigatório)
- `errosPorLinha` (array<ImportacaoParticipanteLinha>, obrigatório)

Regras:

- O resultado final deve informar sucesso parcial de forma clara.
- O contador deve refletir tanto participantes novos quanto vínculos reaproveitados pelo lookup por e-mail.

## Relacionamentos

- `ImportacaoParticipantesRequest` produz `ImportacaoParticipanteLinha` em memória.
- `ImportacaoParticipanteLinha` reutiliza as regras de `Participante` e o vínculo de evento já estabelecido pela spec.
- `ImportacaoParticipantesResultado.errosPorLinha[]` referencia o conjunto de linhas processadas.

## Transições de Estado

### ImportacaoParticipanteLinha

- `valida -> processada` quando a criação unitária é concluída com sucesso.
- `valida -> invalida` quando falhar validação estrutural ou de negócio.
- `invalida -> processada` não ocorre; a linha inválida permanece reportada como erro.
