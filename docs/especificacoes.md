# Especificação de Requisitos de Software (SRS)

**Sistema:** Certifique-me  
**Versão:** 2.0  
**Data:** 2026-04-30  
**Atualizado por:** Engenharia reversa do código-fonte  
**Status:** Em desenvolvimento

---

# Visão Geral do Sistema

O **Certifique-me** é um sistema web de gestão e emissão de certificados digitais para eventos acadêmicos e técnicos. O sistema permite que organizadores de eventos criem e gerenciem certificados parametrizáveis para os participantes, com controle de acesso por perfil de usuário.

O público em geral pode consultar, validar e baixar certificados em PDF sem necessidade de autenticação. Usuários internos (gestores e monitores) operam dentro do escopo do(s) evento(s) ao qual estão vinculados, enquanto administradores têm acesso irrestrito a todos os recursos.

O sistema dispõe de dois modos de interação:

- **API REST (JSON):** para integrações e acesso programático, autenticada via JWT Bearer token.
- **Interface SSR (Server-Side Rendering):** interface web completa renderizada pelo servidor com Handlebars, autenticada via cookie JWT HTTP-only.

---

# Objetivos

- Centralizar a emissão e o gerenciamento de certificados digitais de eventos.
- Oferecer tipos de certificados parametrizáveis com campos dinâmicos e templates de texto.
- Gerar documentos PDF dos certificados com imagem de fundo e texto interpolado dinâmico.
- Garantir autenticidade e rastreabilidade dos certificados emitidos via código único de validação.
- Permitir controle de acesso granular por perfil de usuário (admin, gestor, monitor).
- Disponibilizar consulta, validação e download de certificados ao público sem necessidade de login.
- Armazenar templates de imagem e fontes em objeto de armazenamento compatível com S3 (Cloudflare R2).

---

# Stakeholders

| Stakeholder           | Papel no sistema                                                                      |
| --------------------- | ------------------------------------------------------------------------------------- |
| **Administrador**     | Gerencia todo o sistema: usuários, eventos, certificados e relatórios.                |
| **Gestor de Evento**  | Gerencia tipos de certificados, certificados e participantes de um ou mais eventos.   |
| **Monitor de Evento** | Insere dados de certificados de um ou mais eventos.                                   |
| **Participante**      | Pessoa que recebe certificados; pode consultá-los publicamente pelo código ou e-mail. |
| **Equipe técnica**    | Responsável pela implantação, manutenção e evolução do sistema.                       |

---

# Requisitos Funcionais

## Gestão de Participantes

FR-1: O sistema deve permitir criar, listar, atualizar e remover participantes (CRUD completo).  
FR-2: O campo `email` do participante deve ser único e ter formato válido.  
FR-3: O campo `nomeCompleto` do participante é obrigatório e deve ter no mínimo 3 caracteres.  
FR-4: A remoção de participantes deve ser lógica (soft delete); os registros devem poder ser restaurados.

## Gestão de Eventos

FR-5: O sistema deve permitir criar, listar, atualizar e remover eventos (CRUD completo).  
FR-6: O campo `nome` do evento é obrigatório e deve ter no mínimo 3 caracteres.  
FR-7: O campo `ano` do evento é obrigatório e deve ser um inteiro maior ou igual a 2000.  
FR-8: O campo `codigo_base` do evento é obrigatório, deve ser único e conter exatamente três letras alfabéticas (ex.: `EDU`, `CMP`, `OFC`).  
FR-9: A remoção de eventos deve ser lógica (soft delete); os registros devem poder ser restaurados.  
FR-44: O campo `url_template_base` do evento é opcional e, quando informado, deve conter uma URL válida (ou ser `null`). Esse campo armazena a **key** (caminho) do arquivo de template-base no Cloudflare R2.  
FR-48: O evento pode configurar coordenadas inteiras opcionais para posicionamento do conteúdo no PDF gerado: `texto_x`, `texto_y` (posição do bloco de texto), `validacao_x`, `validacao_y` (posição do código de validação). Se ausentes, são usados valores padrão hardcoded (`texto_x`=270, `texto_y`=200, `validacao_x`=145, `validacao_y`=545).

## Gestão de Tipos de Certificados

FR-10: O sistema deve permitir criar, listar, atualizar e remover tipos de certificados (CRUD completo).  
FR-11: O campo `codigo` do tipo de certificado é obrigatório, deve conter exatamente duas letras alfabéticas (ex.: `PA`, `MC`, `OF`) e deve ser único dentro do mesmo evento (unicidade composta `codigo + evento_id`, excluindo registros soft-deletados).  
FR-45: Cada tipo de certificado deve estar vinculado a um evento (`evento_id` obrigatório). O campo `evento_id` define o contexto do tipo de certificado.  
FR-46: Gestores podem criar, editar e remover apenas tipos de certificados vinculados aos eventos de seu escopo. Monitores não podem modificar tipos de certificados — apenas visualizá-los.  
FR-12: O campo `descricao` do tipo de certificado é obrigatório (mínimo 1 caractere).  
FR-13: O campo `texto_base` é obrigatório (mínimo 1 caractere) e pode conter expressões de interpolação no formato `${nome_campo}`, que serão substituídas pelos valores correspondentes ao emitir um certificado (ex.: `"Certificamos que ${nome_completo} participou na condição de ${funcao}."`).  
FR-14: O campo `campo_destaque` é obrigatório (mínimo 1 caractere) e deve referenciar `"nome"` ou uma chave presente em `dados_dinamicos` do mesmo tipo. Essa validação é aplicada via hook `beforeValidate` no modelo Sequelize.  
FR-15: O campo `dados_dinamicos` (JSONB) define a estrutura dos campos específicos do tipo de certificado.  
FR-16: A remoção de tipos de certificados deve ser lógica (soft delete); os registros devem poder ser restaurados.

## Gestão de Certificados

