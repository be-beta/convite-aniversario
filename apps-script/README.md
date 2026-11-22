# Planilha de confirmações e galeria

O jogo envia só quatro coisas: o nome digitado, a resposta (Tô dentro, Vou tentar, Não vai), a previsão de chegada e um código curto do personagem montado.

Assim que a pessoa termina de montar o personagem, o jogo manda uma linha a mais com o nome seguido de "(não finalizou)" e a resposta "Não finalizou". Assim dá para ver na galeria quem começou e não chegou ao fim. Essa linha nunca substitui uma resposta de verdade, e o Apps Script não precisa mudar.

## Como configurar (uns 5 minutos)

1. Abra a planilha que vai receber as respostas.
2. Vá em **Extensões > Apps Script**.
3. Apague o conteúdo do arquivo `Código.gs` e cole o conteúdo de `Codigo.gs` desta pasta.
4. Na linha `const CHAVE_GALERIA = 'TROQUE-ESTA-CHAVE';` (linha 8), troque o texto por uma senha só sua, com pelo menos 6 letras ou números. É o único lugar a mudar. Salve.
5. Clique em **Implantar > Nova implantação**.
6. Em "Tipo", escolha **App da Web** e configure:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
7. Clique em **Implantar** e autorize o acesso à sua conta quando o Google pedir.
8. Copie a **URL do app da Web** (termina em `/exec`) e cole em `js/config.js`, na linha `RSVP_URL`.

A planilha em si pode continuar com compartilhamento **Restrito**. O script roda com a sua conta e não precisa que ela seja pública.

## Galeria de personagens

Abra `galeria.html` no site publicado (por exemplo `https://SEU-USUARIO.github.io/NOME-DO-REPO/galeria.html`), digite a chave do passo 4 e veja todos os personagens que a galera montou, agrupados pela resposta.

Sem a chave a página não mostra nada. Também dá para copiar as colunas Nome, Resposta e Personagem da planilha e colar na página.

## Observações

- A URL do script fica visível no código do site. Sem a chave, o máximo que alguém consegue é enviar respostas falsas.
- Se editar o script depois, publique de novo em **Implantar > Gerenciar implantações > Editar > Nova versão**. A URL continua a mesma.
