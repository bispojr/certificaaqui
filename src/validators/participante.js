const { z } = require('zod')

const participanteSchema = z.object({
  nomeCompleto: z.string().min(3),
  email: z.string().email(),
  instituicao: z.string().min(2),
})

module.exports = participanteSchema
