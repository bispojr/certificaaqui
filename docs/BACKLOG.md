# Backlog Técnico — Certifique-me

> Gerado com base na auditoria arquitetural de 11/03/2026.  
> Prioridades: 🔴 Crítica · 🟡 Importante · 🟢 Opcional

---

## ÉPICO 1 — Integridade do Banco de Dados

### TASK-01 🔴 Criar migrations Sequelize para todos os modelos

**Por que:** Sem migrations, o schema só existe via `sync({ force: true })`, que destrói dados a cada execução. Em produção e CI é inaceitável.

**Critérios de aceite:**

- [x] Migration de `participantes` criada (`up` e `down` completos)
- [x] Migration de `eventos` criada (`up` e `down` completos)
- [x] Migration de `tipos_certificados` criada (`up` e `down` completos)
- [x] Migration de `certificados` criada com foreign keys (`up` e `down` completos)
- [x] Migration de `usuarios` criada (`up` e `down` completos) ✅ _(depende de TASK-05)_
- [x] `tests/setup.js` atualizado para rodar `sequelize db:migrate` em vez de `sync({ force: true })`
- [x] CI executa migrations antes dos testes

**Estimativa:** 5 pontos  
**Dependências:** nenhuma

---

### TASK-02 🔴 Criar arquivo `.env.example` e remover credenciais default

**Por que:** Credenciais fracas hard-coded (`|| 'password'`) expõem o sistema em ambientes mal configurados e violam boas práticas de segurança (OWASP A02 — Cryptographic Failures).

**Critérios de aceite:**

- [x] Arquivo `.env.example` criado na raiz com todas as variáveis necessárias
- [x] `config/database.js` removido o fallback `|| 'password'` — variáveis obrigatórias lançam erro explícito se ausentes
- [x] `.env` adicionado ao `.gitignore`
- [x] `README.md` atualizado com instrução de copiar `.env.example` para `.env`

**Estimativa:** 1 ponto  
**Dependências:** nenhuma

---

### TASK-03 🔴 Separar `docker-compose.yml` por ambiente

**Por que:** Infraestrutura de testes misturada com produção no mesmo arquivo cria risco operacional.

**Critérios de aceite:**

- [x] `docker-compose.yml` contém apenas serviços de produção (`app`, `postgres`)
- [x] `docker-compose.test.yml` (ou `docker-compose.override.yml`) contém `postgres_test` e configurações de teste
- [x] Script npm `test` ou CI usa o compose correto para subir o banco de testes

**Estimativa:** 1 ponto  
**Dependências:** TASK-02

---

## ÉPICO 2 — Separação de Responsabilidades (MVC em Camadas)

### TASK-04 🔴 Criar camada de controllers

**Por que:** Sem controllers, toda lógica de negócio seria acumulada nos handlers de rota — violação de SRP e Separation of Concerns.

- [x] Criar `src/controllers/participanteController.js` com métodos REST
- [x] Criar `src/controllers/eventoController.js` com métodos REST
- [x] Criar `src/controllers/certificadoController.js` com métodos REST e cancelamento
- [x] Criar `src/controllers/tiposCertificadosController.js` com métodos REST
- [x] Cada controller delega para services (não implementa lógica de negócio diretamente)
- [x] Testes de rota (`tests/routes/`) cobrindo ao menos os casos de erro 400/404/422

**Estimativa:** 8 pontos  
**Dependências:** TASK-06 (services), TASK-01 (migrations)

---

### TASK-05 🔴 Implementar model `Usuario` e autenticação JWT

**Por que:** O sistema tem perfis definidos (`admin`, `gestor`, `monitor`) mas nenhuma rota é protegida. Expor endpoints sem autenticação é uma vulnerabilidade crítica (OWASP A01 — Broken Access Control).

**Subtarefas:**

- [x] Criar `src/models/usuario.js` com campos `nome`, `email`, `senha` (hash bcrypt), `perfil`, `evento_id` ✅ (13/03/2026)
- [x] Criar migration para tabela `usuarios` ✅ (13/03/2026)
  - [x] Criar `src/middlewares/auth.js` — valida JWT e popula `req.user` ✅
- [x] Criar `src/middlewares/rbac.js` — verifica perfil em relação à rota ✅
- [x] Criar `src/controllers/usuarioController.js` com `login`, `logout`, `me`
- [x] Criar `src/routes/usuarios.js`
- [x] Proteger todas as rotas de gestão com `auth` + `rbac` ✅ (13/03/2026)
- [x] Adicionar `jsonwebtoken` e `bcryptjs` às dependências ✅ (13/03/2026)

**Estimativa:** 13 pontos  
**Dependências:** TASK-01

---

### TASK-06 🟡 Criar camada de serviços (Service Layer)

**Por que:** Lógica de negócio como geração de certificado, interpolação de `texto_base`, validações complexas não deve viver nem no controller nem no model.

**Subtarefas:**

- [x] Criar `src/services/templateService.js` — interpola `texto_base` com `valores_dinamicos`
- [x] Criar `tests/services/templateService.test.js`

**Estimativa:** 8 pontos  
**Dependências:** TASK-01

---

### TASK-07 🟡 Criar rotas REST para todos os recursos

**Por que:** As rotas atuais são apenas stubs — nenhum endpoint real da aplicação está exposto.

**Subtarefas:**

