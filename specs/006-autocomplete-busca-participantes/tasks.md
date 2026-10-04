# Tasks: Autocomplete e Busca em Tempo Real de Participantes

> Idioma obrigatório para este artefato: português brasileiro (pt-BR).

**Input**: Artefatos de especificação de `/specs/006-autocomplete-busca-participantes/spec.md`

---

## Phase 1: Endpoint de Busca e Lógica no Backend

- [ ] **T001**: Criar o método de busca no controller SSR `participanteSSRController.buscar` ou service equivalente:
  - Receber query param `q`.
  - Aplicar filtro de 2+ caracteres minimum (retornar array vazio se < 2).
  - Executar consulta via Sequelize utilizando `Op.or` com `Op.iLike` (ou equivalência insensível a maiúsculas) para `nomeCompleto` e `email`.
  - Ordenar alfabeticamente por `nomeCompleto ASC`.
  - Buscar até 6 registros (`limit: 6`), derivando `results` (primeiros 5 registros) e `hasMore = total > 5`.
  - Realizar busca de escopo global na tabela de participantes (`Participante`), permitindo o lookup de qualquer participante cadastrado na base (FR-58).
- [ ] **T002**: Registrar a rota `GET /admin/participantes/busca` em `src/routes/admin.js` protegida por autenticação SSR.

---

## Phase 2: Componente Frontend (JS) e Integração com Handlebars

- [ ] **T003**: Criar o script vanilla JS `public/js/autocomplete-participante.js`:
  - Capturar evento `input` no campo de busca com tempo de debounce (~250-300ms).
  - Validar mínimo de 2 caracteres antes do `fetch('/admin/participantes/busca?q=...')`.
  - Renderizar o dropdown com até 5 itens (`Nome — e-mail`) e exibir rodapé `"Mais de 5 resultados..."` quando `hasMore === true`.
  - Atualizar o valor do `<input type="hidden" name="participante_id">` ao selecionar um participante.
  - Exibir botão de limpar (`×`) e permitir redefinir o campo.
  - Implementar suporte a teclado (`ArrowDown`, `ArrowUp`, `Enter`, `Esc`).
- [ ] **T004**: Atualizar as visões Handlebars (como `views/admin/certificados/form.hbs` e edições correspondentes):
  - Substituir o `<select name="participante_id">` pela estrutura HTML do autocomplete.
  - Incluir o script `autocomplete-participante.js` na página.
  - Garantir pré-preenchimento correto em formulários de edição.

---

## Phase 3: Testes Unitários e de Integração

- [ ] **T005**: Criar testes para o endpoint `GET /admin/participantes/busca`:
  - Testar busca por termo presente em `nomeCompleto`.
  - Testar busca por termo presente em `email`.
  - Testar ordenação alfabética e limite de 5 resultados com a flag `hasMore`.
  - Testar permissão de busca global por gestores, monitores e admins (lookup).
- [ ] **T006**: Testar formulários de criação/edição de certificado garantindo que a submissão continua recebendo e salvando o `participante_id` com sucesso.

---

## Phase 4: Validação Final e E2E

- [ ] **T007**: Testar comportamento do autocomplete via Playwright E2E (digitação, debounce, seleção via clique e navegação por teclado).
- [ ] **T008**: Executar toda a suíte de testes (`npm test`) garantindo zero regressão.
