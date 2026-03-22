# TASK ID: CERT-API-004

## Título
Propagar `statusCode` e `camposFaltantes` no `certificadoController.create`

## Objetivo
Atualizar o `catch` de `create` no controller para usar `error.statusCode` (se presente) como HTTP status e incluir `camposFaltantes` no body quando disponível.

## Contexto
- `src/controllers/certificadoController.js` linhas 3-9: catch de `create` retorna sempre `400`
- Após CERT-API-003, o service pode lançar erros com `statusCode: 404` (tipo não encontrado) ou `statusCode: 422` (campos faltantes) e propriedade `camposFaltantes: string[]`
- Outros métodos do controller NÃO precisam ser alterados — apenas `create`

## Arquivos envolvidos
- `src/controllers/certificadoController.js`

## Passos

### 1. Substituir apenas o catch do método `create`:
Substituir:
```js
  async create(req, res) {
    try {
      const certificado = await certificadoService.create(req.body)
      return res.status(201).json(certificado)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
  }
```
Por:
```js
  async create(req, res) {
    try {
      const certificado = await certificadoService.create(req.body)
      return res.status(201).json(certificado)
    } catch (error) {
      const status = error.statusCode || 400
      const body = { error: error.message }
      if (error.camposFaltantes) body.camposFaltantes = error.camposFaltantes
      return res.status(status).json(body)
    }
  }
```

## Resultado esperado
`POST /certificados` com campos dinâmicos faltando devolve:
```json
HTTP 422
{
  "error": "Campos dinâmicos obrigatórios não informados",
  "camposFaltantes": ["carga_horaria", "local"]
}
```

## Critério de aceite
- Status 422 quando service lança erro com `statusCode: 422`
- Status 404 quando service lança erro com `statusCode: 404`
- Status 400 (fallback) quando erro sem `statusCode`
- `camposFaltantes` incluído no body apenas quando presente no erro
