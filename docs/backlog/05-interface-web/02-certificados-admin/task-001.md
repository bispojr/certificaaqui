# TASK ID: CERT-ADMIN-001

## Título
Criar `src/controllers/certificadoSSRController.js` com 7 métodos

## Objetivo
Controller SSR para gestão de certificados no painel admin, com scoping por perfil (admin vê tudo; gestor/monitor filtrado por seus eventos), cancelamento e restauração.

## Contexto
- `Certificado` includes: `Participante` (as padrão), `Evento` (as padrão), `TiposCertificados` (as padrão)
- Escopo gestor/monitor: `req.usuario.getEventos()` retorna instâncias com `id` — extrair `eventoIds`
- `cancel(id)`: `certificado.update({ status: 'cancelado' })` (não é soft delete)
- `restore(id)`: `certificado.restore()` (reverte soft delete paranoid)
- `arquivar(id)`: `certificado.destroy()` (soft delete via paranoid)
- Formulário `criar`/`atualizar`: `valores_dinamicos` vem de `req.body.valores_dinamicos_json` (JSON serializado pelo form) ou diretamente de campos individuais `campo_*`

## Arquivos envolvidos
- `src/controllers/certificadoSSRController.js` ← CRIAR

## Passos

### Criar `src/controllers/certificadoSSRController.js`

```js
const {
  Certificado,
  Participante,
  Evento,
  TiposCertificados,
} = require('../models')

const INCLUDES = [
  { model: Participante, attributes: ['id', 'nomeCompleto', 'email'] },
  { model: Evento, attributes: ['id', 'nome'] },
  { model: TiposCertificados, attributes: ['id', 'descricao', 'texto_base', 'dados_dinamicos'] },
]

async function getEventoIds(req) {
  if (req.usuario.perfil === 'admin') return null // null = sem filtro
  const eventos = await req.usuario.getEventos()
  return eventos.map((e) => e.id)
}

async function index(req, res) {
  try {
    const { status, evento_id, tipo_id } = req.query
    const eventoIds = await getEventoIds(req)

    const where = {}
    if (status) where.status = status
    if (evento_id) where.evento_id = Number(evento_id)
    else if (eventoIds) where.evento_id = eventoIds

    if (tipo_id) where.tipo_certificado_id = Number(tipo_id)

    const certificados = await Certificado.findAll({ where, include: INCLUDES })
    const arquivados = await Certificado.findAll({
      paranoid: false,
      where: { ...where, deleted_at: { [require('sequelize').Op.ne]: null } },
      include: INCLUDES,
    })

    const eventos = await Evento.findAll({ attributes: ['id', 'nome'] })
    const tipos = await TiposCertificados.findAll({ attributes: ['id', 'descricao'] })

    return res.render('admin/certificados/index', {
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

async function detalhe(req, res) {
  try {
    const certificado = await Certificado.findByPk(req.params.id, { include: INCLUDES })
    if (!certificado) {
      req.flash('error', 'Certificado não encontrado.')
      return res.redirect('/admin/certificados')
    }
    const templateService = require('../services/templateService')
    const textoInterpolado = templateService.interpolate(
      certificado.TiposCertificado?.texto_base || '',
      certificado.valores_dinamicos || {},
    )
    return res.render('admin/certificados/detalhe', {
      certificado,
      textoInterpolado,
    })
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/certificados')
  }
}

async function novo(req, res) {
  const participantes = await Participante.findAll({ attributes: ['id', 'nomeCompleto', 'email'] })
  const eventos = await Evento.findAll({ attributes: ['id', 'nome'] })
  const tipos = await TiposCertificados.findAll({ attributes: ['id', 'descricao', 'dados_dinamicos'] })
  return res.render('admin/certificados/form', {
    certificado: null,
    participantes,
    eventos,
    tipos,
  })
}

async function editar(req, res) {
  try {
    const certificado = await Certificado.findByPk(req.params.id, { include: INCLUDES })
    if (!certificado) {
      req.flash('error', 'Certificado não encontrado.')
      return res.redirect('/admin/certificados')
    }
    const participantes = await Participante.findAll({ attributes: ['id', 'nomeCompleto', 'email'] })
    const eventos = await Evento.findAll({ attributes: ['id', 'nome'] })
    const tipos = await TiposCertificados.findAll({ attributes: ['id', 'descricao', 'dados_dinamicos'] })
    return res.render('admin/certificados/form', {
      certificado: certificado.toJSON(),
      participantes,
      eventos,
      tipos,
    })
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/certificados')
  }
}

async function criar(req, res) {
  try {
    const valores_dinamicos = JSON.parse(req.body.valores_dinamicos_json || '{}')
    await Certificado.create({
      nome: req.body.nome,
      status: req.body.status || 'emitido',
      participante_id: Number(req.body.participante_id),
      evento_id: Number(req.body.evento_id),
      tipo_certificado_id: Number(req.body.tipo_certificado_id),
      valores_dinamicos,
    })
    req.flash('success', 'Certificado criado com sucesso.')
    return res.redirect('/admin/certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/certificados/novo')
  }
}

async function atualizar(req, res) {
  try {
    const certificado = await Certificado.findByPk(req.params.id)
    if (!certificado) {
      req.flash('error', 'Certificado não encontrado.')
      return res.redirect('/admin/certificados')
    }
    const valores_dinamicos = JSON.parse(req.body.valores_dinamicos_json || '{}')
    await certificado.update({
      nome: req.body.nome,
      status: req.body.status,
      participante_id: Number(req.body.participante_id),
      evento_id: Number(req.body.evento_id),
      tipo_certificado_id: Number(req.body.tipo_certificado_id),
      valores_dinamicos,
    })
    req.flash('success', 'Certificado atualizado.')
    return res.redirect('/admin/certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect(`/admin/certificados/${req.params.id}/editar`)
  }
}

async function cancelar(req, res) {
  try {
    const certificado = await Certificado.findByPk(req.params.id)
    if (!certificado) {
      req.flash('error', 'Certificado não encontrado.')
      return res.redirect('/admin/certificados')
    }
    await certificado.update({ status: 'cancelado' })
    req.flash('success', 'Certificado cancelado.')
    return res.redirect('/admin/certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/certificados')
  }
}

async function restaurar(req, res) {
  try {
    const certificado = await Certificado.findByPk(req.params.id, { paranoid: false })
    if (!certificado) {
      req.flash('error', 'Certificado não encontrado.')
      return res.redirect('/admin/certificados')
    }
    await certificado.restore()
    req.flash('success', 'Certificado restaurado.')
    return res.redirect('/admin/certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/certificados')
  }
}

module.exports = { index, detalhe, novo, editar, criar, atualizar, cancelar, restaurar }
```

## Resultado esperado
Controller com 8 métodos sem erros de importação.

## Critério de aceite
- `index`: aceita filtros `?status`, `?evento_id`, `?tipo_id`; gestor/monitor restrito a seus eventos
- `detalhe`: chama `templateService.interpolate` com `texto_base` e `valores_dinamicos`
- `criar`/`atualizar`: `valores_dinamicos` via `JSON.parse(req.body.valores_dinamicos_json)`
- `cancelar`: `update({ status: 'cancelado' })` — não é soft delete
- `restaurar`: `findByPk({ paranoid: false })` + `restore()`
- `getEventoIds` retorna `null` para admin (sem filtro de evento)
