# ADR 014 — Política de Dados Expostos em Endpoints Públicos

## Status

Aprovado

## Contexto

O CertificaAqui expõe funcionalidades públicas de consulta, validação e download de certificados sem autenticação, conforme FR-23, FR-24, FR-25, FR-42 e FR-53 do SRS em [docs/especificacoes.md](../especificacoes.md).

A triagem arquitetural consolidada da rodada 07 identificou achados críticos de exposição excessiva em superfícies públicas, especialmente:

1. STF-023: exposição de e-mail de participante na view pública de validação.
2. STF-052: retorno de objetos persistidos com campos internos e estruturais.
3. STF-011 e STF-012: ampliação de risco por alta capacidade de enumeração e scraping em rotas públicas.

O problema não é apenas de implementação pontual. Há ausência de decisão arquitetural explícita sobre classificação e minimização de dados em endpoints públicos, causando deriva entre API REST e SSR e elevando risco de não conformidade com os princípios de minimização e necessidade aplicáveis ao contexto LGPD já reconhecido no SRS (NFR-12).

As ADRs já vigentes reforçam o requisito de canonicidade entre superfícies e de coerência de contratos:

1. ADR 009: enforcement canônico e verificável para regras transversais.
2. ADR 011: unificação semântica entre API e SSR.
3. ADR 012: invariância de política por operação, não por superfície.

## Problema

FR-25 define ausência de autenticação para consultas públicas, porém não define o conjunto canônico de atributos permitidos em respostas públicas.

Essa lacuna gera três falhas arquiteturais:

1. Falha de classificação: não existe taxonomia formal de campos "públicos", "restritos" e "internos" no contexto de validação pública.
2. Falha de contrato: API e SSR podem expor representações diferentes e, em alguns fluxos, incluir dados pessoais e estruturais além do necessário.
3. Falha de governança: sem decisão de arquitetura, correções tornam-se ad hoc por endpoint e não verificáveis de forma sistêmica.

Consequentemente, a plataforma fica sem critério normativo para responder à pergunta central: quais dados são estritamente necessários para comprovar autenticidade pública de certificado sem ampliar exposição de dados pessoais.

## Decisão

Adotar política arquitetural de "Exposição Mínima Pública" para todos os endpoints públicos de consulta, validação e visualização de certificado.

A política estabelece que superfícies públicas devem expor apenas o conjunto mínimo de dados necessários para verificação de autenticidade documental, proibindo exposição de dados pessoais diretos, identificadores internos e estruturas dinâmicas completas, salvo decisão arquitetural posterior explícita.

No estado atual de incerteza de produto e jurídico, esta ADR define como baseline canônico para respostas públicas apenas atributos de validação documental:

1. Código de validação do certificado.
2. Nome do tipo de certificado.
3. Status do certificado.
4. Referência temporal relevante para validação pública (quando aplicável ao contrato funcional já existente).

Esta ADR também estabelece que:

1. E-mail de participante não integra o conjunto mínimo público.
2. IDs internos e chaves de persistência não integram o conjunto mínimo público.
3. `valores_dinamicos` completos não integram o conjunto mínimo público.

A decisão é normativa e arquitetural. Não define plano de implementação, formato final de payload, nem cronograma de migração.

### Taxonomia canônica de classificação de dados públicos

Para governança de contratos públicos, todo atributo exposto em endpoint público deve ser classificado em uma das classes:

1. `PUBLIC_MIN`: estritamente necessário para validação de autenticidade documental.
2. `PUBLIC_COND`: permitido apenas sob regra formal de produto/jurídico aprovada e rastreável.
3. `RESTRICTED`: permitido somente em contexto autenticado e autorizado.
4. `INTERNAL`: atributo técnico/estrutural, proibido em superfícies públicas.

Regra canônica de exposição: atributos sem classificação explícita não podem ser expostos em endpoints públicos (default deny).

## Alternativas Consideradas

1. Exposição mínima estrita para validação pública (adotada).
Trade-off: reduz risco de exposição e melhora previsibilidade arquitetural, porém pode limitar casos de uso informacionais não formalizados no SRS atual.

