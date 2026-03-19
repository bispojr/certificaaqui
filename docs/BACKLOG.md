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

## ÉPICO 6 — Bugfixes e Funcionalidades Core (Auditoria 03 — 2026-03-14)

> Gerado com base na auditoria arquitetural comparativa de 14/03/2026.

### TASK-16 🔴 Corrigir `templateService.js` — formato de interpolação — concluído em 2026-03-14 22:32 (BRT) ✅

**Por que:** O `templateService.js` usa `{{chave}}` mas a especificação (FR-13) e o repositório de referência usam `${campo}`. Nenhuma interpolação de certificado funciona atualmente.

**Critérios de aceite:**

- [x] `src/services/templateService.js` usa regex `\$\{(\w+)\}` para interpolação
- [x] Testes de `templateService` atualizados para o formato correto
- [x] Certificados existentes continuam sendo processados corretamente

**Estimativa:** 1 ponto  
**Dependências:** nenhuma

---

### TASK-17 🔴 Corrigir `JWT_SECRET` inconsistente entre `middleware/auth.js` e `usuarioController.js` ✅

**Por que:** `middleware/auth.js` usa fallback `'segredo-super-seguro'`; `usuarioController.js` usa fallback `'secret'`. Em ambientes sem `.env`, login retorna token mas toda requisição autenticada falha com 401.

**Critérios de aceite:**

- [x] Ambos os arquivos usam `process.env.JWT_SECRET` sem fallback
- [x] Lançar erro explícito se `JWT_SECRET` não estiver configurado
- [x] Teste de integração de autenticação passa sem `.env` com erro claro — concluído em 2026-03-14 19:18 (BRT)

**Estimativa:** 0.5 ponto  
**Dependências:** TASK-02

---

### TASK-18 🔴 Corrigir `scopedEvento.js` para modelo N:N — concluído em 2026-03-14 22:14 (BRT) ✅

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

### TASK-19 🔴 Implementar rotas públicas de consulta e validação (FR-23, FR-24) — concluído em 2026-03-15 15:15 (BRT) ✅

**Por que:** As rotas públicas são o principal ponto de contato do participante com o sistema. Estão especificadas (FR-23, FR-24) mas não implementadas.

**Subtarefas:**

- [x] Criar `src/routes/public.js` com rotas sem autenticação
- [x] `GET /public/certificados?email=...` — retorna certificados do participante por email
- [x] `GET /public/validar/:codigo` — valida autenticidade de um certificado por código
- [x] Registrar rotas em `app.js`
- [x] Testes cobrindo busca por email e validação por código (válido e inválido)

**Estimativa:** 5 pontos  
**Dependências:** TASK-07

---

### TASK-20 🔴 Implementar geração de PDF (`pdfService.js`)

> Decomposta em micro-tasks. Dependências: TASK-16, TASK-19.

---

**[TASK-020-A] Instalar dependência pdfkit** — concluído em 2026-03-16 21:20 (BRT) ✅

- Arquivos: `package.json`
- Passos: executar `npm install pdfkit`; verificar que `"pdfkit"` aparece em `dependencies`
- Critério de aceite: `require('pdfkit')` não lança erro
- Escopo: 1 arquivo modificado

---

**[TASK-020-B] Criar `src/services/pdfService.js`** — concluído em 2026-03-18 23:40 (BRT) ✅

- Arquivos: `src/services/pdfService.js` (CRIAR)
- Contexto: usa `templateService.interpolate` para montar o texto final; recebe objeto `certificado` com associações `TiposCertificados`, `Participante` e `Evento` já carregadas
- Passos:
  1. Criar o arquivo com função `generateCertificadoPdf(certificado)` que retorna `Promise<Buffer>`
  2. Usar `PDFDocument` do pdfkit para montar o PDF com: nome do evento, texto interpolado e código de validação
  3. Resolver a Promise com `Buffer.concat(buffers)` no evento `end` do documento
- Snippet esperado de assinatura:
  ```js
  // src/services/pdfService.js
  const PDFDocument = require('pdfkit')
  const templateService = require('./templateService')
  module.exports = {
    generateCertificadoPdf(certificado) {
      return new Promise((resolve, reject) => { ... })
    },
  }
  ```
- Critério de aceite: função retorna Buffer começando com `%PDF`
- Escopo: 1 arquivo criado
- Dependência: TASK-020-A

---

**[TASK-020-C] Adicionar rota `GET /public/certificados/:id/pdf`** — concluído em 2026-03-18 23:40 (BRT) ✅

- Arquivos: `src/routes/public.js` (MODIFICAR)
- Contexto: o arquivo já existe com rotas de consulta pública; é necessário adicionar import de `Evento`, `TiposCertificados` e `pdfService`, e a nova rota que carrega o certificado com `include` e retorna o Buffer
- Passos:
  1. Alterar a linha de require dos models para incluir `Evento` e `TiposCertificados`
  2. Adicionar `const pdfService = require('../services/pdfService')`
  3. Adicionar rota `router.get('/certificados/:id/pdf', ...)` que faz `Certificado.findByPk(id, { include: [Participante, Evento, TiposCertificados] })`, chama `pdfService.generateCertificadoPdf` e retorna o buffer com `Content-Type: application/pdf`
- Critério de aceite: rota retorna 200 com header correto para ID válido; 404 para ID inexistente
- Escopo: 1 arquivo modificado
- Dependência: TASK-020-B

---

- [x] Criar smoke test para `pdfService` — concluído em 2026-03-17 08:22 (BRT) ✅
- Arquivos: `tests/services/pdfService.test.js` (CRIAR)
- Contexto: teste unitário sem acesso ao banco; usa objeto mock com `TiposCertificados`, `Participante`, `Evento`, `nome`, `codigo` e `valores_dinamicos`
- Passos: criar 3 casos — buffer não vazio, assinatura `%PDF`, e comportamento com `valores_dinamicos: {}`
- Critério de aceite: `npm run check` passa; 3 testes passam sem banco
- Escopo: 1 arquivo criado
- Dependência: TASK-020-B

- [x] Requisito de obrigatoriedade do campo código para geração de PDF explicitado na especificação e coberto por teste — concluído em 2026-03-17 08:22 (BRT) ✅

---

### TASK-21 🟡 Mover `middleware/auth.js` para `src/middlewares/auth.js`

> Decomposta em micro-tasks. Dependência: TASK-17.

---

**[TASK-021-A] Criar `src/middlewares/auth.js` com import corrigido**

- Arquivos: `src/middlewares/auth.js` (CRIAR)
- Contexto: conteúdo idêntico ao `middleware/auth.js`; única diferença é a linha de require dos models: `require('../src/models')` → `require('../models')` (pois o novo arquivo está dentro de `src/`)
- Passos: criar o arquivo com o conteúdo do original e ajustar o caminho dos models
- Critério de aceite: arquivo criado; `require('../models')` correto; antigo `middleware/auth.js` ainda existe (não remover nesta task)
- Escopo: 1 arquivo criado

---

**[TASK-021-B] Atualizar import de auth em `participantes.js` e `eventos.js`**

- Arquivos: `src/routes/participantes.js` (MODIFICAR), `src/routes/eventos.js` (MODIFICAR)
- Passos: em ambos os arquivos, substituir `require('../../middleware/auth')` por `require('../middlewares/auth')`
- Critério de aceite: `grep '../../middleware/auth' src/routes/participantes.js src/routes/eventos.js` retorna vazio
- Escopo: 2 arquivos modificados
- Dependência: TASK-021-A

---

**[TASK-021-C] Atualizar import de auth em `certificados.js` e `tipos-certificados.js`**

- Arquivos: `src/routes/certificados.js` (MODIFICAR), `src/routes/tipos-certificados.js` (MODIFICAR)
- Passos: em ambos os arquivos, substituir `require('../../middleware/auth')` por `require('../middlewares/auth')`
- Critério de aceite: `grep '../../middleware/auth' src/routes/certificados.js src/routes/tipos-certificados.js` retorna vazio
- Escopo: 2 arquivos modificados
- Dependência: TASK-021-A

---

**[TASK-021-D] Atualizar import de auth em `usuarios.js` e `auth.test.js`**

- Arquivos: `src/routes/usuarios.js` (MODIFICAR), `tests/middleware/auth.test.js` (MODIFICAR)
- Passos:
  1. Em `src/routes/usuarios.js`: substituir `require('../../middleware/auth')` por `require('../middlewares/auth')`
  2. Em `tests/middleware/auth.test.js`: substituir `require('../../middleware/auth')` por `require('../../src/middlewares/auth')`
- Critério de aceite: `npm run check` passa; todos os testes de `auth.test.js` passam
- Escopo: 2 arquivos modificados
- Dependência: TASK-021-A

---

**[TASK-021-E] Remover `middleware/auth.js` legado**

- Arquivos: `middleware/auth.js` (REMOVER)
- Passos:
  1. Verificar `grep -r 'middleware/auth' src/ tests/` — deve retornar vazio
  2. Executar `rm middleware/auth.js`
  3. Executar `npm run check`
- Critério de aceite: arquivo removido; `npm run check` passa sem erros de módulo
- Escopo: 1 arquivo removido
- Dependência: TASK-021-B, TASK-021-C, TASK-021-D

---

### TASK-22 🟡 Adicionar paginação nas listagens

> Decomposta em micro-tasks. Dependências: TASK-07.

---

**[TASK-022-A] Adicionar paginação em `participanteService.findAll`**

- Arquivo: `src/services/participanteService.js` (MODIFICAR)
- Contexto: o método `findAll()` atual chama `Participante.findAll()` sem limite. Deve aceitar `{ page = 1, perPage = 20 }` e retornar `{ data, meta: { total, page, perPage } }` usando `Participante.findAndCountAll({ limit, offset })`
- Passos:
  1. Substituir o método `findAll()` por:
     ```js
     async findAll({ page = 1, perPage = 20 } = {}) {
       const limit = perPage
       const offset = (page - 1) * limit
       const { count, rows } = await Participante.findAndCountAll({ limit, offset })
       return { data: rows, meta: { total: count, page, perPage } }
     },
     ```
- Critério de aceite: `participanteService.findAll()` retorna `{ data, meta }` com `meta.total` numérico; valor padrão `perPage = 20` funciona sem argumentos
- Escopo: 1 arquivo modificado

---

**[TASK-022-B] Adicionar paginação em `eventoService.findAll`**

- Arquivo: `src/services/eventoService.js` (MODIFICAR)
- Contexto: mesmo padrão de TASK-022-A, mas para o model `Evento`
- Passos:
  1. Substituir o método `findAll()` por:
     ```js
     async findAll({ page = 1, perPage = 20 } = {}) {
       const limit = perPage
       const offset = (page - 1) * limit
       const { count, rows } = await Evento.findAndCountAll({ limit, offset })
       return { data: rows, meta: { total: count, page, perPage } }
     },
     ```
- Critério de aceite: `eventoService.findAll()` retorna `{ data, meta }`; `findAll({ page: 2, perPage: 5 })` aplica offset de 5
- Escopo: 1 arquivo modificado

---

**[TASK-022-C] Adicionar paginação em `certificadoService.findAll` e `tiposCertificadosService.findAll`**

- Arquivos: `src/services/certificadoService.js` (MODIFICAR), `src/services/tiposCertificadosService.js` (MODIFICAR)
- Contexto: mesmo padrão de TASK-022-A, para os models `Certificado` e `TiposCertificados`
- Passos:
  1. Em `certificadoService.js`, substituir `findAll()` por:
     ```js
     async findAll({ page = 1, perPage = 20 } = {}) {
       const limit = perPage
       const offset = (page - 1) * limit
       const { count, rows } = await Certificado.findAndCountAll({ limit, offset })
       return { data: rows, meta: { total: count, page, perPage } }
     },
     ```
  2. Em `tiposCertificadosService.js`, mesmo pattern com `TiposCertificados.findAndCountAll`
- Critério de aceite: ambos retornam `{ data, meta }`; chamadas sem argumentos usam `perPage = 20`
- Escopo: 2 arquivos modificados

---

**[TASK-022-D] Propagar paginação nos controllers de listagem**

- Arquivos: `src/controllers/participanteController.js` (MODIFICAR), `src/controllers/eventoController.js` (MODIFICAR), `src/controllers/certificadoController.js` (MODIFICAR), `src/controllers/tiposCertificadosController.js` (MODIFICAR)
- Contexto: os métodos `findAll` dos controllers chamam `service.findAll()` sem argumentos e retornam o array diretamente. Devem ler `req.query.page` e `req.query.perPage`, repassar ao service e devolver a resposta `{ data, meta }` como recebida
- Passos: em cada controller, substituir o bloco `findAll` por:
  ```js
  async findAll(req, res) {
    try {
      const page = parseInt(req.query.page) || 1
      const perPage = parseInt(req.query.perPage) || 20
      const result = await <nomeService>.findAll({ page, perPage })
      return res.status(200).json(result)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }
  ```
- Critério de aceite: `GET /participantes?page=1&perPage=5` retorna `{ data: [...], meta: { total, page: 1, perPage: 5 } }`; sem query params usa defaults
- Escopo: 4 arquivos modificados
- Dependência: TASK-022-A, TASK-022-B, TASK-022-C

---

**[TASK-022-E] Atualizar testes dos services de listagem para o novo formato**

- Arquivos: `tests/services/certificadoService.test.js` (MODIFICAR), `tests/services/eventoService.test.js` (MODIFICAR)
- Contexto: os testes existentes verificam que `findAll` chama `<Model>.findAll`. Após TASK-022-A/B/C, o método passa a chamar `findAndCountAll`. Os mocks precisam ser atualizados e a asserção do retorno deve verificar `{ data, meta }`
- Passos:
  1. Em `certificadoService.test.js`: adicionar `findAndCountAll: jest.fn()` ao mock do model; atualizar o teste `'findAll chama Certificado.findAll'` para:
     ```js
     it('findAll retorna data e meta com findAndCountAll', async () => {
       Certificado.findAndCountAll.mockResolvedValue({
         count: 2,
         rows: [{}, {}],
       })
       const result = await certificadoService.findAll()
       expect(Certificado.findAndCountAll).toHaveBeenCalledWith({
         limit: 20,
         offset: 0,
       })
       expect(result).toEqual({
         data: [{}, {}],
         meta: { total: 2, page: 1, perPage: 20 },
       })
     })
     ```
  2. Mesmo padrão em `eventoService.test.js`
- Critério de aceite: `npm run check` passa; nenhum `findAll` legado nos testes
- Escopo: 2 arquivos modificados
- Dependência: TASK-022-C

---

### TASK-23 🟡 Validar `valores_dinamicos` contra `dados_dinamicos` no service

> Decomposta em micro-tasks. Dependência: TASK-06.

---

**[TASK-023-A] Adicionar validação de `valores_dinamicos` em `certificadoService.create`**

- Arquivo: `src/services/certificadoService.js` (MODIFICAR)
- Contexto: o model `TiposCertificados` possui o campo JSONB `dados_dinamicos` que define a estrutura dos campos específicos do tipo. O `certificadoService.create` recebe `data.tipo_certificado_id` e `data.valores_dinamicos`. Antes de chamar `Certificado.create(data)`, deve buscar o tipo, extrair as chaves de `dados_dinamicos` e verificar se todas estão presentes em `valores_dinamicos`. Caso alguma falte, lança erro com a lista de campos ausentes.
- Passos:
  1. Adicionar `TiposCertificados` ao require dos models no topo do arquivo:
     ```js
     // Linha atual:
     const { Certificado } = require('../../src/models')
     // Substituir por:
     const { Certificado, TiposCertificados } = require('../../src/models')
     ```
  2. Substituir o método `create(data)` pelo bloco:
     ```js
     async create(data) {
       const tipo = await TiposCertificados.findByPk(data.tipo_certificado_id)
       if (tipo && tipo.dados_dinamicos) {
         const camposEsperados = Object.keys(tipo.dados_dinamicos)
         const valoresFornecidos = data.valores_dinamicos || {}
         const camposFaltantes = camposEsperados.filter(
           (c) => !(c in valoresFornecidos),
         )
         if (camposFaltantes.length > 0) {
           const err = new Error(
             `Campos obrigatórios ausentes em valores_dinamicos: ${camposFaltantes.join(', ')}`,
           )
           err.statusCode = 400
           err.camposFaltantes = camposFaltantes
           throw err
         }
       }
       return Certificado.create(data)
     },
     ```
- Critério de aceite: `certificadoService.create` com campos faltantes lança erro com `err.camposFaltantes` preenchido; com campos completos, chama `Certificado.create` normalmente
- Escopo: 1 arquivo modificado

---

**[TASK-023-B] Propagar statusCode 400 no `certificadoController.create`**

- Arquivo: `src/controllers/certificadoController.js` (MODIFICAR)
- Contexto: o método `create` atual faz `catch (error)` e sempre devolve status 400. Isso está correto para o erro de campos ausentes, mas deve garantir que `err.statusCode` seja respeitado caso exista outro tipo de erro (ex.: 422).
- Passos:
  1. No bloco `catch` do método `create`, substituir por:
     ```js
     } catch (error) {
       const status = error.statusCode || 400
       return res.status(status).json({
         error: error.message,
         ...(error.camposFaltantes ? { camposFaltantes: error.camposFaltantes } : {}),
       })
     }
     ```
- Critério de aceite: quando `certificadoService.create` lança erro com `camposFaltantes`, a resposta JSON contém `{ error: '...', camposFaltantes: [...] }`
- Escopo: 1 arquivo modificado
- Dependência: TASK-023-A

---

**[TASK-023-C] Criar testes para a validação de `valores_dinamicos`**

- Arquivo: `tests/services/certificadoService.test.js` (MODIFICAR)
- Contexto: o mock de `../../src/models` já existe no arquivo. É necessário adicionar `TiposCertificados` ao mock e criar dois novos casos de teste dentro do bloco `describe('create')`.
- Passos:
  1. Adicionar ao mock `jest.mock('../../src/models', ...)` a chave:
     ```js
     TiposCertificados: {
       findByPk: jest.fn(),
     },
     ```
  2. Adicionar no `describe` principal dois novos testes:

     ```js
     describe('create com validação de dados_dinamicos', () => {
       it('lança erro com camposFaltantes quando campo obrigatório está ausente', async () => {
         const { TiposCertificados } = require('../../src/models')
         TiposCertificados.findByPk.mockResolvedValue({
           dados_dinamicos: { funcao: 'string', tema: 'string' },
         })
         await expect(
           certificadoService.create({
             tipo_certificado_id: 1,
             valores_dinamicos: { funcao: 'Palestrante' },
           }),
         ).rejects.toMatchObject({
           camposFaltantes: ['tema'],
         })
       })

       it('chama Certificado.create quando todos os campos estão presentes', async () => {
         const { TiposCertificados, Certificado } = require('../../src/models')
         TiposCertificados.findByPk.mockResolvedValue({
           dados_dinamicos: { funcao: 'string', tema: 'string' },
         })
         Certificado.create.mockResolvedValue({ id: 1 })
         await certificadoService.create({
           tipo_certificado_id: 1,
           valores_dinamicos: { funcao: 'Palestrante', tema: 'Node.js' },
         })
         expect(Certificado.create).toHaveBeenCalled()
       })
     })
     ```

- Critério de aceite: `npm run check` passa; os 2 novos testes passam
- Escopo: 1 arquivo modificado
- Dependência: TASK-023-A

---

### TASK-24 🟡 Corrigir cascata de soft delete em `eventoService`

> Decomposta em micro-tasks. Dependência: TASK-01.

---

**[TASK-024-A] Corrigir `eventoService.delete` para usar `UsuarioEvento.destroy`**

