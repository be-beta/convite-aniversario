// Telas fora do jogo: abertura, nome, horário de chegada, avatar e o convite final.

import { painel, botao, icone, R, drawText, measure, wrap, LINE_H } from './ui.js';
import { C } from './paleta.js';
import { CRIADOR, selecaoAleatoria, montarLook, campoDoCriador, codigoDoPersonagem } from './personagens.js';
import { buildCharacter, frameCanvas } from './sprites.js';
import { FESTA } from './config.js';
import { enviarRSVP } from './rsvp.js';
import { iniciarSom } from './audio.js';
import { CARDAPIO, FONTE_CARDAPIO } from './cardapio.js';

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
  let hs = blocos.map((b) => b.h(innerW));
  let total = hs.reduce((a, b) => a + b, 0) * u + 2 * pad;
  // tela baixa demais: tira os blocos opcionais para os botões não saírem da tela
  if (total > j.H - 8 * u && blocos.some((b) => b.opcional)) {
    blocos = blocos.filter((b) => !b.opcional);
    hs = blocos.map((b) => b.h(innerW));
    total = hs.reduce((a, b) => a + b, 0) * u + 2 * pad;
  }
  // ainda não coube: encolhe os espaços entre os blocos
  if (total > j.H - 8 * u) {
    hs = hs.map((h, i) => (blocos[i].espaco ? Math.min(h, 2) : h));
    total = hs.reduce((a, b) => a + b, 0) * u + 2 * pad;
  }
  const x = Math.round((j.W - w) / 2);
  const y = Math.round(Math.max(4 * u, (j.H - total) / 2));
  painel(ctx, x, y, w, total, u);
  let cy = y + pad;
  blocos.forEach((b, i) => { b.draw(x + pad, cy, w - 2 * pad, innerW); cy += hs[i] * u; });
}

const espaco = (n) => ({ h: () => n, draw: () => {}, espaco: true });

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
    case 'avatar': return telaCriador(j, ctx, t);
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
    bt(j, ctx, 'Começar', () => { iniciarSom(); irPara(j, 'nome'); }, { destaque: true }),
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

// ---------------------------------------------------------------- criador de personagem

const previewCache = new Map();
function spriteDoLook(look) {
  const k = JSON.stringify(look);
  if (!previewCache.has(k)) {
    if (previewCache.size > 16) previewCache.clear();
    previewCache.set(k, buildCharacter(look));
  }
  return previewCache.get(k);
}

function mudarCampo(j, campo, passo) {
  const sel = j.criador.sel;
  const n = campo.ops.length;
  sel[campo.k] = ((sel[campo.k] || 0) + passo + n) % n;
  // a prótese só aparece com short ou saia
  if (campo.k === 'mobilidade' && campo.ops[sel.mobilidade][0] === 'protese') {
    const b = campoDoCriador('baixo');
    const atual = b.ops[sel.baixo][0];
    if (atual === 'calca' || atual === 'pantalona') sel.baixo = b.ops.findIndex((o) => o[0] === 'short');
  }
}

function seta(ctx, x, y, w, h, dir, u, hover) {
  R(ctx, x, y, w, h, C.uiSombra);
  R(ctx, x + u, y + u, w - 2 * u, h - 2 * u, hover ? '#fff6dd' : C.creme);
  const cx = x + Math.floor(w / 2), cy = y + Math.floor(h / 2);
  for (let i = 0; i < 4; i++) {
    const px = dir < 0 ? cx - 2 * u + i * u : cx + u - i * u;
    R(ctx, px, cy - i * u, u, (2 * i + 1) * u, C.bordo);
  }
}

