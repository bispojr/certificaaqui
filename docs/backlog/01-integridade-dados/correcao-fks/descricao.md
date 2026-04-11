# Feature: Correção de FKs com `onDelete: CASCADE` em Entidades com Soft Delete

## Descrição

As FKs das tabelas `certificados` e `usuario_eventos` definem `onDelete: 'CASCADE'`. Como todas as entidades usam soft delete (`paranoid: true`), o Sequelize nunca emite hard deletes. Porém, um hard delete executado manualmente no banco (via psql ou ferramenta GUI) eliminaria os registros filhos permanentemente, sem possibilidade de restore.

Mudar para `onDelete: 'RESTRICT'` transforma esse silent failure em um erro explícito — o banco recusa a operação com mensagem clara.

## Estado atual (code)

`migrations/20260311180841-create-certificados.js`:
```javascript
participante_id: { onDelete: 'CASCADE' }  // linha ~27
evento_id:       { onDelete: 'CASCADE' }  // linha ~35
tipo_certificado_id: { onDelete: 'CASCADE' } // linha ~43
```

`migrations/20260313190000-create-usuario_eventos.js`:
```javascript
usuario_id: { onDelete: 'CASCADE' }  // linha ~15
evento_id:  { onDelete: 'CASCADE' }  // linha ~22
```

## Observação importante

Estas migrations **não devem ser editadas retroativamente**. As alterações devem ser feitas via **novas migrations** que removem e recriam as FK constraints.

## Tasks (alto nível)

- INTEG-FK-001: Migration para alterar FKs de `certificados` (3 constraints)
- INTEG-FK-002: Migration para alterar FKs de `usuario_eventos` (2 constraints)
- INTEG-FK-003: Testes de integridade referencial validando comportamento RESTRICT

## Ordem de execução

```
INTEG-FK-001 (independente)
INTEG-FK-002 (independente)
INTEG-FK-003 → depende de INTEG-FK-001 e INTEG-FK-002 estarem aplicadas no banco de teste
```