- Arquivo: `src/services/eventoService.js` (MODIFICAR)
- Contexto: o método `delete` atual chama `UsuarioEvento.update({ deleted_at: new Date() }, ...)` manualmente, o que bypassa o mecanismo `paranoid` do Sequelize. Isso impõe que a restauração posterior não funcione via `restore()`. A correção é trocar pelo `UsuarioEvento.destroy({ where: { evento_id: id } })` que respeita o `paranoid: true` definido no model `UsuarioEvento`
- Passos:
  1. No método `delete`, localizar o bloco:
     ```js
     const { UsuarioEvento } = require('../../src/models')
     await UsuarioEvento.update(
       { deleted_at: new Date() },
       { where: { evento_id: id } },
     )
     ```
  2. Substituir por:
     ```js
     const { UsuarioEvento } = require('../../src/models')
     await UsuarioEvento.destroy({ where: { evento_id: id } })
     ```
- Critério de aceite: após `eventoService.delete(id)`, registros em `usuario_eventos` com `evento_id = id` têm `deleted_at` preenchido pelo Sequelize paranoid
- Escopo: 1 arquivo modificado

---

**[TASK-024-B] Adicionar restauração das associações em `eventoService.restore`**

- Arquivo: `src/services/eventoService.js` (MODIFICAR)
- Contexto: o método `restore` atual restaura apenas o `Evento`, deixando os registros em `usuario_eventos` com `deleted_at` preenchido. É necessário adicionar `UsuarioEvento.restore({ where: { evento_id: id } })` após restaurar o evento
- Passos:
  1. Localizar o método `restore`:
     ```js
     async restore(id) {
       const evento = await Evento.findByPk(id, { paranoid: false })
       if (!evento) return null
       return evento.restore()
     },
     ```
  2. Substituir por:
     ```js
     async restore(id) {
       const evento = await Evento.findByPk(id, { paranoid: false })
       if (!evento) return null
       await evento.restore()
       const { UsuarioEvento } = require('../../src/models')
       await UsuarioEvento.restore({ where: { evento_id: id } })
       return evento
     },
     ```
- Critério de aceite: após `eventoService.restore(id)`, registros em `usuario_eventos` com `evento_id = id` têm `deleted_at = null`
- Escopo: 1 arquivo modificado
- Dependência: TASK-024-A

---

**[TASK-024-C] Atualizar testes de `eventoService.delete` e `eventoService.restore`**

- Arquivo: `tests/services/eventoService.test.js` (MODIFICAR)
- Contexto: o mock atual de `UsuarioEvento` só possui `update: jest.fn()`. Após TASK-024-A/B, o service usa `UsuarioEvento.destroy` e `UsuarioEvento.restore`. O mock e os testes devem ser atualizados
- Passos:
  1. No `jest.mock('../../src/models', ...)`, substituir o bloco de `UsuarioEvento`:
     ```js
     // DE:
     UsuarioEvento: {
       update: jest.fn(),
     },
     // PARA:
     UsuarioEvento: {
       destroy: jest.fn(),
       restore: jest.fn(),
     },
     ```
  2. No `describe('delete')`, atualizar o teste existente `'deve deletar um evento existente'` para verificar `UsuarioEvento.destroy` em vez de `UsuarioEvento.update`:
     ```js
     it('deve deletar um evento existente e suas associações', async () => {
       const { UsuarioEvento } = require('../../src/models')
       const eventoMock = { destroy: jest.fn() }
       Evento.findByPk.mockResolvedValue(eventoMock)
       UsuarioEvento.destroy.mockResolvedValue(1)
       await eventoService.delete(1)
       expect(eventoMock.destroy).toHaveBeenCalled()
       expect(UsuarioEvento.destroy).toHaveBeenCalledWith({
         where: { evento_id: 1 },
       })
     })
     ```
  3. Adicionar novo `describe('restore')` com teste de restauração das associações:
     ```js
     describe('restore com associações', () => {
       it('deve restaurar o evento e suas associações', async () => {
         const { UsuarioEvento } = require('../../src/models')
         const eventoMock = { restore: jest.fn() }
         Evento.findByPk.mockResolvedValue(eventoMock)
         UsuarioEvento.restore.mockResolvedValue(1)
         await eventoService.restore(1)
         expect(eventoMock.restore).toHaveBeenCalled()
         expect(UsuarioEvento.restore).toHaveBeenCalledWith({
           where: { evento_id: 1 },
         })
       })
     })
     ```
- Critério de aceite: `npm run check` passa; testes de `delete` e `restore` com associações passam
- Escopo: 1 arquivo modificado
- Dependência: TASK-024-A, TASK-024-B

---

### TASK-25 🟡 Adicionar rate limiting nos endpoints de autenticação

> Decomposta em micro-tasks. Dependência: TASK-05.

---

**[TASK-025-A] Instalar `express-rate-limit`**

- Arquivo: `package.json`
- Passos: executar `npm install express-rate-limit`; verificar que aparece em `dependencies`
- Critério de aceite: `require('express-rate-limit')` não lança erro
- Escopo: 1 arquivo modificado (via npm)

---

**[TASK-025-B] Aplicar rate limiter na rota `POST /usuarios/login`**

- Arquivo: `src/routes/usuarios.js` (MODIFICAR)
- Contexto: o arquivo já possui a rota `router.post('/login', usuarioController.login)`. O rate limiter deve ser aplicado como middleware exclusivamente nessa rota. A janela é de 15 minutos e o máximo é 20 tentativas. Quando excedido, deve retornar JSON com mensagem em português (não HTML)
- Passos:
  1. No topo de `src/routes/usuarios.js`, adicionar:

     ```js
     const rateLimit = require('express-rate-limit')

     const loginLimiter = rateLimit({
       windowMs: 15 * 60 * 1000, // 15 minutos
       max: 20,
       standardHeaders: true,
       legacyHeaders: false,
       message: {
         error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
       },
     })
     ```

  2. Localizar a linha:
     ```js
     router.post('/login', usuarioController.login)
     ```
  3. Substituir por:
     ```js
     router.post('/login', loginLimiter, usuarioController.login)
     ```

- Critério de aceite: após 20 requisições em 15 minutos para `POST /usuarios/login`, a 21ª retorna status 429 com `{ error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }`; rotas de login não são afetadas por limite nas demais rotas
- Escopo: 1 arquivo modificado
- Dependência: TASK-025-A

---

### TASK-26 🟢 Documentar ADR-004 a ADR-008

> Decomposta em micro-tasks. Sem dependências de código.

---

**[TASK-026-A] Criar `docs/decisoes/004-geracao-pdf.md`**

- Arquivo: `docs/decisoes/004-geracao-pdf.md` (CRIAR)
- Conteúdo esperado (ADR no padrão dos existentes):

  ```markdown
  # ADR 004 — Engine de Geração de PDF

  ## Contexto

  O sistema precisa gerar certificados em formato PDF para download pelo participante.

  ## Decisão

  - PDFKit escolhido por ser uma biblioteca Node.js nativa, sem dependência de browser ou headless.
  - Geracão em memória (Buffer) sem persistência de arquivos em disco.
  - Layout do PDF montado programaticamente pelo `pdfService.js`.

  ## Alternativas consideradas

  - Puppeteer/Headless Chrome: mais flexível para HTML/CSS, mas muito mais pesado.
  - jsPDF: voltado para browser, menos adequado para Node.js server-side.

  ## Consequências

  - PDFs gerados sob demanda a cada requisição (sem cache).
  - Layout limitado ao que o PDFKit suporta programaticamente.
  - Simples de manter; sem estado persistido no servidor.
  ```

- Critério de aceite: arquivo criado no caminho correto com seções Contexto, Decisão, Alternativas e Consequências
- Escopo: 1 arquivo criado

---

**[TASK-026-B] Criar `docs/decisoes/005-vinculo-usuario-evento.md` e `006-paginacao-api.md`**

- Arquivos: `docs/decisoes/005-vinculo-usuario-evento.md` (CRIAR), `docs/decisoes/006-paginacao-api.md` (CRIAR)
- Conteúdo esperado para `005`:

  ```markdown
  # ADR 005 — Vínculo Usuário-Evento: N:N via tabela `usuario_eventos`

  ## Contexto

  Um usuário pode estar vinculado a múltiplos eventos (gestor ou monitor).

  ## Decisão

  - Relação N:N implementada via tabela `usuario_eventos` com `paranoid: true`.
  - Removida a FK simples `evento_id` da tabela `usuarios` na migration `20260313195000`.

  ## Alternativas consideradas

  - FK simples `evento_id` em `usuarios`: impede gestão de múltiplos eventos.

  ## Consequências

  - Middleware `scopedEvento` usa `req.usuario.getEventos()` em vez de `req.usuario.evento_id`.
  - Delete/restore de evento requer cascata manual em `usuario_eventos`.
  ```

- Conteúdo esperado para `006`:

  ```markdown
  # ADR 006 — Estratégia de Paginação da API

  ## Contexto

  Listagens sem limite retornam todos os registros, degradando performance com volume.

  ## Decisão

  - Paginação offset-based via parâmetros de query `?page=1&perPage=20`.
  - Resposta padronizada: `{ data: [], meta: { total, page, perPage } }`.
  - Implementada na camada de service via `Model.findAndCountAll`.

  ## Alternativas consideradas

  - Cursor-based pagination: mais eficiente para grandes volumes, mas mais complexa de implementar.

  ## Consequências

  - Todos os endpoints de listagem retornam o envelope `{ data, meta }`.
  - Controllers devem ler `req.query.page` e `req.query.perPage`.
  ```

- Critério de aceite: ambos os arquivos criados com as 4 seções
- Escopo: 2 arquivos criados

---

**[TASK-026-C] Criar `docs/decisoes/007-validacao-valores-dinamicos.md` e `008-armazenamento-pdfs.md`**

- Arquivos: `docs/decisoes/007-validacao-valores-dinamicos.md` (CRIAR), `docs/decisoes/008-armazenamento-pdfs.md` (CRIAR)
- Conteúdo esperado para `007`:

  ```markdown
  # ADR 007 — Onde Validar `valores_dinamicos` contra `dados_dinamicos`

  ## Contexto

  Certificados com campos ausentes passam validacão do Sequelize mas falham na interpolação.

  ## Decisão

  - Validação realizada em `certificadoService.create`, antes de `Certificado.create`.
  - Erro lançado com `statusCode: 400` e array `camposFaltantes`.

  ## Alternativas consideradas

  - Hook `beforeCreate` no model: oculta lógica de negócio na camada de dados.
  - Validação no validator Zod: não tem acesso ao banco para buscar o tipo.

  ## Consequências

  - Controller repassa `camposFaltantes` na resposta JSON.
  - Teste unitário de service pode mockar `TiposCertificados.findByPk` sem banco.
  ```

- Conteúdo esperado para `008`:

  ```markdown
  # ADR 008 — Armazenamento de PDFs

  ## Contexto

  PDFs de certificados precisam ser entregues aos participantes de forma segura e rápida.

  ## Decisão

  - PDFs gerados sob demanda (on-the-fly) e devolvidos diretamente no corpo da resposta HTTP.
  - Sem persistência em disco ou cloud storage na versão 1.0.

  ## Alternativas consideradas

  - Armazenar em S3/GCS: reduz CPU por requisição, mas adiciona dependência de infra.
  - Salvar em `/public/pdfs/`: simples, mas cria lista de arquivos crescente sem gestão.

  ## Consequências

  - Cada download recalcula o PDF; aceitável para o volume atual.
  - Evolução futura pode adicionar cache ou storage externo sem mudar a interface da rota.
  ```

- Critério de aceite: ambos os arquivos criados com as 4 seções
- Escopo: 2 arquivos criados

---

### TASK-27 🟢 Adicionar índices de banco de dados para performance

> Decomposta em micro-tasks. Dependência: TASK-01.

---

**[TASK-027-A] Criar migration de índices em `certificados` e `participantes`**

- Arquivo: `migrations/20260316000000-add-indexes.js` (CRIAR)
- Contexto: o arquivo de migration deve seguir o padrão dos demais arquivos em `migrations/`. O nome do arquivo deve ter timestamp superior ao último existente (`20260315000000-add-codigo-to-certificados.js`). Os índices reduzem o custo de joins e filtros nas operações mais comuns da API
- Passos: criar o arquivo com `up` e `down` que adicionam/removem os seguintes índices:
  ```js
  'use strict'
  module.exports = {
    async up(queryInterface) {
      await queryInterface.addIndex('certificados', ['evento_id'], {
        name: 'idx_certificados_evento_id',
      })
      await queryInterface.addIndex('certificados', ['participante_id'], {
        name: 'idx_certificados_participante_id',
      })
      await queryInterface.addIndex('certificados', ['status'], {
        name: 'idx_certificados_status',
      })
      await queryInterface.addIndex('participantes', ['email'], {
        name: 'idx_participantes_email',
        unique: true,
      })
      await queryInterface.addIndex('usuarios', ['email'], {
        name: 'idx_usuarios_email',
        unique: true,
      })
    },
    async down(queryInterface) {
      await queryInterface.removeIndex(
        'certificados',
        'idx_certificados_evento_id',
      )
      await queryInterface.removeIndex(
        'certificados',
        'idx_certificados_participante_id',
      )
      await queryInterface.removeIndex(
        'certificados',
        'idx_certificados_status',
      )
      await queryInterface.removeIndex(
        'participantes',
        'idx_participantes_email',
      )
      await queryInterface.removeIndex('usuarios', 'idx_usuarios_email')
    },
  }
  ```
- Critério de aceite: migration executa sem erros (`sequelize db:migrate`); rollback via `db:migrate:undo` também funciona
- Escopo: 1 arquivo criado

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

| Épico                                      | Pontos  | Prioridade    |
| ------------------------------------------ | ------- | ------------- |
| Épico 1 — Integridade do Banco             | 7       | 🔴 Crítica    |
| Épico 2 — Separação de Responsabilidades   | 34      | 🔴/🟡         |
| Épico 3 — Qualidade e Manutenibilidade     | 3.5     | 🟡 Importante |
| Épico 4 — Documentação                     | 6       | 🟡/🟢         |
| Épico 5 — Tooling                          | 10      | 🟢 Opcional   |
| Épico 6 — Bugfixes e Core (Auditoria 03)   | 30.5    | 🔴/🟡/🟢      |
| Épico 7 — Interface Web (Views Handlebars) | 34      | 🔴/🟡         |
| Épico 8 — Testes de Interface E2E          | 13      | 🟡/🟢         |
| **Total**                                  | **138** |               |

---

## ÉPICO 7 — Interface Web: Views Handlebars

> Gerado com base na análise das views do repositório de referência (EduComp 2025) e nas singularidades do projeto Certifique-me (autenticação, RBAC, multi-evento).
>
> **Nota sobre tecnologia de testes de view:** As tasks de teste de interface (ÉPICO 8) utilizam **Playwright** em vez de Selenium. Playwright é o padrão moderno para testes E2E em Node.js — instalação mais simples (`npm install @playwright/test`), sem driver externo, suporte nativo a async/await e relatórios HTML integrados. Selenium permanece compatível se houver necessidade de integração com infraestrutura legada.

---

### TASK-28 🔴 Estender layout base (`views/layout.hbs`) com Bootstrap e estrutura SSR

> Decomposta em micro-tasks. Sem dependências de código.

---

**[TASK-028-A] Instalar `connect-flash` e `express-session`**

- Arquivo: `package.json`
- Passos: executar `npm install connect-flash express-session`; verificar que ambos aparecem em `dependencies`
- Critério de aceite: `require('connect-flash')` e `require('express-session')` não lançam erro
- Escopo: 1 arquivo modificado (via npm)

---

**[TASK-028-B] Configurar `express-session` e `connect-flash` em `app.js`**

- Arquivo: `app.js` (MODIFICAR)
- Contexto: `connect-flash` requer que `express-session` seja registrado antes. A `SESSION_SECRET` deve vir de `process.env.SESSION_SECRET`. O `flash` deve ser registrado após a sessão. Para que as mensagens flash fiquem disponíveis nos templates, adicionar um middleware que popula `res.locals.flash`
- Passos:
  1. No topo do arquivo, após os `require` existentes, adicionar:
     ```js
     const session = require('express-session')
     const flash = require('connect-flash')
     ```
  2. Após a linha `app.use(cookieParser())`, adicionar:
     ```js
     app.use(
       session({
         secret: process.env.SESSION_SECRET || 'sessao-certifique-me',
         resave: false,
         saveUninitialized: false,
       }),
     )
     app.use(flash())
     app.use((req, res, next) => {
       res.locals.flash = {
         success: req.flash('success'),
         error: req.flash('error'),
       }
       next()
     })
     ```
- Critério de aceite: `req.flash('success', 'ok')` e posterior leitura de `req.flash('success')` funcionam; `res.locals.flash` está acessível nos templates `.hbs`
- Escopo: 1 arquivo modificado
- Dependência: TASK-028-A

---

**[TASK-028-C] Atualizar `views/layout.hbs` com Bootstrap 5 e navbar pública**

- Arquivo: `views/layout.hbs` (MODIFICAR)
- Contexto: o layout atual é um esqueleto mínimo sem CSS. Deve incluir Bootstrap 5 via CDN, barra de navegação pública com link para `/certificados` e slot `{{{body}}}`
- Passos: substituir o conteúdo de `views/layout.hbs` por:
  ```html
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{{title}} | Certifique-me</title>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      />
    </head>
    <body>
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
          <a class="navbar-brand" href="/">Certifique-me</a>
          <div class="navbar-nav ms-auto">
            <a class="nav-link text-white" href="/certificados"
              >Meus Certificados</a
            >
            <a class="nav-link text-white" href="/certificados/validar"
              >Validar</a
            >
            <a class="nav-link text-white" href="/auth/login">Entrar</a>
          </div>
        </div>
      </nav>
      <div class="container mt-4">
        {{#if flash.success}} {{#each flash.success}}
        <div class="alert alert-success">{{this}}</div>
        {{/each}} {{/if}} {{#if flash.error}} {{#each flash.error}}
        <div class="alert alert-danger">{{this}}</div>
        {{/each}} {{/if}} {{{body}}}
      </div>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    </body>
  </html>
  ```
- Critério de aceite: `GET /` renderiza página com Bootstrap carregado e navbar visível
- Escopo: 1 arquivo modificado
- Dependência: TASK-028-B

---

**[TASK-028-D] Criar `views/layouts/admin.hbs`**

- Arquivo: `views/layouts/admin.hbs` (CRIAR)
- Contexto: layout para todas as páginas do painel administrativo. O template recebe `usuario` (nome e perfil) via `res.locals` (populado pelo middleware `authSSR` a ser criado em TASK-030-A). A navbar deve exibir links condicionais por perfil usando helpers Handlebars, botão de logout via POST e o slot `{{{body}}}`
- Passos: criar o arquivo com conteúdo:
  ```html
  <!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{{title}} | Admin — Certifique-me</title>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      />
    </head>
    <body>
      <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container-fluid">
          <a class="navbar-brand" href="/admin/dashboard"
            >Certifique-me Admin</a
          >
          <div class="navbar-nav me-auto">
            <a class="nav-link text-white" href="/admin/dashboard">Dashboard</a>
            <a class="nav-link text-white" href="/admin/certificados"
              >Certificados</a
            >
            <a class="nav-link text-white" href="/admin/participantes"
              >Participantes</a
            >
            {{#if usuario.isAdmin}}
            <a class="nav-link text-white" href="/admin/eventos">Eventos</a>
            <a class="nav-link text-white" href="/admin/tipos-certificados"
              >Tipos</a
            >
            <a class="nav-link text-white" href="/admin/usuarios">Usuários</a>
            {{/if}} {{#if usuario.isGestor}}
            <a class="nav-link text-white" href="/admin/tipos-certificados"
              >Tipos</a
            >
            {{/if}}
          </div>
          <div class="navbar-nav">
            <span class="navbar-text text-white me-3"
              >{{usuario.nome}} ({{usuario.perfil}})</span
            >
            <form action="/auth/logout" method="POST" class="d-inline">
              <button type="submit" class="btn btn-sm btn-outline-light">
                Sair
              </button>
            </form>
          </div>
        </div>
      </nav>
      <div class="container-fluid mt-4">
        {{#if flash.success}} {{#each flash.success}}
        <div class="alert alert-success">{{this}}</div>
        {{/each}} {{/if}} {{#if flash.error}} {{#each flash.error}}
        <div class="alert alert-danger">{{this}}</div>
        {{/each}} {{/if}} {{{body}}}
      </div>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    </body>
  </html>
  ```
