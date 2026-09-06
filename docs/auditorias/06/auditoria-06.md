# Auditoria Técnica 06 — Certifique-me

**Data:** 2026-05-08  
**Horário:** 09:45 (BRT)  
**Auditor:** Arquiteto Sênior (GitHub Copilot)  
**Escopo:** Reconciliação do backlog pós-auditoria-05 com o estado real do código  
**Foco:** Identificar tasks concluídas, parcialmente concluídas, ainda pendentes e implementações fora do backlog

---

## Sumário Executivo

Entre 2026-04-11 (data da auditoria-05) e 2026-05-08, foram feitos **58 commits** introduzindo funcionalidades que não estavam no backlog da auditoria-05. Ao mesmo tempo, parte das tasks do backlog foram resolvidas como efeito colateral dessas implementações. A auditoria-06 reconcilia essa divergência.

---

## ETAPA 1 — O que foi implementado fora do backlog (pós auditoria-05)

Estas features não tinham task correspondente no backlog da auditoria-05:

| Commit                | Feature                                                                           |
| --------------------- | --------------------------------------------------------------------------------- |
| `7a8c656`             | Nova estrutura de navbar com dropdowns e Font Awesome                             |
| `a936279`             | Cards com ícones no dashboard admin; helper `or` Handlebars                       |
| `1f4ec2e`             | Tema Brite do Bootswatch                                                          |
| `4d5333b`             | Campos de layout posicional no PDF (texto, coordenadas)                           |
| `ce5f119`             | Upload de template base para eventos (campo `url_template_base`)                  |
| `9da4c00`             | Campo `url_template_base` no modelo Evento                                        |
| `4f4ae06`             | Campos de posição de texto e validação no modelo Evento; migration correspondente |
| `f567fae` / `aac212f` | Integração com Cloudflare R2 (`r2Service.js`)                                     |
| `63e8a7e`             | PC de geração de PDF com background do R2 e fonte do R2                           |
| `fb6b067`             | `resourceMeta.js` — centralização de ícones e labels por recurso                  |
| `5b16ebd`             | Funcionalidade de alteração de senha (`perfilSSRController.js`)                   |
| `9ac1390`             | CRUD completo de usuários (`usuarioSSRController.js`, rotas admin)                |
| `8ada92c`             | Auto-preenchimento de nome no certificado com `nomeCompleto`                      |
| `7b1909c`             | Campo `evento_id` em `TiposCertificados`                                          |
| `addfb09`             | Validação/mensagem para gestor sem eventos ao criar tipos                         |
| `5944476`             | Refatoração: rotas públicas separadas em SSR e API                                |
| `48ac055`             | Remoção da rota pública `/buscar`; redirecionamento atualizado                    |
| `3a13774`             | Validação de certificados via URL (`GET /validar/:codigo`)                        |
| `d42ae74`             | Exibição de `TiposCertificados` em várias partes do sistema                       |
| `6c9607c`             | Middleware para URL ativa (`res.locals.url`, `res.locals.activeValidar`)          |

---

## ETAPA 2 — Reconciliação do Backlog Ativo com o Código Real

### DOMÍNIO 1 — Integridade de Dados

#### INTEG-PREV — Prevenção de Certificados Duplicados

| Task           | Título                                                               | Status real                                                                    |
| -------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| INTEG-PREV-001 | Migration de índice único parcial em `certificados`                  | ❌ **PENDENTE** — não existe migration com este índice                         |
| INTEG-PREV-002 | Verificação de duplicata em `certificadoService.create()` (HTTP 409) | ❌ **PENDENTE** — o `create()` não faz nenhuma verificação prévia de duplicata |
| INTEG-PREV-003 | Substituição de `COUNT + 1` por `MAX` na geração de código           | ❌ **PENDENTE** — o código usa `Certificado.count()` diretamente               |

#### INTEG-LIMP — Limpeza de Duplicados Existentes