- [x] Criar `src/routes/participantes.js` — CRUD completo
- [x] Remover `routes/users.js` (stub sem domínio)
- [x] Criar `src/routes/eventos.js` — CRUD completo
- [x] Criar `src/routes/certificados.js` — emissão, consulta, cancelamento, restauração
- [x] Criar `src/routes/tiposCertificados.js`
- [x] Registrar todas as rotas no `app.js` ✅

**Estimativa:** 5 pontos  
**Dependências:** TASK-04, TASK-05

---

## ÉPICO 3 — Qualidade e Manutenibilidade

### TASK-08 🟡 Substituir carregamento dinâmico em `models/index.js`

**Por que:** `fs.readdirSync` impede análise estática, pode carregar arquivos inesperados e dificulta refatoração.

**Critérios de aceite:**

- [x] Modelos registrados explicitamente em `models/index.js` ✅ (13/03/2026)
- [x] Nenhum uso de `fs.readdirSync` no loader ✅ (13/03/2026)
- [x] Todos os testes existentes continuam passando ✅ (13/03/2026)

**Estimativa:** 1 ponto  
**Dependências:** nenhuma

---

### TASK-09 🟡 Corrigir validação cross-field em `TiposCertificados`

**Por que:** A validação de `campo_destaque` via `this.dados_dinamicos` dentro de um validator de campo é frágil — a ordem de atribuição dos campos em `this` não é garantida pelo Sequelize.

**Critérios de aceite:**

- [x] Validação movida para hook `beforeValidate` em `tipos_certificados.js` ✅ (13/03/2026)
- [x] Teste existente de `campo_destaque` inválido continua passando ✅ (13/03/2026)
- [x] Comportamento documentado com comentário no código ✅ (13/03/2026)

**Estimativa:** 2 pontos  
**Dependências:** nenhuma

---

### TASK-10 🟡 Corrigir `package.json` com metadados reais

**Critérios de aceite:**

- [x] `"name"` alterado para `"certifique-me"` ✅ (13/03/2026)
- [x] Campo `"description"` adicionado ✅ (13/03/2026)
- [x] Campo `"author"` preenchido ✅ (13/03/2026)

**Estimativa:** 0.5 ponto  
**Dependências:** nenhuma

---

## ÉPICO 4 — Documentação Técnica

### TASK-11 🟡 Criar estrutura de documentação em `/docs`

**Critérios de aceite:**

- [x] `docs/visao-geral.md` — descrição do sistema, stakeholders, glossário
- [x] `docs/arquitetura.md` — diagramas C4 (Context, Container, Component) em Mermaid
- [x] `docs/modulos.md` — descrição de cada entidade, campos e regras de negócio
- [x] `docs/desenvolvimento.md` — setup local, variáveis de ambiente, como rodar testes
- [x] `docs/deploy.md` — deploy com Docker, processo de migration em produção
- [x] `docs/decisoes/001-orm-sequelize.md` — ADR: escolha do Sequelize
- [x] `docs/decisoes/002-soft-delete-paranoid.md` — ADR: soft delete
- [x] `docs/decisoes/003-jsonb-dados-dinamicos.md` — ADR: uso de JSONB

**Estimativa:** 5 pontos  
**Dependências:** TASK-04, TASK-05, TASK-07

---

### TASK-12 🟢 Adicionar health check endpoint

**Critérios de aceite:**

- [x] `GET /health` retorna `{ status: 'ok', db: 'connected', uptime: <segundos> }`
- [x] Se o banco estiver indisponível, retorna `503` com `{ status: 'error', db: 'disconnected' }` ✅ (13/03/2026)

**Estimativa:** 1 ponto  
**Dependências:** TASK-07

---

## ÉPICO 5 — Tooling e Padronização

### TASK-13 🟢 Adicionar linter (ESLint) e formatter (Prettier)

**Critérios de aceite:**

- [x] `.eslintrc.js` configurado com `eslint:recommended`
- [x] `.prettierrc` configurado (aspas simples, sem ponto-e-vírgula, 2 espaços)
- [x] Script `"lint": "eslint src/**"` adicionado ao `package.json`
- [x] Script `"format": "prettier --write ."` adicionado
- [x] CI executa lint antes dos testes

**Estimativa:** 2 pontos  
**Dependências:** nenhuma

---

### TASK-14 🟢 Adicionar validação de entrada com Zod nas rotas

**Por que:** Validações do Sequelize ocorrem na camada de banco — payloads malformados devem ser rejeitados antes de chegar ao controller (defesa em profundidade).


**Critérios de aceite:**

- [x] Schemas Zod criados em `src/validators/` para cada recurso ✅ (14/03/2026)
- [x] Middleware de validação aplicado nas rotas `POST` e `PUT` ✅ (14/03/2026)
- [x] Erros de validação retornam `400` com lista de campos inválidos ✅ (14/03/2026)

**Estimativa:** 3 pontos  
**Dependências:** TASK-07

---


### TASK-15 🟢 Documentar API com Swagger/OpenAPI

**Critérios de aceite:**

- [x] `swagger-jsdoc` e `swagger-ui-express` instalados ✅ (2026-03-14 12:24 (BRT))
- [x] Anotações JSDoc `@swagger` nas rotas ✅ (2026-03-14 12:24 (BRT))
- [x] Interface disponível em `GET /api-docs` ✅ (2026-03-14 12:24 (BRT))

