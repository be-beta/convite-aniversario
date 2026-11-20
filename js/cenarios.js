// Cenários do Sat's: calçada com a fachada do casarão e o corredor do balcão.
// Tudo desenhado em código, em resolução baixa, e depois ampliado sem suavização.

import { C, dark, light, mix, rng } from './paleta.js';
import { drawTextPx } from './font.js';

export const SCENE_H = 200;

// Variações de luz conforme o horário de chegada do convidado.
export const LUZES = {
  entardecer: {
    ceu: ['#6a5f93', '#93709a', '#c97f86', '#e99a72', '#f4b46c', '#f8d08a'],
    sombra: 'rgba(255,150,80,0.10)', lampadas: 0.45, letreiro: false, janelas: 0.15,
  },
  anoitecer: {
    ceu: ['#1d2350', '#272c60', '#3a3675', '#5a4583', '#86567f', '#b86a78'],
    sombra: 'rgba(28,26,86,0.30)', lampadas: 1, letreiro: true, janelas: 0.45,
  },
  noite: {
    ceu: ['#0d1230', '#11173a', '#161d44', '#1b234d', '#212a57', '#283161'],
    sombra: 'rgba(14,12,58,0.44)', lampadas: 1, letreiro: true, janelas: 0.6,
  },
};

const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// Brilho em degraus (combina com pixel art). Desenhado com mistura aditiva.
const glowCache = new Map();
export function glowSprite(r, cor) {
  const k = r + cor;
  if (glowCache.has(k)) return glowCache.get(k);
  const c = canvas(r * 2 + 1, r * 2 + 1);
  const g = c.getContext('2d');
  const passos = [[1, 0.07], [0.7, 0.08], [0.45, 0.1], [0.25, 0.14]];
  for (const [f, a] of passos) {
    const rr = r * f;
    g.fillStyle = cor;
    g.globalAlpha = a;
    for (let y = -rr; y <= rr; y++) {
      const w = Math.floor(Math.sqrt(rr * rr - y * y));
      g.fillRect(r - w, Math.round(r + y), w * 2 + 1, 1);
    }
  }
  glowCache.set(k, c);
  return c;
}

function ceu(g, w, h, cores) {
  const banda = Math.ceil(h / cores.length);
  cores.forEach((c, i) => R(g, 0, i * banda, w, banda + 1, c));
  // pontilhado entre bandas para suavizar em pixel
  for (let i = 1; i < cores.length; i++) {
    const y = i * banda;
    g.fillStyle = cores[i - 1];
    for (let x = (i % 2); x < w; x += 2) g.fillRect(x, y, 1, 1);
  }
}

function sombraGeral(g, w, h, luz) {
  g.globalCompositeOperation = 'source-atop';
  R(g, 0, 0, w, h, luz.sombra);
  g.globalCompositeOperation = 'source-over';
}

function janelaGrade(g, x, y, w, h) {
  R(g, x, y, w, h, '#2f3d3e');
  R(g, x + 1, y + 1, w - 2, h - 2, '#3e5552');
  for (let i = 3; i < h - 2; i += 6) R(g, x + 2, y + i, w - 4, 1, '#4f6a65');
  R(g, x + Math.floor(w / 2), y, 1, h, '#2f3d3e');
}

function veneziana(g, x, y, w, h, cor) {
  R(g, x, y, w, h, dark(cor, 0.2));
  for (let i = 1; i < h - 1; i += 2) R(g, x + 1, y + i, w - 2, 1, cor);
}

// ---------------------------------------------------------------------------
// CALÇADA E FACHADA

