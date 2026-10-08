# Plano de Implementação: Template de Certificado por Evento

## Visão geral

Esta feature evolui a geração atual de PDF para suportar dois layouts de certificado vinculados ao evento: o template padrão, que preserva o comportamento atual do sistema, e o template com nome em destaque, que centraliza o nome do participante e reforça o bloco principal do certificado.

**Status da feature**: Finalizado

O objetivo é manter compatibilidade total com a solução existente e permitir que o administrador escolha o layout visual no evento sem quebrar os certificados já emitidos.

---

## Objetivo técnico

A solução deve transformar o estilo de renderização do PDF de um desenho rígido em um modelo declarativo por blocos, preservando a lógica de negócio atual e evoluindo para maior flexibilidade visual.

A abordagem proposta é:

1. Definir um template de certificado como um conjunto de blocos visuais.
2. Manter o layout atual como `padrao` (compatibilidade).
3. Introduzir `nome-destaque` como segunda opção.
4. Associar a escolha ao evento.
5. Renderizar o PDF usando a configuração específica do evento.

---

## Regras de compatibilidade

### Template padrão

O template padrão deve representar fielmente o comportamento atual do sistema:

- background do evento ou padrão
- texto-base na posição atual (`texto_x`, `texto_y`)
- tamanho de fonte atual (`texto_tamanho_fonte`)
- validação na posição atual (`validacao_x`, `validacao_y`, `validacao_rotacao`)
- fonte `Lato-Medium` com fallback `Helvetica`

Esse formato deve continuar sendo usado quando:

- o evento não tiver template selecionado;
- o evento estiver em um estado legado;
- o template for explicitamente `padrao`.

### Template com nome em destaque

O template `nome-destaque` deve:

- manter o background do evento;
- decompor o texto-base em três blocos (`texto_inicial`, `nome_participante`, `texto_final`);
- centralizar o nome no eixo horizontal;
- aumentar visualmente a prioridade do nome;
- manter os blocos de texto inicial e texto final como conteúdo secundário;
- preservar a validação em bloco separado;
- permitir ajuste fino por bloco de layout.

---

## Estrutura de dados

### Modelo de evento

O evento deve continuar armazenando os campos atuais de posicionamento, mas também deve expor a referência explícita ao template selecionado.

Sugestão de persistência:

- `template_certificado`: enum/string (`padrao`, `nome-destaque`)
- `template_config`: JSONB opcional, contendo ajustes finos por bloco

Exemplo de estrutura:

```json
{
  "template_certificado": "nome-destaque",
  "template_config": {
    "texto_inicial": {
      "x": 150,
      "y": 300,
      "width": 300,
      "align": "center",
      "fontFamily": "Lato-Medium",
      "fontSize": 14,
      "fontWeight": "normal",
      "color": "#111827",
      "rotation": 0
    },
    "nome_participante": {
      "x": 0,
      "y": 240,
      "width": 595,
      "align": "center",
      "fontFamily": "Lato-Medium",
      "fontSize": 28,
      "fontWeight": "bold",
      "color": "#111827",
      "rotation": 0
    },
    "texto_final": {
      "x": 150,
      "y": 360,
      "width": 300,
      "align": "center",
      "fontFamily": "Lato-Medium",
      "fontSize": 14,
      "fontWeight": "normal",
      "color": "#111827",
      "rotation": 0
    },
    "validacao": {
      "x": 145,
      "y": 545,
      "fontFamily": "Lato-Medium",
      "fontSize": 9.5,
      "rotation": 0
    }
  }
}
```

### Vantagem

Essa estrutura permite:

- manter compatibilidade com a estrutura atual;
- ter uma solução extensível para futuros layouts;
- reduzir dependência de campos isolados e pouco semânticos;
- permitir que a interface do evento exponha campos por bloco ou por template.

---

## Modelo de renderização

Em vez de renderizar o PDF com texto fixo, o `pdfService` deve resolver um `templateLayout` para o evento e renderizar blocos em ordem.

### Função de render

```js
renderCertificado(doc, evento, certificado) {
  const template = resolveTemplate(evento)
  renderBackground(doc, evento)
  renderBlocks(doc, template, evento, certificado)
}
```

### Blocos esperados

- `texto_base` (template padrão)
- `texto_inicial` (template `nome-destaque`)
- `nome_participante` (template `nome-destaque`)
- `texto_final` (template `nome-destaque`)
- `validacao`
- `titulo_evento` (opcional)
- `assinatura` (futuro)