**Estimativa:** 5 pontos  
**Dependências:** TASK-07

---

## Ordem de Execução Sugerida

```
Sprint 1 (fundação)
  TASK-02 → TASK-01 → TASK-03 → TASK-08 → TASK-09 → TASK-10

Sprint 2 (backend funcional)
  TASK-06 → TASK-04 → TASK-07 → TASK-05

Sprint 3 (qualidade)
  TASK-11 → TASK-12 → TASK-13 → TASK-14

Sprint 4 (refinamento)
  TASK-15
```

## Sumário de Pontuação

| Épico                                    | Pontos   | Prioridade    |
| ---------------------------------------- | -------- | ------------- |
| Épico 1 — Integridade do Banco           | 7        | 🔴 Crítica    |
| Épico 2 — Separação de Responsabilidades | 34       | 🔴/🟡         |
| Épico 3 — Qualidade e Manutenibilidade   | 3.5      | 🟡 Importante |
| Épico 4 — Documentação                   | 6        | 🟡/🟢         |
| Épico 5 — Tooling                        | 10       | 🟢 Opcional   |
| **Total**                                | **60.5** |               |

---

## ÉPICO 6 — Bugfixes e Funcionalidades Core (Auditoria 03 — 2026-03-14)

> Gerado com base na auditoria arquitetural comparativa de 14/03/2026.

### TASK-16 🔴 Corrigir `templateService.js` — formato de interpolação

**Por que:** O `templateService.js` usa `{{chave}}` mas a especificação (FR-13) e o repositório de referência usam `${campo}`. Nenhuma interpolação de certificado funciona atualmente.

**Critérios de aceite:**

- [ ] `src/services/templateService.js` usa regex `\$\{(\w+)\}` para interpolação
- [ ] Testes de `templateService` atualizados para o formato correto
- [ ] Certificados existentes continuam sendo processados corretamente

**Estimativa:** 1 ponto  
**Dependências:** nenhuma

---


### TASK-17 🔴 Corrigir `JWT_SECRET` inconsistente entre `middleware/auth.js` e `usuarioController.js`

**Por que:** `middleware/auth.js` usa fallback `'segredo-super-seguro'`; `usuarioController.js` usa fallback `'secret'`. Em ambientes sem `.env`, login retorna token mas toda requisição autenticada falha com 401.

**Critérios de aceite:**

- [x] Ambos os arquivos usam `process.env.JWT_SECRET` sem fallback
- [x] Lançar erro explícito se `JWT_SECRET` não estiver configurado
- [x] Teste de integração de autenticação passa sem `.env` com erro claro — concluído em 2026-03-14 19:18 (BRT)

**Estimativa:** 0.5 ponto  
**Dependências:** TASK-02

---


### TASK-18 🔴 Corrigir `scopedEvento.js` para modelo N:N — concluído em 2026-03-14 22:14 (BRT)

**Por que:** `scopedEvento.js` usa `req.usuario.evento_id` (campo removido na migração `20260313195000-remove-evento_id-from-usuarios.js`). Gestores e monitores recebem 403 em todas as operações de alteração.

**Critérios de aceite:**

- [x] `scopedEvento.js` carrega os eventos do usuário via `req.usuario.getEventos()`
- [x] Gestor/monitor com um evento vinculado consegue criar/editar certificados desse evento
- [x] Gestor/monitor sem evento vinculado recebe 403 com mensagem clara
- [x] Admin passa pelo middleware sem restrição
- [x] Testes de `scopedEvento` atualizados para o modelo N:N

**Estimativa:** 3 pontos  
**Dependências:** TASK-05

---

### TASK-19 🔴 Implementar rotas públicas de consulta e validação (FR-23, FR-24)

**Por que:** As rotas públicas são o principal ponto de contato do participante com o sistema. Estão especificadas (FR-23, FR-24) mas não implementadas.

**Subtarefas:**

- [ ] Criar `src/routes/public.js` com rotas sem autenticação
- [ ] `GET /public/certificados?email=...` — retorna certificados do participante por email
- [ ] `GET /public/validar/:codigo` — valida autenticidade de um certificado por código
- [ ] Registrar rotas em `app.js`
- [ ] Testes cobrindo busca por email e validação por código (válido e inválido)

**Estimativa:** 5 pontos  
**Dependências:** TASK-07

---

### TASK-20 🔴 Implementar geração de PDF (`pdfService.js`)

**Por que:** A funcionalidade core para o participante é obter o certificado em PDF. É a principal funcionalidade do repositório de referência e está ausente no projeto atual.

**Subtarefas:**

- [ ] Criar `src/services/pdfService.js` usando PDFKit
- [ ] Gerar PDF com texto interpolado (`templateService`) e layout básico
- [ ] Rota `GET /public/certificados/:id/pdf` retorna o arquivo para download
- [ ] PDF contém: nome do evento, data, nome do participante, texto do certificado, código de validação
- [ ] Testes de geração de PDF (smoke test — verifica que o buffer não está vazio)

**Estimativa:** 8 pontos  
**Dependências:** TASK-16, TASK-19

---

### TASK-21 🟡 Mover `middleware/auth.js` para `src/middlewares/auth.js`

**Por que:** Inconsistência de localização entre `middleware/auth.js` (raiz) e `src/middlewares/rbac.js`, `scopedEvento.js` (src). Dificulta refatorações e navegação.

