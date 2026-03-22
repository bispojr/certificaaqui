# TASK ID: DOC-ADR-005

## Título
Criar ADR-008 — Armazenamento de PDFs: geração on-the-fly sem persistência

## Objetivo
Documentar a decisão de gerar PDFs de certificados sob demanda (on-the-fly) em memória, sem persistir os arquivos em disco local ou serviço de armazenamento externo (S3, GCS, etc.).

## Arquivo envolvido
- `docs/decisoes/008-pdf-on-the-fly.md` ← CRIAR

## Conteúdo a criar

```markdown
# ADR 008 — Armazenamento de PDFs: On-the-Fly sem Persistência

## Contexto

Certificados precisam ser disponibilizados como PDF via `GET /public/certificados/:id/pdf`. As estratégias de armazenamento avaliadas foram:

- **On-the-fly**: PDF gerado no momento da requisição, enviado como stream HTTP, sem persistência
- **Disco local**: PDF gerado uma vez e salvo em `/storage/pdfs/`, servido como arquivo estático
- **Armazenamento externo (S3/GCS)**: PDF gerado e enviado para bucket, URL pré-assinada retornada ao cliente

## Decisão

Geração on-the-fly sem persistência. O PDF é gerado em memória pelo `pdfService.generateCertificadoPdf(certificado)`, convertido para `Buffer` e enviado diretamente na resposta HTTP com `Content-Type: application/pdf`.

Razões:
- Simplicidade operacional — sem gerenciamento de arquivos ou credenciais de cloud
- Sem risco de dessincronização entre dados do banco e PDF armazenado
- Volumes de requisição esperados (eventos acadêmicos) não justificam cache de arquivos
- Certificado sempre reflete o estado atual do banco — alterações são imediatamente refletidas
- Sem dependência de serviços externos (S3, GCS) — facilita desenvolvimento local e CI

## Consequências

**Positivas:**
- Zero estado externo — sistema completamente stateless para PDFs
- Sem custo de armazenamento em cloud
- Sempre consistente com o banco de dados
- Sem processo de invalidação de cache

**Negativas:**
- Geração repetida a cada download — CPU usada a cada requisição
- Sem URL permanente compartilhável (o PDF não tem URL pública direta — apenas a rota `/pdf`)
- Latência de download depende do tempo de geração (~100ms para PDFKit)

## Quando reavaliar

Esta decisão deve ser revisitada se:
- Volume de downloads simultâneos causar degradação de CPU
- For necessário gerar PDFs com assinatura digital verificável (requer PDF imutável armazenado)
- Regulação exigir registro permanente do exato documento emitido

## Alternativas rejeitadas

| Alternativa | Motivo da rejeição |
|-------------|-------------------|
| Disco local | Não funciona em ambientes multi-replica (containers); risco de dessincronização |
| S3/GCS | Complexidade e custo desnecessários para o volume atual; requer credenciais adicionais |
| Cache em Redis | Overhead operacional sem ganho proporcional para o volume esperado |
```

## Critério de aceite
- Arquivo criado em `docs/decisoes/008-pdf-on-the-fly.md`
- Documenta a estratégia on-the-fly, consequências e critérios para reavaliar a decisão
