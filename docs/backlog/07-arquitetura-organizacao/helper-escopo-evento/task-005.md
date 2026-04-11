# ARQ-ESC-005 — Verificar `eventoSSRController` e `tiposCertificadosSSRController` quanto ao escopo

## Identificador
ARQ-ESC-005

## Feature
helper-escopo-evento

## Domínio
07 — Arquitetura e Organização de Código

## Prioridade
ALTA

## Pré-requisitos
- ARQ-ESC-001 implementado

## Descrição

Verificar se `eventoSSRController.js` e `tiposCertificadosSSRController.js` possuem lógica de escopo por evento inline e, se houver, substituí-la por `getScopedEventoIds`.

---

## O que verificar

### `src/controllers/eventoSSRController.js`

Confirmar via grep se o arquivo contém alguma das seguintes construções:
- `Usuario.findByPk(req.usuario.id, { include: 'eventos' })`
- `UsuarioEvento.findAll({ where: { usuario_id: ... } })`
- Verificação de `req.usuario.perfil !== 'admin'` seguida de query de escopo

**Resultado esperado da verificação (a confirmar durante implementação):**  
`eventoSSRController` provavelmente filtra eventos pelo próprio usuário logado com outro mecanismo (ex.: `scopedEvento` middleware), não pelo padrão de `getScopedEventoIds`. Documentar se aplicável.

### `src/controllers/tiposCertificadosSSRController.js`

Tipos de certificados são globais (não têm escopo por evento), portanto este controller provavelmente **não** precisa de `getScopedEventoIds`. Confirmar que não há lógica de escopo incorreta.

---

## Ação esperada

- Se nenhum dos dois controllers tiver a lógica de escopo inline → **nenhuma alteração necessária**. Documentar a conclusão em comentário no arquivo de task.
- Se algum tiver → substituir pelo utilitário centralizado seguindo o padrão de ARQ-ESC-002 e ARQ-ESC-003.

---

## Critérios de aceite

- [ ] Ambos os controllers foram verificados.
- [ ] Nenhum dos dois mantém lógica de escopo divergente do padrão `getScopedEventoIds`.
- [ ] Conclusão documentada (aplicável ou N/A) para cada controller.

## Estimativa
PP (até 15min — verificação + ação pontual se necessária)
