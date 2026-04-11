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

- [x] DOC-ADR-001 — ADR 004 (PDFKit) concluída em 2026-04-10 23:40 (BRT)
- [x] DOC-ADR-002 — ADR 005 (usuario_eventos) concluída em 2026-04-10 23:43 (BRT)
- [x] DOC-ADR-003 — ADR 006 (paginação offset) concluída em 2026-04-10 23:44 (BRT)
- [x] DOC-ADR-004 — ADR 007 (validação valores_dinamicos) concluída em 2026-04-10 23:45 (BRT)
- [x] DOC-ADR-005 — ADR 008 (pdf on-the-fly) concluída em 2026-04-10 23:47 (BRT)
      ✅ 5/5 — Todas as ADRs pendentes redigidas
