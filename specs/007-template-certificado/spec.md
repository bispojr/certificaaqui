# Feature Specification: Template de Certificado por Evento

**Feature Branch**: `[007-template-certificado]`<br>
**Created**: 2026-10-07<br>
**Status**: Finalizado<br>
**Input**: User description: "Template de certificado: permitir dois modelos de layout (padrão e com nome em destaque), associando a escolha ao evento e mantendo a estrutura atual como um template válido."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Estrutura atual já é um template válido (Priority: P1)

Como responsável por eventos, eu preciso que o layout atual do certificado seja reconhecido como uma opção válida de template para não quebrar compatibilidade com certificados existentes e evitar migração forçada.

**Why this priority**: a solução atual já produz certificados em PDF e o novo conceito de template deve emergir de forma compatível, sem quebrar a operação existente nem excluir layouts já configurados.

**Independent Test**: validar que um evento sem template explícito continua funcionando com o layout atual, definindo automaticamente um template padrão equivalente.

**Acceptance Scenarios**:

1. **Given** um evento configurado com as coordenadas atuais de texto e validação (`texto_x`, `texto_y`, `validacao_x`, `validacao_y`, `validacao_rotacao`, `texto_tamanho_fonte`), **When** o sistema renderiza o PDF, **Then** ele deve continuar respeitando esse layout sem exigir uma migração manual.
2. **Given** um evento sem configuração de template explícita, **When** o PDF é gerado, **Then** o sistema deve aplicar o template padrão compatível com a lógica atual e usar os valores de fallback já existentes.
3. **Given** um certificado já emitido com o layout legado, **When** a visualização pública for aberta, **Then** o certificado deve manter a mesma composição visual e posicionamento anterior.

---

### User Story 2 - Template com nome em destaque como segunda opção (Priority: P1)

Como organizador de evento, eu quero selecionar um segundo template de certificado que centralize o nome do participante em destaque para atender layouts mais modernos e institucionais.

**Why this priority**: esse é o requisito principal da nova feature: oferecer uma alternativa visual sem substituir a composição atual.

**Independent Test**: validar que o sistema consegue alternar entre o template padrão e o template com nome em destaque mantendo a mesma estrutura de dados do certificado.

**Acceptance Scenarios**:

1. **Given** um evento configurado para usar o template com nome em destaque, **When** o certificado for renderizado, **Then** o nome do participante deve aparecer centralizado e em destaque, com priorização visual acima do texto-base, mantendo sua posição relativa no texto-base e provocando uma quebra visual entre o texto que o antecede e o texto que o sucede.
2. **Given** o template `nome-destaque` ativo, **When** o layout for resolvido para renderização, **Then** o texto-base deve ser decomposto em três blocos lógicos do próprio conteúdo: `texto_inicial`, `nome_participante` e `texto_final`.
3. **Given** o template `nome-destaque` ativo, **When** o usuário ajustar o layout no evento, **Then** deve ser possível configurar `x`, `y`, `width`, `align`, `fontFamily`, `fontSize`, `fontWeight`, `color` e `rotation` para cada um dos três blocos (`texto_inicial`, `nome_participante`, `texto_final`).
4. **Given** um evento configurado para usar o template padrão, **When** o certificado for renderizado, **Then** o comportamento atual deve ser preservado e o nome não precisa ser centralizado.
5. **Given** a mesma certidão com dados equivalentes, **When** o usuário alternar entre templates, **Then** o sistema deve permitir que a mudança seja percebida apenas no layout, sem alterar a lógica de emissão ou validação.

---

### User Story 3 - Seleção do template associada ao evento (Priority: P1)

Como usuário administrativo, eu preciso associar a opção de template do certificado ao evento para que cada evento tenha seu próprio modelo de layout e o mesmo certificado respeite a identidade visual do evento.

**Why this priority**: a configuração visual não deve depender do tipo de certificado isoladamente; o evento é o contêiner semântico correto para a decisão de identidade visual do documento.

