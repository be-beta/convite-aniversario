// Telas fora do jogo: abertura, nome, horário de chegada, avatar e o convite final.

import { painel, botao, icone, R, drawText, measure, wrap, LINE_H } from './ui.js';
import { C } from './paleta.js';
import { AVATARES } from './personagens.js';
import { buildCharacter, frameCanvas } from './sprites.js';
import { FESTA } from './config.js';
import { enviarRSVP } from './rsvp.js';

export const CHEGADAS = [
  {
    id: 'folga', t: 'Tô de folga, chego cedo', plano: '17h', carioca: '18h', luz: 'entardecer',
    pergunta: 'De folga na sexta? Então você chega às 17h em ponto, certo?',
    resposta: 'Anotado: 18h. Já com o fator carioca. A gente acredita em você, mas nem tanto.',
  },
  {
    id: 'trabalho', t: 'Saio do trabalho e vou direto', plano: '19h', carioca: '20h', luz: 'anoitecer',
    pergunta: 'Saindo do trabalho direto pro Sat\'s. Então chega a partir das 19h, certo?',
    resposta: 'Anotado: 20h. Já com o fator carioca.',
  },
  {
    id: 'casa', t: 'Vou passar em casa antes', plano: '20h', carioca: '21h', luz: 'noite',
    pergunta: 'Passar em casa, tomar banho, trocar de roupa, deitar só um minutinho... Então umas 20h, certo?',
    resposta: 'Anotado: 21h. O minutinho na cama já está incluído.',
  },
  {
    id: 'role', t: 'Tenho outro rolê antes', plano: '21h', carioca: '22h', luz: 'noite',
    pergunta: 'Outro rolê antes? Disputado, hein. Então lá pelas 21h, certo?',
    resposta: 'Anotado: 22h. O Serjão guarda um chopp pra você.',
  },
];

const RESPOSTAS = {
  sim: { rotulo: 'Tô dentro', texto: 'Fechou, {nome}! O Serjão já tá gelando o seu chopp. Te vejo lá.' },
  talvez: { rotulo: 'Vou tentar', texto: 'Entendido, {nome}. O horário carioca agradece sua sinceridade.' },
  nao: { rotulo: 'Não vai', texto: 'Poxa, {nome}. O Caramelo vai ficar arrasado. A gente guarda um pedaço de polenta pra você. Mentira, o Caramelo come.' },
};

// ---------------------------------------------------------------- blocos de layout

function coluna(j, ctx, largura, blocos) {
  const u = j.u;
  const w = Math.min(j.W - 8 * u, largura * u);
  const pad = 10 * u;
  const innerW = Math.floor((w - 2 * pad) / u);
  const hs = blocos.map((b) => b.h(innerW));
  const total = hs.reduce((a, b) => a + b, 0) * u + 2 * pad;
  const x = Math.round((j.W - w) / 2);
  const y = Math.round(Math.max(4 * u, (j.H - total) / 2));
  painel(ctx, x, y, w, total, u);
  let cy = y + pad;
  blocos.forEach((b, i) => { b.draw(x + pad, cy, w - 2 * pad, innerW); cy += hs[i] * u; });
}

const espaco = (n) => ({ h: () => n, draw: () => {} });

function texto(j, ctx, str, { cor = C.uiTexto, escala = 1, centro = false, sombra = C.uiSombra } = {}) {
  const s = j.fmt(str);
  return {
    h: (iw) => wrap(s, Math.floor(iw / escala)).length * LINE_H * escala,
    draw: (x, y, w, iw) => {
      const linhas = wrap(s, Math.floor(iw / escala));
      linhas.forEach((l, i) => {
        if (centro) drawText(ctx, l, x + w / 2, y + i * LINE_H * escala * j.u, escala * j.u, cor, sombra, 'center');
        else drawText(ctx, l, x, y + i * LINE_H * escala * j.u, escala * j.u, cor, sombra);
      });
    },
  };
}

