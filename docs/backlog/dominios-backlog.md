## DOMÍNIO 1: INTEGRIDADE DE DADOS

**Descrição:**
Garantias de consistência no banco de dados e na camada de serviço — constraints ausentes, race conditions, comportamento incorreto com soft delete e FKs com semântica inadequada.

---

**FEATURE: Prevenção de Certificados Duplicados**

Descrição:
O sistema permite criar múltiplos certificados ativos para o mesmo participante no mesmo evento e tipo. Não existe constraint composta no banco nem verificação prévia na camada de serviço.

PRIORIDADE: **CRÍTICA**

TASKS:

- Criar migration que adiciona índice único parcial `UNIQUE (participante_id, evento_id, tipo_certificado_id) WHERE deleted_at IS NULL` na tabela `certificados`
- Adicionar verificação de duplicata em `certificadoService.create()` antes de calcular o código, lançando erro 409 com mensagem clara se já existir certificado ativo para a combinação
- Substituir a geração de código via `COUNT + 1` por query que usa `MAX` sobre o campo `codigo` para o par (evento, tipo), tornando o incremento resistente a soft deletes e a `COUNT` concorrente

---

**FEATURE: Limpeza de Dados Duplicados Existentes**

Descrição:
Certificados duplicados podem já existir no banco antes da constraint ser aplicada. É necessário identificá-los e normalizá-los antes de adicionar o índice único.

PRIORIDADE: **CRÍTICA**

TASKS:

- Criar script SQL de auditoria que identifica certificados com duplicatas em `(participante_id, evento_id, tipo_certificado_id)` onde `deleted_at IS NULL`
- Criar script SQL de normalização que cancela (muda `status` para `'cancelado'`) todos os registros duplicados, mantendo apenas o mais recente por grupo
- Documentar no docs o procedimento de execução dos scripts como pré-requisito da migration de constraint

---

**FEATURE: Correção de FKs com `onDelete: CASCADE` em Entidades com Soft Delete**

Descrição:
As FKs das tabelas `certificados`, `usuario_eventos` e derivadas definem `onDelete: 'CASCADE'`. Entidades com soft delete (paranoid) nunca são hard-deleted pelo Sequelize, mas um hard delete manual no banco eliminaria os registros filhos permanentemente sem possibilidade de restore.

PRIORIDADE: **MÉDIA**

TASKS:

- Criar migration que altera `onDelete` das FKs `participante_id`, `evento_id` e `tipo_certificado_id` na tabela `certificados` de `CASCADE` para `RESTRICT`
- Criar migration equivalente para a FK `evento_id` na tabela `usuario_eventos`
- Atualizar os testes de integridade referencial para validar o comportamento `RESTRICT`

---

**FEATURE: Índice de Performance em `certificados.tipo_certificado_id`**

Descrição:
A migration de índices de performance cobre `evento_id` e `participante_id`, mas não `tipo_certificado_id`. Consultas filtradas por tipo (ex.: dashboard, relatórios) farão full scan conforme o volume crescer.

PRIORIDADE: **MÉDIA**

TASKS:

- Adicionar índice `idx_certificados_tipo_certificado_id` em nova migration ou complementar a migration 20260324083059-create-performance-indexes.js
- Garantir que o `down` da migration remove o índice corretamente

---

---

## DOMÍNIO 2: SEGURANÇA

**Descrição:**
Riscos identificados com impacto direto em segurança da aplicação e conformidade com OWASP e LGPD: vazamento de dados pessoais em logs, código de bypass de autenticação em produção e store de sessão volátil.

---

**FEATURE: Remoção de Log com Dados Pessoais (LGPD / OWASP A09)**

Descrição:
pdfService.js emite `console.log('PDFService certificado:', certificado)` antes de gerar o PDF, expondo o objeto completo do certificado — incluindo nome, dados dinâmicos e associações — em stdout em produção.

PRIORIDADE: **CRÍTICA**

TASKS:

- Remover o `console.log` da linha 14 de pdfService.js
- Substituir por log estruturado mínimo (ex.: `console.info('Gerando PDF para certificado id:', certificado.id)`) que registre apenas o ID, sem dados pessoais

---

