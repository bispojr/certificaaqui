# Triagem Arquitetural Consolidada — Certificados e RBAC/Escopo

**Sistema:** Certifique-me  
**Data:** 2026-05-09 18:04 (BRT)  
**Auditor:** GitHub Copilot (Claude Sonnet 4.6)  
**Auditorias base:** 07-certificados.md, 02-rbac-escopo.md  
**Referência normativa:** docs/especificacoes.md (SRS v2.0)

---

## Nota Metodológica

Esta triagem consolida exclusivamente os achados contidos em:

- `docs/auditorias/07/07-certificados.md`
- `docs/auditorias/07/02-rbac-escopo.md`
- `docs/especificacoes.md`

Domínios **não auditados** (ex.: eventos, usuários, autenticação isolada) **não foram extrapolados**. Achados duplicados entre as duas auditorias foram consolidados em um único item rastreável. Hipóteses sem evidência de código são sinalizadas explicitamente como itens para validação humana.

---

## Legenda de Tipos

| Código | Tipo                      |
| ------ | ------------------------- |
| BR     | Bug real                  |
| GI     | Gap de implementação      |
| IP     | Implementação parcial     |
| ID     | Inconsistência documental |
| DT     | Dívida técnica            |
| VU     | Vulnerabilidade           |
| AM     | Ambiguidade               |
| VA     | Violação arquitetural     |

---

---

# 1. Matriz Consolidada de Achados

| ID      | Domínio                   | Descrição                                                                                                                                                                                                        | Severidade  | Tipo | Impacto                              | Destino Recomendado                 |
| ------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---- | ------------------------------------ | ----------------------------------- |
| CERT-01 | Certificados / Escopo     | `scopedEvento` injeta `evento_id` na query, mas o service de certificados ignora o filtro; rotas com `:id` comparam o id do certificado com `evento_id`, causando falso bloqueio ou acesso indevido              | **Crítico** | BR   | Segurança, Multi-tenant              | Spec corretiva imediata             |
| CERT-02 | Certificados SSR          | Handlers SSR (detalhe, editar, atualizar, cancelar, deletar, restaurar) usam `findByPk` sem validar vínculo do usuário com o evento do certificado                                                               | **Crítico** | BR   | Segurança, Multi-tenant              | Spec corretiva imediata             |
| CERT-03 | Certificados SSR          | Formulários de criar/editar SSR listam todos os eventos, todos os tipos e todos os participantes sem filtro de escopo; evento enviado no form não é validado contra o escopo do usuário                          | **Alto**    | IP   | Segurança, Multi-tenant              | Spec corretiva imediata             |
| CERT-04 | Participantes / Escopo    | Rotas e service de participantes na API não aplicam nenhum escopo por evento; gestores/monitores obtêm todos os participantes do sistema                                                                         | **Crítico** | GI   | Segurança, Multi-tenant (PII)        | Spec corretiva imediata             |
| CERT-05 | Participantes SSR         | Listagem SSR filtra participantes por eventos do usuário, mas editar/atualizar/deletar/restaurar não validam ownership — inconsistência intra-módulo                                                             | **Alto**    | IP   | Multi-tenant                         | Spec corretiva imediata             |
| CERT-06 | Tipos de Certificados     | GET da API de tipos de certificados não é filtrado por evento do usuário; service aceita `eventoId` mas o controller não o repassa                                                                               | **Médio**   | GI   | Multi-tenant                         | Spec incremental                    |
| CERT-07 | RBAC / Restauração        | API permite `restore` de certificado com `rbac('monitor')`; SSR exige `rbac('admin')` — comportamento diverge e contradiz FR-22                                                                                  | **Médio**   | ID   | Segurança, Arquitetura               | Atualização do SRS + spec corretiva |
| CERT-08 | Certificados / API        | Validator Zod de criação remove `valores_dinamicos` do payload (falha silenciosa) e exige `status` explícito — contradiz FR-19 (status padrão `"emitido"`) e FR-20/FR-54 (campos dinâmicos obrigatórios)         | **Alto**    | BR   | Integridade de Dados                 | Spec corretiva imediata             |
| CERT-09 | Certificados / API        | `update`, `delete`, `restore` e `cancel` retornam HTTP 200/204 com payload nulo quando o registro não existe, em vez de HTTP 404                                                                                 | **Médio**   | BR   | UX, Arquitetura                      | Backlog técnico                     |
| CERT-10 | Certificados SSR          | No handler de detalhe SSR, o include usa `TiposCertificado` (singular) mas o alias do modelo é `TiposCertificados` (plural), causando associação vazia e interpolação de texto incorreta                         | **Médio**   | BR   | UX, Integridade de Dados             | Spec corretiva imediata             |
| CERT-11 | Certificados / Código     | Geração do código único (`CODIGO_BASE-YY-TIPO-N`) usa `count + 1` sem transação atômica — race condition pode gerar colisão de `codigo` e erro de `unique constraint` em alta concorrência                       | **Alto**    | DT   | Integridade de Dados                 | ADR / discussão arquitetural        |
| CERT-12 | Certificados / Código     | O `count` para geração do código não inclui registros soft-deletados; reativação de certificados pode reutilizar um código já existente e violar a `unique constraint`                                           | **Médio**   | BR   | Integridade de Dados                 | Spec corretiva imediata             |
| CERT-13 | Certificados / Update     | `update` de certificado não valida se `valores_dinamicos` cobre todos os campos exigidos por `dados_dinamicos` do tipo — permite dados parciais/inconsistentes                                                   | **Médio**   | GI   | Integridade de Dados                 | Spec incremental                    |
| CERT-14 | Consultas Públicas        | `GET /api/certificados?email` e `GET /api/validar/:codigo` retornam certificados independentemente do `status` (inclusive `cancelado` e `pendente`) — comportamento não documentado no SRS                       | **Baixo**   | AM   | UX                                   | Validação humana                    |
| CERT-15 | Arquitetura / Escopo      | Padrão sistêmico: `scopedEvento` injeta filtros em `req.query`, mas os services não consomem esses filtros — violação arquitetural transversal que invalida a camada de middleware como enforcement de segurança | **Crítico** | VA   | Segurança, Multi-tenant, Arquitetura | ADR / discussão arquitetural        |
| CERT-16 | Autenticação SSR          | `authSSR` popula `req.usuario` como objeto simples (sem `getEventos`); controllers SSR que precisam dos eventos do usuário buscam via `UsuarioEvento` diretamente — dependência implícita, frágil                | **Médio**   | DT   | Manutenção, Arquitetura              | Backlog técnico                     |
| CERT-17 | Tipos de Certificados SSR | SSR de tipos exibe todos os registros globalmente, mas ownership de edição é local ao evento do usuário — ambiguidade funcional não resolvida no SRS                                                             | **Baixo**   | AM   | UX, Multi-tenant                     | Validação humana                    |

