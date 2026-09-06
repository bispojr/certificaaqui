# Quickstart - Importação em Massa de Participantes

## Objetivo

Entregar o FR-63 com o menor delta possível: adicionar um fluxo SSR de importação em massa e validar que o CRUD individual continua funcionando sem regressão.

## Pré-requisitos

1. Estar na branch da feature.
2. Ler `docs/especificacoes.md`, `plan.md`, `research.md`, `data-model.md` e `contracts/importacao-participantes-ssr.md`.
3. Garantir ambiente de testes funcional (Jest + Playwright).

## Sequência Recomendada

1. Criar testes do parser/normalizador de entrada para colagem e CSV.
2. Criar testes do service de importação garantindo sucesso parcial por linha.
3. Criar testes do controller SSR e da nova rota de importação.
4. Atualizar a view de participantes com área de colagem/upload e feedback do resultado.
5. Executar a suíte específica da feature e depois `npm run check`.

## Estratégia de Validação

### Unit

- Validar separação de linhas, cabeçalhos e mapeamento para `nomeCompleto`, `email` e `instituicao`.
- Validar que linhas inválidas são reportadas sem interromper o processamento.
- Validar reaproveitamento da criação unitária existente.

### Integration

- Exercitar `POST` SSR de importação com payload colado e com CSV.
- Confirmar que o resultado final contabiliza criados, vínculos reaproveitados e falhas.

### E2E

- Fluxo completo na tela de participantes com colagem de planilha e submissão do formulário.
- Regredir o CRUD atual de participantes para garantir que a nova interface não quebra as ações existentes.

## Comandos de Verificação (referência)

```bash
npm test -- --testPathPattern=tests/services
npm test -- --testPathPattern=tests/controllers
npm test -- --testPathPattern=tests/integration
npx playwright test
npm run check
```

## Critério de Pronto para /speckit.tasks

- Contrato de importação SSR documentado.
- Modelo conceitual e decisões de parser/feedback fechados.
- Testes de importação cobrindo sucesso parcial e validação por linha.
- Sem regressão do CRUD unitário existente.
