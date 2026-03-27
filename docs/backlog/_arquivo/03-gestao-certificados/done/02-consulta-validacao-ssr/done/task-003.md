# TASK ID: CERT-SSR-003

## Título

Adicionar rotas SSR GET em `src/routes/public.js` (páginas opcoes, obter, validar)

## Objetivo

Adicionar 3 rotas GET que simplesmente renderizam as views Handlebars já existentes para o fluxo público de certificados.

## Contexto

- `src/routes/public.js` já importa modelos e tem rotas JSON — as novas rotas SSR serão adicionadas no FINAL do arquivo, antes de `module.exports = router`
- As views já existem: `certificados/opcoes`, `certificados/form-obter`, `certificados/form-validar`
- Prefixo das rotas: `/public/pagina/` (o router está montado em `/public` em app.js)
- Nenhum import novo é necessário

## Arquivos envolvidos

- `src/routes/public.js`

## Passos

Antes de `module.exports = router`, adicionar:

```js
// ─── SSR: páginas públicas ────────────────────────────────────────────────────

router.get('/pagina/opcoes', (req, res) => {
  res.render('certificados/opcoes')
})

router.get('/pagina/obter', (req, res) => {
  res.render('certificados/form-obter')
})

router.get('/pagina/validar', (req, res) => {
  res.render('certificados/form-validar')
})
```

## Resultado esperado

- `GET /public/pagina/opcoes` → renderiza `certificados/opcoes.hbs`
- `GET /public/pagina/obter` → renderiza `certificados/form-obter.hbs`
- `GET /public/pagina/validar` → renderiza `certificados/form-validar.hbs`

## Critério de aceite

- As 3 rotas respondem com status 200 e HTML
- Nenhuma rota JSON existente foi alterada
- Nenhum import novo foi adicionado

## Metadados

- Completado em: 2026-03-26 22:03 (BRT) ✅
