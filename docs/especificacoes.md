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

| Stakeholder | Papel no sistema |
|---|---|
| **Administrador** | Gerencia todo o sistema: usuários, eventos, certificados e relatórios. |
| **Gestor de Evento** | Gerencia tipos de certificados, certificados e participantes de um evento específico. |
| **Monitor de Evento** | Insere dados de certificados de um evento específico. |
| **Participante** | Pessoa que recebe certificados; pode consultá-los publicamente pelo código ou ID. |
| **Equipe técnica** | Responsável pela implantação, manutenção e evolução do sistema. |

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

| Rota | Descrição |
|---|---|
| `GET /admin/dashboard` | Painel administrativo global |
| `GET/POST /admin/usuarios` | Gerenciar todos os usuários |
| `GET/POST /admin/eventos` | Gerenciar todos os eventos |
| `GET/POST /admin/certificados` | Gerenciar todos os certificados |
| `GET/POST /admin/tipos-certificados` | Gerenciar todos os tipos de certificados |
| `GET /admin/relatorios` | Visualizar relatórios e estatísticas |

---

## Gestor

- Obrigado a efetuar login.
- Vinculado a exatamente um evento.
- **Permissão P1:** Criar e gerenciar tipos de certificados do seu evento.
- **Permissão P2:** Inserir e editar dados de certificados do seu evento.
- Pode gerenciar participantes e monitores do seu evento.

**Rotas disponíveis:**

| Rota | Descrição |
|---|---|
| `GET /dashboard` | Painel do evento |
| `GET/POST /evento/:eventoId/tipos-certificados` | Gerenciar tipos de certificados (P1) |
| `GET/POST /evento/:eventoId/certificados` | Listar, criar, editar e deletar certificados (P2) |
| `GET/POST /evento/:eventoId/participantes` | Gerenciar participantes |
| `GET/POST /evento/:eventoId/monitor` | Gerenciar monitores e permissões |

---

## Monitor

- Obrigado a efetuar login.
- Vinculado a exatamente um evento.
- **Permissão P2 apenas:** Inserir dados de certificados do seu evento.
- Não pode criar tipos de certificados.
- Pode ter acesso de leitura a participantes (dependendo da configuração do gestor).

**Rotas disponíveis:**

| Rota | Descrição |
|---|---|
| `POST /evento/:eventoId/certificados` | Inserir dados de certificados (P2) |
| `GET /evento/:eventoId/participantes` | Visualizar participantes (se permitido) |

---

## Público (sem autenticação)

- Não precisa de login.
- Pode apenas consultar e validar certificados.

**Rotas disponíveis:**

| Rota | Descrição |
|---|---|
| `GET /certificado/:id` | Visualizar ou validar um certificado pelo ID |
| `GET /validar/:codigo` | Validar um certificado por código |

---

# Modelo de Dados

## Entidades Principais

### `participantes`

| Campo | Tipo | Restrições |
|---|---|---|
| `id` | UUID / Integer | PK, obrigatório |
| `nomeCompleto` | String | Obrigatório |
| `email` | String | Obrigatório, único, formato válido |
| `instituicao` | String | Opcional |
| `created_at` | Timestamp | Automático |
| `updated_at` | Timestamp | Automático |
| `deleted_at` | Timestamp | Soft delete (paranoid) |

---

### `eventos`

| Campo | Tipo | Restrições |
|---|---|---|
| `id` | UUID / Integer | PK, obrigatório |
| `nome` | String | Obrigatório |
| `ano` | Integer | Obrigatório |
| `codigo_base` | String(3) | Obrigatório, único, exatamente 3 letras alfabéticas |
| `created_at` | Timestamp | Automático |
| `updated_at` | Timestamp | Automático |
| `deleted_at` | Timestamp | Soft delete (paranoid) |

---

### `tipos_certificados`

| Campo | Tipo | Restrições |
|---|---|---|
| `id` | UUID / Integer | PK, obrigatório |
| `codigo` | String(2) | Obrigatório, único, exatamente 2 letras alfabéticas |
| `descricao` | String | Obrigatório |
| `campo_destaque` | String | Obrigatório; deve ser `"nome"` ou chave de `dados_dinamicos` |
| `texto_base` | Text | Obrigatório; pode conter `${variavel}` |
| `dados_dinamicos` | JSONB | Opcional; define campos específicos do tipo |
| `created_at` | Timestamp | Automático |
| `updated_at` | Timestamp | Automático |
| `deleted_at` | Timestamp | Soft delete (paranoid) |

---

### `certificados`

| Campo | Tipo | Restrições |
|---|---|---|
| `id` | UUID / Integer | PK, obrigatório |
| `participante_id` | FK | Referência a `participantes.id` |
| `evento_id` | FK | Referência a `eventos.id` |
| `tipo_certificado_id` | FK | Referência a `tipos_certificados.id` |
| `nome` | String | Obrigatório |
| `status` | Enum | `"emitido"`, `"pendente"` ou `"cancelado"` |
| `valores_dinamicos` | JSONB | Valores dos campos de `dados_dinamicos` |
| `created_at` | Timestamp | Automático |
| `updated_at` | Timestamp | Automático |
| `deleted_at` | Timestamp | Soft delete (paranoid) |

---

### `usuarios`

| Campo | Tipo | Restrições |
|---|---|---|
| `id` | UUID / Integer | PK, obrigatório |
| `nome` | String | Obrigatório |
| `email` | String | Obrigatório, único, formato válido |
| `senha` | String | Obrigatório; armazenado como hash bcrypt |
| `perfil` | Enum | `"admin"`, `"gestor"` ou `"monitor"` |
| `evento_id` | FK | Referência a `eventos.id`; nulo para admins |
| `created_at` | Timestamp | Automático |
| `updated_at` | Timestamp | Automático |
| `deleted_at` | Timestamp | Soft delete (paranoid) |

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

| Integração | Tipo | Status |
|---|---|---|
| **PostgreSQL** | Banco de dados relacional | Em uso |
| **Docker** | Containerização da aplicação e banco | Em uso |
| **JWT (jsonwebtoken)** | Autenticação stateless | Em uso |
| **bcryptjs** | Hash de senhas | Em uso |

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

