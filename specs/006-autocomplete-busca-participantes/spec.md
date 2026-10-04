# Feature Specification: Autocomplete e Busca em Tempo Real de Participantes

> Idioma obrigatório para este artefato: português brasileiro (pt-BR), com ortografia oficial, acentuação e cedilha preservadas.

**Feature Branch**: `006-autocomplete-busca-participantes`  
**Created**: 2026-10-03  
**Status**: Draft  
**Input**: Substituição do elemento `<select>` de participantes por um campo de busca com autocomplete em tempo real, filtragem no banco por nome/e-mail, debounce de digitação, limite de 5 resultados e manutenção da compatibilidade com o campo `participante_id` no formulário.

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Autocomplete e Busca em Tempo Real por Nome ou E-mail (Priority: P1) 🎯 MVP

Como usuário autorizado (administrador, gestor ou monitor de evento) preenchendo um formulário (ex.: emissão ou edição de certificados), eu preciso digitar parte do nome ou e-mail de um participante para visualizar rapidamente até 5 opções refinadas trazidas em tempo real do banco de dados, sem carregar listas extensas estáticas e sem sobrecarregar o servidor com requisições excessivas a cada tecla.

**Why this priority**: Substitui o `<select>` tradicional de mais de 100 itens por uma interface moderna e rápida, resolvendo diretamente a reclamação de usabilidade trazida pelos usuários e garantindo que a lista retornada seja filtrada e ordenada alfabeticamente.

**Independent Test**:

1. Acessar o formulário de cadastro de certificado (`/admin/certificados/novo`).
2. Digitar apenas 1 caractere (ex.: `a`) no campo de participante e confirmar que **nenhuma** requisição ao servidor é disparada e o dropdown permanece fechado.
3. Digitar 2 ou mais caracteres (ex.: `adr` ou `gmail.com`).
4. Verificar se após o intervalo de debounce (~250-300ms) o frontend dispara uma requisição `GET /admin/participantes/busca?q=adr` e renderiza um dropdown contendo no máximo 5 participantes correspondentes no formato `Nome — e-mail`, ordenados alfabeticamente por nome.

**Acceptance Scenarios**:

1. **Given** um formulário com seleção de participante inicialmente limpo, **When** o campo é exibido, **Then** o campo de busca está vazio ou com placeholder `Digite nome ou e-mail...`, e **nenhuma** opção é exibida antes da digitação.
2. **Given** que o usuário digita menos de 2 caracteres, **When** a digitação ocorre, **Then** o sistema não dispara consulta ao servidor e não exibe dropdown.
3. **Given** que o usuário digita 2 ou mais caracteres (ex.: `"adri"`), **When** ele pausa a digitação por mais de 300ms (debounce), **Then** o servidor executa a busca por `nomeCompleto` ou `email` e o frontend exibe no máximo 5 resultados correspondentes.
4. **Given** uma digitação rápida e contínua de caracteres ("a", "ad", "adr", "adri", "adrian"), **When** as teclas são pressionadas em rápida sucessão, **Then** o debounce cancela/evita as buscas intermediárias e executa apenas a consulta correspondente ao termo final `"adrian"`.

---

### User Story 2 - Seleção do Participante e Manutenção da Compatibilidade de Formulário (Priority: P2)

Como usuário do sistema, quando eu escolher um participante na lista do autocomplete (via clique de mouse ou tecla Enter), eu preciso que o campo exiba claramente o participante selecionado e que o ID correspondente seja associado a um campo oculto (`participante_id`), para que a submissão tradicional do formulário (POST) continue enviando exatamente o ID esperado pelo backend.

**Why this priority**: Garante total compatibilidade regressiva com a arquitetura SSR e com os controllers existentes do CertificaAqui, dispensando alterações na lógica de criação/atualização de certificados.

**Independent Test**:

1. Buscar um participante no autocomplete e clicar sobre o resultado desejado.
2. Inspecionar o formulário e verificar que o elemento `<input type="hidden" name="participante_id">` teve seu valor atualizado para o ID do participante selecionado (ex.: `value="1"`).
3. Submeter o formulário de certificado e verificar se o backend recebe `participante_id = 1` e cria/atualiza o certificado com sucesso.
4. Testar também o modo de edição (`/admin/certificados/:id/editar`), verificando se o campo autocomplete já inicia preenchido com o texto do participante vinculado e seu ID no input oculto.

**Acceptance Scenarios**:

1. **Given** o dropdown com os resultados de busca exibidos, **When** o usuário clica em um item (ex.: `Adriana — adriana@gmail.com`), **Then** o texto do campo de busca é atualizado com o rótulo do participante, o campo oculto `participante_id` recebe o ID correspondente e o dropdown fecha.
2. **Given** um participante já selecionado no campo, **When** o usuário clica no botão de limpar (`×`) ou apaga o texto do campo, **Then** o campo oculto `participante_id` é redefinido para vazio (`""`).
3. **Given** a página de edição de certificado existente, **When** o formulário é carregado, **Then** o componente de autocomplete inicializa preenchido com o rótulo do participante atual e o `participante_id` correto no input oculto.