FR-17: O sistema deve permitir emitir, listar, visualizar, atualizar, cancelar, remover e restaurar certificados.  
FR-18: O campo `nome` do certificado é obrigatório e deve ter no mínimo 3 caracteres.  
FR-19: O campo `status` do certificado deve ser restrito aos valores: `"emitido"`, `"pendente"` ou `"cancelado"`. O valor padrão na criação é `"emitido"`.  
FR-20: O campo `valores_dinamicos` (JSONB) armazena os valores dos campos definidos em `dados_dinamicos` do tipo de certificado associado.  
FR-21: Cada certificado deve estar associado a um participante (`participante_id`), um evento (`evento_id`) e um tipo de certificado (`tipo_certificado_id`).  
FR-22: A remoção de certificados deve ser lógica (soft delete); os registros devem poder ser restaurados (apenas admin pode restaurar via SSR).  
FR-43: A geração do documento PDF do certificado só é permitida se o certificado possuir um código (`codigo`) válido. Certificados sem código são rejeitados com erro.  
FR-52: O código do certificado é gerado automaticamente na criação pelo serviço, no formato `CODIGO_BASE-YY-TIPO-N`, onde `CODIGO_BASE` é o `codigo_base` do evento (ex.: `EDC`), `YY` são os dois últimos dígitos do ano do evento (ex.: `26`), `TIPO` é o `codigo` do tipo de certificado (ex.: `PT`), e `N` é o número incremental de certificados criados para aquele evento e tipo (1-based). Exemplo: `EDC-26-PT-3`.  
FR-54: Na criação de um certificado, o serviço deve validar que todos os campos definidos em `dados_dinamicos` do tipo de certificado estejam presentes em `valores_dinamicos`. Campos ausentes resultam em HTTP 422 com lista dos campos faltantes (`camposFaltantes`).

## Consulta e Validação Pública de Certificados

FR-23: O sistema deve disponibilizar uma rota pública JSON para listar certificados por e-mail de participante (`GET /api/certificados?email=...`).  
FR-24: O sistema deve disponibilizar uma rota pública JSON `GET /api/validar/:codigo` que retorna `{ valido: true, certificado }` ou HTTP 404 `{ valido: false, mensagem }`.  
FR-25: As rotas de consulta pública não devem exigir autenticação.  
FR-53: O sistema deve disponibilizar uma rota pública `GET /api/certificados?email=...` que, dado o e-mail de um participante, lista todos os seus certificados.

## Geração de PDF

FR-42: O sistema deve gerar o PDF do certificado sob demanda via `GET /api/certificados/:id/pdf`, sem exigir autenticação.  
FR-47: A imagem de fundo do PDF é obtida do Cloudflare R2 usando a key em `evento.url_template_base`. Se não definido, usa `"template/padrao.jpg"` como key padrão.  
FR-47b: A fonte tipográfica (`Lato-Medium.ttf`) é obtida do R2 (key `"fontes/Lato-Medium.ttf"`). Se indisponível, usa `Helvetica` como fallback.  
FR-47c: O PDF é gerado em formato A4 landscape. As coordenadas de posicionamento dos blocos de texto e do código de validação são configuráveis por evento via campos `texto_x/y` e `validacao_x/y`.  
FR-47d: O texto de validação no PDF inclui o código do certificado e um link de validação composto pela variável de ambiente `ENDERECO_VALIDACAO` (default: `https://certificaaqui.com/validar`).

## Upload de Template de Evento

FR-51: Ao criar ou editar um evento via interface SSR, um arquivo de imagem (PNG ou JPEG, máx. 2 MB) pode ser enviado como template de fundo do PDF. O sistema realiza upload ao R2 com key gerada a partir do nome e ano do evento no formato `templates/<slug-nome>/<ano>/base.<ext>`, e armazena a key em `url_template_base`.

## Interface SSR / Painel Administrativo

FR-49: O sistema deve prover uma interface web SSR completa para gerenciamento administrativo, acessível a partir de `/admin/*`, incluindo dashboard, CRUD de eventos, participantes, tipos de certificados, certificados e usuários.  
FR-56: O dashboard (`GET /admin/dashboard`) exibe para admin: total de eventos, tipos, participantes, usuários, certificados, certificados pendentes, e os 5 certificados mais recentes. Para gestor/monitor: total de certificados e participantes únicos filtrados por seus eventos.

## Gestão de Usuários e Autenticação

FR-26: O sistema deve permitir criar, listar, atualizar e remover usuários.  
FR-27: O campo `email` do usuário deve ser único e ter formato válido.  
FR-28: O campo `perfil` do usuário deve ser restrito aos valores: `"admin"`, `"gestor"` ou `"monitor"`.  
FR-29: A senha do usuário deve ser armazenada como hash bcrypt (10 rounds), aplicado via hook Sequelize `beforeCreate` e `beforeUpdate` quando a senha for alterada.  
FR-30: O sistema deve autenticar usuários via JWT com dois fluxos: (a) API: `POST /usuarios/login` retorna `{ token }` no corpo JSON; (b) SSR: `POST /auth/login` define cookie HTTP-only `token` e redireciona para `/admin/dashboard`. Token expira em 1 hora.  
FR-31: O endpoint `GET /usuarios/me` deve retornar os dados do usuário autenticado (id, nome, email, perfil).  
FR-32: Gestores e monitores devem estar vinculados a um ou mais eventos via tabela `usuario_eventos` (N:N). Administradores não possuem essa restrição.  
FR-33: A remoção de usuários deve ser lógica (soft delete); os registros devem poder ser restaurados.  
FR-55: O endpoint `POST /usuarios/login` deve ser protegido por rate limiting: máximo 10 tentativas em 15 minutos por IP.  
FR-57: Todo usuário autenticado deve poder alterar sua própria senha via interface SSR (`GET/POST /admin/perfil/alterar-senha`). O formulário exige a senha atual e a nova senha (confirmada). A nova senha deve atender à política de senha forte: mínimo 8 caracteres, com pelo menos uma letra maiúscula, uma letra minúscula, um dígito e um caractere especial. A senha atual deve ser verificada antes da atualização.

## Controle de Acesso (RBAC)

