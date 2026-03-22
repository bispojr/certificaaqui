# TASK ID: CERT-SSR-004

## Título

Adicionar rotas SSR POST em `src/routes/public.js` (buscar por e-mail e validar por código)

## Objetivo

Adicionar `POST /public/pagina/buscar` e `POST /public/pagina/validar` que reutilizam os modelos já importados para buscar/validar e renderizam as views de resultado.

## Contexto

- `src/routes/public.js` já importa `Certificado`, `Participante`, `Evento`, `TiposCertificados`
- Executar APÓS CERT-SSR-001 e CERT-SSR-002 (as views de resultado já devem existir)
- `POST /public/pagina/buscar`: lê `req.body.email`, busca `Participante` por email, depois `Certificado.findAll` do participante, renderiza `certificados/obter-lista`
- `POST /public/pagina/validar`: lê `req.body.codigo`, busca `Certificado.findOne` com includes, renderiza `certificados/validar-resultado`
- Adicionar após as rotas GET da CERT-SSR-003, antes de `module.exports = router`
- Requer `express.urlencoded` já habilitado (está em `app.js`)

## Arquivos envolvidos

- `src/routes/public.js`

## Passos

Após as rotas GET adicionadas em CERT-SSR-003, adicionar:

```js
router.post('/pagina/buscar', async (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.render('certificados/form-obter', {
      mensagem: 'Informe um e-mail válido.',
    })
  }
  try {
    const participante = await Participante.findOne({ where: { email } })
    if (!participante) {
      return res.render('certificados/form-obter', {
        mensagem: 'Nenhum participante encontrado com este e-mail.',
      })
    }
    const certificados = await Certificado.findAll({
      where: { participante_id: participante.id },
    })
    return res.render('certificados/obter-lista', { email, certificados })
  } catch (_) {
    return res.render('certificados/form-obter', {
      mensagem: 'Erro ao buscar certificados. Tente novamente.',
    })
  }
})

router.post('/pagina/validar', async (req, res) => {
  const { codigo } = req.body
  if (!codigo) {
    return res.render('certificados/form-validar', {
      mensagem: 'Informe o código do certificado.',
    })
  }
  try {
    const certificado = await Certificado.findOne({
      where: { codigo },
      include: [{ model: Participante }, { model: Evento }],
    })
    if (!certificado) {
      return res.render('certificados/validar-resultado', { valido: false })
    }
    return res.render('certificados/validar-resultado', {
      valido: true,
      certificado,
    })
  } catch (_) {
    return res.render('certificados/form-validar', {
      mensagem: 'Erro ao validar certificado. Tente novamente.',
    })
  }
})
```

## Resultado esperado

- `POST /public/pagina/buscar` com email válido → renderiza `obter-lista.hbs` com certificados
- `POST /public/pagina/buscar` sem email → re-renderiza `form-obter.hbs` com mensagem
- `POST /public/pagina/validar` com código válido → renderiza `validar-resultado.hbs` com `valido: true`
- `POST /public/pagina/validar` com código inválido → renderiza `validar-resultado.hbs` com `valido: false`

## Critério de aceite

- Nenhuma rota JSON existente modificada
- Re-renderiza o formulário com `mensagem` em caso de erro de validação ou busca vazia
- Inclui `Participante` e `Evento` no resultado de validação (necessário para a view)
