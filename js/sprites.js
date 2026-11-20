// Personagens modulares em pixel art, gerados em código.
// Cada pessoa é montada a partir de partes (pele, cabelo, roupa, acessórios, mobilidade).

import { Grid, PELES, CABELOS, dark, light, mix, flipCanvas } from './paleta.js';

export const FW = 30, FH = 58;
export const CX = 15, GY = 55; // centro horizontal e última linha do sapato
const CONTORNO = '#2a1a1f';

const DIM = {
  baixo: { leg: 8, torso: 10 },
  medio: { leg: 10, torso: 11 },
  alto: { leg: 12, torso: 12 },
};
const LARG = { magro: 8, medio: 10, largo: 12 };

// Linhas da cabeça arredondada (12x12): [início, fim] de cada linha.
const CABECA = [[2, 9], [1, 10], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [0, 11], [1, 10], [2, 9]];

function norm(l) {
  const corCabelo = CABELOS[l.corCabelo] || l.corCabelo || CABELOS.preto;
  return {
    pele: typeof l.pele === 'number' ? PELES[l.pele] : (l.pele || PELES[1]),
    cabelo: l.cabelo || 'curto',
    corCabelo,
    barba: l.barba || null,
    corBarba: l.corBarba ? (CABELOS[l.corBarba] || l.corBarba) : corCabelo,
    oculos: l.oculos || null,
    corOculos: l.corOculos || '#2a1a1f',
    chapeu: l.chapeu || null,
    corChapeu: l.corChapeu || '#c8322e',
    blusa: l.blusa || 'camiseta',
    corBlusa: l.corBlusa || '#e8e2d4',
    corBlusa2: l.corBlusa2 || '#ffffff',
    baixo: l.baixo || 'calca',
    corBaixo: l.corBaixo || '#3d4a6b',
    sapato: l.sapato || 'tenis',
    corSapato: l.corSapato || '#f1efe8',
    meia: l.meia || null,
    corpo: l.corpo || 'medio',
    altura: l.altura || 'medio',
    mobilidade: l.mobilidade || null,
    aparelho: !!l.aparelho,
    brinco: l.brinco || null,
    avental: l.avental || null,
    rubor: !!l.rubor,
    barriga: !!l.barriga,
  };
}

// Cor da blusa em um pixel (para estampas de time, listras e florais).
function corBlusaEm(L, x, y, top) {
  const r = y - top;
  switch (L.blusa) {
    case 'fla': return (Math.floor(r / 2) % 2 === 0) ? '#c4161c' : '#1d1c22';
    case 'bota': return (Math.floor((x + 1) / 2) % 2 === 0) ? '#1d1c22' : '#f2f0ea';
    case 'flu': return ['#7d1d2c', '#7d1d2c', '#f2f0ea', '#1e6b3c', '#1e6b3c', '#f2f0ea'][((x % 6) + 6) % 6];
    case 'vasco': {
      // camisa preta com a faixa branca na diagonal
      const d = (x - (CX - 6)) - r;
      return d >= 1 && d <= 3 ? '#f2f0ea' : '#1d1c22';
    }
    case 'listrada': return (Math.floor(r / 2) % 2 === 0) ? L.corBlusa : L.corBlusa2;
    case 'florida': {
      const h = (x * 7 + y * 13) % 11;
      if (h === 0) return L.corBlusa2;
      if (h === 5) return '#f8f0dc';
      return L.corBlusa;
    }
    default: return L.corBlusa;
  }
}

function mangas(L) {
  if (L.blusa === 'regata') return 0;
  if (L.blusa === 'botao') return 4;
  if (L.blusa === 'vestido') return 2;
  return 3;
}

