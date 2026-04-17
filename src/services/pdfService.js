const PDFDocument = require('pdfkit')
const templateService = require('./templateService')

module.exports = {
  /**
   * Gera o PDF de um certificado.
   * @param {Object} certificado - Certificado com associações já carregadas (TiposCertificados, Participante, Evento)
   * @returns {Promise<Buffer>} Buffer do PDF gerado
   */
  async generateCertificadoPdf(certificado) {
    // Lazy require para evitar dependência circular
    const r2Service = require('./r2Service')
    return new Promise(async (resolve, reject) => {
      try {
        // Log para depuração
        console.log('PDFService certificado:', certificado)
        if (!certificado.codigo) {
          return reject(new Error('Código de validação obrigatório'))
        }
        // Layout: paisagem, tamanho A4 (em pontos)
        const doc = new PDFDocument({
          layout: 'landscape',
          size: [594.96, 841.92], // A4 landscape em pontos
        })
        doc.page.margins.bottom = 0
        const buffers = []
        doc.on('data', buffers.push.bind(buffers))
        doc.on('end', () => {
          resolve(Buffer.concat(buffers))
        })

        // --- NOVO: Buscar e inserir imagem de fundo do R2 ---
        const backgroundKey =
          certificado.Evento?.url_template_base || 'template/padrao.jpg'
        try {
          const bgResult = await r2Service.getFile(backgroundKey)
          if (bgResult && bgResult.Body) {
            // PDFKit exige buffer, x=0, y=0 para fundo
            doc.image(bgResult.Body, 0, 0, {
              width: doc.page.width,
              height: doc.page.height,
            })
          }
        } catch (err) {
          console.warn(
            'Não foi possível carregar o background do R2:',
            err.message,
          )
        }
        // --- FIM NOVO ---

        // --- Buscar fonte Lato-Medium do R2 ---
        let fontBuffer = null
        try {
          const fontResult = await r2Service.getFile('fontes/Lato-Medium.ttf')
          if (fontResult && fontResult.Body) {
            fontBuffer = fontResult.Body
          }
        } catch (err) {
          console.warn(
            'Não foi possível carregar a fonte do R2, usando fonte padrão:',
            err.message,
          )
        }
        const setFont = () => {
          if (fontBuffer) {
            doc.font(fontBuffer)
          } else {
            doc.font('Helvetica')
          }
        }
        // --- FIM fonte ---

        // Dados principais
        const evento = certificado.Evento
        const participante = certificado.Participante
        // Corrige para aceitar tanto TiposCertificados (plural) quanto TiposCertificado (singular)
        const tipo =
          certificado.TiposCertificado || certificado.TiposCertificados
        if (!tipo || !tipo.texto_base) {
          return reject(
            new Error('Tipo de certificado inválido ou sem texto_base'),
          )
        }
        let texto
        try {
          // Monta objeto de interpolação priorizando nome do certificado/participante
          const valores = {
            ...certificado.valores_dinamicos,
            nome: certificado.nome || participante?.nomeCompleto,
            evento: evento?.nome,
            // Adicione outros campos se necessário
          }
          texto = templateService.interpolate(
            tipo.texto_base,
            valores,
            valores.nome,
          )
        } catch (err) {
          return reject(new Error(err.message || 'Erro de interpolação'))
        }

        // Layout detalhado inspirado no obterArquivo

        // Coordenadas do texto-base (configuráveis por evento)
        const textoX = evento?.texto_x ?? 270
        const textoY = evento?.texto_y ?? 200

        // Texto base interpolado
        doc.fontSize(texto.length > 400 ? 10 : 14)
        setFont()
        doc.text(texto, textoX, textoY, { width: 480, align: 'justify' })

        // Coordenadas da validação (configuráveis por evento)
        const validacaoX = evento?.validacao_x ?? 145
        const validacaoY = evento?.validacao_y ?? 545

        // Código de validação e link
        const endereco_validacao =
          process.env.ENDERECO_VALIDACAO || 'https://certificaaqui.com/validar'
        doc.fontSize(9.5)
        setFont()
        doc
          .fillColor('black')
          .text(
            `Use o código ${certificado.codigo} para validar o certificado em: `,
            validacaoX,
            validacaoY,
            { width: doc.page.width, align: 'left' },
          )
        doc
          .fillColor('blue')
          .text(`${endereco_validacao}`, validacaoX + 247, validacaoY, {
            link: endereco_validacao,
            underline: true,
          })
        doc.fillColor('black')

        doc.end()
      } catch (err) {
        reject(err)
      }
    })
  },
}