FR-34: O perfil **admin** deve ter acesso irrestrito a todos os recursos do sistema.  
FR-35: O perfil **gestor** deve ter permissão para criar, editar e remover tipos de certificados de seus eventos (P1) e inserir/editar/cancelar certificados (P2).  
FR-36: O perfil **monitor** pode listar e visualizar certificados e participantes dos seus eventos e criar certificados (P2). Não pode criar tipos de certificados.  
FR-37: O middleware `scopedEvento` deve garantir que gestores e monitores operem exclusivamente dentro dos eventos ao qual estão vinculados. Para listagens (GET sem ID), o filtro de `evento_id` é injetado automaticamente. Para usuários com múltiplos eventos, o filtro aceita array de IDs.  
FR-38: Rotas administrativas da API REST devem ser protegidas por `auth` (JWT Bearer) e `rbac`.

## Geração de Texto do Certificado

FR-39: O sistema deve interpolar o `texto_base` do tipo de certificado com os `valores_dinamicos` do certificado. A sintaxe de interpolação é `${nome_campo}`. Placeholders sem correspondência são mantidos sem substituição. O campo `nome` é injetado automaticamente com o valor de `certificado.nome` (ou `participante.nomeCompleto` como fallback).

## Monitoramento e Operações

FR-40: O sistema deve expor `GET /health` que retorne `{ "status": "ok", "db": "connected", "uptime": N }` quando banco disponível.  
FR-41: Se o banco de dados estiver indisponível, `GET /health` deve retornar HTTP 503 com `{ "status": "error", "db": "disconnected" }`.

---

# Requisitos Não Funcionais

NFR-1: **Segurança — Controle de Acesso:** Todas as rotas administrativas devem ser protegidas por autenticação JWT e verificação de perfil (OWASP A01).  
NFR-2: **Segurança — Armazenamento de Senhas:** Senhas devem ser armazenadas exclusivamente como hash bcrypt; texto plano nunca deve ser persistido (OWASP A02).  
NFR-3: **Segurança — Configuração:** `JWT_SECRET` e `SESSION_SECRET` devem ser fornecidos obrigatoriamente via variáveis de ambiente; a ausência de qualquer um deve lançar erro na inicialização da aplicação. Nenhum fallback inseguro é permitido.  
NFR-4: **Confiabilidade — Soft Delete:** Nenhuma entidade principal (`participantes`, `eventos`, `certificados`, `tipos_certificados`, `usuarios`) deve ser removida permanentemente do banco. Todas devem suportar restauração.  
NFR-5: **Confiabilidade — Migrações:** O schema do banco de dados deve ser gerenciado exclusivamente via migrations Sequelize.  
NFR-6: **Manutenibilidade — Arquitetura em Camadas:** routes → controllers → services → models. Lógica de negócio não deve residir em rotas ou models.  
NFR-7: **Manutenibilidade — Carregamento Explícito de Modelos:** O `models/index.js` deve registrar modelos explicitamente, sem `fs.readdirSync`.  
NFR-8: **Testabilidade:** Banco PostgreSQL dedicado para testes, isolado de desenvolvimento e produção. SQLite usado em testes unitários.  
NFR-9: **Portabilidade:** Executável via Docker com `docker-compose.yml` (produção) e `docker-compose.test.yml` (testes).  
NFR-10: **Rastreabilidade:** Todos os registros devem ter `created_at`, `updated_at` e `deleted_at`.  
NFR-11: **Segurança — Upload:** Uploads de template restritos a PNG/JPEG, máx. 2 MB (validado por `multer`).

---

# Arquitetura do Sistema

## Componentes Principais

| Componente                     | Localização                                     | Responsabilidade                                            |
| ------------------------------ | ----------------------------------------------- | ----------------------------------------------------------- |
| **Express App**                | `app.js`                                        | Config central, session, flash, Swagger, montagem de rotas  |
| **Rotas API REST**             | `src/routes/*.js`                               | Endpoints JSON com auth, rbac, validate                     |
| **Rotas SSR Admin**            | `src/routes/admin.js`                           | Interface web Handlebars para painel admin                  |
| **Rotas SSR Públicas**         | `src/routes/public.js`                          | Páginas públicas de consulta/download                       |
| **Rotas Auth SSR**             | `src/routes/auth.js`                            | Formulário de login/logout SSR                              |
| **Controllers REST**           | `src/controllers/*Controller.js`                | Orquestração de request/response JSON                       |
| **Controllers SSR**            | `src/controllers/*SSRController.js`             | Renderização de views Handlebars                            |
| **dashboardController**        | `src/controllers/dashboardController.js`        | Dashboard com estatísticas por perfil                       |
| **Services**                   | `src/services/*.js`                             | Lógica de negócio, geração de código, PDF, R2, interpolação |
| **pdfService**                 | `src/services/pdfService.js`                    | Geração de PDF com PDFKit + R2                              |
| **r2Service**                  | `src/services/r2Service.js`                     | Upload/download/delete no Cloudflare R2 (S3-compat)         |
| **templateService**            | `src/services/templateService.js`               | Interpolação `${variavel}` no texto_base                    |
| **Models Sequelize**           | `src/models/*.js`                               | ORM, validações, hooks, associações                         |
| **Validators Zod**             | `src/validators/*.js`                           | Schemas de validação aplicados pelo middleware `validate`   |
| **auth**                       | `src/middlewares/auth.js`                       | Verifica JWT Bearer + existência do usuário no banco        |
| **authSSR**                    | `src/middlewares/authSSR.js`                    | Verifica cookie JWT, popula `req.usuario` e `res.locals`    |
| **rbac**                       | `src/middlewares/rbac.js`                       | Hierarquia de perfis monitor < gestor < admin               |
| **scopedEvento**               | `src/middlewares/scopedEvento.js`               | Restringe acesso ao(s) evento(s) do usuário                 |
| **tiposCertificadosOwnership** | `src/middlewares/tiposCertificadosOwnership.js` | Ownership de tipos por gestor                               |
| **uploadTemplate**             | `src/middlewares/uploadTemplate.js`             | multer: PNG/JPEG ≤ 2MB em memória                           |

## Fluxo: Geração de PDF

