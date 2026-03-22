# TASK ID: DOC-ADR-002

## Título

Criar ADR-005 — Vínculo usuário-evento via tabela `usuario_eventos`

## Objetivo

Documentar a decisão de usar uma tabela de junção `usuario_eventos` para o vínculo N:N entre usuários (gestores/monitores) e eventos, em vez de uma FK direta `evento_id` na tabela `usuarios`.

## Arquivo envolvido

- `docs/decisoes/005-usuario-evento-nn.md` ← CRIAR

## Conteúdo a criar

```markdown
# ADR 005 — Vínculo Usuário-Evento: Tabela de Junção N:N

## Contexto

Gestores e monitores precisam ser vinculados a um evento para operar dentro de seu escopo (FR-32, FR-37). As alternativas eram:

- **FK direta**: coluna `evento_id` na tabela `usuarios`
- **Tabela de junção**: `usuario_eventos` com `usuario_id` + `evento_id`

O requisito atual (FR-32) especifica que gestores/monitores estão vinculados a **exatamente um evento**. No entanto, a modelagem futura pode exigir múltiplos eventos por usuário (ex.: monitor atuando em dois eventos simultâneos).

## Decisão

Adotar tabela de junção `usuario_eventos` com relacionamento N:N entre `usuarios` e `eventos`.

Razões:

- Flexibilidade para vincular um usuário a múltiplos eventos sem migração de schema
- Alinhamento com o padrão Sequelize `BelongsToMany` já utilizado no projeto
- Evita `null` em `evento_id` para admins — admins simplesmente não têm registros em `usuario_eventos`
- Permite metadados adicionais no vínculo (ex.: `papel_no_evento`, `ativo`) sem alterar `usuarios`

## Consequências

**Positivas:**

- Schema evolutivo — suporta 1:N e N:N sem migração destrutiva
- Admins sem registros em `usuario_eventos` — semântica limpa
- `scopedEvento` middleware consulta `usuario_eventos` para restringir escopo

**Negativas:**

- Join adicional em toda query de escopo (`req.user` precisa buscar `usuario_eventos`)
- Lógica de validação "gestor/monitor deve ter exatamente 1 evento" fica no service, não no schema

## Alternativas rejeitadas

| Alternativa                         | Motivo da rejeição                                                               |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| FK direta `evento_id` em `usuarios` | Limitado a 1 evento; exige NULL para admins; migração necessária para N:N futuro |
| Array JSONB `evento_ids[]`          | Não suporta integridade referencial; inqueráve via JOIN                          |
```

## Critério de aceite

- Arquivo criado em `docs/decisoes/005-usuario-evento-nn.md`
- Documenta a decisão de N:N e razões de rejeição da FK direta
