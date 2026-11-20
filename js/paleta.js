// Paleta quente do Sat's e utilitários de cor e desenho em pixel.

export const C = {
  contorno: '#2a1a1f',
  creme: '#efe2c4', cremeSombra: '#d9c7a1', cremeClaro: '#f8f0dc',
  bordo: '#9b2f33', bordoEsc: '#6e1f25', bordoClaro: '#b8494a',
  vermelho: '#c8322e', vermelhoEsc: '#931f22', vermelhoClaro: '#e0524a',
  oliva: '#5d6b3a', olivaEsc: '#414b28', olivaClaro: '#7a8a4c',
  madeira: '#7a4a2c', madeiraEsc: '#4e2d1b', madeiraClara: '#9c6538', madeiraBrilho: '#b97c45',
  inox: '#b9c0c4', inoxEsc: '#848c91', inoxClaro: '#e3e8ea',
  ferro: '#1d1c22', ferroClaro: '#3a3842',
  globo: '#fff1c8', luz: '#ffd27a',
  azulejoVinho: '#7a2230', azulejoCreme: '#ead9b8',
  mosaico: '#3f7fb0', mosaicoEsc: '#2c5f8a', mosaicoClaro: '#6aa3cf',
  marmore: '#e8e4dc', marmoreVeio: '#c4bcb0',
  vidroVerde: '#5fb3a1', vidroVerdeEsc: '#3c8576',
  chopp: '#e8a33a', choppEsc: '#c27a1c', espuma: '#fbf6ea',
  polenta: '#f2c14e', polentaEsc: '#c98f2a',
  papel: '#f6f2e8',
  // interface
  uiFundo: '#2b1d1a', uiFundo2: '#3a2722', uiBorda: '#efe2c4', uiTexto: '#f4ead2',
  uiSuave: '#c9b79a', uiDestaque: '#ffd27a', uiSombra: '#140c0d',
};

export const PELES = ['#f6d7c3', '#eabd9a', '#d39a6c', '#b07447', '#8a5532', '#5e3a22'];

export const CABELOS = {
  preto: '#221c1c', castanho: '#5a3a22', louro: '#e2c26b', ruivo: '#b5532a',
  grisalho: '#a9a49d', branco: '#ecebe6', rosa: '#d9729a', azul: '#4f7fc4',
};

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

const memo = new Map();
export function mix(a, b, t) {
  const k = a + b + t;
  if (memo.has(k)) return memo.get(k);
  const A = hexToRgb(a), B = hexToRgb(b);
  const r = rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
  memo.set(k, r);
  return r;
}
export const dark = (c, t = 0.22) => mix(c, '#1a0e12', t);
export const light = (c, t = 0.25) => mix(c, '#fffaf0', t);

// Grade de pixels: desenha partes com retângulos e depois gera o contorno automático.
export class Grid {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.d = new Array(w * h).fill(null);
  }
  px(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    this.d[y * this.w + x] = c;
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.d[y * this.w + x];
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }
  // retângulo com sombra na lateral esquerda (costas) e brilho no topo
  shaded(x, y, w, h, c, sombra = 'left') {
    this.rect(x, y, w, h, c);
    const d = dark(c, 0.18);
    if (sombra === 'left') this.rect(x, y, 1, h, d);
    if (sombra === 'right') this.rect(x + w - 1, y, 1, h, d);
    if (sombra === 'bottom') this.rect(x, y + h - 1, w, 1, d);
  }
  circle(cx, cy, r, c) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r + r * 0.6) this.px(cx + x, cy + y, c);
    }
  }
  ring(cx, cy, r, c) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = x * x + y * y;
      if (d <= r * r + r * 0.6 && d >= (r - 1) * (r - 1) + (r - 1) * 0.6 - 0.01) this.px(cx + x, cy + y, c);
    }
  }
  line(x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.px(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c);
  }
  outline(c = '#2a1a1f') {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push([x, y]);
    }
    for (const [x, y] of add) this.d[y * this.w + x] = c;
  }
  toCanvas() {
    const cv = document.createElement('canvas');
    cv.width = this.w; cv.height = this.h;
    const g = cv.getContext('2d');
    const img = g.createImageData(this.w, this.h);
    for (let i = 0; i < this.d.length; i++) {
      const c = this.d[i];
      if (!c) continue;
      const [r, gg, b] = hexToRgb(c);
      img.data[i * 4] = r; img.data[i * 4 + 1] = gg; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return cv;
  }
}

export function flipCanvas(cv) {
  const f = document.createElement('canvas');
  f.width = cv.width; f.height = cv.height;
  const g = f.getContext('2d');
  g.translate(cv.width, 0);
  g.scale(-1, 1);
  g.drawImage(cv, 0, 0);
  return f;
}

// Contorno de destaque (amarelo) ao redor de um sprite, para indicar que é clicável.
const contornos = new WeakMap();
export function highlightCanvas(cv, cor = '#ffd27a') {
  if (contornos.has(cv)) return contornos.get(cv);
  const w = cv.width, h = cv.height;
  const src = cv.getContext('2d').getImageData(0, 0, w, h).data;
  const out = document.createElement('canvas');
  out.width = w + 2; out.height = h + 2;
  const g = out.getContext('2d');
  g.fillStyle = cor;
  const a = (x, y) => (x >= 0 && y >= 0 && x < w && y < h) ? src[(y * w + x) * 4 + 3] : 0;
  for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
    if (a(x, y)) continue;
    if (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1)) g.fillRect(x + 1, y + 1, 1, 1);
  }
  contornos.set(cv, out);
  return out;
}

// Pseudoaleatório determinístico (para texturas que não mudam a cada carregamento).
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