```
GET /api/certificados/:id/pdf
  → Certificado.findByPk(id, { include: [Participante, Evento, TiposCertificados] })
  → pdfService.generateCertificadoPdf(certificado)
      → r2Service.getFile(evento.url_template_base)    (imagem de fundo)
      → r2Service.getFile('fontes/Lato-Medium.ttf')    (fonte)
      → templateService.interpolate(texto_base, valores_dinamicos)
      → PDFKit: A4 landscape, texto em (texto_x, texto_y), validação em (validacao_x, validacao_y)
      → Buffer → HTTP 200 Content-Type: application/pdf
```

## Fluxo: Emissão de Certificado (API)

```
POST /certificados
  → auth (JWT Bearer) → rbac('monitor') → scopedEvento → validate(Zod)
  → certificadoService.create(data)
      → TiposCertificados.findByPk(tipo_certificado_id)    (valida existência)
      → Evento.findByPk(evento_id)                          (valida existência)
      → compara campos de dados_dinamicos vs valores_dinamicos  → HTTP 422 se faltantes
      → gera codigo = `${codigo_base}-${ano_2d}-${tipo_codigo}-${count+1}`
      → Certificado.create(data)
  → HTTP 201 JSON
```

## Fluxo: Autenticação SSR

```
POST /auth/login (form: email + senha)
  → Usuario.findOne({ where: { email } })
  → bcrypt.compare(senha, usuario.senha)
  → jwt.sign({ id, perfil }, JWT_SECRET, { expiresIn: '1h' })
  → res.cookie('token', token, { httpOnly: true, sameSite: 'lax' })
  → redirect /admin/dashboard
```

## Fluxo: Alteração de Senha (SSR)

```
POST /admin/perfil/alterar-senha (form: senhaAtual + novaSenha + confirmarSenha)
  → authSSR (verifica cookie JWT, popula req.usuario)
  → perfilSSRController.alterarSenha
      → verifica novaSenha === confirmarSenha            → redirect c/ flash de erro se diferente
      → senhaForteSchema.safeParse(novaSenha)            → redirect c/ flash de erro se fraca
      → Usuario.findByPk(req.usuario.id)
      → bcrypt.compare(senhaAtual, usuario.senha)        → redirect c/ flash de erro se incorreta
      → usuario.update({ senha: novaSenha })             (hook beforeUpdate aplica novo hash bcrypt)
      → redirect /admin/dashboard c/ flash de sucesso
```

---

# Funcionalidades do Sistema

## Gestão de Participantes

CRUD completo via API REST e Interface SSR. Participante identificado por e-mail único. Associado a múltiplos certificados.  
**Requisitos:** FR-1, FR-2, FR-3, FR-4

---

## Gestão de Eventos

CRUD completo. Cada evento possui `codigo_base` (3 letras), template de fundo no R2 (`url_template_base`) e coordenadas de layout do PDF (`texto_x/y`, `validacao_x/y`). Upload de template via SSR com multer.  
**Requisitos:** FR-5, FR-6, FR-7, FR-8, FR-9, FR-44, FR-48, FR-51

---

## Tipos de Certificados Parametrizáveis

Modelos de certificados com `dados_dinamicos` JSONB e templates com `${variavel}`. Vinculados obrigatoriamente a um evento. Mutações restritas ao gestor do evento por `tiposCertificadosOwnership`.  
**Requisitos:** FR-10, FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, FR-45, FR-46

---

## Emissão e Gestão de Certificados

Código de validação único gerado automaticamente (`CODIGO_BASE-YY-TIPO-N`). Validação de campos dinâmicos obrigatórios no service (HTTP 422 se faltantes). Status padrão: `"emitido"`.  
**Requisitos:** FR-17, FR-18, FR-19, FR-20, FR-21, FR-22, FR-39, FR-43, FR-52, FR-54

---

## Geração de PDF

PDF A4 landscape gerado por PDFKit. Imagem de fundo e fonte Lato-Medium obtidas do R2. Coordenadas configuráveis por evento. Sem autenticação.  
**Requisitos:** FR-42, FR-43, FR-47, FR-47b, FR-47c, FR-47d

---


## Consulta e Validação Pública

- `GET /api/certificados?email=<email>` — lista certificados por e-mail.
- `GET /api/validar/:codigo` — valida por código único.
- `GET /api/certificados/:id/pdf` — baixa PDF.
- Páginas SSR: `/obter`, `/validar`, `POST /obter`.  
  **Requisitos:** FR-23, FR-24, FR-25, FR-42, FR-53

---

## Autenticação e Gestão de Usuários

Dois fluxos: JWT Bearer (API) e cookie HTTP-only (SSR). Usuários vinculados a N eventos via `usuario_eventos`. Criação via SSR (admin) ou API protegida. Todo usuário autenticado pode alterar sua própria senha via painel SSR.  
**Requisitos:** FR-26, FR-27, FR-28, FR-29, FR-30, FR-31, FR-32, FR-33, FR-55, FR-57

---

## Controle de Acesso por Perfil (RBAC)

Hierarquia `monitor < gestor < admin`. `tiposCertificadosOwnership` restringe mutações de tipos ao escopo do gestor.  
**Requisitos:** FR-34, FR-35, FR-36, FR-37, FR-38

---

## Interface SSR / Painel Administrativo

Interface web completa Handlebars em `/admin/*`. Autenticação via cookie. Mensagens flash com `connect-flash`. CRUD completo de todos os recursos com controle de acesso por rbac.  
**Requisitos:** FR-49, FR-56

---

## Monitoramento de Saúde

`GET /health` com status de banco e uptime.  
**Requisitos:** FR-40, FR-41

---

# Papéis de Usuário

## Admin

- Acesso irrestrito. Gerencia todos os recursos, incluindo criação de usuários.
- Sem vínculo obrigatório a eventos.

## Gestor

- Vinculado a um ou mais eventos.
- Gerencia tipos de certificados, certificados e participantes dos seus eventos.

## Monitor

- Vinculado a um ou mais eventos.
- Pode listar/visualizar e criar certificados e participantes dos seus eventos.
- Não pode criar/editar/remover tipos de certificados.

## Público (sem autenticação)

- Consulta, valida e baixa certificados.

**Rotas públicas:**

