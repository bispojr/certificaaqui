# DASH-GEST-003 — Tabelas "por tipo" e "últimos certificados" na view do gestor

## Identificador
DASH-GEST-003

## Feature
dashboard-gestor

## Domínio
06 — Dashboard Administrativo

## Prioridade
MÉDIA

## Pré-requisitos
- DASH-GEST-002 implementado (controller passa `porTipo` e `ultimosCertificadosGestor` para a view)

## Descrição

Adicionar duas novas seções ao bloco `{{else}}` (gestor/monitor) em `views/admin/dashboard.hbs`:

1. **Tabela "Certificados por tipo"** — uma linha por tipo de certificado com nome e contagem total.
2. **Tabela "Últimos 5 certificados emitidos"** — participante, tipo, código e data, escopados ao gestor.

---

## Alterações necessárias

### `views/admin/dashboard.hbs` — dentro do bloco `{{else}}`

Inserir **após** o fechamento `</div>` da row de cards do gestor:

```hbs
{{#if porTipo.length}}
  <div class='mt-4'>
    <h5 class='mb-3'>Certificados por tipo</h5>
    <div class='table-responsive'>
      <table class='table table-sm table-hover align-middle'>
        <thead class='table-light'>
          <tr>
            <th>Tipo de Certificado</th>
            <th class='text-end'>Total emitido</th>
          </tr>
        </thead>
        <tbody>
          {{#each porTipo}}
            <tr>
              <td>{{this.TiposCertificado.nome}}</td>
              <td class='text-end fw-bold'>{{this.total}}</td>
            </tr>
          {{/each}}
        </tbody>
      </table>
    </div>
  </div>
{{/if}}

{{#if ultimosCertificadosGestor.length}}
  <div class='mt-4'>
    <h5 class='mb-3'>Últimos certificados emitidos</h5>
    <div class='table-responsive'>
      <table class='table table-sm table-hover align-middle'>
        <thead class='table-light'>
          <tr>
            <th>Participante</th>
            <th>Tipo</th>
            <th>Código</th>
            <th>Status</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {{#each ultimosCertificadosGestor}}
            <tr>
              <td>{{this.Participante.nome}}</td>
              <td>{{this.TiposCertificado.nome}}</td>
              <td><code>{{this.codigo}}</code></td>
              <td>{{this.status}}</td>
              <td>{{this.created_at}}</td>
            </tr>
          {{/each}}
        </tbody>
      </table>
    </div>
    <a href='/admin/certificados' class='btn btn-sm btn-outline-secondary'>
      Ver todos os certificados
    </a>
  </div>
{{/if}}
```

**Notas de implementação:**
- O nome do campo `TiposCertificado.nome` deve ser ajustado para o alias real da associação (verificar em DASH-GEST-002).
- As seções ficam ocultas automaticamente quando os arrays estão vazios — sem JavaScript necessário.
- Ambas as seções ficam **dentro do bloco `{{else}}`**, portanto invísíveis para o admin.

---

## Critérios de aceite

- [ ] Bloco `{{else}}` do dashboard exibe a tabela de breakdown por tipo quando `porTipo.length > 0`.
- [ ] Bloco `{{else}}` exibe a tabela de últimos certificados quando `ultimosCertificadosGestor.length > 0`.
- [ ] Quando o gestor não tem eventos vinculados, nenhuma das tabelas é renderizada (arrays vazios).
- [ ] Tabela por tipo exibe o nome do tipo corretamente (não o ID).
- [ ] O link "Ver todos os certificados" navega para `/admin/certificados`.

## Estimativa
PP (até 30min)
