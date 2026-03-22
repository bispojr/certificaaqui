# TASK ID: DOC-ADR-003

## Título
Criar ADR-006 — Estratégia de paginação offset-based

## Objetivo
Documentar a decisão de adotar paginação offset-based (`LIMIT` + `OFFSET`) com `findAndCountAll`, em vez de paginação por cursor (keyset pagination).

## Arquivo envolvido
- `docs/decisoes/006-paginacao-offset.md` ← CRIAR

## Conteúdo a criar

```markdown
# ADR 006 — Estratégia de Paginação: Offset-Based

## Contexto

As rotas de listagem (participantes, eventos, certificados, tipos-certificados, usuários) precisam de paginação para evitar resposta ilimitada. As duas estratégias principais são:

- **Offset-based**: `LIMIT n OFFSET m` — número de página + tamanho de página
- **Cursor-based (keyset)**: paginação por valor do último registro — `WHERE id > :last_id LIMIT n`

O sistema opera com volumes de dados de pequeno a médio porte (eventos acadêmicos e técnicos), com listas raramente maiores que alguns milhares de registros.

## Decisão

Paginação offset-based com `Sequelize.findAndCountAll` e resposta no formato `{ data: [], meta: { total, page, limit, totalPages } }`.

Razões:
- Simplicidade de implementação e consumo via API (`?page=2&limit=10`)
- `findAndCountAll` retorna `{ count, rows }` — translação direta para o formato de resposta
- Suporte a navegação aleatória de páginas (ex.: ir direto para página 5) sem estado extra
- Volume de dados esperado não justifica a complexidade do cursor-based

## Consequências

**Positivas:**
- API intuitiva: `GET /api/participantes?page=1&limit=20`
- Sem estado no servidor — cada requisição é independente
- Fácil de testar e documentar

**Negativas:**
- Instabilidade em inserções concorrentes: novo registro pode "deslocar" a página seguinte
- Performance degrada com `OFFSET` muito alto em tabelas grandes (aceitável no escopo atual)
- Não adequado para feeds em tempo real (aceitável — o sistema não tem esse requisito)

## Formato de resposta padronizado

```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "totalPages": 8
  }
}
```

## Alternativas rejeitadas

| Alternativa | Motivo da rejeição |
|-------------|-------------------|
| Cursor-based | Complexidade desnecessária para o volume de dados esperado; não suporta navegação aleatória |
| Sem paginação | Inaceitável para produção — resposta pode ser ilimitada |
```

## Critério de aceite
- Arquivo criado em `docs/decisoes/006-paginacao-offset.md`
- Documenta formato de resposta `{ data, meta }` e razões da escolha
