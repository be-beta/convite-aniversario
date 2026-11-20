// Sons sintetizados na hora, sem nenhum arquivo de áudio.

let ac = null, master = null, ambiente = null;
let mudo = localStorage.getItem('noite-mudo') === '1';

export function isMudo() { return mudo; }

export function setMudo(v) {
  mudo = v;
  localStorage.setItem('noite-mudo', v ? '1' : '0');
  if (master) master.gain.value = v ? 0 : 0.55;
  if (v) pararAmbiente();
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
  }
  if (ac.state === 'suspended') ac.resume();
}

function tom(freq, dur, { tipo = 'square', vol = 0.12, ate = null, atraso = 0, ataque = 0.005 } = {}) {
  if (!ac || mudo) return;
  const t0 = ac.currentTime + atraso;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = tipo;
  o.frequency.setValueAtTime(freq, t0);
  if (ate) o.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

let ruidoBuf = null;
function ruido(dur, { vol = 0.15, freq = 1200, q = 1, tipo = 'bandpass', atraso = 0, ate = null } = {}) {
  if (!ac || mudo) return;
  if (!ruidoBuf) {
    ruidoBuf = ac.createBuffer(1, ac.sampleRate * 1, ac.sampleRate);
    const d = ruidoBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = ac.currentTime + atraso;
  const s = ac.createBufferSource();
  s.buffer = ruidoBuf;
  const f = ac.createBiquadFilter();
  f.type = tipo; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
  if (ate) f.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t0); s.stop(t0 + dur + 0.02);
}

export const sfx = {
  clique() { tom(880, 0.05, { vol: 0.06 }); },
  escolha() { tom(660, 0.05, { vol: 0.06 }); tom(990, 0.06, { vol: 0.05, atraso: 0.05 }); },
  porta() { ruido(0.25, { vol: 0.25, freq: 300, q: 0.8 }); tom(110, 0.18, { tipo: 'triangle', vol: 0.15 }); },
  bater() { for (let i = 0; i < 3; i++) { ruido(0.07, { vol: 0.3, freq: 500, q: 2, atraso: i * 0.16 }); tom(140, 0.06, { tipo: 'triangle', vol: 0.12, atraso: i * 0.16 }); } },
  copo() { tom(2400, 0.25, { tipo: 'sine', vol: 0.08 }); tom(3100, 0.18, { tipo: 'sine', vol: 0.05, atraso: 0.01 }); },
  latido() {
    for (let i = 0; i < 2; i++) {
      tom(520, 0.12, { tipo: 'sawtooth', vol: 0.07, ate: 260, atraso: i * 0.2 });
      ruido(0.1, { vol: 0.12, freq: 900, q: 2, atraso: i * 0.2 });
    }
  },
  moedas() {
    const notas = [2637, 3136, 2794, 3520, 2960];
    notas.forEach((n, i) => tom(n, 0.14, { tipo: 'square', vol: 0.035, atraso: i * 0.09 }));
  },
  item() { [523, 659, 784, 1047].forEach((n, i) => tom(n, 0.1, { vol: 0.06, atraso: i * 0.06 })); },
  missao() { [392, 523, 659, 784, 659, 784].forEach((n, i) => tom(n, 0.12, { vol: 0.06, atraso: i * 0.08 })); },
  check() { tom(784, 0.08, { vol: 0.06 }); tom(1175, 0.12, { vol: 0.06, atraso: 0.08 }); },
  gole() { ruido(0.12, { vol: 0.12, freq: 400, q: 4, ate: 200 }); ruido(0.12, { vol: 0.1, freq: 380, q: 4, ate: 180, atraso: 0.18 }); },
  isqueiro() { ruido(0.05, { vol: 0.25, freq: 3000, q: 1 }); ruido(0.4, { vol: 0.1, freq: 700, q: 0.5, atraso: 0.06 }); },
  pop() { tom(300, 0.1, { tipo: 'sine', vol: 0.12, ate: 900 }); },
  triste() { tom(392, 0.25, { tipo: 'triangle', vol: 0.1 }); tom(370, 0.25, { tipo: 'triangle', vol: 0.1, atraso: 0.25 }); tom(349, 0.5, { tipo: 'triangle', vol: 0.1, atraso: 0.5 }); },
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
    for (const [n, d] of seq) {
      tom(N[n], d * beat * 0.95, { vol: 0.07, atraso: t });
      tom(N[n] / 2, d * beat * 0.9, { tipo: 'triangle', vol: 0.06, atraso: t });
      t += d * beat;
    }
    return t;
  },
};

// Som ambiente discreto de bar: burburinho filtrado e um copo de vez em quando.
export function iniciarAmbiente() {
  if (!ac || mudo || ambiente) return;
  const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) { last = last * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = last * 3; }
  const s = ac.createBufferSource();
  s.buffer = buf; s.loop = true;
  const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 500; f.Q.value = 0.7;
  const g = ac.createGain(); g.gain.value = 0.05;
  s.connect(f); f.connect(g); g.connect(master);
  s.start();
  const timer = setInterval(() => { if (Math.random() < 0.35) tom(2200 + Math.random() * 1200, 0.15, { tipo: 'sine', vol: 0.015 }); }, 2500);
  ambiente = { s, timer };
}

export function pararAmbiente() {
  if (!ambiente) return;
  try { ambiente.s.stop(); } catch (e) { /* já parado */ }
  clearInterval(ambiente.timer);
  ambiente = null;
}