**Critérios de aceite:**

- [ ] `middleware/auth.js` movido para `src/middlewares/auth.js`
- [ ] Todos os imports em rotas atualizados
- [ ] Todos os testes de autenticação continuam passando

**Estimativa:** 1 ponto  
**Dependências:** TASK-17

---

### TASK-22 🟡 Adicionar paginação nas listagens

**Por que:** `findAll()` sem limite retorna todos os registros, causando degradação de performance com o crescimento dos dados.

**Critérios de aceite:**

- [ ] Todos os serviços de listagem aceitam `{ page, perPage }` como parâmetros
- [ ] Resposta retorna `{ data: [], meta: { total, page, perPage } }`
- [ ] Valor padrão: `perPage = 20`
- [ ] Parâmetros de query `?page=1&perPage=20` documentados no Swagger

**Estimativa:** 3 pontos  
**Dependências:** TASK-07

---

### TASK-23 🟡 Validar `valores_dinamicos` contra `dados_dinamicos` no service

**Por que:** Certificados com campos ausentes passam validação silenciosamente mas falham na interpolação. A validação deve ocorrer antes de persistir.

**Critérios de aceite:**

- [ ] `certificadoService.create` verifica que todos os campos de `dados_dinamicos` do tipo estão em `valores_dinamicos`
- [ ] Erro 400 com lista de campos faltantes quando inválido
- [ ] Teste cobrindo o caso de campos ausentes

**Estimativa:** 2 pontos  
**Dependências:** TASK-06

---

### TASK-24 🟡 Corrigir cascata de soft delete em `eventoService`

**Por que:** `eventoService.delete` usa `UsuarioEvento.update({ deleted_at })` manualmente, bypassando o Sequelize paranoid. A restauração de eventos não restaura as associações.

**Critérios de aceite:**

- [ ] `eventoService.delete` usa `UsuarioEvento.destroy({ where: { evento_id: id } })` com `paranoid: true`
- [ ] Restaurar evento também restaura `usuario_eventos` via `UsuarioEvento.restore()`
- [ ] Testes cobrindo delete e restore de evento com associações

**Estimativa:** 2 pontos  
**Dependências:** TASK-01

---

### TASK-25 🟡 Adicionar rate limiting nos endpoints de autenticação

**Por que:** O endpoint `POST /usuarios/login` está vulnerável a ataques de força bruta (OWASP A07).

**Critérios de aceite:**

- [ ] `express-rate-limit` instalado como dependência
- [ ] Rate limit de 20 tentativas por 15 minutos aplicado em `POST /usuarios/login`
- [ ] Resposta 429 com mensagem clara quando limite excedido

**Estimativa:** 1 ponto  
**Dependências:** TASK-05

---

### TASK-26 🟢 Documentar ADR-004 a ADR-008

**Por que:** Cinco decisões arquiteturais identificadas na auditoria 03 ainda não foram formalizadas.

**Critérios de aceite:**

- [ ] `docs/decisoes/004-geracao-pdf.md` — engine de PDF
- [ ] `docs/decisoes/005-vinculo-usuario-evento.md` — N:N vs FK simples
- [ ] `docs/decisoes/006-paginacao-api.md` — estratégia de paginação
- [ ] `docs/decisoes/007-validacao-valores-dinamicos.md` — onde validar
- [ ] `docs/decisoes/008-armazenamento-pdfs.md` — estratégia de storage

**Estimativa:** 3 pontos  
**Dependências:** nenhuma

---

### TASK-27 🟢 Adicionar índices de banco de dados para performance

**Por que:** Sem índices nas colunas de alta cardinalidade, consultas degradam linearmente com o volume.

**Critérios de aceite:**

- [ ] Migration adicionando índices em `certificados(evento_id)`, `certificados(participante_id)`, `certificados(status)`, `participantes(email)`, `usuarios(email)`
- [ ] Testes de migration passam

**Estimativa:** 1 ponto  
**Dependências:** TASK-01

---

## Ordem de Execução Atualizada (Sprint 5+)

```
Sprint 5 (bugfixes críticos — ANTES de qualquer deploy)
  TASK-17 → TASK-16 → TASK-18

Sprint 6 (interface pública — paridade com referência)
  TASK-19 → TASK-28 → TASK-29

Sprint 7 (interface administrativa)
  TASK-30 → TASK-31 → TASK-32 → TASK-33 → TASK-34 → TASK-35 → TASK-36

Sprint 8 (PDF + testes de interface)
  TASK-20 → TASK-37 → TASK-38 → TASK-39 → TASK-40

Sprint 9 (qualidade e segurança)
  TASK-21 → TASK-22 → TASK-23 → TASK-24 → TASK-25

Sprint 10 (documentação e otimização)
  TASK-26 → TASK-27
```

## Sumário de Pontuação Atualizado

| Épico                                         | Pontos   | Prioridade    |
| --------------------------------------------- | -------- | ------------- |
| Épico 1 — Integridade do Banco                | 7        | 🔴 Crítica    |
| Épico 2 — Separação de Responsabilidades      | 34       | 🔴/🟡         |
| Épico 3 — Qualidade e Manutenibilidade        | 3.5      | 🟡 Importante |
| Épico 4 — Documentação                        | 6        | 🟡/🟢         |
| Épico 5 — Tooling                             | 10       | 🟢 Opcional   |
| Épico 6 — Bugfixes e Core (Auditoria 03)      | 30.5     | 🔴/🟡/🟢      |
| Épico 7 — Interface Web (Views Handlebars)    | 34       | 🔴/🟡         |
| Épico 8 — Testes de Interface E2E             | 13       | 🟡/🟢         |
| **Total**                                     | **138**  |               |

