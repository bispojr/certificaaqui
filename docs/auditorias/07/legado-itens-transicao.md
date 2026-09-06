# Registro Inicial de Itens de Convivência Legada

Feature: 001-auth-scope-convergence  
Data: 2026-09-05  
Objetivo: registrar itens legados ativos, com owner, targetWave e critérios objetivos de retirada.

## Convenções

- Estado: aberto, em_andamento, retirado.
- TargetWave: onda planejada para remoção do legado.
- Critério de retirada: condição verificável para remover o item com segurança.

## Itens legados

| itemId       | Categoria     | Descrição                                                         | Owner                 | Risco   | Impacto                                             | TargetWave | Estado |
| ------------ | ------------- | ----------------------------------------------------------------- | --------------------- | ------- | --------------------------------------------------- | ---------- | ------ |
| LEG-ITEM-001 | Principal     | req.usuario API como instância ORM (LEG-PRINC-01)                 | Time Backend API      | alto    | acoplamento a getEventos e métodos de modelo        | Onda 1     | aberto |
| LEG-ITEM-002 | Principal     | req.usuario SSR como POJO parcial (LEG-PRINC-02)                  | Time Backend SSR      | alto    | contrato diferente da API e flags incompletas       | Onda 1     | aberto |
| LEG-ITEM-003 | Principal     | Reidratação manual de escopo em controllers SSR (LEG-PRINC-03)    | Time Backend SSR      | médio   | duplicação de regra de autorização                  | Onda 2     | aberto |
| LEG-ITEM-004 | Escopo        | Uso de req.query.evento_id como canal de segurança (LEG-SCOPE-01) | Time Backend API      | crítico | fácil drift entre middleware e service              | Onda 2     | aberto |
| LEG-ITEM-005 | Escopo        | Uso de req.body.evento_id para autorização (LEG-SCOPE-02)         | Time Backend API/SSR  | crítico | autorização dependente de input mutável de cliente  | Onda 2     | aberto |
| LEG-ITEM-006 | Escopo        | Uso de req.params.id como proxy de evento (LEG-SCOPE-03)          | Time Backend API      | crítico | validação por coincidência numérica em rotas por ID | Onda 2     | aberto |
| LEG-ITEM-007 | Escopo        | Helpers locais de escopo em controllers SSR (LEG-SCOPE-04)        | Time Backend SSR      | alto    | policy descentralizada e difícil de auditar         | Onda 2     | aberto |
| LEG-ITEM-008 | Service layer | Services sem eventoIds explícito (LEG-SCOPE-05)                   | Time Backend Domínio  | crítico | bypass de isolamento multi-tenant                   | Onda 3     | aberto |
| LEG-ITEM-009 | RBAC          | Divergência de perfil mínimo API vs SSR em operações equivalentes | Arquitetura + Backend | crítico | quebra de invariância por quíntuplo                 | Onda 3     | aberto |
| LEG-ITEM-010 | Governance    | Ausência de verificador automático de drift por operationKey      | Arquitetura           | alto    | regressão silenciosa após mudanças                  | Onda 3     | aberto |
| LEG-ITEM-011 | Cleanup       | Adaptadores legados pós-convergência (principal/escopo)           | Arquitetura + Backend | alto    | manutenção de dívida após migração                  | Onda 4     | aberto |

## Critérios de retirada por item

| itemId       | Critério objetivo de retirada                                                                      | Evidência mínima                                 |
| ------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| LEG-ITEM-001 | API materializa principal canônico e consumidores críticos não usam métodos ORM no principal       | testes integration de auth API + revisão de usos |
| LEG-ITEM-002 | SSR materializa principal canônico com atributos mínimos exigidos                                  | testes integration de auth SSR                   |
| LEG-ITEM-003 | Controllers SSR deixam de montar escopo manualmente                                                | diff de controllers + testes integration         |
| LEG-ITEM-004 | req.query.evento_id deixa de participar da decisão de autorização                                  | testes negativos de bypass por query             |
| LEG-ITEM-005 | req.body.evento_id não é mais fonte primária de autorização                                        | testes de mutação com escopo canônico            |
| LEG-ITEM-006 | scopedEvento legado removido de decisões por ID ou substituído por resolvedor canônico             | testes de ownership por recurso                  |
| LEG-ITEM-007 | SSR usa canal único req.contextoAutorizacao.eventoIds                                              | testes integration SSR por perfil                |
| LEG-ITEM-008 | serviços de certificados, participantes e eventos exigem eventoIds explícito para perfis restritos | testes unit/integration de service layer         |
| LEG-ITEM-009 | tabela de policy por operationKey aplicada em API e SSR com perfil mínimo equivalente              | testes de equivalência RBAC                      |
| LEG-ITEM-010 | verificador de drift executado em suíte de conformidade                                            | teste unit do verificador + relatório            |
| LEG-ITEM-011 | nenhum consumidor ativo de adaptadores legados                                                     | auditoria final + busca sem referências          |

## Dependências de execução

- Onda 1 remove assimetria de principal (LEG-ITEM-001, 002).
- Onda 2 converte canal de escopo (LEG-ITEM-003 a 007).
- Onda 3 fecha enforcement e equivalência RBAC (LEG-ITEM-008 a 010).
- Onda 4 remove restos de legado (LEG-ITEM-011).

## Observação de governança

Este registro deve ser atualizado a cada gate de onda com estado real de cada item e evidências coletadas.