---

---

# 2. Lista de Correções Críticas Imediatas

> Critério: RBAC, autenticação, multi-tenancy, vazamento de dados e corrupção de integridade.

## CERT-01 — `scopedEvento` ineficaz na API de certificados

- **Evidências:** `src/middlewares/scopedEvento.js#L20-L40`, `src/services/certificadoService.js#L11-L29`, `src/routes/certificados.js#L164-L213`
- **Requisitos violados:** FR-37, NFR-1
- **Problema:** O middleware injeta `evento_id` em `req.query`, mas o service não usa esse campo. Rotas com `:id` comparam o id do certificado com o evento do usuário, gerando falso bloqueio em acessos legítimos e potencial acesso indevido quando ids coincidem.
- **Risco:** Gestores/monitores podem listar ou acessar certificados de outros eventos.
- **Classificação:** Problema arquitetural transversal (manifestação de CERT-15 no domínio de certificados).

## CERT-02 — SSR de certificados sem validação de ownership

- **Evidências:** `src/controllers/certificadoSSRController.js#L82-L269`, `src/routes/admin.js#L146-L178`
- **Requisitos violados:** FR-37, NFR-1
- **Problema:** Todos os handlers SSR que operam sobre certificados por `:id` (detalhe, editar, atualizar, cancelar, deletar, restaurar) buscam via `findByPk` sem verificar se o certificado pertence ao evento do usuário autenticado.
- **Risco:** Gestor/monitor pode ler ou alterar certificados de outros eventos conhecendo o id.
- **Classificação:** Problema local (SSR), mas derivado do problema arquitetural transversal CERT-15.

## CERT-04 — Participantes API sem nenhum escopo

- **Evidências:** `src/routes/participantes.js#L142-L164`, `src/services/participanteService.js#L5-L23`, `src/controllers/participanteController.js#L13-L31`
- **Requisitos violados:** FR-37, NFR-1
- **Problema:** A API de participantes não aplica filtro por evento em nenhuma operação. Qualquer gestor ou monitor autenticado pode listar, consultar, editar ou remover qualquer participante do sistema.
- **Risco:** Vazamento massivo de PII (nome completo, e-mail, instituição) entre tenants.
- **Classificação:** Gap de implementação — nenhuma camada aplica o escopo; `scopedEvento` sequer é montado nas rotas de participantes.

