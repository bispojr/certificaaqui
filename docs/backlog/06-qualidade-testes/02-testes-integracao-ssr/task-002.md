# TASK ID: TEST-SSR-002

## Título
Criar `tests/routes/publicSSR.test.js` — POST do fluxo público SSR

## Objetivo
Cobrir `POST /public/pagina/buscar` (busca certificados por e-mail) e `POST /public/pagina/validar` (valida certificado por código), incluindo cenários de sucesso e não-encontrado.

## Contexto
- Rotas POST criadas por CERT-SSR-004 (Domínio 3) em `src/routes/public.js`
- `POST /public/pagina/buscar` com e-mail válido → renderiza `obter-lista.hbs` com certificados
- `POST /public/pagina/buscar` com e-mail sem certificados → renderiza `obter-lista.hbs` com lista vazia (ou redirect com flash)
- `POST /public/pagina/validar` com código válido → renderiza `validar-resultado.hbs` com `valido: true`
- `POST /public/pagina/validar` com código inválido → renderiza `validar-resultado.hbs` com `valido: false`
- Testes verificam `res.status` e `res.text` (HTML)
- Banco de dados real: `beforeAll` cria dados mínimos, `afterAll` faz truncate

## Arquivos envolvidos
- `tests/routes/publicSSR.test.js` ← CRIAR

## Passos

### Criar `tests/routes/publicSSR.test.js`

```js
const request = require('supertest')
const app = require('../../app')
const {
  Participante,
  Certificado,
  Evento,
  TiposCertificados,
  sequelize,
} = require('../../src/models')

let certificadoId

beforeAll(async () => {
  await sequelize.query(
    'TRUNCATE TABLE certificados, tipos_certificados, participantes, eventos RESTART IDENTITY CASCADE',
  )
  const evento = await Evento.create({ nome: 'Ev SSR', codigo_base: 'SSR', ano: 2026 })
  const tipo = await TiposCertificados.create({
    codigo: 'SS',
    descricao: 'Tipo SSR',
    campo_destaque: 'nome',
    texto_base: 'Certificado de ${nome}',
    dados_dinamicos: {},
  })
  const participante = await Participante.create({
    nomeCompleto: 'Carlos SSR',
    email: 'carlos.ssr@test.com',
  })
  const cert = await Certificado.create({
    nome: 'Carlos SSR',
    status: 'emitido',
    participante_id: participante.id,
    evento_id: evento.id,
    tipo_certificado_id: tipo.id,
    codigo: 'SSR-001',
  })
  certificadoId = cert.id
})

afterAll(async () => {
  await sequelize.query(
    'TRUNCATE TABLE certificados, tipos_certificados, participantes, eventos RESTART IDENTITY CASCADE',
  )
})

describe('POST /public/pagina/buscar', () => {
  it('renderiza lista com certificados para e-mail válido', async () => {
    const res = await request(app)
      .post('/public/pagina/buscar')
      .send('email=carlos.ssr@test.com')
      .set('Content-Type', 'application/x-www-form-urlencoded')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/Carlos SSR/)
  })

  it('responde sem erro para e-mail sem certificados', async () => {
    const res = await request(app)
      .post('/public/pagina/buscar')
      .send('email=inexistente@test.com')
      .set('Content-Type', 'application/x-www-form-urlencoded')
    expect([200, 302]).toContain(res.status)
  })
})

describe('POST /public/pagina/validar', () => {
  it('renderiza resultado válido para código existente', async () => {
    const res = await request(app)
      .post('/public/pagina/validar')
      .send('codigo=SSR-001')
      .set('Content-Type', 'application/x-www-form-urlencoded')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/válido|valid|SSR-001/i)
  })

  it('renderiza resultado inválido para código inexistente', async () => {
    const res = await request(app)
      .post('/public/pagina/validar')
      .send('codigo=INVALIDO-999')
      .set('Content-Type', 'application/x-www-form-urlencoded')
    expect(res.status).toBe(200)
    expect(res.text).toMatch(/inválido|not found|não encontrado/i)
  })
})
```

## Critério de aceite
- `POST /public/pagina/buscar` com e-mail existente: 200 + HTML contendo nome do participante
- `POST /public/pagina/buscar` com e-mail inexistente: não retorna 500
- `POST /public/pagina/validar` com código válido: 200 + HTML indicando certificado válido
- `POST /public/pagina/validar` com código inválido: 200 + HTML indicando inválido
- Setup e teardown isolam os dados com TRUNCATE CASCADE