| Task           | Título                                                  | Status real     |
| -------------- | ------------------------------------------------------- | --------------- |
| INTEG-LIMP-001 | Script SQL de auditoria de duplicatas                   | ❌ **PENDENTE** |
| INTEG-LIMP-002 | Script SQL de normalização (cancelar duplicatas)        | ❌ **PENDENTE** |
| INTEG-LIMP-003 | Documentar procedimento como pré-requisito de migration | ❌ **PENDENTE** |

#### INTEG-FK — Correção de FKs com `onDelete: CASCADE`

| Task         | Título                                                            | Status real                                                                                |
| ------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| INTEG-FK-001 | Migration: alterar FKs de `certificados` de CASCADE para RESTRICT | ❌ **PENDENTE** — `create-certificados.js` ainda tem `onDelete: 'CASCADE'` em todas as FKs |
| INTEG-FK-002 | Migration equivalente para FK `evento_id` em `usuario_eventos`    | ❌ **PENDENTE** — `create-usuario_eventos.js` ainda tem `onDelete: 'CASCADE'`              |
| INTEG-FK-003 | Atualizar testes de integridade referencial                       | ❌ **PENDENTE**                                                                            |

> **Nota:** A migration `20260418232720-add-evento-id-to-tipos-certificados.js` já usa `onDelete: 'RESTRICT'` para a nova FK de `tipos_certificados → eventos`, o que é positivo — mas as FKs antigas ainda precisam ser corrigidas.

#### INTEG-PERF — Índice de Performance em `tipo_certificado_id`

| Task           | Título                                                  | Status real     |
| -------------- | ------------------------------------------------------- | --------------- |
| INTEG-PERF-001 | Adicionar índice `idx_certificados_tipo_certificado_id` | ❌ **PENDENTE** |

---

### DOMÍNIO 2 — Segurança

#### SEG-LGPD — Log com Dados Pessoais

| Task         | Título                                                        | Status real                                                     |
| ------------ | ------------------------------------------------------------- | --------------------------------------------------------------- |
| SEG-LGPD-001 | Remover `console.log('PDFService certificado:', certificado)` | ❌ **PENDENTE** — linha 16 de `pdfService.js` ainda emite o log |
| SEG-LGPD-002 | Testes de que o log não é emitido em produção                 | ❌ **PENDENTE**                                                 |

#### SEG-AUTH — Isolamento do Mock Auth

| Task         | Título                                                    | Status real                                                                                                                |
| ------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| SEG-AUTH-001 | Remover blocos `if (NODE_ENV === 'test')` de `authSSR.js` | ❌ **PENDENTE** — os dois blocos (header `x-mock-user` e `req.session.mockUser`) ainda existem em `authSSR.js` linhas 6–27 |
| SEG-AUTH-002 | Mover mock para middleware separado de teste              | ❌ **PENDENTE**                                                                                                            |
| SEG-AUTH-003 | Atualizar testes para usar novo middleware                | ❌ **PENDENTE**                                                                                                            |
| SEG-AUTH-004 | Garantir que `authSSR.js` não importa código de teste     | ❌ **PENDENTE**                                                                                                            |

#### SEG-SES — Sessão Persistente

| Task        | Título                                                                       | Status real                                                      |
| ----------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| SEG-SES-001 | Instalar e configurar `connect-pg-simple` como session store                 | ❌ **PENDENTE** — sessão usa store em memória (sem persistência) |
| SEG-SES-002 | Adicionar `cookie.httpOnly: true`, `cookie.secure` condicional ao `NODE_ENV` | ❌ **PENDENTE** — não configurado em `app.js`                    |
| SEG-SES-003 | Criar tabela de sessão                                                       | ❌ **PENDENTE**                                                  |
| SEG-SES-004 | Atualizar `docker-compose.yml` com variáveis de sessão                       | ❌ **PENDENTE**                                                  |

---

### DOMÍNIO 3 — Backend / Serviços

#### BACK-QUER — Consolidação de Queries nos Controllers SSR

