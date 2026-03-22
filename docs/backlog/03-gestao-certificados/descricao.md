## DOMÍNIO: GESTÃO DE CERTIFICADOS

**Descrição:**
Core do sistema — emissão, ciclo de vida, interpolação de template, geração de PDF e consulta/validação pública de certificados.

---

**FEATURE: API REST de Certificados**

Descrição:
Endpoints JSON para emissão, consulta, cancelamento, restauração e listagem paginada de certificados.

TASKS:
- ✅ certificadoService.js com `findAll`, `findById`, `create`, `cancel`, `delete`, `restore`
- ✅ certificadoController.js delegando ao service
- ✅ certificados.js com rotas REST completas
- ⬜ Adicionar paginação em `certificadoService.findAll` (`findAndCountAll`, resposta `{ data, meta }`)
- ⬜ Propagar paginação no `certificadoController.findAll` (ler `req.query.page`/`perPage`)
- ⬜ Atualizar teste de `certificadoService.findAll` para o novo formato paginado
- ⬜ Validar `valores_dinamicos` contra `dados_dinamicos` do tipo em `certificadoService.create` (lançar erro com `camposFaltantes`)
- ⬜ Propagar `statusCode` e `camposFaltantes` no `certificadoController.create`
- ⬜ Criar testes de `certificadoService.create` com validação de `valores_dinamicos`

---

**FEATURE: Interpolação de Template**

Descrição:
Substituição de variáveis `${chave}` do `texto_base` com `valores_dinamicos` do certificado para gerar o texto final.

TASKS:
- ✅ templateService.js com `interpolate` usando regex `\$\{(\w+)\}`
- ✅ Testes unitários do `templateService`
- ✅ Integrado ao `pdfService`
- ⬜ Integrar ao controller de detalhe SSR (`certificadoSSRController.detalhe`)

---

**FEATURE: Geração de PDF**

Descrição:
Geração on-the-fly de PDF via PDFKit, devolvido diretamente no corpo da resposta HTTP com `Content-Type: application/pdf`.

TASKS:
- ✅ `pdfkit` instalado
- ✅ pdfService.js com `generateCertificadoPdf` retornando `Promise<Buffer>`
- ✅ Rejeita geração para certificados sem `codigo` válido
- ✅ Rota `GET /public/certificados/:id/pdf` criada em public.js
- ✅ Smoke tests do `pdfService`

---

**FEATURE: Consulta e Validação Pública (API JSON)**

Descrição:
Endpoints JSON públicos (sem autenticação) para buscar certificados por e-mail e validar por código.

TASKS:
- ✅ `GET /public/certificados?email=` — retorna certificados do participante por e-mail
- ✅ `GET /public/validar/:codigo` — valida autenticidade por código

---

**FEATURE: Consulta e Validação Pública (SSR)**

Descrição:
Páginas web para o participante buscar e validar certificados, com formulários e views Handlebars.

TASKS:
- ✅ opcoes.hbs — página de opções (Obter / Validar)
- ✅ form-obter.hbs — formulário de busca por e-mail com spinner
- ✅ form-validar.hbs — formulário de validação por código
- ⬜ Criar `views/certificados/obter-lista.hbs` — lista de certificados com link de PDF
- ⬜ Criar `views/certificados/validar-resultado.hbs` — painel verde/vermelho de resultado
- ⬜ Adicionar rotas SSR em public.js (`GET /public/pagina/*` e `POST /public/pagina/buscar`, `POST /public/pagina/validar`)
- ⬜ Registrar redirecionamento de `/certificados` para `/public/pagina/opcoes` no app.js

---

**Status resumido:**

| Feature | Progresso |
|---|---|
| API REST de Certificados | 3/9 tasks — paginação e validação de `valores_dinamicos` pendentes |
| Interpolação de Template | 3/4 tasks — integração SSR pendente |
| Geração de PDF | 5/5 ✅ |
| Consulta Pública (API JSON) | 2/2 ✅ |
| Consulta Pública (SSR) | 3/7 tasks — views de resultado e rotas POST pendentes |