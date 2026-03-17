# Especificação de Requisitos de Software (SRS)

**Sistema:** Certifique-me  
**Versão:** 1.0  
**Data:** 2026-03-14  
**Status:** Em desenvolvimento

---

# Visão Geral do Sistema

O **Certifique-me** é um sistema web de gestão e emissão de certificados digitais para eventos acadêmicos e técnicos. O sistema permite que organizadores de eventos criem e gerenciem certificados parametrizáveis para os participantes, com controle de acesso por perfil de usuário.

O público em geral pode consultar e validar certificados sem necessidade de autenticação. Usuários internos (gestores e monitores) operam dentro do escopo do evento ao qual estão vinculados, enquanto administradores têm acesso irrestrito a todos os recursos.

---

# Objetivos

- Centralizar a emissão e o gerenciamento de certificados digitais de eventos.
- Oferecer tipos de certificados parametrizáveis com campos dinâmicos e templates de texto.
- Garantir autenticidade e rastreabilidade dos certificados emitidos.
- Permitir controle de acesso granular por perfil de usuário (admin, gestor, monitor).
- Disponibilizar consulta e validação de certificados ao público sem necessidade de login.
- Suportar importação de dados de planilhas via mapeamento para `valores_dinamicos`.

---

# Stakeholders

| Stakeholder           | Papel no sistema                                                                      |
| --------------------- | ------------------------------------------------------------------------------------- |
| **Administrador**     | Gerencia todo o sistema: usuários, eventos, certificados e relatórios.                |
| **Gestor de Evento**  | Gerencia tipos de certificados, certificados e participantes de um evento específico. |
| **Monitor de Evento** | Insere dados de certificados de um evento específico.                                 |
| **Participante**      | Pessoa que recebe certificados; pode consultá-los publicamente pelo código ou ID.     |
| **Equipe técnica**    | Responsável pela implantação, manutenção e evolução do sistema.                       |

---

# Requisitos Funcionais

## Gestão de Participantes

FR-1: O sistema deve permitir criar, listar, atualizar e remover participantes (CRUD completo).  
FR-2: O campo `email` do participante deve ser único e ter formato válido.  
FR-3: O campo `nomeCompleto` do participante é obrigatório.  
FR-4: A remoção de participantes deve ser lógica (soft delete); os registros devem poder ser restaurados.

## Gestão de Eventos

FR-5: O sistema deve permitir criar, listar, atualizar e remover eventos (CRUD completo).  
FR-6: O campo `nome` do evento é obrigatório.  
FR-7: O campo `ano` do evento é obrigatório.  
FR-8: O campo `codigo_base` do evento é obrigatório, deve ser único e conter exatamente três letras alfabéticas (ex.: `EDU`, `CMP`, `OFC`).  
FR-9: A remoção de eventos deve ser lógica (soft delete); os registros devem poder ser restaurados.

## Gestão de Tipos de Certificados

FR-10: O sistema deve permitir criar, listar, atualizar e remover tipos de certificados (CRUD completo).  
FR-11: O campo `codigo` do tipo de certificado é obrigatório, deve ser único e conter exatamente duas letras alfabéticas (ex.: `PA`, `MC`, `OF`).  
FR-12: O campo `descricao` do tipo de certificado é obrigatório.  
FR-13: O campo `texto_base` é obrigatório e pode conter expressões de interpolação no formato `${nome_campo}`, que serão substituídas pelos valores correspondentes ao emitir um certificado (ex.: `"Certificamos que ${nome_completo} participou na condição de ${funcao}."`).  
FR-14: O campo `campo_destaque` é obrigatório e deve referenciar ou o campo `nome` do certificado ou uma chave presente em `dados_dinamicos` do mesmo tipo.  
FR-15: O campo `dados_dinamicos` (JSONB) define a estrutura dos campos específicos do tipo de certificado (ex.: palestrante, tema, duração).  
FR-16: A remoção de tipos de certificados deve ser lógica (soft delete); os registros devem poder ser restaurados.

## Gestão de Certificados

FR-17: O sistema deve permitir emitir, listar, atualizar, cancelar e restaurar certificados.  
FR-18: O campo `nome` do certificado é obrigatório.  
FR-19: O campo `status` do certificado deve ser restrito aos valores: `"emitido"`, `"pendente"` ou `"cancelado"`.  
FR-20: O campo `valores_dinamicos` (JSONB) armazena os valores dos campos definidos em `dados_dinamicos` do tipo de certificado associado.  
FR-21: Cada certificado deve estar associado a um participante (`participante_id`), um evento (`evento_id`) e um tipo de certificado (`tipo_certificado_id`).  
FR-22: A remoção de certificados deve ser lógica (soft delete); os registros devem poder ser restaurados.