function pintaCalcada(luz) {
  const W = 400, H = SCENE_H;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const r = rng(212);

  // prédio branco ao fundo, à direita
  R(g, 250, 0, 150, 130, '#e2dfd8');
  for (let yy = 4; yy < 120; yy += 22) {
    R(g, 250, yy + 16, 150, 3, '#cfcac0');
    R(g, 250, yy + 19, 150, 1, '#a9a399');
    for (let xx = 262; xx < 400; xx += 26) {
      R(g, xx, yy + 2, 14, 12, '#7b8a94');
      R(g, xx + 1, yy + 3, 12, 10, '#8fa0aa');
      R(g, xx + 7, yy + 2, 1, 12, '#6b7a84');
    }
  }
  R(g, 330, 0, 3, 120, '#8a5a3a'); R(g, 331, 0, 1, 120, '#a8704a');
  R(g, 352, 30, 10, 10, '#9a9690'); R(g, 353, 31, 8, 8, '#76726c');

  // prédio vizinho à esquerda
  R(g, 0, 26, 58, 140, '#cbbfa8');
  for (let yy = 34; yy < 150; yy += 30) R(g, 8, yy, 20, 18, '#5c5650'), R(g, 9, yy + 1, 18, 16, '#6e6860');
  R(g, 36, 40, 13, 104, '#2d2a2e');
  R(g, 37, 41, 11, 102, '#3a363b');
  'RESTAURANTE'.split('').forEach((ch, i) => drawTextPx(g, ch, 40, 40 + i * 9, '#e9e1cf'));

  // CASARÃO
  const x0 = 58, x1 = 254;
  R(g, x0, 20, x1 - x0, 146, C.creme);
  R(g, x1 - 5, 20, 5, 146, C.cremeSombra);
  // platibanda e coroamento
  R(g, x0, 18, x1 - x0, 3, C.bordo);
  R(g, x0, 28, x1 - x0, 4, C.bordo);
  R(g, x0, 32, x1 - x0, 1, C.bordoEsc);
  R(g, 140, 8, 34, 11, C.bordo);
  R(g, 144, 4, 26, 4, C.bordo);
  R(g, 150, 1, 14, 3, C.bordo);
  R(g, 153, 9, 8, 7, C.creme); R(g, 155, 11, 4, 3, C.bordo);
  R(g, 140, 18, 34, 1, C.bordoEsc);
  for (let xx = x0 + 6; xx < x1 - 6; xx += 12) R(g, xx, 23, 4, 4, C.cremeSombra);

  // pilastras com pingentes
  const pilastra = (x, y, h) => {
    R(g, x, y, 2, h, C.bordo); R(g, x + 4, y, 2, h, C.bordo);
    R(g, x - 1, y + h, 8, 3, C.bordo); R(g, x + 1, y + h + 3, 4, 3, C.bordoClaro);
    R(g, x + 2, y + h + 6, 2, 2, C.bordo);
  };
  [64, 126, 206, 240].forEach((x) => { pilastra(x, 38, 42); pilastra(x, 108, 28); });

  // janelas de cima
  const janelaAlta = (x, y, w, h, vidro) => {
    R(g, x - 3, y - 4, w + 6, h + 6, C.bordo);
    R(g, x - 1, y - 2, w + 2, h + 2, C.bordoEsc);
    R(g, x, y, w, h, vidro);
    R(g, x + 2, y + 2, 3, h - 4, light(vidro, 0.12));
    R(g, x + Math.floor(w / 2), y, 1, h, dark(vidro, 0.3));
    veneziana(g, x + w - 7, y + 2, 6, h - 4, C.oliva);
  };
  janelaAlta(82, 46, 22, 36, '#2f4a46');
  janelaAlta(168, 46, 22, 36, '#3f5f7a');
  // ornamento acima das janelas de cima
  for (const x of [82, 168]) {
    R(g, x - 6, 38, 34, 3, C.bordo); R(g, x + 4, 35, 14, 3, C.bordo); R(g, x + 9, 33, 4, 2, C.bordoClaro);
  }
  // sacada
  R(g, 156, 74, 46, 4, C.bordo);
  for (let xx = 158; xx < 200; xx += 4) R(g, xx, 78, 2, 11, C.bordoClaro);
  R(g, 156, 88, 46, 3, C.bordo);
  R(g, 154, 91, 50, 2, C.bordoEsc);

  // faixa entre andares
  R(g, x0, 94, x1 - x0, 9, C.bordo);
  R(g, x0, 94, x1 - x0, 1, C.bordoClaro);
  R(g, x0, 102, x1 - x0, 1, C.bordoEsc);
  for (let xx = x0 + 4; xx < x1; xx += 10) R(g, xx, 97, 4, 3, C.bordoEsc);

  // janelas de baixo (com luz do salão por dentro)
  const janelaBaixa = (x, y, w, h) => {
    R(g, x - 6, y - 7, w + 12, 4, C.bordo);
    R(g, x - 2, y - 10, w + 4, 3, C.bordo);
    R(g, x + Math.floor(w / 2) - 3, y - 12, 6, 3, C.bordoClaro);
    R(g, x - 3, y - 3, w + 6, h + 3, C.bordo);
    R(g, x - 1, y - 1, w + 2, h + 1, C.bordoEsc);
    R(g, x, y, w, h, '#3b2a22');
    R(g, x, y + h - 10, w, 10, '#4a3326');
    veneziana(g, x + w - 8, y + 2, 7, h - 4, C.oliva);
  };
  janelaBaixa(80, 112, 26, 38);
  janelaBaixa(166, 112, 26, 38);
  for (const x of [80, 166]) {
    R(g, x + 74 - 74, 160, 0, 0, '#000');
    R(g, x - 4, 150, 34, 3, C.bordo);
  }
  // número 212
  drawTextPx(g, '212', 224, 136, C.contorno);
  // base de troncos
  R(g, x0, 152, x1 - x0, 14, '#5a3a24');
  for (let yy = 153; yy < 166; yy += 4) {
    for (let xx = x0 + ((yy / 4) % 2 ? 2 : 0); xx < x1 - 2; xx += 5) {
      R(g, xx, yy, 4, 3, '#8a5f3a'); R(g, xx + 1, yy + 1, 2, 1, '#a87a4c');
    }
  }

  // ENTRADA DO CORREDOR
  R(g, 256, 96, 144, 70, '#2a1a1c');
  R(g, 256, 108, 144, 34, '#4a2022');
  for (let xx = 270; xx < 400; xx += 22) {
    R(g, xx, 132, 8, 12, C.inoxEsc); R(g, xx, 130, 8, 3, C.vermelhoEsc);
  }
  R(g, 256, 142, 144, 24, '#3a2a26');
  R(g, 256, 160, 144, 6, '#7a746a');
  R(g, 256, 160, 144, 1, '#9a948a');

  // toldo vermelho
  for (let x = 252; x < 400; x++) {
    const t = Math.round(82 - (x - 252) * 0.05);
    const b = t + 17;
    const dobra = (x - 252) % 18 < 2;
    R(g, x, t, 1, b - t, dobra ? C.vermelhoEsc : C.vermelho);
    R(g, x, t, 1, 1, C.vermelhoClaro);
    R(g, x, b, 1, 2, C.vermelhoEsc);
    R(g, x, b + 2, 1, 1, '#5a1214');
  }
  R(g, 256, 101, 144, 1, C.ferro);

  // portão de ferro
  R(g, 254, 98, 5, 68, C.ferro); R(g, 253, 96, 7, 3, C.ferro);
  for (let xx = 261; xx < 284; xx += 3) {
    R(g, xx, 112, 1, 52, C.ferro);
    R(g, xx, 110, 1, 2, C.ferroClaro);
  }
  R(g, 260, 116, 25, 2, C.ferro); R(g, 260, 140, 25, 1, C.ferro); R(g, 260, 162, 25, 2, C.ferro);
  for (let xx = 262; xx < 283; xx += 6) { R(g, xx, 119, 3, 1, C.ferro); R(g, xx + 1, 120, 1, 2, C.ferro); }
  R(g, 395, 98, 5, 68, C.ferro);

  // letreiro pendurado
  R(g, 252, 58, 54, 2, C.ferro);
  R(g, 258, 54, 1, 6, C.ferro);
  R(g, 286, 60, 1, 3, C.ferro); R(g, 300, 60, 1, 3, C.ferro);

  // árvore da calçada
  R(g, 18, 40, 6, 126, '#5a3e2a'); R(g, 19, 40, 2, 126, '#6e4c32');
  R(g, 12, 160, 18, 6, '#4a4038');
  const folhas = ['#3e6b34', '#4f7f3c', '#2f5528', '#679448'];
  for (let i = 0; i < 520; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    const x = Math.round(26 + Math.cos(a) * d * 44), y = Math.round(16 + Math.sin(a) * d * 24);
    R(g, x, y, 3, 2, folhas[Math.floor(r() * folhas.length)]);
  }

  // calçada de pedra portuguesa (ondas)
  R(g, 0, 166, W, 34, '#ebe7de');
  for (let y = 166; y < 197; y++) {
    for (let x = 0; x < W; x++) {
      const v = (y * 1.3 + 5 * Math.sin(x / 8)) % 14;
      if (v < 3.4) R(g, x, y, 1, 1, '#2f2e33');
    }
  }
  R(g, 0, 166, W, 1, '#7a746a');
  R(g, 0, 196, W, 4, '#9a958c'); R(g, 0, 196, W, 1, '#c4bfb4');

  sombraGeral(g, W, H, luz);
  g.globalCompositeOperation = 'destination-over';
  ceu(g, W, 120, luz.ceu);
  g.globalCompositeOperation = 'source-over';
  return c;
}

