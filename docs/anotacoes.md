Poderia o auth/login ser apenas login?

É preciso garantir uma padronização de ícones, como uma identidade visual. Todo evento (ou página associada a ele) tem o mesmo tipo de ícone (e talvez cor, se necessário). Trabalhar isso para todos as páginas principais (e seus grupos com certificação, eventos e administração).

Sempre olhar o link dos certificados, principalmente da função "obterArquivo", para poder garantir a geração correta dos certificados.
https://github.com/EduCompBR/educompbrasil-site/blob/master/routes/simposio/2025/educomp/pt-BR/certificado.js

Existe essa rota public/pagina/buscar? Precisa?

Em POST /validar, é preciso aparecer o tipo de certificado. 

Em GET /validar, seria interessante remover o botão "voltar".

Fazer com que a rota https://certificaaqui.com/validar/EDC-25-PT-109 mostre a validação do certificado.

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
“Buscando...” 4. Animação leve no load

Fade-in da logo + campo
