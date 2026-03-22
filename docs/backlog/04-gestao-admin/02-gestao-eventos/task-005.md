# TASK ID: ADMIN-EVT-005

## Título
Criar `src/controllers/eventoSSRController.js` e `src/routes/admin.js` com rotas de eventos

## Objetivo
Criar o controller SSR com 7 métodos de CRUD de eventos, e criar o arquivo `src/routes/admin.js` com `authSSR` global + rotas de eventos protegidas por `rbac('admin')`.

## Contexto
- `src/middlewares/authSSR.js` deve existir (criado em AUTH-SSR-002 do Domínio 2)
- `src/middlewares/rbac.js` ✅ já existe
- `src/services/eventoService.js` tem `findById`, `create`, `update`, `delete`, `restore`
- Eventos arquivados: busca com `paranoid: false` + `where: { deleted_at: { [Op.ne]: null } }`
- `req.flash` disponível via `connect-flash` (configurado em app.js)
- `src/routes/admin.js` é o arquivo central do painel admin — ADMIN-PART-005 já o referencia como existente; esta task o cria com as rotas de eventos; participantes serão adicionados em ADMIN-PART-005
- **ATENÇÃO:** Após criar admin.js, registrá-lo em `app.js` deve ser feito em task separada (ADMIN-EVT-006 — via CONTINUAR FEATURE)

## Arquivos envolvidos
- `src/controllers/eventoSSRController.js` (CRIAR)
- `src/routes/admin.js` (CRIAR)

## Passos

### 1. Criar `src/controllers/eventoSSRController.js`:
```js
const eventoService = require('../services/eventoService')
const { Evento } = require('../models')
const { Op } = require('sequelize')

module.exports = {
  async index(req, res) {
    try {
      const eventos = await Evento.findAll()
      const arquivados = await Evento.findAll({
        paranoid: false,
        where: { deleted_at: { [Op.ne]: null } },
      })
      return res.render('admin/eventos/index', {
        layout: 'layouts/admin',
        title: 'Eventos',
        eventos: eventos.map((e) => e.toJSON()),
        arquivados: arquivados.map((e) => e.toJSON()),
      })
    } catch (err) {
      req.flash('error', err.message)
      return res.redirect('/admin/dashboard')
    }
  },

  novo(req, res) {
    return res.render('admin/eventos/form', {
      layout: 'layouts/admin',
      title: 'Novo Evento',
      action: '/admin/eventos',
    })
  },

  async editar(req, res) {
    try {
      const evento = await eventoService.findById(req.params.id)
      if (!evento) {
        req.flash('error', 'Evento não encontrado.')
        return res.redirect('/admin/eventos')
      }
      return res.render('admin/eventos/form', {
        layout: 'layouts/admin',
        title: 'Editar Evento',
        action: `/admin/eventos/${req.params.id}`,
        evento: evento.toJSON(),
      })
    } catch (err) {
      req.flash('error', err.message)
      return res.redirect('/admin/eventos')
    }
  },

  async criar(req, res) {
    try {
      await eventoService.create(req.body)
      req.flash('success', 'Evento criado com sucesso.')
      return res.redirect('/admin/eventos')
    } catch (err) {
      req.flash('error', err.message)
      return res.render('admin/eventos/form', {
        layout: 'layouts/admin',
        title: 'Novo Evento',
        action: '/admin/eventos',
        evento: req.body,
      })
    }
  },

  async atualizar(req, res) {
    try {
      await eventoService.update(req.params.id, req.body)
      req.flash('success', 'Evento atualizado com sucesso.')
      return res.redirect('/admin/eventos')
    } catch (err) {
      req.flash('error', err.message)
      return res.redirect(`/admin/eventos/${req.params.id}/editar`)
    }
  },

  async deletar(req, res) {
    try {
      await eventoService.delete(req.params.id)
      req.flash('success', 'Evento removido.')
      return res.redirect('/admin/eventos')
    } catch (err) {
      req.flash('error', err.message)
      return res.redirect('/admin/eventos')
    }
  },

  async restaurar(req, res) {
    try {
      await eventoService.restore(req.params.id)
      req.flash('success', 'Evento restaurado com sucesso.')
      return res.redirect('/admin/eventos')
    } catch (err) {
      req.flash('error', err.message)
      return res.redirect('/admin/eventos')
    }
  },
}
```

### 2. Criar `src/routes/admin.js`:
```js
const express = require('express')
const router = express.Router()
const authSSR = require('../middlewares/authSSR')
const rbac = require('../middlewares/rbac')
const eventoSSRController = require('../controllers/eventoSSRController')

// Todas as rotas admin exigem sessão SSR válida
router.use(authSSR)

// Gestão de eventos (somente admin)
router.get('/eventos', rbac('admin'), eventoSSRController.index)
router.get('/eventos/novo', rbac('admin'), eventoSSRController.novo)
router.get('/eventos/:id/editar', rbac('admin'), eventoSSRController.editar)
router.post('/eventos', rbac('admin'), eventoSSRController.criar)
router.post('/eventos/:id', rbac('admin'), eventoSSRController.atualizar)
router.post('/eventos/:id/deletar', rbac('admin'), eventoSSRController.deletar)
router.post('/eventos/:id/restaurar', rbac('admin'), eventoSSRController.restaurar)

module.exports = router
```

## Resultado esperado
- `GET /admin/eventos` renderiza listagem com eventos ativos e arquivados separados
- `POST /admin/eventos` cria evento e redireciona com flash de sucesso
- Gestor ou monitor recebe 403 ao tentar acessar `/admin/eventos`

## Critério de aceite
- `eventoSSRController` exporta os 7 métodos
- `admin.js` aplica `authSSR` via `router.use` (afeta todas as rotas do router)
- Rotas de eventos usam `rbac('admin')` individualmente
- `criar` re-renderiza form com `evento: req.body` em caso de erro
- `GET /admin/eventos/novo` declarado ANTES de `GET /admin/eventos/:id/editar` para evitar conflito ✅ (ordem correta no código acima)

## Observação
Após criar este arquivo, é necessário registrar `adminRouter` em `app.js`. Isso será feito na próxima task (ADMIN-EVT-006) via CONTINUAR FEATURE.
