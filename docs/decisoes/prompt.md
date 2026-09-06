Quero criar uma ADR arquitetural formal para o sistema CertificaAqui.

Contexto do projeto:

- Node.js
- Express
- Sequelize
- PostgreSQL
- API REST + SSR
- Arquitetura em camadas:
  routes -> controllers -> services -> models
- Existe um SRS principal em `docs/especificacoes.md`
- Existem ADRs já estabelecidas em `docs/decisoes`
- A ADR deve manter consistência com as decisões arquiteturais já existentes

IMPORTANTE:

- NÃO implementar nada
- NÃO gerar código
- NÃO criar specs
- NÃO propor refactors detalhados
- Apenas registrar formalmente a decisão arquitetural

ADR alvo:

## ADR-PUBLICO-01 — Política de Dados Expostos em Endpoints Públicos

**Problema arquitetural:** FR-25 define que rotas públicas não exigem autenticação mas **não define quais campos de dados pessoais podem ser expostos**. A implementação expõe e-mail na view SSR, IDs internos na API JSON e `valores_dinamicos` completos sem projeção.

**Contexto:** Sem definição de produto e jurídico (LGPD), não é possível determinar o escopo correto dos dados públicos.

**Alternativas implícitas:**

1. Definir DTO mínimo para respostas públicas (somente campos de validação: código, nome do tipo, status, data).
2. Permitir acesso a nome e tipo mas não a e-mail e `valores_dinamicos`.

**Criticidade:** Alta — determina a correção de múltiplos achados públicos.

Objetivo:
Gerar a PRIMEIRA VERSÃO FORMAL da ADR.

Formato obrigatório:

# ADR XXX — Título

## Status

(Proposto)

## Contexto

## Problema

## Decisão

## Alternativas Consideradas

## Consequências

### Positivas

### Negativas

## Impactos Arquiteturais

## Riscos

## Dependências

## Relação com SRS

## Observações

Regras:

- ADR deve focar em decisão arquitetural
- Explicitar trade-offs
- Explicitar consequências
- Explicitar impactos sistêmicos
- NÃO virar spec
- NÃO listar implementação detalhada
- NÃO inventar requisitos
- Sinalizar ambiguidades
- Sinalizar pontos pendentes de validação arquitetural
- Ser extremamente técnico e rigoroso

Salvar resultado em:

`docs/decisoes/014-politica-dados-expostos-endpoint-publico.md`

Fontes obrigatórias:

- `docs/especificacoes.md`
- `07/triagem-arquitetural-final.md`
- ADRs já existentes em `docs/decisoes`

Ao terminar:

- pare
- não continue automaticamente
- apenas escreva no final:

"próxima ADR"
