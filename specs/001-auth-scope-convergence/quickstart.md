# Quickstart - Execução do Plano 001-auth-scope-convergence

## Objetivo

Aplicar convergência transversal de autorização + scoping em ondas controladas, com validação técnica e auditoria de conformidade antes da depreciação do legado.

## Pré-requisitos

1. Estar na branch `001-auth-scope-convergence`.
2. Ler `spec.md`, `plan.md`, ADR 009/011/012/014 e SRS.
3. Garantir ambiente de testes funcional (Jest + Playwright).

## Sequência Recomendada

1. Onda 0: gerar baseline por operação (quíntuplo) e classificar conformidade inicial.
2. Onda 1: convergir materialização de principal canônico API/SSR com adaptadores legados temporários.
3. Onda 2: convergir resolução de escopo no canal canônico e fechar negação segura para perfis restritos.
4. Onda 3: consolidar enforcement na camada de serviço e equivalência RBAC por quíntuplo.
5. Onda 4: retirar legado com critério objetivo e auditoria final.

## Estratégia de Validação por Onda

### Unit
- Cobrir materialização de principal canônico em ambos canais.
- Cobrir serviços com `eventoIds` (admin null, restrito com lista, restrito sem escopo).

### Integration
- Exercitar operações equivalentes API/SSR e validar mesmo perfil mínimo.
- Validar negação segura em falha determinística de escopo para gestor/monitor.

### E2E
- Fluxos ponta-a-ponta por perfil para operações de risco alto.
- Regressão de endpoints públicos sensíveis conforme ADR 014.

### Auditoria de Conformidade
- Atualizar matriz por operação em cada onda.
- Bloquear avanço de onda se houver drift RBAC ou bypass multi-tenant nas operações alvo da onda.

## Comandos de Verificacao (referencia)

```bash
npm test -- --testPathPattern=tests/middleware
npm test -- --testPathPattern=tests/services
npm test -- --testPathPattern=tests/integration
npx playwright test
npm run check
```

## Critério de Pronto para /speckit.tasks

- Plano aprovado com fases e gates de entrada/saída.
- Contratos e modelo de dados da convergência publicados.
- Dependências, riscos e mitigação registrados.
- Sem `NEEDS CLARIFICATION` pendente.