**Independent Test**: validar que a configuração de template seja persistida junto ao evento e usada no render do PDF do certificado.

**Acceptance Scenarios**:

1. **Given** um evento com template `padrao`, **When** o usuário salva o evento, **Then** o valor deve permanecer associado ao registro do evento.
2. **Given** um evento com template `nome-destaque`, **When** o sistema renderiza certificados daquele evento, **Then** o layout selecionado deve prevalecer sobre qualquer comportamento genérico.
3. **Given** um evento alterado de template, **When** a visualização de um certificado já emitido for atualizada, **Then** o processamento deve refletir o template atual do evento conforme a regra vigente da emissão ou da renderização solicitada.

---

### User Story 4 - Ajuste granular de blocos, coordenadas e tipografia (Priority: P1)

Como gestor de evento, eu preciso poder ajustar a posição, a fonte, o tamanho e o tipo de disposição dos blocos do certificado para adaptar qualquer template ao design do evento sem depender de alterações manuais no código.

**Why this priority**: a flexibilidade visual é parte essencial da proposta e precisa ser suportada tanto no template padrão quanto no template com nome em destaque.

**Independent Test**: validar que o template expõe campos de layout por bloco e que esses campos influenciam a renderização do PDF.

**Acceptance Scenarios**:

1. **Given** um template com bloco de texto-base, **When** o usuário ajustar `x`, `y`, `width`, `align`, `fontFamily`, `fontSize` e `rotation`, **Then** a renderização do PDF deve refletir esses valores.
2. **Given** um template com bloco de nome em destaque, **When** o usuário definir `align: center`, `fontSize` maior e `fontWeight: bold`, **Then** o nome deve ser renderizado com destaque centralizado.
3. **Given** um evento com template padrão e outro com nome em destaque, **When** ambos forem configurados com tamanhos e fontes diferentes, **Then** o sistema deve aplicar a configuração específica ao template selecionado sem misturar estilos entre layouts.

---

### User Story 5 - Compatibilidade com a view atual e apresentação no formulário de evento (Priority: P2)

Como usuário do sistema, eu quero que a escolha do template apareça na tela de cadastro/edição de evento de maneira clara e compatível com a interface atual, sem duplicar campos ou quebrar o fluxo atual.

**Why this priority**: a adoção precisa ser operável no produto sem exigir uma reeducação completa do processo administrativo.

**Independent Test**: validar que form de evento exibe uma seleção de template e que os campos de posicionamento já existentes continuam disponíveis e legíveis.

**Acceptance Scenarios**:

1. **Given** a edição de um evento, **When** o formulário for carregado, **Then** deve aparecer a opção de selecionar o template do certificado vinculada ao evento.
2. **Given** a configuração atual já existe em campos como `texto_x` e `validacao_y`, **When** o template padrão estiver ativo, **Then** esses campos devem ser exibidos e reaproveitados em vez de serem ignorados.
3. **Given** o template com nome em destaque for selecionado, **When** o usuário abrir a tela de configuração, **Then** os campos dos três blocos (`texto_inicial`, `nome_participante`, `texto_final`) devem ser exibidos como variações em relação ao template padrão, sem perder a compatibilidade com a base atual.

### Edge Cases

