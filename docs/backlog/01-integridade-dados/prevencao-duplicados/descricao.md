# Feature: Prevenção de Certificados Duplicados

## Descrição

Implementa as barreiras técnicas que impedem a criação de certificados duplicados, atuando em duas camadas:

1. **Banco de dados:** índice único parcial que garante unicidade em `(participante_id, evento_id, tipo_certificado_id)` para registros ativos (`deleted_at IS NULL`)
2. **Camada de serviço:** verificação prévia com erro controlado (HTTP 409) antes de tentar inserir
3. **Geração de código:** substituição do `COUNT + 1` por `MAX` sobre certificados existentes (incluindo soft-deleted), eliminando a race condition na numeração

## Pré-requisito obrigatório

As tasks da feature `limpeza-duplicados` devem ser **executadas em produção** antes de aplicar `INTEG-PREV-001`. Ver `procedimento-pre-migration.md`.

## Ordem de execução

```
INTEG-LIMP-002 (produção) → INTEG-PREV-001 → INTEG-PREV-002 → INTEG-PREV-003
```

`INTEG-PREV-002` e `INTEG-PREV-001` são independentes do ponto de vista de código e podem ser desenvolvidas em paralelo, mas `INTEG-PREV-001` deve estar aplicada no banco antes de qualquer teste de integração de `INTEG-PREV-002`.

## Tasks (alto nível)

- INTEG-PREV-001: Migration de índice único parcial em `certificados`
- INTEG-PREV-002: Verificação de duplicata em `certificadoService.create()`
- INTEG-PREV-003: Substituição de `COUNT + 1` por `MAX` na geração de código
