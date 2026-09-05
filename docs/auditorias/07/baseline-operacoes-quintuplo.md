# Baseline por Operação (Quíntuplo) - Onda 0

Feature: 001-auth-scope-convergence  
Data: 2026-09-05  
Objetivo: consolidar equivalência API/SSR por operação canônica (quíntuplo) e perfil mínimo atual.

## Quíntuplos Prioritários P1

| operationKey | Intento funcional | Recurso alvo | Efeito de estado | Escopo/tenant | Classe de risco | Perfil mínimo API | Perfil mínimo SSR | Equivalência de perfil |
|---|---|---|---|---|---|---|---|---|
| cert.create | Emitir certificado | Certificado | create | por evento | crítico | monitor | gestor | nao_equivalente |
| cert.list | Listar certificados | Certificado | read-list | por evento | alto | monitor | monitor | equivalente |
| cert.read | Consultar certificado | Certificado | read-one | por evento | crítico | monitor | monitor | equivalente |
| cert.update | Atualizar certificado | Certificado | update | por evento | crítico | monitor | gestor | nao_equivalente |
| cert.cancel | Cancelar certificado | Certificado | status-transition | por evento | alto | monitor | gestor | nao_equivalente |
| cert.delete | Arquivar certificado | Certificado | soft-delete | por evento | alto | monitor | gestor | nao_equivalente |
| cert.restore | Restaurar certificado | Certificado | restore | por evento/global | alto | monitor | admin | nao_equivalente |
| participante.create | Criar participante | Participante | create | por evento (requisito) | crítico | monitor | autenticado | nao_equivalente |
| participante.list | Listar participantes | Participante | read-list | por evento (requisito) | crítico | monitor | autenticado | nao_equivalente |
| participante.read | Consultar participante | Participante | read-one | por evento (requisito) | crítico | monitor | autenticado | nao_equivalente |
| participante.update | Atualizar participante | Participante | update | por evento (requisito) | alto | monitor | autenticado | nao_equivalente |
| participante.delete | Arquivar participante | Participante | soft-delete-link/global | alto | monitor | autenticado | nao_equivalente |
| participante.restore | Restaurar participante | Participante | restore | alto | monitor | autenticado | nao_equivalente |
| tipo.list | Listar tipos de certificado | TiposCertificados | read-list | por evento | alto | monitor | gestor | nao_equivalente |
| tipo.create | Criar tipo de certificado | TiposCertificados | create | por evento | alto | gestor | gestor | equivalente |
| tipo.update | Atualizar tipo de certificado | TiposCertificados | update | por evento | alto | gestor | gestor | equivalente |
| tipo.delete | Arquivar tipo de certificado | TiposCertificados | soft-delete | por evento | alto | gestor | gestor | equivalente |
| tipo.restore | Restaurar tipo de certificado | TiposCertificados | restore | por evento | alto | gestor | gestor | equivalente |
| evento.create | Criar evento | Evento | create | global/admin | crítico | monitor | admin | nao_equivalente |
| evento.list | Listar eventos | Evento | read-list | por evento para não-admin | alto | monitor | gestor | nao_equivalente |
| evento.read | Consultar evento | Evento | read-one | por evento para não-admin | alto | monitor | admin | nao_equivalente |
| evento.update | Atualizar evento | Evento | update | global/admin | crítico | monitor | admin | nao_equivalente |
| evento.delete | Arquivar evento | Evento | soft-delete | global/admin | crítico | monitor | admin | nao_equivalente |
| evento.restore | Restaurar evento | Evento | restore | global/admin | crítico | monitor | admin | nao_equivalente |
| dashboard.view | Consultar dashboard | Dashboard | read-aggregate | global/admin e por evento para não-admin | médio | n/a | autenticado | nao_aplicavel |

## Observações de baseline

- O quíntuplo já permite identificar operações equivalentes entre superfícies e medir drift de RBAC por perfil mínimo.
- O canal de escopo canônico req.contextoAutorizacao.eventoIds ainda não existe no fluxo atual; escopo depende de mecanismos legados (query/body/params e consultas locais).
- A maior concentração de não equivalência está em certificados, participantes e eventos.