**FEATURE: Isolamento do Código de Mock de Autenticação**

Descrição:
authSSR.js contém dois blocos `if (process.env.NODE_ENV === 'test')` que permitem injetar usuários falsos via header HTTP e via sessão. Se `NODE_ENV` estiver incorretamente configurado em produção, esses bypasses ficam ativos, permitindo autenticação sem credenciais.

PRIORIDADE: **ALTA**

TASKS:

- Remover os dois blocos `if (process.env.NODE_ENV === 'test')` de authSSR.js, deixando apenas o fluxo real de autenticação via cookie/JWT
- Criar arquivo `tests/middlewares/authSSR.mock.js` (ou equivalente) que exporte um middleware de mock carregado exclusivamente durante os testes
- Atualizar o setup de testes (setup.js) para registrar o middleware de mock em substituição ao real apenas em `NODE_ENV=test`
- Verificar e atualizar os testes existentes de authSSR para usar o novo mecanismo de mock

---

**FEATURE: Sessões Persistentes com `connect-pg-simple`**

Descrição:
A configuração atual de sessão usa `MemoryStore` (padrão do `express-session`), que não persiste entre restarts do processo, não é compartilhável entre múltiplos workers e vaza memória com muitos usuários. O PostgreSQL já está disponível como dependência.

PRIORIDADE: **ALTA**

TASKS:

- Instalar `connect-pg-simple` como dependência de produção
- Configurar `express-session` em app.js para usar `connect-pg-simple` como store, com `conString` via `DATABASE_URL`, `tableName: 'user_sessions'` e `pruneSessionInterval: 900`
- Definir `cookie.httpOnly: true`, `cookie.secure` condicional a `NODE_ENV === 'production'`, `cookie.sameSite: 'strict'` e `cookie.maxAge` apropriado (ex.: 8 horas)
- Criar migration que cria a tabela `user_sessions` conforme schema exigido pelo `connect-pg-simple`
- Adicionar `DATABASE_URL` ao .env.example se ainda não estiver presente

---

---

## DOMÍNIO 3: BACKEND — CAMADA DE SERVIÇO

**Descrição:**
Problemas de design interno na camada de services e controllers que geram comportamentos silenciosamente incorretos, dificultam testes e introduzem acoplamento entre camadas.

---

**FEATURE: Correção de Semântica em `eventoService` — `destroy` vs `delete`**

Descrição:
eventoService.js expõe dois métodos com comportamentos diferentes para a mesma operação de soft delete: `destroy()` não remove associações `UsuarioEvento`; `delete()` remove com cascata. Se o controller invocar `destroy()` por engano, as associações ficam órfãs silenciosamente.

PRIORIDADE: **ALTA**

TASKS:

- Renomear o método `delete()` de eventoService.js para `softDelete()` para explicitar a semântica com cascata em `UsuarioEvento`
- Remover o método `destroy()` público de eventoService.js (ou torná-lo privado/interno sem exposição no módulo)
- Mover o `require('../../src/models')` inline de dentro das funções para o topo do arquivo como import estático
- Atualizar o controller SSR de eventos para chamar `softDelete()` em vez do método anterior
- Atualizar os testes de `eventoService` para cobrir o comportamento de cascata em `UsuarioEvento`

---

**FEATURE: Eliminação de `require()` Inline em Services**

Descrição:
eventoService.js executa `require('../../src/models')` dentro do corpo de funções assíncronas. Além de ser um anti-pattern de Node.js (dificulta mock em testes), o path relativo profundo é frágil.

PRIORIDADE: **MÉDIA**

TASKS:

- Mover todos os `require` de eventoService.js para o topo do arquivo
- Verificar se outros services (`certificadoService`, `participanteService`, etc.) têm o mesmo padrão e corrigir onde encontrado
- Verificar se certificadoSSRController.js contém `require()` inline (ex.: `templateService` dentro da função `detalhe`) e movê-lo para o escopo do módulo

---

**FEATURE: Consolidação das Queries de Listagem no Service Layer**

Descrição:
certificadoSSRController.js acessa `Certificado.findAll()` diretamente em múltiplos pontos da função `index()`, contornando `certificadoService`. A lógica de filtragem por `eventoIds` do usuário está duplicada no controller em vez de estar centralizada no service.