---

### User Story 3 - Indicador de Limite de Resultados e Navegação Acessível por Teclado (Priority: P3)

Como usuário realizando buscas genéricas ou navegando primariamente pelo teclado, eu preciso ver um aviso quando a busca retornar mais do que 5 resultados e ser capaz de navegar entre as opções utilizando as setas (`↑`/`↓`), selecionar com `Enter` e fechar com `Esc`.

**Why this priority**: Melhora a usabilidade, acessibilidade e dá um feedback claro de que o usuário precisa continuar digitando para refinar buscas amplas.

**Independent Test**:

1. Digitar um termo comum que possua mais de 5 correspondências no banco (ex.: `"ana"`).
2. Verificar se o dropdown exibe exatamente os 5 primeiros participantes ordenados alfabeticamente e, logo abaixo, a mensagem: `"Mais de 5 resultados. Continue digitando para refinar."`.
3. Pressionar as teclas `Seta para Baixo` (`ArrowDown`) e `Seta para Cima` (`ArrowUp`) para alternar a seleção visual dos itens.
4. Pressionar `Enter` para confirmar a seleção do item em destaque ou `Esc` para fechar o dropdown sem alterar a seleção anterior.

**Acceptance Scenarios**:

1. **Given** uma busca que produz mais de 5 resultados no banco de dados, **When** o dropdown é renderizado, **Then** são exibidos os 5 primeiros resultados alfabéticos seguidos da mensagem de rodapé `Mais de 5 resultados. Continue digitando para refinar.`.
2. **Given** um termo de busca que não encontre nenhum participante no banco, **When** o resultado é retornado, **Then** o dropdown exibe a mensagem `Nenhum participante encontrado.`.
3. **Given** o dropdown aberto com sugestões, **When** o usuário utiliza as teclas `ArrowDown` ou `ArrowUp`, **Then** o foco visual percorre os itens sequencialmente; **When** pressiona `Enter`, **Then** o item focado é selecionado; **When** pressiona `Esc`, **Then** o dropdown se fecha.

---

### Edge Cases

- **Nenhum resultado encontrado**: Exibir a mensagem informativa `"Nenhum participante encontrado."` sem permitir a seleção de itens inválidos.
- **Falha de rede / erro no servidor (500, timeout)**: Exibir uma mensagem sutil `"Erro ao buscar participantes. Tente novamente."` no dropdown.
- **Submissão com campo obrigatório vazio**: Como o input oculto `<input type="hidden" name="participante_id" required>` mantém o atributo `required`, se o usuário tentar enviar o formulário sem selecionar um participante válido da lista, a validação nativa do navegador/formulário impedirá o envio.
- **Escopo Global de Busca (Lookup)**: Visto que participantes são entidades globais no sistema (FR-58), a busca por autocomplete é de âmbito global (`Participante.findAll`), permitindo que qualquer participante cadastrado na base de dados do sistema possa ser pesquisado e selecionado para emissão de certificado por administradores, gestores ou monitores.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST disponibilizar o endpoint `GET /admin/participantes/busca` que aceita o parâmetro de consulta `q` (ex.: `?q=texto`).
- **FR-002**: O endpoint MUST filtrar participantes no banco de dados onde `nomeCompleto` contenha `q` OU `email` contenha `q`, ignorando diferenças entre maiúsculas e minúsculas (`ILIKE` ou `LOWER`).
- **FR-003**: O endpoint MUST ordenar os resultados encontrados alfabeticamente pelo campo `nomeCompleto` em ordem ascendente (`ORDER BY nomeCompleto ASC`).
- **FR-004**: O endpoint MUST limitar o número de registros retornados no array principal a 5 itens (`limit: 5`), e retornar uma propriedade booleana `hasMore` indicando se há mais de 5 resultados correspondentes.
- **FR-005**: O endpoint MUST realizar busca global na tabela de participantes (`Participante`), permitindo que qualquer usuário autenticado com permissão (admin, gestor ou monitor) localize qualquer participante previamente cadastrado no sistema (conforme FR-58 e FR-59), possibilitando a seleção e o vínculo sem duplicação de cadastros.
- **FR-006**: As visões SSR Handlebars com seleção de participante (ex.: `views/admin/certificados/form.hbs`) MUST substituir o elemento `<select name="participante_id">` por um componente de Autocomplete de busca em tempo real.
- **FR-007**: O componente no frontend MUST exigir um mínimo de 2 caracteres digitados no campo antes de disparar qualquer requisição AJAX.
- **FR-008**: O componente no frontend MUST implementar um _debounce_ configurado entre 250ms e 300ms na captura da digitação do usuário.
- **FR-009**: O componente MUST manter sincronizado o campo `<input type="hidden" name="participante_id">`, de forma que a submissão do formulário continue enviando o ID do participante selecionado (`req.body.participante_id`).
- **FR-010**: O componente MUST exibir no dropdown no máximo 5 itens com o formato `Nome — e-mail` e, quando `hasMore` for verdadeiro, exibir no rodapé a mensagem: `Mais de 5 resultados. Continue digitando para refinar.`.
- **FR-011**: O componente MUST oferecer suporte completo a atalhos de teclado: `ArrowDown` e `ArrowUp` para navegação, `Enter` para seleção, `Esc` para fechar o dropdown, e um botão visual para limpar a seleção atual.
- **FR-012**: Em telas de edição (onde o recurso já possui um `participante_id` vinculado), a tela MUST inicializar o componente preenchido com os dados do participante (nome e e-mail) e o ID no input oculto.

