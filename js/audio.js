// Sons sintetizados na hora, sem nenhum arquivo de áudio.
// Três "trilhos": efeitos, ambiente (rua ou bar) e música 8-bit baixinha.

let ac = null, master = null, busSfx = null, busAmb = null, busMus = null, filtroMus = null;
let mudo = localStorage.getItem('noite-mudo') === '1';
let musicaLigada = localStorage.getItem('noite-musica') !== '0';
let lugar = 'rua';
const VOL_MUS = 1;

export function isMudo() { return mudo; }
export function isMusica() { return musicaLigada; }

export function setMudo(v) {
  mudo = v;
  localStorage.setItem('noite-mudo', v ? '1' : '0');
  if (master) master.gain.setTargetAtTime(v ? 0 : 0.55, ac.currentTime, 0.05);
}

export function setMusica(v) {
  musicaLigada = v;
  localStorage.setItem('noite-musica', v ? '1' : '0');
  if (busMus) busMus.gain.setTargetAtTime(v ? VOL_MUS : 0, ac.currentTime, 0.1);
}

// Precisa ser chamado dentro de um toque/clique (regra dos navegadores).
export function destravar() {
  if (!ac) {
    const A = window.AudioContext || window.webkitAudioContext;
    if (!A) return;
    ac = new A();
    master = ac.createGain();
    master.gain.value = mudo ? 0 : 0.55;
    master.connect(ac.destination);
    busSfx = ac.createGain(); busSfx.connect(master);
    busAmb = ac.createGain(); busAmb.connect(master);
    filtroMus = ac.createBiquadFilter(); filtroMus.type = 'lowpass'; filtroMus.frequency.value = 6000;
    busMus = ac.createGain(); busMus.gain.value = musicaLigada ? VOL_MUS : 0;
    busMus.connect(filtroMus); filtroMus.connect(master);
  }
  if (ac.state === 'suspended') ac.resume();
}

function tom(freq, dur, { tipo = 'square', vol = 0.12, ate = null, atraso = 0, ataque = 0.005, destino = null, em = null } = {}) {
  if (!ac) return;
  const t0 = em ?? (ac.currentTime + atraso);
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(freq, t0);
  if (ate) o.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(destino || busSfx);
  o.start(t0); o.stop(t0 + dur + 0.02);
  return o;
}