PRIORIDADE: **MÉDIA**

TASKS:

- Adicionar método `findAllSSR({ where, include, eventoIds })` em certificadoService.js que centralize a query de listagem com suporte a filtros e escopo por evento
- Refatorar `certificadoSSRController.index()` para usar o novo método do service em vez de chamar `Certificado.findAll()` diretamente
- Extrair a função `getEventoIds(req)` de certificadoSSRController.js para um helper reutilizável (ex.: `src/utils/getScopedEventoIds.js`) acessível por todos os controllers SSR que precisam de filtragem por escopo

---

---

## DOMÍNIO 4: FRONTEND / UX ADMIN

**Descrição:**
Bugs de interface, inconsistências visuais e problemas de usabilidade no painel administrativo que afetam diretamente a operação diária de admins, gestores e monitores.

---

**FEATURE: Correção de Bugs Estruturais nas Views**

Descrição:
Dois bugs confirmados com impacto imediato na usabilidade: mensagem de feedback aparece duplicada em múltiplas páginas, e o botão "Remover" da tabela de certificados está renderizado na coluna errada.

PRIORIDADE: **CRÍTICA**

TASKS:

- Remover os blocos `{{#if flash.success}}` e `{{#if flash.error}}` locais de index.hbs, index.hbs e index.hbs — o layout admin.hbs já renderiza flash globalmente
- Mover o `<form method="POST" action="/admin/certificados/{{id}}/deletar">` de dentro do `<td>` de status para dentro do `<td>` de ações em index.hbs

---

**FEATURE: Padronização do Sistema de Ações nas Tabelas**

Descrição:
A mesma operação de soft delete usa labels e cores diferentes entre as páginas: `btn-danger` + "Remover" em certificados, participantes e eventos; `btn-warning` + "Arquivar" em usuários e tipos de certificados. O usuário não consegue prever o comportamento.

PRIORIDADE: **ALTA**

TASKS:

- Definir e documentar o padrão visual de ações no projeto: `btn-outline-primary` (Ver), `btn-outline-secondary` (Editar), `btn-outline-warning` (Cancelar — reversível), `btn-outline-danger` (Arquivar — soft delete), `btn-outline-success` (Restaurar)
- Aplicar o padrão unificado em index.hbs — ajustar cores e labels dos botões de ação
- Aplicar o padrão unificado em index.hbs
- Aplicar o padrão unificado em index.hbs
- Aplicar o padrão unificado em index.hbs
- Aplicar o padrão unificado em index.hbs
- Unificar o label da ação de soft delete para "Arquivar" em todas as páginas (substituir "Remover" onde aplicável), mantendo o `title` descritivo no botão

---

**FEATURE: Busca por Texto em Listagens sem Busca**

Descrição:
A listagem de participantes já possui busca `?q=`. As listagens de certificados, eventos e usuários não possuem campo de busca, obrigando o operador a rolar toda a tabela para localizar um registro.

PRIORIDADE: **ALTA**

TASKS:

- Adicionar campo de busca `?q=` na listagem de certificados (index.hbs e `certificadoSSRController.index()`), filtrando por `nome` e `codigo` via `ILIKE`
- Adicionar campo de busca `?q=` na listagem de eventos (index.hbs e `eventoSSRController.index()`), filtrando por `nome` e `codigo_base` via `ILIKE`
- Adicionar campo de busca `?q=` na listagem de usuários (index.hbs e `usuarioSSRController.index()`), filtrando por `nome` e `email` via `ILIKE`

---

**FEATURE: Melhoria da Navbar Administrativa**

Descrição:
A navbar admin é puramente textual, sem ícone, sem indicação de item ativo, com label "Tipos" truncado, e sem link para a área pública. A ausência de hierarquia visual dificulta a navegação.

PRIORIDADE: **BAIXA**

TASKS:

- Adicionar Font Awesome 6 via CDN no `<head>` do layout admin.hbs
- Adicionar ícone a cada item de navegação da navbar: Dashboard (`fa-house`), Certificados (`fa-award`), Participantes (`fa-users`), Eventos (`fa-calendar-days`), Tipos de Certificados (`fa-tags`), Usuários (`fa-user-gear`)
- Expandir o label "Tipos" para "Tipos de Certificados" na navbar para evitar ambiguidade
- Implementar classe `active` no item de navegação correspondente à rota atual, usando comparação de `req.path` disponível via `res.locals` (registrar em middleware global) ou via helper Handlebars
- Adicionar link "Área Pública" na navbar apontando para `/` (ou `/public/pagina/opcoes`), visível para todos os perfis
- Adicionar separador visual (`<hr class="dropdown-divider">` ou `<li class="nav-item">|</li>`) entre os grupos de navegação e o bloco de conta do usuário

---

## DOMÍNIO 5: PERFORMANCE E ESCALABILIDADE

**Descrição:**
Gargalos de carregamento identificados nas listagens SSR que não usam limite de registros, gerando potencial spike de memória e timeout sob volume real de dados.

---

**FEATURE: Paginação Server-Side nas Listagens do Painel Admin**

Descrição:
Todos os controllers SSR de listagem usam `findAll()` sem `limit`, carregando todos os registros do banco para renderizar a página. Com volume crescente, cada page load pode trazer milhares de linhas.

PRIORIDADE: **ALTA**

TASKS:

- Implementar paginação em `certificadoSSRController.index()`: substituir `Certificado.findAll()` por `Certificado.findAndCountAll({ limit: 20, offset, order: [['created_at', 'DESC']] })`, extraindo `page` de `req.query.page`
- Implementar paginação equivalente em `participanteSSRController.index()`
- Implementar paginação equivalente em `eventoSSRController.index()`
- Implementar paginação equivalente em `usuarioSSRController.index()`
- Criar helper Handlebars `pagination` (ou equivalente) que renderize controles de navegação Anterior / Página X de Y / Próxima, preservando query params existentes (filtros, busca)
- Atualizar as views de listagem (`certificados/index.hbs`, `participantes/index.hbs`, `eventos/index.hbs`, `usuarios/index.hbs`) para renderizar os controles de paginação abaixo da tabela

---

**FEATURE: Redução do Número de Queries por Page Load na Listagem de Certificados**

Descrição:
`certificadoSSRController.index()` executa 5–6 queries a cada request: escopo de evento, ativos, arquivados, eventos (filtro) e tipos (filtro). As queries de `Evento.findAll()` e `TiposCertificados.findAll()` para popular os selects de filtro não mudam com frequência e poderiam ser cacheadas.

PRIORIDADE: **MÉDIA**

TASKS:

- Identificar se as queries de `Evento.findAll()` e `TiposCertificados.findAll()` no controller de listagem de certificados têm necessidade de ser frescas a cada request ou podem ser cacheadas em memória por um TTL curto (ex.: 60 segundos)
- Implementar cache simples em memória (objeto JS com `timestamp + data`) para as listas de eventos e tipos usadas nos selects de filtro, invalidado após TTL ou após create/update/delete de evento ou tipo

---

---

## DOMÍNIO 6: DASHBOARD ADMINISTRATIVO

**Descrição:**
O dashboard atual exibe apenas contadores estáticos sem valor operacional. Faltam métricas que permitam ao admin entender o estado real do sistema e ao gestor acompanhar o progresso do seu evento.

---

**FEATURE: Enriquecimento do Dashboard Admin**

Descrição:
O perfil admin vê 4 cards de contagem (eventos, tipos, participantes, usuários), mas não tem visibilidade sobre certificados — a entidade central do sistema — nem sobre atividade recente.

PRIORIDADE: **ALTA**

TASKS:

- Adicionar card "Total de Certificados" ao dashboard admin, com contagem via `Certificado.count()`
- Adicionar card "Certificados com status pendente" para visibilidade operacional imediata
- Adicionar seção "Últimos 5 certificados emitidos" como tabela resumida (nome, evento, tipo, data), com query `findAll({ limit: 5, order: [['created_at', 'DESC']] })`
- Atualizar dashboardController.js para incluir as novas queries no bloco `Promise.all()` do perfil admin
- Atualizar dashboard.hbs para renderizar o novo card de certificados e a tabela de últimos emitidos no bloco `{{#if usuario.isAdmin}}`

