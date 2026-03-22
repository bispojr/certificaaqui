# TASK ID: INFRA-MIGRATIONS-001

## Título
Criar migration de índices de performance

## Objetivo
Criar o arquivo de migration Sequelize que adiciona 5 índices nas tabelas `certificados`, `participantes` e `usuarios`, acelerando queries por `evento_id`, `participante_id`, `status` e `email`.

## Contexto

As migrações de tabelas já existem em `/migrations/`. O padrão adotado no projeto é:
- Arquivo `up` usa `queryInterface.addIndex`
- Arquivo `down` usa `queryInterface.removeIndex`
- Nomeação: `YYYYMMDDHHMMSS-<descricao>.js`

O timestamp a ser usado no nome do arquivo deve ser obtido com `date +%Y%m%d%H%M%S` para garantir unicidade.

Índices a criar:
| Nome | Tabela | Coluna |
|------|--------|--------|
| `idx_certificados_evento_id` | `certificados` | `evento_id` |
| `idx_certificados_participante_id` | `certificados` | `participante_id` |
| `idx_certificados_status` | `certificados` | `status` |
| `idx_participantes_email` | `participantes` | `email` |
| `idx_usuarios_email` | `usuarios` | `email` |

## Arquivos envolvidos

- `migrations/<timestamp>-create-performance-indexes.js` ← criar

## Passos

1. Executar `date +%Y%m%d%H%M%S` no terminal para obter o timestamp.
2. Criar o arquivo `migrations/<timestamp>-create-performance-indexes.js` com o conteúdo abaixo.
3. No método `up`, chamar `queryInterface.addIndex` para cada um dos 5 índices usando o `name` explícito.
4. No método `down`, chamar `queryInterface.removeIndex` para cada um dos 5 índices, na ordem inversa.

### Estrutura do arquivo

```js
'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('certificados', ['evento_id'], {
      name: 'idx_certificados_evento_id',
    })
    await queryInterface.addIndex('certificados', ['participante_id'], {
      name: 'idx_certificados_participante_id',
    })
    await queryInterface.addIndex('certificados', ['status'], {
      name: 'idx_certificados_status',
    })
    await queryInterface.addIndex('participantes', ['email'], {
      name: 'idx_participantes_email',
    })
    await queryInterface.addIndex('usuarios', ['email'], {
      name: 'idx_usuarios_email',
    })
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('usuarios', 'idx_usuarios_email')
    await queryInterface.removeIndex('participantes', 'idx_participantes_email')
    await queryInterface.removeIndex('certificados', 'idx_certificados_status')
    await queryInterface.removeIndex(
      'certificados',
      'idx_certificados_participante_id',
    )
    await queryInterface.removeIndex(
      'certificados',
      'idx_certificados_evento_id',
    )
  },
}
```

## Resultado esperado

Arquivo de migration criado em `/migrations/` com timestamp único, que ao rodar `npx sequelize-cli db:migrate` adiciona os 5 índices e ao rodar `db:migrate:undo` os remove.

## Critério de aceite

- Arquivo criado com timestamp obtido do sistema (não inventado)
- Contém exatamente 5 `addIndex` no `up` com os nomes corretos
- Contém exatamente 5 `removeIndex` no `down` na ordem inversa
- `npm run check` passa sem erros após a criação