function paint(L, pose) {
  const g = new Grid(FW, FH);
  const d = DIM[L.altura] || DIM.medio;
  const tw = LARG[L.corpo] || 10;
  const legW = L.corpo === 'largo' ? 4 : 3;
  const skin = L.pele, skinD = dark(skin, 0.16), skinDD = dark(skin, 0.35);
  const sentado = L.mobilidade === 'cadeira';
  const agachado = !!pose.agachado && !sentado;
  const bob = pose.bob || 0;
  const torsoH = d.torso;
  const hc = L.corCabelo, hcD = dark(hc, 0.25), hcL = light(hc, 0.22);
  const temSaia = L.baixo === 'saia' || L.blusa === 'vestido';
  const pernaDeFora = L.baixo === 'short' || temSaia;

  let hipY;
  if (sentado) hipY = GY - 11;
  else if (agachado) hipY = GY - 6;
  else hipY = GY - 1 - d.leg;
  const torsoTop = hipY - torsoH + bob;
  const torsoBot = hipY - 1 + bob;
  const headTop = torsoTop - 12 + (pose.headDy || 0);
  const hx = CX - 6;
  const tx = CX - Math.floor(tw / 2);
  const armLen = torsoH - 1;
  const meta = { hand: { x: tx + tw, y: torsoTop + armLen - 1 }, headTop, hx };

  // ---------- mobilidade (partes de trás) ----------
  if (sentado) {
    const ferro = '#3a3842';
    g.rect(tx - 2, torsoTop + 2, 2, hipY + 3 - (torsoTop + 2), ferro); // encosto
    g.rect(tx - 4, torsoTop + 2, 2, 1, ferro); // pegador
  }
  const passo = pose.passo || 0; // -1, 0, 1
  if (L.mobilidade === 'muletas') {
    g.line(tx - 2, torsoTop + 2, tx - 4 - passo, GY, '#a7b0b5');
    g.rect(tx - 3, torsoTop + 1, 2, 1, '#3a3842');
  }

  // ---------- cabelo de trás ----------
  const back = (x, y, w, h, c = hc) => g.rect(hx + x, headTop + y, w, h, c);
  switch (L.cabelo) {
    case 'longo': back(-1, 3, 5, 13); back(0, 16, 3, 2); break;
    case 'ondulado':
      back(-1, 3, 5, 14); back(0, 17, 4, 2);
      for (let y = 4; y < 18; y += 3) g.px(hx - 1, headTop + y, hcD), g.px(hx + 2, headTop + y + 1, hcL);
      break;
    case 'cacheado':
      back(-2, 2, 7, 13);
      for (let y = 2; y < 15; y += 2) g.px(hx - 3, headTop + y, hc), g.px(hx - 1, headTop + y + 1, hcD);
      break;
    case 'black': g.circle(hx + 5, headTop + 3, 8, hc); g.px(hx + 1, headTop - 2, hcL); g.px(hx + 4, headTop - 4, hcL); break;
    case 'rabo': back(-3, 3, 3, 8); back(-2, 11, 2, 2); break;
    case 'trancas':
      for (let y = 3; y < 19; y++) {
        const c = y % 2 ? hc : hcD;
        g.px(hx - 1, headTop + y, c); g.px(hx, headTop + y, c); g.px(hx + 2, headTop + y, c); g.px(hx + 3, headTop + y, c);
      }
      g.px(hx - 1, headTop + 19, '#f2c14e'); g.px(hx + 3, headTop + 19, '#f2c14e');
      break;
    case 'chanel': back(-1, 3, 6, 8); break;
  }

  // ---------- braços (de trás) ----------
  const sl = mangas(L);
  const swing = pose.swing || 0;
  const corManga = (y) => corBlusaEm(L, tx, y, torsoTop);
  function braco(x, frente) {
    const sw = frente ? swing : -swing;
    for (let i = 0; i < armLen; i++) {
      const y = torsoTop + 1 + i;
      const dx = i >= 4 ? sw : 0;
      let c = i < sl ? corManga(y) : skin;
      if (!frente) c = dark(c, 0.12);
      g.px(x + dx, y, c);
      g.px(x + 1 + dx, y, frente ? c : dark(c, 0.08));
    }
    if (frente) meta.hand = { x: x + 1 + sw, y: torsoTop + armLen };
  }
  if (pose.bracos === 'alto') {
    for (let i = 0; i < 9; i++) {
      const y = torsoTop + 2 - i;
      const c = i < 2 ? corManga(torsoTop) : skin;
      g.px(tx - 2, y, dark(c, 0.12)); g.px(tx - 1, y, dark(c, 0.12));
    }
  } else if (!sentado || true) {
    braco(tx - 1, false);
  }

  // ---------- pernas ----------
  function perna(x, frente) {
    if (sentado || agachado) return;
    const len = d.leg;
    const mid = Math.floor(len / 2);
    let dx = 0, lift = 0;
    if (pose.pernas === 'A') { dx = frente ? 1 : -1; lift = frente ? 0 : 1; }
    if (pose.pernas === 'B') { dx = frente ? -1 : 1; lift = frente ? 1 : 0; }
    const shortLen = Math.ceil(len * 0.45);
    const protese = frente && L.mobilidade === 'protese' && pernaDeFora;
    for (let i = 0; i < len - lift; i++) {
      const y = hipY + i;
      const ox = i >= mid ? dx : 0;
      let c;
      if (L.baixo === 'calca' || L.baixo === 'pantalona') c = L.corBaixo;
      else if (L.baixo === 'short' && i < shortLen) c = L.corBaixo;
      else if (L.meia && i >= len - 3 - lift) c = L.meia;
      else c = skin;
      if (!frente) c = dark(c, 0.14);
      if (protese && i >= mid) {
        if (i === mid) g.rect(x + ox, y, legW, 1, '#55545c');
        else g.px(x + ox + 1, y, '#a7b0b5');
        continue;
      }
      g.rect(x + ox, y, legW, 1, c);
      if (L.baixo === 'short' && i < shortLen) g.px(frente ? x + legW : x - 1, y, c);
      if (L.baixo === 'pantalona' && i >= mid) g.px(frente ? x + ox + legW : x + ox - 1, y, c);
    }
    // sapato
    const sy = GY - 1 - lift;
    const sx = x + dx;
    const sc = L.corSapato;
    if (L.sapato === 'chinelo') {
      g.rect(sx, sy, legW + 1, 1, frente ? skin : skinD);
      g.px(sx + 1, sy, L.corSapato);
      g.rect(sx, sy + 1, legW + 1, 1, dark(sc, 0.1));
    } else {
      g.rect(sx, sy, legW + 1, 1, frente ? sc : dark(sc, 0.12));
      g.rect(sx, sy + 1, legW + 1, 1, L.sapato === 'tenis' ? '#cfcac0' : dark(sc, 0.3));
    }
    if (L.baixo === 'pantalona') g.rect(sx - (frente ? 0 : 1), sy, legW + 1, 1, frente ? L.corBaixo : dark(L.corBaixo, 0.14));
  }
  const backLegX = tx + 1;
  const frontLegX = tx + tw - 1 - legW;
  perna(backLegX, false);
  perna(frontLegX, true);

  // pernas sentadas / agachadas
  if (sentado || agachado) {
    const coxa = (temSaia || L.baixo === 'calca' || L.baixo === 'pantalona' || L.baixo === 'short') ? (temSaia && L.blusa === 'vestido' ? L.corBlusa : L.corBaixo) : skin;
    const canela = (L.baixo === 'calca' || L.baixo === 'pantalona') ? L.corBaixo : (L.meia || skin);
    if (sentado) {
      const kx = tx + tw + 3;
      g.rect(tx + 1, hipY, kx - tx, 3, coxa);
      for (let y = hipY + 3; y < GY - 2; y++) g.rect(kx - 2, y, 3, 1, canela);
      g.rect(kx - 2, GY - 3, 5, 1, L.corSapato);
      g.rect(kx - 2, GY - 2, 5, 1, '#cfcac0');
      g.rect(tx - 1, hipY + 3, tw + 3, 1, '#3a3842'); // assento
      g.line(tx + tw, hipY + 4, kx - 1, GY - 1, '#3a3842');
      g.rect(kx - 3, GY - 1, 6, 1, '#55545c'); // apoio de pé
    } else {
      // agachada: joelho da frente para cima, perna de trás ajoelhada
      const kx = tx + tw + 2;
      g.rect(tx + 1, hipY, kx - tx, 3, coxa);
      for (let y = hipY + 3; y < GY - 1; y++) g.rect(kx - 2, y, 3, 1, canela);
      g.rect(kx - 2, GY - 1, 4, 1, L.corSapato); g.rect(kx - 2, GY, 4, 1, '#cfcac0');
      g.rect(tx - 4, GY - 2, 6, 2, dark(canela, 0.14));
      g.rect(tx - 6, GY - 1, 3, 2, dark(L.corSapato, 0.12));
    }
  }

  // ---------- tronco ----------
  for (let y = torsoTop; y <= torsoBot; y++) {
    for (let x = tx; x < tx + tw; x++) {
      let c = corBlusaEm(L, x, y, torsoTop);
      if (x === tx) c = dark(c, 0.16);
      g.px(x, y, c);
    }
  }
  if (L.blusa === 'regata') { g.px(tx, torsoTop, skin); g.px(tx + tw - 1, torsoTop, skin); g.rect(tx + 2, torsoTop, tw - 4, 1, skin); }
  else if (L.blusa !== 'botao') g.rect(CX - 1, torsoTop, 3, 1, skin);
  if (L.blusa === 'botao') {
    const cl = light(L.corBlusa, 0.45);
    g.px(CX - 1, torsoTop, cl); g.px(CX + 2, torsoTop, cl); g.px(CX, torsoTop, skin); g.px(CX + 1, torsoTop, skin);
    g.px(CX - 2, torsoTop + 1, cl); g.px(CX + 3, torsoTop + 1, cl);
    for (let y = torsoTop + 2; y < torsoBot - 1; y += 2) g.px(CX + 1, y, dark(L.corBlusa, 0.3));
    g.rect(CX - 3, torsoTop + 3, 2, 2, dark(L.corBlusa, 0.12));
  }
  if (L.blusa === 'bota') { g.px(CX - 2, torsoTop + 2, '#f2f0ea'); }
  if (L.barriga) {
    for (let y = torsoTop + 4; y < torsoBot - 1; y++) g.px(tx + tw, y, corBlusaEm(L, tx + tw, y, torsoTop));
    for (let y = torsoTop + 5; y < torsoBot - 2; y++) g.px(tx + tw + 1, y, corBlusaEm(L, tx + tw + 1, y, torsoTop));
  }
  // cintura e saia
  if (!temSaia && (L.baixo === 'calca' || L.baixo === 'short' || L.baixo === 'pantalona')) {
    g.rect(tx, torsoBot - 1, tw, 2, L.corBaixo);
    g.px(tx, torsoBot - 1, dark(L.corBaixo, 0.16)); g.px(tx, torsoBot, dark(L.corBaixo, 0.16));
    if (!sentado && !agachado) g.rect(backLegX + legW, hipY, frontLegX - backLegX - legW, 2, dark(L.corBaixo, 0.1));
  }
  if (temSaia && !sentado && !agachado) {
    const sc = L.blusa === 'vestido' ? L.corBlusa : L.corBaixo;
    const len = Math.ceil(d.leg * 0.5);
    if (L.blusa !== 'vestido') g.rect(tx, torsoBot - 1, tw, 2, sc);
    for (let i = 0; i < len; i++) {
      const ext = i >= 2 ? 1 : 0;
      g.rect(tx - ext, hipY + i, tw + ext * 2, 1, i === len - 1 ? dark(sc, 0.15) : sc);
    }
  }
  if (L.avental) {
    g.rect(tx + 1, torsoTop + 4, tw - 2, torsoBot - torsoTop - 3, L.avental);
    if (!sentado && !agachado) g.rect(tx + 1, hipY, tw - 2, Math.ceil(d.leg * 0.6), L.avental);
    g.rect(tx, torsoTop + 4, tw, 1, dark(L.avental, 0.2));
  }

  // ---------- braço da frente ----------
  const fx = tx + tw - 1;
  if (pose.bracos === 'alto') {
    for (let i = 0; i < 9; i++) {
      const y = torsoTop + 2 - i;
      const c = i < 2 ? corManga(torsoTop) : skin;
      g.px(fx + 1, y, c); g.px(fx + 2, y, c);
    }
    meta.hand = { x: fx + 2, y: torsoTop - 6 };
  } else if (pose.bracos === 'peito') {
    for (let i = 0; i < 4; i++) { const c = i < sl ? corManga(torsoTop + 1 + i) : skin; g.px(fx, torsoTop + 1 + i, dark(c, 0.06)); g.px(fx + 1, torsoTop + 1 + i, c); }
    g.rect(fx + 1, torsoTop + 5, 4, 2, skin);
    g.px(fx + 1, torsoTop + 5, sl > 4 ? corManga(torsoTop) : skin);
    meta.hand = { x: fx + 4, y: torsoTop + 5 };
  } else {
    braco(fx, true);
    if (L.barriga) {
      // a barriga aparece na frente do braço
      for (let y = torsoTop + 5; y < torsoBot - 2; y++) g.px(fx + 2, y, corBlusaEm(L, fx + 2, y, torsoTop));
    }
  }

  // ---------- cabeça ----------
  for (let r = 0; r < 12; r++) {
    const [a, b] = CABECA[r];
    for (let x = a; x <= b; x++) g.px(hx + x, headTop + r, x <= 1 && r > 1 && r < 10 ? skinD : skin);
  }
  g.px(hx + 12, headTop + 6, skin); // nariz
  g.px(hx + 2, headTop + 5, skinD); g.px(hx + 3, headTop + 5, skinD); g.px(hx + 2, headTop + 6, skinD); g.px(hx + 3, headTop + 6, skinDD);
  if (L.rubor) { g.px(hx + 10, headTop + 7, mix(skin, '#e0607a', 0.35)); g.px(hx + 5, headTop + 7, mix(skin, '#e0607a', 0.3)); }

  // barba
  const bc = L.barba === 'cheia' ? L.corBarba : mix(L.corBarba, skin, 0.42);
  if (L.barba === 'curta') {
    g.rect(hx + 3, headTop + 7, 1, 3, bc);
    g.px(hx + 4, headTop + 9, bc); g.px(hx + 10, headTop + 9, bc); g.px(hx + 11, headTop + 9, bc);
    g.rect(hx + 2, headTop + 10, 9, 1, bc);
    g.rect(hx + 3, headTop + 11, 7, 1, bc);
    g.rect(hx + 7, headTop + 8, 4, 1, mix(bc, skin, 0.2));
    g.px(hx + 6, headTop + 11, dark(bc, 0.1));
  } else if (L.barba === 'cheia') {
    g.rect(hx + 3, headTop + 6, 2, 3, bc);
    g.rect(hx + 2, headTop + 9, 10, 3, bc);
    g.rect(hx + 4, headTop + 12, 6, 1, bc);
    g.rect(hx + 6, headTop + 8, 6, 1, bc);
    g.px(hx + 3, headTop + 10, dark(bc, 0.1)); g.px(hx + 5, headTop + 11, dark(bc, 0.1));
  } else if (L.barba === 'bigode') {
    g.rect(hx + 7, headTop + 8, 4, 1, bc);
  }

  // olhos e boca
  const olho = '#2a1a1f';
  if (pose.olhos === 'fechados') {
    g.px(hx + 6, headTop + 6, skinDD); g.px(hx + 9, headTop + 6, skinDD);
  } else {
    g.rect(hx + 6, headTop + 5, 1, 2, olho); g.rect(hx + 9, headTop + 5, 1, 2, olho);
  }
  if (pose.boca === 'aberta') g.rect(hx + 8, headTop + 9, 2, 2, '#5a1e24');
  else g.rect(hx + 8, headTop + 9, 2, 1, dark(skin, 0.4));

  // ---------- cabelo da frente ----------
  const top = (x, y, w, h, c = hc) => g.rect(hx + x, headTop + y, w, h, c);
  const calota = (c) => { top(2, 0, 8, 1, c); top(1, 1, 10, 1, c); top(0, 2, 11, 1, c); };
  switch (L.cabelo) {
    case 'raspado': {
      const b = mix(hc, skin, 0.3);
      calota(b); top(0, 3, 4, 2, b); top(0, 5, 2, 2, b);
      g.px(hx + 5, headTop, mix(b, '#ffffff', 0.15)); g.px(hx + 6, headTop + 1, mix(b, '#ffffff', 0.12));
      break;
    }
    case 'curto': case 'coque': case 'rabo':
      top(2, -1, 8, 1); calota(hc); top(0, 3, 5, 1); top(7, 3, 4, 1); top(0, 4, 2, 3);
      g.px(hx + 5, headTop, hcL); g.px(hx + 6, headTop, hcL);
      if (L.cabelo === 'coque') g.circle(hx + 3, headTop - 2, 2, hc);
      break;
    case 'longo': case 'ondulado': case 'trancas': case 'chanel':
      top(2, -1, 8, 1); calota(hc); top(0, 3, 5, 1); top(6, 3, 6, 1); top(0, 4, 3, 5); top(9, 4, 3, 1);
      g.px(hx + 4, headTop, hcL); g.px(hx + 5, headTop - 1, hcL);
      break;
    case 'cacheado':
      for (let x = 1; x < 11; x += 2) g.px(hx + x, headTop - 2, hc);
      top(1, -1, 10, 1); calota(hc); top(0, 3, 4, 1); top(6, 3, 5, 1); top(0, 4, 3, 5);
      for (let x = 2; x < 10; x += 3) g.px(hx + x, headTop + 1, hcL);
      break;
    case 'black':
      top(0, 1, 12, 2); top(0, 3, 3, 3); g.px(hx + 5, headTop + 1, hcL);
      break;
    case 'calvo':
      top(0, 4, 2, 4); top(2, 3, 1, 2);
      break;
    case 'careca':
      g.px(hx + 5, headTop + 1, light(skin, 0.35)); g.px(hx + 6, headTop + 1, light(skin, 0.35));
      break;
  }

  // óculos
  if (L.oculos) {
    // lentes claras com armação: os olhos continuam visíveis
    const oc = L.corOculos;
    const lente = mix(skin, '#dff0f5', 0.55);
    for (const ex of [6, 9]) {
      g.px(hx + ex - 1, headTop + 5, lente); g.px(hx + ex - 1, headTop + 6, lente);
      g.px(hx + ex + 1, headTop + 5, lente); g.px(hx + ex + 1, headTop + 6, lente);
      g.rect(hx + ex - 1, headTop + 4, 3, 1, oc);
      if (L.oculos === 'redondo') g.px(hx + ex, headTop + 7, oc);
      else g.rect(hx + ex - 1, headTop + 7, 3, 1, oc);
    }
    g.px(hx + 4, headTop + 4, oc); g.px(hx + 3, headTop + 5, oc);
  }
  if (L.aparelho) { g.px(hx + 1, headTop + 5, '#6fb0dc'); g.px(hx + 1, headTop + 6, '#6fb0dc'); g.px(hx + 2, headTop + 4, '#6fb0dc'); }
  if (L.brinco) { g.px(hx + 3, headTop + 7, L.brinco); }

  // chapéus
  if (L.chapeu === 'festa') {
    const azul = '#4aa0d8', faixa = '#ffd23f';
    const cx0 = hx + 6;
    for (let i = 0; i < 9; i++) {
      const w = 7 - Math.round(i * 6 / 8);
      const lean = -Math.floor(i / 3);
      const x0 = cx0 - Math.floor(w / 2) + lean;
      const c = i % 3 === 1 ? faixa : azul;
      g.rect(x0, headTop - 1 - i, w, 1, c);
      if (w > 2) g.px(x0, headTop - 1 - i, dark(c, 0.15));
    }
    g.rect(cx0 - 3, headTop - 12, 2, 2, '#ff6b9a');
  } else if (L.chapeu === 'panama') {
    const palha = '#f1ead6', palhaS = '#d8ccae';
    g.rect(hx + 3, headTop - 3, 7, 1, palha);
    g.rect(hx + 1, headTop - 2, 10, 3, palha);
    g.rect(hx + 1, headTop - 2, 1, 3, palhaS);
    g.rect(hx + 1, headTop + 1, 10, 1, '#2d4f9e');
    g.rect(hx - 1, headTop + 2, 15, 1, palha);
    g.rect(hx - 1, headTop + 2, 3, 1, palhaS);
  } else if (L.chapeu === 'bone') {
    g.rect(hx + 1, headTop - 1, 9, 1, L.corChapeu);
    g.rect(hx, headTop, 11, 3, L.corChapeu);
    g.rect(hx, headTop, 1, 3, dark(L.corChapeu, 0.2));
    g.rect(hx + 9, headTop + 3, 5, 1, dark(L.corChapeu, 0.25));
  }

  // ---------- mobilidade (partes da frente) ----------
  if (sentado) {
    const wx = CX - 2, wy = GY - 7;
    g.ring(wx, wy, 7, '#2f2e36');
    g.ring(wx, wy, 6, '#8a9296');
    const a = (pose.roda || 0) * Math.PI / 8;
    for (const k of [0, Math.PI / 2]) {
      const ca = Math.cos(a + k) * 5, sa = Math.sin(a + k) * 5;
      g.line(wx - ca, wy - sa, wx + ca, wy + sa, '#b9c0c4');
    }
    g.px(wx, wy, '#e3e8ea');
    g.circle(tx + tw + 4, GY - 1, 1, '#2f2e36');
  }
  if (L.mobilidade === 'muletas') {
    g.line(tx + tw + 1, torsoTop + 2, tx + tw + 3 + passo, GY, '#a7b0b5');
    g.rect(tx + tw, torsoTop + 1, 2, 1, '#3a3842');
    g.rect(tx + tw + 1, torsoTop + armLen - 1, 2, 1, '#3a3842');
  }
  if (L.mobilidade === 'bengala') {
    const h = meta.hand;
    g.line(h.x + 1, h.y, h.x + 2, GY, '#6b3f24');
    g.px(h.x, h.y - 1, '#6b3f24'); g.px(h.x + 1, h.y - 1, '#6b3f24');
  }

  g.outline(CONTORNO);
  meta.head = { x: hx - 2, y: headTop - 3, w: 16, h: 17 };
  return { cv: g.toCanvas(), meta };
}