### Non-Functional & Architecture Requirements

- **NFR-001**: **Arquitetura Leve no Frontend**: O componente de autocomplete deve ser desenvolvido em Vanilla JavaScript modular (ex.: `public/js/autocomplete-participante.js`), sem adicionar dependências pesadas de frameworks (como React ou Vue).
- **NFR-002**: **Filtragem Eficiente no Banco de Dados**: A filtragem e a limitação DEVEM ocorrer inteiramente via SQL no banco de dados (`WHERE` + `ORDER BY` + `LIMIT`), e NUNCA trazendo todos os registros para memória do Node.js para filtrar no JavaScript.
- **NFR-003**: **Compatibilidade e Paridade de API**: A submissão do formulário no servidor (`POST /admin/certificados`) NÃ﻿O deve sofrer alterações em sua interface ou contrato de entrada.
- **NFR-004**: **Acessibilidade e Experiência do Usuário (UX)**: O dropdown deve seguir boas práticas de acessibilidade (gerenciando visibilidade, classes de foco e mensagens de instrução de busca).

---

## Data Model & Architecture Changes

### Endpoint da API de Busca

```text
GET /admin/participantes/busca?q={termo}
```

#### Resposta HTTP 200 OK (JSON)

```json
{
  "results": [
    {
      "id": 1,
      "nomeCompleto": "Adriana Silva",
      "email": "adriana@gmail.com"
    },
    {
      "id": 2,
      "nomeCompleto": "Agata Rocha",
      "email": "agata@gmail.com"
    }
  ],
  "hasMore": true
}
```

---

### Estrutura dos Componentes de Interface (Handlebars / HTML)

Substituição do antigo `<select>` no arquivo `views/admin/certificados/form.hbs`:

```html
<div class="mb-3 position-relative autocomplete-participante">
  <label class="form-label">Participante</label>
  <input
    type="hidden"
    name="participante_id"
    id="participante_id"
    value="{{certificado.participante_id}}"
    required
  />
  <div class="input-group">
    <input
      type="text"
      id="participante_busca"
      class="form-control"
      placeholder="Digite nome ou e-mail..."
      value="{{#if certificado.participante}}{{certificado.participante.nomeCompleto}} — {{certificado.participante.email}}{{/if}}"
      autocomplete="off"
    />
    <button
      type="button"
      class="btn btn-outline-secondary"
      id="btn_limpar_participante"
      style="display:none;"
    >
      &times;
    </button>
  </div>
  <div
    id="participante_dropdown"
    class="dropdown-menu w-100 shadow-sm mt-1"
    style="display:none;"
  ></div>
</div>
```

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: O tempo de resposta da busca de participantes pelo endpoint `GET /admin/participantes/busca` é inferior a 100ms para bases de até 10.000 participantes.
- **SC-002**: Redução do payload HTML renderizado pelo servidor no formulário de certificados em formulários com centenas de participantes (não é mais necessário carregar a lista inteira no HTML da página).
- **SC-003**: 100% das submissões de formulários mantêm o contrato `participante_id`, permitindo criar e editar certificados sem regressões nos testes de controller/integração.
- **SC-004**: Usuários conseguem encontrar e selecionar qualquer participante em até 3 segundos via digitação de parte do nome ou e-mail.

---

## Assumptions

- O projeto utiliza a arquitetura SSR (Express + Handlebars) e o banco PostgreSQL gerido pelo Sequelize ORM.
- O campo de participante continuará sendo obrigatório nos formulários em que o antigo `<select>` possuía a flag `required`.
- Em telas onde já se conhece o participante vinculado (edição de certificado), o controller SSR passará o objeto do participante associado para permitir o pré-preenchimento correto da interface.