## CERT-08 — Validator remove `valores_dinamicos` e exige `status`

- **Evidências:** `src/validators/certificado.js#L1-L9`, `src/middlewares/validate.js#L1-L13`, `src/services/certificadoService.js#L45-L56`
- **Requisitos violados:** FR-19, FR-20, FR-54
- **Problema:** O schema Zod de criação remove `valores_dinamicos` antes da chegada ao service (campo non-whitelisted descartado silenciosamente) e exige `status` explícito quando o padrão deveria ser `"emitido"`. O service depois rejeita com 422 por ausência dos campos dinâmicos — que o validator já havia descartado.
- **Risco:** Criação de certificados impossível quando tipos exigem campos dinâmicos.
- **Classificação:** Bug real — contradição direta com FR-19 e FR-54.

## CERT-15 — Padrão arquitetural: middleware injeta filtros que services ignoram

- **Evidências:** `src/middlewares/scopedEvento.js#L20-L31`, `src/services/certificadoService.js#L11-L29`, `src/services/participanteService.js#L5-L23`
- **Requisitos violados:** FR-37, NFR-1, NFR-6
- **Problema:** A estratégia de enforcement de escopo via `scopedEvento` pressupõe que os services leem `evento_id` da query ou recebem parâmetros de escopo dos controllers. Na prática, **nenhum service de certificado ou participante consome esses filtros**. O middleware é uma camada de segurança que não cumpre sua função.
- **Risco:** Todas as proteções de multi-tenancy declaradas no SRS são ilusórias para os domínios auditados.
- **Classificação:** Problema arquitetural transversal — afeta certificados (API e SSR), participantes (API e SSR) e tipos de certificados (API).

---

---

# 3. Backlog Arquitetural Priorizado

## Curto Prazo (Correctivas — antes de qualquer novo desenvolvimento)

| ID      | Descrição                                                                                                                                 | Justificativa                                   |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| CERT-01 | Corrigir `scopedEvento` na API de certificados: service deve filtrar por `evento_id` e rotas com `:id` devem validar ownership após fetch | Segurança crítica — multi-tenant                |
| CERT-02 | Adicionar validação de ownership nos handlers SSR de certificados por `:id`                                                               | Segurança crítica — multi-tenant                |
| CERT-03 | Filtrar eventos, tipos e participantes nos formulários SSR pelo escopo do usuário; validar `evento_id` recebido no form                   | Multi-tenant, segurança                         |
| CERT-04 | Aplicar escopo de evento na API de participantes (middleware + service)                                                                   | Crítico — PII exposta                           |
| CERT-05 | Unificar validação de ownership em todas as operações SSR de participantes (não apenas listagem)                                          | Coerência de segurança                          |
| CERT-08 | Corrigir schema Zod de criação de certificado: manter `valores_dinamicos`, tornar `status` opcional com default `"emitido"`               | Integridade funcional — bloqueia criação        |
| CERT-10 | Corrigir typo `TiposCertificado` → `TiposCertificados` no include SSR                                                                     | Bug de associação — texto interpolado incorreto |
| CERT-12 | Incluir registros soft-deletados no `count` para geração de código de certificado                                                         | Integridade de dados — evitar colisão           |

## Médio Prazo (Incrementais — após estabilização das correções críticas)

| ID      | Descrição                                                                                                                                                  | Justificativa            |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| CERT-06 | Filtrar a API de tipos de certificados por `evento_id` do usuário autenticado (mediante decisão da validação humana de CERT-17)                            | Isolamento multi-tenant  |
| CERT-07 | Alinhar RBAC de restauração de certificados entre API e SSR (definir regra única após validação humana)                                                    | Consistência de RBAC     |
| CERT-09 | Retornar HTTP 404 em `update`, `delete`, `restore` e `cancel` quando registro não existe                                                                   | Contrato de API          |
| CERT-13 | Validar `valores_dinamicos` completos também na rota de `update` de certificado                                                                            | Integridade de dados     |
| CERT-16 | Refinar `authSSR` para disponibilizar método ou atributo de eventos do usuário de forma explícita, evitando dependência de `UsuarioEvento` nos controllers | Arquitetura / manutenção |

## Longo Prazo (Estratégicos — requerem discussão e design)

