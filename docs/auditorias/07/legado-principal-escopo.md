# Mapa de Contratos Legados de Principal e Escopo

Feature: 001-auth-scope-convergence  
Data: 2026-09-05  
Objetivo: identificar, por operação, os contratos legados de principal autenticado e de escopo atualmente ativos no runtime.

## Contratos legados identificados

### Principal autenticado

- LEG-PRINC-01 (API): req.usuario como instância Sequelize de Usuario, com métodos ORM (ex.: getEventos).
- LEG-PRINC-02 (SSR): req.usuario como POJO sem métodos ORM, com flags parciais (isAdmin, isGestor) e sem contrato canônico completo.
- LEG-PRINC-03 (Híbrido): controllers SSR recompõem contexto de usuário/eventos com consultas adicionais por não haver principal unificado.

### Escopo de tenant

- LEG-SCOPE-01: uso de req.query.evento_id como canal de segurança em listagens.
- LEG-SCOPE-02: uso de req.body.evento_id em mutações como critério de autorização.
- LEG-SCOPE-03: uso de req.params.id (ID de recurso) como proxy de evento no scopedEvento.
- LEG-SCOPE-04: resolução ad hoc de escopo em controllers SSR (helpers locais getEventoIds e consultas diretas em UsuarioEvento).
- LEG-SCOPE-05: services críticos sem parâmetro explícito de eventoIds canônico.

## Mapeamento por operação P1