---

## ÉPICO 7 — Interface Web: Views Handlebars

> Gerado com base na análise das views do repositório de referência (EduComp 2025) e nas singularidades do projeto Certifique-me (autenticação, RBAC, multi-evento).
>
> **Nota sobre tecnologia de testes de view:** As tasks de teste de interface (ÉPICO 8) utilizam **Playwright** em vez de Selenium. Playwright é o padrão moderno para testes E2E em Node.js — instalação mais simples (`npm install @playwright/test`), sem driver externo, suporte nativo a async/await e relatórios HTML integrados. Selenium permanece compatível se houver necessidade de integração com infraestrutura legada.

---

### TASK-28 🔴 Estender layout base (`views/layout.hbs`) com Bootstrap e estrutura SSR

**Por que:** O `layout.hbs` atual é um esqueleto mínimo sem CSS, navbar, ou suporte a sessões autenticadas. Todas as demais views dependem de um layout funcional.

**Estrutura de diretórios resultante:**

```
views/
  layout.hbs              — layout público (navbar mínima, link "Validar certificado")
  layouts/
    admin.hbs             — layout autenticado (navbar com menu por perfil, logout)
  partials/
    flash.hbs             — componente de mensagens de sucesso/erro/alerta
    nav-public.hbs        — barra de navegação pública
    nav-admin.hbs         — barra de navegação admin com links por perfil
  error.hbs               — página de erro genérica (404, 403, 500)
```

**Critérios de aceite:**

- [ ] `views/layout.hbs` inclui Bootstrap 5 via CDN e slot `{{{body}}}`
- [ ] `views/layouts/admin.hbs` exibe navbar com nome do usuário logado, seu perfil e botão "Sair"
- [ ] `views/partials/flash.hbs` exibe mensagens de `req.flash` (sucesso em verde, erro em vermelho)
- [ ] `connect-flash` e `express-session` instalados e configurados em `app.js`
- [ ] `views/error.hbs` exibe código HTTP, mensagem e link "Voltar ao início"

**Estimativa:** 3 pontos  
**Dependências:** nenhuma

---

### TASK-29 🔴 Views públicas de certificados (paridade com repositório de referência)

**Por que:** São as 5 views que o participante usa para consultar e validar certificados. Equivalentes diretos das views do EduComp 2025, adaptadas para a arquitetura com banco de dados e API REST do Certifique-me.

**Views a criar:**

```
views/
  certificados/
    opcoes.hbs          — página inicial: botões "Obter meu certificado" e "Validar certificado"
    form-obter.hbs      — formulário: campo email + botão "Buscar" + spinner de loading
    obter-lista.hbs     — lista de certificados encontrados com botão "Baixar PDF" por item
    form-validar.hbs    — formulário: campo código + botão "Validar"
    validar-resultado.hbs — resultado: painel verde (válido) ou vermelho (inválido) com dados
```

**Detalhes de cada view:**

| View | Dados recebidos pelo template | Comportamento |
|---|---|---|
| `opcoes.hbs` | — | Dois botões de navegação para as outras views |
| `form-obter.hbs` | `mensagem?` (erro) | Form POST para `/certificados/buscar`; spinner ao submeter |
| `obter-lista.hbs` | `email`, `certificados[]` (nome, descrição, id, campos dinâmicos) | Lista agrupada por tipo; botão de download por certificado |
| `form-validar.hbs` | `mensagem?` (erro) | Form POST para `/certificados/validar`; campo de código |
| `validar-resultado.hbs` | `valido` (bool), `dados` (código, evento, data, nome, atividade, campo_destaque) | Painel colorido com dados de autenticidade + link "Validar outro" |

**Critérios de aceite:**

- [ ] Todas as 5 views criadas em `views/certificados/`
- [ ] Rota SSR `GET /certificados` renderiza `opcoes.hbs`
- [ ] Rota SSR `GET /certificados/obter` renderiza `form-obter.hbs`
- [ ] Rota SSR `POST /certificados/buscar` chama `publicCertificadoController`, renderiza `obter-lista.hbs` ou `form-obter.hbs` com mensagem de erro
- [ ] Rota SSR `GET /certificados/validar` renderiza `form-validar.hbs`
- [ ] Rota SSR `POST /certificados/validar` chama validação, renderiza `validar-resultado.hbs`
- [ ] `obter-lista.hbs` usa `{{#each}}` para iterar certificados e herda estrutura dinâmica de `dados_dinamicos`
- [ ] Spinner de loading em `form-obter.hbs` (JS inline — igual ao repositório de referência)
- [ ] `validar-resultado.hbs` exibe `campo_destaque` somente quando diferente de `nome_completo`

**Estimativa:** 8 pontos  
**Dependências:** TASK-28, TASK-19

---

### TASK-30 🔴 View de login e rotas SSR de autenticação

**Por que:** A interface de login é o ponto de entrada para qualquer usuário interno. Sem ela, o painel administrativo fica inacessível via browser.