| ID      | Descrição                                                                                                                                                                            | Justificativa                                                            |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| CERT-11 | Tornar geração de código de certificado transacionalmente segura (lock ou sequência atômica)                                                                                         | Integridade de dados em concorrência                                     |
| CERT-15 | Definir e aplicar estratégia única de enforcement de escopo: (a) services recebem `eventoIds` explicitamente dos controllers, ou (b) camada de autorização separada no service layer | Decisão arquitetural transversal — elimina a classe de bugs multi-tenant |

---

---

# 4. Atualizações Recomendadas no SRS

> Apenas onde a especificação está incompleta, ambígua ou incorreta em relação ao comportamento verificado.

## SRS-01 — FR-22: Escopo de restauração de certificados

**Situação atual:** FR-22 diz "apenas admin pode restaurar via SSR". A API não menciona restrição de restauração.  
**Problema:** A API permite `restore` com `rbac('monitor')`, divergindo da intenção declarada no FR-22.  
**Ação recomendada:** Explicitar no SRS se a restrição de restauração é global (API + SSR) ou exclusiva da interface SSR, e qual é o perfil mínimo para a operação na API.  
**Rastreabilidade:** FR-22, CERT-07.

## SRS-02 — FR-37: Enforcement de escopo no service layer

**Situação atual:** FR-37 especifica que `scopedEvento` injeta `evento_id` para listagens. Não documenta como o service deve consumir esse filtro nem como rotas com `:id` devem validar ownership após fetch.  
**Problema:** A spec não define o contrato entre middleware e service layer, gerando implementação inconsistente.  
**Ação recomendada:** Adicionar ao FR-37 (ou ao bloco de arquitetura) a regra de que: (a) controllers devem propagar `evento_id` ao service; e (b) para operações por `:id`, deve-se verificar se o recurso pertence ao evento do usuário após o fetch.  
**Rastreabilidade:** FR-37, NFR-1, NFR-6, CERT-01, CERT-02, CERT-15.

## SRS-03 — FR-19 / FR-54: Status padrão e campos dinâmicos na criação via API

**Situação atual:** FR-19 define `status` padrão `"emitido"` e FR-54 define validação de `valores_dinamicos`. O SRS não especifica que o validator de entrada da API deve preservar `valores_dinamicos`.  
**Problema:** Ausência de orientação explícita sobre o schema de entrada esperado pela API, levando a implementação que descarta o campo antes da validação do service.  
**Ação recomendada:** Documentar explicitamente no SRS o payload esperado na criação via API: `status` é opcional (default `"emitido"`), `valores_dinamicos` é obrigatório quando o tipo possui `dados_dinamicos`.  
**Rastreabilidade:** FR-19, FR-20, FR-54, CERT-08.

## SRS-04 — FR-46 / FR-37: Visibilidade de leitura de tipos de certificados por perfil

**Situação atual:** FR-46 restringe _mutações_ de tipos ao gestor do evento. FR-37 restringe operações a eventos do usuário. Não há especificação clara sobre se a _leitura_ de tipos de certificados é global ou restrita por evento.  
**Problema:** Ambiguidade funcional que gera implementação divergente (SSR global, API sem filtro).  
**Ação recomendada:** Após validação humana (ver Seção 5), documentar explicitamente no SRS se `GET /tipos-certificados` deve retornar apenas os tipos dos eventos do usuário ou todos os tipos do sistema.  
**Rastreabilidade:** FR-46, FR-37, CERT-06, CERT-17.

## SRS-05 — FR-23 / FR-24: Filtro por `status` nas consultas públicas

**Situação atual:** FR-23 e FR-24 não especificam se certificados com `status` `"cancelado"` ou `"pendente"` devem ser retornados nas consultas públicas.  
**Problema:** Implementação atual retorna todos os certificados independentemente do status.  
**Ação recomendada:** Após validação humana (ver Seção 5), explicitar no SRS se as consultas públicas filtram por `status = "emitido"` ou retornam tudo.  
**Rastreabilidade:** FR-23, FR-24, FR-25, CERT-14.

---

---

# 5. Itens para Validação Humana

> Achados sem evidência suficiente no código ou que requerem decisão de produto/arquitetura antes de qualquer implementação.

## VH-01 — Visibilidade de tipos de certificados: global ou restrita por evento?

