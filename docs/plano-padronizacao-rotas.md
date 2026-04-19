# Plano de Padronização de Rotas Protegidas por Papel e ID

## 1. Ordem das alterações

- 1. usuários (apenas admin pode acessar/gerenciar)
- 2. dashboards: a página inicial (dashboard) de cada usuário autenticado ficará em `<papel>/<id>` (ex: admin/42, gestor/17, monitor/8). A antiga rota 'admin/dashboard' será padronizada para `admin/<id>` para o admin logado.
- 3. eventos
- 4. participantes
- 5. tipos-certificados
- 6. certificados

> **Observação:** páginas públicas (ex: validação, busca, download de certificado) não entram na padronização de rotas por papel/id, pois são acessíveis sem autenticação.

## 2. Atualização das rotas no backend
- Refatorar as rotas para o padrão: `<papel>/<id>/<recurso>/[ação]`
- Exemplo: gestor/17/tipos-certificados/novo, admin/42/eventos, monitor/8/certificados
- O parâmetro `:papel` pode ser `admin`, `gestor`, `monitor`.
- O parâmetro `:id` é o id do usuário autenticado.
- O parâmetro do recurso (ex: `:tipoId`, `:certificadoId`) segue o padrão atual.

Exemplo Express:
```js
router.get('/:papel/:id/tipos-certificados', tiposCertificadosController.list);
router.get('/:papel/:id/tipos-certificados/novo', tiposCertificadosController.createForm);
router.post('/:papel/:id/tipos-certificados', tiposCertificadosController.create);
router.get('/:papel/:id/tipos-certificados/:tipoId/editar', tiposCertificadosController.editForm);
router.post('/:papel/:id/tipos-certificados/:tipoId', tiposCertificadosController.update);
// Repita para outros recursos
```

## 3. Ajuste dos controllers
- Receber os parâmetros `papel` e `id` (ex: `req.params.papel`, `req.params.id`)
- Validar se o usuário autenticado realmente corresponde ao papel e id informados (ou se tem permissão para acessar)
- Adaptar as queries para filtrar dados conforme o papel/id

Exemplo:
```js
exports.list = async (req, res) => {
  const { papel, id } = req.params;
  const usuarioLogado = req.user;
  if (usuarioLogado.papel !== papel || usuarioLogado.id !== Number(id)) {
    return res.status(403).send('Acesso negado');
  }
  // ...lógica do recurso...
};
```

## 4. Atualização das views/front-end
- Atualizar todos os links, formulários e redirecionamentos para usar o novo padrão de rotas
- Certificar-se de que, ao renderizar páginas, o id do usuário logado e o papel estejam disponíveis para compor as URLs
- Ajustar formulários para enviar requisições para as novas rotas
- Atualizar qualquer lógica de navegação para refletir o novo padrão

## 5. Garantia de permissões e middlewares
- Criar ou ajustar um middleware para validar se o usuário autenticado tem o papel e id corretos para acessar a rota
- Middleware deve:
  - Verificar se o usuário está autenticado
  - Conferir se `req.user.papel === req.params.papel` e `req.user.id === Number(req.params.id)` (ou se é admin com permissão especial)
  - Retornar erro 403 se não tiver permissão

Exemplo:
```js
function authorizeUser(req, res, next) {
  const { papel, id } = req.params;
  const usuario = req.user;
  if (!usuario) return res.status(401).send('Não autenticado');
  if (usuario.papel !== papel || usuario.id !== Number(id)) {
    if (usuario.papel !== 'admin') {
      return res.status(403).send('Acesso negado');
    }
  }
  next();
}
```

## 6. Atualização/criação de testes
- Atualizar os testes de integração e unidade para refletir o novo padrão de rotas
- Criar testes para garantir que:
  - Usuário só acessa recursos do próprio id/papel
  - Acesso indevido retorna 403
  - Admin pode acessar recursos de outros perfis, se permitido
- Testar todos os recursos principais para todos os papéis
- Executar toda a suíte de testes para garantir que nada foi quebrado

---

Este plano deve ser seguido passo a passo para garantir a padronização e segurança das rotas do sistema.