const { Usuario } = require('../models')

async function existsAdmin() {
  const admin = await Usuario.findOne({ where: { perfil: 'admin' } })
  return Boolean(admin)
}

async function createFirstAdmin({ nome, email, senha }) {
  const existingAdmin = await Usuario.findOne({ where: { perfil: 'admin' } })
  if (existingAdmin) {
    return { created: false, reason: 'admin_exists', usuario: existingAdmin }
  }

  const existingEmail = await Usuario.findOne({ where: { email } })
  if (existingEmail) {
    return { created: false, reason: 'email_in_use' }
  }

  try {
    const usuario = await Usuario.create({
      nome,
      email,
      senha,
      perfil: 'admin',
    })

    return { created: true, usuario }
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      const adminAfterRace = await Usuario.findOne({ where: { perfil: 'admin' } })
      if (adminAfterRace) {
        return {
          created: false,
          reason: 'admin_exists',
          usuario: adminAfterRace,
        }
      }
      return { created: false, reason: 'email_in_use' }
    }

    throw error
  }
}

module.exports = {
  existsAdmin,
  createFirstAdmin,
}