| operationKey         | Superfície | Contrato legado de principal | Contrato legado de escopo          | Risco predominante                              |
| -------------------- | ---------- | ---------------------------- | ---------------------------------- | ----------------------------------------------- |
| cert.create          | API        | LEG-PRINC-01                 | LEG-SCOPE-02                       | drift RBAC e ausência de enforcement no service |
| cert.create          | SSR        | LEG-PRINC-02, LEG-PRINC-03   | LEG-SCOPE-04                       | divergência de perfil mínimo e escopo implícito |
| cert.list            | API        | LEG-PRINC-01                 | LEG-SCOPE-01, LEG-SCOPE-05         | filtro injetado e ignorado no service           |
| cert.list            | SSR        | LEG-PRINC-02, LEG-PRINC-03   | LEG-SCOPE-04                       | escopo local não padronizado                    |
| cert.read            | API        | LEG-PRINC-01                 | LEG-SCOPE-03, LEG-SCOPE-05         | validação por coincidência numérica             |
| cert.read            | SSR        | LEG-PRINC-02                 | LEG-SCOPE-04                       | sem ownership por evento                        |
| cert.update          | API        | LEG-PRINC-01                 | LEG-SCOPE-03, LEG-SCOPE-05         | escopo não determinístico em rotas por ID       |
| cert.update          | SSR        | LEG-PRINC-02                 | LEG-SCOPE-04                       | sem ownership por evento                        |
| cert.cancel          | API        | LEG-PRINC-01                 | LEG-SCOPE-03, LEG-SCOPE-05         | operação sensível sem escopo canônico           |
| cert.cancel          | SSR        | LEG-PRINC-02                 | LEG-SCOPE-04                       | operação sensível sem escopo canônico           |
| cert.delete          | API        | LEG-PRINC-01                 | LEG-SCOPE-03, LEG-SCOPE-05         | operação destrutiva sem escopo canônico         |
| cert.delete          | SSR        | LEG-PRINC-02                 | LEG-SCOPE-04                       | operação destrutiva sem escopo canônico         |
| cert.restore         | API        | LEG-PRINC-01                 | LEG-SCOPE-03, LEG-SCOPE-05         | divergência crítica de RBAC                     |
| cert.restore         | SSR        | LEG-PRINC-02                 | LEG-SCOPE-04                       | política diferente da API                       |
| participante.create  | API        | LEG-PRINC-01                 | LEG-SCOPE-05                       | sem escopo de evento no fluxo                   |
| participante.create  | SSR        | LEG-PRINC-02                 | LEG-SCOPE-04                       | sem escopo canônico por tenant                  |
| participante.list    | API        | LEG-PRINC-01                 | LEG-SCOPE-05                       | retorno global sem restrição por evento         |
| participante.list    | SSR        | LEG-PRINC-02, LEG-PRINC-03   | LEG-SCOPE-04                       | filtro indireto por certificados                |
| participante.read    | API        | LEG-PRINC-01                 | LEG-SCOPE-05                       | leitura por ID sem ownership                    |
| participante.read    | SSR        | LEG-PRINC-02                 | LEG-SCOPE-04                       | leitura por ID sem ownership                    |
| participante.update  | API        | LEG-PRINC-01                 | LEG-SCOPE-05                       | atualização sem escopo por evento               |
| participante.update  | SSR        | LEG-PRINC-02                 | LEG-SCOPE-04                       | atualização sem escopo por evento               |
| participante.delete  | API        | LEG-PRINC-01                 | LEG-SCOPE-05                       | delete sem escopo canônico                      |
| participante.delete  | SSR        | LEG-PRINC-02                 | LEG-SCOPE-04                       | delete sem escopo canônico                      |
| participante.restore | API        | LEG-PRINC-01                 | LEG-SCOPE-05                       | restore sem escopo canônico                     |
| participante.restore | SSR        | LEG-PRINC-02                 | LEG-SCOPE-04                       | restore sem escopo canônico                     |
| tipo.list            | API        | LEG-PRINC-01                 | LEG-SCOPE-05                       | listagem sem filtro por evento                  |
| tipo.list            | SSR        | LEG-PRINC-02, LEG-PRINC-03   | LEG-SCOPE-04                       | exibição global com regra visual local          |
| tipo.create          | API        | LEG-PRINC-01                 | LEG-SCOPE-02                       | ownership em middleware, sem canal canônico     |
| tipo.create          | SSR        | LEG-PRINC-02                 | LEG-SCOPE-04                       | ownership no controller, não no service         |
| tipo.update          | API        | LEG-PRINC-01                 | LEG-SCOPE-03                       | dependência de contrato legado por ID           |
| tipo.update          | SSR        | LEG-PRINC-02                 | LEG-SCOPE-04                       | dependência de contrato legado por ID           |
| tipo.delete          | API        | LEG-PRINC-01                 | LEG-SCOPE-03                       | operação destrutiva sem canal canônico          |
| tipo.delete          | SSR        | LEG-PRINC-02                 | LEG-SCOPE-04                       | operação destrutiva sem canal canônico          |
| tipo.restore         | API        | LEG-PRINC-01                 | LEG-SCOPE-03                       | operação de restore sem canal canônico          |
| tipo.restore         | SSR        | LEG-PRINC-02                 | LEG-SCOPE-04                       | operação de restore sem canal canônico          |
| evento.create        | API        | LEG-PRINC-01                 | LEG-SCOPE-02                       | RBAC permissivo e escopo legado                 |
| evento.create        | SSR        | LEG-PRINC-02                 | n/a (admin global)                 | divergência com API                             |
| evento.list          | API        | LEG-PRINC-01                 | LEG-SCOPE-01                       | filtro legado no middleware                     |
| evento.list          | SSR        | LEG-PRINC-02, LEG-PRINC-03   | LEG-SCOPE-04                       | escopo reconstruído no controller               |
| evento.read          | API        | LEG-PRINC-01                 | LEG-SCOPE-03                       | rota por ID dependente de contrato legado       |
| evento.read          | SSR        | LEG-PRINC-02                 | n/a (admin em operações sensíveis) | divergência de perfil                           |
| evento.update        | API        | LEG-PRINC-01                 | LEG-SCOPE-03                       | atualização crítica com RBAC permissivo         |
| evento.update        | SSR        | LEG-PRINC-02                 | n/a (admin global)                 | divergência crítica de RBAC                     |
| evento.delete        | API        | LEG-PRINC-01                 | LEG-SCOPE-03                       | soft delete crítico com RBAC permissivo         |
| evento.delete        | SSR        | LEG-PRINC-02                 | n/a (admin global)                 | divergência crítica de RBAC                     |
| evento.restore       | API        | LEG-PRINC-01                 | LEG-SCOPE-03                       | restore crítico com RBAC permissivo             |
| evento.restore       | SSR        | LEG-PRINC-02                 | n/a (admin global)                 | divergência crítica de RBAC                     |
| dashboard.view       | SSR        | LEG-PRINC-02, LEG-PRINC-03   | LEG-SCOPE-04                       | policy implícita e escopo local                 |

## Conclusões da Onda 0 (T005)

- Há assimetria estrutural de principal entre API e SSR (instância ORM vs POJO), impedindo contrato único.
- O escopo de tenant depende de canais legados (query, body, params e helpers locais), sem req.contextoAutorizacao.eventoIds.
- Operações por ID concentram risco por uso de req.params.id como proxy de evento no middleware legado.
- A convergência exige retirada progressiva dos contratos LEG-PRINC-_ e LEG-SCOPE-_ nas Ondas 1 a 4.

## Evidências

- src/middlewares/auth.js
- src/middlewares/authSSR.js
- src/middlewares/scopedEvento.js
- src/routes/certificados.js
- src/routes/participantes.js
- src/routes/tipos-certificados.js
- src/routes/eventos.js
- src/routes/admin.js
- src/controllers/certificadoSSRController.js
- src/controllers/participanteSSRController.js
- src/controllers/tiposCertificadosSSRController.js
- src/services/certificadoService.js
- src/services/participanteService.js
