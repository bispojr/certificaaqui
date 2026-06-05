# CertificaAqui — Módulos

## Participantes

- Regras: email único (validação), email formato válido, CRUD, soft delete (paranoid), timestamps
- Relacionamentos: possui muitos certificados

## Eventos

- Regras: codigo_base único, exatamente 3 letras (validação regex), CRUD, soft delete (paranoid), timestamps
- Relacionamentos: possui muitos certificados

## Certificados

- Campos: nome, status (emitido, pendente, cancelado), valores_dinamicos, participante_id, evento_id, tipo_certificado_id
- Regras: status enum, emissão/cancelamento/restauração, soft delete (paranoid), timestamps
- Relacionamentos: pertence a participante, evento e tipo de certificado

## Tipos de Certificados

- Campos: codigo (2 letras), descricao, campo_destaque, texto_base, dados_dinamicos
- Regras: codigo único, exatamente 2 letras (validação regex), campo_destaque cross-field (deve ser "nome" ou chave de dados_dinamicos), texto_base obrigatório, soft delete (paranoid), timestamps
- Relacionamentos: possui muitos certificados
- Hooks: validação cross-field em beforeValidate

## Usuários

- Campos: nome, email, senha (hash), perfil (admin, gestor, monitor), evento_id
- Regras: email único (validação), email formato válido, autenticação JWT, RBAC, perfil enum, senha hash (hooks beforeCreate/beforeUpdate), soft delete (paranoid), timestamps
- Relacionamentos: pertence a evento

## Middlewares

### auth

Valida o token JWT presente no header Authorization, autentica o usuário e popula req.user. Utilizado para proteger rotas administrativas.

### rbac

Controla o acesso por perfil (admin, gestor, monitor). Verifica permissões do usuário autenticado e bloqueia operações não autorizadas.

### scopedEvento

Restringe o escopo de acesso para gestores e monitores, garantindo que só possam operar dentro do evento ao qual estão vinculados.