let ruidoBuf = null;
function bufRuido() {
  if (!ruidoBuf) {
    ruidoBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = ruidoBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ruidoBuf;
}

function ruido(dur, { vol = 0.15, freq = 1200, q = 1, tipo = 'bandpass', atraso = 0, ate = null, destino = null, ataque = 0.005 } = {}) {
  if (!ac) return;
  const t0 = ac.currentTime + atraso;
  const s = ac.createBufferSource();
  s.buffer = bufRuido();
  s.loop = true;
  const f = ac.createBiquadFilter();
  f.type = tipo; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
  if (ate) f.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(destino || busSfx);
  s.start(t0, Math.random()); s.stop(t0 + dur + 0.02);
  return { f, g, t0 };
}

export const sfx = {
  clique() { tom(880, 0.05, { vol: 0.05 }); },
  escolha() { tom(660, 0.05, { vol: 0.05 }); tom(990, 0.06, { vol: 0.04, atraso: 0.05 }); },
  // "voz" das falas: um bipe curto, com tom diferente para cada personagem
  voz(f) { tom(f * (0.97 + Math.random() * 0.06), 0.045, { tipo: 'square', vol: 0.018, ataque: 0.003 }); },
  porta() { ruido(0.25, { vol: 0.22, freq: 300, q: 0.8 }); tom(110, 0.18, { tipo: 'triangle', vol: 0.14 }); },
  bater() { for (let i = 0; i < 3; i++) { ruido(0.07, { vol: 0.28, freq: 500, q: 2, atraso: i * 0.16 }); tom(140, 0.06, { tipo: 'triangle', vol: 0.12, atraso: i * 0.16 }); } },
  copo() { tom(2400, 0.25, { tipo: 'sine', vol: 0.07 }); tom(3100, 0.18, { tipo: 'sine', vol: 0.045, atraso: 0.01 }); },
  servir() {
    for (let i = 0; i < 4; i++) ruido(0.09, { vol: 0.07, freq: 900 - i * 120, q: 6, atraso: i * 0.08 });
    tom(2600, 0.2, { tipo: 'sine', vol: 0.05, atraso: 0.38 });
  },
  // chopp saindo da torneira, com um "tink" no final
  chopeira() {
    ruido(1.7, { vol: 0.05, freq: 1900, q: 0.7, ataque: 0.08 });
    ruido(1.5, { vol: 0.03, freq: 700, q: 1.2, ataque: 0.2, atraso: 0.2 });
    tom(2500, 0.2, { tipo: 'sine', vol: 0.04, atraso: 1.75 });
  },
  latido() {
    for (let i = 0; i < 2; i++) {
      tom(520, 0.12, { tipo: 'sawtooth', vol: 0.06, ate: 260, atraso: i * 0.2 });
      ruido(0.1, { vol: 0.1, freq: 900, q: 2, atraso: i * 0.2 });
    }
  },
  alerta() { tom(988, 0.07, { vol: 0.05 }); tom(1319, 0.16, { vol: 0.05, atraso: 0.08 }); },
  moedas() { [2637, 3136, 2794, 3520, 2960].forEach((n, i) => tom(n, 0.14, { vol: 0.03, atraso: i * 0.09 })); },
  item() { [523, 659, 784, 1047].forEach((n, i) => tom(n, 0.1, { vol: 0.05, atraso: i * 0.06 })); },
  missao() { [392, 523, 659, 784, 659, 784].forEach((n, i) => tom(n, 0.12, { vol: 0.05, atraso: i * 0.08 })); },
  check() { tom(784, 0.08, { vol: 0.05 }); tom(1175, 0.12, { vol: 0.05, atraso: 0.08 }); },
  gole() { ruido(0.12, { vol: 0.12, freq: 400, q: 4, ate: 200 }); ruido(0.12, { vol: 0.1, freq: 380, q: 4, ate: 180, atraso: 0.18 }); },
  isqueiro() { ruido(0.05, { vol: 0.25, freq: 3000, q: 1 }); ruido(0.4, { vol: 0.1, freq: 700, q: 0.5, atraso: 0.06 }); },
  pop() { tom(300, 0.1, { tipo: 'sine', vol: 0.1, ate: 900 }); },
  triste() { [392, 370, 349].forEach((n, i) => tom(n, i === 2 ? 0.5 : 0.25, { tipo: 'triangle', vol: 0.09, atraso: i * 0.25 })); },
  // apito de juiz: dois trinados
  apito() {
    if (!ac) return;
    [[0, 0.16], [0.24, 0.5]].forEach(([at, dur]) => {
      const o = tom(2950, dur, { tipo: 'sine', vol: 0.07, atraso: at, ataque: 0.01 });
      if (!o) return;
      const lfo = ac.createOscillator(); const lg = ac.createGain();
      lfo.frequency.value = 32; lg.gain.value = 140;
      lfo.connect(lg); lg.connect(o.frequency);
      lfo.start(ac.currentTime + at); lfo.stop(ac.currentTime + at + dur + 0.05);
    });
  },
  xixi() {
    if (!ac) return;
    const a = ruido(2.8, { vol: 0.07, freq: 3400, q: 0.9, ataque: 0.15 });
    const b = ruido(2.8, { vol: 0.04, freq: 1300, q: 1.4, ataque: 0.2 });
    // pequenas oscilações para soar como um jato
    for (const x of [a, b]) {
      if (!x) continue;
      for (let i = 1; i < 12; i++) x.f.frequency.setValueAtTime(x.f.frequency.value * (0.85 + Math.random() * 0.3), x.t0 + i * 0.22);
    }
  },
  descarga() {
    ruido(1.8, { vol: 0.16, freq: 2200, q: 0.6, tipo: 'lowpass', ate: 260, ataque: 0.25 });
    ruido(1.2, { vol: 0.06, freq: 600, q: 3, atraso: 0.4, ate: 1400 });
  },
  parabens() {
    // melodia tradicional de aniversário (domínio público)
    const N = { G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, F5: 698, G5: 784 };
    const seq = [
      ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
      ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
      ['G4', .75], ['G4', .25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
      ['F5', .75], ['F5', .25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 3],
    ];
    const beat = 0.3;
    let t = 0;
    if (busMus) busMus.gain.setTargetAtTime(0, ac.currentTime, 0.2);
    for (const [n, d] of seq) {
      tom(N[n], d * beat * 0.95, { vol: 0.07, atraso: t });
      tom(N[n] / 2, d * beat * 0.9, { tipo: 'triangle', vol: 0.06, atraso: t });
      t += d * beat;
    }
    if (busMus) setTimeout(() => setMusica(musicaLigada), (t + 1) * 1000);
    return t;
  },
};

// ---------------------------------------------------------------------------
// Ambiente: burburinho do bar ou rua com carros passando

let amb = null;
function criarAmbiente() {
  if (!ac || amb) return;
  const buf = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) { last = last * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = last * 3; }
  const fonte = (freq, q, tipo) => {
    const s = ac.createBufferSource(); s.buffer = buf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = tipo; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain(); g.gain.value = 0;
    s.connect(f); f.connect(g); g.connect(busAmb); s.start(0, Math.random() * 2);
    return g;
  };
  amb = { bar: fonte(520, 0.7, 'bandpass'), rua: fonte(320, 0.5, 'lowpass') };
  amb.timer = setInterval(() => {
    if (!ac || mudo) return;
    if (lugar === 'bar' && Math.random() < 0.4) tom(2200 + Math.random() * 1200, 0.15, { tipo: 'sine', vol: 0.012, destino: busAmb });
    if (lugar === 'rua' && Math.random() < 0.2) {
      // carro passando
      const dur = 2.6;
      const r = ruido(dur, { vol: 0.045, freq: 260, q: 0.9, destino: busAmb, ataque: dur * 0.45 });
      if (r) { r.f.frequency.linearRampToValueAtTime(700, r.t0 + dur * 0.5); r.f.frequency.linearRampToValueAtTime(240, r.t0 + dur); }
    }
  }, 2000);
}

export function setLugar(l) {
  lugar = l;
  if (!ac) return;
  criarAmbiente();
  const t = ac.currentTime;
  amb.bar.gain.setTargetAtTime(l === 'bar' ? 0.05 : 0, t, 0.4);
  amb.rua.gain.setTargetAtTime(l === 'rua' ? 0.045 : 0, t, 0.4);
  // lá fora a música soa abafada, como se viesse de dentro do bar
  filtroMus.frequency.setTargetAtTime(l === 'rua' ? 650 : 6000, t, 0.3);
}

// ---------------------------------------------------------------------------
// Música 8-bit original, em clima de bossa, bem baixinha e em loop

const ACORDES = {
  C7M: [48, 52, 55, 59], Am7: [45, 48, 52, 55], Dm7: [50, 53, 57, 60], G7: [43, 47, 50, 53],
  Em7: [52, 55, 59, 62], A7: [45, 49, 52, 55], F7M: [41, 45, 48, 52], Fm6: [41, 44, 48, 50],
};
// cada compasso: acorde (e um segundo na metade, se houver) e melodia [passo, nota, duração em passos]
const A1 = [
  { a: 'C7M', m: [[0, 76, 3], [4, 74, 2], [6, 72, 4], [12, 71, 2]] },
  { a: 'Am7', m: [[0, 72, 3], [4, 76, 2], [6, 79, 6]] },
  { a: 'Dm7', m: [[0, 77, 3], [4, 76, 2], [6, 74, 4], [12, 72, 2]] },
  { a: 'G7', m: [[0, 74, 6], [8, 71, 4], [12, 67, 2]] },
];
const B1 = [
  { a: 'Em7', m: [[0, 71, 3], [4, 74, 2], [6, 79, 4], [12, 76, 2]] },
  { a: 'A7', m: [[0, 73, 3], [4, 76, 2], [6, 79, 4], [12, 81, 2]] },
  { a: 'Dm7', m: [[0, 77, 4], [6, 76, 2], [8, 74, 4], [12, 72, 2]] },
  { a: 'G7', m: [[0, 71, 8], [10, 74, 2], [12, 77, 4]] },
];
const A2 = [A1[0], A1[1], A1[2], { a: 'G7', m: [[0, 74, 4], [6, 71, 2], [8, 72, 8]] }];
const C1 = [
  { a: 'F7M', m: [[0, 69, 3], [4, 72, 2], [6, 76, 6]] },
  { a: 'Fm6', m: [[0, 68, 3], [4, 72, 2], [6, 74, 6]] },
  { a: 'Em7', b: 'A7', m: [[0, 71, 4], [6, 74, 2], [8, 73, 4], [12, 76, 4]] },
  { a: 'Dm7', b: 'G7', m: [[0, 74, 4], [6, 72, 2], [8, 71, 4], [12, 67, 4]] },
];
const COMPASSOS = [...A1, ...B1, ...A2, ...C1];
const BPM = 100;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

let mus = null;
export function iniciarMusica() {
  if (!ac || mus) return;
  mus = { passo: 0, t: ac.currentTime + 0.15 };
  mus.timer = setInterval(agendar, 60);
}

function agendar() {
  const s16 = 60 / BPM / 4;
  if (mus.t < ac.currentTime) mus.t = ac.currentTime + 0.05;
  while (mus.t < ac.currentTime + 0.3) {
    tocarPasso(mus.passo, mus.t, s16);
    mus.t += s16;
    mus.passo = (mus.passo + 1) % (COMPASSOS.length * 16);
  }
}

function tocarPasso(p, t, s16) {
  const c = COMPASSOS[Math.floor(p / 16)];
  const s = p % 16;
  const acorde = ACORDES[s >= 8 && c.b ? c.b : c.a];
  if (s === 0 || s === 6 || s === 8 || s === 14) {
    const n = (s === 6 || s === 14) ? acorde[0] + 7 : acorde[0];
    tom(midi(n), s16 * 2.2, { tipo: 'triangle', vol: 0.05, em: t, destino: busMus, ataque: 0.01 });
  }
  if ([0, 3, 6, 10, 13].includes(s)) {
    for (const n of acorde.slice(1)) tom(midi(n + 12), s16 * 0.9, { tipo: 'triangle', vol: 0.012, em: t, destino: busMus, ataque: 0.004 });
  }
  for (const [ps, n, d] of c.m) {
    if (ps === s) tom(midi(n), s16 * d * 0.9, { tipo: 'square', vol: 0.014, em: t, destino: busMus, ataque: 0.01 });
  }
}

// Liga ambiente e música (chamado no primeiro toque do convidado).
export function iniciarSom() {
  destravar();
  if (!ac) return;
  criarAmbiente();
  setLugar(lugar);
  iniciarMusica();
}