function telaCriador(j, ctx, t) {
  escuro(j, ctx);
  const u = j.u;
  if (!j.criador) j.criador = { aba: 0, sel: selecaoAleatoria() };
  const cr = j.criador;
  const look = montarLook(cr.sel);
  const sp = spriteDoLook(look);
  const deitado = j.W > j.H * 1.1;
  const ROW = 18;
  const controlesH = 18 + 5 * ROW;
  const hov = (r) => j.mouse && j.dentro(r, j.mouse.x, j.mouse.y);

  const preview = (x, y, w, h) => {
    R(ctx, x, y, w, h, '#3a2722');
    const chao = y + h - 8 * u;
    R(ctx, x, chao, w, h - (chao - y), '#4a332c');
    R(ctx, x, chao, w, u, '#5e4438');
    const k = Math.max(1, Math.floor(Math.min((h - 10 * u) / 50, w / 30)));
    const ciclo = Math.floor(t / 2600) % 4;
    const q = ciclo === 1 || ciclo === 3 ? 'walk' + (Math.floor(t / 130) % 4) : (Math.floor(t / 1700) % 4 === 0 ? 'blink' : 'idle0');
    const cv = frameCanvas(sp, q, ciclo === 3);
    const pe = chao + 3 * u;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(Math.round(x + w / 2 - 7 * k), pe + k, 14 * k, 2 * k);
    ctx.drawImage(cv, 0, 0, 30, 58, Math.round(x + w / 2 - 15 * k), Math.round(pe - 55 * k), 30 * k, 58 * k);
  };

  const controles = (x, y, w) => {
    const n = CRIADOR.length;
    const tw = Math.floor((w - 2 * u * (n - 1)) / n);
    CRIADOR.forEach((a, i) => {
      const r = { x: x + i * (tw + 2 * u), y, w: tw, h: 14 * u };
      const sel = i === cr.aba;
      R(ctx, r.x, r.y, r.w, r.h, sel ? C.creme : hov(r) ? '#5a4036' : '#4a332c');
      drawText(ctx, a.aba, r.x + r.w / 2, r.y + u, u, sel ? C.contorno : C.uiTexto, null, 'center');
      j.hit(r, () => { cr.aba = i; });
    });
    let cy = y + 18 * u;
    const labelW = (Math.max(...CRIADOR.flatMap((a) => a.campos.map((c) => measure(c.rotulo)))) + 5) * u;
    const aw = 14 * u;
    for (const c of CRIADOR[cr.aba].campos) {
      const op = c.ops[(cr.sel[c.k] || 0) % c.ops.length];
      const h = 16 * u;
      drawText(ctx, c.rotulo, x, cy + 2 * u, u, C.uiSuave, C.uiSombra);
      const r1 = { x: x + labelW, y: cy, w: aw, h };
      const r2 = { x: x + w - aw, y: cy, w: aw, h };
      seta(ctx, r1.x, r1.y, r1.w, r1.h, -1, u, hov(r1));
      seta(ctx, r2.x, r2.y, r2.w, r2.h, 1, u, hov(r2));
      j.hit(r1, () => mudarCampo(j, c, -1));
      j.hit(r2, () => mudarCampo(j, c, 1));
      const vx = r1.x + aw + u, vw = r2.x - u - vx;
      const rv = { x: vx, y: cy, w: vw, h };
      R(ctx, vx, cy, vw, h, hov(rv) ? '#4a332c' : '#3a2722');
      let nome = op[1];
      const livre = vw / u - (c.cor ? 16 : 6);
      if (measure(nome) > livre && op[2]) nome = op[2];
      const largura = measure(nome) * u + (c.cor ? 11 * u : 0);
      let tx = Math.round(vx + (vw - largura) / 2);
      if (c.cor) {
        R(ctx, tx, cy + 4 * u, 8 * u, 8 * u, C.uiSombra);
        R(ctx, tx + u, cy + 5 * u, 6 * u, 6 * u, op[3]);
        tx += 11 * u;
      }
      drawText(ctx, nome, tx, cy + 2 * u, u, C.uiTexto, C.uiSombra);
      j.hit(rv, () => mudarCampo(j, c, 1));
      cy += ROW * u;
    }
  };

  const botoes = {
    h: () => 20,
    draw: (x, y, w) => {
      const bw = Math.floor((w - 4 * u) / 2);
      const ra = { x, y, w: bw, h: 16 * u };
      const rp = { x: x + bw + 4 * u, y, w: bw, h: 16 * u };
      botao(ctx, ra.x, ra.y, ra.w, ra.h, 'Aleatório', u, { hover: hov(ra) });
      botao(ctx, rp.x, rp.y, rp.w, rp.h, 'Pronto', u, { destaque: true, hover: hov(rp) });
      j.hit(ra, () => { cr.sel = selecaoAleatoria(); });
      j.hit(rp, async () => {
        if (j.iniciando) return;
        j.iniciando = true;
        j.dados.look = montarLook(cr.sel);
        j.dados.codigo = codigoDoPersonagem(cr.sel);
        await j.fade(1, 400);
        j.roteiro.comecar(j);
      });
    },
  };

  const titulo = texto(j, ctx, 'Monte seu personagem', { cor: C.uiDestaque });
  if (deitado) {
    coluna(j, ctx, 300, [
      titulo, espaco(4),
      { h: () => controlesH, draw: (x, y, w) => { preview(x, y, 84 * u, controlesH * u - 2 * u); controles(x + 90 * u, y, w - 90 * u); } },
      espaco(4), botoes,
    ]);
  } else {
    coluna(j, ctx, 240, [
      titulo, espaco(4),
      { h: () => 80, draw: (x, y, w) => preview(x, y, w, 76 * u) },
      espaco(4),
      { h: () => controlesH, draw: (x, y, w) => controles(x, y, w) },
      espaco(2), botoes,
    ]);
  }
}

