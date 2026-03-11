# Especificações do Projeto

## Implementado
- [x] Model Participante com soft delete e testes automatizados
- [x] Configuração de testes com PostgreSQL dedicado
- [x] Estrutura Docker para produção e testes
- [x] Testes de validação, unicidade e restauração

## Planejado
- [ ] Model Atividade com testes
- [ ] Model Certificado (relacionamento)
- [ ] Rotas de API para CRUD
- [ ] Views Handlebars para interação
- [ ] Validação de certificados
- [ ] Geração de PDFs
- [ ] Testes de integração das rotas

## Testes planejados para Participante
- [x] Não deve criar participante sem nomeCompleto (campo obrigatório)
- [x] Não deve criar participante sem email (campo obrigatório)
- [x] Não deve criar participante com email inválido
- [x] Deve restaurar participante após soft delete
- [ ] Deve associar participante a atividades (aguardando implementação dos models participacoes e atividades)

## Testes planejados para Atividade
- [x] Deve criar atividade com dados válidos
- [x] Não deve criar atividade sem nome (campo obrigatório)
- [x] Não deve criar atividade com status inválido
- [x] Soft delete deve funcionar
- [x] Deve permitir restaurar atividade deletada

## Testes planejados para Evento
- [x] Deve criar evento com dados válidos
- [x] Não deve criar evento sem ano (campo obrigatório)
- [x] Não deve criar evento sem nome (campo obrigatório)
- [x] Não deve criar evento sem codigo_base (campo obrigatório)
- [x] Não deve criar evento com codigo_base duplicado
- [x] Soft delete deve funcionar
- [x] Deve permitir restaurar evento deletado

## Testes planejados para TiposAtividade
- [ ] Deve criar tipos_atividade com campo_destaque
- [ ] Não deve criar tipos_atividade sem codigo (duas letras, alfabético)
- [ ] Não deve criar tipos_atividade com codigo duplicado
- [ ] Soft delete deve funcionar
- [ ] Deve permitir restaurar tipos_atividade deletado

---

## Estrutura das tabelas principais

### Tabela eventos
- id: Identificador único
- nome: Nome do evento
- codigo_base: Código base para geração de certificados (ex: EDUCOMP2026)
- ano: Ano do evento (obrigatório)
- created_at: Data de criação
- updated_at: Data de atualização
- deleted_at: Soft delete
- ...outros campos...

### Tabela tipos_atividade
- id: Identificador único
- codigo: Código do grupo de atividades (exatamente duas letras, formato alfabético, ex: PA, MC, OF) — obrigatório, único
- descricao: Descrição do tipo (ex: palestra, minicurso, oficina) — obrigatório
- campo_destaque: Campo de destaque para cada tipo de atividade (obrigatório, não pode ser null)
  - Usado para exibição da atividade quando o usuário visualizar todos os seus certificados
- created_at: Data de criação
- updated_at: Data de atualização
- deleted_at: Soft delete

### Tabela atividades
- id: Identificador único
- evento_id: Referência ao evento
- tipo_atividade_id: Referência ao tipo de atividade (chave estrangeira)
- nome: Nome da atividade
- status: "liberado" ou "suspenso" (restrito a esses valores)
- dados_dinamicos: Campo JSONB para armazenar informações específicas de cada tipo de atividade
- created_at: Data de criação
- updated_at: Data de atualização
- deleted_at: Soft delete

### Tabela participantes
- id: Identificador único
- nomeCompleto: Nome completo
- email: E-mail (único)
- instituicao: Instituição
- created_at: Data de criação
- updated_at: Data de atualização
- deleted_at: Soft delete

### Tabela participacoes
- id: Identificador único
- participante_id: Referência ao participante (chave estrangeira)
- atividade_id: Referência à atividade (chave estrangeira)
- created_at: Data de criação
- updated_at: Data de atualização
- deleted_at: Soft delete

#### Justificativa
- O uso de uma tabela tipos_atividade permite centralizar códigos e descrições, facilitando manutenção e consultas.
- Atividade referencia tipos_atividade via chave estrangeira.
- Participante referencia atividade via chave estrangeira, permitindo rastrear participação.
Como cada atividade pode ter campos distintos (ex: palestras têm palestrante, minicursos têm instrutores, oficinas têm materiais), o campo `dados_dinamicos` (JSONB) permite flexibilidade sem criar múltiplas tabelas. Isso facilita consultas, migração de dados e manutenção.

#### Exemplo de dados_dinamicos
```json
{
	"palestrante": "Dr. João Silva",
	"tema": "Inovações em IA",
	"duracao": "2h"
}
```

Para uma oficina:
```json
{
	"instrutor": "Maria Souza",
	"materiais": ["computador", "arduino"],
	"vagas": 30
}
```

#### Exemplos de queries (PostgreSQL)
- Buscar todas as atividades com palestrante:
	```sql
	SELECT * FROM atividades WHERE dados_dinamicos->>'palestrante' IS NOT NULL;
	```
- Buscar oficinas com vagas > 20:
	```sql
	SELECT * FROM atividades WHERE tipo = 'oficina' AND (dados_dinamicos->>'vagas')::int > 20;
	```

#### Migração de planilhas
Cada linha da planilha pode ser convertida para um registro em atividades, com os campos específicos agrupados em `dados_dinamicos`.