| Rota                              | Descrição                              |
| --------------------------------- | -------------------------------------- |
| `GET /api/certificados?email=...` | Listar certificados por e-mail (JSON)  |
| `GET /api/validar/:codigo`        | Validar certificado por código (JSON)  |
| `GET /api/certificados/:id/pdf`   | Baixar PDF do certificado              |
| `GET /obter`                      | Formulário SSR de busca por e-mail     |
| `GET /validar`                    | Formulário SSR de validação por código |
| `POST /obter`                     | Processar busca por e-mail (SSR)       |
| `POST /validar`                   | Processar validação por código (SSR)   |

---

# Modelo de Dados

## `participantes`

| Campo          | Tipo      | Restrições                                 |
| -------------- | --------- | ------------------------------------------ |
| `id`           | Integer   | PK, auto-incremento                        |
| `nomeCompleto` | String    | Obrigatório, mínimo 3 caracteres           |
| `email`        | String    | Obrigatório, único, e-mail válido          |
| `instituicao`  | String    | Opcional, mínimo 2 caracteres se fornecido |
| `created_at`   | Timestamp | Automático                                 |
| `updated_at`   | Timestamp | Automático                                 |
| `deleted_at`   | Timestamp | Soft delete (paranoid)                     |

## `eventos`

| Campo               | Tipo      | Restrições                                                      |
| ------------------- | --------- | --------------------------------------------------------------- |
| `id`                | Integer   | PK, auto-incremento                                             |
| `nome`              | String    | Obrigatório, mínimo 3 caracteres                                |
| `ano`               | Integer   | Obrigatório, ≥ 2000                                             |
| `codigo_base`       | String(3) | Obrigatório, único, exatamente 3 letras alfabéticas             |
| `url_template_base` | String    | Opcional (null); key R2 do arquivo de imagem de fundo do PDF    |
| `texto_x`           | Integer   | Opcional; coord. X do bloco de texto no PDF (default: 270)      |
| `texto_y`           | Integer   | Opcional; coord. Y do bloco de texto no PDF (default: 200)      |
| `validacao_x`       | Integer   | Opcional; coord. X do código de validação no PDF (default: 145) |
| `validacao_y`       | Integer   | Opcional; coord. Y do código de validação no PDF (default: 545) |
| `created_at`        | Timestamp | Automático                                                      |
| `updated_at`        | Timestamp | Automático                                                      |
| `deleted_at`        | Timestamp | Soft delete (paranoid)                                          |

## `tipos_certificados`

| Campo             | Tipo      | Restrições                                                                        |
| ----------------- | --------- | --------------------------------------------------------------------------------- |
| `id`              | Integer   | PK, auto-incremento                                                               |
| `evento_id`       | Integer   | FK → `eventos.id`, obrigatório                                                    |
| `codigo`          | String(2) | Obrigatório; 2 letras; único por `(codigo, evento_id)` WHERE `deleted_at` IS NULL |
| `descricao`       | String    | Obrigatório, mínimo 1 caractere                                                   |
| `campo_destaque`  | String    | Obrigatório; deve ser `"nome"` ou chave de `dados_dinamicos` (hook)               |
| `texto_base`      | Text      | Obrigatório; pode conter `${variavel}` para interpolação                          |
| `dados_dinamicos` | JSONB     | Opcional; define campos específicos do tipo                                       |
| `created_at`      | Timestamp | Automático                                                                        |
| `updated_at`      | Timestamp | Automático                                                                        |
| `deleted_at`      | Timestamp | Soft delete (paranoid)                                                            |

## `certificados`

| Campo                 | Tipo      | Restrições                                                              |
| --------------------- | --------- | ----------------------------------------------------------------------- |
| `id`                  | Integer   | PK, auto-incremento                                                     |
| `participante_id`     | Integer   | FK → `participantes.id`, obrigatório                                    |
| `evento_id`           | Integer   | FK → `eventos.id`, obrigatório                                          |
| `tipo_certificado_id` | Integer   | FK → `tipos_certificados.id`, obrigatório                               |
| `nome`                | String    | Obrigatório, mínimo 3 caracteres                                        |
| `status`              | Enum      | `"emitido"` (default), `"pendente"`, `"cancelado"`                      |
| `codigo`              | String    | Gerado automaticamente na criação; obrigatório; único globalmente       |
| `valores_dinamicos`   | JSONB     | Valores dos campos de `dados_dinamicos`; validado no service na criação |
| `created_at`          | Timestamp | Automático                                                              |
| `updated_at`          | Timestamp | Automático                                                              |
| `deleted_at`          | Timestamp | Soft delete (paranoid)                                                  |

## `usuarios`

| Campo        | Tipo      | Restrições                               |
| ------------ | --------- | ---------------------------------------- |
| `id`         | Integer   | PK, auto-incremento                      |
| `nome`       | String    | Obrigatório, mínimo 3 caracteres         |
| `email`      | String    | Obrigatório, único, e-mail válido        |
| `senha`      | String    | Obrigatório, ≥ 6 caracteres; hash bcrypt |
| `perfil`     | Enum      | `"admin"`, `"gestor"` ou `"monitor"`     |
| `created_at` | Timestamp | Automático                               |
| `updated_at` | Timestamp | Automático                               |
| `deleted_at` | Timestamp | Soft delete (paranoid)                   |

> Sem campo `evento_id`. Associação com eventos via tabela `usuario_eventos` (N:N).

## `usuario_eventos`

| Campo        | Tipo      | Restrições                      |
| ------------ | --------- | ------------------------------- |
| `id`         | Integer   | PK, auto-incremento             |
| `usuario_id` | Integer   | FK → `usuarios.id`, obrigatório |
| `evento_id`  | Integer   | FK → `eventos.id`, obrigatório  |
| `created_at` | Timestamp | Automático                      |
| `updated_at` | Timestamp | Automático                      |
| `deleted_at` | Timestamp | Soft delete (paranoid)          |

## Relacionamentos

```
participantes    1 ──< N   certificados
eventos          1 ──< N   certificados
tipos_certificados  1 ──< N  certificados
eventos          1 ──< N   tipos_certificados
usuarios         N ──── N  eventos  (via usuario_eventos)
```

---

# APIs / Interfaces

## API REST (Bearer JWT)

### Participantes

