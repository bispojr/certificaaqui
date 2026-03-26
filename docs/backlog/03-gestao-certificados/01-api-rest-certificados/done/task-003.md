# TASK ID: CERT-API-003

## Título

Validar `valores_dinamicos` contra `dados_dinamicos` do tipo em `certificadoService.create`

## Objetivo

Antes de criar o certificado, buscar o `TiposCertificados` pelo `tipo_certificado_id` e verificar se todos os campos de `dados_dinamicos` estão presentes em `valores_dinamicos`. Se faltarem campos, lançar erro com `statusCode: 422` e lista `camposFaltantes`.

## Contexto

- `src/models/tipos_certificados.js`: campo `dados_dinamicos: JSONB` — as chaves do objeto são os campos dinâmicos exigidos
- `src/models/certificado.js`: campo `valores_dinamicos: JSONB` — deve conter todas as chaves de `dados_dinamicos` do tipo
- `src/services/certificadoService.js` linha 18-20: `create(data)` só chama `Certificado.create(data)` sem validação
- O import de `TiposCertificados` deve ser adicionado no topo do service

## Arquivos envolvidos

- `src/services/certificadoService.js`

## Passos

### 1. Atualizar o require no topo do arquivo:

Substituir:

```js
const { Certificado } = require('../../src/models')
```

Por:

```js
const { Certificado, TiposCertificados } = require('../../src/models')
```

### 2. Substituir o método `create`:

```js
async create(data) {
  const tipo = await TiposCertificados.findByPk(data.tipo_certificado_id)
  if (!tipo) {
    const err = new Error('Tipo de certificado não encontrado')
    err.statusCode = 404
    throw err
  }

  const camposEsperados = Object.keys(tipo.dados_dinamicos || {})
  const valoresRecebidos = data.valores_dinamicos || {}
  const camposFaltantes = camposEsperados.filter((c) => !(c in valoresRecebidos))

  if (camposFaltantes.length > 0) {
    const err = new Error('Campos dinâmicos obrigatórios não informados')
    err.statusCode = 422
    err.camposFaltantes = camposFaltantes
    throw err
  }

  return Certificado.create(data)
},
```

## Resultado esperado

- `certificadoService.create({ tipo_certificado_id: 1, valores_dinamicos: {} })` lança erro 422 com `camposFaltantes` se o tipo tiver chaves em `dados_dinamicos`
- `certificadoService.create({ tipo_certificado_id: 999, ... })` lança erro 404
- Se `dados_dinamicos` for null/vazio, cria normalmente

## Critério de aceite

- Erro lançado tem propriedades `statusCode` e `camposFaltantes`
- Tipos com `dados_dinamicos: null` não bloqueiam a criação
- `Certificado.create` só é chamado se a validação passar

## Metadados

- Completado em: 26/03/2026 16:11 ✅