function bt(j, ctx, label, fn, op = {}) {
  return {
    h: () => 20,
    draw: (x, y, w) => {
      const r = { x, y, w, h: 16 * j.u };
      const hover = j.mouse && j.dentro(r, j.mouse.x, j.mouse.y);
      botao(ctx, x, y, w, r.h, j.fmt(label), j.u, { ...op, hover });
      if (op.ativo !== false) j.hit(r, fn);
    },
  };
}

function linhaInfo(j, ctx, ic, str) {
  return {
    h: (iw) => wrap(str, iw - 12).length * LINE_H + 2,
    draw: (x, y, w, iw) => {
      icone(ctx, ic, x, y + 2 * j.u, j.u, C.uiDestaque);
      wrap(str, iw - 12).forEach((l, i) => drawText(ctx, l, x + 12 * j.u, y + i * LINE_H * j.u, j.u, C.uiTexto, C.uiSombra));
    },
  };
}

function escuro(j, ctx, a = 0.62) { R(ctx, 0, 0, j.W, j.H, `rgba(18,9,11,${a})`); }

// ---------------------------------------------------------------- telas

export function desenharTela(j, ctx, t) {
  j.campoRect = null;
  switch (j.tela) {
    case 'titulo': return telaTitulo(j, ctx, t);
    case 'nome': return telaNome(j, ctx, t);
    case 'chegada': return telaChegada(j, ctx, t);
    case 'avatar': return telaAvatar(j, ctx, t);
    case 'convite': return telaConvite(j, ctx, t);
  }
}

function irPara(j, tela) {
  j.tela = tela;
  j.teclaTela = null;
  if (tela === 'nome') setTimeout(() => { if (!matchMedia('(pointer: coarse)').matches) j.campo.focus(); }, 50);
}

function telaTitulo(j, ctx) {
  escuro(j, ctx, 0.45);
  const grande = (j.W / j.u) >= 230 ? 3 : 2;
  j.teclaTela = (e) => { if (e.key === 'Enter') irPara(j, 'nome'); };
  coluna(j, ctx, 240, [
    texto(j, ctx, 'A NOITE DO', { escala: grande, centro: true, cor: C.creme, sombra: C.bordo }),
    texto(j, ctx, 'BERNARDO', { escala: grande, centro: true, cor: C.uiDestaque, sombra: C.bordo }),
    espaco(4),
    texto(j, ctx, 'Um convite em forma de jogo.', { centro: true, cor: C.uiSuave }),
    espaco(10),
    linhaInfo(j, ctx, 'calendario', FESTA.dia),
    linhaInfo(j, ctx, 'pin', FESTA.local),
    espaco(10),
    bt(j, ctx, 'Começar', () => irPara(j, 'nome'), { destaque: true }),
    espaco(2),
    texto(j, ctx, 'Leva uns 5 minutos. Com som fica melhor.', { centro: true, cor: C.uiSuave }),
  ]);
}

