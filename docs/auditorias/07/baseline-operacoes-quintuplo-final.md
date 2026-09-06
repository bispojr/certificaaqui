# Baseline Final por Operação (Quíntuplo) — Onda 4

**Feature:** `001-auth-scope-convergence`  
**Onda:** 4  
**Data:** 2026-09-05 20:35 (BRT)  
**Status:** concluída

## Objetivo

Consolidar a operação canônica por quíntuplo após remoção de contrato legado e ratificar que API e SSR compartilham o mesmo critério arquitetural de autorização e escopo.

## Quíntuplos finais

| operationKey        | Recurso      | Intento    | Efeito            | Escopo                    | Perfil mínimo final            | Status   |
| ------------------- | ------------ | ---------- | ----------------- | ------------------------- | ------------------------------ | -------- |
| cert.create         | Certificado  | criar      | create            | por evento                | monitor                        | conforme |
| cert.list           | Certificado  | listar     | read-list         | por evento                | monitor                        | conforme |
| cert.read           | Certificado  | consultar  | read-one          | por evento                | monitor                        | conforme |
| cert.update         | Certificado  | atualizar  | update            | por evento                | gestor                         | conforme |
| cert.cancel         | Certificado  | cancelar   | status-transition | por evento                | gestor                         | conforme |
| cert.delete         | Certificado  | arquivar   | soft-delete       | por evento                | gestor                         | conforme |
| cert.restore        | Certificado  | restaurar  | restore           | por evento/global         | admin/gestor conforme operação | conforme |
| participante.create | Participante | criar      | create            | por evento                | monitor                        | conforme |
| participante.list   | Participante | listar     | read-list         | por evento                | monitor                        | conforme |
| participante.read   | Participante | consultar  | read-one          | por evento                | monitor                        | conforme |
| participante.update | Participante | atualizar  | update            | por evento                | gestor                         | conforme |
| tipo.create         | Tipo         | criar      | create            | por evento                | gestor                         | conforme |
| tipo.list           | Tipo         | listar     | read-list         | por evento                | gestor                         | conforme |
| tipo.update         | Tipo         | atualizar  | update            | por evento                | gestor                         | conforme |
| tipo.delete         | Tipo         | excluir    | soft-delete       | por evento                | gestor                         | conforme |
| evento.create       | Evento       | criar      | create            | global/admin              | admin                          | conforme |
| evento.list         | Evento       | listar     | read-list         | por evento                | monitor                        | conforme |
| evento.read         | Evento       | consultar  | read-one          | por evento                | monitor                        | conforme |
| evento.update       | Evento       | atualizar  | update            | global/admin              | admin                          | conforme |
| evento.delete       | Evento       | arquivar   | soft-delete       | global/admin              | admin                          | conforme |
| dashboard.view      | Dashboard    | visualizar | read-aggregate    | global/admin e por evento | autenticado                    | conforme |

## Conclusão

- O contrato canônico de principal foi preservado sem fallback de legado.
- O canal canônico de isolamento de escopo continua sendo `req.contextoAutorizacao.eventoIds`.
- O `scopedEvento` deixou de usar `req.query` como proxy de autorização.
- O drift de RBAC ficou coberto por verificação automática por `operationKey`.