function telaConvite(j, ctx) {
  escuro(j, ctx, 0.55);
  const cv = j.convite || (j.convite = { etapa: 'pergunta' });
  const ch = j.dados.chegada || CHEGADAS[1];
  const titulo = [
    texto(j, ctx, 'A NOITE DO BERNARDO', { cor: C.uiDestaque, escala: (j.W / j.u) >= 260 && (j.H / j.u) >= 250 ? 2 : 1, centro: true, sombra: C.bordo }),
    espaco(6),
  ];
  const infos = [
    linhaInfo(j, ctx, 'calendario', FESTA.dia),
    linhaInfo(j, ctx, 'relogio', FESTA.horario),
    linhaInfo(j, ctx, 'pin', FESTA.local),
    { ...linhaInfo(j, ctx, 'chopp', `Sua chegada: ${ch.carioca}, com o fator carioca.`), opcional: true },
  ];
  const responder = async (chave) => {
    cv.etapa = 'resposta';
    cv.chave = chave;
    cv.status = 'enviando';
    j.dados.resposta = chave;
    // nomes de teste não vão para a planilha (para testar o jogo sem registrar)
    const ehTeste = /^(test|teste)$/i.test((j.dados.nome || '').trim());
    cv.status = ehTeste ? 'teste' : await enviarRSVP({ nome: j.dados.nome, resposta: RESPOSTAS[chave].rotulo, chegada: `${ch.t} (previsão ${ch.carioca})`, personagem: j.dados.codigo || '' });
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
      { ...bt(j, ctx, "Ver o cardápio do Sat's", () => j.abrirCardapio()), opcional: true },
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
    texto(j, ctx, 'AVISO IMPORTANTE', { cor: C.uiDestaque }),
    texto(j, ctx, 'A polenta com vela foi só uma brincadeira do jogo. Ninguém precisa levar bolo. E, por favor, ninguém ponha fogo em guardanapo enrolado em palito. O Serjão e o Corpo de Bombeiros agradecem.', { cor: C.uiSuave }),
    espaco(8),
    ...(cv.chave !== 'nao' ? infos.slice(0, 3).map((b) => ({ ...b, opcional: true })) : []),
    espaco(6),
    cv.status === 'erro' ? bt(j, ctx, 'Tentar de novo', () => responder(cv.chave), { destaque: true }) : null,
    cv.chave !== 'nao' ? bt(j, ctx, 'Ver no mapa', () => window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(FESTA.buscaMapa), '_blank', 'noopener')) : null,
    cv.chave !== 'nao' ? { ...bt(j, ctx, "Ver o cardápio do Sat's", () => j.abrirCardapio()), opcional: true } : null,
    bt(j, ctx, 'Mudar resposta', () => { cv.etapa = 'pergunta'; }),
    bt(j, ctx, 'Jogar de novo', () => location.reload()),
  ].filter(Boolean));
}

// ---------------------------------------------------------------- cardápio (janela por cima de tudo)

