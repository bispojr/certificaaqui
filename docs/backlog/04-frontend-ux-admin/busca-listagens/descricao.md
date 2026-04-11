# FEATURE: Busca por Texto em Listagens sem Busca

## Domínio

04 — Frontend / UX Admin

## Identificador

FRONT-BUSCA

## Prioridade

ALTA

## Descrição

A listagem de participantes já possui campo de busca `?q=` funcional (com input de texto, botão "Buscar" e link "Limpar"). As listagens de certificados, eventos e usuários não possuem equivalente, obrigando o operador a rolar toda a tabela para localizar um registro.

## Situação atual

| Página | Filtros existentes | Busca por texto |
|--------|-------------------|-----------------|
| Participantes | `?q=` (nome/e-mail) | ✅ |
| Certificados | `?evento_id`, `?status`, `?tipo_id` | ❌ |
| Eventos | nenhum | ❌ |
| Usuários | nenhum | ❌ |

## Padrão de referência

A view `views/admin/participantes/index.hbs` já implementa o padrão correto:

```hbs
<form method='GET' action='/admin/participantes' class='mb-3 d-flex gap-2'>
  <input type='text' class='form-control' name='q' value='{{q}}'
    placeholder='Buscar por nome ou e-mail' />
  <button type='submit' class='btn btn-outline-secondary'>Buscar</button>
  {{#if q}}
    <a href='/admin/participantes' class='btn btn-outline-secondary'>Limpar</a>
  {{/if}}
</form>
```

No controller correspondente, o padrão de filtragem usa `Op.iLike` do Sequelize:

```js
const { q } = req.query
const where = {}
if (q) {
  where[Op.or] = [
    { nome: { [Op.iLike]: `%${q}%` } },
    { email: { [Op.iLike]: `%${q}%` } },
  ]
}
```

## Arquivos envolvidos por task

| Task | Controller | View |
|------|-----------|------|
| FRONT-BUSCA-001 | `certificadoSSRController.js` | `certificados/index.hbs` |
| FRONT-BUSCA-002 | `eventoSSRController.js` | `eventos/index.hbs` |
| FRONT-BUSCA-003 | `usuarioSSRController.js` | `usuarios/index.hbs` |

## Tasks

- `task-001.md` — FRONT-BUSCA-001: Busca `?q=` em certificados (nome do participante + código)
- `task-002.md` — FRONT-BUSCA-002: Busca `?q=` em eventos (nome + código_base)
- `task-003.md` — FRONT-BUSCA-003: Busca `?q=` em usuários (nome + e-mail)

## Critério de aceite global

- Todas as três listagens exibem campo de busca funcional com placeholder descritivo
- O parâmetro `?q=` é preservado junto aos demais filtros ao paginar (quando paginação for implementada — PERF-PAG)
- A busca é case-insensitive via `Op.iLike`
- `npm run check` passa
