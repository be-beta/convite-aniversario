// Peças de interface desenhadas em pixel: painéis, botões, ícones, balões e caixa de diálogo.
// Todas as medidas usam "u": quantos pixels reais vale um pixel da interface.

import { C } from './paleta.js';
import { drawText, measure, wrap, LINE_H } from './font.js';

export const R = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

export function painel(ctx, x, y, w, h, u, { fundo = C.uiFundo, borda = C.uiBorda, sombra = true } = {}) {
  if (sombra) R(ctx, x + u, y + u * 2, w, h, 'rgba(10,5,6,0.55)');
  R(ctx, x + u, y, w - 2 * u, h, C.uiSombra);
  R(ctx, x, y + u, w, h - 2 * u, C.uiSombra);
  R(ctx, x + u, y + u, w - 2 * u, h - 2 * u, borda);
  R(ctx, x + 2 * u, y + 2 * u, w - 4 * u, h - 4 * u, fundo);
}

// Botão grande e fácil de tocar. Retorna o retângulo para registrar o toque.
export function botao(ctx, x, y, w, h, texto, u, { ativo = true, destaque = false, hover = false, alinhar = 'center', numero = null } = {}) {
  const base = !ativo ? '#8a7f70' : destaque ? C.uiDestaque : hover ? '#fff6dd' : C.creme;
  R(ctx, x + u, y + u, w, h, C.uiSombra);
  R(ctx, x, y, w, h, C.uiSombra);
  R(ctx, x + u, y + u, w - 2 * u, h - 2 * u, base);
  R(ctx, x + u, y + h - 2 * u, w - 2 * u, u, 'rgba(0,0,0,0.12)');
  const ty = y + Math.floor((h - 9 * u) / 2) - u;
  const cor = ativo ? C.contorno : '#4a4038';
  if (alinhar === 'left') {
    let tx = x + 5 * u;
    if (numero != null) { drawText(ctx, String(numero), tx, ty, u, '#9b2f33'); tx += 9 * u; }
    drawText(ctx, texto, tx, ty, u, cor);
  } else drawText(ctx, texto, x + w / 2, ty, u, cor, null, 'center');
  return { x, y, w, h };
}

// Ícones de 7x7 pixels
const ICONES = {
  falar: ['.#####.', '#.....#', '#.#.#.#', '#.....#', '.###.#.', '...##..', '...#...'],
  olhar: ['.......', '..###..', '.#...#.', '#..#..#', '.#...#.', '..###..', '.......'],
  pegar: ['..#.#..', '.##.##.', '.#####.', '.#####.', '.#####.', '..###..', '..###..'],
  ir: ['...#...', '...##..', '######.', '#######', '######.', '...##..', '...#...'],
  lupa: ['.###...', '#...#..', '#...#..', '#...#..', '.####..', '....##.', '.....##'],
  som: ['...#...', '..##.#.', '####..#', '####.##', '####..#', '..##.#.', '...#...'],
  mudo: ['...#...', '..##...', '####.#.', '####..#', '####.#.', '..##...', '...#...'],
  check: ['......#', '.....##', '#...##.', '##.##..', '.###...', '..#....', '.......'],
  pin: ['.###.', '#...#', '#.#.#', '#...#', '.#.#.', '.#.#.', '..#..'],
  relogio: ['.###.', '#.#.#', '#.#.#', '#.###', '#...#', '#...#', '.###.'],
  calendario: ['#.#.#', '#####', '#...#', '#.#.#', '#...#', '#.#.#', '#####'],
  chopp: ['####.', '####.', '#..##', '#..#.', '#..##', '#..#.', '####.'],
};

export function icone(ctx, nome, x, y, u, cor) {
  const m = ICONES[nome];
  if (!m) return;
  ctx.fillStyle = cor;
  m.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') ctx.fillRect(x + i * u, y + j * u, u, u); });
}

// Rótulo de identificação: Nome em cima, função embaixo.
export function rotulo(ctx, sx, sy, nome, papel, acao, u, limites) {
  const linhas = [nome, papel].filter(Boolean);
  const largura = Math.max(...linhas.map(measure)) + (acao ? 10 : 0) + 8;
  const w = largura * u;
  const h = (linhas.length * 10 + 6) * u;
  let x = Math.round(sx - w / 2);
  let y = Math.round(sy - h - 3 * u);
  if (limites) {
    x = Math.max(limites.x + 2 * u, Math.min(limites.x + limites.w - w - 2 * u, x));
    y = Math.max(limites.y + 2 * u, y);
  }
  R(ctx, x + u, y + u, w, h, 'rgba(10,5,6,0.5)');
  R(ctx, x, y, w, h, 'rgba(28,18,20,0.92)');
  R(ctx, x, y, w, u, C.uiDestaque);
  let tx = x + 4 * u;
  if (acao) { icone(ctx, acao, tx, y + 4 * u, u, C.uiDestaque); tx += 10 * u; }
  drawText(ctx, nome, tx, y + 2 * u, u, C.uiDestaque);
  if (papel) drawText(ctx, papel, tx, y + 12 * u, u, C.uiSuave);
}

// Balão de fala no cenário.
export function balao(ctx, sx, sy, texto, u, limites, { pensamento = false, cor = '#fbf8ef' } = {}) {
  const maxW = 104;
  const linhas = wrap(texto, maxW);
  const tw = Math.max(...linhas.map(measure));
  const w = (tw + 8) * u;
  const h = (linhas.length * (LINE_H - 1) + 4) * u;
  let x = Math.round(sx - w / 2);
  let y = Math.round(sy - h - 6 * u);
  if (limites) {
    x = Math.max(limites.x + u, Math.min(limites.x + limites.w - w - u, x));
    y = Math.max(limites.y + u, y);
  }
  R(ctx, x + u, y, w - 2 * u, h, C.contorno);
  R(ctx, x, y + u, w, h - 2 * u, C.contorno);
  R(ctx, x + u, y + u, w - 2 * u, h - 2 * u, cor);
  const cx = Math.max(x + 4 * u, Math.min(x + w - 6 * u, Math.round(sx)));
  if (pensamento) {
    R(ctx, cx, y + h + u, 2 * u, 2 * u, C.contorno); R(ctx, cx + u, y + h + 4 * u, u, u, C.contorno);
  } else {
    R(ctx, cx - u, y + h - u, 3 * u, u, cor);
    R(ctx, cx - 2 * u, y + h - u, u, 2 * u, C.contorno); R(ctx, cx + 2 * u, y + h - u, u, u, C.contorno);
    R(ctx, cx - u, y + h, 2 * u, u, cor); R(ctx, cx + u, y + h, u, 2 * u, C.contorno);
    R(ctx, cx - u, y + h + u, u, u, cor); R(ctx, cx, y + h + u, u, 2 * u, C.contorno); R(ctx, cx - u, y + h + 2 * u, u, u, C.contorno);
  }
  linhas.forEach((l, i) => drawText(ctx, l, x + 4 * u, y + (i * (LINE_H - 1)) * u, u, C.contorno));
}

export { drawText, measure, wrap, LINE_H };
