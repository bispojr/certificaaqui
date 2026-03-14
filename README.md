# certifique-me

## Configuração de ambiente

1. Copie o arquivo `.env.example` para `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edite as variáveis conforme necessário.

   - **JWT_SECRET é obrigatório**: defina uma chave secreta forte para autenticação JWT. O sistema não funcionará sem essa variável.

3. O arquivo `.env` já está ignorado pelo git.