| Task          | Título                                                           | Status real                                                                                                                                                                                                                                                   |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BACK-QUER-001 | Extrair `Certificado.findAll()` do SSR controller para service   | ⚠️ **PARCIALMENTE RESOLVIDO** — `certificadoSSRController.js` ainda usa `Certificado.findAll()` e `Certificado.findByPk()` diretamente. Porém a lógica de escopo (`getEventoIds`) foi extraída localmente (inline no controller, não em utilitário separado). |
| BACK-QUER-002 | Extrair queries de evento e tipo do SSR controller para services | ⚠️ **PARCIALMENTE RESOLVIDO** — `eventoSSRController.js` e `tiposCertificadosSSRController.js` também acessam models diretamente                                                                                                                              |
| BACK-QUER-003 | Testes para cobertura das novas rotas de service                 | ❌ **PENDENTE**                                                                                                                                                                                                                                               |

#### BACK-DEL — `destroy()` vs `delete()` no `eventoService`

| Task         | Título                                                                | Status real                                                             |
| ------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| BACK-DEL-001 | Renomear `delete()` para `softDelete()` e remover `destroy()` público | ❌ **PENDENTE** — `eventoService.js` ainda tem `destroy()` e `delete()` |
| BACK-DEL-002 | Atualizar callers                                                     | ❌ **PENDENTE**                                                         |
| BACK-DEL-003 | Atualizar testes                                                      | ❌ **PENDENTE**                                                         |

#### BACK-REQ — `require()` Inline

| Task         | Título                                                   | Status real                                                                                                                                                          |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BACK-REQ-001 | Mover `require` inline de `eventoService.js` para o topo | ❌ **PENDENTE** — `require('../../src/models')` aparece dentro de `delete()` e `restore()`                                                                           |
| BACK-REQ-002 | Verificar demais services                                | ⚠️ **PARCIALMENTE RESOLVIDO** — `pdfService.js` ainda tem `require('./r2Service')` inline (linha 12), com comentário "lazy require para evitar dependência circular" |

---

### DOMÍNIO 4 — Frontend / UX Admin

#### FRONT-NAV — Navbar Admin

| Task          | Título                                                              | Status real                                                                                                            |
| ------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| FRONT-NAV-001 | Adicionar Font Awesome 6 via CDN                                    | ✅ **CONCLUÍDO** — está em `admin.hbs`                                                                                 |
| FRONT-NAV-002 | Adicionar ícones FA a cada item de navegação                        | ✅ **CONCLUÍDO** — navbar tem dropdowns com ícones em todos os itens                                                   |
| FRONT-NAV-003 | Expandir "Tipos" para "Tipos de Certificados" e link "Área Pública" | ⚠️ **PARCIALMENTE** — "Tipos" aparece como "Tipos" no dropdown; link "Área Pública" / Validar não está na navbar admin |
| FRONT-NAV-004 | Classe `active` no item de navegação atual                          | ❌ **PENDENTE** — nenhum item tem classe `active` condicional                                                          |
| FRONT-NAV-005 | Separador visual entre navegação e bloco de conta do usuário        | ✅ **CONCLUÍDO** — há separação visual com `gap-2` e a lista de usuário à direita                                      |
| FRONT-NAV-006 | Refatorar duplicação admin/gestor na navbar em bloco único          | ✅ **CONCLUÍDO** — bloco unificado com `{{#if (or usuario.isAdmin usuario.isGestor)}}`                                 |

#### FRONT-BUG — Bugs Estruturais

| Task          | Título                                                                         | Status real                                                                                                         |
| ------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| FRONT-BUG-001 | Remover flash duplicados das views filhas                                      | ✅ **CONCLUÍDO** — commit `e81c037` removeu todos os flash das views filhas; nenhuma view admin tem alert duplicado |
| FRONT-BUG-002 | Mover form do botão "Remover" para `<td>` de ações em `certificados/index.hbs` | ✅ **CONCLUÍDO** — o form do botão Remover está dentro da linha de ações                                            |

#### FRONT-PAD — Padronização de Ações