function emissivoCalcada(g, luz, t) {
  // janelas acesas do prédio de trás
  const r = rng(77);
  for (let yy = 4; yy < 60; yy += 22) {
    for (let xx = 262; xx < 400; xx += 26) {
      if (r() < luz.janelas) R(g, xx + 1, yy + 3, 12, 10, r() < 0.5 ? '#f3d58a' : '#e9c374');
    }
  }
  // salão aceso por dentro das janelas de baixo
  if (luz.lampadas > 0.6) {
    for (const x of [80, 166]) {
      R(g, x, 112, 18, 28, '#c98a4a');
      R(g, x + 4, 118, 3, 3, C.globo); R(g, x + 12, 116, 3, 3, C.globo);
    }
  }
  // luzes no fundo do corredor
  for (let xx = 266; xx < 400; xx += 16) R(g, xx, 104, 1, 1, luz.lampadas > 0.6 ? '#ffe7a8' : '#d9b07a');
  // letreiro
  letreiro(g, 266, 62, luz.letreiro);
  // arandelas
  R(g, 258, 92, 4, 4, luz.lampadas > 0.6 ? C.globo : '#e8d8b0');
}

function letreiro(g, x, y, aceso) {
  const faixa = aceso ? '#5b3f9e' : '#7a2a2c';
  R(g, x, y, 48, 30, '#8a7a5a');
  R(g, x + 1, y + 1, 46, 28, aceso ? '#fbf8ef' : '#ebe5d6');
  R(g, x + 2, y + 13, 44, 11, faixa);
  R(g, x + 3, y + 14, 42, 1, light(faixa, 0.2));
  drawTextPx(g, 'GALETO', x + 7, y + 2, '#3a3236');
  drawTextPx(g, "SAT'S", x + 10, y + 13, '#fbf8ef');
  R(g, x + 23, y + 1, 2, 2, '#b8322e');
  R(g, x + 2, y + 25, 44, 1, '#c9bfa8');
}

