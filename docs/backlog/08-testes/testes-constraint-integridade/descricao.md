# Feature: Testes de Constraint de Integridade em Certificados

## Identificador da feature
testes-constraint-integridade

## Domínio
08 — Testes

## Prioridade
ALTA

## Situação real

`src/services/certificadoService.js` — método `create()` (linha 30):

**Problemas confirmados no código atual:**

1. **Sem verificação de duplicata**: `create()` não checa se já existe um certificado ativo para a combinação `(participante_id, evento_id, tipo_certificado_id)` antes de continuar. Permite criar duplicatas silenciosamente.

2. **Código via `COUNT` frágil**: a geração do código de validação usa `Certificado.count({ where: { evento_id, tipo_certificado_id } })` (linha 63) e faz `count + 1`. Após soft delete e restore de certificados, o `COUNT` não inclui os deletados, podendo gerar colisão de código.

Ambos os problemas serão corrigidos pelas tasks **INTEG-PREV-002** e **INTEG-PREV-003** do Domínio 1.

Esta feature documenta as tasks de **teste** que devem validar o comportamento correto após as implementações acima.

---

## Estado atual dos testes em `tests/services/certificadoService.test.js`

| Cobertura existente |
|---|
| `create` — gera código de validação correto |
| `create` — lança 404 se tipo não encontrado |
| `create` — lança 422 se faltar campos dinâmicos |
| `create` — cria normalmente se todos os campos presentes |
| `create` — cria se dados_dinamicos for null |
| `cancel`, `delete`, `findAll`, `findById`, `update` |

**Lacunas identificadas:**

- Sem teste de `create` com certificado duplicado ativo → deve lançar 409
- Sem teste de `create` quando duplicata está soft-deleted → deve prosseguir normalmente
- Sem teste de integração validando a constraint de banco (chave única parcial)
- Sem teste validando que geração de código via `MAX` não repete ao restaurar

---

## Escopo desta feature

1. **task-001**: teste de unidade — `create()` lança 409 para duplicata ativa
2. **task-002**: teste de unidade — `create()` prossegue quando duplicata está soft-deleted
3. **task-003**: teste de integração — constraint de banco rejeita INSERT direto
4. **task-004**: teste de unidade/integração — geração de código via `MAX` não repete após restore
