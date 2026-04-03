# certifique-me

[![Build Status](https://github.com/bispojr/certifique-me/actions/workflows/ci.yml/badge.svg)](https://github.com/bispojr/certifique-me/actions) [![codecov](https://codecov.io/github/bispojr/certifique-me/graph/badge.svg?token=6QENAQ10EH)](https://codecov.io/github/bispojr/certifique-me) [![Node.js](https://img.shields.io/badge/node-%3E%3D24-green)](https://nodejs.org) [![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0) [![Last Commit](https://img.shields.io/github/last-commit/bispojr/certifique-me)](https://github.com/bispojr/certifique-me/commits/main)

## Configuração de ambiente

1. Copie o arquivo `.env.example` para `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edite as variáveis conforme necessário.
   - **JWT_SECRET é obrigatório**: defina uma chave secreta forte para autenticação JWT. O sistema não funcionará sem essa variável.

3. O arquivo `.env` já está ignorado pelo git.
