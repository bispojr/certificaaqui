# Baseline de Operações API (Onda 0)

Feature: 001-auth-scope-convergence  
Data: 2026-09-05  
Objetivo: inventariar operações API prioritárias para convergência de autorização e escopo, sem alterar runtime.

## Operações Prioritárias (P1)

| operationKey | Rota API | Intento funcional | Recurso | Efeito de estado | Escopo esperado | Perfil mínimo atual | Observações de risco |
|---|---|---|---|---|---|---|---|
| cert.create | POST /certificados | Emitir certificado | Certificado | create | por evento | monitor | Usa scopedEvento, mas service não recebe eventoIds canônico |
| cert.list | GET /certificados | Listar certificados | Certificado | read-list | por evento | monitor | scopedEvento injeta req.query.evento_id; service ignora |
| cert.read | GET /certificados/:id | Ler certificado | Certificado | read-one | por evento | monitor | scopedEvento usa req.params.id como proxy de evento |
| cert.update | PUT /certificados/:id | Atualizar certificado | Certificado | update | por evento | monitor | Sem ownership no service |
| cert.cancel | POST /certificados/:id/cancel | Cancelar certificado | Certificado | status-transition | por evento | monitor | Sem ownership no service |
| cert.delete | DELETE /certificados/:id | Arquivar certificado | Certificado | soft-delete | por evento | monitor | Sem ownership no service |
| cert.restore | POST /certificados/:id/restore | Restaurar certificado | Certificado | restore | por evento | monitor | Diverge de SSR (admin) |
| participante.create | POST /participantes | Criar participante | Participante | create | por evento (FR-59) | monitor | Não usa scopedEvento |
| participante.list | GET /participantes | Listar participantes | Participante | read-list | por evento (FR-58) | monitor | Sem filtro de escopo |
| participante.read | GET /participantes/:id | Ler participante | Participante | read-one | por evento (FR-58) | monitor | Sem filtro de escopo |
| participante.update | PUT /participantes/:id | Atualizar participante | Participante | update | por evento (FR-58) | monitor | Sem filtro de escopo |
| participante.delete | DELETE /participantes/:id | Arquivar participante | Participante | soft-delete-link/global | monitor | monitor | Regra FR-60 não aplicada por perfil/canal |
| participante.restore | POST /participantes/:id/restore | Restaurar participante | Participante | restore | admin/gestor conforme política | monitor | Sem política convergida API/SSR |
| tipo.list | GET /tipos-certificados | Listar tipos | TiposCertificados | read-list | por evento | monitor | Controller ignora filtro de escopo |
| tipo.create | POST /tipos-certificados | Criar tipo | TiposCertificados | create | por evento | gestor | Ownership aplicado por middleware |
| tipo.update | PUT /tipos-certificados/:id | Atualizar tipo | TiposCertificados | update | por evento | gestor | Ownership aplicado por middleware |
| tipo.delete | DELETE /tipos-certificados/:id | Arquivar tipo | TiposCertificados | soft-delete | por evento | gestor | Ownership aplicado por middleware |
| tipo.restore | POST /tipos-certificados/:id/restore | Restaurar tipo | TiposCertificados | restore | por evento | gestor | Dependente de ownership |
| evento.create | POST /eventos | Criar evento | Evento | create | global/admin | monitor | Perfil excessivamente permissivo |
| evento.list | GET /eventos | Listar eventos | Evento | read-list | por evento para não-admin | monitor | Usa scopedEvento com semântica legada |
| evento.read | GET /eventos/:id | Ler evento | Evento | read-one | por evento para não-admin | monitor | scopedEvento usa req.params.id |
| evento.update | PUT /eventos/:id | Atualizar evento | Evento | update | global/admin | monitor | Diverge de SSR (admin) |
| evento.delete | DELETE /eventos/:id | Arquivar evento | Evento | soft-delete | global/admin | monitor | Diverge de SSR (admin) |
| evento.restore | POST /eventos/:id/restore | Restaurar evento | Evento | restore | global/admin | monitor | Diverge de SSR (admin) |

## Evidências de Código

- src/routes/certificados.js
- src/routes/participantes.js
- src/routes/tipos-certificados.js
- src/routes/eventos.js
- src/middlewares/scopedEvento.js
- src/services/certificadoService.js
- src/services/participanteService.js
