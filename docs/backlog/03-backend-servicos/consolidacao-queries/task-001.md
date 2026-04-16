# TASK ID: BACK-LIST-001

## Título

Criar `src/utils/getScopedEventoIds.js` — utilitário de escopo de eventos por perfil

## Tipo

código

## Dependências

nenhuma

## Objetivo

Criar um utilitário que recebe `req.usuario` e retorna `null` (admin = sem filtro) ou um array de IDs de eventos acessíveis (gestor/monitor), usando a estratégia `UsuarioEvento.findAll` (mais direta que `Usuario.findByPk + include`).

## Contexto

Dois controllers implementam essa lógica de forma diferente:

**`certificadoSSRController.js`** — usa `UsuarioEvento`:

```js
async function getEventoIds(req) {
  if (req.usuario.perfil === 'admin') return null
  const associacoes = await UsuarioEvento.findAll({
    where: { usuario_id: req.usuario.id },
  })
  return associacoes.map((a) => a.evento_id)
}
```

**`participanteSSRController.js`** — usa `Usuario.findByPk + include`:

```js
if (req.usuario && req.usuario.perfil !== 'admin') {
  const usuarioComEventos = await Usuario.findByPk(req.usuario.id, {
    include: 'eventos',
  })
  eventoIds = (usuarioComEventos?.eventos || []).map((e) => e.id)
}
```

O utilitário usa a estratégia do `certificadoSSRController` (`UsuarioEvento.findAll`) por ser mais eficiente (query direta na tabela de junção, sem JOIN em `eventos`).

## Arquivos envolvidos

- `src/utils/getScopedEventoIds.js` ← criar (novo arquivo, novo diretório `src/utils/`)

## Passos

1. Verificar se `src/utils/` já existe:

   ```bash
   ls src/utils/
   ```

   Se não existir, o arquivo criado abaixo criará o diretório implicitamente.

2. Criar `src/utils/getScopedEventoIds.js`:

```js
const { UsuarioEvento } = require('../models')

/**
 * Retorna os IDs de eventos acessíveis pelo usuário autenticado.
 * - Admin: retorna null (sem restrição de escopo)
 * - Gestor/Monitor: retorna array de IDs dos eventos vinculados
 *
 * @param {Object} usuario - req.usuario (deve ter .perfil e .id)
 * @returns {Promise<number[]|null>}
 */
async function getScopedEventoIds(usuario) {
  if (!usuario || usuario.perfil === 'admin') return null

  const associacoes = await UsuarioEvento.findAll({
    where: { usuario_id: usuario.id },
    attributes: ['evento_id'],
  })

  return associacoes.map((a) => a.evento_id)
}

module.exports = getScopedEventoIds
```

3. Notar que a função recebe `usuario` (o objeto), não `req` inteiro — mais fácil de testar unitariamente.

## Resultado esperado

- `src/utils/getScopedEventoIds.js` existe
- `node -e "const f = require('./src/utils/getScopedEventoIds'); console.log(typeof f)"` imprime `function`
- `npm run check` passa (o arquivo ainda não é chamado por ninguém — isso é feito em BACK-LIST-003)

## Critério de aceite

- Função exportada como default (não dentro de objeto)
- Recebe `usuario` (não `req`)
- Retorna `null` para perfil `admin` ou usuário nulo
- Retorna array `number[]` para outros perfis
- Não tem dependência de `req`, `res` ou qualquer objeto HTTP