FR-43: A geração do documento PDF do certificado só deve ser permitida se o certificado possuir um valor válido no campo `codigo`. Certificados sem código devem ser rejeitados na geração do documento.

## Consulta e Validação Pública de Certificados

FR-23: O sistema deve disponibilizar uma rota pública para visualizar ou validar um certificado específico pelo seu ID (`/certificado/:id`).  
FR-24: O sistema deve disponibilizar uma rota pública para validar um certificado por código (`/validar/:codigo`).  
FR-25: As rotas de consulta pública não devem exigir autenticação.

## Gestão de Usuários e Autenticação

FR-26: O sistema deve permitir criar, listar, atualizar e remover usuários (CRUD completo por admin).  
FR-27: O campo `email` do usuário deve ser único e ter formato válido.  
FR-28: O campo `perfil` do usuário deve ser restrito aos valores: `"admin"`, `"gestor"` ou `"monitor"`.  
FR-29: A senha do usuário deve ser armazenada como hash (bcrypt).  
FR-30: O sistema deve autenticar usuários via JWT, expondo endpoints de login e logout.  
FR-31: O endpoint `GET /me` deve retornar os dados do usuário autenticado.  
FR-32: Gestores e monitores devem estar vinculados a exatamente um evento (`evento_id`); administradores não possuem essa restrição.  
FR-33: A remoção de usuários deve ser lógica (soft delete); os registros devem poder ser restaurados.

## Controle de Acesso (RBAC)

FR-34: O perfil **admin** deve ter acesso irrestrito a todos os recursos do sistema.  
FR-35: O perfil **gestor** deve ter permissão para criar tipos de certificados (P1) e inserir/editar certificados (P2) dentro do seu evento.  
FR-36: O perfil **monitor** deve ter permissão apenas para inserir dados de certificados (P2) dentro do seu evento.  
FR-37: O middleware de escopo (`scopedEvento`) deve garantir que gestores e monitores operem exclusivamente dentro do evento ao qual estão vinculados.  
FR-38: Rotas administrativas devem ser protegidas por middleware de autenticação (`auth`) e de autorização (`rbac`).

## Geração de Texto do Certificado

FR-39: O sistema deve interpolar o `texto_base` do tipo de certificado com os `valores_dinamicos` do certificado para gerar o texto final do documento.

## Monitoramento e Operações

FR-40: O sistema deve expor um endpoint `GET /health` que retorne o status da aplicação e da conexão com o banco de dados.  
FR-41: Se o banco de dados estiver indisponível, o endpoint `/health` deve retornar HTTP 503 com `{ "status": "error", "db": "disconnected" }`.

---

# Requisitos Não Funcionais

NFR-1: **Segurança — Controle de Acesso:** Todas as rotas administrativas devem ser protegidas por autenticação JWT e verificação de perfil (OWASP A01).  
NFR-2: **Segurança — Armazenamento de Senhas:** Senhas devem ser armazenadas exclusivamente como hash bcrypt; texto plano nunca deve ser persistido (OWASP A02).  
NFR-3: **Segurança — Configuração:** Credenciais e segredos devem ser fornecidos via variáveis de ambiente; valores default inseguros não são permitidos (OWASP A05).  
NFR-4: **Confiabilidade — Soft Delete:** Nenhuma entidade principal (`participantes`, `eventos`, `certificados`, `tipos_certificados`, `usuarios`) deve ser removida permanentemente do banco de dados; todas devem suportar restauração.  
NFR-5: **Confiabilidade — Migrações:** O schema do banco de dados deve ser gerenciado exclusivamente via migrations Sequelize; o uso de `sync({ force: true })` em produção e testes é proibido.  
NFR-6: **Manutenibilidade — Arquitetura em Camadas:** O código deve seguir separação de responsabilidades: routes → controllers → services → models. Lógica de negócio não deve residir em rotas ou models.  
NFR-7: **Manutenibilidade — Carregamento Explícito de Modelos:** O arquivo `models/index.js` deve registrar modelos explicitamente, sem uso de `fs.readdirSync`.  
NFR-8: **Testabilidade:** O sistema deve possuir banco de dados PostgreSQL dedicado para testes, isolado do banco de desenvolvimento e produção.  
NFR-9: **Portabilidade:** A aplicação deve ser executável via Docker, com ambientes de produção e testes separados por arquivos `docker-compose` distintos.  
NFR-10: **Rastreabilidade:** Todas as entidades devem registrar timestamps de criação (`created_at`), atualização (`updated_at`) e remoção lógica (`deleted_at`).

---

# Funcionalidades do Sistema

## Gestão de Participantes

Permite o cadastro, consulta, atualização e remoção lógica de participantes. Um participante é identificado pelo e-mail único e pode estar associado a múltiplos certificados.

**Requisitos relacionados:** FR-1, FR-2, FR-3, FR-4

---

## Gestão de Eventos

