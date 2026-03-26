## DOMÍNIO: INFRAESTRUTURA E CONFIGURAÇÃO

**Descrição:**
Fundação técnica do sistema — schema de banco, configurações de ambiente, containerização, tooling de qualidade e reorganização de arquivos legados.

---

**FEATURE: Gerenciamento de Schema (Migrations)**

Descrição:
Controle versionado do schema via Sequelize migrations, sem `sync({ force: true })`.

TASKS:

- ✅ Migration de `eventos`, `tipos_certificados`, `participantes`, `certificados` criadas
- ✅ Migration de `usuarios` criada
- ✅ Migration de `usuario_eventos` (N:N) criada
- ✅ setup.js atualizado para rodar `db:migrate`
- ⬜ Criar migration de índices de performance (`idx_certificados_evento_id`, `idx_certificados_participante_id`, `idx_certificados_status`, `idx_participantes_email`, `idx_usuarios_email`)

---

**FEATURE: Configuração de Ambiente**

Descrição:
Padronização de variáveis de ambiente e remoção de credenciais hard-coded.

TASKS:

- ✅ .env.example criado com todas as variáveis
- ✅ Fallbacks inseguros removidos de database.js
- ✅ `JWT_SECRET` unificado sem fallback em `auth.js` e `usuarioController.js`
- ✅ .env adicionado ao .gitignore

---

**FEATURE: Containerização e Isolamento de Ambientes**

Descrição:
Separação de infraestrutura Docker por ambiente.

TASKS:

- ✅ docker-compose.yml restrito a serviços de produção
- ✅ docker-compose.test.yml com banco de testes isolado

---

**FEATURE: Tooling de Qualidade de Código**

Descrição:
ESLint, Prettier e metadados corretos no package.json.

TASKS:

- ✅ ESLint configurado com `eslint:recommended`
- ✅ Prettier configurado (aspas simples, sem ponto-e-vírgula, 2 espaços)
- ✅ Scripts `lint` e `format` adicionados ao package.json
- ✅ Metadados do package.json corrigidos (`name`, `description`, `author`)

---

**FEATURE: Migração de Arquivos Legados**

Descrição:
Mover auth.js raiz para `src/middlewares/auth.js` e atualizar todos os imports, eliminando o arquivo duplicado fora do padrão de diretórios src.

TASKS:

- ⬜ Criar `src/middlewares/auth.js` com import de models corrigido (`../models`)
- ⬜ Atualizar import em participantes.js e eventos.js
- ⬜ Atualizar import em certificados.js e tipos-certificados.js
- ⬜ Atualizar import em usuarios.js e auth.test.js
- ⬜ Remover auth.js após validar que `npm run check` passa

---

**Status resumido:**

| Feature                      | Progresso                              |
| ---------------------------- | -------------------------------------- |
| Gerenciamento de Schema      | 4/5 tasks — falta migration de índices |
| Configuração de Ambiente     | 4/4 ✅                                 |
| Containerização              | 2/2 ✅                                 |
| Tooling                      | 4/4 ✅                                 |
| Migração de Arquivos Legados | 0/5 ⬜ pendente                        |
