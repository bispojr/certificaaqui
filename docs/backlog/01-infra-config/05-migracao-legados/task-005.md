# TASK ID: INFRA-LEGADOS-005

## Título

Remover arquivos legados `middleware/auth.js` e `middleware/validate.js`

## Objetivo

Após todos os imports terem sido atualizados (TASKS 002, 003 e 004), remover os arquivos originais do diretório `middleware/` na raiz do projeto e verificar que a suite completa de testes continua passando.

## Contexto

**Pré-requisito:** TASKS 001, 002, 003 e 004 já executadas.

Neste ponto:

- `src/middlewares/auth.js` existe com o path de models correto
- `src/middlewares/validate.js` existe
- Nenhum arquivo em `src/` ou `tests/` importa mais de `../../middleware/`

Os arquivos a remover são:

- `middleware/auth.js`
- `middleware/validate.js`

Verificar se o diretório `middleware/` ficará vazio após a remoção — se sim, remover o diretório também.

## Arquivos envolvidos

- `middleware/auth.js` ← remover
- `middleware/validate.js` ← remover
- `middleware/` ← remover diretório se vazio

## Passos

1. Verificar que nenhum arquivo ainda referencia os legados:

   ```bash
   grep -r "../../middleware/auth" src/ tests/
   grep -r "../../middleware/validate" src/ tests/
   ```

   Ambos os comandos devem retornar vazio. Se não estiverem, **não prosseguir** — revisar as tasks anteriores.

2. Executar `npm run check` e confirmar que todos os testes passam.

3. Remover os arquivos legados:

   ```bash
   rm middleware/auth.js
   rm middleware/validate.js
   ```

4. Verificar se o diretório `middleware/` está vazio:

   ```bash
   ls middleware/
   ```

   Se vazio, remover o diretório:

   ```bash
   rmdir middleware/
   ```

5. Executar `npm run check` novamente para confirmar que a remoção não quebrou nada.

## Resultado esperado

- `middleware/auth.js` e `middleware/validate.js` não existem mais
- Diretório `middleware/` removido (se estiver vazio)
- `npm run check` passa com todos os testes verdes

## Critério de aceite

- `ls middleware/` retorna erro "No such file or directory" (ou diretório vazio/removido)
- `npm run check` passa sem erros
- Nenhum `require` em `src/` ou `tests/` aponta para `middleware/`
