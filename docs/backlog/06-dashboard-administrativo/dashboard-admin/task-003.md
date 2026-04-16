# DASH-ADMIN-003 — Tabela "Últimos 5 certificados emitidos" no dashboard admin

## Identificador

DASH-ADMIN-003

## Feature

dashboard-admin

## Domínio

06 — Dashboard Administrativo

## Prioridade

ALTA

## Pré-requisitos

- DASH-ADMIN-001 implementado (controller passa `ultimosCertificados` para a view)

## Descrição

Adicionar uma seção "Últimos certificados emitidos" abaixo dos cards no bloco `{{#if usuario.isAdmin}}` do dashboard, exibindo uma tabela resumida com os 5 certificados mais recentes.

---

## Alterações necessárias

### `views/admin/dashboard.hbs`

Inserir após o fechamento `</div>` da row de cards, ainda dentro do bloco `{{#if usuario.isAdmin}}`:

```hbs
{{#if ultimosCertificados.length}}
  <div class='mt-4'>
    <h5 class='mb-3'>Últimos certificados emitidos</h5>
    <div class='table-responsive'>
      <table class='table table-sm table-hover align-middle'>
        <thead class='table-light'>
          <tr>
            <th>Participante</th>
            <th>Evento</th>
            <th>Tipo</th>
            <th>Código</th>
            <th>Status</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {{#each ultimosCertificados}}
            <tr>
              <td>{{this.Participante.nome}}</td>
              <td>{{this.Evento.nome}}</td>
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

**Nota sobre alias da associação:**

- O nome do campo gerado pelo Sequelize no `toJSON()` depende do alias da associação em `Certificado.belongsTo(TiposCertificados, ...)`.
- Se o alias for `tipo_certificado`, o campo será `tipo_certificado` (snake_case) — ajustar `{{this.tipo_certificado.nome}}` conforme o model real.
- Verificar o alias antes de implementar via `src/models/certificado.js`.

**Nota sobre formatação de data:**

- `created_at` será renderizado como ISO string. Para formatação legível, usar um helper Handlebars `formatDate` (a criar ou reutilizar se já existir) ou aceitar o formato padrão ISO em uma primeira iteração.

---

## Critérios de aceite

- [ ] Seção "Últimos certificados emitidos" aparece no dashboard admin quando há certificados cadastrados.
- [ ] Tabela exibe até 5 linhas (limit controlado no controller).
- [ ] Seção **não aparece** quando `ultimosCertificados` está vazio (`{{#if ultimosCertificados.length}}`).
- [ ] Link "Ver todos os certificados" navega para `/admin/certificados`.
- [ ] Colunas Participante, Evento e Tipo exibem os nomes corretos (não IDs).

## Estimativa

P (até 1h — incluindo verificação de alias do model)