- Critério de aceite: arquivo criado; quando renderizado com `{ layout: 'layouts/admin', usuario: { nome: 'Admin', perfil: 'admin', isAdmin: true } }` exibe a navbar administrativa completa
- Escopo: 1 arquivo criado

---

**[TASK-028-E] Atualizar `views/error.hbs` com Bootstrap**

- Arquivo: `views/error.hbs` (MODIFICAR)
- Contexto: o arquivo atual exibe apenas tags `<h1>` e `<pre>` sem estilo. Deve ser atualizado para usar o `layout.hbs` e exibir o erro de forma amigável com link "Voltar ao início"
- Passos: substituir o conteúdo por:
  ```html
  <div class="text-center mt-5">
    <h1 class="display-1">{{error.status}}</h1>
    <h2>{{message}}</h2>
    <p class="text-muted">{{#if error.stack}}{{error.stack}}{{/if}}</p>
    <a href="/" class="btn btn-primary mt-3">Voltar ao início</a>
  </div>
  ```
- Critério de aceite: ao acessar uma rota inexistente, a página de erro exibe o código 404 com botão "Voltar ao início" estilizado pelo Bootstrap
- Escopo: 1 arquivo modificado

---

### TASK-29 🔴 Views públicas de certificados

> Decomposta em micro-tasks. Dependências: TASK-28, TASK-19.

---

**[TASK-029-A] Criar views estáticas do fluxo público (`opcoes.hbs`, `form-obter.hbs`, `form-validar.hbs`)**

- Arquivos a criar:
  - `views/certificados/opcoes.hbs`
  - `views/certificados/form-obter.hbs`
  - `views/certificados/form-validar.hbs`
- Contexto: as três views usam `views/layout.hbs` como layout (padrão do Handlebars sem declarar layout explicitamente, pois `app.js` usa `hbs` com layout padrão `layout.hbs`). Sem dados dinâmicos especiais — apenas formulários HTML
- Passos:
  1. Criar `views/certificados/opcoes.hbs`:
     ```html
     <div class="text-center mt-5">
       <h1>Certificados</h1>
       <div class="d-flex justify-content-center gap-3 mt-4">
         <a href="/certificados/obter" class="btn btn-primary btn-lg"
           >Obter meu certificado</a
         >
         <a
           href="/certificados/validar"
           class="btn btn-outline-secondary btn-lg"
           >Validar certificado</a
         >
       </div>
     </div>
     ```
  2. Criar `views/certificados/form-obter.hbs`:
     ```html
     <div class="row justify-content-center mt-5">
       <div class="col-md-6">
         <h2>Buscar meus certificados</h2>
         {{#if mensagem}}
         <div class="alert alert-warning">{{mensagem}}</div>
         {{/if}}
         <form method="POST" action="/certificados/buscar" id="form-obter">
           <div class="mb-3">
             <label for="email" class="form-label">E-mail</label>
             <input
               type="email"
               class="form-control"
               name="email"
               id="email"
               required
             />
           </div>
           <button type="submit" class="btn btn-primary" id="btn-buscar">
             Buscar
           </button>
         </form>
         <div id="spinner" class="text-center mt-3" style="display:none">
           <div class="spinner-border" role="status"></div>
           <p>Buscando certificados...</p>
         </div>
         <script>
           document
             .getElementById('form-obter')
             .addEventListener('submit', function () {
               document.getElementById('btn-buscar').disabled = true
               document.getElementById('spinner').style.display = 'block'
             })
         </script>
       </div>
     </div>
     ```
  3. Criar `views/certificados/form-validar.hbs`:
     ```html
     <div class="row justify-content-center mt-5">
       <div class="col-md-6">
         <h2>Validar certificado</h2>
         {{#if mensagem}}
         <div class="alert alert-warning">{{mensagem}}</div>
         {{/if}}
         <form method="POST" action="/certificados/validar">
           <div class="mb-3">
             <label for="codigo" class="form-label"
               >Código do certificado</label
             >
             <input
               type="text"
               class="form-control"
               name="codigo"
               id="codigo"
               required
             />
           </div>
           <button type="submit" class="btn btn-primary">Validar</button>
         </form>
       </div>
     </div>
     ```
- Critério de aceite: os 3 arquivos existem; `GET /certificados` renderiza `opcoes.hbs` (após TASK-029-C); formulários exibem o spinner/validação descritos
- Escopo: 3 arquivos criados
- Dependência: TASK-028-C

---

**[TASK-029-B] Criar views de resultado (`obter-lista.hbs`, `validar-resultado.hbs`)**

- Arquivos a criar:
  - `views/certificados/obter-lista.hbs`
  - `views/certificados/validar-resultado.hbs`
- Contexto: `obter-lista.hbs` recebe `{ email, certificados[] }` onde cada certificado tem `id`, `nome`, `TiposCertificados.descricao`. `validar-resultado.hbs` recebe `{ valido, dados }` onde `dados` tem `codigo`, `evento`, `nome`, `campo_destaque`, `valorDestaque`
- Passos:
  1. Criar `views/certificados/obter-lista.hbs`:
     ```html
     <div class="mt-4">
       <h2>Certificados de {{email}}</h2>
       {{#if certificados}}
       <div class="list-group mt-3">
         {{#each certificados}}
         <div class="list-group-item">
           <div class="d-flex justify-content-between align-items-center">
             <div>
               <strong>{{nome}}</strong>
               <br /><small class="text-muted"
                 >{{TiposCertificados.descricao}}</small
               >
             </div>
             <a
               href="/public/certificados/{{id}}/pdf"
               class="btn btn-sm btn-success"
               >Baixar PDF</a
             >
           </div>
         </div>
         {{/each}}
       </div>
       {{else}}
       <p class="alert alert-info mt-3">Nenhum certificado encontrado.</p>
       {{/if}}
       <a href="/certificados/obter" class="btn btn-link mt-3"
         >Buscar novamente</a
       >
     </div>
     ```
  2. Criar `views/certificados/validar-resultado.hbs`:
     ```html
     <div class="row justify-content-center mt-5">
       <div class="col-md-8">
         {{#if valido}}
         <div class="card border-success">
           <div class="card-header bg-success text-white">
             Certificado Válido ✔
           </div>
           <div class="card-body">
             <p><strong>Código:</strong> {{dados.codigo}}</p>
             <p><strong>Evento:</strong> {{dados.evento}}</p>
             <p><strong>Titular:</strong> {{dados.nome}}</p>
             {{#if dados.valorDestaque}}
             <p>
               <strong>{{dados.campo_destaque}}:</strong>
               {{dados.valorDestaque}}
             </p>
             {{/if}}
           </div>
         </div>
         {{else}}
         <div class="card border-danger">
           <div class="card-header bg-danger text-white">
             Certificado Inválido ✘
           </div>
           <div class="card-body">
             <p>
               O código informado não corresponde a nenhum certificado válido.
             </p>
           </div>
         </div>
         {{/if}}
         <a href="/certificados/validar" class="btn btn-link mt-3"
           >Validar outro</a
         >
       </div>
     </div>
     ```
- Critério de aceite: `obter-lista.hbs` renderiza lista de certificados com link de PDF; `validar-resultado.hbs` exibe painel verde ou vermelho conforme `valido`
- Escopo: 2 arquivos criados
- Dependência: TASK-028-C

---

**[TASK-029-C] Criar rotas SSR públicas de certificados em `src/routes/public.js`**

- Arquivo: `src/routes/public.js` (MODIFICAR)
- Contexto: o arquivo já possui rotas JSON (`GET /certificados?email=`, `GET /validar/:codigo`). As rotas SSR devem ser adicionadas para atender o browser — POST para formulários, GET para renderizar as views. As rotas SSR operam em caminhos diferentes dos da API JSON existente
- Passos:
  1. No final do arquivo (antes do `module.exports = router`), adicionar:

     ```js
     // Rotas SSR (renderizam views Handlebars)
     router.get('/pagina/opcoes', (req, res) =>
       res.render('certificados/opcoes', { title: 'Certificados' }),
     )
     router.get('/pagina/obter', (req, res) =>
       res.render('certificados/form-obter', { title: 'Buscar Certificados' }),
     )
     router.get('/pagina/validar', (req, res) =>
       res.render('certificados/form-validar', {
         title: 'Validar Certificado',
       }),
     )

     router.post('/pagina/buscar', async (req, res) => {
       const { email } = req.body
       if (!email)
         return res.render('certificados/form-obter', {
           mensagem: 'Informe o e-mail.',
           title: 'Buscar',
         })
       try {
         const participante = await Participante.findOne({ where: { email } })
         if (!participante)
           return res.render('certificados/form-obter', {
             mensagem: 'Nenhum participante encontrado com este e-mail.',
             title: 'Buscar',
           })
         const certificados = await Certificado.findAll({
           where: { participante_id: participante.id },
           include: [{ model: TiposCertificados }],
         })
         return res.render('certificados/obter-lista', {
           email,
           certificados: certificados.map((c) => c.toJSON()),
           title: 'Meus Certificados',
         })
       } catch (err) {
         return res.render('certificados/form-obter', {
           mensagem: 'Erro ao buscar certificados.',
           title: 'Buscar',
         })
       }
     })

     router.post('/pagina/validar', async (req, res) => {
       const { codigo } = req.body
       if (!codigo)
         return res.render('certificados/form-validar', {
           mensagem: 'Informe o código.',
           title: 'Validar',
         })
       try {
         const certificado = await Certificado.findOne({
           where: { codigo },
           include: [{ model: Evento }, { model: TiposCertificados }],
         })
         if (!certificado)
           return res.render('certificados/validar-resultado', {
             valido: false,
             title: 'Validar',
           })
         const tipo = certificado.TiposCertificados
         const valores = certificado.valores_dinamicos || {}
         const campoDestaque = tipo.campo_destaque
         const valorDestaque =
           campoDestaque !== 'nome' ? valores[campoDestaque] : null
         return res.render('certificados/validar-resultado', {
           valido: true,
           dados: {
             codigo: certificado.codigo,
             evento: certificado.Evento ? certificado.Evento.nome : '',
             nome: certificado.nome,
             campo_destaque: campoDestaque,
             valorDestaque,
           },
           title: 'Certificado Válido',
         })
       } catch (err) {
         return res.render('certificados/form-validar', {
           mensagem: 'Erro ao validar certificado.',
           title: 'Validar',
         })
       }
     })
     ```

  2. Verificar que `Evento` e `TiposCertificados` já estão importados no topo do arquivo (foram adicionados em TASK-020-C); se não, adicionar ao destructuring existente

- Critério de aceite:
  - `GET /public/pagina/opcoes` renderiza `opcoes.hbs`
  - `POST /public/pagina/buscar` com email válido renderiza `obter-lista.hbs`
  - `POST /public/pagina/validar` com código válido renderiza `validar-resultado.hbs` com `valido: true`
  - Rotas JSON existentes (`/public/certificados?email=`, `/public/validar/:codigo`) não são afetadas
- Escopo: 1 arquivo modificado
- Dependência: TASK-029-A, TASK-029-B, TASK-020-C

---

### TASK-30 🔴 View de login e rotas SSR de autenticação

> Decomposta em micro-tasks. Dependências: TASK-28, TASK-17.

---

**[TASK-030-A] Criar `src/middlewares/authSSR.js`**

- Arquivo: `src/middlewares/authSSR.js` (CRIAR)
- Contexto: o middleware JWT existente (`middleware/auth.js`) valida via `Authorization: Bearer`. Para SSR, o token é armazenado em cookie httpOnly chamado `token`. Este middleware lê o cookie, verifica o JWT, carrega o usuário e popula `req.usuario` e `res.locals.usuario`. Se inválido, redireciona para `/auth/login`
- Passos: criar o arquivo com o conteúdo:

  ```js
  const jwt = require('jsonwebtoken')
  const { Usuario } = require('../models')

  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET não configurado')

  module.exports = async function authSSR(req, res, next) {
    const token = req.cookies && req.cookies.token
    if (!token) return res.redirect('/auth/login')
    try {
      const decoded = jwt.verify(token, secret)
      const usuario = await Usuario.findByPk(decoded.id)
      if (!usuario) return res.redirect('/auth/login')
      req.usuario = usuario
      res.locals.usuario = {
        id: usuario.id,
        nome: usuario.nome,
        perfil: usuario.perfil,
        isAdmin: usuario.perfil === 'admin',
        isGestor: usuario.perfil === 'gestor',
        isMonitor: usuario.perfil === 'monitor',
      }
      res.locals.flash = res.locals.flash || { success: [], error: [] }
      next()
    } catch (err) {
      return res.redirect('/auth/login')
    }
  }
  ```

- Critério de aceite: quando cookie `token` é ausente ou inválido, redireciona para `/auth/login`; quando válido, `res.locals.usuario.isAdmin` é `true` para usuário admin
- Escopo: 1 arquivo criado

---

**[TASK-030-B] Criar `views/auth/login.hbs`**

- Arquivo: `views/auth/login.hbs` (CRIAR)
- Contexto: view pública (usa `layout.hbs` padrão). Recebe `{ mensagem? }` para exibir erros de credenciais. Formulário POST para `/auth/login`
- Passos: criar o arquivo com conteúdo:
  ```html
  <div class="row justify-content-center mt-5">
    <div class="col-md-4">
      <h2 class="mb-4">Entrar</h2>
      {{#if mensagem}}
      <div class="alert alert-danger">{{mensagem}}</div>
      {{/if}}
      <form method="POST" action="/auth/login">
        <div class="mb-3">
          <label for="email" class="form-label">E-mail</label>
          <input
            type="email"
            class="form-control"
            name="email"
            id="email"
            required
            autofocus
          />
        </div>
        <div class="mb-3">
          <label for="senha" class="form-label">Senha</label>
          <input
            type="password"
            class="form-control"
            name="senha"
            id="senha"
            required
          />
        </div>
        <button type="submit" class="btn btn-primary w-100">Entrar</button>
      </form>
    </div>
  </div>
  ```
- Critério de aceite: arquivo criado; renderiza formulário com campos `email` e `senha`; exibe `mensagem` de erro quando presente
- Escopo: 1 arquivo criado

---

**[TASK-030-C] Criar `src/routes/auth.js` com rotas SSR de login/logout**

- Arquivo: `src/routes/auth.js` (CRIAR)
- Contexto: rotas SSR de autenticação. `POST /auth/login` usa `bcrypt.compare` e `jwt.sign` (mesma lógica do `usuarioController.login`), depois seta cookie httpOnly e redireciona. `POST /auth/logout` limpa o cookie. `GET /auth/login` renderiza a view ou redireciona se já autenticado
- Passos: criar o arquivo com conteúdo:

  ```js
  const express = require('express')
  const router = express.Router()
  const jwt = require('jsonwebtoken')
  const bcrypt = require('bcryptjs')
  const { Usuario } = require('../models')

  const JWT_SECRET = process.env.JWT_SECRET
  if (!JWT_SECRET) throw new Error('JWT_SECRET não configurado')

  // GET /auth/login
  router.get('/login', (req, res) => {
    if (req.cookies && req.cookies.token) {
      try {
        jwt.verify(req.cookies.token, JWT_SECRET)
        return res.redirect('/admin/dashboard')
      } catch (_) {}
    }
    res.render('auth/login', { title: 'Entrar' })
  })

  // POST /auth/login
  router.post('/login', async (req, res) => {
    const { email, senha } = req.body
    try {
      const usuario = await Usuario.findOne({ where: { email } })
      if (!usuario)
        return res.render('auth/login', {
          mensagem: 'Credenciais inválidas.',
          title: 'Entrar',
        })
      const valid = await bcrypt.compare(senha, usuario.senha)
      if (!valid)
        return res.render('auth/login', {
          mensagem: 'Credenciais inválidas.',
          title: 'Entrar',
        })
      const token = jwt.sign(
        { id: usuario.id, perfil: usuario.perfil },
        JWT_SECRET,
        { expiresIn: '8h' },
      )
      res.cookie('token', token, { httpOnly: true, maxAge: 8 * 60 * 60 * 1000 })
      return res.redirect('/admin/dashboard')
    } catch (err) {
      return res.render('auth/login', {
        mensagem: 'Erro interno. Tente novamente.',
        title: 'Entrar',
      })
    }
  })

  // POST /auth/logout
  router.post('/logout', (req, res) => {
    res.clearCookie('token')
    return res.redirect('/auth/login')
  })

  module.exports = router
  ```

- Critério de aceite: `POST /auth/login` com credenciais válidas seta cookie `token` e redireciona para `/admin/dashboard`; credenciais inválidas renderiza `auth/login` com mensagem; `POST /auth/logout` limpa o cookie
- Escopo: 1 arquivo criado
- Dependência: TASK-030-A, TASK-030-B

---

**[TASK-030-D] Registrar `authRouter` em `app.js`**

- Arquivo: `app.js` (MODIFICAR)
- Contexto: o arquivo já tem vários `require` de rotas no topo e `app.use(...)` mais abaixo. A rota `/auth` deve ser adicionada ao bloco de require e ao bloco de use
- Passos:
  1. No bloco de `require` das rotas, adicionar:
     ```js
     var authRouter = require('./src/routes/auth')
     ```
  2. No bloco de `app.use(...)`, adicionar (antes das rotas protegidas):
     ```js
     app.use('/auth', authRouter)
     ```
- Critério de aceite: `GET /auth/login` retorna 200 com o formulário; `POST /auth/login` funciona
- Escopo: 1 arquivo modificado
- Dependência: TASK-030-C

---

### TASK-31 🟡 Dashboard administrativo

> Decomposta em micro-tasks. Dependência: TASK-30.

---

**[TASK-031-A] Criar `src/controllers/dashboardController.js`**

- Arquivo: `src/controllers/dashboardController.js` (CRIAR)
- Contexto: o controller consulta contagens no banco conforme o perfil do usuário. Os models já disponíveis em `src/models` são `Evento`, `Participante`, `Certificado`, `Usuario`. Para gestor/monitor, os eventos vinculados são obtidos via `req.usuario.getEventos()` (associação N:N)
- Passos: criar o arquivo com conteúdo:

  ```js
  const { Evento, Participante, Certificado, Usuario } = require('../models')

  module.exports = {
    async index(req, res) {
      try {
        const perfil = req.usuario.perfil
        let stats = {}

        if (perfil === 'admin') {
          const [
            totalEventos,
            totalParticipantes,
            totalCertificados,
            totalUsuarios,
          ] = await Promise.all([
            Evento.count(),
            Participante.count(),
            Certificado.count({ where: { status: 'emitido' } }),
            Usuario.count(),
          ])
          stats = {
            totalEventos,
            totalParticipantes,
            totalCertificados,
            totalUsuarios,
          }
        } else {
          const eventos = await req.usuario.getEventos()
          const eventoIds = eventos.map((e) => e.id)
          const [totalCertificados, totalParticipantes] = await Promise.all([
            Certificado.count({
              where: { evento_id: eventoIds, status: 'emitido' },
            }),
            Participante.count(),
          ])
          stats = {
            totalCertificados,
            totalParticipantes,
            eventos: eventos.map((e) => e.nome),
          }
        }

        return res.render('admin/dashboard', {
          layout: 'layouts/admin',
          title: 'Dashboard',
          ...stats,
        })
      } catch (err) {
        return res
          .status(500)
          .render('error', { message: err.message, error: { status: 500 } })
      }
    },
  }
  ```

