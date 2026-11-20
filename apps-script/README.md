# Planilha de confirmações

O jogo envia só três coisas: o nome digitado, a resposta (Tô dentro, Vou tentar, Não vai) e a previsão de chegada.

## Como configurar (uns 5 minutos)

1. Crie uma planilha nova no Google Sheets, por exemplo "Respostas da Noite do Bernardo".
2. Abra **Extensões > Apps Script**.
3. Apague o conteúdo do arquivo `Código.gs` e cole o conteúdo de `Codigo.gs` desta pasta. Salve.
4. Clique em **Implantar > Nova implantação**.
5. Em "Tipo", escolha **App da Web**.
6. Configure:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
7. Clique em **Implantar** e autorize o acesso à sua conta quando o Google pedir.
8. Copie a **URL do app da Web** (termina em `/exec`).
9. Cole essa URL em `js/config.js`, na linha `RSVP_URL`.

## Testar

Jogue até o fim e responda o convite. Uma linha nova deve aparecer na aba "Respostas" em poucos segundos.

## Observações

- A URL fica visível no código do site. O pior que alguém pode fazer com ela é enviar respostas falsas para a sua planilha.
- Se você editar o script depois, publique de novo em **Implantar > Gerenciar implantações > Editar > Nova versão**. A URL continua a mesma.
