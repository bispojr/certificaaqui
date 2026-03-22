# FEATURE 7.1 — Documentação de Decisões Arquiteturais (ADRs)

## Objetivo

Registrar as 5 decisões arquiteturais pendentes no padrão ADR já adotado pelo projeto (`docs/decisoes/`), garantindo rastreabilidade das escolhas técnicas.

## Contexto

- 3 ADRs já existem: `001-orm-sequelize.md`, `002-soft-delete-paranoid.md`, `003-jsonb-dados-dinamicos.md`
- Padrão adotado: seções `## Contexto`, `## Decisão`, `## Consequências`
- ADRs são documentos estáticos — sem dependência de código, podem ser redigidos em qualquer ordem
- Cada ADR é uma task independente (1 arquivo por task)

## Tasks

| ID          | Arquivo                                            | Decisão                                                    |
| ----------- | -------------------------------------------------- | ---------------------------------------------------------- |
| DOC-ADR-001 | `docs/decisoes/004-pdfkit-gerador-pdf.md`          | PDFKit escolhido para geração de PDF on-the-fly            |
| DOC-ADR-002 | `docs/decisoes/005-usuario-evento-nn.md`           | Vínculo usuário-evento N:N via tabela `usuario_eventos`    |
| DOC-ADR-003 | `docs/decisoes/006-paginacao-offset.md`            | Estratégia de paginação offset-based com `findAndCountAll` |
| DOC-ADR-004 | `docs/decisoes/007-validacao-valores-dinamicos.md` | Validação de `valores_dinamicos` na camada de service      |
| DOC-ADR-005 | `docs/decisoes/008-pdf-on-the-fly.md`              | PDFs gerados on-the-fly sem persistência em disco/S3       |

## Dependências

### Externas

- Nenhuma

### Internas

- Nenhuma — todos os ADRs podem ser redigidos independentemente

## Status

⬜ 0/5 — Nenhum ADR pendente redigido
