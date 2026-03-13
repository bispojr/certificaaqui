const { Usuario } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

module.exports = {
  async login(req, res) {
    const { email, senha } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) return res.status(401).json({ error: 'Usuário não encontrado' });
    const valid = await bcrypt.compare(senha, usuario.senha);
    if (!valid) return res.status(401).json({ error: 'Senha inválida' });
    const token = jwt.sign({ id: usuario.id, perfil: usuario.perfil }, JWT_SECRET, { expiresIn: '1h' });
    return res.json({ token });
  },

  async logout(req, res) {
    // Logout é stateless com JWT, apenas orienta o frontend a descartar o token
    return res.status(200).json({ message: 'Logout realizado' });
  },

  async me(req, res) {
    if (!req.usuario) return res.status(401).json({ error: 'Não autenticado' });
    const usuario = await Usuario.findByPk(req.usuario.id);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
    return res.json({ id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil });
  }
};
