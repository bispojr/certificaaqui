# TASK ID: DASH-002

## Título
Criar `views/admin/dashboard.hbs`

## Objetivo
View Handlebars do dashboard administrativo com cards Bootstrap condicionais: 4 cards para admin, 2 cards para gestor/monitor.

## Contexto
- Layout: `layouts/admin`
- admin.hbs popula `res.locals.usuario` com `{ isAdmin, isGestor, ... }`; a view usa `{{#if usuario.isAdmin}}`
- Dados admin: `totalEventos`, `totalTipos`, `totalParticipantes`, `totalUsuarios`
- Dados gestor/monitor: `totalCertificados`, `totalParticipantes`
- Cards Bootstrap 5: `.card` com `.card-body`, `.display-4` para número, `.card-title` para rótulo
- Links dos cards levam às respectivas listagens (`/admin/eventos`, `/admin/participantes`, etc.)

## Arquivos envolvidos
- `views/admin/dashboard.hbs` ← CRIAR (incluindo diretório `views/admin/`)

## Passos

### Criar `views/admin/dashboard.hbs`

```hbs
{{#> layouts/admin}}
  <h2 class="mb-4">Dashboard</h2>

  {{#if usuario.isAdmin}}
    <div class="row g-3">
      <div class="col-sm-6 col-lg-3">
        <a href="/admin/eventos" class="text-decoration-none">
          <div class="card text-center border-primary h-100">
            <div class="card-body">
              <div class="display-4 fw-bold text-primary">{{totalEventos}}</div>
              <div class="card-title text-muted mt-2">Eventos</div>
            </div>
          </div>
        </a>
      </div>
      <div class="col-sm-6 col-lg-3">
        <a href="/admin/tipos-certificados" class="text-decoration-none">
          <div class="card text-center border-success h-100">
            <div class="card-body">
              <div class="display-4 fw-bold text-success">{{totalTipos}}</div>
              <div class="card-title text-muted mt-2">Tipos de Certificados</div>
            </div>
          </div>
        </a>
      </div>
      <div class="col-sm-6 col-lg-3">
        <a href="/admin/participantes" class="text-decoration-none">
          <div class="card text-center border-warning h-100">
            <div class="card-body">
              <div class="display-4 fw-bold text-warning">{{totalParticipantes}}</div>
              <div class="card-title text-muted mt-2">Participantes</div>
            </div>
          </div>
        </a>
      </div>
      <div class="col-sm-6 col-lg-3">
        <a href="/admin/usuarios" class="text-decoration-none">
          <div class="card text-center border-danger h-100">
            <div class="card-body">
              <div class="display-4 fw-bold text-danger">{{totalUsuarios}}</div>
              <div class="card-title text-muted mt-2">Usuários</div>
            </div>
          </div>
        </a>
      </div>
    </div>

  {{else}}
    {{! gestor ou monitor — cards escopados aos seus eventos }}
    <div class="row g-3">
      <div class="col-sm-6">
        <a href="/admin/certificados" class="text-decoration-none">
          <div class="card text-center border-primary h-100">
            <div class="card-body">
              <div class="display-4 fw-bold text-primary">{{totalCertificados}}</div>
              <div class="card-title text-muted mt-2">Certificados (seus eventos)</div>
            </div>
          </div>
        </a>
      </div>
      <div class="col-sm-6">
        <a href="/admin/participantes" class="text-decoration-none">
          <div class="card text-center border-success h-100">
            <div class="card-body">
              <div class="display-4 fw-bold text-success">{{totalParticipantes}}</div>
              <div class="card-title text-muted mt-2">Participantes (seus eventos)</div>
            </div>
          </div>
        </a>
      </div>
    </div>
  {{/if}}
{{/layouts/admin}}
```

## Resultado esperado
Dashboard com 4 cards coloridos para admin e 2 cards para gestor/monitor, todos clicáveis.

## Critério de aceite
- Admin vê 4 cards: Eventos (azul), Tipos (verde), Participantes (amarelo), Usuários (vermelho)
- Gestor/monitor vê 2 cards escopados com subtítulo "(seus eventos)"
- Cards são links para as respectivas listagens
- Nenhum card exibe valores de outros perfis (condicional `{{#if usuario.isAdmin}}` isola os blocos)