| Task          | Título                                                                  | Status real                                                                                          |
| ------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| FRONT-PAD-001 | Documentar padrão visual de ações no layout admin                       | ❌ **PENDENTE**                                                                                      |
| FRONT-PAD-002 | Aplicar padrão em `certificados/index.hbs`                              | ⚠️ **PARCIALMENTE** — tem `btn-danger` com `confirm()` inline, mas sem padrão `data-action` uniforme |
| FRONT-PAD-003 | Aplicar padrão em `participantes/index.hbs`                             | ❓ **NÃO VERIFICADO**                                                                                |
| FRONT-PAD-004 | Aplicar padrão em `eventos/index.hbs`                                   | ❓ **NÃO VERIFICADO**                                                                                |
| FRONT-PAD-005 | Aplicar padrão em `usuarios/index.hbs` e `tipos-certificados/index.hbs` | ❓ **NÃO VERIFICADO**                                                                                |
| FRONT-PAD-006 | Verificação final por grep                                              | ❌ **PENDENTE**                                                                                      |

#### FRONT-BUSCA — Busca nas Listagens

| Task            | Título                               | Status real                                                    |
| --------------- | ------------------------------------ | -------------------------------------------------------------- |
| FRONT-BUSCA-001 | Campo de busca `?q=` em certificados | ❌ **PENDENTE** — nenhum controller SSR processa `req.query.q` |
| FRONT-BUSCA-002 | Campo de busca `?q=` em eventos      | ❌ **PENDENTE**                                                |
| FRONT-BUSCA-003 | Campo de busca `?q=` em usuários     | ❌ **PENDENTE**                                                |

---

### DOMÍNIO 5 — Performance e Escalabilidade

#### PERF-PAG — Paginação Server-Side

| Task         | Título                                                                      | Status real                                              |
| ------------ | --------------------------------------------------------------------------- | -------------------------------------------------------- |
| PERF-PAG-001 | Paginação em `certificadoSSRController.index()`                             | ❌ **PENDENTE** — sem `limit`/`offset` no controller SSR |
| PERF-PAG-002 | Paginação em `participanteSSRController.index()`                            | ❌ **PENDENTE**                                          |
| PERF-PAG-003 | Paginação em `eventoSSRController.index()` e `usuarioSSRController.index()` | ❌ **PENDENTE**                                          |
| PERF-PAG-004 | Helpers Handlebars para paginação e partial de controles                    | ❌ **PENDENTE**                                          |
| PERF-PAG-005 | Controles de paginação nas views de listagem                                | ❌ **PENDENTE**                                          |

#### PERF-CACHE — Cache de Filtros

| Task           | Título                         | Status real     |
| -------------- | ------------------------------ | --------------- |
| PERF-CACHE-001 | Cache de resultados de filtros | ❌ **PENDENTE** |
| PERF-CACHE-002 | Invalidação de cache           | ❌ **PENDENTE** |

---

### DOMÍNIO 6 — Dashboard Administrativo

#### DASH-ADMIN — Dashboard Admin

| Task           | Título                                                      | Status real                                                                                                  |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| DASH-ADMIN-001 | Queries de certificados no dashboardController (admin)      | ✅ **CONCLUÍDO** — marcado no arquivo com timestamp                                                          |
| DASH-ADMIN-002 | Cards "Total Certificados" e "Pendentes"                    | ✅ **CONCLUÍDO** — marcado no arquivo com timestamp                                                          |
| DASH-ADMIN-003 | Tabela "Últimos 5 certificados emitidos" no dashboard admin | ✅ **CONCLUÍDO** — `dashboardController.js` já busca `ultimosCertificados` (últimos 5 por `created_at DESC`) |

#### DASH-GEST — Dashboard Gestor

| Task          | Título                                                             | Status real                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DASH-GEST-001 | Verificar exportação de `sequelize` em `src/models/index.js`       | ❓ **NÃO VERIFICADO**                                                                                                                                                |
| DASH-GEST-002 | Queries de breakdown e últimos certificados no controller (gestor) | ⚠️ **PARCIALMENTE** — `dashboardController.js` já filtra `Certificado.count` por `eventoIds`, mas não produz breakdown por tipo nem últimos certificados para gestor |
| DASH-GEST-003 | Tabelas "por tipo" e "últimos certificados" na view do gestor      | ❌ **PENDENTE**                                                                                                                                                      |
| DASH-GEST-004 | Card "Total de Participantes Únicos" ao dashboard gestor           | ❌ **PENDENTE**                                                                                                                                                      |

