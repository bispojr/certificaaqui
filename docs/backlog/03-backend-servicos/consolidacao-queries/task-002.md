# TASK ID: BACK-LIST-002

## Título

Adicionar método `findAllForSSR` em `certificadoService.js`

## Tipo

código

## Dependências

nenhuma (independente de BACK-LIST-001)

## Objetivo

Adicionar ao `certificadoService.js` um método `findAllForSSR({ where, eventoIds })` que encapsula as duas queries de listagem SSR (ativos e arquivados) com os `includes` padrão, centralizando a lógica que hoje está diretamente no controller.

## Contexto

`certificadoSSRController.index()` executa diretamente:

```js
const certificados = await Certificado.findAll({ where, include: INCLUDES })
const arquivados = await Certificado.findAll({
  paranoid: false,
  where: { ...where, deleted_at: { [Op.ne]: null } },
  include: INCLUDES,
})
```

O `INCLUDES` definido no controller (linhas 10–17) deve ser replicado no service ou recebido como parâmetro. Para manter o método `findAllForSSR` testável sem dependência do Handlebars/Express, ele aceita `include` como parâmetro opcional — mas define um valor padrão sensato internamente.

## Arquivos envolvidos

- `src/services/certificadoService.js` ← adicionar método

## Passos

1. No topo de `certificadoService.js`, o import atual é:

   ```js
   const {
     Certificado,
     TiposCertificados,
     Evento,
   } = require('../../src/models')
   ```

   Adicionar `Participante` e `UsuarioEvento` ao destructuring (necessários para os includes padrão):

   ```js
   const {
     Certificado,
     TiposCertificados,
     Evento,
     Participante,
   } = require('../models')
   ```

   > Nota: o path também muda de `../../src/models` para `../models` (coberto por BACK-REQ-001, mas pode ser feito aqui se BACK-REQ-001 ainda não foi aplicada).

2. Adicionar constante de includes após os imports:

```js
const DEFAULT_SSR_INCLUDES = [
  { model: Participante, attributes: ['id', 'nomeCompleto', 'email'] },
  { model: Evento, attributes: ['id', 'nome'] },
  {
    model: TiposCertificados,
    attributes: ['id', 'descricao', 'texto_base', 'dados_dinamicos'],
  },
]
```

3. Adicionar o método `findAllForSSR` ao `module.exports`:

```js
async findAllForSSR({ where = {}, eventoIds = null } = {}) {
  const { Op } = require('sequelize')

  const scopedWhere = { ...where }
  if (eventoIds !== null) {
    scopedWhere.evento_id = eventoIds
  }

  const [certificados, arquivados] = await Promise.all([
    Certificado.findAll({
      where: scopedWhere,
      include: DEFAULT_SSR_INCLUDES,
    }),
    Certificado.findAll({
      paranoid: false,
      where: { ...scopedWhere, deleted_at: { [Op.ne]: null } },
      include: DEFAULT_SSR_INCLUDES,
    }),
  ])

  return { certificados, arquivados }
},
```

> Nota: `require('sequelize')` aqui ainda é inline — isso será corrigido quando BACK-REQ-002 for aplicada ao controller OU quando este service for atualizado. Para esta task, o inline é aceitável pois `sequelize` é uma dependência de produção sempre disponível. Alternativamente, mover `const { Op } = require('sequelize')` para o topo do arquivo junto com os outros imports.

## Resultado esperado

- `certificadoService.findAllForSSR({ where: {}, eventoIds: [1,2] })` retorna `{ certificados: [...], arquivados: [...] }` com os includes configurados
- `npm run check` passa

## Critério de aceite

- Método `findAllForSSR` exportado em `certificadoService.js`
- Aceita `{ where, eventoIds }` como parâmetro desestruturado com defaults
- Usa `Promise.all` para paralelizar as duas queries
- Retorna `{ certificados, arquivados }`
- Se `eventoIds === null`, não adiciona filtro `evento_id` ao where (admin sem restrição de escopo)
