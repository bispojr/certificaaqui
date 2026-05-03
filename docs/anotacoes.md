Por que não renomear a url https://certificaaqui.com/public/pagina/validar para apenas
https://certificaaqui.com/validar

Em /public/pagina/buscar, é preciso aparecer tanto o nome de evento quanto o tipo de certificado. Também se pode tirar o link "buscar novamente".

Fazer com que a rota https://certificaaqui.com/validar/EDC-25-PT-109 mostre a validação do certificado.

Na página https://certificaaqui.com/public/pagina/validar (depois que a validação aconteceu), colocar em português a hora da emissão do certificado.

Garantir que, quando informar o código para validação em https://certificaaqui.com/public/pagina/validar, mesmo com espaços no fim ou no início, a busca se realize da maneira correta.

Na página https://certificaaqui.com/public/pagina/validar, esse botão voltar não tem nada a ver. Tem que tirar ele.

Por que não remover esse link "Meus Certificados" dessa página https://certificaaqui.com/public/pagina/validar?

É preciso garantir uma padronização de ícones, como uma identidade visual. Todo evento (ou página associada a ele) tem o mesmo tipo de ícone (e talvez cor, se necessário). Trabalhar isso para todos as páginas principais (e seus grupos com certificação, eventos e administração).

Sempre olhar o link dos certificados, principalmente da função "obterArquivo", para poder garantir a geração correta dos certificados.
https://github.com/EduCompBR/educompbrasil-site/blob/master/routes/simposio/2025/educomp/pt-BR/certificado.js

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