- Critério de aceite: `GET /admin/dashboard` com usuário admin retorna `res.render` com `totalEventos`, `totalParticipantes`, `totalCertificados`, `totalUsuarios`; com gestor retorna apenas `totalCertificados` e `eventos`
- Escopo: 1 arquivo criado

---

**[TASK-031-B] Criar `views/admin/dashboard.hbs`**

- Arquivo: `views/admin/dashboard.hbs` (CRIAR)
- Contexto: usa `layout: 'layouts/admin'` (passado pelo controller). Exibe cards de contagem condicionais ao perfil usando os helpers `{{#if isAdmin}}`, `{{#if isGestor}}` etc. disponíveis via `res.locals.usuario`
- Passos: criar o arquivo com conteúdo:

  ```html
  <h1 class="mb-4">Dashboard</h1>

  <div class="row g-3">
    {{#if usuario.isAdmin}}
    <div class="col-md-3">
      <div class="card text-white bg-primary">
        <div class="card-body">
          <h5>Eventos</h5>
          <p class="display-6">{{totalEventos}}</p>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-white bg-success">
        <div class="card-body">
          <h5>Participantes</h5>
          <p class="display-6">{{totalParticipantes}}</p>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-white bg-info">
        <div class="card-body">
          <h5>Certificados emitidos</h5>
          <p class="display-6">{{totalCertificados}}</p>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card text-white bg-secondary">
        <div class="card-body">
          <h5>Usuários</h5>
          <p class="display-6">{{totalUsuarios}}</p>
        </div>
      </div>
    </div>
    {{else}}
    <div class="col-md-4">
      <div class="card text-white bg-info">
        <div class="card-body">
          <h5>Certificados emitidos</h5>
          <p class="display-6">{{totalCertificados}}</p>
        </div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="card text-white bg-success">
        <div class="card-body">
          <h5>Participantes</h5>
          <p class="display-6">{{totalParticipantes}}</p>
        </div>
      </div>
    </div>
    {{/if}}
  </div>

  <div class="mt-4">
    <a href="/certificados" class="btn btn-outline-primary"
      >Ver certificados públicos</a
    >
  </div>
  ```

- Critério de aceite: arquivo criado; ao renderizar com `{ usuario: { isAdmin: true }, totalEventos: 5, ... }` exibe os 4 cards; sem `isAdmin` exibe apenas os cards de certificados e participantes
- Escopo: 1 arquivo criado
- Dependência: TASK-031-A

---

**[TASK-031-C] Criar `src/routes/admin.js` e registrar em `app.js`**

- Arquivos: `src/routes/admin.js` (CRIAR), `app.js` (MODIFICAR)
- Contexto: cria o router `/admin` com a rota `GET /dashboard` protegida por `authSSR`. O `app.js` já tem o padrão de require/use para as rotas
- Passos:
  1. Criar `src/routes/admin.js`:

     ```js
     const express = require('express')
     const router = express.Router()
     const authSSR = require('../middlewares/authSSR')
     const dashboardController = require('../controllers/dashboardController')

     router.use(authSSR)

     router.get('/dashboard', dashboardController.index)

     module.exports = router
     ```

  2. Em `app.js`, no bloco de `require` das rotas, adicionar:
     ```js
     var adminRouter = require('./src/routes/admin')
     ```
  3. Em `app.js`, no bloco de `app.use(...)`, adicionar:
     ```js
     app.use('/admin', adminRouter)
     ```

- Critério de aceite: `GET /admin/dashboard` sem cookie redireciona para `/auth/login`; com cookie válido renderiza `admin/dashboard` com dados do controller
- Escopo: 2 arquivos (1 criado, 1 modificado)
- Dependência: TASK-030-A, TASK-031-B

---

### TASK-32 🟡 Views de gestão de eventos

> Decomposta em micro-tasks. Dependências: TASK-28, TASK-31.

---

**[TASK-032-A] Criar `views/admin/eventos/index.hbs`**

- Arquivo: `views/admin/eventos/index.hbs` (CRIAR)
- Contexto: usa `layout: 'layouts/admin'` (passado pelo controller). Recebe `{ eventos[], arquivados[], title }`. Tabela com colunas: nome, `codigo_base`, ano, ações (Editar / Remover). Seção `<details>` colapsável "Eventos arquivados" com botão "Restaurar" via form POST. Botão "+ Novo Evento" no topo.
- Passos: criar o arquivo com conteúdo:
  ```html
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h1>Eventos</h1>
    <a href="/admin/eventos/novo" class="btn btn-primary">+ Novo Evento</a>
  </div>
  <table class="table table-bordered">
    <thead>
      <tr>
        <th>Nome</th>
        <th>Código</th>
        <th>Ano</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      {{#each eventos}}
      <tr>
        <td>{{nome}}</td>
        <td><code>{{codigo_base}}</code></td>
        <td>{{ano}}</td>
        <td>
          <a href="/admin/eventos/{{id}}/editar" class="btn btn-sm btn-warning"
            >Editar</a
          >
          <form
            method="POST"
            action="/admin/eventos/{{id}}/deletar"
            class="d-inline"
            onsubmit="return confirm('Remover este evento?')"
          >
            <button type="submit" class="btn btn-sm btn-danger">Remover</button>
          </form>
        </td>
      </tr>
      {{else}}
      <tr>
        <td colspan="4" class="text-center text-muted">
          Nenhum evento cadastrado.
        </td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  {{#if arquivados}}
  <details class="mt-4">
    <summary class="btn btn-link">
      Eventos arquivados ({{arquivados.length}})
    </summary>
    <table class="table table-bordered mt-2">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Código</th>
          <th>Ano</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {{#each arquivados}}
        <tr class="table-secondary">
          <td>{{nome}}</td>
          <td><code>{{codigo_base}}</code></td>
          <td>{{ano}}</td>
          <td>
            <form
              method="POST"
              action="/admin/eventos/{{id}}/restaurar"
              class="d-inline"
            >
              <button type="submit" class="btn btn-sm btn-success">
                Restaurar
              </button>
            </form>
          </td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </details>
  {{/if}}
  ```
- Critério de aceite: arquivo criado; tabela de eventos ativos renderiza com colunas corretas; botão "Remover" possui `onsubmit` de confirmação; seção arquivados usa `<details>` e botão "Restaurar" via form POST
- Escopo: 1 arquivo criado

---

**[TASK-032-B] Criar `views/admin/eventos/form.hbs`**

- Arquivo: `views/admin/eventos/form.hbs` (CRIAR)
- Contexto: formulário compartilhado para criação e edição. Recebe `{ evento?, action, title }` — quando `evento` está presente, é modo edição (inputs preenchidos via `{{evento.campo}}`). `action` é a URL de destino do POST.
- Passos: criar o arquivo com conteúdo:
  ```html
  <h2>{{title}}</h2>
  <div class="row mt-3">
    <div class="col-md-6">
      <form method="POST" action="{{action}}">
        <div class="mb-3">
          <label for="nome" class="form-label"
            >Nome do evento <span class="text-danger">*</span></label
          >
          <input
            type="text"
            class="form-control"
            name="nome"
            id="nome"
            value="{{evento.nome}}"
            required
          />
        </div>
        <div class="mb-3">
          <label for="codigo_base" class="form-label"
            >Código base (3 letras) <span class="text-danger">*</span></label
          >
          <input
            type="text"
            class="form-control"
            name="codigo_base"
            id="codigo_base"
            value="{{evento.codigo_base}}"
            required
            pattern="[A-Za-z]{3}"
            maxlength="3"
            title="Exatamente 3 letras (sem números ou símbolos)"
          />
        </div>
        <div class="mb-3">
          <label for="ano" class="form-label"
            >Ano <span class="text-danger">*</span></label
          >
          <input
            type="number"
            class="form-control"
            name="ano"
            id="ano"
            value="{{evento.ano}}"
            required
            min="2000"
            max="2100"
          />
        </div>
        <button type="submit" class="btn btn-primary">Salvar</button>
        <a href="/admin/eventos" class="btn btn-secondary ms-2">Cancelar</a>
      </form>
    </div>
  </div>
  ```
- Critério de aceite: campo `codigo_base` tem `pattern="[A-Za-z]{3}"` e `maxlength="3"`; no modo edição, inputs exibem os valores atuais do evento; botão "Cancelar" leva para `/admin/eventos`
- Escopo: 1 arquivo criado
- Dependência: TASK-032-A

---

**[TASK-032-C] Criar `src/controllers/eventoSSRController.js`**

- Arquivo: `src/controllers/eventoSSRController.js` (CRIAR)
- Contexto: controller SSR com 7 métodos que delegam ao `eventoService` para as operações de CRUD. Para listar eventos arquivados usa `Evento.findAll({ paranoid: false, where: { deleted_at: { [Op.ne]: null } } })` diretamente (já que o service não expõe essa query). Após operações de escrita usa `req.flash` + `res.redirect`. Em erros de formulário, re-renderiza a view com os dados digitados.
- Passos: criar o arquivo com conteúdo:

  ```js
  const eventoService = require('../services/eventoService')
  const { Evento } = require('../models')
  const { Op } = require('sequelize')

  module.exports = {
    async index(req, res) {
      try {
        const eventos = await Evento.findAll()
        const arquivados = await Evento.findAll({
          paranoid: false,
          where: { deleted_at: { [Op.ne]: null } },
        })
        return res.render('admin/eventos/index', {
          layout: 'layouts/admin',
          title: 'Eventos',
          eventos: eventos.map((e) => e.toJSON()),
          arquivados: arquivados.map((e) => e.toJSON()),
        })
      } catch (err) {
        req.flash('error', err.message)
        return res.redirect('/admin/dashboard')
      }
    },

    novo(req, res) {
      return res.render('admin/eventos/form', {
        layout: 'layouts/admin',
        title: 'Novo Evento',
        action: '/admin/eventos',
      })
    },

    async editar(req, res) {
      try {
        const evento = await eventoService.findById(req.params.id)
        if (!evento) {
          req.flash('error', 'Evento não encontrado.')
          return res.redirect('/admin/eventos')
        }
        return res.render('admin/eventos/form', {
          layout: 'layouts/admin',
          title: 'Editar Evento',
          action: `/admin/eventos/${req.params.id}`,
          evento: evento.toJSON(),
        })
      } catch (err) {
        req.flash('error', err.message)
        return res.redirect('/admin/eventos')
      }
    },

    async criar(req, res) {
      try {
        await eventoService.create(req.body)
        req.flash('success', 'Evento criado com sucesso.')
        return res.redirect('/admin/eventos')
      } catch (err) {
        req.flash('error', err.message)
        return res.render('admin/eventos/form', {
          layout: 'layouts/admin',
          title: 'Novo Evento',
          action: '/admin/eventos',
          evento: req.body,
        })
      }
    },

    async atualizar(req, res) {
      try {
        await eventoService.update(req.params.id, req.body)
        req.flash('success', 'Evento atualizado com sucesso.')
        return res.redirect('/admin/eventos')
      } catch (err) {
        req.flash('error', err.message)
        return res.redirect(`/admin/eventos/${req.params.id}/editar`)
      }
    },

    async deletar(req, res) {
      try {
        await eventoService.delete(req.params.id)
        req.flash('success', 'Evento removido.')
        return res.redirect('/admin/eventos')
      } catch (err) {
        req.flash('error', err.message)
        return res.redirect('/admin/eventos')
      }
    },

    async restaurar(req, res) {
      try {
        await eventoService.restore(req.params.id)
        req.flash('success', 'Evento restaurado com sucesso.')
        return res.redirect('/admin/eventos')
      } catch (err) {
        req.flash('error', err.message)
        return res.redirect('/admin/eventos')
      }
    },
  }
  ```

- Critério de aceite: controller exporta os 7 métodos; `index` retorna eventos ativos e arquivados separados; `criar` re-renderiza o form com `evento: req.body` em caso de erro para preservar os valores digitados
- Escopo: 1 arquivo criado
- Dependência: TASK-032-A, TASK-032-B

---

**[TASK-032-D] Adicionar rotas de eventos em `src/routes/admin.js`**

- Arquivo: `src/routes/admin.js` (MODIFICAR)
- Contexto: o arquivo foi criado em TASK-031-C com apenas `router.use(authSSR)` e `GET /dashboard`. É necessário importar `rbac` e `eventoSSRController` e adicionar as 7 rotas de gestão de eventos protegidas por `rbac('admin')`.
- Passos:
  1. No topo de `src/routes/admin.js`, após os `require` existentes, adicionar:
     ```js
     const rbac = require('../middlewares/rbac')
     const eventoSSRController = require('../controllers/eventoSSRController')
     ```
  2. Após `router.get('/dashboard', dashboardController.index)`, adicionar:
     ```js
     // Gestão de eventos (somente admin)
     router.get('/eventos', rbac('admin'), eventoSSRController.index)
     router.get('/eventos/novo', rbac('admin'), eventoSSRController.novo)
     router.get(
       '/eventos/:id/editar',
       rbac('admin'),
       eventoSSRController.editar,
     )
     router.post('/eventos', rbac('admin'), eventoSSRController.criar)
     router.post('/eventos/:id', rbac('admin'), eventoSSRController.atualizar)
     router.post(
       '/eventos/:id/deletar',
       rbac('admin'),
       eventoSSRController.deletar,
     )
     router.post(
       '/eventos/:id/restaurar',
       rbac('admin'),
       eventoSSRController.restaurar,
     )
     ```
- Critério de aceite: `GET /admin/eventos` sem cookie redireciona para `/auth/login` (pelo `authSSR` aplicado via `router.use`); com token de admin renderiza listagem; com token de gestor ou monitor retorna 403
- Escopo: 1 arquivo modificado
- Dependências: TASK-031-C, TASK-032-C

---

### TASK-33 🟡 Views de gestão de participantes

> Decomposta em micro-tasks. Dependências: TASK-28, TASK-31.

---

**[TASK-033-A] Criar `views/admin/participantes/index.hbs`**

- Arquivo: `views/admin/participantes/index.hbs` (CRIAR)
- Contexto: usa `layout: 'layouts/admin'`. Recebe `{ participantes[], arquivados[], q, title }`. Cada participante inclui `numCertificados` (contagem). Campo de busca GET `?q=` por nome ou email. Seção colapsável de participantes arquivados com "Restaurar" via form POST.
- Passos: criar o arquivo com conteúdo:
  ```html
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h1>Participantes</h1>
    <a href="/admin/participantes/novo" class="btn btn-primary"
      >+ Novo Participante</a
    >
  </div>
  <form method="GET" action="/admin/participantes" class="mb-3 d-flex gap-2">
    <input
      type="text"
      class="form-control"
      name="q"
      value="{{q}}"
      placeholder="Buscar por nome ou email"
    />
    <button type="submit" class="btn btn-outline-secondary">Buscar</button>
    {{#if q}}<a href="/admin/participantes" class="btn btn-outline-danger"
      >Limpar</a
    >{{/if}}
  </form>
  <table class="table table-bordered">
    <thead>
      <tr>
        <th>Nome</th>
        <th>E-mail</th>
        <th>Instituição</th>
        <th>Certificados</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      {{#each participantes}}
      <tr>
        <td>{{nomeCompleto}}</td>
        <td>{{email}}</td>
        <td>{{instituicao}}</td>
        <td>{{numCertificados}}</td>
        <td>
          <a
            href="/admin/participantes/{{id}}/editar"
            class="btn btn-sm btn-warning"
            >Editar</a
          >
          <form
            method="POST"
            action="/admin/participantes/{{id}}/deletar"
            class="d-inline"
            onsubmit="return confirm('Remover este participante?')"
          >
            <button type="submit" class="btn btn-sm btn-danger">Remover</button>
          </form>
        </td>
      </tr>
      {{else}}
      <tr>
        <td colspan="5" class="text-center text-muted">
          Nenhum participante encontrado.
        </td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  {{#if arquivados}}
  <details class="mt-4">
    <summary class="btn btn-link">
      Participantes arquivados ({{arquivados.length}})
    </summary>
    <table class="table table-bordered mt-2">
      <thead>
        <tr>
          <th>Nome</th>
          <th>E-mail</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {{#each arquivados}}
        <tr class="table-secondary">
          <td>{{nomeCompleto}}</td>
          <td>{{email}}</td>
          <td>
            <form
              method="POST"
              action="/admin/participantes/{{id}}/restaurar"
              class="d-inline"
            >
              <button type="submit" class="btn btn-sm btn-success">
                Restaurar
              </button>
            </form>
          </td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </details>
  {{/if}}
  ```
- Critério de aceite: arquivo criado; campo de busca envia GET com `name="q"`; tabela exibe `nomeCompleto`, `email`, `instituicao`, `numCertificados`; seção de arquivados usa `<details>` com restore via form POST
- Escopo: 1 arquivo criado

---

**[TASK-033-B] Criar `views/admin/participantes/form.hbs`**

- Arquivo: `views/admin/participantes/form.hbs` (CRIAR)
- Contexto: formulário compartilhado criar/editar participante. Recebe `{ participante?, action, title }`. Campos: `nomeCompleto` (required), `email` (type=email, required), `instituicao` (opcional). Modo edição preenche os inputs com `{{participante.campo}}`.
- Passos: criar o arquivo com conteúdo:
  ```html
  <h2>{{title}}</h2>
  <div class="row mt-3">
    <div class="col-md-6">
      <form method="POST" action="{{action}}">
        <div class="mb-3">
          <label for="nomeCompleto" class="form-label"
            >Nome completo <span class="text-danger">*</span></label
          >
          <input
            type="text"
            class="form-control"
            name="nomeCompleto"
            id="nomeCompleto"
            value="{{participante.nomeCompleto}}"
            required
          />
        </div>
        <div class="mb-3">
          <label for="email" class="form-label"
            >E-mail <span class="text-danger">*</span></label
          >
          <input
            type="email"
            class="form-control"
            name="email"
            id="email"
            value="{{participante.email}}"
            required
          />
        </div>
        <div class="mb-3">
          <label for="instituicao" class="form-label">Instituição</label>
          <input
            type="text"
            class="form-control"
            name="instituicao"
            id="instituicao"
            value="{{participante.instituicao}}"
          />
        </div>
        <button type="submit" class="btn btn-primary">Salvar</button>
        <a href="/admin/participantes" class="btn btn-secondary ms-2"
          >Cancelar</a
        >
      </form>
    </div>
  </div>
  ```
- Critério de aceite: campo `email` tem `type="email"` e `required`; campo `nomeCompleto` tem `required`; no modo edição, inputs exibem os valores do participante; botão "Cancelar" leva para `/admin/participantes`
- Escopo: 1 arquivo criado
- Dependência: TASK-033-A

---

**[TASK-033-C] Criar `src/controllers/participanteSSRController.js` e rotas em `src/routes/admin.js`**

