# TASK ID: DOC-SWAGGER-001

## Título

Adicionar anotações `@swagger` em `src/routes/public.js`

## Objetivo

Documentar as 3 rotas públicas JSON de consulta de certificados com comentários `@swagger` no padrão OpenAPI 3.0 já adotado pelo projeto.

## Contexto

- Rotas a documentar:
  - `GET /public/certificados?email=...` → busca certificados por e-mail do participante
  - `GET /public/validar/:codigo` → valida certificado por código
  - `GET /public/certificados/:id/pdf` → gera e retorna PDF do certificado
- Sem autenticação (`security` não necessário)
- Tag a usar: `Public` (nova tag, não conflita com as existentes)
- Padrão de referência: `src/routes/participantes.js` — comentários `/** @swagger */` antes de cada rota

## Arquivos envolvidos

- `src/routes/public.js` ← EDITAR (adicionar anotações antes das definições de rota)

## Passos

### Adicionar anotações `@swagger` em `src/routes/public.js`

Inserir os seguintes comentários antes das respectivas rotas:

**Antes de `router.get('/certificados/:id/pdf', ...)`:**

```js
/**
 * @swagger
 * tags:
 *   name: Public
 *   description: Consulta e validação pública de certificados (sem autenticação)
 */

/**
 * @swagger
 * /public/certificados/{id}/pdf:
 *   get:
 *     summary: Gera e retorna o PDF de um certificado
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do certificado
 *     responses:
 *       200:
 *         description: Arquivo PDF do certificado
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Certificado não encontrado
 *       500:
 *         description: Erro ao gerar PDF
 */
```

**Antes de `router.get('/certificados', ...)`:**

```js
/**
 * @swagger
 * /public/certificados:
 *   get:
 *     summary: Lista certificados de um participante pelo e-mail
 *     tags: [Public]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: E-mail do participante
 *     responses:
 *       200:
 *         description: Lista de certificados do participante
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 certificados:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Certificado'
 *       400:
 *         description: E-mail não informado
 *       404:
 *         description: Participante não encontrado
 */
```

**Antes de `router.get('/validar/:codigo', ...)`:**

```js
/**
 * @swagger
 * /public/validar/{codigo}:
 *   get:
 *     summary: Valida um certificado pelo código
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         description: Código único do certificado (ex. EDU-2026-001)
 *     responses:
 *       200:
 *         description: Resultado da validação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valido:
 *                   type: boolean
 *                 certificado:
 *                   $ref: '#/components/schemas/Certificado'
 *       404:
 *         description: Certificado não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valido:
 *                   type: boolean
 *                   example: false
 *                 mensagem:
 *                   type: string
 */
```

## Critério de aceite

- `GET /api-docs` exibe as 3 rotas da tag `Public` sem erros de parsing
- Cada rota exibe parâmetros e responses corretamente na UI Swagger
- Nenhuma rota existente é alterada (apenas comentários adicionados)