**Views a criar:**

```
views/
  auth/
    login.hbs       — formulário de login (email + senha + botão "Entrar")
```

**Critérios de aceite:**

- [ ] `views/auth/login.hbs` criada com formulário POST para `/auth/login`
- [ ] Exibe mensagem de erro via `{{#if mensagem}}` (credenciais inválidas)
- [ ] Rota SSR `GET /auth/login` renderiza a view de login
- [ ] Rota SSR `POST /auth/login` verifica credenciais, salva JWT em cookie httpOnly e redireciona para `/admin/dashboard`
- [ ] Rota SSR `POST /auth/logout` limpa o cookie e redireciona para `/auth/login`
- [ ] Middleware SSR `authSSR` (separado do JWT da API) valida o cookie e protege rotas `/admin/*`
- [ ] Usuário já autenticado que acessa `/auth/login` é redirecionado para `/admin/dashboard`

**Estimativa:** 5 pontos  
**Dependências:** TASK-28, TASK-17

---

### TASK-31 🟡 Dashboard administrativo

**Por que:** Após o login, o usuário precisa de uma página inicial que mostre o contexto do sistema e os atalhos relevantes ao seu perfil.

**Views a criar:**

```
views/
  admin/
    dashboard.hbs   — painel inicial pós-login
```

**Dados exibidos por perfil:**

| Perfil | Conteúdo do dashboard |
|---|---|
| **admin** | Total de eventos, participantes, certificados emitidos, usuários; atalhos para todos os módulos |
| **gestor** | Total de certificados e participantes do seu(s) evento(s); atalhos para certificados e tipos |
| **monitor** | Total de certificados do seu evento; atalho para emissão de certificados |

**Critérios de aceite:**

- [ ] `views/admin/dashboard.hbs` criada usando `views/layouts/admin.hbs`
- [ ] Rota SSR `GET /admin/dashboard` protegida por `authSSR`
- [ ] Cards de resumo com contagens reais do banco (via `dashboardController`)
- [ ] Conteúdo dos cards condicional ao `perfil` do usuário autenticado (`{{#if isAdmin}}`)
- [ ] Link para "Certificados públicos" redireciona para `/certificados`

**Estimativa:** 3 pontos  
**Dependências:** TASK-30

---

### TASK-32 🟡 Views de gestão de eventos

**Por que:** Eventos são a entidade raiz do sistema. Gestão via interface simplifica o trabalho dos administradores.

**Views a criar:**

```
views/
  admin/
    eventos/
      index.hbs   — tabela paginada de eventos com ações (editar, remover, restaurar)
      form.hbs    — formulário criar/editar evento (nome, ano, codigo_base)
```

**Critérios de aceite:**

- [ ] `views/admin/eventos/index.hbs` com tabela, paginação e botões de ação
- [ ] `views/admin/eventos/form.hbs` com campos validados via atributos HTML5 (`required`, `pattern`)
- [ ] Rotas SSR: `GET /admin/eventos`, `GET /admin/eventos/novo`, `GET /admin/eventos/:id/editar`, `POST /admin/eventos`, `POST /admin/eventos/:id`, `POST /admin/eventos/:id/deletar`
- [ ] Eventos removidos (soft delete) exibidos em seção colapsável "Eventos arquivados" com botão "Restaurar"
- [ ] Mensagens flash de sucesso/erro após cada operação
- [ ] Acesso restrito a perfil `admin`

**Estimativa:** 5 pontos  
**Dependências:** TASK-28, TASK-31

---

### TASK-33 🟡 Views de gestão de participantes

**Por que:** Participantes são gerenciados por administradores e gestores. A interface facilita a importação manual e a consulta.

**Views a criar:**

```
views/
  admin/
    participantes/
      index.hbs   — tabela de participantes com busca por nome/email e paginação
      form.hbs    — formulário criar/editar participante (nomeCompleto, email, instituicao)
```

**Critérios de aceite:**

- [ ] Tabela com colunas: nome, email, instituição, nº de certificados, ações
- [ ] Campo de busca por nome ou email (query `?q=` na listagem)
- [ ] Formulário com validação HTML5 de email
- [ ] Participantes removidos exibidos separadamente com opção de restaurar
- [ ] Rotas SSR protegidas por `authSSR` + `rbac('monitor')` (todos os perfis autenticados)
- [ ] Mensagens flash após cada operação

**Estimativa:** 5 pontos  
**Dependências:** TASK-28, TASK-31

---

### TASK-34 🟡 Views de gestão de certificados

**Por que:** É o módulo principal do sistema — emissão, visualização, cancelamento e restauração de certificados via interface.

**Views a criar:**

```
views/
  admin/
    certificados/
      index.hbs   — tabela de certificados com filtros (evento, status, tipo) e paginação
      form.hbs    — formulário de emissão: selects de participante/tipo, campos dinâmicos gerados via JS
      detalhe.hbs — visualização de um certificado com texto interpolado e botão "Baixar PDF"
```

**Critérios de aceite:**

