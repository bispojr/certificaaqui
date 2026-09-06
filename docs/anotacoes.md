===========================================================

Rodar no SpecKit:

Rodar speckit.tasks para decompor o plano em tarefas executáveis por onda.

===========================================================

Habilitar a possibilidade de o usuário registrar múltiplos emails.

Padronização de ícones realizadas. Estender para as subpáginas (bebendo de resourceMeta):

- Eventos
- Certificados
- Tipos
- Usuários
- etc.

Ver uma forma interessante de visualizar esses dados de certificados. Perguntar pra GenAI.

---

### Problema: Risco de Omissão de Parâmetro de Escopo (`eventoIds`) por Falta de Tipagem Forte

No modelo atual, a passagem do parâmetro `eventoIds` dos controllers para os services é feita por convenção, sem qualquer restrição de tipo imposta pelo JavaScript. Isso significa que, caso um controller esqueça de repassar `eventoIds` ao chamar um service, tal omissão não será detectada em tempo de compilação, podendo resultar em falhas graves de segurança — como o acesso indevido a dados de outros tenants.

Esse risco é inerente ao uso de JavaScript, que não possui tipagem estática. A ausência de validação automática pelo compilador exige disciplina rigorosa da equipe de desenvolvimento e cobertura de testes robusta para evitar omissões.

#### Recomendação

A adoção de TypeScript é fortemente recomendada para mitigar esse risco. Com TypeScript, é possível definir na assinatura dos services que o parâmetro `eventoIds` é obrigatório, permitindo que o compilador aponte imediatamente qualquer chamada incorreta ou omissa. Isso aumenta a segurança, a robustez e a manutenibilidade do sistema, reduzindo a probabilidade de falhas silenciosas relacionadas ao escopo multi-tenant.

---

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