// ---------------------------------------------------------------------------
// CORREDOR

function pintaCorredor(luz) {
  const W = 560, H = SCENE_H;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const r = rng(18);

  // abertura para a rua (à esquerda)
  R(g, 0, 20, 38, 146, '#3b3438');
  R(g, 0, 150, 38, 16, '#d8d3c8');
  for (let xx = 4; xx < 36; xx += 4) R(g, xx, 60, 1, 92, C.ferro);
  R(g, 2, 60, 34, 2, C.ferro); R(g, 2, 110, 34, 1, C.ferro);

  // parede superior bordô com janelas de madeira
  R(g, 38, 20, 364, 40, '#7c2a2c');
  for (let xx = 70; xx < 400; xx += 96) {
    R(g, xx - 1, 24, 30, 32, C.madeiraEsc);
    veneziana(g, xx, 25, 13, 30, C.madeira);
    veneziana(g, xx + 15, 25, 13, 30, C.madeira);
  }
  // espelho
  R(g, 38, 58, 364, 2, C.madeiraEsc);
  R(g, 40, 60, 360, 32, '#8ea4b0');
  for (let i = 0; i < 6; i++) R(g, 40, 60 + i * 6, 360, 3, mix('#8ea4b0', '#b8c8d0', i % 2 ? 0.3 : 0));
  for (let xx = 50; xx < 400; xx += 44) {
    for (let k = 0; k < 10; k++) R(g, xx + k, 62 + k * 3, 2, 3, '#c8d6dc');
  }
  for (let xx = 60; xx < 400; xx += 30) R(g, xx, 76 + Math.round(r() * 8), 8, 10, 'rgba(90,60,60,0.25)');
  R(g, 38, 92, 364, 2, C.madeiraEsc);
  // azulejos xadrez vinho e creme
  for (let yy = 94; yy < 104; yy += 5) {
    for (let xx = 38; xx < 402; xx += 5) {
      R(g, xx, yy, 5, 5, ((xx - 38) / 5 + (yy - 94) / 5) % 2 ? C.azulejoVinho : C.azulejoCreme);
    }
  }
  // balcão de madeira
  R(g, 36, 104, 366, 3, C.madeiraBrilho);
  R(g, 36, 107, 366, 3, C.madeira);
  R(g, 36, 110, 366, 2, C.madeiraEsc);
  R(g, 38, 112, 362, 40, '#5a3522');
  for (let xx = 38; xx < 400; xx += 30) { R(g, xx, 112, 1, 40, C.madeiraEsc); R(g, xx + 1, 114, 27, 1, '#6b4029'); }
  // baldes vermelhos e copos no balcão
  for (const xx of [92, 236, 356]) {
    R(g, xx, 98, 7, 6, C.vermelho); R(g, xx, 98, 7, 1, C.vermelhoClaro); R(g, xx + 1, 94, 5, 4, C.papel);
  }
  for (const xx of [60, 150, 182, 300, 386]) {
    R(g, xx, 98, 4, 6, '#e8a33a'); R(g, xx, 97, 4, 2, C.espuma); R(g, xx, 98, 1, 6, '#dfe8ea');
  }
  // banquinhos de barril
  for (let xx = 48; xx < 396; xx += 26) {
    R(g, xx, 136, 13, 22, C.inox);
    R(g, xx, 136, 2, 22, C.inoxEsc);
    R(g, xx + 10, 136, 2, 22, C.inoxClaro);
    R(g, xx, 141, 13, 1, C.inoxEsc); R(g, xx, 152, 13, 1, C.inoxEsc);
    R(g, xx - 1, 132, 15, 4, C.vermelho); R(g, xx - 1, 132, 15, 1, C.vermelhoClaro);
  }

  // FIM DO CORREDOR: bar de mármore
  R(g, 402, 20, 90, 92, C.mosaico);
  for (let yy = 20; yy < 112; yy += 4) R(g, 402, yy, 90, 1, C.mosaicoEsc);
  for (let xx = 402; xx < 492; xx += 4) R(g, xx, 20, 1, 92, C.mosaicoEsc);
  // prateleiras de vidro com garrafas
  const coresGarrafa = ['#c98a2a', '#3c8576', '#e8e4dc', '#a83232', '#d8b048', '#6b4a8a', '#9ab86a'];
  for (const sy of [44, 66, 88]) {
    R(g, 404, sy, 86, 2, '#cfe6e2');
    for (let xx = 406; xx < 488; xx += 5) {
      const h = 8 + Math.floor(r() * 5);
      const cor = coresGarrafa[Math.floor(r() * coresGarrafa.length)];
      R(g, xx, sy - h, 3, h, cor); R(g, xx + 1, sy - h - 2, 1, 2, dark(cor, 0.2)); R(g, xx, sy - h + 2, 1, 3, light(cor, 0.35));
    }
  }
  // chopeira
  R(g, 438, 92, 8, 16, C.inox); R(g, 438, 92, 2, 16, C.inoxEsc);
  R(g, 436, 88, 3, 6, C.ferro); R(g, 445, 88, 3, 6, C.ferro);
  // balcão de mármore
  R(g, 400, 108, 92, 4, C.marmore);
  R(g, 400, 112, 92, 40, '#ddd8ce');
  for (let i = 0; i < 9; i++) {
    let x = 404 + Math.floor(r() * 80), y = 114;
    for (let k = 0; k < 14; k++) { R(g, x, y, 1, 2, C.marmoreVeio); x += r() < 0.5 ? 1 : -1; y += 2; }
  }
  R(g, 400, 150, 92, 2, '#b8b0a2');

  // parede final e banheiro
  R(g, 492, 20, 68, 132, '#e6d6b8');
  for (let yy = 116; yy < 152; yy += 6) {
    for (let xx = 492; xx < 560; xx += 6) R(g, xx, yy, 6, 6, ((xx - 492) / 6 + (yy - 116) / 6) % 2 ? C.azulejoVinho : C.azulejoCreme);
  }
  R(g, 498, 58, 40, 94, C.madeiraEsc);

  // teto: toldo visto de baixo, com trilhos
  R(g, 0, 0, W, 20, '#a8282a');
  for (let xx = 0; xx < W; xx += 14) R(g, xx, 0, 2, 20, '#8f2224');
  for (let xx = 20; xx < W; xx += 70) R(g, xx, 0, 3, 20, C.ferroClaro);
  R(g, 0, 18, W, 3, '#5a1214');
  // fios das lâmpadas
  for (const xx of [80, 180, 290]) R(g, xx, 21, 1, 9, C.ferro);
  // lustre de isoladores (fio e braços)
  R(g, 446, 21, 1, 10, C.ferro);
  const arco = [[432, 34], [434, 32], [437, 31], [440, 31], [443, 31], [446, 31], [449, 31], [452, 31], [455, 31], [458, 32], [460, 34]];
  for (const [x, y] of arco) R(g, x, y, 1, 1, C.ferro);
  R(g, 430, 35, 1, 3, C.ferro); R(g, 461, 35, 1, 3, C.ferro);
  for (const [x, y] of [[432, 40], [446, 36], [458, 40]]) {
    R(g, x - 3, y, 7, 4, C.vidroVerde); R(g, x - 2, y + 1, 5, 2, C.vidroVerdeEsc); R(g, x - 3, y, 7, 1, light(C.vidroVerde, 0.3));
  }
  // TV
  R(g, 336, 26, 36, 24, '#141418');

  // chão de ladrilho
  R(g, 0, 152, W, 48, '#d6cfc0');
  R(g, 0, 152, W, 2, '#5a4a40');
  for (let i = 0; i < 1400; i++) {
    const x = Math.floor(r() * W), y = 154 + Math.floor(r() * 46);
    R(g, x, y, 1, 1, ['#bdb4a4', '#e6e0d4', '#a89e8e', '#c9c0b0'][i % 4]);
  }
  const folhaCores = ['#d8a63a', '#b8483a', '#5a86b0', '#7a9a58'];
  for (let i = 0; i < 26; i++) {
    const x = 10 + Math.floor(r() * (W - 20)), y = 160 + Math.floor(r() * 36);
    const cor = folhaCores[i % 4];
    R(g, x, y, 4, 1, cor); R(g, x + 1, y - 1, 2, 1, cor); R(g, x + 1, y + 1, 2, 1, cor);
  }

  sombraGeral(g, W, H, luz);
  return c;
}

