const PDFDocument = require('pdfkit')
const templateService = require('./templateService')
const { resolveTemplateConfig } = require('./templateLayoutService')

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
          texto = templateService
            .interpolate(tipo.texto_base, valores, valores.nome)
            .trim()
        } catch (err) {
          return reject(new Error(err.message || 'Erro de interpolação'))
        }

        // Layout detalhado inspirado no obterArquivo
        const templateConfig = resolveTemplateConfig(evento || {})
        const nomeBlock = templateConfig.blocks.nome
        const textoBlock = templateConfig.blocks.texto_base
        const validacaoBlock = templateConfig.blocks.validacao

        if (templateConfig.template === 'nome-destaque') {
          const nomeParticipante =
            participante?.nomeCompleto || certificado?.nome || 'Participante'
          const nomeX = Number(nomeBlock.x ?? 0)
          const nomeY = Number(nomeBlock.y ?? 240)
          const nomeFontSize = Number(nomeBlock.fontSize ?? 28)

          doc.fontSize(nomeFontSize)
          setFont()
          doc.text(nomeParticipante, nomeX, nomeY, {
            width: Number(nomeBlock.width ?? 595),
            align: nomeBlock.align || 'center',
          })
        }

        // Coordenadas do texto-base configuráveis por evento/template
        const textoX = Number(textoBlock.x ?? 270)
        const textoY = Number(textoBlock.y ?? 200)

        // Tamanho da fonte configurável por evento/template com fallback dinâmico
        const explicitTextoFontSize =
          Number(evento?.texto_tamanho_fonte) > 0
            ? Number(evento.texto_tamanho_fonte)
            : Number(evento?.template_config?.texto_base?.fontSize) > 0
              ? Number(evento.template_config.texto_base.fontSize)
              : null

        const tamanhoFonte =
          explicitTextoFontSize !== null
            ? explicitTextoFontSize
            : texto.length > 400
              ? 10
              : 14

        // Texto base interpolado
        doc.fontSize(tamanhoFonte)
        setFont()
        doc.text(texto, textoX, textoY, {
          width: textoBlock.width || 480,
          align: textoBlock.align || 'justify',
        })

        // Coordenadas e rotação da validação (configuráveis por evento)
        const validacaoX = Number(validacaoBlock.x ?? 145)
        const validacaoY = Number(validacaoBlock.y ?? 545)
        const validacaoRotacao = Number(validacaoBlock.rotation ?? 0)

        doc.save()
        doc.rotate(validacaoRotacao, { origin: [validacaoX, validacaoY] })

        // Código de validação e link
        const endereco_validacao =
          process.env.ENDERECO_VALIDACAO || 'https://certificaaqui.com/validar'
        doc.fontSize(validacaoBlock.fontSize || 9.5)
        setFont()
        doc
          .fillColor('black')
          .text(
            `Use o código ${certificado.codigo} para validar o certificado em: `,
            validacaoX,
            validacaoY,
            { continued: true, align: validacaoBlock.align || 'left' },
          )
        doc.fillColor('blue').text(`${endereco_validacao}`, {
          link: endereco_validacao,
          underline: true,
          continued: false,
        })
        doc.fillColor('black')

        doc.restore()

        doc.end()
      } catch (err) {
        reject(err)
      }
    })
  },
}