- **Contexto:** FR-46 restringe mutações; FR-37 restringe operações escopo. A leitura (`GET`) não está explicitamente definida.
- **Questão:** Gestor/monitor deve ver apenas tipos de certificados dos seus eventos, ou a leitura é global para facilitar o uso da interface?
- **Impacto:** Determina se `CERT-06` é correção (isolamento) ou decisão de produto (visibilidade global intencional).
- **Rastreabilidade:** FR-46, FR-37, CERT-06, CERT-17.

## VH-02 — RBAC de restauração de certificados: regra única entre API e SSR?

- **Contexto:** FR-22 menciona restauração via SSR restrita ao admin. A API não define.
- **Questão:** A restrição ao admin é apenas para a interface SSR (intencionalmente mais restritiva) ou deve ser aplicada também na API?
- **Impacto:** Define se `CERT-07` é uma correção de bug na API ou uma atualização do SRS para tornar a API igualmente restritiva.
- **Rastreabilidade:** FR-22, FR-34, FR-35, FR-36, CERT-07.

## VH-03 — Consultas públicas: certificados cancelados são "válidos" para download e validação?

- **Contexto:** `GET /api/certificados?email` e `GET /api/validar/:codigo` retornam todos os certificados independentemente do status.
- **Questão:** Um certificado com `status = "cancelado"` deve aparecer na listagem pública e ser apresentado como válido? Deve ser possível gerar seu PDF?
- **Impacto:** Define se a consulta pública deve filtrar por `status = "emitido"` e se a rota de PDF deve verificar o status antes de gerar.
- **Rastreabilidade:** FR-23, FR-24, FR-25, FR-42, CERT-14.

## VH-04 — Listagem SSR de participantes: apenas quem tem certificado no evento ou todos os participantes vinculados?

- **Contexto:** A listagem SSR de participantes filtra por eventos via certificados (participantes que possuem certificados nos eventos do usuário). Participantes sem certificados no evento não aparecem.
- **Questão:** Esse comportamento é intencional? Participantes que ainda não têm certificado mas estão associados ao evento devem aparecer?
- **Impacto:** Define o modelo de vínculo participante ↔ evento e o comportamento correto do filtro de scope na listagem SSR.
- **Rastreabilidade:** FR-37, FR-36, CERT-05.

---

---

# 6. Iniciativas de Spec Recomendadas (Spec Kit)

> Possíveis specs futuras para especificação e implementação guiada.

## SPEC-01 — Enforcement de Escopo Multi-tenant no Service Layer

**Objetivo:** Definir e implementar uma estratégia única de enforcement de escopo por evento no service layer para certificados, participantes e tipos de certificados.  
**Motivação:** A classe de bugs mais crítica encontrada nas duas auditorias deriva da ausência de enforcement real de multi-tenancy abaixo da camada de middleware. A correção requer uma decisão arquitetural e uma spec clara antes de qualquer refactor.  
**Achados relacionados:** CERT-01, CERT-02, CERT-03, CERT-04, CERT-05, CERT-06, CERT-15.  
**FRs relacionados:** FR-37, NFR-1, NFR-6.  
**Pré-requisito:** Resolução de VH-01 e VH-04.

## SPEC-02 — Correção do Contrato de Criação e Atualização de Certificados

**Objetivo:** Corrigir o validator Zod e o service de certificados para cumprir FR-19, FR-20 e FR-54: `status` opcional com default, `valores_dinamicos` preservado e validado tanto na criação quanto na atualização.  
**Motivação:** Bug CERT-08 bloqueia a criação de certificados com campos dinâmicos; CERT-13 permite dados parciais na atualização.  
**Achados relacionados:** CERT-08, CERT-13.  
**FRs relacionados:** FR-19, FR-20, FR-54.

## SPEC-03 — Alinhamento de RBAC entre API e SSR

**Objetivo:** Definir regras de RBAC uniformes para restauração de certificados (e potencialmente outras operações) entre API REST e interface SSR.  
**Motivação:** Divergência atual entre `rbac('monitor')` na API e `rbac('admin')` no SSR contradiz a especificação e cria inconsistência de segurança.  
**Achados relacionados:** CERT-07.  
**FRs relacionados:** FR-22, FR-34, FR-35, FR-36.  
**Pré-requisito:** Resolução de VH-02.

## SPEC-04 — Geração Transacional de Código de Certificado

**Objetivo:** Tornar a geração do código único de certificado (`CODIGO_BASE-YY-TIPO-N`) atômica e resiliente a concorrência.  
**Motivação:** Race condition documentada em CERT-11; soft-deletes causam potencial reúso de código (CERT-12).  
**Achados relacionados:** CERT-11, CERT-12.  
**FRs relacionados:** FR-52.  
**Observação:** Este item requer discussão arquitetural (ADR) antes da especificação: lock pessimista, sequência dedicada no banco ou idempotência por tentativa.