function emissivoCorredor(g, luz, t, estado) {
  // lâmpadas de globo
  const on = luz.lampadas > 0.6;
  for (const xx of [80, 180, 290]) {
    R(g, xx - 3, 30, 7, 7, on ? C.globo : '#efe3c4');
    R(g, xx - 2, 29, 5, 1, on ? C.globo : '#efe3c4');
    R(g, xx - 2, 37, 5, 1, on ? C.globo : '#efe3c4');
    R(g, xx - 1, 31, 2, 2, '#ffffff');
  }
  for (const [x, y] of [[439, 44], [452, 44]]) { R(g, x - 2, y, 5, 5, C.globo); R(g, x - 1, y + 1, 1, 1, '#ffffff'); }
  // luz verde sob as prateleiras
  for (const sy of [46, 68, 90]) R(g, 404, sy, 86, 1, 'rgba(160,255,220,0.55)');
  // TV com jogo passando
  R(g, 338, 28, 32, 20, '#3f8a46');
  R(g, 338, 28, 32, 1, '#5aa860');
  R(g, 353, 28, 1, 20, '#cfe8c8');
  R(g, 350, 35, 7, 7, 'rgba(207,232,200,0.6)');
  const tt = t / 1000;
  for (let i = 0; i < 6; i++) {
    const x = 340 + ((i * 11 + tt * (i % 2 ? 7 : -5)) % 28 + 28) % 28;
    const y = 31 + (i * 5) % 15;
    R(g, Math.floor(x), y, 1, 2, i % 2 ? '#c4161c' : '#f2f0ea');
  }
  const bx = 340 + Math.floor((Math.sin(tt * 1.3) * 0.5 + 0.5) * 27);
  R(g, bx, 39 + Math.round(Math.sin(tt * 2.1) * 4), 1, 1, '#ffffff');
}

