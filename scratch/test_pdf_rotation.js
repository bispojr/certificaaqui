const pdfService = require('../src/services/pdfService')
const fs = require('fs')
const path = require('path')

async function run() {
  const angles = [0, 90, 180, 270]
  for (const angulo of angles) {
    const cert = {
      codigo: `VAL-ROT-${angulo}`,
      nome: 'Usuário Teste Rotação',
      valores_dinamicos: {},
      Evento: {
        nome: `Evento Teste ${angulo}°`,
        validacao_x: 145,
        validacao_y: 545,
        validacao_rotacao: angulo,
      },
      Participante: { nomeCompleto: 'Usuário Teste Rotação' },
      TiposCertificados: {
        texto_base:
          'Certificamos que ${nome} participou do Evento com sucesso.',
      },
    }
    const pdfBuffer = await pdfService.generateCertificadoPdf(cert)
    const outPath = path.join(__dirname, `certificado_${angulo}deg.pdf`)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, pdfBuffer)
    console.log(
      `Gerado PDF (${angulo}°): ${outPath} [${pdfBuffer.length} bytes]`,
    )
  }
}

run().catch((err) => {
  console.error('Erro:', err)
  process.exit(1)
})