- [ ] `index.hbs` com filtros por evento, status (`emitido`, `pendente`, `cancelado`) e tipo de certificado
- [ ] `form.hbs` carrega dinamicamente os campos de `dados_dinamicos` ao selecionar o tipo de certificado (fetch JS para `GET /tipos-certificados/:id`)
- [ ] `detalhe.hbs` exibe o texto final interpolado e link de download do PDF
- [ ] Botão "Cancelar" em certificados com status `emitido` (confirmação via modal)
- [ ] Botão "Restaurar" em certificados com `deleted_at` não nulo
- [ ] Rotas SSR protegidas por `authSSR` + `rbac('monitor')` + `scopedEvento`
- [ ] Gestor/monitor só vê certificados do seu evento

**Estimativa:** 8 pontos  
**Dependências:** TASK-28, TASK-31, TASK-18

---

### TASK-35 🟡 Views de gestão de tipos de certificados

**Por que:** Tipos de certificados definem o template do documento. Gestores precisam criar e editar tipos sem intervenção técnica.

**Views a criar:**

```
views/
  admin/
    tipos-certificados/
      index.hbs   — tabela de tipos com código, descrição e nº de certificados emitidos
      form.hbs    — formulário criar/editar: código, descrição, campo_destaque, texto_base, campos dinâmicos (JSONB editor)
```

**Critérios de aceite:**

- [ ] `form.hbs` contém editor de campos dinâmicos: botão "+ Adicionar campo" cria pares chave/valor dinamicamente via JS
- [ ] Preview ao vivo do `texto_base` interpolado com valores de exemplo (JS)
- [ ] `campo_destaque` populado via `<select>` que se atualiza conforme campos dinâmicos são adicionados
- [ ] Validação client-side: `codigo` aceita apenas 2 letras (atributo `pattern`)
- [ ] Rotas SSR protegidas por `authSSR` + `rbac('gestor')`
- [ ] Mensagens flash após cada operação

**Estimativa:** 8 pontos  
**Dependências:** TASK-28, TASK-31

---

### TASK-36 🟡 Views de gestão de usuários

**Por que:** Administradores precisam criar, editar e vincular usuários a eventos via interface.

**Views a criar:**

```
views/
  admin/
    usuarios/
      index.hbs   — tabela de usuários com perfil, eventos vinculados e ações
      form.hbs    — formulário criar/editar: nome, email, senha, perfil, seleção múltipla de eventos
```

**Critérios de aceite:**

- [ ] `form.hbs` exibe campo de senha no modo "criação" e campo "Nova senha (opcional)" no modo "edição"
- [ ] Seleção múltipla de eventos com checkboxes (somente para `gestor` e `monitor`)
- [ ] Campo de eventos oculto via JS quando perfil `admin` é selecionado
- [ ] Rotas SSR protegidas por `authSSR` + `rbac('admin')` (somente admin)
- [ ] Usuários removidos exibidos separadamente com opção de restaurar
- [ ] Mensagens flash após cada operação

**Estimativa:** 5 pontos  
**Dependências:** TASK-28, TASK-31

---

## ÉPICO 8 — Testes de Interface E2E (Playwright)

> **Ferramenta recomendada:** Playwright (`@playwright/test`) — integra nativamente com Node.js, não exige WebDriver externo, suporta múltiplos browsers (Chromium, Firefox, WebKit) e tem relatório HTML integrado.
>
> **Alternativa:** Selenium WebDriver com `selenium-webdriver` npm — viável se o ambiente de CI já tiver infraestrutura Selenium Grid.
>
> Os testes são organizados em três grupos: **fluxo público**, **autenticação e RBAC**, e **fluxo administrativo**.

---

### TASK-37 🟡 Configurar ambiente de testes E2E (Playwright)

**Por que:** Sem setup, nenhum teste de interface pode ser executado.

**Critérios de aceite:**

- [ ] `@playwright/test` instalado como devDependency
- [ ] `playwright.config.js` criado na raiz com `baseURL: 'http://localhost:3000'`
- [ ] Browsers instalados: Chromium (obrigatório) + Firefox (opcional)
- [ ] Script `"test:e2e": "playwright test"` adicionado ao `package.json`
- [ ] Diretório `tests/e2e/` criado com estrutura por grupo (público, auth, admin)
- [ ] `tests/e2e/setup/seed.js` criado para popular banco de testes com dados mínimos antes dos E2E
- [ ] CI executa E2E após os testes unitários (`npm run test:ci && npm run test:e2e`)
- [ ] `.gitignore` atualizado para excluir `playwright-report/` e `test-results/`

**Estimativa:** 3 pontos  
**Dependências:** TASK-28

---

### TASK-38 🟡 Testes E2E — Fluxo Público de Certificados

**Por que:** O fluxo público é o mais crítico para o usuário final (participante). Regressões nesse fluxo precisam ser detectadas imediatamente.

**Casos de uso a cobrir:**

| UC | Descrição | Resultado esperado |
|---|---|---|
| **UC-P01** | Participante acessa `/certificados` | Página de opções exibida com botões "Obter" e "Validar" |
| **UC-P02** | Participante clica "Obter" → vai para `/certificados/obter` | Formulário com campo email exibido |
| **UC-P03** | Participante submete email cadastrado com certificados | Lista de certificados exibida com botão "Baixar PDF" por item |
| **UC-P04** | Participante submete email não encontrado | Mensagem de erro exibida; formulário mantido |
| **UC-P05** | Participante submete email com formato inválido | Validação HTML5 impede envio; campo marcado como inválido |
| **UC-P06** | Participante acessa `/certificados/validar` | Formulário com campo código exibido |
| **UC-P07** | Participante submete código válido | Painel verde com código, evento, nome, atividade e campo destaque |
| **UC-P08** | Participante submete código inválido | Painel vermelho com mensagem de código não encontrado |
| **UC-P09** | Participante clica "Validar outro" na tela de resultado | Redirecionado para `form-validar.hbs` com formulário limpo |
| **UC-P10** | Participante clica "Baixar PDF" em um certificado | Download iniciado (verifica header `Content-Type: application/pdf`) |

