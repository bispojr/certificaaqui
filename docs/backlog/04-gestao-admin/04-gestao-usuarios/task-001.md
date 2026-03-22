# TASK ID: ADMIN-USR-001

## Título
Criar `src/controllers/usuarioSSRController.js` com 7 métodos CRUD

## Objetivo
Implementar controller SSR completo para gestão de usuários no painel admin, incluindo associação de eventos via `setEventos` e tratamento seguro de senha (não atualizar se campo vazio).

## Contexto
- `Usuario` model: campos `nome`, `email`, `senha`, `perfil`; hooks bcrypt automáticos
- `usuario.setEventos(Array<id>)` substitui todas as associações existentes
- `perfil`: ENUM `admin | gestor | monitor`
- Senha em edição: se `req.body.senha` vazio → não incluir no `update()` (hook só rehashearia se `changed('senha')`)
- `paranoid: true` → arquivados buscados com `{ paranoid: false, where: { deleted_at: { [Op.ne]: null } } }`
- Flash + redirect para todos os erros

## Arquivos envolvidos
- `src/controllers/usuarioSSRController.js` ← CRIAR

## Passos

### Criar `src/controllers/usuarioSSRController.js`

```js
const { Usuario, Evento } = require('../models')
const { Op } = require('sequelize')

async function index(req, res) {
  try {
    const usuarios = await Usuario.findAll({
      include: [{ model: Evento, as: 'eventos', attributes: ['id', 'nome'] }],
    })
    const arquivados = await Usuario.findAll({
      paranoid: false,
      where: { deleted_at: { [Op.ne]: null } },
    })
    return res.render('admin/usuarios/index', { usuarios, arquivados })
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/usuarios')
  }
}

async function novo(req, res) {
  const eventos = await Evento.findAll({ attributes: ['id', 'nome'] })
  return res.render('admin/usuarios/form', { usuario: null, eventos })
}

async function editar(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      include: [{ model: Evento, as: 'eventos', attributes: ['id'] }],
    })
    if (!usuario) {
      req.flash('error', 'Usuário não encontrado.')
      return res.redirect('/admin/usuarios')
    }
    const eventos = await Evento.findAll({ attributes: ['id', 'nome'] })
    const usuarioJson = usuario.toJSON()
    usuarioJson.eventoIds = usuario.eventos.map((e) => e.id)
    return res.render('admin/usuarios/form', { usuario: usuarioJson, eventos })
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/usuarios')
  }
}

async function criar(req, res) {
  try {
    const { nome, email, senha, perfil, eventos } = req.body
    const usuario = await Usuario.create({ nome, email, senha, perfil })
    const eventoIds = [].concat(eventos || []).map(Number).filter(Boolean)
    if (eventoIds.length > 0) {
      await usuario.setEventos(eventoIds)
    }
    req.flash('success', 'Usuário criado com sucesso.')
    return res.redirect('/admin/usuarios')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/usuarios/novo')
  }
}

async function atualizar(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.params.id)
    if (!usuario) {
      req.flash('error', 'Usuário não encontrado.')
      return res.redirect('/admin/usuarios')
    }
    const { nome, email, senha, perfil, eventos } = req.body
    const campos = { nome, email, perfil }
    if (senha && senha.trim() !== '') campos.senha = senha
    await usuario.update(campos)
    const eventoIds = [].concat(eventos || []).map(Number).filter(Boolean)
    await usuario.setEventos(eventoIds)
    req.flash('success', 'Usuário atualizado com sucesso.')
    return res.redirect('/admin/usuarios')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect(`/admin/usuarios/${req.params.id}/editar`)
  }
}

async function deletar(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.params.id)
    if (!usuario) {
      req.flash('error', 'Usuário não encontrado.')
      return res.redirect('/admin/usuarios')
    }
    await usuario.destroy()
    req.flash('success', 'Usuário arquivado.')
    return res.redirect('/admin/usuarios')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/usuarios')
  }
}

async function restaurar(req, res) {
  try {
    const usuario = await Usuario.findByPk(req.params.id, { paranoid: false })
    if (!usuario) {
      req.flash('error', 'Usuário não encontrado.')
      return res.redirect('/admin/usuarios')
    }
    await usuario.restore()
    req.flash('success', 'Usuário restaurado.')
    return res.redirect('/admin/usuarios')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/usuarios')
  }
}

module.exports = { index, novo, editar, criar, atualizar, deletar, restaurar }
```

## Resultado esperado
Controller com 7 métodos sem dependência de serviço externo.

## Critério de aceite
- `atualizar`: senha só incluída em `campos` se `senha.trim() !== ''`
- `criar`/`atualizar`: `eventoIds = [].concat(eventos || []).map(Number).filter(Boolean)` normaliza string única ou array
- `editar`: inclui `eventoIds` no JSON enviado à view para pré-seleção
- `restaurar` usa `{ paranoid: false }` no `findByPk`
