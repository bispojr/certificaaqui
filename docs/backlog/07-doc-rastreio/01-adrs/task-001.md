# TASK ID: DOC-ADR-001

## Título
Criar ADR-004 — Engine de geração de PDF (PDFKit)

## Objetivo
Documentar a decisão de usar PDFKit para geração de PDFs de certificados, em vez de alternativas como Puppeteer (headless browser).

## Arquivo envolvido
- `docs/decisoes/004-pdfkit-gerador-pdf.md` ← CRIAR

## Conteúdo a criar

```markdown
# ADR 004 — Engine de Geração de PDF: PDFKit

## Contexto

O sistema precisa gerar documentos PDF dos certificados emitidos. As principais alternativas avaliadas foram:

- **PDFKit**: biblioteca Node.js de geração programática de PDF (sem browser)
- **Puppeteer**: headless Chromium que renderiza HTML/CSS como PDF

O certificado tem conteúdo textual simples derivado de interpolação de template, sem necessidade de renderização HTML complexa.

## Decisão

PDFKit foi adotado como engine de geração de PDF.

Razões:
- Dependência leve (~3MB vs. ~300MB+ do Chromium)
- API programática direta — sem overhead de browser
- Integração simples com o fluxo de `pdfService.generateCertificadoPdf(certificado)`
- Geração síncrona via pipeline de streams — adequado para resposta HTTP direta
- Sem necessidade de servidor de renderização externo

## Consequências

**Positivas:**
- Footprint mínimo em containers e CI
- Sem processo filho (Chromium) — resposta mais rápida e previsível
- `pdfService` isolado e testável via mock

**Negativas:**
- Layout do certificado definido programaticamente (coordenadas em pontos) — não usa CSS/HTML
- Mudanças visuais exigem alteração no `pdfService.js`, não em templates HTML
- Não suporta SVG avançado nativamente (limitação aceitável para o escopo atual)

## Alternativas rejeitadas

| Alternativa | Motivo da rejeição |
|-------------|-------------------|
| Puppeteer | Overhead de ~300MB de Chromium; latência de cold start incompatível com geração on-demand |
| html-pdf (wkhtmltopdf) | Dependência de binário nativo; difícil de containerizar |
| jsPDF | Focado em browser; suporte Node.js secundário |
```

## Critério de aceite
- Arquivo criado em `docs/decisoes/004-pdfkit-gerador-pdf.md`
- Segue o padrão das ADRs existentes (Contexto, Decisão, Consequências)