---

---

# 7. Análise de Problemas Sistêmicos

## 7.1 Violação Arquitetural Transversal: Middleware como Enforcement de Segurança Insuficiente

**Evidência:** `scopedEvento` injeta `evento_id` em `req.query`. Nenhum service de certificado ou participante lê esse campo.  
**Natureza:** Problema arquitetural transversal — não é um bug local, é uma falha na definição de contrato entre camadas.  
**Impacto:** Todas as proteções de multi-tenancy declaradas no SRS para certificados e participantes são **inoperantes** na implementação atual.  
**Hipótese:** O middleware foi projetado pressupondo que os services leriam `req.query.evento_id` via controllers, mas os controllers nunca foram atualizados para propagar esse parâmetro.  
**Recomendação:** Antes de qualquer correção local, definir em ADR como o enforcement de escopo deve funcionar em toda a aplicação (ver SPEC-01).  
**Achados:** CERT-01, CERT-02, CERT-04, CERT-15.

## 7.2 Inconsistência Recorrente: Middleware e Service Layer Desacoplados

**Evidência:** Mesmo padrão em certificados (API), participantes (API) e tipos de certificados (API): middleware aplica lógica, service ignora.  
**Natureza:** Violação de NFR-6 (arquitetura em camadas: lógica de negócio não deve residir em rotas ou models — mas também não deve ficar _apenas_ no middleware sem propagação ao service).  
**Impacto:** Falsa sensação de segurança por middleware presente mas ineficaz.  
**Achados:** CERT-01, CERT-04, CERT-06, CERT-15.

## 7.3 Inconsistência Recorrente: Enforcement Diferente entre API e SSR

**Evidência:** RBAC de restauração difere entre `certificados.js` (API) e `admin.js` (SSR); escopo de participantes aplicado na listagem SSR mas não nas operações por `:id`.  
**Natureza:** Implementação incremental sem spec unificada — cada superfície (API REST, SSR) foi implementada independentemente sem validação cruzada.  
**Impacto:** Comportamento imprevisível para o operador; múltiplos vetores de bypass por superfície.  
**Achados:** CERT-02, CERT-05, CERT-07.

## 7.4 Dependências Identificadas entre Certificados e RBAC

| Dependência                                  | Descrição                                                                                                              |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `scopedEvento` → service layer               | Sem propagação do `evento_id` para os services, todo o RBAC de escopo é inoperante (CERT-15 bloqueia CERT-01, CERT-04) |
| `authSSR` → `UsuarioEvento`                  | Ausência de `getEventos` em `req.usuario` força dependência direta de `UsuarioEvento` nos controllers SSR (CERT-16)    |
| VH-01 → CERT-06                              | A decisão sobre visibilidade de tipos (global vs. escopo) determina se CERT-06 é correção ou non-issue                 |
| VH-02 → CERT-07                              | A decisão sobre RBAC de restore determina se a API ou o SSR está correto                                               |
| CERT-11 + CERT-12 → geração de código        | Os dois bugs se combinam: sem transação e sem incluir soft-deleted, o código pode colidir em cenários de restore       |
| SPEC-01 → CERT-01, CERT-02, CERT-04, CERT-05 | A spec de enforcement de escopo é pré-requisito das specs corretivas para evitar divergência na implementação          |

## 7.5 Necessidade de Auditorias Futuras

> Com base nos achados atuais (limitados a certificados e RBAC), os seguintes domínios **não foram inspecionados** e podem apresentar a mesma classe de problemas:

- **Eventos:** CRUD via API — há indicadores de que o padrão de middleware sem enforcement no service pode se repetir.
- **Usuários:** CRUD e associação com eventos — o RBAC de criação/edição de usuários não foi auditado.
- **Upload de template (R2):** Sem auditoria de validação de escopo no upload.
- **Dashboard:** Calculado por perfil (FR-56) — não verificado se filtros de escopo são aplicados corretamente.

⚠️ **Não extrapolar:** os problemas acima são hipóteses baseadas no padrão observado, não achados confirmados.

---

---

_Este documento é produto exclusivo da triagem dos achados das auditorias 07/07-certificados.md e 07/02-rbac-escopo.md, confrontados com o SRS v2.0. Nenhuma implementação foi proposta. Todos os achados mantêm rastreabilidade explícita aos FRs e evidências de código das auditorias fonte._