| Método   | Rota                         | Perfil mínimo | Descrição              |
| -------- | ---------------------------- | ------------- | ---------------------- |
| `POST`   | `/participantes`             | monitor       | Criar participante     |
| `GET`    | `/participantes`             | monitor       | Listar participantes   |
| `GET`    | `/participantes/:id`         | monitor       | Buscar por ID          |
| `PUT`    | `/participantes/:id`         | monitor       | Atualizar participante |
| `DELETE` | `/participantes/:id`         | monitor       | Soft delete            |
| `POST`   | `/participantes/:id/restore` | monitor       | Restaurar              |

### Eventos

| Método   | Rota                   | Perfil mínimo | Descrição        |
| -------- | ---------------------- | ------------- | ---------------- |
| `POST`   | `/eventos`             | admin         | Criar evento     |
| `GET`    | `/eventos`             | monitor       | Listar eventos   |
| `GET`    | `/eventos/:id`         | monitor       | Buscar por ID    |
| `PUT`    | `/eventos/:id`         | admin         | Atualizar evento |
| `DELETE` | `/eventos/:id`         | admin         | Soft delete      |
| `POST`   | `/eventos/:id/restore` | admin         | Restaurar evento |

### Tipos de Certificados

| Método   | Rota                              | Perfil mínimo | Middleware extra             |
| -------- | --------------------------------- | ------------- | ---------------------------- |
| `GET`    | `/tipos-certificados`             | monitor       | —                            |
| `GET`    | `/tipos-certificados/:id`         | monitor       | —                            |
| `POST`   | `/tipos-certificados`             | gestor        | `tiposCertificadosOwnership` |
| `PUT`    | `/tipos-certificados/:id`         | gestor        | `tiposCertificadosOwnership` |
| `DELETE` | `/tipos-certificados/:id`         | gestor        | `tiposCertificadosOwnership` |
| `POST`   | `/tipos-certificados/:id/restore` | gestor        | `tiposCertificadosOwnership` |

### Certificados

| Método   | Rota                        | Perfil mínimo | Nota                        |
| -------- | --------------------------- | ------------- | --------------------------- |
| `POST`   | `/certificados`             | monitor       | Gera código automaticamente |
| `GET`    | `/certificados`             | monitor       | Filtrado por scopedEvento   |
| `GET`    | `/certificados/:id`         | monitor       |                             |
| `PUT`    | `/certificados/:id`         | monitor       |                             |
| `DELETE` | `/certificados/:id`         | monitor       | Soft delete                 |
| `POST`   | `/certificados/:id/restore` | monitor       | Restaurar                   |
| `POST`   | `/certificados/:id/cancel`  | monitor       | Status → "cancelado"        |

### Usuários / Autenticação

| Método | Rota                                | Auth               | Descrição                                        |
| ------ | ----------------------------------- | ------------------ | ------------------------------------------------ |
| `POST` | `/usuarios/login`                   | Não (rate-limited) | Login API → `{ token }`                          |
| `POST` | `/usuarios/logout`                  | Não                | Logout stateless (orientativo)                   |
| `GET`  | `/usuarios/me`                      | JWT Bearer         | Dados do usuário autenticado                     |
| `POST` | `/:papel/:id/usuarios`              | JWT + admin        | Criar usuário (admin com seu próprio id na rota) |
| `PUT`  | `/:papel/:id/usuarios/:uId/eventos` | JWT + admin        | Atualizar eventos do usuário                     |

### Públicas

| Método | Rota                          | Descrição                      |
| ------ | ----------------------------- | ------------------------------ |
| `GET`  | `/api/certificados?email=...` | Listar certificados por e-mail |
| `GET`  | `/api/validar/:codigo`        | Validar por código             |
| `GET`  | `/api/certificados/:id/pdf`   | Baixar PDF                     |
| `GET`  | `/health`                     | Health check                   |
| `GET`  | `/api-docs`                   | Documentação Swagger/OpenAPI   |

## Interface SSR — Auth

| Método | Rota           | Descrição                                 |
| ------ | -------------- | ----------------------------------------- |
| `GET`  | `/auth/login`  | Página de login                           |
| `POST` | `/auth/login`  | Processar login → cookie + redirect       |
| `POST` | `/auth/logout` | Limpar cookie → redirect para /auth/login |

## Interface SSR — Admin (requer authSSR + rbac)

| Rota                                   | Perfil mínimo  | Operação                      |
| -------------------------------------- | -------------- | ----------------------------- |
| `GET /admin/dashboard`                 | monitor        | Dashboard com estatísticas    |
| `GET/POST /admin/eventos`              | gestor/admin   | CRUD de eventos               |
| `GET/POST /admin/participantes`        | monitor        | CRUD de participantes         |
| `GET/POST /admin/tipos-certificados`   | gestor         | CRUD de tipos de certificados |
| `GET/POST /admin/certificados`         | monitor/gestor | CRUD de certificados          |
| `GET/POST /admin/usuarios`             | admin          | CRUD de usuários              |
| `GET/POST /admin/perfil/alterar-senha` | monitor        | Alterar própria senha         |

---

# Regras de Negócio

RN-1: Código de validação gerado automaticamente no formato `CODIGO_BASE-YY-TIPO-N`. Único e imutável.

RN-2: Status padrão de novo certificado é `"emitido"`.

RN-3: Gestores e monitores são filtrados aos eventos vinculados. `scopedEvento` injeta o filtro nas listagens.

RN-4: `campo_destaque` só pode ser `"nome"` ou chave de `dados_dinamicos` (hook `beforeValidate`).

RN-5: Hash bcrypt na senha aplicado por hooks Sequelize (`beforeCreate`, `beforeUpdate` se alterada).

RN-6: Ao deletar evento, as associações `usuario_eventos` são soft-deletadas. Ao restaurar, são restauradas.

RN-7: Sintaxe de interpolação do `texto_base` é `${variavel}`. Placeholders sem correspondência são mantidos.

RN-8: Campo `nome` injetado automaticamente na interpolação do PDF (`certificado.nome` ou `participante.nomeCompleto`).