---

**FEATURE: Enriquecimento do Dashboard Gestor/Monitor**

Descrição:
Gestores e monitores veem apenas total de certificados e total de participantes dentro do seu escopo. Falta granularidade por tipo de certificado para gestão efetiva do evento.

PRIORIDADE: **MÉDIA**

TASKS:

- Adicionar ao dashboard gestor/monitor uma listagem de certificados por tipo (ex.: Palestra: 42, Minicurso: 17), usando `Certificado.findAll({ where: eventoWhere, attributes: ['tipo_certificado_id', [fn('COUNT', ...), 'total']], group: ['tipo_certificado_id'], include: [TiposCertificados] })`
- Adicionar seção "Últimos 5 certificados emitidos" escopada ao(s) evento(s) do gestor/monitor
- Atualizar dashboardController.js para computar as novas métricas no bloco de gestor/monitor
- Atualizar dashboard.hbs para renderizar a tabela por tipo e os últimos certificados no bloco `{{else}}` (gestor/monitor)

---

## DOMÍNIO 7: ARQUITETURA E ORGANIZAÇÃO DE CÓDIGO

**Descrição:**
Problemas de design transversal que afetam múltiplas camadas simultaneamente: lógica de escopo de evento duplicada entre controllers, falta de separação clara entre responsabilidades e acoplamento que dificulta evolução segura do sistema.

---

**FEATURE: Helper de Escopo de Evento Reutilizável**

Descrição:
A lógica de "obter IDs de eventos acessíveis pelo usuário autenticado" está duplicada de forma levemente diferente em certificadoSSRController.js (via `UsuarioEvento.findAll`) e em participanteSSRController.js (via `Usuario.findByPk` com include). Qualquer novo controller SSR terá que reimplementar a mesma lógica, acumulando divergências silenciosas.

PRIORIDADE: **ALTA**

TASKS:

- Criar utilitário `src/utils/getScopedEventoIds.js` que receba `req.usuario` e retorne `null` para admin ou um array de IDs de eventos para gestor/monitor, usando uma única estratégia de query consistente
- Refatorar certificadoSSRController.js para usar `getScopedEventoIds` em substituição à função local `getEventoIds`
- Refatorar participanteSSRController.js para usar `getScopedEventoIds` em substituição à query inline de escopo
- Verificar demais controllers SSR (`eventoSSRController`, `tiposCertificadosSSRController`) e aplicar o mesmo utilitário onde aplicável
- Cobrir `getScopedEventoIds` com testes unitários para os três casos: admin (retorna null), gestor com eventos vinculados e gestor sem eventos vinculados

---

**FEATURE: Remoção de Acoplamento de Path em Services**

Descrição:
eventoService.js executa imports via `require('../../src/models')` dentro do corpo de funções. O path relativo `../../src/models` a partir de services está errado semanticamente (aponta para fora e volta), é frágil a reorganizações de diretório e impede mock eficaz em testes unitários.

PRIORIDADE: **MÉDIA**

TASKS:

- Auditar todos os arquivos em services e controllers em busca de `require()` fora do topo do módulo
- Mover todos os `require()` encontrados inline para o topo do respectivo arquivo
- Corrigir o path `../../src/models` em eventoService.js para o caminho relativo correto a partir de services (`../models`)
- Verificar se certificadoSSRController.js contém `require('../services/templateService')` dentro da função `detalhe` e movê-lo para o topo do arquivo

---

**FEATURE: Consolidação entre `destroy` e `delete` no `eventoService`**

Descrição:
eventoService.js expõe dois métodos públicos com semânticas divergentes para a mesma operação: `destroy()` faz apenas soft delete no evento; `delete()` faz soft delete e cascata em `UsuarioEvento`. Qualquer chamada ao método errado produz inconsistência silenciosa no banco.

PRIORIDADE: **ALTA**

TASKS:

- Renomear `delete()` para `softDelete()` em eventoService.js para explicitar a cascata
- Remover ou tornar privado (não exportado) o método `destroy()` em eventoService.js, prevenindo uso acidental
- Atualizar `eventoSSRController.js` para chamar `softDelete()` no lugar do método anterior
- Atualizar `eventoController.js` (API REST) para chamar `softDelete()` no lugar do método anterior
- Atualizar todos os testes de `eventoService` para refletir a nova nomenclatura e validar que a cascata em `UsuarioEvento` ocorre corretamente

---

---

## DOMÍNIO 8: TESTES

**Descrição:**
Lacunas de cobertura identificadas na auditoria que comprometem a capacidade de refatorar o sistema com segurança: ausência de testes para controllers SSR, ausência de testes de constraint de integridade e ausência de testes para o novo utilitário de escopo.

---

**FEATURE: Testes de Integração para Controllers SSR**

Descrição:
Os controllers SSR (`certificadoSSRController`, `participanteSSRController`, `eventoSSRController`, `usuarioSSRController`) não possuem testes. Qualquer refatoração ou adição de feature nesses controllers não tem cobertura de regressão, aumentando o risco de quebras silenciosas.

PRIORIDADE: **ALTA**

TASKS:

- Criar testes de integração para `certificadoSSRController`: cobrir `index` (listagem com e sem filtros), `criar` (sucesso e duplicata), `cancelar` e `deletar`
- Criar testes de integração para `participanteSSRController`: cobrir `index` (com e sem busca `?q=`), `criar` e `deletar`
- Criar testes de integração para `eventoSSRController`: cobrir `index`, `criar` e `deletar` com validação da cascata em `UsuarioEvento`
- Criar testes de integração para `usuarioSSRController`: cobrir `index`, `criar` e `deletar`
- Garantir que os testes SSR usam o middleware de mock de autenticação separado (`tests/middlewares/authSSR.mock.js`) e não dependem de authSSR.js de produção

---

**FEATURE: Testes de Constraint de Integridade em Certificados**

Descrição:
A nova constraint única parcial `UNIQUE (participante_id, evento_id, tipo_certificado_id) WHERE deleted_at IS NULL` e a verificação de duplicata em `certificadoService.create()` precisam de cobertura de teste específica para garantir que o comportamento se mantém após futuras migrações ou refatorações do service.

PRIORIDADE: **ALTA**

TASKS:

- Criar teste de unidade em `certificadoService` que verifica que `create()` lança erro 409 ao tentar criar certificado com `(participante_id, evento_id, tipo_certificado_id)` já existente e ativo
- Criar teste de unidade que verifica que `create()` **não** lança erro quando o certificado existente com a mesma combinação está com `deleted_at` preenchido (soft-deleted)
- Criar teste de integração que verifica que a constraint de banco rejeita inserção direta via SQL de certificado duplicado ativo
- Criar teste que verifica que a geração de código via `MAX` não repete o incremento ao restaurar um certificado previamente deletado

---

**FEATURE: Testes de Sessão com Store Persistente**

Descrição:
Após a substituição do `MemoryStore` por `connect-pg-simple`, o comportamento da sessão em cenários de restart e de múltiplos requests precisa de cobertura de teste para garantir que a configuração está correta.

PRIORIDADE: **MÉDIA**

TASKS:

- Criar teste de integração que verifica que uma sessão autenticada permanece válida após simulação de reinicialização do store (recriação da conexão)
- Criar teste que verifica que `cookie.httpOnly` está definido como `true` nos cabeçalhos de resposta do login
- Criar teste que verifica que `cookie.secure` não está presente em ambiente de teste (`NODE_ENV=test`) e está presente em ambiente de produção

---

---

## Visão Consolidada dos Domínios

| # | Domínio | Features | Prioridade Máxima |
|---|---------|----------|-------------------|
| 1 | Integridade de Dados | 4 | CRÍTICA |
| 2 | Segurança | 3 | CRÍTICA |
| 3 | Backend — Camada de Serviço | 3 | ALTA |
| 4 | Frontend / UX Admin | 4 | CRÍTICA |
| 5 | Performance e Escalabilidade | 2 | ALTA |
| 6 | Dashboard Administrativo | 2 | ALTA |
| 7 | Arquitetura e Organização | 3 | ALTA |
| 8 | Testes | 3 | ALTA |

**Total: 8 domínios · 24 features**