export function desenharCardapio(j, ctx) {
  const u = j.u;
  const cd = j.cardapio;
  R(ctx, 0, 0, j.W, j.H, 'rgba(18,9,11,0.7)');
  j.hit({ x: 0, y: 0, w: j.W, h: j.H }, () => {});
  j.hits[j.hits.length - 1].semSom = true;

  const w = Math.min(j.W - 8 * u, 260 * u);
  const pad = 10 * u;
  const innerW = Math.floor((w - 2 * pad) / u);
  const nota = wrap(FONTE_CARDAPIO, innerW);
  const fixo = 14 + 14 + nota.length * LINE_H + 8 + 20;
  const maxH = Math.floor(j.H / u) - 8;
  const espacoItens = Math.max(44, Math.min(130, maxH - fixo - 20));

  // monta as páginas (uma categoria pode ocupar mais de uma página)
  if (!cd.paginas || cd.larg !== innerW || cd.alt !== espacoItens) {
    cd.larg = innerW; cd.alt = espacoItens;
    cd.paginas = [];
    for (const cat of CARDAPIO) {
      let pag = { categoria: cat.categoria, itens: [], h: 0 };
      for (const [nome, preco] of cat.itens) {
        const pw = measure('R$ ' + preco);
        const linhas = wrap(nome, innerW - pw - 8);
        const h = linhas.length * 11;
        if (pag.h + h > espacoItens && pag.itens.length) { cd.paginas.push(pag); pag = { categoria: cat.categoria, itens: [], h: 0 }; }
        pag.itens.push({ linhas, preco: 'R$ ' + preco, h });
        pag.h += h;
      }
      cd.paginas.push(pag);
    }
    cd.pag = Math.min(cd.pag || 0, cd.paginas.length - 1);
  }
  const pg = cd.paginas[cd.pag];
  const altura = (fixo + espacoItens) * u + 2 * pad;
  const x = Math.round((j.W - w) / 2);
  const y = Math.round(Math.max(4 * u, (j.H - altura) / 2));
  painel(ctx, x, y, w, altura, u, { fundo: '#f4ead2', borda: C.bordo });
  let cy = y + pad - 2 * u;
  drawText(ctx, 'CARDÁPIO DO SAT\'S', x + w / 2, cy, u, C.bordo, null, 'center');
  cy += 14 * u;
  drawText(ctx, pg.categoria, x + pad, cy, u, C.contorno);
  drawText(ctx, `${cd.pag + 1}/${cd.paginas.length}`, x + w - pad, cy, u, '#8a7a66', null, 'right');
  R(ctx, x + pad, cy + 11 * u, w - 2 * pad, u, C.bordo);
  cy += 14 * u;
  for (const it of pg.itens) {
    it.linhas.forEach((l, i) => drawText(ctx, l, x + pad, cy + i * 11 * u, u, C.contorno));
    const ultima = it.linhas[it.linhas.length - 1];
    const ly = cy + (it.linhas.length - 1) * 11 * u;
    const px = x + w - pad - measure(it.preco) * u;
    for (let dx = x + pad + (measure(ultima) + 3) * u; dx < px - 3 * u; dx += 3 * u) R(ctx, dx, ly + 7 * u, u, u, '#b8a68c');
    drawText(ctx, it.preco, px, ly, u, C.bordo);
    cy += it.h * u;
  }
  cy = y + pad - 2 * u + (14 + 14 + espacoItens) * u + 4 * u;
  nota.forEach((l, i) => drawText(ctx, l, x + pad, cy + i * LINE_H * u, u, '#8a7a66'));
  cy += nota.length * LINE_H * u + 6 * u;
  const bw = Math.floor((w - 2 * pad - 8 * u) / 3);
  const hov = (r) => j.mouse && j.dentro(r, j.mouse.x, j.mouse.y);
  const r1 = { x: x + pad, y: cy, w: bw, h: 16 * u };
  const r2 = { x: x + pad + bw + 4 * u, y: cy, w: bw, h: 16 * u };
  const r3 = { x: x + pad + 2 * (bw + 4 * u), y: cy, w: bw, h: 16 * u };
  botao(ctx, r1.x, r1.y, r1.w, r1.h, '< Volta', u, { ativo: cd.pag > 0, hover: hov(r1) });
  botao(ctx, r2.x, r2.y, r2.w, r2.h, 'Fechar', u, { destaque: true, hover: hov(r2) });
  botao(ctx, r3.x, r3.y, r3.w, r3.h, 'Mais >', u, { ativo: cd.pag < cd.paginas.length - 1, hover: hov(r3) });
  if (cd.pag > 0) j.hit(r1, () => { cd.pag--; });
  j.hit(r2, () => j.fecharCardapio());
  if (cd.pag < cd.paginas.length - 1) j.hit(r3, () => { cd.pag++; });
}