Permite o cadastro e gerenciamento de eventos. Cada evento possui um código base de três letras que é utilizado na geração dos códigos de certificados.

**Requisitos relacionados:** FR-5, FR-6, FR-7, FR-8, FR-9

---

## Tipos de Certificados Parametrizáveis

Permite definir modelos de certificados com campos dinâmicos (JSONB) e templates de texto com interpolação de variáveis. Essa funcionalidade viabiliza a criação de certificados de diferentes naturezas (palestra, minicurso, oficina, etc.) sem alteração de código.

**Requisitos relacionados:** FR-10, FR-11, FR-12, FR-13, FR-14, FR-15, FR-16

---

## Emissão e Gestão de Certificados

Permite emitir certificados para participantes de um evento, associando-os a um tipo de certificado. Suporta ciclo de vida completo: pendente → emitido → cancelado, com possibilidade de restauração via soft delete.

**Requisitos relacionados:** FR-17, FR-18, FR-19, FR-20, FR-21, FR-22, FR-39

---

## Consulta e Validação Pública

Permite que qualquer pessoa (sem login) acesse e valide um certificado pelo ID ou pelo código, garantindo autenticidade do documento.

**Requisitos relacionados:** FR-23, FR-24, FR-25

---

## Autenticação e Gestão de Usuários

Gerencia o acesso ao sistema por meio de autenticação JWT. Suporta criação de usuários com diferentes perfis e vinculação de gestores/monitores a eventos específicos.

**Requisitos relacionados:** FR-26, FR-27, FR-28, FR-29, FR-30, FR-31, FR-32, FR-33

---

## Controle de Acesso por Perfil (RBAC)

Garante que cada perfil de usuário acesse apenas os recursos e operações para os quais tem permissão, por meio de middlewares de autenticação, autorização e escopo de evento.

**Requisitos relacionados:** FR-34, FR-35, FR-36, FR-37, FR-38

---

## Geração de Texto do Certificado

Interpola o template `texto_base` do tipo de certificado com os valores dinâmicos do certificado específico para produzir o texto final exibido no documento.

**Requisitos relacionados:** FR-39

---

## Monitoramento de Saúde da Aplicação

Expõe um endpoint `/health` para verificação do status da aplicação e da conectividade com o banco de dados.

**Requisitos relacionados:** FR-40, FR-41

---

# Papéis de Usuário

## Admin

- Acesso irrestrito a todos os recursos do sistema.
- Pode criar, editar e remover gestores, monitores e outros admins.
- Pode acessar e administrar todos os eventos.
- Não está vinculado a nenhum evento específico (`evento_id` nulo).

**Rotas exclusivas:**

| Rota                                 | Descrição                                |
| ------------------------------------ | ---------------------------------------- |
| `GET /admin/dashboard`               | Painel administrativo global             |
| `GET/POST /admin/usuarios`           | Gerenciar todos os usuários              |
| `GET/POST /admin/eventos`            | Gerenciar todos os eventos               |
| `GET/POST /admin/certificados`       | Gerenciar todos os certificados          |
| `GET/POST /admin/tipos-certificados` | Gerenciar todos os tipos de certificados |
| `GET /admin/relatorios`              | Visualizar relatórios e estatísticas     |

---

## Gestor

- Obrigado a efetuar login.
- Vinculado a exatamente um evento.
- **Permissão P1:** Criar e gerenciar tipos de certificados do seu evento.
- **Permissão P2:** Inserir e editar dados de certificados do seu evento.
- Pode gerenciar participantes e monitores do seu evento.

**Rotas disponíveis:**

| Rota                                            | Descrição                                         |
| ----------------------------------------------- | ------------------------------------------------- |
| `GET /dashboard`                                | Painel do evento                                  |
| `GET/POST /evento/:eventoId/tipos-certificados` | Gerenciar tipos de certificados (P1)              |
| `GET/POST /evento/:eventoId/certificados`       | Listar, criar, editar e deletar certificados (P2) |
| `GET/POST /evento/:eventoId/participantes`      | Gerenciar participantes                           |
| `GET/POST /evento/:eventoId/monitor`            | Gerenciar monitores e permissões                  |

---

## Monitor

- Obrigado a efetuar login.
- Vinculado a exatamente um evento.
- **Permissão P2 apenas:** Inserir dados de certificados do seu evento.
- Não pode criar tipos de certificados.
- Pode ter acesso de leitura a participantes (dependendo da configuração do gestor).

**Rotas disponíveis:**

| Rota                                  | Descrição                               |
| ------------------------------------- | --------------------------------------- |
| `POST /evento/:eventoId/certificados` | Inserir dados de certificados (P2)      |
| `GET /evento/:eventoId/participantes` | Visualizar participantes (se permitido) |

---

## Público (sem autenticação)

