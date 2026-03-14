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

- [ ] `swagger-jsdoc` e `swagger-ui-express` instalados
- [ ] Anotações JSDoc `@swagger` nas rotas
- [ ] Interface disponível em `GET /api-docs`

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