const POSES = {
  idle0: {},
  idle1: { headDy: 1 },
  blink: { olhos: 'fechados' },
  talk: { boca: 'aberta' },
  walk0: { pernas: 'A', swing: -1, passo: 1, roda: 0 },
  walk1: { bob: -1, roda: 1 },
  walk2: { pernas: 'B', swing: 1, passo: -1, roda: 2 },
  walk3: { bob: -1, roda: 3 },
  peito: { bracos: 'peito' },
  peitoTalk: { bracos: 'peito', boca: 'aberta' },
  alto: { bracos: 'alto', boca: 'aberta' },
  alto2: { bracos: 'alto', bob: -1 },
  agachada: { agachado: true },
  agachadaTalk: { agachado: true, boca: 'aberta' },
};

export function buildCharacter(look) {
  const L = norm(look);
  const frames = {};
  for (const [nome, pose] of Object.entries(POSES)) {
    const { cv, meta } = paint(L, pose);
    frames[nome] = { cv, flip: null, meta };
  }
  return { look: L, frames };
}

export function frameCanvas(ch, nome, esquerda) {
  const f = ch.frames[nome] || ch.frames.idle0;
  if (!esquerda) return f.cv;
  if (!f.flip) f.flip = flipCanvas(f.cv);
  return f.flip;
}

