# Critérios de Depreciação do Adaptador Legado de Principal

**Escopo:** Onda 1 — contrato canônico de principal autenticado
**Item legado:** `LEG-PRINCIPAL-001`
**Owner:** arquitetura de segurança
**Status:** ativo durante a convivência controlada
**Prazo alvo de retirada:** Onda 4

## Objetivo

O adaptador legado existe apenas para permitir convivência temporária com consumidores ainda não migrados para o contrato canônico. Ele não pode ser tratado como fonte primária de identidade nem reintroduzir dependência de ORM no principal autenticado.

## Critérios para manter o adaptador ativo

1. Existem consumidores legados ainda lendo `req.usuario` com expectativa de flags derivadas ou método `getEventos()`.
2. O contrato canônico já está materializado em API e SSR por meio de `req.principal`.
3. O adaptador não altera decisão de autenticação nem alarga escopo de autorização.
4. A cobertura unitária, de integração e e2e da Onda 1 permanece verde.

## Critérios obrigatórios para remoção

1. Nenhum consumidor ativo depende de `req.usuario` como fonte de principal autenticado.
2. Todos os fluxos autenticados consultam `req.principal` ou o contexto canônico de autorização.
3. Os testes de contrato da Onda 1 permanecem verdes após a remoção do adaptador.
4. A auditoria da Onda 1 registra zero uso funcional do fallback legado nas operações críticas mapeadas.

## Regras de convivência

1. O adaptador pode ser usado apenas como ponte temporária, nunca como contrato de negócio.
2. O adaptador não pode inferir permissões; somente espelhar o principal canônico em formato legado.
3. O fallback de `getEventos()` deve ser tratado como compatibilidade transitória, não como mecanismo de segurança.

## Sinalizadores de depreciação

| Sinalizador | Condição |
| --- | --- |
| `legacyConsumersRemaining` | Zero consumidores críticos ainda dependem da visão legada |
| `principalCanonicalCoverage` | API e SSR já materializam `subjectId`, `role`, `authChannel` e `tenantScopeMode` |
| `waveExitReady` | Testes unit, integration e e2e da Onda 1 aprovados |

## Critério final de saída

O adaptador deve ser removido quando o estado `waveExitReady` for verdadeiro e a auditoria demonstrar que a superfície legada não é mais necessária para preservar compatibilidade operacional.