2. Exposição parcial ampliada (ex.: nome do participante e tipo, sem e-mail e sem `valores_dinamicos`).
Trade-off: melhora legibilidade pública do resultado, mas amplia superfície de dados pessoais sem critério jurídico consolidado e aumenta risco de scraping.

3. Manter payloads atuais e tratar casos de exposição individualmente por endpoint.
Trade-off: menor atrito imediato, porém perpetua inconsistência sistêmica, não resolve lacuna arquitetural e mantém alto risco de regressão.

## Consequências

### Positivas

1. Define critério arquitetural único para dados públicos, reduzindo ambiguidades entre API e SSR.
2. Reduz risco de exposição de dados pessoais em canais não autenticados.
3. Melhora rastreabilidade de conformidade entre arquitetura, SRS e auditorias.
4. Estabelece base para auditoria objetiva de contratos públicos.

### Negativas

1. Pode reduzir quantidade de contexto exibido ao usuário final em fluxos públicos.
2. Pode exigir revisão de expectativas de produto para páginas e respostas já existentes.
3. Pode demandar revisão de testes e contratos consumidores que assumiam payloads mais amplos.

## Impactos Arquiteturais

1. Introduz separação explícita entre modelo de persistência e contrato público de leitura.
2. Reforça necessidade de projeção canônica de dados públicos, independente da superfície (API e SSR).
3. Converte exposição pública de dados em preocupação arquitetural transversal, não local a cada rota.
4. Alinha o desenho com o princípio de minimização de dados no contexto de operador LGPD já definido no SRS.

## Riscos

1. Risco de subexposição funcional caso o conjunto mínimo não cubra necessidades legítimas ainda não formalizadas.
2. Risco de adoção parcial, com coexistência de endpoints antigos sem aderência à política.
3. Risco de interpretação divergente sobre o que constitui "dado estritamente necessário" em cenários fronteira.
4. Risco de falsa conformidade se campos indiretos permitirem reidentificação quando combinados com enumeração massiva.

## Dependências

1. [docs/especificacoes.md](../especificacoes.md): requisitos funcionais e não funcionais das rotas públicas e contexto LGPD.
2. [docs/auditorias/07/triagem-arquitetural-final.md](../auditorias/07/triagem-arquitetural-final.md): evidências STF-023, STF-052, STF-011 e STF-012.
3. [docs/decisoes/009-enforcement-multi-tenant.md](009-enforcement-multi-tenant.md): canonicidade para regras transversais.
4. [docs/decisoes/011-contrato-unificado-api-ssr.md](011-contrato-unificado-api-ssr.md): coerência semântica entre superfícies.
5. [docs/decisoes/012-definicao-canonica-perfis-minimos.md](012-definicao-canonica-perfis-minimos.md): consistência de política por operação.

## Relação com SRS

Esta ADR não cria requisitos funcionais novos. Ela formaliza decisão arquitetural para interpretação e aplicação de requisitos já existentes:

1. FR-23 e FR-53: consulta pública por e-mail permanece funcional, mas sem legitimar exposição irrestrita de atributos.
2. FR-24: validação pública permanece sem autenticação e passa a ter critério arquitetural de minimização de resposta.
3. FR-25: ausência de autenticação não implica ausência de política de proteção de dados.
4. FR-42: download público de PDF permanece no escopo funcional, sem alterar nesta ADR o conteúdo documental já definido por outras decisões.
5. NFR-1 e NFR-12: reforço de segurança de acesso e conformidade do papel de operador com minimização de exposição em canal público.

**Ambiguidades de fronteira resolvidas (2026-06-05):**

1. O payload público mínimo passa a seguir a classificação `PUBLIC_MIN` definida nesta ADR.
2. A fronteira entre transparência de validação e minimização de dados passa a ser governada pela taxonomia canônica (`PUBLIC_MIN`, `PUBLIC_COND`, `RESTRICTED`, `INTERNAL`).

## Observações

1. Esta ADR é deliberadamente normativa e não descreve implementação, refatoração, migração ou detalhes de contrato técnico.
2. A taxonomia de classificação foi formalizada nesta ADR; ampliações de `PUBLIC_COND` dependem de validação conjunta de produto e jurídico com rastreabilidade no SRS.
3. Critérios de prevenção de reidentificação por correlação continuam obrigatórios em análises de risco para qualquer ampliação de exposição pública.