// ---------------------------------------------------------------------------
// Caramelo, o vira-lata da calçada

const DOG_W = 28, DOG_H = 20, DOG_GY = 18;
export const DOG = { w: DOG_W, h: DOG_H, cx: 13, gy: DOG_GY };

function paintDog(pose) {
  const g = new Grid(DOG_W, DOG_H);
  const base = '#d6953f', sombra = '#b0732a', claro = '#f0c27d', focinho = '#6b4426';
  const y0 = DOG_GY;
  const tailUp = pose.rabo === 1;
  if (pose.sentado) {
    // rabo no chão
    g.rect(2, y0 - 2, 5, 1, sombra);
    g.px(tailUp ? 1 : 2, y0 - (tailUp ? 3 : 2), sombra);
    g.rect(6, y0 - 7, 8, 6, base);
    g.rect(5, y0 - 5, 2, 4, sombra);
    g.rect(11, y0 - 12, 6, 8, base);
    g.rect(13, y0 - 9, 3, 5, claro);
    g.rect(15, y0 - 7, 2, 7, base); g.px(15, y0 - 1, claro); g.px(16, y0 - 1, claro);
    if (pose.pata) { g.rect(17, y0 - 9, 2, 2, base); g.px(18, y0 - 9, claro); }
    else { g.rect(17, y0 - 7, 2, 7, sombra); g.px(17, y0 - 1, claro); g.px(18, y0 - 1, claro); }
    g.rect(7, y0 - 2, 5, 2, sombra); g.px(11, y0 - 1, claro);
    // cabeça
    const hy = y0 - 18;
    g.rect(14, hy + 1, 7, 6, base);
    g.rect(20, hy + 3, 3, 3, claro);
    g.px(23, hy + 3, '#2a1a1f'); g.px(22, hy + 3, focinho);
    g.px(21, hy + 5, sombra);
    g.px(18, hy + 2, '#2a1a1f');
    if (pose.orelha) { g.rect(15, hy - 1, 2, 2, sombra); g.px(15, hy - 2, sombra); }
    else { g.rect(14, hy + 1, 2, 4, sombra); }
    if (pose.lingua) g.px(21, hy + 6, '#e06070');
  } else {
    const off = pose.pernas || 0;
    // rabo
    if (tailUp) { g.px(5, y0 - 10, base); g.px(4, y0 - 11, base); g.px(3, y0 - 12, base); g.px(3, y0 - 13, sombra); g.px(4, y0 - 10, base); }
    else { g.px(5, y0 - 10, base); g.px(4, y0 - 10, base); g.px(3, y0 - 11, base); g.px(2, y0 - 11, sombra); g.px(4, y0 - 9, base); }
    // patas de trás e da frente (pares alternados no passo)
    const pata = (x, dx, c) => { g.rect(x + dx, y0 - 5, 2, 4, c); g.rect(x + dx, y0 - 1, 2, 1, claro); };
    pata(6, off, sombra); pata(15, -off, sombra);
    pata(8, -off, base); pata(17, off, base);
    // corpo
    g.rect(6, y0 - 11, 13, 1, base);
    g.rect(5, y0 - 10, 15, 4, base);
    g.rect(6, y0 - 6, 13, 1, base);
    g.rect(8, y0 - 7, 9, 2, claro);
    g.rect(5, y0 - 10, 1, 4, sombra);
    g.px(9, y0 - 10, light(base, 0.15)); g.px(12, y0 - 11, light(base, 0.15));
    // pescoço e cabeça
    g.rect(17, y0 - 13, 4, 5, base);
    const hy = y0 - 17 + (pose.cabeca || 0);
    g.rect(18, hy, 6, 6, base);
    g.rect(23, hy + 2, 3, 3, claro);
    g.px(26, hy + 2, '#2a1a1f'); g.px(25, hy + 2, focinho);
    g.px(24, hy + 4, sombra);
    g.px(21, hy + 1, '#2a1a1f');
    if (pose.orelha) { g.rect(18, hy - 2, 2, 2, sombra); g.px(19, hy - 3, sombra); }
    else { g.rect(18, hy, 2, 4, sombra); }
    if (pose.lingua) g.px(24, hy + 5, '#e06070');
  }
  g.outline(CONTORNO);
  return g.toCanvas();
}

