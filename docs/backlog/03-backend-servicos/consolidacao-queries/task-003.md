# TASK ID: BACK-LIST-003

## Título

Refatorar `certificadoSSRController.index()` e `participanteSSRController.index()` para usar `getScopedEventoIds` e `findAllForSSR`

## Tipo

código

## Dependências

- BACK-LIST-001 (`getScopedEventoIds` criado)
- BACK-LIST-002 (`findAllForSSR` criado no service)

## Objetivo

Substituir a lógica de escopo e as queries diretas nos dois controllers pelos utilitários criados nas tasks anteriores.

## Arquivos envolvidos

- `src/controllers/certificadoSSRController.js` ← refatorar `index()`
- `src/controllers/participanteSSRController.js` ← substituir lógica de escopo

## Passos

### 1. `certificadoSSRController.js`

**Adicionar import no topo:**
```js
const getScopedEventoIds = require('../utils/getScopedEventoIds')
```

**Remover a função local `getEventoIds`** (linhas 19–24):
```js
// REMOVER este bloco inteiro:
async function getEventoIds(req) {
  if (req.usuario.perfil === 'admin') return null
  const associacoes = await UsuarioEvento.findAll({
    where: { usuario_id: req.usuario.id },
  })
  return associacoes.map((a) => a.evento_id)
}
```

**Refatorar a função `index()`** para usar o service e o novo utilitário:

```js
async function index(req, res) {
  try {
    const { status, evento_id, tipo_id } = req.query
    const eventoIds = await getScopedEventoIds(req.usuario)

    const where = {}
    if (status) where.status = status
    if (evento_id) where.evento_id = Number(evento_id)

    if (tipo_id) where.tipo_certificado_id = Number(tipo_id)

    const { certificados, arquivados } = await certificadoService.findAllForSSR({
      where,
      eventoIds: evento_id ? null : eventoIds, // filtro manual de evento_id tem precedência
    })

    const eventos = await Evento.findAll({ attributes: ['id', 'nome'] })
    const tipos = await TiposCertificados.findAll({
      attributes: ['id', 'descricao'],
    })

    return res.render('admin/certificados/index', {
      layout: 'layouts/admin',
      certificados,
      arquivados,
      eventos,
      tipos,
      filtros: { status, evento_id, tipo_id },
    })
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/certificados')
  }
}
```

**Remover `UsuarioEvento` do destructuring de models** no topo do arquivo (se não mais usado em outro lugar do controller):
```js
// Verificar se UsuarioEvento ainda é usado em outra função do arquivo
// Se não, remover do import
```

### 2. `participanteSSRController.js`

**Adicionar import no topo:**
```js
const getScopedEventoIds = require('../utils/getScopedEventoIds')
```

**Substituir o bloco de escopo inline** dentro de `index()`:
```js
// REMOVER:
let eventoIds = null
if (req.usuario && req.usuario.perfil !== 'admin') {
  const usuarioComEventos = await Usuario.findByPk(req.usuario.id, {
    include: 'eventos',
  })
  eventoIds = (usuarioComEventos?.eventos || []).map((e) => e.id)
}

// SUBSTITUIR POR:
const eventoIds = await getScopedEventoIds(req.usuario)
```

**Verificar se `Usuario` ainda é usado** em outra parte do controller. Se não, remover do import de models.

## Notas de implementação

- `eventoIds: evento_id ? null : eventoIds` em `certificadoSSRController.index()`: quando o operador filtra explicitamente por um `evento_id` na query string, o filtro manual já está no `where` — não é necessário também aplicar o escopo de acesso do usuário sobre `evento_id`. O `null` aqui significa "não aplicar escopo pelo `findAllForSSR`" (o filtro já está em `where.evento_id`).  
  Se a nota acima parecer confusa durante a implementação, simplifique: sempre passe `eventoIds` ao `findAllForSSR` e deixe o service decidir — o filtro de `evento_id` manual e o de escopo podem coexistir (`WHERE evento_id IN (...) AND evento_id = X` é equivalente a `WHERE evento_id = X` quando X está no escopo).

## Resultado esperado

- `grep "getEventoIds\|UsuarioEvento.findAll.*usuario_id\|Usuario.findByPk.*include.*eventos" src/controllers/` retorna zero resultados
- `grep "Certificado.findAll" src/controllers/certificadoSSRController.js` retorna zero resultados
- `npm run check` passa

## Critério de aceite

- `certificadoSSRController.js` não contém a função `getEventoIds` local
- `certificadoSSRController.index()` chama `certificadoService.findAllForSSR()`
- `participanteSSRController.index()` chama `getScopedEventoIds(req.usuario)`
- Ambos importam `getScopedEventoIds` do mesmo path `../utils/getScopedEventoIds`
- `npm run check` passa
