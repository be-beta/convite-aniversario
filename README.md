# A Noite do Bernardo

Convite de aniversário em forma de jogo point and click, em pixel art, que se passa no Galeto Sat's de Botafogo.
O convidado digita o nome, diz como vai chegar, escolhe um personagem e ajuda a improvisar um parabéns com uma polenta no lugar do bolo. No final aparece o convite com data, horário, local e a confirmação de presença.

Tudo é desenhado em código: personagens, cenários, fonte e sons. Não há imagens, áudios nem bibliotecas externas.

## Rodar no computador

Precisa de um servidor local simples, porque o jogo usa módulos JavaScript.

```bash
python -m http.server 8123
```

Depois abra `http://localhost:8123` no navegador.

Para testes, `http://localhost:8123/?teste=1` pula as telas iniciais e vai direto para a calçada.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie esta pasta.
2. No repositório, vá em **Settings > Pages**.
3. Em "Source", escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`.
4. Em um ou dois minutos o jogo fica disponível em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## Confirmações de presença

As respostas vão para uma planilha Google sua. Veja `apps-script/README.md`.
Enquanto `RSVP_URL` estiver vazio em `js/config.js`, o jogo funciona em modo de teste e não envia nada.

## Onde mexer

| Arquivo | O que tem |
| --- | --- |
| `js/config.js` | Data, horário, local e endereço da planilha |
| `js/roteiro.js` | Falas, piadas e a lógica da missão |
| `js/personagens.js` | Visual de cada personagem e dos avatares |
| `js/cenarios.js` | Desenho da calçada e do corredor |
| `js/telas.js` | Telas de abertura, horário de chegada e convite final |
| `js/motor.js` | Câmera, toque, diálogos e desenho na tela |

## Privacidade

O jogo não usa analytics, cookies nem rastreadores. A única informação que sai do navegador é a resposta do convite, enviada para a planilha configurada.