---

### DOMÍNIO 7 — Arquitetura e Organização

#### ARQ-PATH — Acoplamento de Path nos Services

| Task         | Título                                                   | Status real                                                                                                    |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| ARQ-PATH-001 | Mover `require` inline de `eventoService.js` para o topo | ❌ **PENDENTE** — `UsuarioEvento` ainda é `require`'d inline em `delete()` e `restore()`                       |
| ARQ-PATH-002 | Verificar demais services quanto a paths relativos       | ⚠️ **PARCIALMENTE** — `pdfService.js` tem `require('./r2Service')` inline justificado por dependência circular |

#### ARQ-DEL — Consolidação `destroy` vs `softDelete`

| Task        | Título                                                             | Status real     |
| ----------- | ------------------------------------------------------------------ | --------------- |
| ARQ-DEL-001 | Renomear `delete()` → `softDelete()` e remover `destroy()` público | ❌ **PENDENTE** |
| ARQ-DEL-002 | Atualizar callers                                                  | ❌ **PENDENTE** |
| ARQ-DEL-003 | Atualizar testes                                                   | ❌ **PENDENTE** |

#### ARQ-ESC — Helper de Escopo por Evento

| Task        | Título                                                                              | Status real                                                                                                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ARQ-ESC-001 | Criar `src/utils/getScopedEventoIds.js`                                             | ⚠️ **PARCIALMENTE** — a lógica existe duplicada em `certificadoSSRController.js` (função local `getEventoIds`) e em `participanteSSRController.js`, mas não foi extraída para utilitário compartilhado |
| ARQ-ESC-002 | Refatorar `certificadoSSRController.js` para usar utilitário                        | ❌ **PENDENTE**                                                                                                                                                                                        |
| ARQ-ESC-003 | Refatorar `participanteSSRController.js` e `dashboardController.js`                 | ❌ **PENDENTE**                                                                                                                                                                                        |
| ARQ-ESC-004 | Testes unitários de `getScopedEventoIds`                                            | ❌ **PENDENTE**                                                                                                                                                                                        |
| ARQ-ESC-005 | Verificar `eventoSSRController` e `tiposCertificadosSSRController` quanto ao escopo | ❓ **NÃO VERIFICADO**                                                                                                                                                                                  |

---

### DOMÍNIO 8 — Testes

#### TEST-INTEG — Testes de Constraint de Integridade

| Task           | Título                                                         | Status real                                |
| -------------- | -------------------------------------------------------------- | ------------------------------------------ |
| TEST-INTEG-001 | Teste: `create()` lança 409 para certificado duplicado ativo   | ❌ **PENDENTE** — feature não implementada |
| TEST-INTEG-002 | Teste: `create()` prossegue quando duplicata está soft-deleted | ❌ **PENDENTE**                            |
| TEST-INTEG-003 | Teste de integração: constraint de banco rejeita INSERT direto | ❌ **PENDENTE**                            |
| TEST-INTEG-004 | Teste: código via `MAX` não repete incremento após restore     | ❌ **PENDENTE**                            |

#### TEST-SSR — Testes de Controllers SSR

| Task              | Título                                                       | Status real                                        |
| ----------------- | ------------------------------------------------------------ | -------------------------------------------------- |
| TEST-CERT-SSR-001 | Testes de `index` com filtros em `certificadoSSRController`  | ❓ **NÃO VERIFICADO**                              |
| TEST-CERT-SSR-002 | Teste de `criar` com erro 409                                | ❌ **PENDENTE** — feature não implementada         |
| TEST-USR-SSR-003  | Testes de `restaurar` e `index?q=` em `usuarioSSRController` | ❌ **PENDENTE** — `index?q=` não está implementado |
| TEST-PART-SSR-004 | Testes de CRUD em `participanteSSRController`                | ❓ **NÃO VERIFICADO**                              |

