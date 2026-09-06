# Contract - Authorization Scope Convergence (API + SSR)

## Finalidade

Contrato arquitetural para garantir convergência de autorização e escopo entre superfícies API/SSR durante transição brownfield.

## 1) Contrato Canônico do Principal

Todo fluxo autenticado deve materializar:

```json
{
  "subjectId": 123,
  "role": "gestor",
  "authChannel": "api",
  "sessionId": "sess-abc",
  "tokenId": "jwt-jti-xyz",
  "tenantScopeMode": "restricted"
}
```

Regras:

- Campos obrigatórios: `subjectId`, `role`, `authChannel`, `tenantScopeMode`.
- Pelo menos um de `sessionId` ou `tokenId` deve existir quando aplicável.
- `tenantScopeMode=global` <=> `role=admin`.
- Principal canônico não inclui métodos ORM.

## 2) Contrato Canônico de Escopo

Canal único de escopo no request:

```json
{
  "contextoAutorizacao": {
    "eventoIds": [10, 20]
  }
}
```

Regras:

- `admin`: `eventoIds = null`.
- `gestor|monitor`: `eventoIds` deve ser array não vazio.
- Falha determinística na resolução para perfil restrito => negação segura.

## 3) Contrato de Equivalência RBAC por Operação

Unidade canonica: quintuplo

- Intento funcional
- Recurso alvo
- Efeito de estado
- Escopo/tenant
- Classe de risco

Regras:

- Mesma operação (mesmo quíntuplo) em API e SSR deve ter mesmo `minimumRole`.
- Divergência sem exceção formal ADR => não conformidade crítica.

## 4) Contrato de Enforcement no Service Layer

Assinatura lógica esperada para operações escopadas:

```ts
serviceOperation(input, { eventoIds, principal, operationKey })
```

Regras:

- `eventoIds` precisa ser consumido explicitamente no service para listagem/ownership por ID.
- Controllers não podem depender de `req.query` como canal de segurança.
- Para operação restrita sem `eventoIds` válido, service deve negar operação.

## 5) Contrato de Convivência Legada

Campos mínimos de rastreio por item legado:

```json
{
  "legacyId": "LEG-PRINCIPAL-001",
  "legacyContractType": "principal",
  "owner": "security-architecture",
  "dependentOperationKeys": ["certificados.list.read.event_scoped.high"],
  "targetWave": "wave2",
  "status": "migrating"
}
```

Regra de depreciação:

- Só pode remover legado após migração completa das operações dependentes + evidências unit/integration/e2e/auditoria.

## 6) Compliance Gates

Gate por operação:

1. Principal canônico presente
2. Escopo no canal canônico
3. Negação segura para falha de escopo restrito
4. Enforcement no service layer
5. Equivalência de perfil mínimo API/SSR

Sem os 5 itens, operação permanece `nao_conforme`.