function portaBanheiro(g, aberta) {
  if (aberta) {
    R(g, 500, 60, 36, 92, '#2a2224');
    R(g, 500, 60, 36, 4, '#3a3034');
    R(g, 528, 60, 8, 92, C.madeira);
    R(g, 529, 64, 6, 40, '#6b4029');
  } else {
    R(g, 500, 60, 36, 92, C.madeira);
    R(g, 504, 66, 28, 36, '#6b4029'); R(g, 504, 108, 28, 38, '#6b4029');
    R(g, 504, 66, 28, 1, C.madeiraClara); R(g, 504, 108, 28, 1, C.madeiraClara);
    R(g, 529, 104, 3, 3, '#d8b048');
  }
  R(g, 509, 70, 18, 11, '#2a1a1f');
  drawTextPx(g, 'WC', 512, 69, '#efe2c4');
}

// ---------------------------------------------------------------------------

export function criarCenarios() {
  const cache = new Map();
  const fundo = (id, varia) => {
    const k = id + varia;
    if (!cache.has(k)) cache.set(k, id === 'calcada' ? pintaCalcada(LUZES[varia]) : pintaCorredor(LUZES[varia]));
    return cache.get(k);
  };
  return {
    calcada: {
      id: 'calcada', w: 400,
      andar: { x0: 8, x1: 392, y0: 172, y1: 194 },
      fundo: (v) => fundo('calcada', v),
      emissivo: (g, v, t) => emissivoCalcada(g, LUZES[v], t),
      brilhos: (v) => {
        const on = LUZES[v].lampadas;
        const out = [{ x: 260, y: 94, r: 18, cor: '#ffcf7a', a: on * 0.6 }];
        if (on > 0.6) {
          out.push({ x: 290, y: 76, r: 30, cor: LUZES[v].letreiro ? '#9a7ad8' : '#ffd8a0', a: 0.6 });
          out.push({ x: 92, y: 128, r: 22, cor: '#ffcf7a', a: 0.55 }, { x: 178, y: 128, r: 22, cor: '#ffcf7a', a: 0.55 });
          out.push({ x: 330, y: 122, r: 40, cor: '#ffb86a', a: 0.3 });
        }
        return out;
      },
    },
    corredor: {
      id: 'corredor', w: 560,
      andar: { x0: 10, x1: 548, y0: 164, y1: 196 },
      fundo: (v) => fundo('corredor', v),
      emissivo: (g, v, t, est) => { emissivoCorredor(g, LUZES[v], t, est); portaBanheiro(g, est && est.banheiroAberto); },
      brilhos: (v) => {
        const a = LUZES[v].lampadas * 0.7;
        return [
          { x: 80, y: 34, r: 34, cor: '#ffcf7a', a }, { x: 180, y: 34, r: 34, cor: '#ffcf7a', a }, { x: 290, y: 34, r: 34, cor: '#ffcf7a', a },
          { x: 446, y: 46, r: 34, cor: '#ffcf7a', a }, { x: 354, y: 38, r: 18, cor: '#8ad08a', a: 0.6 },
          { x: 446, y: 70, r: 30, cor: '#9af0d8', a: 0.35 },
        ];
      },
    },
  };
}
