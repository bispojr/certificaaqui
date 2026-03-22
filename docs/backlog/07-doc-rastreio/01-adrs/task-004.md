# TASK ID: DOC-ADR-004

## Título

Criar ADR-007 — Onde validar `valores_dinamicos` (service vs. model vs. validator)

## Objetivo

Documentar a decisão de validar a consistência entre `valores_dinamicos` do certificado e `dados_dinamicos` do tipo de certificado associado na camada de **service**, não no model ou no validator Zod de rota.

## Arquivo envolvido

- `docs/decisoes/007-validacao-valores-dinamicos.md` ← CRIAR

## Conteúdo a criar

```markdown
# ADR 007 — Validação de `valores_dinamicos`: Camada de Service

## Contexto

O campo `valores_dinamicos` (JSONB) de um certificado deve conter as chaves definidas em `dados_dinamicos` do tipo de certificado associado (FR-20). Por exemplo, se `dados_dinamicos = { "tema": "string", "duracao": "number" }`, então `valores_dinamicos` deve conter `{ "tema": "...", "duracao": ... }`.

Essa validação envolve buscar o `TiposCertificados` associado — uma operação de banco de dados que depende de contexto externo. As alternativas de camada foram:

- **Validator Zod (rota)**: validação em `src/validators/certificado.js` antes de atingir o controller
- **Model (`beforeCreate`/`beforeUpdate` hook)**: validação no hook do Sequelize
- **Service**: validação em `certificadoService.create` após buscar o tipo associado

## Decisão

Validar `valores_dinamicos` na camada de **service** (`certificadoService.js`), logo após buscar o `TiposCertificados` associado.

Razões:

- A validação requer o `dados_dinamicos` do tipo — necessita de query ao banco
- Validators Zod vivem na camada de rota e não têm acesso ao banco
- Hooks de model (`beforeCreate`) tornam o model stateful e difíceis de testar em isolamento
- Services já têm acesso ao ORM — localidade natural para regras de negócio com dependências

## Fluxo de validação
```

POST /api/certificados
→ validate(certificadoSchema) ← Zod: estrutura básica + tipos primitivos
→ certificadoController.create
→ certificadoService.create
→ TiposCertificados.findByPk(tipo_certificado_id)
→ validar chaves de valores_dinamicos contra dados_dinamicos ← AQUI
→ Certificado.create(...)

```

## Consequências

**Positivas:**
- Testável unitariamente com mock de `TiposCertificados`
- Separação clara: Zod valida estrutura; service valida semântica de negócio
- Reutilizável em `certificadoService.update` sem duplicação

**Negativas:**
- Erro de `valores_dinamicos` chega como 422 (erro de negócio), não como 400 (erro de schema)
- Necessita busca adicional ao banco mesmo quando `valores_dinamicos` estiver vazio

## Alternativas rejeitadas

| Alternativa | Motivo da rejeição |
|-------------|-------------------|
| Validator Zod | Não tem acesso ao banco para buscar `dados_dinamicos` do tipo |
| Hook `beforeCreate` | Torna model stateful; dificulta testes unitários do service |
| Controller | Controllers não devem ter lógica de negócio (NFR-6) |
```

## Critério de aceite

- Arquivo criado em `docs/decisoes/007-validacao-valores-dinamicos.md`
- Documenta o fluxo de validação e por que a camada de service foi escolhida