const DOG_POSES = {
  idle0: { rabo: 0 }, idle1: { rabo: 1 },
  walk0: { pernas: 1, rabo: 0, cabeca: 0 }, walk1: { pernas: 0, rabo: 1, cabeca: -1 },
  walk2: { pernas: -1, rabo: 0, cabeca: 0 }, walk3: { pernas: 0, rabo: 1, cabeca: -1 },
  senta0: { sentado: true, rabo: 0, orelha: 1, lingua: 1 }, senta1: { sentado: true, rabo: 1, orelha: 1, lingua: 1 },
  pede0: { sentado: true, pata: 1, rabo: 0, orelha: 1 }, pede1: { sentado: true, pata: 1, rabo: 1, orelha: 1, lingua: 1 },
  feliz0: { rabo: 0, orelha: 1, lingua: 1, cabeca: -1 }, feliz1: { rabo: 1, orelha: 1, lingua: 1, cabeca: 0 },
};

export function buildDog() {
  const frames = {};
  for (const [n, p] of Object.entries(DOG_POSES)) frames[n] = { cv: paintDog(p), flip: null };
  return { dog: true, frames };
}

// ---------------------------------------------------------------------------
// Itens pequenos

function item(w, h, fn) {
  const g = new Grid(w + 2, h + 2);
  fn(g);
  g.outline(CONTORNO);
  const cv = g.toCanvas();
  return { cv, flip: flipCanvas(cv), w: w + 2, h: h + 2 };
}