#### TEST-SES — Testes de Sessão Persistente

| Task         | Título                                                | Status real                              |
| ------------ | ----------------------------------------------------- | ---------------------------------------- |
| TEST-SES-001 | Sessão permanece válida após reinicialização simulada | ❌ **PENDENTE** — sessão está em memória |
| TEST-SES-002 | `cookie.httpOnly: true` no cabeçalho do login         | ❌ **PENDENTE**                          |
| TEST-SES-003 | `cookie.secure` condicional ao `NODE_ENV`             | ❌ **PENDENTE**                          |

---

## ETAPA 3 — Resumo por Status

| Status                    | Quantidade | Tasks                                                                                                   |
| ------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| ✅ Concluído (sem task)   | ~20        | Features implementadas sem estar no backlog                                                             |
| ✅ Concluído (com task)   | 7          | FRONT-NAV-001, 002, 005, 006; FRONT-BUG-001, 002; DASH-ADMIN-001, 002, 003                              |
| ⚠️ Parcialmente concluído | 8          | BACK-QUER-001/002, BACK-REQ-002, FRONT-NAV-003, FRONT-PAD-002, ARQ-PATH-002, ARQ-ESC-001, DASH-GEST-002 |
| ❌ Pendente               | ~38        | Todos os demais                                                                                         |
| ❓ Não verificado         | 6          | FRONT-PAD-003/004/005, DASH-GEST-001, TEST-CERT-SSR-001, TEST-PART-SSR-004                              |

---

## ETAPA 4 — Priorização Sugerida para o Próximo Ciclo

Com base em impacto real (integridade, segurança, UX), estas são as tasks que devem ser atacadas primeiro:

### Críticas (fazer antes de qualquer coisa)

1. **SEG-LGPD-001** — Remover `console.log` com dados pessoais do `pdfService.js` (1 linha, risco LGPD)
2. **INTEG-PREV-001/002/003** — Prevenção de certificados duplicados (race condition real em produção)
3. **SEG-SES-002** — Adicionar `httpOnly: true` e `secure` condicional na configuração de sessão (1 alteração em `app.js`)

### Alta prioridade (dívida técnica com risco)

4. **SEG-AUTH-001/002/003** — Isolar mock auth de `authSSR.js` para middleware de teste separado
5. **ARQ-DEL-001/002/003** — Consolidar `destroy`/`delete` em `eventoService` (bug latente de dados órfãos)
6. **ARQ-PATH-001** — Mover `require` inline de `eventoService.js` para o topo

### Média prioridade (UX e organização)

7. **FRONT-NAV-004** — Classe `active` na navbar admin
8. **FRONT-BUSCA-001/002/003** — Busca `?q=` nas listagens
9. **ARQ-ESC-001/002/003/004** — Extrair `getScopedEventoIds` para utilitário compartilhado

### Baixa prioridade (diferível)

10. **PERF-PAG** — Paginação server-side (diferível enquanto volumes ainda são pequenos)
11. **PERF-CACHE** — Cache de filtros (pré-maturo no estado atual)
12. **INTEG-FK-001/002** — Correção de `onDelete: CASCADE` → `RESTRICT` (baixo risco imediato)
13. **DASH-GEST-002/003/004** — Expansão do dashboard do gestor

---

## ETAPA 5 — Ações Imediatas Após Esta Auditoria

1. Mover as tasks **DASH-ADMIN-001** e **DASH-ADMIN-002** para o `_arquivo/` (já concluídas)
2. Marcar **DASH-ADMIN-003** como concluída (implementação existe no código)
3. Marcar **FRONT-NAV-001**, **FRONT-NAV-002**, **FRONT-NAV-005**, **FRONT-NAV-006** como concluídas
4. Marcar **FRONT-BUG-001** e **FRONT-BUG-002** como concluídas
5. Criar tasks para as features implementadas sem backlog que ainda precisam de documentação ou testes (ex.: integração R2, valicação por URL, alteração de senha)
