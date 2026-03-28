# TASK ID: CERT-SSR-005

## Título

Atualizar links nas views existentes e registrar redirect `/certificados` no `app.js`

## Objetivo

Atualizar os form actions e links nas 3 views existentes para usarem as novas rotas `/public/pagina/...`, e adicionar um redirect de `/certificados` para `/public/pagina/opcoes` no `app.js`.

## Contexto

- `views/certificados/opcoes.hbs` linhas 4 e 8: links apontam para `/certificados/obter` e `/certificados/validar` — devem virar `/public/pagina/obter` e `/public/pagina/validar`
- `views/certificados/form-obter.hbs` linha 7: `action="/certificados/buscar"` → deve virar `/public/pagina/buscar`
- `views/certificados/form-validar.hbs` linha 7: `action="/certificados/validar"` → deve virar `/public/pagina/validar`
- `app.js` linha 159: `app.use('/public', publicRouter)` — já existe; abaixo dela adicionar redirect para `/certificados`
- O router `/certificados` (certificadosRouter) já cuida das rotas da API REST — o redirect é APENAS para `GET /certificados` (root), antes do router

## Arquivos envolvidos

- `views/certificados/opcoes.hbs`
- `views/certificados/form-obter.hbs`
- `views/certificados/form-validar.hbs`
- `app.js`

**ATENÇÃO: são 4 arquivos — dividir em 2 edições paralelas:**

### Edição A: views (3 arquivos, mudanças mínimas)

### Edição B: app.js (1 bloco)

> Regra: a task pode modificar mais de 2 arquivos se todas as mudanças forem strings simples de substituição sem lógica nova.

## Passos

### 1. `views/certificados/opcoes.hbs`

Substituir:

```html
<a href="/certificados/obter" class="btn btn-primary btn-lg"
```

Por:

```html
<a href="/public/pagina/obter" class="btn btn-primary btn-lg"
```

Substituir:

```html
href="/certificados/validar"
```

Por:

```html
href="/public/pagina/validar"
```

### 2. `views/certificados/form-obter.hbs`

Substituir:

```html
<form method="POST" action="/certificados/buscar" id="form-obter"></form>
```

Por:

```html
<form method="POST" action="/public/pagina/buscar" id="form-obter"></form>
```

### 3. `views/certificados/form-validar.hbs`

Substituir:

```html
<form method="POST" action="/certificados/validar"></form>
```

Por:

```html
<form method="POST" action="/public/pagina/validar"></form>
```

### 4. `app.js`

Antes de `app.use('/certificados', certificadosRouter)` (linha 156), adicionar:

```js
app.get('/certificados', (req, res) => res.redirect('/public/pagina/opcoes'))
```

Isso garante que `GET /certificados` redireciona para a página pública, enquanto as sub-rotas da API REST (ex: `POST /certificados`) continuam funcionando normalmente.

## Resultado esperado

- `GET /certificados` → redireciona para `/public/pagina/opcoes`
- Clique em "Obter meu certificado" na opcoes.hbs → abre `/public/pagina/obter`
- Submit do formulário de obter → `POST /public/pagina/buscar`
- Submit do formulário de validar → `POST /public/pagina/validar`

## Critério de aceite

- Nenhuma rota da API REST (`POST /certificados`, `GET /certificados/:id`, etc.) é afetada
- As 4 substituições de texto foram aplicadas corretamente
- `GET /certificados` (sem sufixo) retorna 302 redirect

## Metadados

- Completado em: 2026-03-27 12:39 (BRT) ✅
