# Feature: Consulta e Validação Pública (SSR)

## Descrição
Páginas web para o participante buscar e validar certificados, com formulários e views Handlebars.
As views de formulário e opções já existem; faltam os resultados, as rotas SSR com lógica de busca/validação, e a atualização dos links para apontarem para as novas rotas.

## Tasks (alto nível — apenas pendentes)

- Criar `views/certificados/obter-lista.hbs` — lista de certificados com link de PDF
- Criar `views/certificados/validar-resultado.hbs` — painel verde/vermelho de resultado
- Adicionar rotas SSR GET em `src/routes/public.js` (páginas opcoes, obter, validar)
- Adicionar rotas SSR POST em `src/routes/public.js` (POST buscar e POST validar com lógica)
- Atualizar form actions nas views existentes (`form-obter.hbs`, `form-validar.hbs`, `opcoes.hbs`) e registrar redirect `/certificados` → `/public/pagina/opcoes` no `app.js`

## Arquivos base
- `src/routes/public.js` (tem modelos e lógica JSON já importados)
- `views/certificados/opcoes.hbs` (links apontam para `/certificados/obter` e `/certificados/validar` — a corrigir)
- `views/certificados/form-obter.hbs` (action `/certificados/buscar` — a corrigir)
- `views/certificados/form-validar.hbs` (action `/certificados/validar` — a corrigir)
- `app.js` (monta `/public` na linha 159 — adicionar redirect)

## Dependências

### Externas (de outras features)
Nenhuma — `publicRouter` já está registrado em `app.js` (linha 159); as rotas são públicas (sem `authSSR`).

### Internas (ordem entre tasks desta feature)
- CERT-SSR-001 e CERT-SSR-002 → CERT-SSR-004 — as rotas POST (004) fazem `res.render` das views criadas em 001/002
- CERT-SSR-003 e CERT-SSR-004 → CERT-SSR-005 — os links corrigidos em 005 precisam das rotas já existentes
- CERT-SSR-001 e CERT-SSR-002 podem ser executadas em paralelo