export function confirmarNome(j) {
  const nome = (j.campo.value || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  if (!nome) return;
  let primeiro = nome.split(' ')[0].slice(0, 14);
  primeiro = primeiro.charAt(0).toUpperCase() + primeiro.slice(1);
  j.dados.nome = nome;
  j.dados.primeiro = primeiro;
  j.campo.blur();
  j.chegadaEtapa = 'lista';
  irPara(j, 'chegada');
}

function telaNome(j, ctx, t) {
  escuro(j, ctx);
  const u = j.u;
  const valor = j.campo.value || '';
  coluna(j, ctx, 230, [
    texto(j, ctx, 'ANTES DE ENTRAR NO SAT\'S', { cor: C.uiDestaque }),
    espaco(4),
    texto(j, ctx, 'Como você se chama?'),
    espaco(6),
    {
      h: () => 22,
      draw: (x, y, w, iw) => {
        const h = 18 * u;
        R(ctx, x, y, w, h, C.uiSombra);
        R(ctx, x + u, y + u, w - 2 * u, h - 2 * u, '#fbf6ea');
        const focado = document.activeElement === j.campo;
        let mostra = valor;
        while (measure(mostra) > iw - 10 && mostra.length) mostra = mostra.slice(1);
        if (mostra) drawText(ctx, mostra, x + 5 * u, y + 3 * u, u, C.contorno);
        else if (!focado) drawText(ctx, 'Toque aqui e digite', x + 5 * u, y + 3 * u, u, '#a89a86');
        if (focado && Math.floor(t / 450) % 2) R(ctx, x + 5 * u + (mostra ? (measure(mostra) + 2) * u : 0), y + 4 * u, u, 9 * u, C.bordo);
        j.campoRect = { x, y, w, h };
        j.hit({ x, y, w, h }, () => j.campo.focus());
      },
    },
    texto(j, ctx, 'O seu primeiro nome vai aparecer nas conversas do jogo.', { cor: C.uiSuave }),
    espaco(8),
    bt(j, ctx, 'Continuar', () => confirmarNome(j), { destaque: !!valor.trim(), ativo: !!valor.trim() }),
  ]);
}

function telaChegada(j, ctx) {
  escuro(j, ctx);
  const etapa = j.chegadaEtapa || 'lista';
  const ch = j.dados.chegada;
  if (etapa === 'lista') {
    coluna(j, ctx, 240, [
      texto(j, ctx, 'E aí, {nome}.', { cor: C.uiDestaque }),
      texto(j, ctx, 'Como vai ser a sua sexta?'),
      espaco(8),
      ...CHEGADAS.map((c) => bt(j, ctx, c.t, () => { j.dados.chegada = c; j.chegadaEtapa = 'confirma'; }, { alinhar: 'left' })),
    ]);
  } else if (etapa === 'confirma') {
    coluna(j, ctx, 240, [
      texto(j, ctx, ch.pergunta),
      espaco(10),
      bt(j, ctx, 'Isso!', () => { j.chegadaEtapa = 'anotado'; j.luz = ch.luz; }, { destaque: true }),
      bt(j, ctx, 'Voltar', () => { j.chegadaEtapa = 'lista'; }),
    ]);
  } else {
    coluna(j, ctx, 240, [
      texto(j, ctx, ch.resposta),
      espaco(10),
      bt(j, ctx, 'Justo.', () => irPara(j, 'avatar'), { destaque: true }),
    ]);
  }
}

const avatarSprites = [];
function telaAvatar(j, ctx, t) {
  escuro(j, ctx);
  const u = j.u;
  if (!avatarSprites.length) AVATARES.forEach((a) => avatarSprites.push(buildCharacter(a)));
  const cols = j.W > j.H ? 6 : 4;
  const rows = Math.ceil(AVATARES.length / cols);
  const CW = 28, CH = 50;
  const largura = j.W > j.H ? 300 : 240;
  const iwPx = Math.min(j.W - 8 * u, largura * u) - 20 * u;
  const k = Math.max(1, Math.floor(Math.min(iwPx / (cols * (CW + 3)), (j.H * 0.5) / (rows * (CH + 3)))));
  const gridH = Math.ceil(rows * (CH + 3) * k / u);
  coluna(j, ctx, largura, [
    texto(j, ctx, 'Escolha seu personagem', { cor: C.uiDestaque }),
    espaco(6),
    {
      h: () => gridH,
      draw: (x, y, w) => {
        const cellW = Math.floor(w / cols);
        AVATARES.forEach((a, i) => {
          const cx = x + (i % cols) * cellW;
          const cy = y + Math.floor(i / cols) * (CH + 3) * k;
          const sel = j.dados.avatar === i;
          const r = { x: cx + u, y: cy, w: cellW - 2 * u, h: (CH + 2) * k };
          R(ctx, r.x, r.y, r.w, r.h, sel ? '#5a3a2c' : '#3a2722');
          if (sel) {
            R(ctx, r.x, r.y, r.w, u, C.uiDestaque); R(ctx, r.x, r.y + r.h - u, r.w, u, C.uiDestaque);
            R(ctx, r.x, r.y, u, r.h, C.uiDestaque); R(ctx, r.x + r.w - u, r.y, u, r.h, C.uiDestaque);
          }
          const nomeQ = sel ? 'walk' + (Math.floor(t / 130) % 4) : (Math.floor(t / 1000 + i) % 5 === 0 ? 'blink' : 'idle0');
          const cv = frameCanvas(avatarSprites[i], nomeQ, false);
          ctx.drawImage(cv, 1, 7, CW, CH, Math.round(r.x + (r.w - CW * k) / 2), r.y + k, CW * k, CH * k);
          j.hit(r, () => { j.dados.avatar = i; });
        });
      },
    },
    espaco(6),
    bt(j, ctx, 'Esse sou eu', async () => {
      if (j.iniciando) return;
      j.iniciando = true;
      await j.fade(1, 400);
      j.roteiro.comecar(j);
    }, { destaque: true }),
  ]);
}

function telaConvite(j, ctx) {
  escuro(j, ctx, 0.55);
  const cv = j.convite || (j.convite = { etapa: 'pergunta' });
  const ch = j.dados.chegada || CHEGADAS[1];
  const titulo = [
    texto(j, ctx, 'A NOITE DO BERNARDO', { cor: C.uiDestaque, escala: (j.W / j.u) >= 260 ? 2 : 1, centro: true, sombra: C.bordo }),
    espaco(6),
  ];
  const infos = [
    linhaInfo(j, ctx, 'calendario', FESTA.dia),
    linhaInfo(j, ctx, 'relogio', FESTA.horario),
    linhaInfo(j, ctx, 'pin', FESTA.local),
    linhaInfo(j, ctx, 'chopp', `Sua chegada: ${ch.carioca}, com o fator carioca.`),
  ];
  const responder = async (chave) => {
    cv.etapa = 'resposta';
    cv.chave = chave;
    cv.status = 'enviando';
    j.dados.resposta = chave;
    cv.status = await enviarRSVP({ nome: j.dados.nome, resposta: RESPOSTAS[chave].rotulo, chegada: `${ch.t} (previsão ${ch.carioca})` });
  };
  if (cv.etapa === 'pergunta') {
    coluna(j, ctx, 250, [
      ...titulo,
      texto(j, ctx, '{nome}, você está oficialmente convocado(a) para uma noite de chopp, petiscos e acontecimentos de procedência duvidosa.'),
      espaco(8),
      ...infos,
      espaco(8),
      bt(j, ctx, 'Tô dentro!', () => responder('sim'), { destaque: true }),
      bt(j, ctx, 'Vou tentar aparecer', () => responder('talvez')),
      bt(j, ctx, 'Não vou conseguir', () => responder('nao')),
    ]);
    return;
  }
  const st = {
    enviando: 'Enviando sua resposta...',
    ok: 'Resposta enviada.',
    teste: 'Modo de teste: nada foi enviado.',
    erro: 'Não deu para enviar agora. Tente de novo em instantes.',
  }[cv.status];
  coluna(j, ctx, 250, [
    ...titulo,
    texto(j, ctx, RESPOSTAS[cv.chave].texto),
    espaco(4),
    texto(j, ctx, st, { cor: cv.status === 'erro' ? '#ff9a8a' : C.uiSuave }),
    espaco(8),
    ...(cv.chave !== 'nao' ? infos.slice(0, 3) : []),
    espaco(6),
    cv.status === 'erro' ? bt(j, ctx, 'Tentar de novo', () => responder(cv.chave), { destaque: true }) : null,
    cv.chave !== 'nao' ? bt(j, ctx, 'Ver no mapa', () => window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(FESTA.buscaMapa), '_blank', 'noopener')) : null,
    bt(j, ctx, 'Mudar resposta', () => { cv.etapa = 'pergunta'; }),
    bt(j, ctx, 'Jogar de novo', () => location.reload()),
  ].filter(Boolean));
}
