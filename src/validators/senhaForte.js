const { z } = require('zod')

const senhaForteSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'A senha deve conter ao menos uma letra maiúscula')
  .regex(/[a-z]/, 'A senha deve conter ao menos uma letra minúscula')
  .regex(/[0-9]/, 'A senha deve conter ao menos um número')
  .regex(
    /[^A-Za-z0-9]/,
    'A senha deve conter ao menos um caractere especial (ex.: !@#$%^&*)',
  )

module.exports = senhaForteSchema