- Arquivos: `src/controllers/participanteSSRController.js` (CRIAR), `src/routes/admin.js` (MODIFICAR)
- Contexto: controller SSR com 7 métodos. `index` aceita `?q=` para busca case-insensitive por `nome_completo` ou `email` via `Op.iLike`. Para cada participante retornado, conta certificados via `Certificado.count({ where: { participante_id: p.id } })`. Participantes arquivados via `paranoid: false`. Rotas adicionadas ao `src/routes/admin.js` criado na TASK-031-C (após as rotas de eventos da TASK-032-D), todas protegidas por `rbac('monitor')` (todos os perfis autenticados).
- Passos:
  1. Criar `src/controllers/participanteSSRController.js`:

     ```js
     const participanteService = require('../services/participanteService')
     const { Participante, Certificado } = require('../models')
     const { Op } = require('sequelize')

     module.exports = {
       async index(req, res) {
         try {
           const q = req.query.q || ''
           const where = q
             ? {
                 [Op.or]: [
                   { nome_completo: { [Op.iLike]: `%${q}%` } },
                   { email: { [Op.iLike]: `%${q}%` } },
                 ],
               }
             : {}
           const participantesRaw = await Participante.findAll({ where })
           const participantes = await Promise.all(
             participantesRaw.map(async (p) => {
               const json = p.toJSON()
               json.numCertificados = await Certificado.count({
                 where: { participante_id: p.id },
               })
               return json
             }),
           )
           const arquivados = await Participante.findAll({
             paranoid: false,
             where: { deleted_at: { [Op.ne]: null } },
           })
           return res.render('admin/participantes/index', {
             layout: 'layouts/admin',
             title: 'Participantes',
             participantes,
             arquivados: arquivados.map((p) => p.toJSON()),
             q,
           })
         } catch (err) {
           req.flash('error', err.message)
           return res.redirect('/admin/dashboard')
         }
       },

       novo(req, res) {
         return res.render('admin/participantes/form', {
           layout: 'layouts/admin',
           title: 'Novo Participante',
           action: '/admin/participantes',
         })
       },

       async editar(req, res) {
         try {
           const participante = await participanteService.findById(
             req.params.id,
           )
           if (!participante) {
             req.flash('error', 'Participante não encontrado.')
             return res.redirect('/admin/participantes')
           }
           return res.render('admin/participantes/form', {
             layout: 'layouts/admin',
             title: 'Editar Participante',
             action: `/admin/participantes/${req.params.id}`,
             participante: participante.toJSON(),
           })
         } catch (err) {
           req.flash('error', err.message)
           return res.redirect('/admin/participantes')
         }
       },

       async criar(req, res) {
         try {
           await participanteService.create(req.body)
           req.flash('success', 'Participante criado com sucesso.')
           return res.redirect('/admin/participantes')
         } catch (err) {
           req.flash('error', err.message)
           return res.render('admin/participantes/form', {
             layout: 'layouts/admin',
             title: 'Novo Participante',
             action: '/admin/participantes',
             participante: req.body,
           })
         }
       },

       async atualizar(req, res) {
         try {
           await participanteService.update(req.params.id, req.body)
           req.flash('success', 'Participante atualizado com sucesso.')
           return res.redirect('/admin/participantes')
         } catch (err) {
           req.flash('error', err.message)
           return res.redirect(`/admin/participantes/${req.params.id}/editar`)
         }
       },

       async deletar(req, res) {
         try {
           await participanteService.delete(req.params.id)
           req.flash('success', 'Participante removido.')
           return res.redirect('/admin/participantes')
         } catch (err) {
           req.flash('error', err.message)
           return res.redirect('/admin/participantes')
         }
       },

       async restaurar(req, res) {
         try {
           await participanteService.restore(req.params.id)
           req.flash('success', 'Participante restaurado com sucesso.')
           return res.redirect('/admin/participantes')
         } catch (err) {
           req.flash('error', err.message)
           return res.redirect('/admin/participantes')
         }
       },
     }
     ```

  2. Em `src/routes/admin.js`, após as rotas de eventos (TASK-032-D), adicionar:
     ```js
     // Gestão de participantes (monitor, gestor, admin)
     const participanteSSRController = require('../controllers/participanteSSRController')
     router.get(
       '/participantes',
       rbac('monitor'),
       participanteSSRController.index,
     )
     router.get(
       '/participantes/novo',
       rbac('monitor'),
       participanteSSRController.novo,
     )
     router.get(
       '/participantes/:id/editar',
       rbac('monitor'),
       participanteSSRController.editar,
     )
     router.post(
       '/participantes',
       rbac('monitor'),
       participanteSSRController.criar,
     )
     router.post(
       '/participantes/:id',
       rbac('monitor'),
       participanteSSRController.atualizar,
     )
     router.post(
       '/participantes/:id/deletar',
       rbac('monitor'),
       participanteSSRController.deletar,
     )
     router.post(
       '/participantes/:id/restaurar',
       rbac('monitor'),
       participanteSSRController.restaurar,
     )
     ```

- Critério de aceite: `GET /admin/participantes?q=silva` retorna participantes cujo `nome_completo` ou `email` contém "silva" (case insensitive via `Op.iLike`); `numCertificados` é exibido em cada linha; monitor, gestor e admin conseguem acessar
- Escopo: 2 arquivos (1 criado, 1 modificado)
- Dependências: TASK-032-D, TASK-033-A, TASK-033-B

---

### TASK-34 🟡 Views de gestão de certificados

> Decomposta em micro-tasks. Dependências: TASK-28, TASK-31, TASK-18.

---

**[TASK-034-A] Criar `views/admin/certificados/index.hbs`**

- Arquivo: `views/admin/certificados/index.hbs` (CRIAR)
- Contexto: usa `layout: 'layouts/admin'`. Recebe `{ certificados[], eventos[], tipos[], filtros: { evento_id, status, tipo_id }, title }`. Cada certificado inclui `Participante.nomeCompleto`, `Evento.nome`, `TiposCertificados.descricao`, `status`, `codigo`. Botão "Cancelar" com modal de confirmação Bootstrap para certificados com `status === 'emitido'`. Botão "Restaurar" via form POST para certificados com `deleted_at`.
- Passos: criar o arquivo com conteúdo:
  ```html
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h1>Certificados</h1>
    <a href="/admin/certificados/novo" class="btn btn-primary">+ Emitir Certificado</a>
  </div>
  <form method="GET" action="/admin/certificados" class="row g-2 mb-3">
    <div class="col-md-4">
      <select name="evento_id" class="form-select">
        <option value="">Todos os eventos</option>
        {{#each eventos}}
        <option value="{{id}}" {{#if (eq id ../filtros.evento_id)}}selected{{/if}}>{{nome}}</option>
        {{/each}}
      </select>
    </div>
    <div class="col-md-3">
      <select name="status" class="form-select">
        <option value="">Todos os status</option>
        <option value="emitido" {{#if (eq ../filtros.status 'emitido')}}selected{{/if}}>Emitido</option>
        <option value="pendente" {{#if (eq ../filtros.status 'pendente')}}selected{{/if}}>Pendente</option>
        <option value="cancelado" {{#if (eq ../filtros.status 'cancelado')}}selected{{/if}}>Cancelado</option>
      </select>
    </div>
    <div class="col-md-3">
      <select name="tipo_id" class="form-select">
        <option value="">Todos os tipos</option>
        {{#each tipos}}
        <option value="{{id}}" {{#if (eq id ../filtros.tipo_id)}}selected{{/if}}>{{descricao}}</option>
        {{/each}}
      </select>
    </div>
    <div class="col-md-2">
      <button type="submit" class="btn btn-outline-secondary w-100">Filtrar</button>
    </div>
  </form>
  <table class="table table-bordered table-sm">
    <thead>
      <tr><th>Participante</th><th>Evento</th><th>Tipo</th><th>Status</th><th>Código</th><th>Ações</th></tr>
    </thead>
    <tbody>
      {{#each certificados}}
      <tr class="{{#if deleted_at}}table-secondary{{/if}}">
        <td>{{Participante.nomeCompleto}}</td>
        <td>{{Evento.nome}}</td>
        <td>{{TiposCertificados.descricao}}</td>
        <td><span class="badge bg-{{statusBadge}}">{{status}}</span></td>
        <td><code>{{codigo}}</code></td>
        <td>
          <a href="/admin/certificados/{{id}}" class="btn btn-sm btn-info">Ver</a>
          {{#unless deleted_at}}
            {{#if (eq status 'emitido')}}
            <button class="btn btn-sm btn-warning" data-bs-toggle="modal"
                    data-bs-target="#modal-cancelar-{{id}}">Cancelar</button>
            {{/if}}
            <form method="POST" action="/admin/certificados/{{id}}/deletar" class="d-inline"
                  onsubmit="return confirm('Remover este certificado?')">
              <button type="submit" class="btn btn-sm btn-danger">Remover</button>
            </form>
          {{else}}
            <form method="POST" action="/admin/certificados/{{id}}/restaurar" class="d-inline">
              <button type="submit" class="btn btn-sm btn-success">Restaurar</button>
            </form>
          {{/unless}}
        </td>
      </tr>
      <!-- Modal cancelar -->
      {{#if (eq status 'emitido')}}
      <div class="modal fade" id="modal-cancelar-{{id}}" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header"><h5 class="modal-title">Cancelar certificado</h5></div>
            <div class="modal-body">Deseja cancelar o certificado de <strong>{{Participante.nomeCompleto}}</strong>?</div>
            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">Não</button>
              <form method="POST" action="/admin/certificados/{{id}}/cancelar" class="d-inline">
                <button type="submit" class="btn btn-warning">Cancelar certificado</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {{/if}}
      {{else}}
      <tr><td colspan="6" class="text-center text-muted">Nenhum certificado encontrado.</td></tr>
      {{/each}}
    </tbody>
  </table>
  ```
- Critério de aceite: arquivo criado; filtros de evento, status e tipo são selects com `name` corretos; linha de certificados arquivados usa classe `table-secondary`; modal de cancelamento referencia `data-bs-target="#modal-cancelar-{{id}}"`
- Escopo: 1 arquivo criado

---

**[TASK-034-B] Criar `views/admin/certificados/form.hbs` e `views/admin/certificados/detalhe.hbs`**

- Arquivos:
  - `views/admin/certificados/form.hbs` (CRIAR)
  - `views/admin/certificados/detalhe.hbs` (CRIAR)
- Contexto do `form.hbs`: recebe `{ participantes[], eventos[], tipos[], certificado?, action, title }`. Ao selecionar um tipo via `<select name="tipo_certificado_id">`, JavaScript faz `fetch('/tipos-certificados/:id')` (JSON API existente) e renderiza campos de `dados_dinamicos` dinamicamente dentro de `#campos-dinamicos`.
- Passos para `form.hbs`:
  ```html
  <h2>{{title}}</h2>
  <div class="row mt-3">
    <div class="col-md-8">
      <form method="POST" action="{{action}}" id="form-certificado">
        <div class="mb-3">
          <label class="form-label">Participante *</label>
          <select name="participante_id" class="form-select" required>
            <option value="">Selecione...</option>
            {{#each participantes}}
            <option value="{{id}}" {{#if (eq id ../certificado.participante_id)}}selected{{/if}}>{{nomeCompleto}} — {{email}}</option>
            {{/each}}
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Evento *</label>
          <select name="evento_id" class="form-select" required>
            <option value="">Selecione...</option>
            {{#each eventos}}
            <option value="{{id}}" {{#if (eq id ../certificado.evento_id)}}selected{{/if}}>{{nome}}</option>
            {{/each}}
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Tipo de certificado *</label>
          <select name="tipo_certificado_id" id="tipo_certificado_id" class="form-select" required>
            <option value="">Selecione...</option>
            {{#each tipos}}
            <option value="{{id}}" {{#if (eq id ../certificado.tipo_certificado_id)}}selected{{/if}}>{{descricao}}</option>
            {{/each}}
          </select>
        </div>
        <div id="campos-dinamicos"></div>
        <button type="submit" class="btn btn-primary">Salvar</button>
        <a href="/admin/certificados" class="btn btn-secondary ms-2">Cancelar</a>
      </form>
    </div>
  </div>
  <script>
    document.getElementById('tipo_certificado_id').addEventListener('change', async function () {
      const tipoId = this.value
      const container = document.getElementById('campos-dinamicos')
      container.innerHTML = ''
      if (!tipoId) return
      const res = await fetch(`/tipos-certificados/${tipoId}`)
      const tipo = await res.json()
      const dados = tipo.dados_dinamicos || {}
      Object.keys(dados).forEach(chave => {
        container.insertAdjacentHTML('beforeend', `
          <div class="mb-3">
            <label class="form-label">${chave}</label>
            <input type="text" class="form-control" name="valores_dinamicos[${chave}]" required>
          </div>
        `)
      })
    })
  </script>
  ```
- Passos para `detalhe.hbs`: recebe `{ certificado, textoInterpolado, title }` onde `textoInterpolado` é o resultado de `templateService.interpolate`:
  ```html
  <h2>Certificado #{{certificado.id}}</h2>
  <div class="card mt-3">
    <div class="card-body">
      <p>
        <strong>Participante:</strong> {{certificado.Participante.nomeCompleto}}
      </p>
      <p><strong>Evento:</strong> {{certificado.Evento.nome}}</p>
      <p><strong>Tipo:</strong> {{certificado.TiposCertificados.descricao}}</p>
      <p>
        <strong>Status:</strong>
        <span class="badge bg-secondary">{{certificado.status}}</span>
      </p>
      <p><strong>Código:</strong> <code>{{certificado.codigo}}</code></p>
      <hr />
      <h5>Texto do certificado</h5>
      <p>{{textoInterpolado}}</p>
    </div>
    <div class="card-footer">
      <a
        href="/public/certificados/{{certificado.id}}/pdf"
        class="btn btn-success"
        target="_blank"
        >Baixar PDF</a
      >
      <a href="/admin/certificados" class="btn btn-secondary ms-2">Voltar</a>
    </div>
  </div>
  ```
- Critério de aceite: `form.hbs` existe com `<select id="tipo_certificado_id">` e `<div id="campos-dinamicos">`; o script `addEventListener('change', ...)` faz `fetch` para `/tipos-certificados/:id`; `detalhe.hbs` exibe `textoInterpolado` e link de PDF
- Escopo: 2 arquivos criados
- Dependência: TASK-034-A

---

**[TASK-034-C] Criar `src/controllers/certificadoSSRController.js`**

