const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const secret = process.env.JWT_SECRET || 'segredo-super-seguro';

module.exports = async function auth(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
    const decoded = jwt.verify(token, secret);
    const usuario = await Usuario.findByPk(decoded.id);
    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    req.usuario = usuario;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