- Não precisa de login.
- Pode apenas consultar e validar certificados.

**Rotas disponíveis:**

| Rota                   | Descrição                                    |
| ---------------------- | -------------------------------------------- |
| `GET /certificado/:id` | Visualizar ou validar um certificado pelo ID |
| `GET /validar/:codigo` | Validar um certificado por código            |

---

# Modelo de Dados

## Entidades Principais

### `participantes`

| Campo          | Tipo           | Restrições                         |
| -------------- | -------------- | ---------------------------------- |
| `id`           | UUID / Integer | PK, obrigatório                    |
| `nomeCompleto` | String         | Obrigatório                        |
| `email`        | String         | Obrigatório, único, formato válido |
| `instituicao`  | String         | Opcional                           |
| `created_at`   | Timestamp      | Automático                         |
| `updated_at`   | Timestamp      | Automático                         |
| `deleted_at`   | Timestamp      | Soft delete (paranoid)             |

---

### `eventos`

| Campo         | Tipo           | Restrições                                          |
| ------------- | -------------- | --------------------------------------------------- |
| `id`          | UUID / Integer | PK, obrigatório                                     |
| `nome`        | String         | Obrigatório                                         |
| `ano`         | Integer        | Obrigatório                                         |
| `codigo_base` | String(3)      | Obrigatório, único, exatamente 3 letras alfabéticas |
| `created_at`  | Timestamp      | Automático                                          |
| `updated_at`  | Timestamp      | Automático                                          |
| `deleted_at`  | Timestamp      | Soft delete (paranoid)                              |

---

### `tipos_certificados`

| Campo             | Tipo           | Restrições                                                   |
| ----------------- | -------------- | ------------------------------------------------------------ |
| `id`              | UUID / Integer | PK, obrigatório                                              |
| `codigo`          | String(2)      | Obrigatório, único, exatamente 2 letras alfabéticas          |
| `descricao`       | String         | Obrigatório                                                  |
| `campo_destaque`  | String         | Obrigatório; deve ser `"nome"` ou chave de `dados_dinamicos` |
| `texto_base`      | Text           | Obrigatório; pode conter `${variavel}`                       |
| `dados_dinamicos` | JSONB          | Opcional; define campos específicos do tipo                  |
| `created_at`      | Timestamp      | Automático                                                   |
| `updated_at`      | Timestamp      | Automático                                                   |
| `deleted_at`      | Timestamp      | Soft delete (paranoid)                                       |

---

### `certificados`

| Campo                 | Tipo           | Restrições                                 |
| --------------------- | -------------- | ------------------------------------------ |
| `id`                  | UUID / Integer | PK, obrigatório                            |
| `participante_id`     | FK             | Referência a `participantes.id`            |
| `evento_id`           | FK             | Referência a `eventos.id`                  |
| `tipo_certificado_id` | FK             | Referência a `tipos_certificados.id`       |
| `nome`                | String         | Obrigatório                                |
| `status`              | Enum           | `"emitido"`, `"pendente"` ou `"cancelado"` |
| `valores_dinamicos`   | JSONB          | Valores dos campos de `dados_dinamicos`    |
| `created_at`          | Timestamp      | Automático                                 |
| `updated_at`          | Timestamp      | Automático                                 |
| `deleted_at`          | Timestamp      | Soft delete (paranoid)                     |

---

### `usuarios`

| Campo        | Tipo           | Restrições                                  |
| ------------ | -------------- | ------------------------------------------- |
| `id`         | UUID / Integer | PK, obrigatório                             |
| `nome`       | String         | Obrigatório                                 |
| `email`      | String         | Obrigatório, único, formato válido          |
| `senha`      | String         | Obrigatório; armazenado como hash bcrypt    |
| `perfil`     | Enum           | `"admin"`, `"gestor"` ou `"monitor"`        |
| `evento_id`  | FK             | Referência a `eventos.id`; nulo para admins |
| `created_at` | Timestamp      | Automático                                  |
| `updated_at` | Timestamp      | Automático                                  |
| `deleted_at` | Timestamp      | Soft delete (paranoid)                      |

---

## Relacionamentos

```
participantes  1 ──< N  certificados
eventos        1 ──< N  certificados
tipos_certificados  1 ──< N  certificados
eventos        1 ──< N  usuarios (gestor/monitor)
```

---

# Integrações Externas

Atualmente, o sistema não depende de APIs ou serviços externos.

| Integração             | Tipo                                 | Status |
| ---------------------- | ------------------------------------ | ------ |
| **PostgreSQL**         | Banco de dados relacional            | Em uso |
| **Docker**             | Containerização da aplicação e banco | Em uso |
| **JWT (jsonwebtoken)** | Autenticação stateless               | Em uso |
| **bcryptjs**           | Hash de senhas                       | Em uso |

