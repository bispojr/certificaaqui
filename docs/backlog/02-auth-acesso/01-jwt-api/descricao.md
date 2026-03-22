# Feature: Autenticação JWT (API)

## Descrição

Login/logout via endpoint JSON com geração e validação de tokens JWT para consumo da API REST.

## Tasks implementadas

- ✅ Model `Usuario` com `nome`, `email`, `senha` (bcrypt), `perfil`
- ✅ `middleware/auth.js` valida JWT e popula `req.usuario`
- ✅ `usuarioController.js` com `login`, `logout`, `me`, `create`, `updateEventos`
- ✅ `src/routes/usuarios.js` com `POST /login`, `POST /logout`, `GET /me`, `POST /`, `PUT /:id`
- ✅ `JWT_SECRET` sem fallback inseguro

## Tasks pendentes

- ⬜ [TASK-001] Aplicar rate limiting (`express-rate-limit`) em `POST /usuarios/login`

## Dependências

### Externas (de outras features)
Nenhuma — esta feature é base do sistema de autenticação.

### Internas (ordem entre tasks desta feature)
Nenhuma — há apenas TASK-001.
