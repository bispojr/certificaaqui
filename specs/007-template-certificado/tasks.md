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

- [x] Ajustar `pdfService` para resolver o template `padrao`.
- [x] Garantir que o comportamento atual continue o mesmo.
- [x] Validar que background, texto e validação renderizam corretamente.

### T4. Implementar render do template nome em destaque

- [x] Criar bloco específico para nome do participante.
- [x] Centralizar visualmente o nome do participante.
- [x] Ajustar diagrama de prioridade entre nome e texto-base.
- [x] Garantir que a validação continue visível e alinhada.

### T5. Integrar ao fluxo de evento

- [x] Atualizar a view de evento para expor o template selecionado.
- [x] Ajustar o formulário para manter compatibilidade com campos legados.
- [x] Garantir que eventos sem escolha explícita usem `padrao`.

### T6. Validar regressão e compatibilidade

- [x] Criar testes para o template padrão.
- [x] Criar testes para o template com nome em destaque.
- [x] Validar que certificados antigos continuam renderizando sem regressão.
- [x] Executar a suíte relevante de testes do PDF e do evento.

---

## Critérios de conclusão

- o sistema aceita `padrao` e `nome-destaque` como valores de template;
- o layout atual permanece compatível;
- o template `nome-destaque` centraliza o nome do participante;
- a interface de evento reflete a opção de template;
- os testes relevantes passam sem regressão.

---

## Correção Pós-Entrega — Nome em Destaque com 3 blocos configuráveis

### T7. Decompor texto-base em três blocos lógicos no template nome-destaque

- [ ] Implementar função de segmentação do texto interpolado em `texto_inicial`, `nome_participante` e `texto_final`.
- [ ] Garantir que o nome seja renderizado exclusivamente no bloco `nome_participante`.
- [ ] Garantir que `texto_inicial` e `texto_final` não repitam o nome.

### T8. Evoluir template_config para suportar 3 blocos no Evento

- [ ] Adicionar suporte no `template_config` para `texto_inicial`, `nome_participante` e `texto_final` no template `nome-destaque`.
- [ ] Definir defaults de `x`, `y`, `width`, `align`, `fontFamily`, `fontSize`, `fontWeight`, `color` e `rotation` para os três blocos.
- [ ] Preservar fallback e compatibilidade para eventos já existentes.

### T9. Atualizar renderização de PDF no nome-destaque

- [ ] Substituir renderização atual (nome + texto-base integral) pela renderização em três blocos.
- [ ] Aplicar configurações de posição e tipografia de cada bloco vindas do Evento.
- [ ] Garantir ausência de sobreposição no layout padrão.

### T10. Atualizar formulário de Evento para configuração dos 3 blocos

- [ ] Expor no formulário de Evento os campos de configuração para `texto_inicial`, `nome_participante` e `texto_final` quando `template_certificado = nome-destaque`.
- [ ] Persistir os campos no payload de `template_config`.
- [ ] Manter compatibilidade visual e funcional do fluxo atual para template `padrao`.

### T11. Cobertura de testes da correção

- [ ] Criar/ajustar testes unitários para segmentação do texto em três blocos.
- [ ] Ajustar testes do `pdfService` para validar renderização sem duplicação do nome.
- [ ] Ajustar testes de view/controller de Evento para validar persistência e exibição dos três blocos configuráveis.
