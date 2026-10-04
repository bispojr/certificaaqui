const {
  CAMPOS_PARTICIPANTE,
  normalizarCabecalho,
  validarAliases,
  identificarCampo,
} = require('../../src/utils/cabecalhosParticipante')

describe('cabecalhosParticipante', () => {
  describe('normalizarCabecalho', () => {
    test.each([
      ['NOME COMPLETO', 'nome completo'],
      ['Nome Completo', 'nome completo'],
      ['  nome   completo  ', 'nome completo'],
      ['INSTITUIÇÃO DE ENSINO', 'instituicao de ensino'],
      ['instituição/empresa', 'instituicao/empresa'],
      ['E-Mail', 'e-mail'],
      ['e mail', 'e mail'],
      ['  EMAIL  ', 'email'],
      ['', ''],
    ])('normaliza "%s" para "%s"', (entrada, esperado) => {
      expect(normalizarCabecalho(entrada)).toBe(esperado)
    })

    test.each([null, undefined, 123, {}, []])(
      'retorna string vazia para entrada não-string (%p)',
      (entrada) => {
        expect(normalizarCabecalho(entrada)).toBe('')
      },
    )
  })

  describe('identificarCampo', () => {
    test.each([
      ['nomeCompleto', 'nomeCompleto'],
      ['nome completo', 'nomeCompleto'],
      ['NOME COMPLETO', 'nomeCompleto'],
      ['Nome', 'nomeCompleto'],
      ['NOME', 'nomeCompleto'],
      ['email', 'email'],
      ['E-Mail', 'email'],
      ['E MAIL', 'email'],
      ['e mail', 'email'],
      ['instituicao', 'instituicao'],
      ['instituição', 'instituicao'],
      ['INSTITUIÇÃO DE ENSINO', 'instituicao'],
      ['instituicao de ensino', 'instituicao'],
      ['Instituição/Empresa', 'instituicao'],
      ['INSTITUICAO/EMPRESA', 'instituicao'],
    ])(
      'mapeia o cabeçalho "%s" para o campo interno "%s"',
      (cabecalho, campoEsperado) => {
        expect(identificarCampo(cabecalho)).toBe(campoEsperado)
      },
    )

    test.each(['cargo', 'telefone', 'cpf', 'rua', '', '  '])(
      'retorna null para cabeçalho não reconhecido "%s"',
      (cabecalho) => {
        expect(identificarCampo(cabecalho)).toBeNull()
      },
    )
  })

  describe('validarAliases', () => {
    test('não lança erro para a configuração válida padrão', () => {
      expect(() => validarAliases(CAMPOS_PARTICIPANTE)).not.toThrow()
    })

    test('lança erro de ambiguidade quando o mesmo alias normalizado mapeia para campos diferentes', () => {
      const configAmbigua = {
        nomeCompleto: {
          aliases: ['nome'],
        },
        responsavel: {
          aliases: ['NOME'],
        },
      }

      expect(() => validarAliases(configAmbigua)).toThrow(
        /Alias "NOME" está associado a mais de um campo/,
      )
    })
  })
})