RN-9: Todos os campos de `dados_dinamicos` devem ser fornecidos em `valores_dinamicos` na criação (service layer).

RN-10: Gestores só modificam tipos de certificados cujo `evento_id` pertence a seus eventos (`tiposCertificadosOwnership`).

RN-11: A nova senha informada no formulário de alteração deve atender à política de senha forte: comprimento mínimo de 8 caracteres, contendo ao menos uma letra maiúscula, uma letra minúscula, um dígito e um caractere especial (`!@#$%^&*`). A validação é realizada por schema Zod (`senhaForteSchema`) antes de qualquer alteração no banco.

---

# Integrações Externas

| Integração                                       | Tipo                               | Status | Variáveis de Ambiente requeridas                                       |
| ------------------------------------------------ | ---------------------------------- | ------ | ---------------------------------------------------------------------- |
| **PostgreSQL**                                   | Banco relacional                   | Em uso | `DB_*` (via `config/database.js`)                                      |
| **Docker**                                       | Containerização                    | Em uso | —                                                                      |
| **JWT (jsonwebtoken)**                           | Autenticação stateless             | Em uso | `JWT_SECRET` (obrigatório; sem fallback)                               |
| **bcryptjs**                                     | Hash de senhas                     | Em uso | —                                                                      |
| **Cloudflare R2**                                | Armazenamento de objetos S3-compat | Em uso | `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` |
| **PDFKit**                                       | Geração de PDF no servidor         | Em uso | `ENDERECO_VALIDACAO` (URL base do link de validação no PDF)            |
| **@aws-sdk/client-s3**, **@aws-sdk/lib-storage** | Cliente S3 para R2 (SDK v3)        | Em uso | (mesmas que R2)                                                        |
| **multer**                                       | Upload de imagens (template)       | Em uso | —                                                                      |
| **express-session**                              | Sessão (flash + auth SSR)          | Em uso | `SESSION_SECRET` (obrigatório; sem fallback)                           |
| **connect-flash**                                | Mensagens flash SSR                | Em uso | —                                                                      |
| **express-rate-limit**                           | Rate limiting no login             | Em uso | —                                                                      |
| **swagger-jsdoc/ui**                             | Documentação OpenAPI interativa    | Em uso | —                                                                      |
| **Zod**                                          | Validação de requisições           | Em uso | —                                                                      |

---

# Restrições

- **Banco de dados:** PostgreSQL em produção/desenvolvimento. SQLite apenas em testes unitários.
- **Autenticação API:** JWT stateless, 1 hora, sem refresh tokens.
- **Autenticação SSR:** Cookie HTTP-only com JWT, mesma expiração.
- **Soft delete:** Deleção permanente não suportada pela interface.
- **Escopo de evento:** Gestores/monitores só operam nos eventos vinculados — imposto por middlewares.
- **Templates:** Upload restrito a PNG/JPEG, máx. 2 MB. Armazenados no R2.
- **Código de certificado:** Gerado automaticamente na criação; não informável manualmente.
- **Variáveis obrigatórias:** `JWT_SECRET` e `SESSION_SECRET` devem estar definidas; a ausência causa erro na inicialização.

---

# Premissas

- Admins são criados via SSR (por outro admin), seed ou diretamente no banco.
- Gestores/monitores podem ser vinculados a múltiplos eventos; `scopedEvento` considera todos.
- O código do certificado (`CODIGO_BASE-YY-TIPO-N`) é suficiente para identificação e validação pública.
- O sistema não envia e-mails — distribuição ocorre por links ou busca direta na plataforma.
- `ENDERECO_VALIDACAO` deve ser configurado em produção; default hardcoded é `https://certificaaqui.com/validar`.

---

# Funcionalidades Identificadas no Código

> Seção gerada por análise reversa do repositório em 2026-04-30.

---

UF-1: **Relacionamento N:N entre Usuário e Evento via `usuario_eventos`.**  
Sem `evento_id` em `usuarios`. Usuário pode ter múltiplos eventos.  
**Evidência:** `src/models/usuario.js`, `src/models/usuario_eventos.js`, migration `20260313190000-create-usuario_eventos.js`

---

UF-2: **Endpoint protegido para associar eventos a um usuário via API.**  
`PUT /:papel/:id/usuarios/:usuarioId/eventos` — requer auth e que o admin logado seja o parâmetro `:id`.  
**Evidência:** `src/routes/usuarios-crud.js`, `src/controllers/usuarioController.js`

---

UF-3: **Documentação OpenAPI em `/api-docs`.**  
Gerada por `swagger-jsdoc` a partir de JSDoc `@swagger` nas rotas.  
**Evidência:** `app.js`, `src/routes/`

---

UF-4: **Validação Zod com retorno estruturado de erros.**  
HTTP 400 com `{ "error": "Erro de validação", "detalhes": [...] }`.  
**Evidência:** `src/middlewares/validate.js`

---

UF-5: **Restrições mínimas de tamanho em campos de validação.**

- `nomeCompleto`, `nome`: ≥ 3 caracteres
- `senha`: ≥ 6 caracteres
- `instituicao`: ≥ 2 caracteres (opcional)
- `ano`: ≥ 2000

---

UF-6: **Hierarquia de perfis no RBAC.**  
`['monitor', 'gestor', 'admin']` por índice. Rank maior acessa rotas de rank inferior.  
**Evidência:** `src/middlewares/rbac.js`

---

UF-7: **`scopedEvento` injeta `evento_id` automático nas listagens.**  
Para GET sem `:id`, `req.query.evento_id` é preenchido com o(s) evento(s) do usuário. Array quando múltiplos.  
**Evidência:** `src/middlewares/scopedEvento.js`

---

UF-8: **Auth valida existência do usuário no banco a cada requisição.**  
Tokens de usuários soft-deletados são rejeitados imediatamente.  
**Evidência:** `src/middlewares/auth.js`

---

UF-9: **JWT com expiração fixa de 1 hora. Sem refresh token.**  
**Evidência:** `src/controllers/usuarioController.js`, `src/routes/auth.js`

---

UF-10: **Cascade soft delete/restore em `usuario_eventos` ao operar sobre eventos.**  
**Evidência:** `src/services/eventoService.js`

