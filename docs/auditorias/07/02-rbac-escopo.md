# Auditoria 07.02 — RBAC e Escopo

## Escopo analisado

- Fonte principal: docs/especificacoes.md
- Fonte principal: docs/auditorias/07/07-certificados.md
- Revisao de middlewares de autenticacao, RBAC e escopo, rotas REST/SSR/publicas, controllers e services relacionados.

## Arquivos analisados

- src/middlewares/auth.js
- src/middlewares/authSSR.js
- src/middlewares/rbac.js
- src/middlewares/scopedEvento.js
- src/middlewares/tiposCertificadosOwnership.js
- src/routes/admin.js
- src/routes/api.js
- src/routes/public.js
- src/routes/certificados.js
- src/routes/participantes.js
- src/routes/eventos.js
- src/routes/tipos-certificados.js
- src/routes/usuarios.js
- src/routes/usuarios-crud.js
- src/controllers/certificadoController.js
- src/controllers/participanteController.js
- src/controllers/eventoController.js
- src/controllers/tiposCertificadosController.js
- src/controllers/certificadoSSRController.js
- src/controllers/participanteSSRController.js
- src/controllers/tiposCertificadosSSRController.js
- src/controllers/dashboardController.js
- src/services/certificadoService.js
- src/services/participanteService.js
- src/services/eventoService.js
- src/services/tiposCertificadosService.js

## Requisitos relacionados

- FR-32 (usuarios vinculados a eventos)
- FR-34 (admin com acesso irrestrito)
- FR-35 (gestor com permissoes ampliadas)
- FR-36 (monitor com acesso restrito)
- FR-37 (scopedEvento com filtro por evento_id e suporte a multiplos eventos)
- FR-38 (rotas administrativas da API protegidas por auth e rbac)
- FR-46 (gestor pode modificar tipos apenas do seu evento; monitor apenas visualiza)
- FR-49 (SSR administrativo protegido)
- FR-56 (dashboard com dados filtrados por evento)
- NFR-1 (seguranca: controle de acesso em rotas administrativas)

## Achados Confirmados

