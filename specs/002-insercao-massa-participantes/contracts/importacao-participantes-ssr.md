# Contrato SSR de Importação em Massa de Participantes

## Finalidade

Contratar o novo fluxo de importação em massa na interface SSR de participantes, cobrindo entrada por colagem de planilha e arquivo CSV, com sucesso parcial por linha e sem alterar o CRUD individual já existente.

## 1) Endpoint SSR de Importação

```http
POST /admin/participantes/importar
Content-Type: multipart/form-data
```

Campos aceitos:

- `evento_id` (obrigatório)
- `conteudo` (texto colado da planilha)
- `arquivoCsv` (arquivo CSV)

Regras:

- O request deve conter exatamente uma origem de dados: `conteudo` ou `arquivoCsv`.
- O `evento_id` define o escopo da importação inteira.
- A proteção/autorizações do endpoint devem seguir o mesmo padrão das rotas SSR de participantes já existentes.

## 2) Formato de Entrada

### Colagem de planilha

```text
nomeCompleto	email	instituicao
Maria Silva	maria@exemplo.com	IFSP
João Souza	joao@exemplo.com	USP
```

### CSV

```text
nomeCompleto,email,instituicao
Maria Silva,maria@exemplo.com,IFSP
João Souza,joao@exemplo.com,USP
```

Regras:

- O cabeçalho deve mapear `nomeCompleto`, `email` e `instituicao`.
- O parser deve tolerar linhas em branco, mas não deve inventar valores ausentes.
- Cada linha deve ser tratada como uma criação unitária.

## 3) Contrato de Processamento

Para cada linha:

1. Validar `nomeCompleto` e `email`.
2. Aplicar lookup por e-mail.
3. Criar participante ou apenas vínculo conforme a regra vigente.
4. Registrar erro por linha quando a validação falhar.

Regras:

- Linhas inválidas não interrompem o restante do lote.
- O resultado deve informar, no mínimo, criados, vínculos reaproveitados e falhas.
- As mesmas restrições de `FR-2`, `FR-3`, `FR-58`, `FR-59` e `FR-61` continuam válidas.

## 4) Resposta SSR

```json
{
  "totalLinhas": 3,
  "criados": 2,
  "vinculosCriados": 1,
  "falhas": 1,
  "errosPorLinha": [
    {
      "numeroLinha": 3,
      "erros": ["email inválido"]
    }
  ]
}
```

Regras:

- Em caso de sucesso parcial, a interface SSR deve exibir o resumo e os erros por linha.
- A implementação não precisa expor novo contrato JSON público; o contrato é interno à SSR.