---

UF-11: **Sintaxe de interpolação `${variavel}` — ALINHADA com a especificação.**  
O código atual usa regex `\$\{(\w+)\}/g`, consistente com a documentação.  
**Evidência:** `src/services/templateService.js`

---

UF-12: **Criação de usuário exige autenticação admin — PROTEGIDA.**  
`POST /usuarios` público foi removido. Criação via SSR (`/admin/usuarios`) ou API protegida.  
**Evidência:** `src/routes/usuarios.js`, `src/routes/usuarios-crud.js`, `src/routes/admin.js`

---

UF-13: **`valores_dinamicos` validado no service, não no Zod.**  
Na criação: verifica campos obrigatórios de `dados_dinamicos` → HTTP 422. Atualizações não validam.  
**Evidência:** `src/validators/certificado.js`, `src/services/certificadoService.js`

---

UF-14: **`JWT_SECRET` obrigatório sem fallback — inconsistência RESOLVIDA.**  
Ambos `auth.js` e `usuarioController.js` lançam erro na inicialização se `JWT_SECRET` não definido.  
**Evidência:** `src/middlewares/auth.js:4`, `src/controllers/usuarioController.js:3-4`

---

UF-15: **Geração de PDF com PDFKit e imagem/fonte do Cloudflare R2.**  
Fallback gracioso se R2 indisponível; continua sem fundo/fonte customizada.  
**Evidência:** `src/services/pdfService.js`, `src/services/r2Service.js`

---

UF-16: **Interface SSR completa com Handlebars em `/admin/*`.**  
Autenticada via cookie HTTP-only. Mensagens flash via `connect-flash`.  
**Evidência:** `src/routes/admin.js`, `src/controllers/*SSRController.js`, `views/`

---

UF-17: **Rate limiting no endpoint de login API.**  
Máx. 10 tentativas/15 min por IP. HTTP 429 se excedido.  
**Evidência:** `src/routes/usuarios.js`

---

UF-18: **`GET /certificados` redireciona para SSR sem Bearer token.**  
Se acessado por browser (sem `Authorization: Bearer`), redireciona para a página pública inicial (ver rota configurada em `app.js`).  
**Evidência:** `app.js` (middleware condicional)

---

UF-19: **`authSSR` popula `res.locals.usuario` para templates Handlebars.**  
Inclui flags `isAdmin` e `isGestor` para condicional nas views.  
**Evidência:** `src/middlewares/authSSR.js`

---

UF-20: **Dashboard com estatísticas diferenciadas por perfil.**  
Admin: estatísticas globais + 5 últimos certificados. Gestor/monitor: filtrado por eventos vinculados.  
**Evidência:** `src/controllers/dashboardController.js`

---

# Inconsistências Detectadas

**INC-2 — RESOLVIDA:** Sintaxe de interpolação agora é `${variavel}` no código e na spec.

**INC-3 — RESOLVIDA:** Ambos `auth.js` e `usuarioController.js` lançam erro sem `JWT_SECRET`. Sem fallbacks.

**INC-4 — RESOLVIDA:** Criação de usuário via API protegida. Sem endpoint público de criação.

**INC-5 — MITIGADA:** `valores_dinamicos` não validado pelo Zod, mas validado no service na criação. Updates não validam.

**INC-6 — CONFIRMADA:** `GET /eventos` é rota protegida (monitor+). Comportamento intencional.

**INC-NOVA-1:** `eventoService.delete()` usa `UsuarioEvento.destroy()` para cascade. Com `paranoid: true`, deve resultar em soft delete. Confirmar comportamento em produção.

**INC-NOVA-2:** Endpoint `POST /:papel/:id/usuarios` verifica `req.usuario.id === Number(id)`. Admin só pode criar usuários passando sua própria ID na URL. Parece limitação de design — necessita confirmação.

---

# Pontos de Atenção

PA-1: `valores_dinamicos` não é validado em updates (`PUT /certificados/:id`). Dados podem ficar inconsistentes após atualização.

PA-2: Geração do código de certificado usa `Certificado.count({ where: { evento_id, tipo_certificado_id } })` incluindo soft-deletados. Após deletar e recriar certificados, o contador pode colidir com o `UNIQUE` constraint do campo `codigo`.

PA-3: `scopedEvento` injeta `req.query.evento_id` como array quando o usuário tem múltiplos eventos. Os services precisam suportar array de IDs como filtro `WHERE evento_id IN [...]`.

PA-4: `GET /certificados` sem Bearer redireciona para SSR — pode surpreender clientes que esperam JSON.

PA-5: `SESSION_SECRET` deve ser configurado para SSR funcionar. A ausência causa erro na inicialização.

---

# Itens que Necessitam Validação Humana

VAL-1: **Lógica `req.usuario.id !== Number(id)` no controller.** Admin só gerencia usuários via API passando sua própria ID na rota. É intencional ou bug? Referência: `src/controllers/usuarioController.js`.

VAL-2: **Validação de `valores_dinamicos` em updates.** Os updates de certificado não revalidam os campos dinâmicos. É intencional (suportar atualizações parciais) ou falta de implementação?

VAL-3: **Contagem incremental do código de certificado.** O `count` inclui soft-deletados? Qual o comportamento esperado após restauração?

VAL-4: **Suporte a array de `evento_id` nos services.** Confirmar que `certificadoService`, `participanteService` e demais services suportam `WHERE evento_id IN [...]` corretamente.

---

# Melhorias Sugeridas

MS-1: Validar `valores_dinamicos` também em updates de certificados.

MS-2: Padronizar endpoint de criação de usuário via API para REST convencional.

MS-3: Adicionar `valores_dinamicos` ao schema Zod como `z.record(z.any()).optional()`.

MS-4: Rate limiting nas rotas públicas `/public/validar/:codigo` e `/public/certificados?email=...`.

MS-5: Refresh tokens JWT para melhorar experiência na SSR.

MS-6: Auditoria de ações — registrar quem emitiu, cancelou e editou certificados.

MS-7: Máquina de estados explícita para `status` do certificado.

MS-8: Importação em lote via CSV/XLSX com mapeamento para `valores_dinamicos`.