1) Certificados API: escopo por evento nao e aplicado no service e o middleware consulta o id errado em rotas com :id.
- Severidade: alto
- Classificacao: bug real
- Evidencias:
  - Middleware injeta evento_id na query e compara req.params.id para rotas com :id: [src/middlewares/scopedEvento.js](src/middlewares/scopedEvento.js#L20-L40)
  - Rotas de certificados usam scopedEvento para GET/PUT/DELETE por :id: [src/routes/certificados.js](src/routes/certificados.js#L164-L214)
  - Service ignora filtros de evento na listagem e busca por id: [src/services/certificadoService.js](src/services/certificadoService.js#L11-L29)
  - Controller nao passa evento_id nem valida ownership: [src/controllers/certificadoController.js](src/controllers/certificadoController.js#L16-L34)
- Impacto: listagem pode retornar certificados fora do escopo e rotas por id podem permitir acesso a certificados de outros eventos quando o id do certificado coincide com algum evento do usuario, alem de bloquear acessos validos quando nao coincide.

2) Certificados SSR: ausencia de validacao de ownership em detalhe/editar/atualizar/cancelar/deletar/restaurar.
- Severidade: alto
- Classificacao: bug real
- Evidencias:
  - Acoes usam findByPk direto, sem checar evento do usuario: [src/controllers/certificadoSSRController.js](src/controllers/certificadoSSRController.js#L82-L269)
  - Rotas SSR aplicam apenas rbac e nao aplicam scopedEvento: [src/routes/admin.js](src/routes/admin.js#L146-L179)
- Impacto: gestor/monitor pode acessar ou alterar certificados fora do escopo se conhecer o id.

3) Certificados SSR: criacao e edicao exibem eventos, tipos e participantes sem filtro de escopo.
- Severidade: alto
- Classificacao: implementacao parcial
- Evidencias:
  - Formulario novo lista todos os eventos, tipos e participantes: [src/controllers/certificadoSSRController.js](src/controllers/certificadoSSRController.js#L108-L147)
  - Criacao usa evento_id do form sem validar ownership: [src/controllers/certificadoSSRController.js](src/controllers/certificadoSSRController.js#L154-L176)
- Impacto: gestor pode emitir certificado para evento fora do seu escopo (multi-tenancy violado).

4) Participantes API: rotas e services nao aplicam escopo por evento.
- Severidade: alto
- Classificacao: gap de implementacao
- Evidencias:
  - Rotas nao usam scopedEvento: [src/routes/participantes.js](src/routes/participantes.js#L142-L164)
  - Service lista e busca sem filtro: [src/services/participanteService.js](src/services/participanteService.js#L5-L23)
  - Controller nao aplica filtros de escopo: [src/controllers/participanteController.js](src/controllers/participanteController.js#L13-L31)
- Impacto: gestores/monitores podem listar e acessar participantes de qualquer evento (vazamento de dados pessoais).

5) Participantes SSR: index filtra por eventos, mas edicao/atualizacao/remocao nao validam ownership.
- Severidade: medio
- Classificacao: implementacao parcial
- Evidencias:
  - Index aplica filtro por eventos via certificados: [src/controllers/participanteSSRController.js](src/controllers/participanteSSRController.js#L18-L64)
  - Editar/atualizar/deletar/restaurar usam service sem validar escopo: [src/controllers/participanteSSRController.js](src/controllers/participanteSSRController.js#L79-L145)
- Impacto: operacoes por id podem atingir participantes fora do escopo, mesmo que a listagem esteja filtrada.

6) Tipos de certificados API: leitura nao e filtrada por evento do usuario.
- Severidade: medio
- Classificacao: gap de implementacao
- Evidencias:
  - GET nao aplica scopedEvento: [src/routes/tipos-certificados.js](src/routes/tipos-certificados.js#L143-L177)
  - Controller nao repassa evento_id: [src/controllers/tiposCertificadosController.js](src/controllers/tiposCertificadosController.js#L13-L18)
  - Service aceita eventoId, mas nao e usado: [src/services/tiposCertificadosService.js](src/services/tiposCertificadosService.js#L5-L21)
- Impacto: monitores/gestores podem visualizar tipos de outros eventos, contrariando o principio de isolamento.

7) RBAC de restauracao de certificados diverge da especificacao.
- Severidade: medio
- Classificacao: inconsistencia
- Evidencias:
  - API permite restore para monitor: [src/routes/certificados.js](src/routes/certificados.js#L201-L207)
  - SSR exige admin para restaurar: [src/routes/admin.js](src/routes/admin.js#L175-L178)
- Impacto: comportamento diferente entre API e SSR, divergindo de FR-22 (restauracao apenas admin via SSR).

## Gaps de Implementacao

- Ausencia de enforcement de scopedEvento no service layer para certificados e participantes (FR-37, NFR-1). Evidencias: [src/services/certificadoService.js](src/services/certificadoService.js#L11-L29), [src/services/participanteService.js](src/services/participanteService.js#L5-L23).
- Controllers REST nao propagam filtros de evento quando o middleware injeta req.query.evento_id (FR-37). Evidencias: [src/controllers/certificadoController.js](src/controllers/certificadoController.js#L16-L21), [src/controllers/participanteController.js](src/controllers/participanteController.js#L13-L18).
- SSR certificados nao valida escopo em operacoes criticas (FR-37, NFR-1). Evidencias: [src/controllers/certificadoSSRController.js](src/controllers/certificadoSSRController.js#L82-L269).

## Inconsistencias

- Middleware scopedEvento injeta filtro em req.query, mas services ignoram esse filtro (contradicao entre middleware e camada de negocio). Evidencias: [src/middlewares/scopedEvento.js](src/middlewares/scopedEvento.js#L20-L31), [src/services/certificadoService.js](src/services/certificadoService.js#L11-L29).
- SSR mostra todos os tipos de certificados, mas apenas alguns podem ser editados (visualizacao global x ownership local). Evidencias: [src/controllers/tiposCertificadosSSRController.js](src/controllers/tiposCertificadosSSRController.js#L38-L76).
- RBAC de restauracao difere entre API e SSR (monitor vs admin). Evidencias: [src/routes/certificados.js](src/routes/certificados.js#L201-L207), [src/routes/admin.js](src/routes/admin.js#L175-L178).

## Vulnerabilidades/Riscos de Seguranca

- Vazamento multi-tenant de certificados via API (listagem e acesso por id sem escopo efetivo). Evidencias: [src/middlewares/scopedEvento.js](src/middlewares/scopedEvento.js#L20-L40), [src/controllers/certificadoController.js](src/controllers/certificadoController.js#L16-L34), [src/services/certificadoService.js](src/services/certificadoService.js#L11-L29).
- Vazamento de participantes via API (PII) por ausencia de escopo. Evidencias: [src/routes/participantes.js](src/routes/participantes.js#L142-L164), [src/services/participanteService.js](src/services/participanteService.js#L5-L23).
- SSR permite operacoes em certificados fora do escopo se o id for conhecido (cross-tenant). Evidencias: [src/controllers/certificadoSSRController.js](src/controllers/certificadoSSRController.js#L82-L269), [src/routes/admin.js](src/routes/admin.js#L146-L179).

## Pontos de Atencao

- scopedEvento aceita array de evento_id para multiplos eventos, mas nao ha garantia de suporte nos services atuais (FR-37). Evidencia: [src/middlewares/scopedEvento.js](src/middlewares/scopedEvento.js#L20-L31).
- authSSR popula req.usuario como objeto simples, sem getEventos; qualquer middleware que dependa do metodo precisa alternativa (ja ocorre em controllers SSR com UsuarioEvento). Evidencia: [src/middlewares/authSSR.js](src/middlewares/authSSR.js#L51-L60), [src/controllers/tiposCertificadosSSRController.js](src/controllers/tiposCertificadosSSRController.js#L14-L25).

## Itens para Validacao Humana

- A visibilidade de tipos de certificados deve ser global para gestores/monitores ou restrita ao escopo do usuario (FR-46, FR-37)?
- A API deve seguir a mesma regra de restauracao do SSR (apenas admin) ou a diferenca e intencional?
- Participantes sem certificados no evento devem aparecer na listagem SSR de participantes ou so quem tem certificados emitidos?

## Sugestoes de Atualizacao Documental

- Documentar explicitamente o comportamento de scoping em certificados/participantes SSR (o que e filtrado e o que e aberto) para evitar divergencia com FR-37.
- Explicitar no SRS se a leitura de tipos de certificados e global ou restrita por evento.
- Registrar a diferenca de permissao de restore entre API e SSR, caso seja decisao arquitetural.

## Specs Recomendadas

- Especificar uma regra unica de enforcement de escopo no service layer para certificados e participantes (FR-37, NFR-1).
- Definir formalmente se a leitura de tipos de certificados e multi-tenant isolada ou global (FR-46).
- Alinhar RBAC de restore de certificados entre API e SSR (FR-22, FR-34 a FR-36).
