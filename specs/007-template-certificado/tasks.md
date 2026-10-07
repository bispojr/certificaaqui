# Tasks: Template de Certificado por Evento

## Objetivo

Implementar suporte a templates de certificados por evento, preservando o layout atual como padrão e adicionando a opção com nome em destaque.

---

## Tarefas

### T1. Preparar a base do modelo
- [x] Adicionar/validar o campo `template_certificado` no modelo de evento.
- [x] Definir valores permitidos: `padrao` e `nome-destaque`.
- [x] Preservar os campos atuais de posicionamento e tipo de fonte.
- [x] Garantir fallback para `padrao` quando o valor não existir.

### T2. Definir configuração por bloco
- [x] Criar helper de resolução de template e configuração de layout.
- [x] Definir estrutura JSON de blocos para nome, texto-base e validação.
- [x] Implementar leitura de configuração do evento com fallback para os valores legados.

### T3. Implementar render do template padrão
- [ ] Ajustar `pdfService` para resolver o template `padrao`.
- [ ] Garantir que o comportamento atual continue o mesmo.
- [ ] Validar que background, texto e validação renderizam corretamente.

### T4. Implementar render do template nome em destaque
- [ ] Criar bloco específico para nome do participante.
- [ ] Centralizar visualmente o nome do participante.
- [ ] Ajustar diagrama de prioridade entre nome e texto-base.
- [ ] Garantir que a validação continue visível e alinhada.

### T5. Integrar ao fluxo de evento
- [ ] Atualizar a view de evento para expor o template selecionado.
- [ ] Ajustar o formulário para manter compatibilidade com campos legados.
- [ ] Garantir que eventos sem escolha explícita usem `padrao`.

### T6. Validar regressão e compatibilidade
- [ ] Criar testes para o template padrão.
- [ ] Criar testes para o template com nome em destaque.
- [ ] Validar que certificados antigos continuam renderizando sem regressão.
- [ ] Executar a suíte relevante de testes do PDF e do evento.

---

## Critérios de conclusão

- o sistema aceita `padrao` e `nome-destaque` como valores de template;
- o layout atual permanece compatível;
- o template `nome-destaque` centraliza o nome do participante;
- a interface de evento reflete a opção de template;
- os testes relevantes passam sem regressão.
