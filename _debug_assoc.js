process.env.NODE_ENV = 'e2e'
const {
  Certificado,
  Participante,
  Evento,
  TiposCertificados,
} = require('./src/models')

Certificado.findOne({
  where: { codigo: 'E2E-2026-001' },
  include: [
    { model: Participante },
    { model: Evento },
    { model: TiposCertificados },
  ],
})
  .then((c) => {
    if (!c) return console.log('nao encontrado')
    const j = c.toJSON()
    console.log('Keys:', Object.keys(j))
    console.log('TiposCertificados:', JSON.stringify(j.TiposCertificados))
  })
  .catch((e) => console.error(e.message))
  .finally(() => process.exit(0))
