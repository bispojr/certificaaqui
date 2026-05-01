const { Usuario } = require('../models')
const bcrypt = require('bcryptjs')
const senhaForteSchema = require('../validators/senhaForte')

async function formulario(req, res) {
  return res.render('admin/perfil/alterar-senha', {
    layout: 'layouts/admin',
    title: 'Alterar Senha',
  })
}

async function alterarSenha(req, res) {
  const { senhaAtual, novaSenha, confirmarSenha } = req.body

  if (novaSenha !== confirmarSenha) {
    req.flash('error', 'A nova senha e a confirmação não coincidem.')
    return res.redirect('/admin/perfil/alterar-senha')
  }

  const resultado = senhaForteSchema.safeParse(novaSenha)
  if (!resultado.success) {
    const mensagens = resultado.error.errors.map((e) => e.message)
    mensagens.forEach((m) => req.flash('error', m))
    return res.redirect('/admin/perfil/alterar-senha')
  }

  try {
    const usuario = await Usuario.findByPk(req.usuario.id)
    if (!usuario) {
      req.flash('error', 'Usuário não encontrado.')
      return res.redirect('/admin/perfil/alterar-senha')
    }

    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha)
    if (!senhaValida) {
      req.flash('error', 'Senha atual incorreta.')
      return res.redirect('/admin/perfil/alterar-senha')
    }

    await usuario.update({ senha: novaSenha })
    req.flash('success', 'Senha alterada com sucesso.')
    return res.redirect('/admin/dashboard')
  } catch (error) {
    req.flash('error', error.message)
    return res.redirect('/admin/perfil/alterar-senha')
  }
}

module.exports = { formulario, alterarSenha }
