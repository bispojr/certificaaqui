# TASK ID: ADMIN-TIPOS-002

## Título
Criar `src/controllers/tiposCertificadosSSRController.js`

## Objetivo
Implementar o controller SSR para CRUD de Tipos de Certificados no painel admin, com inclusão da contagem de certificados vinculados e tratamento de `dados_dinamicos` (JSONB) vindo do formulário como JSON serializado.

## Contexto
- `TiposCertificados` tem `hasMany(Certificado, { as: 'certificados' })`
- `dados_dinamicos`: JSONB — chaves e nomes dos campos personalizados do certificado
- `beforeValidate` hook valida que `campo_destaque` é um dos keys de `dados_dinamicos` ou `'nome'`
- Form envia o JSONB como `req.body.dados_dinamicos_json` (string JSON) + `campo_destaque` como select
- Soft delete: `destroy()` / `restore()` com `paranoid: true`
- Flash: `req.flash('success' | 'error', mensagem)` + redirect

## Arquivos envolvidos
- `src/controllers/tiposCertificadosSSRController.js` ← CRIAR

## Passos

### Criar `src/controllers/tiposCertificadosSSRController.js`

```js
const { TiposCertificados, Certificado } = require('../models')

async function index(req, res) {
  try {
    const ativos = await TiposCertificados.findAll({
      include: [{ model: Certificado, as: 'certificados', attributes: ['id'] }],
    })
    const arquivados = await TiposCertificados.findAll({
      paranoid: false,
      where: { deleted_at: { [require('sequelize').Op.ne]: null } },
      include: [{ model: Certificado, as: 'certificados', attributes: ['id'] }],
    })
    const mapCount = (list) =>
      list.map((t) => ({ ...t.toJSON(), numCertificados: t.certificados.length }))
    return res.render('admin/tipos-certificados/index', {
      tipos: mapCount(ativos),
      arquivados: mapCount(arquivados),
    })
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/tipos-certificados')
  }
}

async function novo(_req, res) {
  return res.render('admin/tipos-certificados/form', { tipo: null })
}

async function editar(req, res) {
  try {
    const tipo = await TiposCertificados.findByPk(req.params.id)
    if (!tipo) {
      req.flash('error', 'Tipo de certificado não encontrado.')
      return res.redirect('/admin/tipos-certificados')
    }
    return res.render('admin/tipos-certificados/form', { tipo: tipo.toJSON() })
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/tipos-certificados')
  }
}

async function criar(req, res) {
  try {
    const dados_dinamicos = JSON.parse(req.body.dados_dinamicos_json || '{}')
    await TiposCertificados.create({
      codigo: req.body.codigo,
      descricao: req.body.descricao,
      campo_destaque: req.body.campo_destaque,
      texto_base: req.body.texto_base,
      dados_dinamicos,
    })
    req.flash('success', 'Tipo de certificado criado com sucesso.')
    return res.redirect('/admin/tipos-certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/tipos-certificados/novo')
  }
}

async function atualizar(req, res) {
  try {
    const tipo = await TiposCertificados.findByPk(req.params.id)
    if (!tipo) {
      req.flash('error', 'Tipo de certificado não encontrado.')
      return res.redirect('/admin/tipos-certificados')
    }
    const dados_dinamicos = JSON.parse(req.body.dados_dinamicos_json || '{}')
    await tipo.update({
      codigo: req.body.codigo,
      descricao: req.body.descricao,
      campo_destaque: req.body.campo_destaque,
      texto_base: req.body.texto_base,
      dados_dinamicos,
    })
    req.flash('success', 'Tipo de certificado atualizado com sucesso.')
    return res.redirect('/admin/tipos-certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect(`/admin/tipos-certificados/${req.params.id}/editar`)
  }
}

async function deletar(req, res) {
  try {
    const tipo = await TiposCertificados.findByPk(req.params.id)
    if (!tipo) {
      req.flash('error', 'Tipo de certificado não encontrado.')
      return res.redirect('/admin/tipos-certificados')
    }
    await tipo.destroy()
    req.flash('success', 'Tipo de certificado arquivado.')
    return res.redirect('/admin/tipos-certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/tipos-certificados')
  }
}

async function restaurar(req, res) {
  try {
    const tipo = await TiposCertificados.findByPk(req.params.id, { paranoid: false })
    if (!tipo) {
      req.flash('error', 'Tipo de certificado não encontrado.')
      return res.redirect('/admin/tipos-certificados')
    }
    await tipo.restore()
    req.flash('success', 'Tipo de certificado restaurado.')
    return res.redirect('/admin/tipos-certificados')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/tipos-certificados')
  }
}

module.exports = { index, novo, editar, criar, atualizar, deletar, restaurar }
```

## Resultado esperado
Controller criado com 7 métodos sem erros de importação.

## Critério de aceite
- `dados_dinamicos` vem de `JSON.parse(req.body.dados_dinamicos_json)`
- `numCertificados` é calculado via `t.certificados.length`
- Arquivados: busca com `paranoid: false` + filtro `deleted_at != null`
- Falhas redirecionam com `req.flash('error', ...)`
