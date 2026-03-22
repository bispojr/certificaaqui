# TASK ID: DOC-SWAGGER-002

## Título
Adicionar anotações `@swagger` nas rotas SSR (`/auth` e `/admin`)

## Bloqueio
**Requer FEAT-SSR-002 (authSSR.js) e ADMIN-EVT-005 (admin.js) implementados primeiro.**  
As rotas SSR não existem ainda — este task só pode ser executado após os Domínios 2 e 4 estarem concluídos.

## Objetivo
Documentar as rotas SSR do painel admin e de autenticação com comentários `@swagger`, usando a tag `SSR` e indicando que as respostas são HTML (não JSON).

## Contexto
- Rotas a documentar quando existirem:
  - `GET /auth/login` → renderiza formulário de login (HTML)
  - `POST /auth/login` → processa login → redireciona (302)
  - `POST /auth/logout` → encerra sessão → redireciona (302)
  - `GET /admin/dashboard` → painel admin (HTML, requer cookie)
  - `GET /admin/certificados` → listagem SSR (HTML, requer cookie)
  - `GET /admin/participantes`, `GET /admin/eventos`, `GET /admin/tipos-certificados`, `GET /admin/usuarios`
- Rotas SSR retornam `text/html` ou `302` — documentar como `text/html` com security `cookieAuth`
- Adicionar `cookieAuth` ao `securitySchemes` do swagger config se ainda não existir

## Arquivos envolvidos
- `src/routes/auth.js` ← EDITAR (quando criado por FEAT-SSR-002)
- `src/routes/admin.js` ← EDITAR (quando criado por ADMIN-EVT-005)
- `src/routes/index.js` ou arquivo de config Swagger ← EDITAR (adicionar `cookieAuth` ao scheme)

## Passos (a executar após desbloqueio)

### 1. Adicionar `cookieAuth` ao security scheme

No arquivo de configuração do Swagger (geralmente `app.js` ou arquivo separado), adicionar em `components.securitySchemes`:

```js
cookieAuth: {
  type: 'apiKey',
  in: 'cookie',
  name: 'token',
}
```

### 2. Padrão de anotação para rotas SSR

```js
/**
 * @swagger
 * /auth/login:
 *   get:
 *     summary: Exibe formulário de login SSR
 *     tags: [SSR - Auth]
 *     responses:
 *       200:
 *         description: Página HTML com formulário de login
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *
 *   post:
 *     summary: Processa login SSR e redireciona
 *     tags: [SSR - Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       302:
 *         description: Redirect para /admin/dashboard (sucesso) ou /auth/login (falha)
 */
```

### 3. Padrão para rotas admin protegidas

```js
/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Painel administrativo principal
 *     tags: [SSR - Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Página HTML do dashboard
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       302:
 *         description: Redirect para /auth/login se não autenticado
 */
```

## Critério de aceite
- Tag `SSR - Auth` e `SSR - Admin` aparecem em `GET /api-docs`
- Rotas POST com `application/x-www-form-urlencoded` documentadas corretamente
- `cookieAuth` listado em Security Schemes