### Regras de renderização

- cada bloco recebe `x`, `y`, `width`, `align`, `fontFamily`, `fontSize`, `fontWeight`, `color`, `rotation`;
- o template padrão usa o comportamento atual;
- o template `nome-destaque` usa três blocos de conteúdo (`texto_inicial`, `nome_participante`, `texto_final`), com destaque central no nome;
- se `template_config` estiver ausente, o serviço usa valores herdados do evento e fallback.

### Regras de composição do conteúdo no template nome-destaque

- o texto interpolado deve ser segmentado em três partes lógicas: antes do nome, nome e depois do nome;
- o nome deve aparecer exclusivamente no bloco `nome_participante`;
- os blocos `texto_inicial` e `texto_final` não podem repetir o nome;
- os três blocos devem aceitar configuração independente no evento para posição e tipografia.

---

## Fluxo de resolução do template

1. o evento é carregado com os dados do certificado;
2. o sistema identifica `evento.template_certificado`;
3. valida se `template_certificado` existe e é conhecido;
4. caso não exista, usa `padrao`;
5. o renderer escolhe a função específica do template;
6. o bloco de conteúdo é montado com os dados do certificado (`nome`, `texto_base`, `codigo`, etc.);
7. o PDF é gerado com as coordenadas e estilos do bloco.

---

## Fluxo de migração

A migração deve ser compatível e incremental.

### Critérios de compatibilidade

- eventos antigos permanecem em `padrao`;
- campos existentes continuam sendo aceitos;
- certificados antigos continuam sendo gerados corretamente;
- o upload de background continua funcionando;
- a view atual continua funcionando com a mesma lógica por `template_certificado = padrao`.

### Estratégia

- não remover os campos existentes de posicionamento;
- usar os campos atuais como fonte de dados para o template padrão;
- permitir que o template `nome-destaque` sobrescreva os blocos por configuração JSON;
- manter o fallback estático quando a configuração específica não existir.

---

## Ajuste na interface SSR

A view de evento deve expor:

- seletor de `template_certificado` com opções:
  - `padrao`
  - `nome-destaque`
- campos de ajuste do layout conforme o template selecionado
- campos de bloco em modo legado para preservar a interface atual

### Exemplo de UX

- “Modelo do certificado”
  - Padrão
  - Nome em destaque
- “Ajustes de bloco”
  - Texto inicial: x, y, largura, fonte, tamanho, alinhamento
  - Nome do participante: x, y, largura, centralização, tamanho e destaque
  - Texto final: x, y, largura, fonte, tamanho, alinhamento
  - Validação: x, y, rotação

---

## Implementação mínima sugerida

### Fase 1 — compatibilidade sem mudança de contrato

- adicionar `template_certificado` ao model de evento
- manter campos atuais de posicionamento
- criar helper `resolveTemplateConfig(evento)`
- renderizar `padrao` como a lógica atual

### Fase 2 — suporte ao template com nome em destaque

- criar `resolveTemplate(evento)` retornando o layout correto
- implementar decomposição do texto-base em `texto_inicial`, `nome_participante` e `texto_final`
- renderizar três blocos de conteúdo com configuração independente no evento
- atualizar `pdfService` para trabalhar por blocos

### Fase 3 — refinamento de UX

- ajustar a view do formulário do evento
- permitir visualização do bloco selecionado
- exibir prévia simples do nome em destaque no admin

---

## Critérios de aceite da implementação

- certificados antigos continuam funcionando
- eventos sem template selecionado usam `padrao`
- `nome-destaque` centraliza o nome do participante
- `nome-destaque` permite configurar no evento posição e fonte dos três blocos de conteúdo
- `nome-destaque` não duplica o nome entre bloco de destaque e texto-base
- ambos os templates suportam ajuste de coordenadas e tipografia
- a estrutura atual de posicionamento continua sendo válida
- a nova estrutura é extensível para novos layouts

---

## Entregáveis esperados

1. suporte a `template_certificado` no modelo do evento;
2. helper de resolução de template e configuração por bloco;
3. renderização do template padrão preservando a lógica atual;
4. renderização do template com nome em destaque;
5. ajustes na interface de evento para seleção e configuração dos três blocos no `nome-destaque`;
6. testes cobrindo regressão do layout atual e do novo layout.