- Evento sem seleção explícita deve usar o template padrão de compatibilidade.
- Template com nome em destaque deve aceitar posicionamento central sem impedir ajustes manuais de x/y.
- Configuração de fonte ausente deve usar a família padrão do sistema (`Lato-Medium` ou `Helvetica` como fallback).
- Texto-base e bloco de validação não devem conflitar entre si quando houver variantes de template.
- No template `nome-destaque`, os três blocos (`texto_inicial`, `nome_participante`, `texto_final`) não devem se sobrepor no layout padrão e devem aceitar ajustes independentes no evento.
- Dados de eventos antigos devem continuar renderizando corretamente sem migração forçada.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST permitir que um layout de certificado seja tratado como um template, com identificação explícita e dados de composição visual separados da lógica de emissão do certificado.
- **FR-002**: O sistema MUST considerar a organização atual de campos de posicionamento e tipografia como um template válido e compatível, preservando a lógica do comportamento atual como “template padrão”.
- **FR-003**: O sistema MUST disponibilizar uma segunda opção de template, chamada de “nome em destaque” ou equivalente no produto, que centraliza e enfatiza o nome do participante.
- **FR-004**: O sistema MUST associar a seleção do template ao evento, de modo que cada evento tenha seu próprio layout visual e esse layout seja usado na renderização dos certificados vinculados.
- **FR-005**: O sistema MUST manter compatibilidade retroativa com eventos já cadastrados sem template explícito, usando automaticamente o template padrão e os valores de fallback já implementados.
- **FR-006**: O sistema MUST permitir que cada template defina blocos de conteúdo visualmente independentes, como bloco de texto-base, bloco de nome do participante, bloco de validação e demais elementos de composição.
- **FR-007**: O sistema MUST permitir controle granular de cada bloco, incluindo coordenadas (`x`, `y`), largura (`width`), alinhamento (`align`), rotação (`rotation`), família de fonte (`fontFamily`), tamanho da fonte (`fontSize`), peso (`fontWeight`) e cor (`color`).
- **FR-008**: O sistema MUST permitir que o template padrão continue usando a abordagem atual de texto-base em bloco de conteúdo e validação em bloco separado, com a mesma composição e posicionamento históricos.
- **FR-009**: O sistema MUST permitir que o template com nome em destaque aplique um bloco específico para o nome do participante, com destaque centralizado e prioridade visual sobre o texto-base.
- **FR-010**: O sistema MUST permitir que o ajuste de blocos seja configurável para ambos os templates, sem depender de hardcode específico por tipo de modelo.
- **FR-011**: O sistema MUST reutilizar a infraestrutura atual de renderização em PDF, adicionando suporte a seleção de template e a renderização de blocos declarativos no lugar do desenho rígido do texto-base e da validação.
- **FR-012**: O sistema MUST exibir a seleção de template na edição do evento e na tela de configuração dos certificados/evento, mantendo o fluxo administrativo atual sem reestruturação drástica da UX.
- **FR-013**: O sistema MUST preservar o campo `url_template_base` como background do evento e combinar esse recurso com o template de blocos, sem conflito entre imagem de fundo e composição textual.
- **FR-014**: O sistema MUST suportar, em nível de configuração, que cada template possa ser renderizado com diferentes tamanhos de fonte, alinhamentos e disposições sem exigência de nova implementação por evento manual.
- **FR-015**: O sistema MUST tratar a estrutura atual de dados como uma representação válida do template padrão e a modelagem proposta como evolutiva e extensível para futuros templates.
- **FR-016**: O sistema MUST decompor o texto-base, no template `nome-destaque`, em três blocos lógicos (`texto_inicial`, `nome_participante`, `texto_final`) derivados do mesmo conteúdo interpolado, evitando redundância e duplicação do nome.
- **FR-017**: O sistema MUST permitir configuração em nível de evento para posição e tipografia dos três blocos do template `nome-destaque`, com os mesmos atributos de bloco já suportados (`x`, `y`, `width`, `align`, `fontFamily`, `fontSize`, `fontWeight`, `color`, `rotation`).

### Critical Non-Functional Requirements

- **NFR-001**: A introdução do conceito de template MUST manter a compatibilidade com eventos, certificados e PDFs já emitidos, sem exigir recadastramento massivo ou perda de layouts históricos.
- **NFR-002**: A aplicação do template MUST ser feita preferencialmente na camada de serviço de renderização do PDF para manter a regra de negócio isolada da view.
- **NFR-003**: A seleção do template MUST ser persistida junto ao evento, sem acoplamento às rotas públicas de consulta e validação.
- **NFR-004**: O sistema MUST continuar suportando fonte `Lato-Medium` e fallback `Helvetica` sem regressão na renderização de PDF.

### Key Entities _(include if feature involves data)_