function copo(nivel) {
  return item(5, 7, (g) => {
    const vidro = '#dfe8ea';
    g.rect(1, 1, 1, 7, vidro); g.rect(5, 1, 1, 7, vidro); g.rect(1, 7, 5, 1, vidro);
    g.rect(2, 1, 3, 6, '#eef4f5');
    if (nivel === 'cheio') { g.rect(2, 3, 3, 4, '#e8a33a'); g.rect(1, 1, 5, 2, '#fbf6ea'); g.px(3, 4, '#f4c66a'); }
    if (nivel === 'metade') { g.rect(2, 5, 3, 2, '#e8a33a'); g.rect(2, 4, 3, 1, '#fbf6ea'); }
    if (nivel === 'vazio') { g.px(3, 6, '#f2d9a6'); }
  });
}

export const ITENS = {};
export function buildItems() {
  ITENS.copoCheio = copo('cheio');
  ITENS.copoMetade = copo('metade');
  ITENS.copoVazio = copo('vazio');
  ITENS.dose = item(3, 4, (g) => { g.rect(1, 1, 3, 4, '#eef4f5'); g.rect(1, 3, 3, 2, '#f3e3a8'); });
  ITENS.celular = item(3, 5, (g) => { g.rect(1, 1, 3, 5, '#24242c'); g.rect(1, 2, 3, 3, '#7fd3ff'); });
  const prato = (vela, chama) => item(11, 10, (g) => {
    g.rect(1, 9, 11, 1, '#e8e4dc'); g.rect(2, 10, 9, 1, '#c4bcb0');
    for (let i = 0; i < 4; i++) {
      g.rect(2 + i * 2 + (i > 1 ? 1 : 0), 6, 2, 3, '#f2c14e');
      g.px(2 + i * 2 + (i > 1 ? 1 : 0), 8, '#c98f2a');
    }
    g.rect(3, 5, 2, 1, '#f2c14e'); g.rect(7, 5, 3, 1, '#f2c14e'); g.px(8, 5, '#c98f2a');
    if (vela) {
      g.rect(6, 2, 1, 4, '#f6f2e8');
      g.px(5, 4, '#ffffff'); g.px(7, 4, '#ffffff');
      if (chama === 1) { g.px(6, 1, '#ffd23f'); g.px(6, 0, '#ff8a3d'); }
      if (chama === 2) { g.px(6, 1, '#ff8a3d'); g.px(7, 0, '#ffd23f'); g.px(6, 0, '#ffd23f'); }
    }
  });
  ITENS.polenta = prato(false, 0);
  ITENS.polentaVela = prato(true, 0);
  ITENS.polentaAcesa1 = prato(true, 1);
  ITENS.polentaAcesa2 = prato(true, 2);
  ITENS.moeda = item(3, 3, (g) => { g.rect(1, 1, 3, 3, '#f2c14e'); g.px(1, 1, '#ffe9a0'); g.px(3, 3, '#c98f2a'); });
}
