const certificadoService = require('../../src/services/certificadoService')
const {
  Evento,
  Participante,
  TiposCertificados,
  sequelize,
} = require('../../src/models')

describe('service-scope-enforcement integration', () => {
  let evento, participante, tipoCertificado

  beforeEach(async () => {
    const tables = [
      'certificados',
      'tipos_certificados',
      'participante_eventos',
      'usuario_eventos',
      'participantes',
      'usuarios',
      'eventos',
    ]

    await sequelize.query(
      `TRUNCATE TABLE ${tables
        .map((table) => `"${table}"`)
        .join(', ')} RESTART IDENTITY CASCADE`,
    )

    evento = await Evento.create({
      nome: 'Evento Escopo Teste',
      codigo_base: 'ESC',
      ano: 2026,
    })

    participante = await Participante.create({
      nomeCompleto: 'Participante Teste',
      email: 'participante.escopo@teste.com',
    })

    tipoCertificado = await TiposCertificados.create({
      evento_id: evento.id,
      codigo: 'PT',
      descricao: 'Tipo de teste para escopo',
      campo_destaque: 'nome',
      texto_base: 'Certificamos ${nome_completo}.',
      dados_dinamicos: {},
    })
  })

  it('nega criação fora do escopo do gestor antes de persistir', async () => {
    await expect(
      certificadoService.create(
        {
          evento_id: 999,
          tipo_certificado_id: tipoCertificado.id,
          participante_id: participante.id,
          nome: 'Teste',
          valores_dinamicos: {},
        },
        {
          principal: { role: 'gestor' },
          eventoIds: [evento.id],
        },
      ),
    ).rejects.toThrow('fora do escopo autorizado')
  })

  it('permite criação dentro do escopo do gestor', async () => {
    await expect(
      certificadoService.create(
        {
          evento_id: evento.id,
          tipo_certificado_id: tipoCertificado.id,
          participante_id: participante.id,
          nome: 'Teste válido',
          valores_dinamicos: {},
        },
        {
          principal: { role: 'gestor' },
          eventoIds: [evento.id],
        },
      ),
    ).resolves.toMatchObject({
      evento_id: evento.id,
      nome: 'Teste válido',
      participante_id: participante.id,
      tipo_certificado_id: tipoCertificado.id,
      status: 'emitido',
    })
  })
})