- **Evento**: entidade de domínio que passa a manter a referência ao template de certificado escolhido.
- **Template de Certificado**: definição visual do layout do certificado, com opções de fundo, blocos, fontes e posicionamento.
- **Bloco de Conteúdo**: unidade de renderização do documento, que representa um trecho textual ou visual do PDF.
- **Bloco de Nome**: bloco específico para o nome do participante, usado no template com destaque central.
- **Bloco de Validação**: bloco específico para exibir o código e link de validação.
- **Configuração de Layout**: conjunto de atributos por bloco (posicionamento, fonte, tamanho e alinhamento).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% dos eventos sem template explícito continuam renderizando documentos com o layout atual e valores de fallback, sem necessidade de alteração manual.
- **SC-002**: 100% dos eventos com template `padrao` preservam a renderização atual incluindo posicionamento textual e código de validação.
- **SC-003**: 100% dos eventos com template `nome-destaque` exibem o nome do participante em destaque centralizado em comparação com o texto-base.
- **SC-004**: 100% dos templates suportam ajuste de bloco de texto por atributos de posicionamento, alinhamento e tipografia.
- **SC-005**: O formulário de evento passa a expor a seleção do template de certificado em interface administrativa sem quebrar o fluxo atual.
- **SC-006**: 0 regressão de compatibilidade na geração do PDF para certificados já existentes nos cenários de fallback e template padrão.
- **SC-007**: 100% dos eventos com template `nome-destaque` permitem configurar, no evento, posição e fonte dos três blocos (`texto_inicial`, `nome_participante`, `texto_final`).
- **SC-008**: 0 renderizações com duplicação do nome entre bloco de destaque e texto-base no template `nome-destaque`.

## Assumptions

- O sistema atual de campos `texto_x`, `texto_y`, `texto_tamanho_fonte`, `validacao_x`, `validacao_y`, `validacao_rotacao` e `url_template_base` será reutilizado como base do template padrão.
- O conceito de template é extensível para futuros tipos de layout além dos dois previstos nesta feature.
- A renderização contínua do PDF é feita via `pdfkit` e deve receber suporte ao modelo declarativo de blocos sem quebrar a API pública disponível.
- A escolha do template será controlada no nível do evento, mas a lógica de conteúdo do certificado continua dependendo do tipo de certificado e dos valores do participante.

## Riscos e Dependências

### Riscos

- Alterar a geração do PDF de forma rígida pode quebrar históricos de layout já emitidos.
- A modelagem de blocos pode ser excessivamente genérica e tornar o sistema complexo sem ganho real.
- A diferenciação entre “template” e “background” precisa ficar clara para evitar confusão entre imagem de fundo e composição textual.

### Dependencies

- Compatibilidade com as regras existentes em [docs/especificacoes.md](../../docs/especificacoes.md).
- Reuso da lógica atual de posicionamento e fonte em [src/services/pdfService.js](../../src/services/pdfService.js).
- Integração com a edição de eventos na interface SSR e dos campos de layout já presentes na entidade `Evento`.
- Atualização da view administrativa para incluir a seleção do template de certificado por evento.

## Direção de Solução Proposta (apenas para planejamento)

A feature deve evoluir o atual mecanismo de renderização do certificado para um modelo declarativo de templates. A abordagem proposta é:

1. Definir o template padrão como a representação atual e compatível do layout do certificado.
2. Definir o template “nome em destaque” como uma segunda opção declarativa, especialização do mesmo modelo com bloco de nome centralizado.
3. Associar a escolha do template ao evento.
4. Resolver o template em tempo de renderização para construir o PDF a partir de blocos configuráveis.
5. Manter o background e os campos de posicionamento atuais como componentes suportados no template padrão, preservando compatibilidade com a base já existente.

Essa direção permite simultaneamente:

- preservar a estrutura atual como template válido;
- oferecer uma visão mais moderna com destaque central do nome;
- tornar a configuração do certificado extensível para novos layouts sem refatoração completa do código.
