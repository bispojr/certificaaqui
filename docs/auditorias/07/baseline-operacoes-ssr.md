# Baseline de Operações SSR (Onda 0)

Feature: 001-auth-scope-convergence  
Data: 2026-09-05  
Objetivo: inventariar operações SSR prioritárias para convergência de autorização e escopo, sem alterar runtime.

## Operações Prioritárias (P1)

| operationKey | Rota SSR | Intento funcional | Recurso | Efeito de estado | Escopo esperado | Perfil mínimo atual | Observações de risco |
|---|---|---|---|---|---|---|---|
| dashboard.view | GET /admin/dashboard | Exibir dashboard | Dashboard | read-aggregate | global/admin e por evento para não-admin | autenticado (sem rbac explícito) | Sem declaração explícita de perfil mínimo |
| cert.list | GET /admin/certificados | Listar certificados | Certificado | read-list | por evento para não-admin | monitor | Filtragem por evento via getEventoIds local |
| cert.new-form | GET /admin/certificados/novo | Exibir formulário de emissão | Certificado | read-form | por evento para não-admin | gestor | Carrega participantes/eventos/tipos sem escopo |
| cert.create | POST /admin/certificados | Criar certificado | Certificado | create | por evento para não-admin | gestor | Diverge da API (monitor) |
| cert.read | GET /admin/certificados/:id | Ler certificado | Certificado | read-one | por evento para não-admin | monitor | Sem ownership por evento |
| cert.edit-form | GET /admin/certificados/:id/editar | Exibir formulário de edição | Certificado | read-form | por evento para não-admin | gestor | Sem ownership por evento |
| cert.update | POST /admin/certificados/:id | Atualizar certificado | Certificado | update | por evento para não-admin | gestor | Sem ownership por evento |
| cert.cancel | POST /admin/certificados/:id/cancelar | Cancelar certificado | Certificado | status-transition | por evento para não-admin | gestor | Sem ownership por evento |
| cert.delete | POST /admin/certificados/:id/deletar | Arquivar certificado | Certificado | soft-delete | por evento para não-admin | gestor | Sem ownership por evento |
| cert.restore | POST /admin/certificados/:id/restaurar | Restaurar certificado | Certificado | restore | global/admin | admin | Diverge da API (monitor) |
| participante.list | GET /admin/participantes | Listar participantes | Participante | read-list | por evento para não-admin | autenticado (sem rbac explícito) | Listagem usa join por certificados e pode ocultar dados válidos |
| participante.read | GET /admin/participantes/:id/editar | Ler participante (pré-edição) | Participante | read-one | por evento para não-admin | autenticado (sem rbac explícito) | Sem ownership por evento |
| participante.new-form | GET /admin/participantes/novo | Exibir formulário | Participante | read-form | por evento para não-admin | autenticado (sem rbac explícito) | Sem controle por perfil |
| participante.create | POST /admin/participantes | Criar participante | Participante | create | por evento para não-admin | autenticado (sem rbac explícito) | Sem validação de termo/escopo no fluxo |
| participante.edit-form | GET /admin/participantes/:id/editar | Exibir formulário de edição | Participante | read-form | por evento para não-admin | autenticado (sem rbac explícito) | Sem ownership por evento |
| participante.update | POST /admin/participantes/:id | Atualizar participante | Participante | update | por evento para não-admin | autenticado (sem rbac explícito) | Sem ownership por evento |
| participante.delete | POST /admin/participantes/:id/deletar | Arquivar participante | Participante | soft-delete-link/global | autenticado (sem rbac explícito) | autenticado (sem rbac explícito) | Sem política convergida por perfil |
| participante.restore | POST /admin/participantes/:id/restaurar | Restaurar participante | Participante | restore | admin/gestor conforme política | autenticado (sem rbac explícito) | Sem política convergida por perfil |
| tipo.list | GET /admin/tipos-certificados | Listar tipos | TiposCertificados | read-list | por evento para não-admin | gestor | Query sem filtro de evento, só flag podeEditar |
| tipo.create | POST /admin/tipos-certificados | Criar tipo | TiposCertificados | create | por evento | gestor | Ownership implementado no controller |
| tipo.update | POST /admin/tipos-certificados/:id | Atualizar tipo | TiposCertificados | update | por evento | gestor | Ownership implementado no controller |
| tipo.delete | POST /admin/tipos-certificados/:id/deletar | Arquivar tipo | TiposCertificados | soft-delete | por evento | gestor | Ownership implementado no controller |
| tipo.restore | POST /admin/tipos-certificados/:id/restaurar | Restaurar tipo | TiposCertificados | restore | por evento | gestor | Ownership implementado no controller |
| evento.list | GET /admin/eventos | Listar eventos | Evento | read-list | por evento para não-admin | gestor | Escopo por vinculação de usuário |
| evento.read | GET /admin/eventos/:id/editar | Ler evento (pré-edição) | Evento | read-one | global/admin | admin | Operação de leitura disponível via fluxo de edição |
| evento.create | POST /admin/eventos | Criar evento | Evento | create | global/admin | admin | Diverge da API (monitor) |
| evento.update | POST /admin/eventos/:id | Atualizar evento | Evento | update | global/admin | admin | Diverge da API (monitor) |
| evento.delete | POST /admin/eventos/:id/deletar | Arquivar evento | Evento | soft-delete | global/admin | admin | Diverge da API (monitor) |
| evento.restore | POST /admin/eventos/:id/restaurar | Restaurar evento | Evento | restore | global/admin | admin | Diverge da API (monitor) |

## Evidências de Código

- src/routes/admin.js
- src/controllers/certificadoSSRController.js
- src/controllers/participanteSSRController.js
- src/controllers/tiposCertificadosSSRController.js
- src/controllers/eventoSSRController.js
- src/controllers/dashboardController.js