> **Questão em aberto:** Geração de PDFs dos certificados foi mencionada como item planejado, porém nenhuma biblioteca foi especificada (ver seção [Questões em Aberto](#questões-em-aberto)).

---

# Restrições

- **Banco de dados:** O sistema usa exclusivamente PostgreSQL como banco relacional; outros SGBDs não são suportados.
- **Autenticação:** O sistema usa JWT stateless; não há suporte a sessões com armazenamento em servidor (ex.: Redis, sessões de banco).
- **Campos dinâmicos:** A estrutura dos campos dinâmicos é definida por tipo de certificado e não é validada em schema rígido — a consistência depende da aplicação.
- **Node.js:** O backend é construído sobre Node.js com Express; não há suporte a outros runtimes.
- **Soft delete:** A deleção permanente de registros não é suportada pela interface da aplicação.
- **Escopo de evento:** Gestores e monitores só podem operar dentro do evento ao qual estão vinculados — esse escopo é imposto por middleware e não pode ser contornado via parâmetros de rota.

---

# Premissas

- Usuários do tipo `admin` existem e são criados diretamente no banco (ou via seed/CLI), sem fluxo de cadastro público.
- Cada gestor e monitor está associado a exatamente um evento; não é esperado que um mesmo usuário gerencie múltiplos eventos simultaneamente.
- O código do certificado (`codigo_base` do evento + `codigo` do tipo + identificador) é suficiente para identificação única e validação pública.
- Dados importados de planilhas externas (ex.: listas de participação) são convertidos manualmente para registros no banco, com campos específicos mapeados para `valores_dinamicos`.
- O sistema não envia e-mails ou notificações — a distribuição dos certificados ocorre por meio de links ou busca direta na plataforma.

---

# Questões em Aberto

QA-1: **Geração de PDF:** Foi mencionada como funcionalidade planejada, mas nenhuma biblioteca foi especificada (ex.: Puppeteer, PDFKit, wkhtmltopdf). Como serão gerados os PDFs dos certificados?

QA-2: **Validação de `campo_destaque`:** A regra exige que `campo_destaque` referencie `"nome"` ou uma chave de `dados_dinamicos`. Como isso deve ser tratado quando `dados_dinamicos` for nulo ou vazio?

QA-3: **Cadastro de admin:** Não há rota pública de cadastro para admins. Qual é o mecanismo oficial para criar o primeiro admin? (seed, CLI, migration?)

QA-4: **Fluxo de transição de status do certificado:** As transições permitidas entre `"pendente"`, `"emitido"` e `"cancelado"` não estão especificadas. Qualquer transição é permitida, ou há uma máquina de estados?

QA-5: **Visibilidade do participante para monitor:** A especificação indica que o monitor pode visualizar participantes "se permitido". Qual é o critério ou mecanismo para liberar essa permissão?

QA-6: **Unicidade do código do certificado:** Como o código único de um certificado (para validação pública) é gerado? É uma combinação de `codigo_base` + `codigo` do tipo + `id`? Qual é o formato esperado?

QA-7: **Relatórios e estatísticas:** A rota `/admin/relatorios` está definida, mas o conteúdo dos relatórios não foi especificado. Quais métricas ou dados devem ser exibidos?

QA-8: **Views Handlebars:** O sistema usa `hbs` como template engine. Quais as views previstas além das de validação pública? Há um frontend completo em Handlebars ou a interface será majoritariamente via API?

---

# Melhorias Sugeridas

MS-1: **Máquina de estados para `status` do certificado:** Definir transições explícitas (ex.: `pendente → emitido`, `emitido → cancelado`) e validá-las no service, evitando transições inválidas.

MS-2: **Validação de `valores_dinamicos` contra `dados_dinamicos`:** Ao emitir um certificado, validar se os campos em `valores_dinamicos` correspondem aos campos definidos em `dados_dinamicos` do tipo de certificado associado.

MS-3: **Paginação nas listagens:** Rotas de listagem (participantes, certificados, eventos) devem suportar paginação para evitar sobrecarga em eventos com grande volume de registros.

MS-4: **Rate limiting nas rotas públicas:** Rotas de validação pública (`/validar/:codigo`, `/certificado/:id`) e de login deveriam ter limitação de requisições para mitigar ataques de enumeração e força bruta.

MS-5: **Expiração e renovação de tokens JWT:** Definir tempo de expiração do token e, opcionalmente, implementar refresh tokens para melhorar a segurança sem prejudicar a experiência do usuário.

MS-6: **Auditoria de ações:** Registrar em log quem emitiu, cancelou ou alterou cada certificado, com timestamp e usuário responsável, para fins de auditoria e rastreabilidade.

MS-7: **Importação em lote:** Criar um endpoint ou ferramenta para importação em massa de certificados a partir de planilhas (CSV/XLSX), mapeando colunas para `valores_dinamicos`.

MS-8: **Testes de integração de rotas protegidas:** Expandir a cobertura de testes para incluir cenários de autorização — tentativas de acesso com perfil insuficiente devem retornar HTTP 403.

---

# Funcionalidades Identificadas no Código

> Esta seção foi gerada por análise reversa do repositório em 2026-03-14 e descreve comportamentos implementados que não estavam documentados explicitamente no SRS original.

---

UF-1: **Relacionamento N:N entre Usuário e Evento via tabela de junção.**  
O modelo de dados original especificava `evento_id` como chave estrangeira simples na tabela `usuarios`. O código implementa uma relação muitos-para-muitos: um usuário pode ser associado a múltiplos eventos através da tabela de junção `usuario_eventos`.  
**Evidência:** `src/models/usuario.js` (`belongsToMany`), `src/models/usuario_eventos.js`, migration `20260313190000-create-usuario_eventos.js`, migration `20260313195000-remove-evento_id-from-usuarios.js`

---

UF-2: **Endpoint REST para associar/reatribuir eventos a um usuário.**  
Existe uma rota `PUT /usuarios/:id/eventos` que recebe um array de IDs de eventos e atualiza todas as associações do usuário de uma só vez. A rota valida duplicatas no array e a existência dos eventos antes de persistir.  
**Evidência:** `src/routes/usuarios.js`, `src/controllers/usuarioController.js` (`updateEventos`)

---

UF-3: **Documentação OpenAPI/Swagger disponível em tempo de execução.**  
A aplicação serve documentação interativa da API no endpoint `GET /api-docs`, gerada automaticamente a partir de anotações JSDoc nas rotas usando `swagger-jsdoc` e `swagger-ui-express`. Todos os recursos (participantes, eventos, certificados, tipos de certificados, usuários) estão documentados com schemas OpenAPI 3.0.  
**Evidência:** `app.js` (configuração do `swaggerJsdoc` e `swaggerUi`), comentários `@swagger` em todos os arquivos de rotas em `src/routes/`

---

UF-4: **Validação de corpo de requisição via Zod com retorno estruturado de erros.**  
Todas as rotas de escrita usam um middleware de validação baseado em Zod. Em caso de erro, a resposta retorna HTTP 400 com o payload `{ "error": "Erro de validação", "detalhes": [...] }`, onde `detalhes` é o array de erros do Zod com campo, mensagem e código.  
**Evidência:** `middleware/validate.js`, uso de `validate(schema)` nas rotas de `src/routes/`

---

UF-5: **Restrições mínimas de tamanho em campos de validação (não especificadas no SRS).**  
Os schemas Zod impõem comprimentos mínimos que nunca foram documentados:

- `nomeCompleto` (participante): mínimo 3 caracteres
- `nome` (evento, usuário, certificado): mínimo 3 caracteres
- `senha` (usuário): mínimo 6 caracteres
- `instituicao` (participante): mínimo 2 caracteres (quando fornecida)
- `ano` (evento): mínimo 2000

**Evidência:** `src/validators/participante.js`, `src/validators/evento.js`, `src/validators/usuario.js`, `src/validators/certificado.js`

---

UF-6: **Modelo de herança hierárquica de perfis no RBAC.**  
O middleware `rbac` não verifica permissões discretas por perfil; em vez disso, define uma hierarquia ordenada `['monitor', 'gestor', 'admin']` onde um perfil de rank superior tem acesso a tudo que um perfil inferior tem. Isso significa que gestores podem acessar rotas protegidas para monitor, e admins podem acessar rotas de gestor e monitor.  
**Evidência:** `src/middlewares/rbac.js` (array `roles`, comparação por índice)

---

UF-7: **O middleware `scopedEvento` injeta automaticamente o filtro de evento nas consultas GET.**  
Para gestores e monitores, requisições `GET` sem parâmetro de ID têm `req.query.evento_id` automaticamente preenchido com o `evento_id` do usuário autenticado, restringindo os resultados ao evento vinculado sem que o cliente precise informar o filtro explicitamente. Caso o cliente tente forçar um `evento_id` diferente na query string, a requisição é bloqueada com HTTP 403.  
**Evidência:** `src/middlewares/scopedEvento.js`

---

UF-8: **Autenticação valida a existência do usuário no banco a cada requisição.**  
O middleware `auth` não apenas verifica a assinatura e a expiração do JWT — ele também consulta o banco de dados para confirmar que o usuário ainda existe. Isso garante que tokens de usuários removidos (soft deleted) sejam rejeitados imediatamente, sem necessidade de aguardar a expiração do token.  
**Evidência:** `middleware/auth.js` (`Usuario.findByPk(decoded.id)`)

---

UF-9: **JWT com expiração fixa de 1 hora.**  
Os tokens JWT emitidos no login têm expiração hardcoded de `1h`. Não há suporte a refresh token.  
**Evidência:** `src/controllers/usuarioController.js` (`expiresIn: '1h'`)

---

UF-10: **Exclusão lógica em cascata de associações `usuario_eventos` ao deletar evento.**  
O `eventoService.delete()` realiza soft delete do evento e, em seguida, executa `UsuarioEvento.update({ deleted_at: new Date() }, ...)` para marcar como deletadas todas as associações de usuários com aquele evento.  
**Evidência:** `src/services/eventoService.js` (método `delete`)

---

UF-11: **Formato de interpolação do `templateService` diverge da especificação.**  
O `templateService` usa a sintaxe `{{variavel}}` (duplas chaves) para interpolação do `texto_base`, enquanto a especificação original descreve a sintaxe `${variavel}`.  
**Evidência:** `src/services/templateService.js` (`/\{\{(\w+)\}\}/g`)

---

UF-12: **Criação de usuário via `POST /usuarios` não exige autenticação.**  
A rota de criação de usuários não passa pelo middleware `auth` nem pelo `rbac`, tornando o endpoint público. Qualquer pessoa pode criar um usuário com qualquer perfil, incluindo `admin`.  
**Evidência:** `src/routes/usuarios.js` (`router.post('/', validate(usuarioSchema), usuarioController.create)` — sem `auth` ou `rbac`)

---

UF-13: **`valores_dinamicos` ausente no schema de validação do certificado.**  
O Zod schema de `certificado` não inclui o campo `valores_dinamicos`, que é parte central da funcionalidade de campos dinâmicos. O campo pode ser enviado livremente no body sem validação de estrutura.  
**Evidência:** `src/validators/certificado.js`

---

UF-14: **Inconsistência nos segredos JWT entre `auth.js` e `usuarioController.js`.**  
O middleware `auth.js` usa `process.env.JWT_SECRET || 'segredo-super-seguro'`, enquanto `usuarioController.js` usa `process.env.JWT_SECRET || 'secret'`. Se `JWT_SECRET` não estiver definido, o token será assinado com `'secret'` mas verificado com `'segredo-super-seguro'`, causando falha de autenticação em todos os logins.  
**Evidência:** `middleware/auth.js` (linha 4), `src/controllers/usuarioController.js` (linha 5)

---

# Possíveis Lacunas na Especificação

LAC-1: **Modelo de associação Usuário–Evento não documentado.**  
O SRS descreve `evento_id` como chave estrangeira simples em `usuarios`, mas o código implementa N:N via `usuario_eventos`. A especificação não menciona a tabela de junção, o endpoint `PUT /usuarios/:id/eventos`, nem a possibilidade de um usuário gerenciar múltiplos eventos.  
**Relacionado a:** UF-1, UF-2

LAC-2: **Documentação Swagger/OpenAPI não mencionada.**  
A existência de documentação interativa em `/api-docs` não está descrita em nenhuma seção do SRS, incluindo a seção de rotas ou integrações.  
**Relacionado a:** UF-3

LAC-3: **Regras de comprimento mínimo de campos ausentes.**  
O SRS descreve os campos e seus tipos, mas omite todas as restrições de comprimento mínimo aplicadas pelos validadores Zod. Isso cria divergência entre especificação e implementação.  
**Relacionado a:** UF-5

LAC-4: **Comportamento de herança de perfis no RBAC não especificado.**  
O SRS descreve permissões discretas por perfil (admin, gestor, monitor), mas não define se os perfis são hierárquicos. O código implementa herança ascendente, o que implica que gestores podem exercer todas as ações de monitores e admins podem exercer todas as ações de gestores.  
**Relacionado a:** UF-6

LAC-5: **Filtragem automática por evento nas listagens não documentada.**  
O comportamento do `scopedEvento` de injetar automaticamente o filtro de evento nas consultas GET é uma regra de negócio relevante que não consta na especificação.  
**Relacionado a:** UF-7

LAC-6: **Tempo de expiração do token JWT não especificado.**  
O SRS menciona autenticação JWT, mas não define a duração de validade do token.  
**Relacionado a:** UF-9

LAC-7: **Cascade de soft delete ao remover evento não documentado.**  
O SRS não menciona o que ocorre com as associações de usuários quando um evento é removido.  
**Relacionado a:** UF-10

LAC-8: **Sintaxe de interpolação do `texto_base` não corresponde ao código.**  
O SRS usa `${variavel}` como exemplo, mas o código usa `{{variavel}}`. A sintaxe oficial não está definida.  
**Relacionado a:** UF-11

LAC-9: **Criação de usuário admin é pública e irrestrita.**  
Não há especificação sobre como o primeiro admin deve ser criado, e o código não restringe a criação de usuários por perfil, permitindo que qualquer pessoa crie um admin via API.  
**Relacionado a:** UF-12, QA-3 (Questões em Aberto)

---

# Inconsistências Detectadas

INC-1: **`evento_id` vs. N:N — modelo de dados divergente.**

- **Especificação:** Tabela `usuarios` possui campo `evento_id` (FK simples) — um usuário pertence a um evento.
- **Código:** Não há `evento_id` em `usuarios`; a associação é feita via tabela `usuario_eventos` (N:N) — um usuário pode pertencer a múltiplos eventos.

INC-2: **Sintaxe de interpolação do `texto_base`.**

- **Especificação:** Exemplo usa `${nome_completo}`, sugerindo template literals estilo ES6.
- **Código:** `templateService.js` usa regex `\{\{(\w+)\}\}`, ou seja, sintaxe `{{nome_completo}}` (estilo Mustache/Handlebars).

INC-3: **Segredos JWT inconsistentes entre módulos.**

- **`middleware/auth.js`:** Fallback é `'segredo-super-seguro'`.
- **`src/controllers/usuarioController.js`:** Fallback é `'secret'`.
- Se `JWT_SECRET` não estiver definido no ambiente, tokens serão assinados e verificados com segredos diferentes, quebrando toda autenticação.

INC-4: **Criação de usuário não protegida por autenticação.**

- **Especificação:** Perfil admin gerencia todos os usuários (criação inclusa), implicando que criação de usuários é uma operação restrita.
- **Código:** `POST /usuarios` não possui middleware `auth` ou `rbac` — qualquer requisição pode criar usuários com qualquer perfil.

INC-5: **`valores_dinamicos` ausente no validator de certificado.**

- **Especificação:** `valores_dinamicos` é descrito como campo central para armazenar os dados dinâmicos de um certificado.
- **Código:** O Zod schema em `src/validators/certificado.js` não inclui `valores_dinamicos`, tornando o campo invisível para a camada de validação.

INC-6: **Rota `GET /eventos` exige autenticação; especificação não deixa isso claro.**

- **Especificação:** A especificação lista rotas públicas apenas para `/certificado/:id` e `/validar/:codigo`, mas não explicita se listagem de eventos é pública ou protegida.
- **Código:** `GET /eventos` usa middleware `auth` + `rbac('monitor')` + `scopedEvento`, sendo portanto uma rota protegida.

---

# Recomendações de Atualização da Especificação

REC-1: **Atualizar o Modelo de Dados — substituir `evento_id` em `usuarios` pela tabela de junção `usuario_eventos`.**  
Adicionar a entidade `usuario_eventos` com os campos `usuario_id`, `evento_id` e soft delete. Remover `evento_id` da tabela `usuarios`. Documentar o endpoint `PUT /usuarios/:id/eventos`.

REC-2: **Documentar o endpoint `GET /api-docs`** na seção de Integrações ou em uma nova seção "Documentação da API", incluindo que é gerado automaticamente a partir das anotações `@swagger` nas rotas.

REC-3: **Adicionar restrições de comprimento mínimo** na seção de Modelo de Dados e/ou nos Requisitos Funcionais, conforme os validators Zod:

- `nomeCompleto`, `nome`: ≥ 3 caracteres
- `senha`: ≥ 6 caracteres
- `instituicao`: ≥ 2 caracteres (quando informada)
- `ano`: ≥ 2000

REC-4: **Documentar o modelo de herança de perfis no RBAC** — esclarecer que admin ≥ gestor ≥ monitor em termos de permissões e que não se trata de permissões discretas e isoladas.

REC-5: **Padronizar e documentar a sintaxe de interpolação do `texto_base`** — definir oficialmente se usa `${variavel}` ou `{{variavel}}` e atualizar tanto o código quanto a especificação para usar o mesmo formato.

REC-6: **Corrigir a inconsistência nos segredos JWT** — garantir que `auth.js` e `usuarioController.js` usem a mesma variável de ambiente e o mesmo fallback (ou, preferencialmente, nenhum fallback, lançando erro explícito se `JWT_SECRET` não estiver definido).

REC-7: **Proteger `POST /usuarios` com autenticação e RBAC** — apenas admins devem poder criar usuários com qualquer perfil; ou definir explicitamente na especificação qual é o fluxo de cadastro público (se existir).

REC-8: **Adicionar `valores_dinamicos` ao schema Zod do certificado** — incluir validação do campo na criação e atualização de certificados, definindo o tipo esperado (`object` ou `record`).

REC-9: **Documentar o comportamento de cascade no soft delete de eventos** — incluir na especificação que ao deletar um evento, as associações em `usuario_eventos` também são marcadas como deletadas.

REC-10: **Documentar o tempo de expiração do JWT** (`1h`) como requisito funcional ou não funcional, e avaliar a necessidade de refresh tokens (ver MS-5).
