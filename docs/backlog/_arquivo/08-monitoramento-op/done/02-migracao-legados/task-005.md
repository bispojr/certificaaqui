# TASK ID: MON-LEG-005

## Título

Remover pasta `middleware/` legada da raiz do projeto

## Objetivo

Após todos os imports terem sido migrados para `src/middlewares/`, remover a pasta `middleware/` da raiz do projeto, eliminando o código duplicado.

## Bloqueio

**Requer MON-LEG-002 e MON-LEG-004 executados e `npm run test:ci` passando.**

## Contexto

- `middleware/auth.js` — sem mais importadores após MON-LEG-002
- `middleware/validate.js` — sem mais importadores após MON-LEG-004
- Verificar antes de remover: `grep -r "../../middleware/" src/ tests/` deve retornar zero resultados

## Arquivo envolvido

- `middleware/` (pasta na raiz) ← REMOVER

## Passos

### 1. Verificar que não há mais importadores

```bash
grep -r "../../middleware/auth\|../../middleware/validate" src/ tests/
```

O comando deve retornar **zero resultados**. Se retornar algo, corrigir os imports antes de prosseguir.

### 2. Remover a pasta

```bash
rm -rf middleware/
```

### 3. Confirmar que os testes ainda passam

```bash
npm run test:ci
```

## Critério de aceite

- Pasta `middleware/` não existe mais na raiz do projeto
- `npm run test:ci` passa sem regressões
- `ls middleware/` retorna "No such file or directory"
