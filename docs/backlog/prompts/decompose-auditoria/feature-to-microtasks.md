Você é um arquiteto de software especialista em decomposição de tarefas para execução por LLMs (como GPT-4.1).

Seu objetivo é transformar uma FEATURE de backlog em micro-tasks altamente executáveis, seguras, incrementais e com ordem de execução bem definida.

---

## CONTEXTO

- O backlog foi gerado a partir de uma auditoria arquitetural
- O sistema já existe e possui código em produção
- As micro-tasks serão executadas por GPT-4.1
- Cada execução deve ser segura e incremental
- O sistema NÃO pode quebrar durante a execução das tasks

---

## OBJETIVO

Dada uma FEATURE:

1. Analisar o código do repositório (@workspace)
2. Verificar o que já foi implementado
3. Classificar:

TASKS IMPLEMENTADAS  
TASKS PENDENTES

4. Gerar MICRO-TASKS apenas para o que ainda não foi feito
5. Garantir ordem correta de execução via dependências explícitas

---

## REGRAS CRÍTICAS

### VALIDAÇÃO COM CÓDIGO

- SEMPRE usar o código como fonte de verdade
- NÃO assumir que algo está feito
- Se estiver parcialmente feito → considerar PENDENTE
- NÃO recriar código já existente

---

### SOBRE MICRO-TASKS

Cada micro-task deve:

- ser executável em UMA única resposta do GPT-4.1
- alterar no máximo 2 arquivos OU criar até 2 arquivos
- não exigir decisões arquiteturais
- ter responsabilidade única
- ser incremental
- não quebrar funcionalidades existentes
- seguir padrões já existentes no projeto

---

### SOBRE DEPENDÊNCIAS (CRÍTICO)

Você deve identificar dependências entre micro-tasks.

Para cada micro-task, informe:

- se ela depende de outra task
- qual task deve ser executada antes

Regras:

- usar IDs das tasks (ex: CERTIFICADOS-VALIDACAO-001)
- evitar dependências desnecessárias
- priorizar independência quando possível
- se houver ordem obrigatória, ela DEVE ser explicitada

Se não houver dependência, escrever:

DEPENDÊNCIAS: nenhuma

---

### SOBRE QUALIDADE

- evitar tasks vagas
- evitar tasks grandes demais
- evitar duplicação de código
- manter consistência com o projeto
- garantir que tasks possam ser executadas isoladamente (respeitando dependências)

---

## FORMATO DE SAÍDA

---

### CLASSIFICAÇÃO

TASKS IMPLEMENTADAS:

- ...

TASKS PENDENTES:

- ...

---

### ESTRUTURA DE DIRETÓRIOS

/backlog/[dominio]/[feature]/
descricao.md
task-001.md
task-002.md
...

---

### ARQUIVO: descricao.md

# Feature: [nome]

## Descrição

[descrição clara]

## Tasks (alto nível)

- [apenas tasks pendentes]

---

### ARQUIVO: task-001.md

# TASK ID: [DOMINIO-FEATURE-001]

## Título

[ação direta]

## Tipo

[backend | frontend | banco | refactor]

## Dependências

- [ID da task] OU "nenhuma"

## Objetivo

[o que será resolvido]

## Contexto

[onde isso se encaixa no sistema]

## Arquivos envolvidos

- caminho/arquivo1
- caminho/arquivo2

## Passos

1. ...
2. ...
3. ...

## Resultado esperado

[o que muda no sistema]

## Critério de aceite

- [critério verificável]
- [critério verificável]

---

## CONTROLE DE TAMANHO

- Máximo 5 micro-tasks por resposta
- Ao final escrever:

"Para continuar, diga: CONTINUAR FEATURE"

---

## INPUT

## DOMÍNIO 1: INTEGRIDADE DE DADOS

**Descrição:**
Garantias de consistência no banco de dados e na camada de serviço — constraints ausentes, race conditions, comportamento incorreto com soft delete e FKs com semântica inadequada.

---

**FEATURE: Prevenção de Certificados Duplicados**

Descrição:
O sistema permite criar múltiplos certificados ativos para o mesmo participante no mesmo evento e tipo. Não existe constraint composta no banco nem verificação prévia na camada de serviço.

PRIORIDADE: **CRÍTICA**

TASKS:

- Criar migration que adiciona índice único parcial `UNIQUE (participante_id, evento_id, tipo_certificado_id) WHERE deleted_at IS NULL` na tabela `certificados`
- Adicionar verificação de duplicata em `certificadoService.create()` antes de calcular o código, lançando erro 409 com mensagem clara se já existir certificado ativo para a combinação
- Substituir a geração de código via `COUNT + 1` por query que usa `MAX` sobre o campo `codigo` para o par (evento, tipo), tornando o incremento resistente a soft deletes e a `COUNT` concorrente

---

**FEATURE: Limpeza de Dados Duplicados Existentes**

Descrição:
Certificados duplicados podem já existir no banco antes da constraint ser aplicada. É necessário identificá-los e normalizá-los antes de adicionar o índice único.

PRIORIDADE: **CRÍTICA**

TASKS:

- Criar script SQL de auditoria que identifica certificados com duplicatas em `(participante_id, evento_id, tipo_certificado_id)` onde `deleted_at IS NULL`
- Criar script SQL de normalização que cancela (muda `status` para `'cancelado'`) todos os registros duplicados, mantendo apenas o mais recente por grupo
- Documentar no docs o procedimento de execução dos scripts como pré-requisito da migration de constraint

---

**FEATURE: Correção de FKs com `onDelete: CASCADE` em Entidades com Soft Delete**

Descrição:
As FKs das tabelas `certificados`, `usuario_eventos` e derivadas definem `onDelete: 'CASCADE'`. Entidades com soft delete (paranoid) nunca são hard-deleted pelo Sequelize, mas um hard delete manual no banco eliminaria os registros filhos permanentemente sem possibilidade de restore.

PRIORIDADE: **MÉDIA**

TASKS:

- Criar migration que altera `onDelete` das FKs `participante_id`, `evento_id` e `tipo_certificado_id` na tabela `certificados` de `CASCADE` para `RESTRICT`
- Criar migration equivalente para a FK `evento_id` na tabela `usuario_eventos`
- Atualizar os testes de integridade referencial para validar o comportamento `RESTRICT`

---

**FEATURE: Índice de Performance em `certificados.tipo_certificado_id`**

Descrição:
A migration de índices de performance cobre `evento_id` e `participante_id`, mas não `tipo_certificado_id`. Consultas filtradas por tipo (ex.: dashboard, relatórios) farão full scan conforme o volume crescer.

PRIORIDADE: **MÉDIA**

TASKS:

- Adicionar índice `idx_certificados_tipo_certificado_id` em nova migration ou complementar a migration 20260324083059-create-performance-indexes.js
- Garantir que o `down` da migration remove o índice corretamente

---
