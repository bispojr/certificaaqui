É preciso garantir uma padronização de ícones, como uma identidade visual. Todo evento (ou página associada a ele) tem o mesmo tipo de ícone (e talvez cor, se necessário). Trabalhar isso para todos as páginas principais (e seus grupos com certificação, eventos e administração).

Sempre olhar o link dos certificados, principalmente da função "obterArquivo", para poder garantir a geração correta dos certificados.
https://github.com/EduCompBR/educompbrasil-site/blob/master/routes/simposio/2025/educomp/pt-BR/certificado.js

Ver a generalização do Cloudfare R2 no pdfService. Ver se é interessante colocar um endereço no banco do lugar onde está o template do certificado. Cada template é vinculado a um evento.

Ver a inclusão da fonte da Lato dentro do Cloudfare.
https://www.latofonts.com/download/

=============================
Página Inicial
==============================

💡 Melhorias opcionais (se quiser dar um nível acima)

Se quiser deixar ainda mais profissional:

1. Ícone dentro do input 🔍

Posso te mostrar como colocar um ícone de lupa dentro do campo.

2. Enter automático

Já funciona, mas dá pra melhorar UX (auto focus no campo).

3. Mensagens tipo Google

Ex:

“Nenhum certificado encontrado”
“Buscando...”
4. Animação leve no load

Fade-in da logo + campo