**Critérios de aceite:**

- [ ] Arquivo `tests/e2e/publico.spec.js` com todos os 10 casos de uso
- [ ] Testes usam `page.fill()`, `page.click()`, `page.waitForURL()`, `expect(page).toHaveURL()`
- [ ] UC-P10 usa `page.waitForEvent('download')` para verificar o download
- [ ] Todos os testes passam com banco de testes populado com seed de participante + certificado

**Estimativa:** 5 pontos  
**Dependências:** TASK-37, TASK-29, TASK-20

---

### TASK-39 🟡 Testes E2E — Autenticação e RBAC

**Por que:** Erros no controle de acesso podem expor dados de outros eventos ou permitir ações não autorizadas. Testes E2E garantem que o RBAC funciona de ponta a ponta incluindo a interface.

**Casos de uso a cobrir:**

| UC | Descrição | Resultado esperado |
|---|---|---|
| **UC-A01** | Admin faz login com credenciais válidas | Redirecionado para `/admin/dashboard`; nome exibido na navbar |
| **UC-A02** | Usuário faz login com senha incorreta | Permanece na tela de login; mensagem de erro exibida |
| **UC-A03** | Usuário faz login com email não cadastrado | Permanece na tela de login; mensagem de erro exibida |
| **UC-A04** | Usuário não autenticado acessa `/admin/dashboard` | Redirecionado para `/auth/login` |
| **UC-A05** | Usuário não autenticado acessa `/admin/eventos` | Redirecionado para `/auth/login` |
| **UC-A06** | Admin faz logout | Cookie limpo; redirecionado para `/auth/login` |
| **UC-A07** | Após logout, admin tenta acessar `/admin/dashboard` | Redirecionado para `/auth/login` (cookie inválido) |
| **UC-A08** | Monitor tenta acessar `/admin/usuarios` | Recebe resposta 403 ou redirecionamento para tela de acesso negado |
| **UC-A09** | Monitor tenta acessar `/admin/eventos` | Recebe 403 ou redirecionamento |
| **UC-A10** | Gestor acessa `/admin/certificados` do seu evento | Lista exibida apenas com certificados do seu evento |
| **UC-A11** | Gestor tenta acessar certificados de outro evento via URL | Recebe 403 |

**Critérios de aceite:**

- [ ] Arquivo `tests/e2e/auth.spec.js` com os 11 casos de uso
- [ ] Helper `loginAs(page, perfil)` criado em `tests/e2e/helpers/auth.js` para reutilização
- [ ] Seed inclui: 1 admin, 1 gestor (evento A), 1 monitor (evento A), 1 gestor (evento B)
- [ ] Todos os testes passam sem flakiness (sem `waitForTimeout` arbitrário)

**Estimativa:** 5 pontos  
**Dependências:** TASK-37, TASK-30, TASK-18

---

### TASK-40 🟢 Testes E2E — Fluxo Administrativo Completo

**Por que:** Valida os fluxos CRUD de ponta a ponta incluindo feedback visual (mensagens flash, redirecionamentos) que apenas testes unitários não cobrem.

**Casos de uso a cobrir:**

| UC | Descrição | Resultado esperado |
|---|---|---|
| **UC-AD01** | Admin cria evento com dados válidos | Evento aparece na tabela; flash "Evento criado com sucesso" |
| **UC-AD02** | Admin edita evento existente | Dados atualizados na tabela; flash de sucesso |
| **UC-AD03** | Admin remove evento | Evento some da tabela ativa; aparece em "Arquivados" com botão Restaurar |
| **UC-AD04** | Admin restaura evento arquivado | Evento volta à tabela ativa |
| **UC-AD05** | Admin cria participante com email duplicado | Permanece no formulário; mensagem de erro com campo inválido |
| **UC-AD06** | Gestor cria tipo de certificado com campos dinâmicos | Tipo aparece na listagem com campos corretos |
| **UC-AD07** | Gestor emite certificado para participante | Certificado aparece na listagem com status "emitido" |
| **UC-AD08** | Gestor cancela certificado emitido | Status muda para "cancelado"; botão "Restaurar" aparece |
| **UC-AD09** | Admin cria usuário gestor e vincula a evento | Usuário aparece na listagem com evento correto |
| **UC-AD10** | Admin tenta criar usuário com email duplicado | Permanece no formulário; mensagem de erro |

**Critérios de aceite:**

- [ ] Arquivo `tests/e2e/admin.spec.js` com os 10 casos de uso
- [ ] Cada teste é independente (cria seus próprios dados via API antes de executar)
- [ ] Helper `createViaApi(endpoint, data, token)` criado em `tests/e2e/helpers/api.js`
- [ ] Testes de formulário verificam presença de mensagens flash após redirecionamento

**Estimativa:** 5 pontos  
**Dependências:** TASK-37, TASK-31, TASK-32, TASK-33, TASK-34, TASK-35, TASK-36