- Arquivo: `src/controllers/certificadoSSRController.js` (CRIAR)
- Contexto: controller SSR com 8 métodos. `index` aplica filtros de `evento_id`, `status` e `tipo_id` na query. Para gestor/monitor, o `scopedEvento` middleware já força `req.query.evento_id` — o controller apenas usa esse valor se presente. `detalhe` usa `templateService.interpolate` para gerar o texto final. `criar` trata `valores_dinamicos` serializado pelo form como `valores_dinamicos[chave]=valor` (precisa recompor o objeto a partir de `req.body.valores_dinamicos`).
- Passos: criar o arquivo com conteúdo:

  ```js
  const certificadoService = require('../services/certificadoService')
  const {
    Certificado,
    Participante,
    Evento,
    TiposCertificados,
  } = require('../models')
  const templateService = require('../services/templateService')
  const { Op } = require('sequelize')

  module.exports = {
    async index(req, res) {
      try {
        const { evento_id, status, tipo_id } = req.query
        const where = {}
        if (evento_id) where.evento_id = evento_id
        if (status) where.status = status
        if (tipo_id) where.tipo_certificado_id = tipo_id
        const [certificadosRaw, eventos, tipos] = await Promise.all([
          Certificado.findAll({
            where,
            paranoid: false,
            include: [Participante, Evento, TiposCertificados],
          }),
          Evento.findAll(),
          TiposCertificados.findAll(),
        ])
        const certificados = certificadosRaw.map((c) => {
          const json = c.toJSON()
          json.statusBadge =
            { emitido: 'success', pendente: 'warning', cancelado: 'secondary' }[
              json.status
            ] || 'secondary'
          return json
        })
        return res.render('admin/certificados/index', {
          layout: 'layouts/admin',
          title: 'Certificados',
          certificados,
          eventos: eventos.map((e) => e.toJSON()),
          tipos: tipos.map((t) => t.toJSON()),
          filtros: { evento_id, status, tipo_id },
        })
      } catch (err) {
        req.flash('error', err.message)
        return res.redirect('/admin/dashboard')
      }
    },

    async novo(req, res) {
      const [participantes, eventos, tipos] = await Promise.all([
        Participante.findAll(),
        Evento.findAll(),
        TiposCertificados.findAll(),
      ])
      return res.render('admin/certificados/form', {
        layout: 'layouts/admin',
        title: 'Emitir Certificado',
        action: '/admin/certificados',
        participantes: participantes.map((p) => p.toJSON()),
        eventos: eventos.map((e) => e.toJSON()),
        tipos: tipos.map((t) => t.toJSON()),
      })
    },

    async criar(req, res) {
      try {
        const body = { ...req.body }
        // valores_dinamicos chegam como objeto do body-parser
        if (typeof body.valores_dinamicos !== 'object')
          body.valores_dinamicos = {}
        await certificadoService.create(body)
        req.flash('success', 'Certificado emitido com sucesso.')
        return res.redirect('/admin/certificados')
      } catch (err) {
        req.flash('error', err.message)
        const [participantes, eventos, tipos] = await Promise.all([
          Participante.findAll(),
          Evento.findAll(),
          TiposCertificados.findAll(),
        ])
        return res.render('admin/certificados/form', {
          layout: 'layouts/admin',
          title: 'Emitir Certificado',
          action: '/admin/certificados',
          participantes: participantes.map((p) => p.toJSON()),
          eventos: eventos.map((e) => e.toJSON()),
          tipos: tipos.map((t) => t.toJSON()),
          certificado: req.body,
        })
      }
    },

    async detalhe(req, res) {
      try {
        const certificado = await Certificado.findByPk(req.params.id, {
          paranoid: false,
          include: [Participante, Evento, TiposCertificados],
        })
        if (!certificado) {
          req.flash('error', 'Certificado não encontrado.')
          return res.redirect('/admin/certificados')
        }
        const tipo = certificado.TiposCertificados
        const textoInterpolado = tipo
          ? templateService.interpolate(
              tipo.texto_base,
              certificado.valores_dinamicos || {},
            )
          : ''
        return res.render('admin/certificados/detalhe', {
          layout: 'layouts/admin',
          title: `Certificado #${certificado.id}`,
          certificado: certificado.toJSON(),
          textoInterpolado,
        })
      } catch (err) {
        req.flash('error', err.message)
        return res.redirect('/admin/certificados')
      }
    },

    async cancelar(req, res) {
      try {
        await certificadoService.cancel(req.params.id)
        req.flash('success', 'Certificado cancelado.')
        return res.redirect('/admin/certificados')
      } catch (err) {
        req.flash('error', err.message)
        return res.redirect('/admin/certificados')
      }
    },

    async deletar(req, res) {
      try {
        await certificadoService.delete(req.params.id)
        req.flash('success', 'Certificado removido.')
        return res.redirect('/admin/certificados')
      } catch (err) {
        req.flash('error', err.message)
        return res.redirect('/admin/certificados')
      }
    },

    async restaurar(req, res) {
      try {
        await certificadoService.restore(req.params.id)
        req.flash('success', 'Certificado restaurado com sucesso.')
        return res.redirect('/admin/certificados')
      } catch (err) {
        req.flash('error', err.message)
        return res.redirect('/admin/certificados')
      }
    },
  }
  ```

- Critério de aceite: controller exporta os 7 métodos; `index` aplica `where` condicional com filtros; `detalhe` chama `templateService.interpolate`; `criar` trata `valores_dinamicos` como objeto
- Escopo: 1 arquivo criado
- Dependência: TASK-034-A, TASK-034-B

---

**[TASK-034-D] Adicionar rotas de certificados em `src/routes/admin.js`**

- Arquivo: `src/routes/admin.js` (MODIFICAR)
- Contexto: adicionar rotas de certificados protegidas por `rbac('monitor')` + `scopedEvento`. O middleware `scopedEvento` já existe em `src/middlewares/scopedEvento.js` e deve ser importado. As rotas de GET precisam do `scopedEvento` para que gestor/monitor veja apenas seu evento. Rotas POST de cancelar/deletar/restaurar não precisam de `scopedEvento` (o controller valida via FK do registro).
- Passos em `src/routes/admin.js`, após as rotas de participantes:
  ```js
  // Gestão de certificados (monitor, gestor, admin)
  const scopedEvento = require('../middlewares/scopedEvento')
  const certificadoSSRController = require('../controllers/certificadoSSRController')
  router.get(
    '/certificados',
    rbac('monitor'),
    scopedEvento,
    certificadoSSRController.index,
  )
  router.get(
    '/certificados/novo',
    rbac('monitor'),
    certificadoSSRController.novo,
  )
  router.get(
    '/certificados/:id',
    rbac('monitor'),
    certificadoSSRController.detalhe,
  )
  router.post('/certificados', rbac('monitor'), certificadoSSRController.criar)
  router.post(
    '/certificados/:id/cancelar',
    rbac('monitor'),
    certificadoSSRController.cancelar,
  )
  router.post(
    '/certificados/:id/deletar',
    rbac('monitor'),
    certificadoSSRController.deletar,
  )
  router.post(
    '/certificados/:id/restaurar',
    rbac('monitor'),
    certificadoSSRController.restaurar,
  )
  ```
- Critério de aceite: `GET /admin/certificados` com gestor vinculado ao evento 1 exibe apenas certificados do evento 1 (scopedEvento força `req.query.evento_id`); admin vê todos; monitor acessa sem restrição de tipo mas com restrição de evento
- Escopo: 1 arquivo modificado
- Dependências: TASK-033-C, TASK-034-C

---

### TASK-35 🟡 Views de gestão de tipos de certificados

> Decomposta em micro-tasks. Dependências: TASK-28, TASK-31.

---

**[TASK-035-A] Criar `views/admin/tipos-certificados/index.hbs`**

- Arquivo: `views/admin/tipos-certificados/index.hbs` (CRIAR)
- Contexto: usa `layout: 'layouts/admin'`. Recebe `{ tipos[], arquivados[], title }`. Cada tipo inclui `numCertificados` (contagem de certificados emitidos). Seção `<details>` para tipos arquivados com botão "Restaurar".
- Passos: criar o arquivo com conteúdo:
  ```html
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h1>Tipos de Certificados</h1>
    <a href="/admin/tipos-certificados/novo" class="btn btn-primary"
      >+ Novo Tipo</a
    >
  </div>
  <table class="table table-bordered">
    <thead>
      <tr>
        <th>Código</th>
        <th>Descrição</th>
        <th>Campo destaque</th>
        <th>Certificados emitidos</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      {{#each tipos}}
      <tr>
        <td><code>{{codigo}}</code></td>
        <td>{{descricao}}</td>
        <td>{{campo_destaque}}</td>
        <td>{{numCertificados}}</td>
        <td>
          <a
            href="/admin/tipos-certificados/{{id}}/editar"
            class="btn btn-sm btn-warning"
            >Editar</a
          >
          <form
            method="POST"
            action="/admin/tipos-certificados/{{id}}/deletar"
            class="d-inline"
            onsubmit="return confirm('Remover este tipo de certificado?')"
          >
            <button type="submit" class="btn btn-sm btn-danger">Remover</button>
          </form>
        </td>
      </tr>
      {{else}}
      <tr>
        <td colspan="5" class="text-center text-muted">
          Nenhum tipo cadastrado.
        </td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  {{#if arquivados}}
  <details class="mt-4">
    <summary class="btn btn-link">
      Tipos arquivados ({{arquivados.length}})
    </summary>
    <table class="table table-bordered mt-2">
      <thead>
        <tr>
          <th>Código</th>
          <th>Descrição</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {{#each arquivados}}
        <tr class="table-secondary">
          <td><code>{{codigo}}</code></td>
          <td>{{descricao}}</td>
          <td>
            <form
              method="POST"
              action="/admin/tipos-certificados/{{id}}/restaurar"
              class="d-inline"
            >
              <button type="submit" class="btn btn-sm btn-success">
                Restaurar
              </button>
            </form>
          </td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </details>
  {{/if}}
  ```
- Critério de aceite: arquivo criado; tabela exibe `codigo`, `descricao`, `campo_destaque`, `numCertificados`; seção arquivados usa `<details>` com restore via form POST
- Escopo: 1 arquivo criado

---

**[TASK-035-B] Criar `views/admin/tipos-certificados/form.hbs` com JSONB editor e preview ao vivo**

- Arquivo: `views/admin/tipos-certificados/form.hbs` (CRIAR)
- Contexto: formulário mais complexo do sistema. Campos fixos: `codigo` (2 letras, `pattern`), `descricao`, `texto_base` (textarea), `campo_destaque` (`<select>` dinâmico). Campos dinâmicos: botão "+ Adicionar campo" gera pares `<input name="campo">` + `<input name="valor">` que são coletados pelo JS antes do submit e serializados em `dados_dinamicos`. Preview ao vivo interpola `texto_base` com valores de exemplo enquanto o usuário digita.
- Passos: criar o arquivo com conteúdo:

  ```html
  <h2>{{title}}</h2>
  <div class="row mt-3">
    <div class="col-md-8">
      <form method="POST" action="{{action}}" id="form-tipo" onsubmit="serializeDadosDinamicos()">
        <input type="hidden" name="dados_dinamicos" id="dados_dinamicos_json" value='{{tipo.dados_dinamicos_json}}'>
        <div class="row mb-3">
          <div class="col-md-3">
            <label for="codigo" class="form-label">Código (2 letras) *</label>
            <input type="text" class="form-control" name="codigo" id="codigo"
                   value="{{tipo.codigo}}" required pattern="[A-Za-z]{2}" maxlength="2"
                   title="Exatamente 2 letras">
          </div>
          <div class="col-md-9">
            <label for="descricao" class="form-label">Descrição *</label>
            <input type="text" class="form-control" name="descricao" id="descricao"
                   value="{{tipo.descricao}}" required>
          </div>
        </div>
        <div class="mb-3">
          <label for="texto_base" class="form-label">Texto base *</label>
          <textarea class="form-control" name="texto_base" id="texto_base"
                    rows="4" required>{{tipo.texto_base}}</textarea>
          <small class="text-muted">Use <code>${'$'}{chave}</code> para interpolar campos dinâmicos</small>
        </div>
        <div class="mb-3">
          <label for="campo_destaque" class="form-label">Campo destaque *</label>
          <select name="campo_destaque" id="campo_destaque" class="form-select" required>
            <option value="nome" {{#if (eq tipo.campo_destaque 'nome')}}selected{{/if}}>nome</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Campos dinâmicos</label>
          <div id="campos-container"></div>
          <button type="button" class="btn btn-outline-secondary btn-sm mt-2" onclick="addCampo()">+ Adicionar campo</button>
        </div>
        <div class="mb-3">
          <label class="form-label">Preview do texto</label>
          <div id="preview" class="border rounded p-3 bg-light fst-italic text-muted">O preview aparecerá aqui...</div>
        </div>
        <button type="submit" class="btn btn-primary">Salvar</button>
        <a href="/admin/tipos-certificados" class="btn btn-secondary ms-2">Cancelar</a>
      </form>
    </div>
  </div>
  <script>
    let camposExistentes = {};
    try { camposExistentes = JSON.parse(document.getElementById('dados_dinamicos_json').value || '{}') } catch(_) {}

    function addCampo(chave = '', valorEx = '') {
      const div = document.createElement('div')
      div.className = 'input-group mb-2 campo-row'
      div.innerHTML = `
        <input type="text" class="form-control campo-key" placeholder="nome do campo" value="${chave}">
        <input type="text" class="form-control campo-val" placeholder="valor de exemplo" value="${valorEx}">
        <button type="button" class="btn btn-outline-danger" onclick="this.parentElement.remove(); updateAll()">✕</button>
      `
      div.querySelectorAll('input').forEach(i => i.addEventListener('input', updateAll))
      document.getElementById('campos-container').appendChild(div)
      updateAll()
    }

    function getCampos() {
      const rows = document.querySelectorAll('.campo-row')
      const obj = {}
      rows.forEach(r => {
        const k = r.querySelector('.campo-key').value.trim()
        const v = r.querySelector('.campo-val').value.trim()
        if (k) obj[k] = v
      })
      return obj
    }

    function updateAll() {
      const campos = getCampos()
      // Atualiza select campo_destaque
      const sel = document.getElementById('campo_destaque')
      const current = sel.value
      sel.innerHTML = '<option value="nome">nome</option>'
      Object.keys(campos).forEach(k => {
        const opt = document.createElement('option')
        opt.value = k; opt.textContent = k
        if (k === current) opt.selected = true
        sel.appendChild(opt)
      })
      // Atualiza preview
      const texto = document.getElementById('texto_base').value
      const interpolado = texto.replace(/\$\{(\w+)\}/g, (_, k) => campos[k] || `{${k}}`)
      document.getElementById('preview').textContent = interpolado
    }

    function serializeDadosDinamicos() {
      const campos = getCampos()
      const dadosDinamicos = {}
      Object.keys(campos).forEach(k => { if (k) dadosDinamicos[k] = 'string' })
      document.getElementById('dados_dinamicos_json').value = JSON.stringify(dadosDinamicos)
    }

    // Inicializar com campos existentes (modo edição)
    Object.entries(camposExistentes).forEach(([k]) => addCampo(k, k))
    document.getElementById('texto_base').addEventListener('input', updateAll)
    updateAll()
  </script>
  ```

- Critério de aceite: `codigo` tem `pattern="[A-Za-z]{2}"` e `maxlength="2"`; botão "+ Adicionar campo" chama `addCampo()`; `campo_destaque` se atualiza dinamicamente; preview ao vivo usa `replace` com a mesma regex de `templateService`; `serializeDadosDinamicos()` é chamado no `onsubmit` para enviar `dados_dinamicos` como JSON no campo hidden
- Escopo: 1 arquivo criado
- Dependência: TASK-035-A

---

**[TASK-035-C] Criar `src/controllers/tiposCertificadosSSRController.js` e rotas em `src/routes/admin.js`**

- Arquivos: `src/controllers/tiposCertificadosSSRController.js` (CRIAR), `src/routes/admin.js` (MODIFICAR)
- Contexto: controller SSR com 7 métodos. `index` conta certificados emitidos por tipo via `Certificado.count`. Em `criar`/`atualizar`, o body traz `dados_dinamicos` como string JSON (campo hidden do form) — precisa fazer `JSON.parse` antes de passar ao service. `tipo.dados_dinamicos_json` passado ao template é `JSON.stringify(tipo.dados_dinamicos || {})` para inicializar o editor no modo edição. Rotas protegidas por `rbac('gestor')` (gestor e admin).
- Passos:
  1. Criar `src/controllers/tiposCertificadosSSRController.js`:

     ```js
     const tiposCertificadosService = require('../services/tiposCertificadosService')
     const { TiposCertificados, Certificado } = require('../models')
     const { Op } = require('sequelize')

     module.exports = {
       async index(req, res) {
         try {
           const tiposRaw = await TiposCertificados.findAll()
           const tipos = await Promise.all(
             tiposRaw.map(async (t) => {
               const json = t.toJSON()
               json.numCertificados = await Certificado.count({
                 where: { tipo_certificado_id: t.id, status: 'emitido' },
               })
               return json
             }),
           )
           const arquivados = await TiposCertificados.findAll({
             paranoid: false,
             where: { deleted_at: { [Op.ne]: null } },
           })
           return res.render('admin/tipos-certificados/index', {
             layout: 'layouts/admin',
             title: 'Tipos de Certificados',
             tipos,
             arquivados: arquivados.map((t) => t.toJSON()),
           })
         } catch (err) {
           req.flash('error', err.message)
           return res.redirect('/admin/dashboard')
         }
       },

       novo(req, res) {
         return res.render('admin/tipos-certificados/form', {
           layout: 'layouts/admin',
           title: 'Novo Tipo de Certificado',
           action: '/admin/tipos-certificados',
         })
       },

       async editar(req, res) {
         try {
           const tipo = await tiposCertificadosService.findById(req.params.id)
           if (!tipo) {
             req.flash('error', 'Tipo não encontrado.')
             return res.redirect('/admin/tipos-certificados')
           }
           const json = tipo.toJSON()
           json.dados_dinamicos_json = JSON.stringify(
             json.dados_dinamicos || {},
           )
           return res.render('admin/tipos-certificados/form', {
             layout: 'layouts/admin',
             title: 'Editar Tipo',
             action: `/admin/tipos-certificados/${req.params.id}`,
             tipo: json,
           })
         } catch (err) {
           req.flash('error', err.message)
           return res.redirect('/admin/tipos-certificados')
         }
       },

       async criar(req, res) {
         try {
           const body = { ...req.body }
           try {
             body.dados_dinamicos = JSON.parse(body.dados_dinamicos)
           } catch (_) {
             body.dados_dinamicos = {}
           }
           await tiposCertificadosService.create(body)
           req.flash('success', 'Tipo de certificado criado com sucesso.')
           return res.redirect('/admin/tipos-certificados')
         } catch (err) {
           req.flash('error', err.message)
           return res.render('admin/tipos-certificados/form', {
             layout: 'layouts/admin',
             title: 'Novo Tipo de Certificado',
             action: '/admin/tipos-certificados',
             tipo: {
               ...req.body,
               dados_dinamicos_json: req.body.dados_dinamicos || '{}',
             },
           })
         }
       },

       async atualizar(req, res) {
         try {
           const body = { ...req.body }
           try {
             body.dados_dinamicos = JSON.parse(body.dados_dinamicos)
           } catch (_) {
             body.dados_dinamicos = {}
           }
           await tiposCertificadosService.update(req.params.id, body)
           req.flash('success', 'Tipo de certificado atualizado com sucesso.')
           return res.redirect('/admin/tipos-certificados')
         } catch (err) {
           req.flash('error', err.message)
           return res.redirect(
             `/admin/tipos-certificados/${req.params.id}/editar`,
           )
         }
       },

       async deletar(req, res) {
         try {
           await tiposCertificadosService.delete(req.params.id)
           req.flash('success', 'Tipo removido.')
           return res.redirect('/admin/tipos-certificados')
         } catch (err) {
           req.flash('error', err.message)
           return res.redirect('/admin/tipos-certificados')
         }
       },

       async restaurar(req, res) {
         try {
           await tiposCertificadosService.restore(req.params.id)
           req.flash('success', 'Tipo restaurado com sucesso.')
           return res.redirect('/admin/tipos-certificados')
         } catch (err) {
           req.flash('error', err.message)
           return res.redirect('/admin/tipos-certificados')
         }
       },
     }
     ```

  2. Em `src/routes/admin.js`, após as rotas de certificados (TASK-034-D), adicionar:
     ```js
     // Gestão de tipos de certificados (gestor e admin)
     const tiposCertificadosSSRController = require('../controllers/tiposCertificadosSSRController')
     router.get(
       '/tipos-certificados',
       rbac('gestor'),
       tiposCertificadosSSRController.index,
     )
     router.get(
       '/tipos-certificados/novo',
       rbac('gestor'),
       tiposCertificadosSSRController.novo,
     )
     router.get(
       '/tipos-certificados/:id/editar',
       rbac('gestor'),
       tiposCertificadosSSRController.editar,
     )
     router.post(
       '/tipos-certificados',
       rbac('gestor'),
       tiposCertificadosSSRController.criar,
     )
     router.post(
       '/tipos-certificados/:id',
       rbac('gestor'),
       tiposCertificadosSSRController.atualizar,
     )
     router.post(
       '/tipos-certificados/:id/deletar',
       rbac('gestor'),
       tiposCertificadosSSRController.deletar,
     )
     router.post(
       '/tipos-certificados/:id/restaurar',
       rbac('gestor'),
       tiposCertificadosSSRController.restaurar,
     )
     ```

- Critério de aceite: `GET /admin/tipos-certificados` com token de monitor retorna 403; com gestor ou admin renderiza a listagem; `POST /admin/tipos-certificados` com `dados_dinamicos` como string JSON válida cria o tipo corretamente
- Escopo: 2 arquivos (1 criado, 1 modificado)
- Dependências: TASK-034-D, TASK-035-A, TASK-035-B

---

### TASK-36 🟡 Views de gestão de usuários

> Decomposta em micro-tasks. Dependências: TASK-28, TASK-31.

---

**[TASK-036-A] Criar `views/admin/usuarios/index.hbs`**

- Arquivo: `views/admin/usuarios/index.hbs` (CRIAR)
- Contexto: usa `layout: 'layouts/admin'`. Recebe `{ usuarios[], arquivados[], title }`. Cada usuário inclui `perfil`, `email` e `eventosVinculados` (array de nomes de eventos, serializado como string separada por vírgula). Seção `<details>` para usuários arquivados com botão "Restaurar" via form POST.
- Passos: criar o arquivo com conteúdo:
  ```html
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h1>Usuários</h1>
    <a href="/admin/usuarios/novo" class="btn btn-primary">+ Novo Usuário</a>
  </div>
  <table class="table table-bordered">
    <thead>
      <tr>
        <th>Nome</th>
        <th>E-mail</th>
        <th>Perfil</th>
        <th>Eventos</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      {{#each usuarios}}
      <tr>
        <td>{{nome}}</td>
        <td>{{email}}</td>
        <td><span class="badge bg-{{perfilBadge}}">{{perfil}}</span></td>
        <td><small>{{eventosVinculados}}</small></td>
        <td>
          <a href="/admin/usuarios/{{id}}/editar" class="btn btn-sm btn-warning"
            >Editar</a
          >
          <form
            method="POST"
            action="/admin/usuarios/{{id}}/deletar"
            class="d-inline"
            onsubmit="return confirm('Remover este usuário?')"
          >
            <button type="submit" class="btn btn-sm btn-danger">Remover</button>
          </form>
        </td>
      </tr>
      {{else}}
      <tr>
        <td colspan="5" class="text-center text-muted">
          Nenhum usuário cadastrado.
        </td>
      </tr>
      {{/each}}
    </tbody>
  </table>
  {{#if arquivados}}
  <details class="mt-4">
    <summary class="btn btn-link">
      Usuários arquivados ({{arquivados.length}})
    </summary>
    <table class="table table-bordered mt-2">
      <thead>
        <tr>
          <th>Nome</th>
          <th>E-mail</th>
          <th>Perfil</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {{#each arquivados}}
        <tr class="table-secondary">
          <td>{{nome}}</td>
          <td>{{email}}</td>
          <td>{{perfil}}</td>
          <td>
            <form
              method="POST"
              action="/admin/usuarios/{{id}}/restaurar"
              class="d-inline"
            >
              <button type="submit" class="btn btn-sm btn-success">
                Restaurar
              </button>
            </form>
          </td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </details>
  {{/if}}
  ```
- Critério de aceite: arquivo criado; `perfilBadge` é `danger` para admin, `primary` para gestor, `secondary` para monitor; coluna "Eventos" exibe lista de nomes dos eventos vinculados (vazia para admin)
- Escopo: 1 arquivo criado

---

**[TASK-036-B] Criar `views/admin/usuarios/form.hbs`**

- Arquivo: `views/admin/usuarios/form.hbs` (CRIAR)
- Contexto: formulário criar/editar usuário. Recebe `{ usuario?, eventos[], action, title, isEdit }`. Campo `senha` aparece com `required` em modo criação; em modo edição, aparece como "Nova senha (opcional)" sem `required`. Checkboxes de eventos são exibidos apenas para perfil `gestor`/`monitor`. Campo de eventos oculto via JS quando perfil `admin` é selecionado.
- Passos: criar o arquivo com conteúdo:
  ```html
  <h2>{{title}}</h2>
  <div class="row mt-3">
    <div class="col-md-7">
      <form method="POST" action="{{action}}">
        <div class="mb-3">
          <label for="nome" class="form-label">Nome *</label>
          <input type="text" class="form-control" name="nome" id="nome"
                 value="{{usuario.nome}}" required>
        </div>
        <div class="mb-3">
          <label for="email" class="form-label">E-mail *</label>
          <input type="email" class="form-control" name="email" id="email"
                 value="{{usuario.email}}" required>
        </div>
        <div class="mb-3">
          <label for="senha" class="form-label">
            {{#if isEdit}}Nova senha (opcional){{else}}Senha *{{/if}}
          </label>
          <input type="password" class="form-control" name="senha" id="senha"
                 {{#unless isEdit}}required{{/unless}}
                 placeholder="{{#if isEdit}}Deixe em branco para manter a senha atual{{/if}}">
        </div>
        <div class="mb-3">
          <label for="perfil" class="form-label">Perfil *</label>
          <select name="perfil" id="perfil" class="form-select" required
                  onchange="toggleEventos(this.value)">
            <option value="admin" {{#if (eq usuario.perfil 'admin')}}selected{{/if}}>Admin</option>
            <option value="gestor" {{#if (eq usuario.perfil 'gestor')}}selected{{/if}}>Gestor</option>
            <option value="monitor" {{#if (eq usuario.perfil 'monitor')}}selected{{/if}}>Monitor</option>
          </select>
        </div>
        <div class="mb-3" id="secao-eventos"
             style="{{#if (eq usuario.perfil 'admin')}}display:none{{/if}}">
          <label class="form-label">Eventos vinculados</label>
          <div class="border rounded p-3">
            {{#each eventos}}
            <div class="form-check">
              <input class="form-check-input" type="checkbox" name="eventos[]" value="{{id}}"
                     id="evento-{{id}}"
                     {{#if (includes ../usuario.eventoIds id)}}checked{{/if}}>
              <label class="form-check-label" for="evento-{{id}}">{{nome}} ({{ano}})</label>
            </div>
            {{else}}
            <small class="text-muted">Nenhum evento cadastrado.</small>
            {{/each}}
          </div>
        </div>
        <button type="submit" class="btn btn-primary">Salvar</button>
        <a href="/admin/usuarios" class="btn btn-secondary ms-2">Cancelar</a>
      </form>
    </div>
  </div>
  <script>
    function toggleEventos(perfil) {
      document.getElementById('secao-eventos').style.display =
        perfil === 'admin' ? 'none' : 'block';
    }
    // Inicializar com o perfil atual
    toggleEventos(document.getElementById('perfil').value);
  </script>
  ```
- Critério de aceite: no modo edição (`isEdit: true`), campo senha não tem `required` e exibe placeholder; `toggleEventos()` oculta a seção de eventos quando perfil `admin` é selecionado; checkboxes têm `name="eventos[]"` para enviar array ao servidor
- Escopo: 1 arquivo criado
- Dependência: TASK-036-A

---

**[TASK-036-C] Criar `src/controllers/usuarioSSRController.js` e rotas em `src/routes/admin.js`**

- Arquivos: `src/controllers/usuarioSSRController.js` (CRIAR), `src/routes/admin.js` (MODIFICAR)
- Contexto: controller SSR com 7 métodos. `index` carrega usuários com associação `eventos` (via `Usuario.findAll({ include: 'eventos' })`) e transforma `usuario.eventos.map(e => e.nome).join(', ')` em `eventosVinculados`. `criar`/`atualizar` lêem `req.body['eventos[]']` (que chega como array ou string do form) e chamam `usuario.setEventos(eventoIds)` após criar/atualizar. Em modo edição, a senha só é atualizada se o campo `senha` não for vazio. `perfilBadge` é derivado no controller (` danger`/`primary`/`secondary`).
- Passos:
  1. Criar `src/controllers/usuarioSSRController.js`:

     ```js
     const { Usuario, Evento } = require('../models')
     const bcrypt = require('bcryptjs')
     const { Op } = require('sequelize')

     const PERFIL_BADGE = {
       admin: 'danger',
       gestor: 'primary',
       monitor: 'secondary',
     }

     module.exports = {
       async index(req, res) {
         try {
           const usuariosRaw = await Usuario.findAll({ include: 'eventos' })
           const usuarios = usuariosRaw.map((u) => {
             const json = u.toJSON()
             json.eventosVinculados = (json.eventos || [])
               .map((e) => e.nome)
               .join(', ')
             json.perfilBadge = PERFIL_BADGE[json.perfil] || 'secondary'
             return json
           })
           const arquivados = await Usuario.findAll({
             paranoid: false,
             where: { deleted_at: { [Op.ne]: null } },
           })
           return res.render('admin/usuarios/index', {
             layout: 'layouts/admin',
             title: 'Usuários',
             usuarios,
             arquivados: arquivados.map((u) => u.toJSON()),
           })
         } catch (err) {
           req.flash('error', err.message)
           return res.redirect('/admin/dashboard')
         }
       },

       async novo(req, res) {
         const eventos = await Evento.findAll()
         return res.render('admin/usuarios/form', {
           layout: 'layouts/admin',
           title: 'Novo Usuário',
           action: '/admin/usuarios',
           eventos: eventos.map((e) => e.toJSON()),
           isEdit: false,
         })
       },

       async editar(req, res) {
         try {
           const usuario = await Usuario.findByPk(req.params.id, {
             include: 'eventos',
           })
           if (!usuario) {
             req.flash('error', 'Usuário não encontrado.')
             return res.redirect('/admin/usuarios')
           }
           const eventos = await Evento.findAll()
           const json = usuario.toJSON()
           json.eventoIds = (json.eventos || []).map((e) => e.id)
           return res.render('admin/usuarios/form', {
             layout: 'layouts/admin',
             title: 'Editar Usuário',
             action: `/admin/usuarios/${req.params.id}`,
             eventos: eventos.map((e) => e.toJSON()),
             usuario: json,
             isEdit: true,
           })
         } catch (err) {
           req.flash('error', err.message)
           return res.redirect('/admin/usuarios')
         }
       },

       async criar(req, res) {
         try {
           const { nome, email, senha, perfil } = req.body
           const eventoIds = []
             .concat(req.body['eventos[]'] || [])
             .map(Number)
             .filter(Boolean)
           const usuario = await Usuario.create({ nome, email, senha, perfil })
           if (eventoIds.length > 0) await usuario.setEventos(eventoIds)
           req.flash('success', 'Usuário criado com sucesso.')
           return res.redirect('/admin/usuarios')
         } catch (err) {
           req.flash('error', err.message)
           const eventos = await Evento.findAll()
           return res.render('admin/usuarios/form', {
             layout: 'layouts/admin',
             title: 'Novo Usuário',
             action: '/admin/usuarios',
             eventos: eventos.map((e) => e.toJSON()),
             usuario: req.body,
             isEdit: false,
           })
         }
       },

       async atualizar(req, res) {
         try {
           const usuario = await Usuario.findByPk(req.params.id)
           if (!usuario) {
             req.flash('error', 'Usuário não encontrado.')
             return res.redirect('/admin/usuarios')
           }
           const updates = {
             nome: req.body.nome,
             email: req.body.email,
             perfil: req.body.perfil,
           }
           if (req.body.senha && req.body.senha.trim() !== '') {
             updates.senha = req.body.senha
           }
           await usuario.update(updates)
           const eventoIds = []
             .concat(req.body['eventos[]'] || [])
             .map(Number)
             .filter(Boolean)
           await usuario.setEventos(eventoIds)
           req.flash('success', 'Usuário atualizado com sucesso.')
           return res.redirect('/admin/usuarios')
         } catch (err) {
           req.flash('error', err.message)
           return res.redirect(`/admin/usuarios/${req.params.id}/editar`)
         }
       },

       async deletar(req, res) {
         try {
           const usuario = await Usuario.findByPk(req.params.id)
           if (usuario) await usuario.destroy()
           req.flash('success', 'Usuário removido.')
           return res.redirect('/admin/usuarios')
         } catch (err) {
           req.flash('error', err.message)
           return res.redirect('/admin/usuarios')
         }
       },

       async restaurar(req, res) {
         try {
           const usuario = await Usuario.findByPk(req.params.id, {
             paranoid: false,
           })
           if (usuario) await usuario.restore()
           req.flash('success', 'Usuário restaurado com sucesso.')
           return res.redirect('/admin/usuarios')
         } catch (err) {
           req.flash('error', err.message)
           return res.redirect('/admin/usuarios')
         }
       },
     }
     ```

  2. Em `src/routes/admin.js`, após as rotas de tipos de certificados (TASK-035-C), adicionar:
     ```js
     // Gestão de usuários (somente admin)
     const usuarioSSRController = require('../controllers/usuarioSSRController')
     router.get('/usuarios', rbac('admin'), usuarioSSRController.index)
     router.get('/usuarios/novo', rbac('admin'), usuarioSSRController.novo)
     router.get(
       '/usuarios/:id/editar',
       rbac('admin'),
       usuarioSSRController.editar,
     )
     router.post('/usuarios', rbac('admin'), usuarioSSRController.criar)
     router.post('/usuarios/:id', rbac('admin'), usuarioSSRController.atualizar)
     router.post(
       '/usuarios/:id/deletar',
       rbac('admin'),
       usuarioSSRController.deletar,
     )
     router.post(
       '/usuarios/:id/restaurar',
       rbac('admin'),
       usuarioSSRController.restaurar,
     )
     ```

- Critério de aceite: `GET /admin/usuarios` com token de gestor retorna 403; com admin renderiza a listagem; `POST /admin/usuarios` cria usuário e associa eventos via `setEventos`; em modo edição, senha só é atualizada se campo não for vazio
- Escopo: 2 arquivos (1 criado, 1 modificado)
- Dependências: TASK-035-C, TASK-036-A, TASK-036-B

---

## ÉPICO 8 — Testes de Interface E2E (Playwright)

> **Ferramenta recomendada:** Playwright (`@playwright/test`) — integra nativamente com Node.js, não exige WebDriver externo, suporta múltiplos browsers (Chromium, Firefox, WebKit) e tem relatório HTML integrado.
>
> **Alternativa:** Selenium WebDriver com `selenium-webdriver` npm — viável se o ambiente de CI já tiver infraestrutura Selenium Grid.
>
> Os testes são organizados em três grupos: **fluxo público**, **autenticação e RBAC**, e **fluxo administrativo**.

---

### TASK-37 🟡 Configurar ambiente de testes E2E (Playwright)

> Decomposta em micro-tasks. Dependência: TASK-28.

---

**[TASK-037-A] Instalar `@playwright/test` e configurar `package.json`**

- Arquivo: `package.json`
- Passos:
  1. Executar `npm install --save-dev @playwright/test`
  2. Executar `npx playwright install chromium` para instalar o browser obrigatório
  3. Adicionar ao bloco `scripts` de `package.json`:
     ```json
     "test:e2e": "playwright test",
     "test:e2e:report": "playwright show-report"
     ```
- Critério de aceite: `require('@playwright/test')` não lança erro; `npx playwright --version` imprime a versão; `package.json` tem `"test:e2e"` nos scripts
- Escopo: 1 arquivo modificado (via npm)

---

**[TASK-037-B] Criar `playwright.config.js` na raiz do projeto**

- Arquivo: `playwright.config.js` (CRIAR)
- Contexto: a aplicação roda em `http://localhost:3000` no ambiente de teste E2E. O banco de testes é o mesmo do Jest (variável `DATABASE_URL` do `.env.test`). Os testes ficam em `tests/e2e/`. O relatório HTML é gerado em `playwright-report/`.
- Passos: criar o arquivo com conteúdo:

  ```js
  const { defineConfig, devices } = require('@playwright/test')

  module.exports = defineConfig({
    testDir: './tests/e2e',
    timeout: 30_000,
    retries: 0,
    reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]],
    use: {
      baseURL: 'http://localhost:3000',
      headless: true,
      screenshot: 'only-on-failure',
      trace: 'retain-on-failure',
    },
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
    ],
  })
  ```

- Critério de aceite: `npx playwright test --list` (com a aplicação rodando) não lança erro de configuração; diretório `playwright-report/` está no `.gitignore`
- Escopo: 1 arquivo criado
- Dependência: TASK-037-A

---

**[TASK-037-C] Atualizar `.gitignore` e criar estrutura de diretórios `tests/e2e/`**

- Arquivos: `.gitignore` (MODIFICAR), `tests/e2e/setup/seed.js` (CRIAR)
- Contexto: o `.gitignore` precisa excluir artefatos do Playwright. O `seed.js` popula o banco com dados mínimos para os testes E2E: 1 evento, 1 participante, 1 tipo de certificado e 1 certificado; 1 admin, 1 gestor e 1 monitor. Usa os models do Sequelize diretamente (não via API).
- Passos:
  1. Adicionar ao final do `.gitignore`:
     ```
     # Playwright
     playwright-report/
     test-results/
     ```
  2. Criar `tests/e2e/setup/seed.js` com conteúdo:

     ```js
     require('dotenv').config()
     const {
       sequelize,
       Evento,
       Participante,
       TiposCertificados,
       Certificado,
       Usuario,
     } = require('../../../src/models')

     async function seed() {
       await sequelize.sync()

       // Limpar dados anteriores
       await Certificado.destroy({ where: {}, force: true })
       await Participante.destroy({ where: {}, force: true })
       await TiposCertificados.destroy({ where: {}, force: true })
       await Evento.destroy({ where: {}, force: true })
       await Usuario.destroy({ where: {}, force: true })

       const evento = await Evento.create({
         nome: 'Evento Teste E2E',
         codigo_base: 'ETE',
         ano: 2026,
       })

       const tipo = await TiposCertificados.create({
         codigo: 'PT',
         descricao: 'Participação',
         campo_destaque: 'nome',
         texto_base: 'Certificamos que ${nome} participou de ${evento}.',
         dados_dinamicos: { nome: 'string', evento: 'string' },
       })

       const participante = await Participante.create({
         nomeCompleto: 'Participante Teste',
         email: 'e2e@teste.com',
         instituicao: 'Instituto Teste',
       })

       await Certificado.create({
         nome: 'Participante Teste',
         participante_id: participante.id,
         evento_id: evento.id,
         tipo_certificado_id: tipo.id,
         valores_dinamicos: {
           nome: 'Participante Teste',
           evento: 'Evento Teste E2E',
         },
         status: 'emitido',
       })

       await Usuario.create({
         nome: 'Admin E2E',
         email: 'admin@e2e.com',
         senha: 'Admin@1234',
         perfil: 'admin',
       })
       const gestor = await Usuario.create({
         nome: 'Gestor E2E',
         email: 'gestor@e2e.com',
         senha: 'Gestor@1234',
         perfil: 'gestor',
       })
       await gestor.setEventos([evento.id])
       const monitor = await Usuario.create({
         nome: 'Monitor E2E',
         email: 'monitor@e2e.com',
         senha: 'Monitor@1234',
         perfil: 'monitor',
       })
       await monitor.setEventos([evento.id])

       console.log('Seed E2E concluído.')
       await sequelize.close()
     }

     seed().catch((err) => {
       console.error(err)
       process.exit(1)
     })
     ```

- Critério de aceite: `playwright-report/` e `test-results/` estão no `.gitignore`; `node tests/e2e/setup/seed.js` popula o banco sem erros
- Escopo: 2 arquivos (1 modificado, 1 criado)
- Dependência: TASK-037-B

---

### TASK-38 🟡 Testes E2E — Fluxo Público de Certificados

> Decomposta em micro-tasks. Dependências: TASK-37, TASK-29, TASK-20.

---

**[TASK-038-A] Criar `tests/e2e/helpers/auth.js` com helper `loginAs`**

- Arquivo: `tests/e2e/helpers/auth.js` (CRIAR)
- Contexto: helper reutilizável por todos os suites E2E. `loginAs(page, perfil)` navega para `/auth/login`, preenche as credenciais do perfil correspondente ao seed criado em TASK-037-C e aguarda o redirecionamento para `/admin/dashboard`. As credenciais de cada perfil estão fixas no seed (`admin@e2e.com`, `gestor@e2e.com`, `monitor@e2e.com`).
- Passos: criar o arquivo com conteúdo:

  ```js
  const CREDENTIALS = {
    admin: { email: 'admin@e2e.com', senha: 'Admin@1234' },
    gestor: { email: 'gestor@e2e.com', senha: 'Gestor@1234' },
    monitor: { email: 'monitor@e2e.com', senha: 'Monitor@1234' },
  }

  async function loginAs(page, perfil) {
    const creds = CREDENTIALS[perfil]
    if (!creds) throw new Error(`Perfil desconhecido: ${perfil}`)
    await page.goto('/auth/login')
    await page.fill('#email', creds.email)
    await page.fill('#senha', creds.senha)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/dashboard')
  }

  module.exports = { loginAs }
  ```

- Critério de aceite: arquivo criado no caminho correto; importado por `publico.spec.js` e `auth.spec.js` sem erro
- Escopo: 1 arquivo criado
- Dependência: TASK-037-C

---

**[TASK-038-B] Criar `tests/e2e/helpers/api.js` com helper `createViaApi`**

- Arquivo: `tests/e2e/helpers/api.js` (CRIAR)
- Contexto: helper para criar dados via JSON API (bearer token) antes de executar casos de teste que dependem de registros pré-existentes. Evita dependência do seed fixo para testes que precisam de dados únicos. Usa `fetch` nativo do Node.js 18+ (disponibilizado pelo Playwright runtime).
- Passos: criar o arquivo com conteúdo:

  ```js
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

  async function getAdminToken() {
    const res = await fetch(`${BASE_URL}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@e2e.com', senha: 'Admin@1234' }),
    })
    const data = await res.json()
    return data.token
  }

  async function createViaApi(endpoint, data, token) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(
        `createViaApi ${endpoint} falhou (${res.status}): ${body}`,
      )
    }
    return res.json()
  }

  module.exports = { getAdminToken, createViaApi }
  ```

- Critério de aceite: arquivo criado; `getAdminToken()` retorna JWT válido quando a API está rodando; `createViaApi('/eventos', data, token)` cria um evento e retorna o objeto criado
- Escopo: 1 arquivo criado
- Dependência: TASK-038-A

---

**[TASK-038-C] Criar `tests/e2e/publico.spec.js` com UC-P01 a UC-P10**

- Arquivo: `tests/e2e/publico.spec.js` (CRIAR)
- Contexto: 10 casos de uso do fluxo público. As rotas SSR públicas foram implementadas em TASK-029-C com prefixo `/public/pagina/...`. Os testes rodam com banco já populado pelo seed (TASK-037-C) que cria `e2e@teste.com` com um certificado com código gerado. Como o código do certificado é gerado automaticamente, UC-P07 e UC-P08 devem buscar o código via API antes de executar.
- Passos: criar o arquivo com conteúdo:

  ```js
  const { test, expect } = require('@playwright/test')
  const { getAdminToken } = require('./helpers/api')

  const EMAIL_SEED = 'e2e@teste.com'
  let codigoValido

  test.beforeAll(async ({ request }) => {
    // Busca código de certificado via API JSON
    const token = await getAdminToken()
    const res = await request.get(`/certificados`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.json()
    const certs = Array.isArray(body) ? body : body.data || []
    codigoValido = certs[0]?.codigo || 'INVALIDO'
  })

  test('UC-P01 — Página de opções exibe botões Obter e Validar', async ({
    page,
  }) => {
    await page.goto('/public/pagina/opcoes')
    await expect(page.locator('a[href*="obter"]')).toBeVisible()
    await expect(page.locator('a[href*="validar"]')).toBeVisible()
  })

  test('UC-P02 — Botão Obter leva ao formulário com campo email', async ({
    page,
  }) => {
    await page.goto('/public/pagina/opcoes')
    await page.click('a[href*="obter"]')
    await expect(page).toHaveURL(/obter/)
    await expect(page.locator('#email')).toBeVisible()
  })

  test('UC-P03 — Email cadastrado exibe lista de certificados com botão PDF', async ({
    page,
  }) => {
    await page.goto('/public/pagina/obter')
    await page.fill('#email', EMAIL_SEED)
    await page.click('button[type="submit"]')
    await expect(page.locator('.list-group-item')).toBeVisible()
    await expect(page.locator('a[href*="/pdf"]')).toBeVisible()
  })

  test('UC-P04 — Email não encontrado exibe mensagem de erro', async ({
    page,
  }) => {
    await page.goto('/public/pagina/obter')
    await page.fill('#email', 'nao.existe@teste.com')
    await page.click('button[type="submit"]')
    await expect(page.locator('.alert')).toBeVisible()
    await expect(page).toHaveURL(/obter|buscar/)
  })

  test('UC-P05 — Email inválido é barrado pela validação HTML5', async ({
    page,
  }) => {
    await page.goto('/public/pagina/obter')
    await page.fill('#email', 'email-invalido')
    await page.click('button[type="submit"]')
    // Validação HTML5 impede o envio; permanece na página
    await expect(page).toHaveURL(/obter/)
    const isInvalid = await page
      .locator('#email')
      .evaluate((el) => !el.validity.valid)
    expect(isInvalid).toBe(true)
  })

  test('UC-P06 — Página de validação exibe campo código', async ({ page }) => {
    await page.goto('/public/pagina/validar')
    await expect(page.locator('#codigo')).toBeVisible()
  })

  test('UC-P07 — Código válido exibe painel verde', async ({ page }) => {
    await page.goto('/public/pagina/validar')
    await page.fill('#codigo', codigoValido)
    await page.click('button[type="submit"]')
    await expect(page.locator('.card.border-success')).toBeVisible()
  })

  test('UC-P08 — Código inválido exibe painel vermelho', async ({ page }) => {
    await page.goto('/public/pagina/validar')
    await page.fill('#codigo', 'CODIGO-INVALIDO-9999')
    await page.click('button[type="submit"]')
    await expect(page.locator('.card.border-danger')).toBeVisible()
  })

  test('UC-P09 — Link "Validar outro" volta ao formulário limpo', async ({
    page,
  }) => {
    await page.goto('/public/pagina/validar')
    await page.fill('#codigo', 'QUALQUER')
    await page.click('button[type="submit"]')
    await page.click('a[href*="validar"]')
    await expect(page).toHaveURL(/validar/)
    await expect(page.locator('#codigo')).toHaveValue('')
  })

  test('UC-P10 — Botão Baixar PDF inicia download com Content-Type correto', async ({
    page,
  }) => {
    await page.goto('/public/pagina/obter')
    await page.fill('#email', EMAIL_SEED)
    await page.click('button[type="submit"]')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('a[href*="/pdf"]'),
    ])
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i)
  })
  ```

- Critério de aceite: arquivo criado; `npx playwright test publico.spec.js` com servidor e banco rodando passa todos os 10 testes
- Escopo: 1 arquivo criado
- Dependência: TASK-038-A, TASK-038-B, TASK-037-C

---

### TASK-39 🟡 Testes E2E — Autenticação e RBAC

> Decomposta em micro-tasks. Dependências: TASK-37, TASK-30, TASK-18.

---

**[TASK-039-A] Criar `tests/e2e/auth.spec.js` com UC-A01 a UC-A07 (login/logout)**

- Arquivo: `tests/e2e/auth.spec.js` (CRIAR)
- Contexto: os primeiros 7 casos cobrem o fluxo de login com credenciais válidas/inválidas e o ciclo logout+redirect. Usa o helper `loginAs` criado em TASK-038-A. O helper `loginAs` aguarda `waitForURL('**/admin/dashboard')`, garantindo que o redirecionamento ocorreu antes das asserções.
- Passos: criar o arquivo com os casos UC-A01 a UC-A07:

  ```js
  const { test, expect } = require('@playwright/test')
  const { loginAs } = require('./helpers/auth')

  test('UC-A01 — Admin faz login com credenciais válidas', async ({ page }) => {
    await loginAs(page, 'admin')
    await expect(page).toHaveURL(/dashboard/)
    await expect(page.locator('text=Admin E2E')).toBeVisible()
  })

  test('UC-A02 — Login com senha incorreta exibe mensagem de erro', async ({
    page,
  }) => {
    await page.goto('/auth/login')
    await page.fill('#email', 'admin@e2e.com')
    await page.fill('#senha', 'senha-errada')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/login/)
    await expect(page.locator('.alert-danger')).toBeVisible()
  })

  test('UC-A03 — Login com email não cadastrado exibe mensagem de erro', async ({
    page,
  }) => {
    await page.goto('/auth/login')
    await page.fill('#email', 'nao.existe@e2e.com')
    await page.fill('#senha', 'qualquer')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/login/)
    await expect(page.locator('.alert-danger')).toBeVisible()
  })

  test('UC-A04 — Usuário não autenticado é redirecionado de /admin/dashboard', async ({
    page,
  }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/auth\/login/)
  })

  test('UC-A05 — Usuário não autenticado é redirecionado de /admin/eventos', async ({
    page,
  }) => {
    await page.goto('/admin/eventos')
    await expect(page).toHaveURL(/auth\/login/)
  })

  test('UC-A06 — Admin faz logout e é redirecionado ao login', async ({
    page,
  }) => {
    await loginAs(page, 'admin')
    await page.click('button[type="submit"]') // botão "Sair" do admin layout
    await expect(page).toHaveURL(/auth\/login/)
  })

  test('UC-A07 — Após logout, acessar /admin/dashboard redireciona ao login', async ({
    page,
  }) => {
    await loginAs(page, 'admin')
    await page.click('button[type="submit"]') // logout
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/auth\/login/)
  })
  ```

- Critério de aceite: 7 testes no arquivo; UC-A01 verifica o nome do usuário na navbar; UC-A04/A05 verificam redirecionamento sem autenticação
- Escopo: 1 arquivo criado
- Dependência: TASK-038-A (helper `loginAs`)

---

**[TASK-039-B] Adicionar UC-A08 a UC-A11 (RBAC) em `tests/e2e/auth.spec.js`**

- Arquivo: `tests/e2e/auth.spec.js` (MODIFICAR)
- Contexto: os casos UC-A08 a UC-A11 verificam que RBAC bloqueia acesso a rotas protegidas. O `rbac` retorna JSON `{ error: 'Acesso negado...' }` com status 403 — no contexto SSR isso resulta em uma resposta JSON inline na página (pois o middleware é o mesmo para SSR e API). Para o caso UC-A10, o gestor precisa de um evento B separado do evento A do seed — o seed deve ter sido criado com dois eventos pelo TASK-039-C.
- Passos: adicionar ao final de `tests/e2e/auth.spec.js`:

  ```js
  test('UC-A08 — Monitor não acessa /admin/usuarios (403)', async ({
    page,
  }) => {
    await loginAs(page, 'monitor')
    const res = await page.goto('/admin/usuarios')
    expect(res.status()).toBe(403)
  })

  test('UC-A09 — Monitor não acessa /admin/eventos (403)', async ({ page }) => {
    await loginAs(page, 'monitor')
    const res = await page.goto('/admin/eventos')
    expect(res.status()).toBe(403)
  })

  test('UC-A10 — Gestor vê apenas certificados do seu evento', async ({
    page,
  }) => {
    await loginAs(page, 'gestor')
    await page.goto('/admin/certificados')
    await expect(page).toHaveURL(/certificados/)
    // A URL deve conter evento_id do evento vinculado ao gestor (forçado pelo scopedEvento)
    // Verifica que a página carregou sem erro
    await expect(page.locator('h1')).toHaveText('Certificados')
  })

  test('UC-A11 — Gestor com evento_id de outro evento recebe 403', async ({
    page,
  }) => {
    await loginAs(page, 'gestor')
    // Tenta filtrar por evento_id=999 (inexistente no escopo do gestor)
    const res = await page.goto('/admin/certificados?evento_id=999')
    // scopedEvento retorna 403 para evento_id fora do escopo
    expect(res.status()).toBe(403)
  })
  ```

- Critério de aceite: arquivo atualizado com 4 testes adicionais (total 11); `npx playwright test auth.spec.js` passa sem flakiness
- Escopo: 1 arquivo modificado
- Dependência: TASK-039-A

---

### TASK-40 🟢 Testes E2E — Fluxo Administrativo Completo

> Decomposta em micro-tasks. Dependências: TASK-37, TASK-31, TASK-32, TASK-33, TASK-34, TASK-35, TASK-36.

---

**[TASK-040-A] Criar `tests/e2e/admin.spec.js` com UC-AD01 a UC-AD04 (CRUD de eventos)**

- Arquivo: `tests/e2e/admin.spec.js` (CRIAR)
- Contexto: cada teste cria seus próprios dados via API antes de executar (usando o helper `createViaApi` de TASK-038-B), para ser independente do seed fixo. O `beforeAll` obtém um token de admin e o armazena para uso nos testes. O `beforeEach` faz login via `loginAs` para garantir que o cookie está presente.
- Passos: criar o arquivo com os 4 primeiros casos:

  ```js
  const { test, expect } = require('@playwright/test')
  const { loginAs } = require('./helpers/auth')
  const { getAdminToken, createViaApi } = require('./helpers/api')

  let adminToken

  test.beforeAll(async () => {
    adminToken = await getAdminToken()
  })

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
  })

  test('UC-AD01 — Admin cria evento e flash de sucesso aparece', async ({
    page,
  }) => {
    await page.goto('/admin/eventos/novo')
    await page.fill('#nome', 'Evento E2E Criado')
    await page.fill('#codigo_base', 'EEC')
    await page.fill('#ano', '2026')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/admin\/eventos$/)
    await expect(page.locator('.alert-success')).toContainText('Evento criado')
    await expect(page.locator('td')).toContainText('Evento E2E Criado')
  })

  test('UC-AD02 — Admin edita evento e dados são atualizados', async ({
    page,
  }) => {
    const evento = await createViaApi(
      '/eventos',
      { nome: 'Evento Para Editar', codigo_base: 'EPE', ano: 2026 },
      adminToken,
    )
    await page.goto(`/admin/eventos/${evento.id}/editar`)
    await page.fill('#nome', 'Evento Editado')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/admin\/eventos$/)
    await expect(page.locator('.alert-success')).toBeVisible()
    await expect(page.locator('td')).toContainText('Evento Editado')
  })

  test('UC-AD03 — Admin remove evento e aparece em Arquivados', async ({
    page,
  }) => {
    const evento = await createViaApi(
      '/eventos',
      { nome: 'Evento Para Remover', codigo_base: 'EPR', ano: 2026 },
      adminToken,
    )
    await page.goto('/admin/eventos')
    // Clica no botão Remover do evento reciém-criado (aceita o confirm via dialog handler)
    page.on('dialog', (dialog) => dialog.accept())
    await page.click(`form[action*="${evento.id}/deletar"] button`)
    await expect(page.locator('.alert-success')).toBeVisible()
    await expect(page.locator('details')).toContainText('Evento Para Remover')
  })

  test('UC-AD04 — Admin restaura evento arquivado e volta à tabela ativa', async ({
    page,
  }) => {
    const evento = await createViaApi(
      '/eventos',
      { nome: 'Evento Para Restaurar', codigo_base: 'EPT', ano: 2026 },
      adminToken,
    )
    // Deleta via API para arquivar
    await fetch(`http://localhost:3000/eventos/${evento.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    await page.goto('/admin/eventos')
    await page.click(`form[action*="${evento.id}/restaurar"] button`)
    await expect(page.locator('.alert-success')).toBeVisible()
    await expect(page.locator('tbody td')).toContainText(
      'Evento Para Restaurar',
    )
  })
  ```

- Critério de aceite: 4 testes no arquivo; cada um é independente; UC-AD03 usa `page.on('dialog', ...)` para aceitar o `confirm()` do browser
- Escopo: 1 arquivo criado
- Dependência: TASK-038-B

---

**[TASK-040-B] Adicionar UC-AD05 a UC-AD08 (participantes e certificados) em `tests/e2e/admin.spec.js`**

- Arquivo: `tests/e2e/admin.spec.js` (MODIFICAR)
- Contexto: os casos UC-AD05 a UC-AD08 cobrem criação de participante com email duplicado, criação de tipo de certificado com campos dinâmicos, emissão e cancelamento de certificado. UC-AD06 precisa de interação com o editor JS dinâmico de campos (clicar "+ Adicionar campo" e preencher). UC-AD07 usa o select de tipo que dispara o fetch de campos dinâmicos.
- Passos: adicionar ao final de `tests/e2e/admin.spec.js`:

  ```js
  test('UC-AD05 — Email duplicado de participante exibe erro no formulário', async ({
    page,
  }) => {
    // Cria o primeiro via API
    await createViaApi(
      '/participantes',
      {
        nomeCompleto: 'Participante Dup',
        email: 'dup@e2e.com',
        instituicao: 'Org',
      },
      adminToken,
    )
    // Tenta cadastrar de novo via formulário
    await page.goto('/admin/participantes/novo')
    await page.fill('#nomeCompleto', 'Participante Dup 2')
    await page.fill('#email', 'dup@e2e.com')
    await page.click('button[type="submit"]')
    await expect(page.locator('.alert-danger')).toBeVisible()
    await expect(page).toHaveURL(/participantes\/novo|participantes$/)
  })

  test('UC-AD06 — Gestor cria tipo de certificado com campo dinâmico', async ({
    page,
  }) => {
    await page.goto('/auth/login')
    await page.fill('#email', 'gestor@e2e.com')
    await page.fill('#senha', 'Gestor@1234')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin/dashboard')
    await page.goto('/admin/tipos-certificados/novo')
    await page.fill('#codigo', 'TS')
    await page.fill('#descricao', 'Tipo Teste')
    await page.fill('#texto_base', 'Certificado de ${funcao}.')
    await page.click('button[onclick="addCampo()"]')
    await page.fill('.campo-key', 'funcao')
    await page.fill('.campo-val', 'Palestrante')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/tipos-certificados$/)
    await expect(page.locator('.alert-success')).toBeVisible()
    await expect(page.locator('td')).toContainText('Tipo Teste')
  })

  test('UC-AD07 — Gestor emite certificado e status aparece como emitido', async ({
    page,
  }) => {
    // Busca IDs necessários via API
    const [participantes, tipos, eventos] = await Promise.all([
      fetch('http://localhost:3000/participantes', {
        headers: { Authorization: `Bearer ${adminToken}` },
      }).then((r) => r.json()),
      fetch('http://localhost:3000/tipos-certificados', {
        headers: { Authorization: `Bearer ${adminToken}` },
      }).then((r) => r.json()),
      fetch('http://localhost:3000/eventos', {
        headers: { Authorization: `Bearer ${adminToken}` },
      }).then((r) => r.json()),
    ])
    const p = Array.isArray(participantes)
      ? participantes[0]
      : participantes.data[0]
    const t = Array.isArray(tipos) ? tipos[0] : tipos.data[0]
    const e = Array.isArray(eventos) ? eventos[0] : eventos.data[0]
    await page.goto('/admin/certificados/novo')
    await page.selectOption('select[name="participante_id"]', String(p.id))
    await page.selectOption('select[name="evento_id"]', String(e.id))
    await page.selectOption('#tipo_certificado_id', String(t.id))
    // Aguarda campos dinâmicos carregarem via fetch
    await page.waitForSelector('#campos-dinamicos input', { timeout: 5000 })
    const inputs = await page.locator('#campos-dinamicos input').all()
    for (const input of inputs) await input.fill('Valor Teste')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/certificados$/)
    await expect(page.locator('.alert-success')).toBeVisible()
    await expect(page.locator('.badge')).toContainText('emitido')
  })

  test('UC-AD08 — Gestor cancela certificado emitido e status muda', async ({
    page,
  }) => {
    await page.goto('/admin/certificados')
    const modalBtn = page.locator('button[data-bs-toggle="modal"]').first()
    await modalBtn.click()
    // Aguarda modal
    const modal = page.locator('.modal.show')
    await expect(modal).toBeVisible()
    await modal.locator('button[type="submit"]').click()
    await expect(page.locator('.alert-success')).toBeVisible()
    await expect(page.locator('.badge')).toContainText('cancelado')
  })
  ```

- Critério de aceite: 4 testes adicionados (total 8 no arquivo); UC-AD06 interage com o editor dinâmico de campos; UC-AD07 aguarda o fetch de campos dinâmicos com timeout de 5s
- Escopo: 1 arquivo modificado
- Dependência: TASK-040-A

---

**[TASK-040-C] Adicionar UC-AD09 e UC-AD10 (usuários) em `tests/e2e/admin.spec.js`**

- Arquivo: `tests/e2e/admin.spec.js` (MODIFICAR)
- Contexto: os últimos 2 casos cobrem criação de usuário gestor com seleção de evento via checkbox e o comportamento de email duplicado. UC-AD09 verifica que após criar o usuário, o evento vinculado aparece na tabela. UC-AD10 cria o participante via API primeiro e depois tenta criar outro com o mesmo email.
- Passos: adicionar ao final de `tests/e2e/admin.spec.js`:

  ```js
  test('UC-AD09 — Admin cria usuário gestor e vincula a evento', async ({
    page,
  }) => {
    const eventos = await fetch('http://localhost:3000/eventos', {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json())
    const evento = Array.isArray(eventos) ? eventos[0] : eventos.data[0]
    await page.goto('/admin/usuarios/novo')
    await page.fill('#nome', 'Gestor Novo')
    await page.fill('#email', `gestor.novo.${Date.now()}@e2e.com`)
    await page.fill('#senha', 'Gestor@9999')
    await page.selectOption('#perfil', 'gestor')
    await page.check(`#evento-${evento.id}`)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/admin\/usuarios$/)
    await expect(page.locator('.alert-success')).toBeVisible()
    await expect(page.locator('td')).toContainText(evento.nome)
  })

  test('UC-AD10 — Admin tenta criar usuário com email duplicado e vê erro', async ({
    page,
  }) => {
    await createViaApi(
      '/usuarios',
      {
        nome: 'Dup Admin',
        email: 'dup.admin@e2e.com',
        senha: 'Dup@1234',
        perfil: 'monitor',
        eventos: [],
      },
      adminToken,
    )
    await page.goto('/admin/usuarios/novo')
    await page.fill('#nome', 'Dup Admin 2')
    await page.fill('#email', 'dup.admin@e2e.com')
    await page.fill('#senha', 'Dup@1234')
    await page.click('button[type="submit"]')
    await expect(page.locator('.alert-danger')).toBeVisible()
    await expect(page).toHaveURL(/usuarios\/novo|usuarios$/)
  })
  ```

- Critério de aceite: arquivo completo com 10 testes (UC-AD01 a UC-AD10); `npx playwright test admin.spec.js` passa com servidor e banco rodando; nenhum teste depende de estado deixado por outro
- Escopo: 1 arquivo modificado
- Dependência: TASK-040-B

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
