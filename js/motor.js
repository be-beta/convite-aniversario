// Motor do jogo: layout responsivo, câmera, toque/clique, personagens, diálogos e desenho.

import { SCENE_H, criarCenarios, glowSprite, LUZES } from './cenarios.js';
import { buildCharacter, buildDog, buildItems, frameCanvas, ITENS, CX, GY, FW, DOG } from './sprites.js';
import { highlightCanvas, C } from './paleta.js';
import { painel, botao, rotulo, balao, icone, R, drawText, measure, wrap, LINE_H } from './ui.js';
import { sfx, destravar, isMudo, setMudo } from './audio.js';
import { ELENCO } from './personagens.js';
import { desenharTela } from './telas.js';

const MIN_VIEW = 180;
const agora = () => performance.now();

export class Ent {
  constructor(id, sprite, o = {}) {
    Object.assign(this, {
      id, sprite, x: 0, y: 0, face: 1, cena: null, pose: null, alvo: null, vel: 50,
      falando: false, segurando: null, balaoTxt: null, balaoAte: 0, pensa: false,
      t: Math.random() * 1000, piscar: 1500 + Math.random() * 3000, clicavel: true,
      acao: 'falar', nome: '', papel: '', usar: null, visivel: true, dy: 0, chegou: null,
    }, o);
  }
  get movendo() { return !!this.alvo; }
}

export class Jogo {
  constructor(canvas, campo, roteiro) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.campo = campo;
    this.roteiro = roteiro;
    this.cenas = criarCenarios();
    this.cenaAtual = 'calcada';
    this.luz = 'anoitecer';
    this.camX = 0;
    this.ent = {};
    this.objetos = [];
    this.jogador = null;
    this.f = {};                 // marcadores da história
    this.n = { interacoes: 0 };  // contadores
    this.dados = { nome: '', primeiro: '', chegada: null, avatar: 0, resposta: null };
    this.tela = 'titulo';
    this.dialogo = null;
    this.ocupado = false;
    this.pendente = null;
    this.hover = null;
    this.lupaAte = 0;
    this.painelAberto = false;
    this.avisos = [];
    this.baloesLivres = [];
    this.particulas = [];
    this.fadeA = 0;
    this.fadeAlvo = 0;
    this.fadeRes = null;
    this.foco = null;
    this.estado = {};
    this.hits = [];
    this.t = 0;
    this.buf = document.createElement('canvas');
    this.camada = document.createElement('canvas');
    buildItems();
    this.sprites = {};
    this.instalarEntrada();
    this.redimensionar();
    window.addEventListener('resize', () => this.redimensionar());
    window.visualViewport && window.visualViewport.addEventListener('resize', () => this.redimensionar());
  }

  // ---------------------------------------------------------------- layout
  redimensionar() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cw = window.innerWidth, ch = window.innerHeight;
    this.dpr = dpr;
    this.canvas.style.width = cw + 'px';
    this.canvas.style.height = ch + 'px';
    this.W = this.canvas.width = Math.round(cw * dpr);
    this.H = this.canvas.height = Math.round(ch * dpr);
    const retrato = ch > cw;
    const uiCss = Math.min(cw / 190, ch / 250) >= 3.4 ? 3 : 2;
    this.u = Math.max(1, Math.round(uiCss * dpr));
    const minUI = (retrato ? 118 : 96) * this.u;
    const S2 = Math.max(1, Math.floor(this.W / MIN_VIEW));
    const S1 = Math.floor((this.H - minUI) / SCENE_H);
    const Smax = Math.max(1, Math.floor(this.H / SCENE_H));
    this.sobreposto = false;
    let S = Math.min(S1, S2);
    if (S < 1 || (!retrato && S1 < Smax * 0.6)) {
      S = Math.min(Smax, S2);
      this.sobreposto = true;
    }
    this.S = Math.max(1, S);
    this.maxViewW = Math.floor(this.W / this.S);
    this.retrato = retrato;
    // no celular em pé, centraliza verticalmente cena + área de texto
    this.offY = 0;
    if (!this.sobreposto && retrato) this.offY = Math.max(0, Math.floor((this.H - this.S * SCENE_H - 150 * this.u) / 2));
  }

  get cena() { return this.cenas[this.cenaAtual]; }

  get viewW() { return Math.min(this.maxViewW, this.cena.w); }

  get sceneRect() {
    const w = this.viewW * this.S, h = SCENE_H * this.S;
    return { x: Math.floor((this.W - w) / 2), y: this.offY, w, h };
  }

  get uiRect() {
    if (this.sobreposto) return { x: 0, y: 0, w: this.W, h: this.H };
    const y = SCENE_H * this.S + this.offY;
    return { x: 0, y, w: this.W, h: this.H - y };
  }

  mundoParaTela(x, y) {
    const r = this.sceneRect;
    return { x: r.x + (x - Math.round(this.camX)) * this.S, y: r.y + y * this.S };
  }

  // ---------------------------------------------------------------- entidades
  sprite(id, look) {
    if (!this.sprites[id]) this.sprites[id] = look === 'cachorro' ? buildDog() : buildCharacter(look);
    return this.sprites[id];
  }

  criar(id, o = {}) {
    const info = ELENCO[id] || {};
    const sp = info.cachorro ? this.sprite(id, 'cachorro') : this.sprite(id, o.look || info.look);
    const e = new Ent(id, sp, { nome: info.nome || '', papel: info.papel || '', ...o });
    this.ent[id] = e;
    return e;
  }

  andar(e, x, y) {
    if (typeof e === 'string') e = this.ent[e];
    return new Promise((res) => {
      e.alvo = { x, y: y ?? e.y };
      e.chegou = res;
    });
  }

  olhar(e, alvo) {
    if (typeof e === 'string') e = this.ent[e];
    if (typeof alvo === 'string') alvo = this.ent[alvo];
    const ax = typeof alvo === 'number' ? alvo : alvo.x;
    if (Math.abs(ax - e.x) > 1) e.face = ax > e.x ? 1 : -1;
  }

  // ---------------------------------------------------------------- roteiro (async)
  fmt(s) {
    return String(s).replace(/\{nome\}/g, this.dados.primeiro || 'você');
  }

  fala(quem, texto) {
    const e = this.ent[quem];
    if (quem !== 'voce') this.ultimaFala = { quem, texto: this.fmt(texto) };
    return new Promise((res) => {
      this.dialogo = { tipo: 'fala', quem, texto: this.fmt(texto), mostrado: 0, res };
      if (e) e.falando = true;
    }).then(() => { if (e) e.falando = false; });
  }

  narra(texto) { return this.fala('narrador', texto); }
  voce(texto) { return this.fala('voce', texto); }

  escolha(opcoes) {
    const ops = opcoes.filter(Boolean).map((o) => (typeof o === 'string' ? { t: o, v: o } : o));
    const ctx = this.ultimaFala;
    return new Promise((res) => {
      this.dialogo = { tipo: 'escolha', quem: 'voce', contexto: ctx, opcoes: ops.map((o) => ({ ...o, t: this.fmt(o.t) })), res };
    });
  }

  avancar() {
    const d = this.dialogo;
    if (!d || d.tipo !== 'fala') return;
    if (d.mostrado < d.texto.length) { d.mostrado = d.texto.length; return; }
    this.dialogo = null;
    d.res();
  }

  escolher(i) {
    const d = this.dialogo;
    if (!d || d.tipo !== 'escolha' || !d.opcoes[i]) return;
    sfx.escolha();
    this.dialogo = null;
    d.res(d.opcoes[i].v);
  }

  balao(quem, texto, ms = 2800, pensa = false) {
    const e = this.ent[quem];
    if (!e) return;
    e.balaoTxt = this.fmt(texto);
    e.balaoAte = this.t + ms;
    e.pensa = pensa;
  }

  balaoEm(cena, x, y, texto, ms = 2600) {
    this.baloesLivres.push({ cena, x, y, texto: this.fmt(texto), ate: this.t + ms });
  }

  espera(ms) { return new Promise((r) => setTimeout(r, ms)); }

  aviso(texto, icone = 'check') {
    this.avisos.push({ texto: this.fmt(texto), ate: this.t + 2800, icone });
  }

  fade(alvo, ms = 300) {
    return new Promise((res) => {
      if (this.fadeA === alvo) { this.fadeAlvo = alvo; res(); return; }
      this.fadeAlvo = alvo;
      this.fadeVel = 1 / ms;
      this.fadeRes = res;
    });
  }

  async irPara(cena, x, y, face = 1) {
    const p = this.jogador;
    await this.fade(1, 220);
    this.cenaAtual = cena;
    p.cena = cena;
    p.x = x; p.y = y; p.face = face; p.alvo = null;
    this.baloesLivres = [];
    this.camX = this.alvoCamera();
    if (this.roteiro.aoEntrar) this.roteiro.aoEntrar(this, cena);
    await this.fade(0, 220);
  }

  rodar(fn) {
    if (this.ocupado) return;
    this.ocupado = true;
    this.hover = null;
    this.ultimaFala = null;
    Promise.resolve()
      .then(() => fn(this))
      .catch((e) => console.error(e))
      .finally(() => {
        this.ocupado = false;
        this.dialogo = null;
        this.foco = null;
        this.n.interacoes++;
      });
  }

  // ---------------------------------------------------------------- pontos clicáveis
  clicaveis() {
    const out = [];
    for (const e of Object.values(this.ent)) {
      if (e === this.jogador || e.cena !== this.cenaAtual || !e.visivel || !e.clicavel || !e.usar) continue;
      out.push({ ent: e, nome: e.nome, papel: e.papel, acao: e.acao, usar: e.usar, y: e.y, caixa: this.caixaEnt(e) });
    }
    for (const o of this.objetos) {
      if (o.cena !== this.cenaAtual) continue;
      if (o.ativo && !o.ativo(this)) continue;
      out.push({ obj: o, nome: typeof o.nome === 'function' ? o.nome(this) : o.nome, papel: o.papel, acao: o.acao || 'olhar', usar: o.usar, y: o.prioridade ?? (o.rect.y + o.rect.h), caixa: o.rect, ir: o.ir });
    }
    return out;
  }

  caixaEnt(e) {
    if (e.sprite.dog) return { x: e.x - 12, y: e.y - 16, w: 24, h: 17 };
    const f = e.sprite.frames.idle0.meta;
    const topo = f.head.y + 1;
    return { x: e.x - 8, y: e.y - (GY - topo), w: 16, h: GY - topo + 1 };
  }

  acharClicavel(wx, wy) {
    const folga = this.dpr > 1.5 ? 3 : 1;
    const lista = this.clicaveis().filter((h) => {
      const c = h.caixa;
      return wx >= c.x - folga && wx <= c.x + c.w + folga && wy >= c.y - folga && wy <= c.y + c.h + folga;
    });
    lista.sort((a, b) => (b.y - a.y) || ((b.ent ? 1 : 0) - (a.ent ? 1 : 0)));
    return lista[0] || null;
  }

  interagir(h) {
    const p = this.jogador;
    const A = this.cena.andar;
    let tx, ty;
    if (h.ent) {
      const lado = p.x < h.ent.x ? -1 : 1;
      tx = h.ent.x + lado * (h.ent.sprite.dog ? 20 : 17);
      ty = Math.max(A.y0, Math.min(A.y1, h.ent.y + 1));
    } else {
      tx = h.ir ? h.ir.x : h.caixa.x + h.caixa.w / 2;
      ty = h.ir ? h.ir.y : A.y0 + 2;
    }
    tx = Math.max(A.x0, Math.min(A.x1, tx));
    this.pendente = h;
    const executar = () => {
      if (this.pendente !== h) return;
      this.pendente = null;
      if (h.ent) { this.olhar(p, h.ent); if (!h.ent.sprite.dog && !h.ent.fixoFace) this.olhar(h.ent, p); }
      else if (h.obj && h.obj.face) p.face = h.obj.face;
      else p.face = (h.caixa.x + h.caixa.w / 2) >= p.x ? 1 : -1;
      this.rodar(h.usar);
    };
    if (Math.hypot(tx - p.x, ty - p.y) < 3) executar();
    else this.andar(p, tx, ty).then(executar);
  }

  // ---------------------------------------------------------------- entrada
  hit(r, fn, dados) { this.hits.push({ ...r, fn, dados }); return r; }

  instalarEntrada() {
    const c = this.canvas;
    let down = null;
    const pos = (e) => {
      const b = c.getBoundingClientRect();
      return { x: (e.clientX - b.left) * this.dpr, y: (e.clientY - b.top) * this.dpr };
    };
    c.addEventListener('pointerdown', (e) => {
      destravar();
      down = { ...pos(e), t: agora() };
      this.pressionado = pos(e);
    });
    c.addEventListener('pointerup', (e) => {
      const p = pos(e);
      this.pressionado = null;
      if (!down) return;
      const mov = Math.hypot(p.x - down.x, p.y - down.y) / this.dpr;
      down = null;
      if (mov < 14) this.toque(p.x, p.y, e.pointerType);
    });
    c.addEventListener('pointercancel', () => { down = null; this.pressionado = null; });
    c.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      this.mouse = pos(e);
      this.atualizarHover();
    });
    c.addEventListener('pointerleave', () => { this.mouse = null; this.hover = null; });
    window.addEventListener('keydown', (e) => {
      if (document.activeElement === this.campo) return;
      if (this.tela === 'jogo' && this.dialogo) {
        if (this.dialogo.tipo === 'fala' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.avancar(); }
        if (this.dialogo.tipo === 'escolha' && /^[1-9]$/.test(e.key)) this.escolher(Number(e.key) - 1);
      } else if (this.teclaTela) this.teclaTela(e);
    });
  }

  dentro(r, x, y) { return x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h; }

  toque(x, y) {
    for (let i = this.hits.length - 1; i >= 0; i--) {
      const h = this.hits[i];
      if (this.dentro(h, x, y)) { if (!h.semSom) sfx.clique(); h.fn(); return; }
    }
    if (this.tela !== 'jogo') return;
    if (this.dialogo) { if (this.dialogo.tipo === 'fala') this.avancar(); return; }
    if (this.painelAberto) { this.painelAberto = false; return; }
    if (this.ocupado || this.fadeA > 0.05 || !this.jogador) return;
    const r = this.sceneRect;
    if (!this.dentro(r, x, y)) return;
    const wx = Math.round(this.camX) + (x - r.x) / this.S;
    const wy = (y - r.y) / this.S;
    const h = this.acharClicavel(wx, wy);
    if (h) { this.interagir(h); return; }
    this.pendente = null;
    const A = this.cena.andar;
    this.andar(this.jogador, Math.max(A.x0, Math.min(A.x1, wx)), Math.max(A.y0, Math.min(A.y1, wy)));
    this.marcaToque = { x: Math.max(A.x0, Math.min(A.x1, wx)), y: Math.max(A.y0, Math.min(A.y1, wy)), ate: this.t + 400 };
  }

  atualizarHover() {
    this.hover = null;
    let cursor = 'default';
    if (this.mouse) {
      for (const h of this.hits) if (this.dentro(h, this.mouse.x, this.mouse.y)) cursor = 'pointer';
      if (this.tela === 'jogo' && !this.ocupado && !this.dialogo && this.jogador) {
        const r = this.sceneRect;
        if (this.dentro(r, this.mouse.x, this.mouse.y)) {
          const wx = Math.round(this.camX) + (this.mouse.x - r.x) / this.S;
          const wy = (this.mouse.y - r.y) / this.S;
          this.hover = this.acharClicavel(wx, wy);
          if (this.hover) cursor = 'pointer';
        }
      }
    }
    this.canvas.style.cursor = cursor;
  }

  // ---------------------------------------------------------------- atualização
  alvoCamera() {
    const alvo = this.foco || this.jogador;
    const vw = this.viewW;
    if (this.cena.w <= vw) return 0;
    const x = alvo && alvo.cena === this.cenaAtual ? alvo.x : (this.camCentro ?? this.cena.w / 2);
    return Math.max(0, Math.min(this.cena.w - vw, x - vw / 2));
  }

  atualizar(dt) {
    this.t += dt;
    for (const e of Object.values(this.ent)) {
      e.t += dt;
      if (e.alvo) {
        const dx = e.alvo.x - e.x, dy = e.alvo.y - e.y;
        const d = Math.hypot(dx, dy);
        const passo = e.vel * dt / 1000;
        if (Math.abs(dx) > 0.5) e.face = dx > 0 ? 1 : -1;
        if (d <= passo) {
          e.x = e.alvo.x; e.y = e.alvo.y; e.alvo = null;
          const cb = e.chegou; e.chegou = null;
          if (cb) cb();
        } else {
          e.x += dx / d * passo; e.y += dy / d * passo;
        }
      }
      e.piscar -= dt;
      if (e.piscar < -130) e.piscar = 1800 + Math.random() * 3500;
    }
    // câmera
    if (this.tela === 'jogo' || this.tela === 'convite') {
      const alvo = this.alvoCamera();
      this.camX += (alvo - this.camX) * Math.min(1, dt / 160);
      if (Math.abs(alvo - this.camX) < 0.3) this.camX = alvo;
    } else {
      const w = this.cena.w - this.viewW;
      this.camX = w > 0 ? (Math.sin(this.t / 6000) * 0.5 + 0.5) * w : 0;
    }
    // diálogo letra a letra
    const d = this.dialogo;
    if (d && d.tipo === 'fala' && d.mostrado < d.texto.length) d.mostrado = Math.min(d.texto.length, d.mostrado + dt * 0.05);
    // fade
    if (this.fadeA !== this.fadeAlvo) {
      const s = Math.sign(this.fadeAlvo - this.fadeA);
      this.fadeA += s * dt * (this.fadeVel || 0.004);
      if ((s > 0 && this.fadeA >= this.fadeAlvo) || (s < 0 && this.fadeA <= this.fadeAlvo)) {
        this.fadeA = this.fadeAlvo;
        const r = this.fadeRes; this.fadeRes = null;
        if (r) r();
      }
    }
    // partículas
    for (const p of this.particulas) { p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000; p.vy += 30 * dt / 1000; p.vida -= dt; }
    this.particulas = this.particulas.filter((p) => p.vida > 0 && p.y < SCENE_H);
    this.avisos = this.avisos.filter((a) => a.ate > this.t);
    this.baloesLivres = this.baloesLivres.filter((b) => b.ate > this.t);
    if (this.roteiro.atualizar && this.tela === 'jogo') this.roteiro.atualizar(this, dt);
    if (this.mouse) this.atualizarHover();
  }

  // ---------------------------------------------------------------- desenho
  quadro(e) {
    const sp = e.sprite;
    const andando = !!e.alvo;
    if (sp.dog) {
      if (andando) return 'walk' + (Math.floor(e.t / 110) % 4);
      const base = e.pose || 'idle';
      const n = base === 'idle' ? 'idle' : base;
      return n + (Math.floor(e.t / 220) % 2);
    }
    if (andando) return 'walk' + (Math.floor(e.t / 120) % 4);
    if (e.pose) {
      if (e.falando && sp.frames[e.pose + 'Talk'] && Math.floor(e.t / 130) % 2) return e.pose + 'Talk';
      if (e.pose === 'alto') return Math.floor(e.t / 260) % 2 ? 'alto' : 'alto2';
      return e.pose;
    }
    if (e.falando && this.dialogo && this.dialogo.tipo === 'fala' && this.dialogo.mostrado < this.dialogo.texto.length) {
      return Math.floor(e.t / 120) % 2 ? 'talk' : 'idle0';
    }
    if (e.piscar < 0) return 'blink';
    return (Math.floor(e.t / 900) % 3 === 2) ? 'idle1' : 'idle0';
  }

  desenharEnt(g, e) {
    const sp = e.sprite;
    const q = this.quadro(e);
    const esq = e.face < 0;
    const cv = frameCanvas(sp, q, esq);
    const ox = sp.dog ? DOG.cx : CX;
    const oy = sp.dog ? DOG.gy : GY;
    const dx = Math.round(e.x) - (esq ? cv.width - 1 - ox : ox);
    const dy = Math.round(e.y + (e.dy || 0)) - oy;
    // sombra no chão
    g.fillStyle = 'rgba(20,10,14,0.28)';
    g.fillRect(Math.round(e.x) - (sp.dog ? 9 : 7), Math.round(e.y) + 1, sp.dog ? 18 : 14, 2);
    g.drawImage(cv, dx, dy);
    e._desenho = { cv, dx, dy };
    if (e.segurando && !sp.dog && ITENS[e.segurando]) {
      const it = ITENS[e.segurando];
      const meta = sp.frames[q] ? sp.frames[q].meta : sp.frames.idle0.meta;
      const hx = esq ? cv.width - 1 - meta.hand.x : meta.hand.x;
      const ix = esq ? dx + hx - it.w + 2 : dx + hx - 1;
      const iy = dy + meta.hand.y - it.h + 3;
      g.drawImage(esq ? it.flip : it.cv, ix, iy);
    }
  }

  desenharCena(t) {
    const cena = this.cena;
    const vw = this.viewW;
    const H = SCENE_H;
    if (vw < 1) return;
    if (this.buf.width !== vw) { this.buf.width = vw; this.buf.height = H; this.camada.width = vw; this.camada.height = H; }
    const b = this.buf.getContext('2d');
    const s = this.camada.getContext('2d');
    b.imageSmoothingEnabled = false; s.imageSmoothingEnabled = false;
    const cam = Math.round(this.camX);
    b.clearRect(0, 0, vw, H);
    b.drawImage(cena.fundo(this.luz), cam, 0, vw, H, 0, 0, vw, H);
    b.save(); b.translate(-cam, 0); cena.emissivo(b, this.luz, t, this.estado); b.restore();

    // camada de personagens e objetos com profundidade
    s.clearRect(0, 0, vw, H);
    s.save(); s.translate(-cam, 0);
    const lista = [];
    for (const e of Object.values(this.ent)) if (e.cena === this.cenaAtual && e.visivel) lista.push({ y: e.y, e });
    for (const o of this.objetos) if (o.cena === this.cenaAtual && o.desenhar && (!o.ativo || o.ativo(this) || o.sempreVisivel)) lista.push({ y: o.yProf ?? (o.rect.y + o.rect.h), o });
    for (const it of this.roteiro.props ? this.roteiro.props(this) : []) if (it.cena === this.cenaAtual) lista.push({ y: it.y, p: it });
    lista.sort((a, b2) => a.y - b2.y);
    for (const it of lista) {
      if (it.e) this.desenharEnt(s, it.e);
      else if (it.o) it.o.desenhar(s, this, t);
      else if (it.p) it.p.desenhar(s, this, t);
    }
    if (this.marcaToque && this.marcaToque.ate > this.t) {
      const m = this.marcaToque;
      s.fillStyle = 'rgba(255,210,122,0.8)';
      s.fillRect(Math.round(m.x) - 2, Math.round(m.y), 5, 1);
      s.fillRect(Math.round(m.x), Math.round(m.y) - 1, 1, 3);
    }
    s.restore();
    s.globalCompositeOperation = 'source-atop';
    s.fillStyle = LUZES[this.luz].sombra;
    s.fillRect(0, 0, vw, H);
    s.globalCompositeOperation = 'source-over';
    b.drawImage(this.camada, 0, 0);

    // destaque do que é clicável
    if (this.tela === 'jogo') {
      const pulso = 0.55 + 0.45 * Math.sin(t / 180);
      const marcar = [];
      if (this.lupaAte > this.t) marcar.push(...this.clicaveis());
      else {
        if (this.hover) marcar.push(this.hover);
        if (this.pendente) marcar.push(this.pendente);
      }
      b.save(); b.globalAlpha = pulso; b.translate(-cam, 0);
      for (const h of marcar) {
        if (h.ent && h.ent._desenho) {
          const d = h.ent._desenho;
          b.drawImage(highlightCanvas(d.cv), d.dx - 1, d.dy - 1);
        } else if (h.caixa) {
          const c = h.caixa;
          b.fillStyle = C.uiDestaque;
          const L = 3, x0 = c.x, y0 = c.y, x1 = c.x + c.w - 1, y1 = c.y + c.h - 1;
          b.fillRect(x0, y0, L, 1); b.fillRect(x0, y0, 1, L);
          b.fillRect(x1 - L + 1, y0, L, 1); b.fillRect(x1, y0, 1, L);
          b.fillRect(x0, y1, L, 1); b.fillRect(x0, y1 - L + 1, 1, L);
          b.fillRect(x1 - L + 1, y1, L, 1); b.fillRect(x1, y1 - L + 1, 1, L);
        }
      }
      b.restore();
    }

    // brilhos das luzes
    b.globalCompositeOperation = 'lighter';
    for (const gl of cena.brilhos(this.luz)) {
      if (!gl.a) continue;
      const sp = glowSprite(gl.r, gl.cor);
      b.globalAlpha = gl.a;
      b.drawImage(sp, gl.x - gl.r - cam, gl.y - gl.r);
    }
    b.globalAlpha = 1;
    b.globalCompositeOperation = 'source-over';
    for (const p of this.particulas) { b.fillStyle = p.cor; b.fillRect(Math.round(p.x - cam), Math.round(p.y), p.w || 1, p.h || 2); }

    const r = this.sceneRect;
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this.buf, r.x, r.y, r.w, r.h);
  }

  desenhar(t) {
    if (this.W < 2 || this.H < 2) return;
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    R(ctx, 0, 0, this.W, this.H, '#1c1214');
    this.hits = [];
    if (this.offY > 16 * this.u) {
      const ty = Math.floor(this.offY / 2 - 5 * this.u);
      drawText(ctx, 'A NOITE DO BERNARDO', this.W / 2, ty, this.u, '#7a5a4c', null, 'center');
    }
    this.desenharCena(t);
    if (this.tela === 'jogo') this.desenharHUD(t);
    else desenharTela(this, ctx, t);
    if (this.fadeA > 0) { ctx.fillStyle = `rgba(16,8,10,${Math.min(1, this.fadeA)})`; ctx.fillRect(0, 0, this.W, this.H); }
    this.posicionarCampo();
  }

  posicionarCampo() {
    const c = this.campo;
    if (this.tela === 'nome' && this.campoRect) {
      const r = this.campoRect, d = this.dpr;
      c.style.left = r.x / d + 'px'; c.style.top = r.y / d + 'px';
      c.style.width = r.w / d + 'px'; c.style.height = r.h / d + 'px';
    } else if (c.style.left !== '-9999px') {
      c.style.left = '-9999px';
      if (document.activeElement === c) c.blur();
    }
  }

  limitesTela() {
    const r = this.sceneRect;
    return { x: Math.max(0, r.x), y: r.y, w: Math.min(this.W, r.w), h: r.h };
  }

  desenharHUD(t) {
    const ctx = this.ctx, u = this.u;
    const lim = this.limitesTela();
    const sr = this.sceneRect;

    // balões
    for (const e of Object.values(this.ent)) {
      if (e.cena !== this.cenaAtual || !e.visivel || !e.balaoTxt || e.balaoAte < this.t) continue;
      const topo = e.sprite.dog ? e.y - 18 : e.y - (GY - e.sprite.frames.idle0.meta.head.y) - 1;
      const p = this.mundoParaTela(e.x, topo);
      balao(ctx, p.x, p.y, e.balaoTxt, u, lim, { pensamento: e.pensa });
    }
    for (const bl of this.baloesLivres) {
      if (bl.cena !== this.cenaAtual) continue;
      const p = this.mundoParaTela(bl.x, bl.y);
      balao(ctx, p.x, p.y, bl.texto, u, lim);
    }

    // rótulos
    if (!this.dialogo) {
      if (this.lupaAte > this.t) {
        for (const h of this.clicaveis()) {
          const c = h.caixa;
          const p = this.mundoParaTela(c.x + c.w / 2, c.y);
          rotulo(ctx, p.x, p.y, h.nome, null, h.acao, u, lim);
        }
      } else {
        const h = this.hover || this.pendente;
        if (h) {
          const c = h.caixa;
          const p = this.mundoParaTela(c.x + c.w / 2, c.y);
          rotulo(ctx, p.x, p.y, h.nome, h.papel, h.acao, u, lim);
        }
      }
    }

    // botões do canto
    const bs = 16 * u, m = 3 * u;
    let bx = sr.x + sr.w - bs - m;
    if (bx + bs > this.W - m) bx = this.W - bs - m;
    const by = sr.y + m;
    const botaoIcone = (x, nome, fn) => {
      R(ctx, x + u, by + u, bs, bs, 'rgba(10,5,6,0.5)');
      R(ctx, x, by, bs, bs, C.uiSombra);
      R(ctx, x + u, by + u, bs - 2 * u, bs - 2 * u, 'rgba(43,29,26,0.92)');
      icone(ctx, nome, x + 4 * u, by + 4 * u, u, C.creme);
      this.hit({ x: x - 2 * u, y: by - 2 * u, w: bs + 4 * u, h: bs + 4 * u }, fn);
    };
    botaoIcone(bx, isMudo() ? 'mudo' : 'som', () => setMudo(!isMudo()));
    botaoIcone(bx - bs - 3 * u, 'lupa', () => { this.lupaAte = this.t + 2600; });
    if (this.sobreposto) {
      const tw = (measure('MISSÃO') + 10) * u;
      const x = Math.max(m, sr.x + m);
      R(ctx, x + u, by + u, tw, bs, 'rgba(10,5,6,0.5)');
      R(ctx, x, by, tw, bs, C.uiSombra);
      R(ctx, x + u, by + u, tw - 2 * u, bs - 2 * u, 'rgba(43,29,26,0.92)');
      drawText(ctx, 'MISSÃO', x + 5 * u, by + 3 * u, u, C.creme);
      this.hit({ x, y: by, w: tw, h: bs }, () => { this.painelAberto = !this.painelAberto; });
    }

    // avisos (topo)
    this.avisos.forEach((a, i) => {
      const w = (measure(a.texto) + 22) * u;
      const x = Math.round(sr.x + sr.w / 2 - w / 2);
      const y = by + (bs + 4 * u) * (this.sobreposto ? 1 : 0) + i * 18 * u + 22 * u;
      painel(ctx, x, y, w, 16 * u, u, { fundo: '#3a2722' });
      icone(ctx, a.icone, x + 5 * u, y + 5 * u, u, C.uiDestaque);
      drawText(ctx, a.texto, x + 15 * u, y + 2 * u, u, C.uiTexto);
    });

    // parte de baixo: diálogo ou painel da missão
    if (this.dialogo) this.desenharDialogo(t);
    else if (!this.sobreposto) this.desenharPainelMissao(this.uiRect, false);
    else if (this.painelAberto) this.desenharPainelMissao(this.uiRect, true);
  }

  cabecalho(quem) {
    if (quem === 'narrador') return null;
    if (quem === 'voce') return { nome: this.dados.primeiro || 'Você', papel: 'Você', e: this.jogador };
    const e = this.ent[quem];
    if (!e) return { nome: quem, papel: '' };
    return { nome: e.nome, papel: e.papel, e };
  }

  desenharDialogo(t) {
    const ctx = this.ctx, u = this.u;
    const d = this.dialogo;
    const area = this.uiRect;
    const m = 4 * u;
    const bw = Math.min(area.w - 2 * m, 330 * u);
    const bx = Math.round(area.x + (area.w - bw) / 2);
    const pad = 8 * u;
    const innerW = Math.floor((bw - 2 * pad) / u);
    const cab = this.cabecalho(d.tipo === 'escolha' && d.contexto ? d.contexto.quem : d.quem);
    const cabH = cab ? 22 * u : 0;
    let linhas = [], conteudoH = 0;
    if (d.tipo === 'fala') {
      if (!d.linhas || d.larg !== innerW) { d.linhas = wrap(d.texto, innerW); d.larg = innerW; }
      linhas = d.linhas;
      conteudoH = linhas.length * LINE_H * u + 8 * u;
    } else {
      linhas = d.contexto ? wrap(d.contexto.texto, innerW) : [];
      conteudoH = linhas.length * LINE_H * u + (linhas.length ? 5 * u : 0) + d.opcoes.length * 19 * u + 2 * u;
    }
    const bh = pad + cabH + conteudoH + 4 * u;
    const by = this.sobreposto ? this.H - bh - m : area.y + m;
    painel(ctx, bx, by, bw, bh, u);
    let y = by + pad - 2 * u;
    if (cab) {
      let tx = bx + pad;
      if (cab.e) {
        const sp = cab.e.sprite;
        const cv = frameCanvas(sp, 'idle0', false);
        R(ctx, tx, y, 18 * u, 18 * u, '#4a332c');
        if (sp.dog) ctx.drawImage(cv, 14, 0, 14, 12, tx + u, y + 3 * u, 14 * u * 1.15, 12 * u * 1.15);
        else {
          const hd = sp.frames.idle0.meta.head;
          ctx.drawImage(cv, hd.x, Math.max(0, hd.y - 1), 16, 17, tx + u, y + u, 16 * u, 17 * u);
        }
        tx += 22 * u;
      }
      drawText(ctx, cab.nome, tx, y, u, C.uiDestaque, C.uiSombra);
      if (cab.papel) drawText(ctx, cab.papel, tx, y + 10 * u, u, C.uiSuave);
      y += cabH;
    }
    if (d.tipo === 'fala') {
      let resta = Math.floor(d.mostrado);
      const cor = d.quem === 'narrador' ? '#e9d9b5' : C.uiTexto;
      for (const l of linhas) {
        if (resta <= 0) break;
        drawText(ctx, l.slice(0, resta), bx + pad, y, u, cor, C.uiSombra);
        resta -= l.length + 1;
        y += LINE_H * u;
      }
      if (d.mostrado >= d.texto.length && Math.floor(t / 350) % 2) {
        const ax = bx + bw - pad - 5 * u, ay = by + bh - 9 * u;
        R(ctx, ax, ay, 5 * u, u, C.uiDestaque); R(ctx, ax + u, ay + u, 3 * u, u, C.uiDestaque); R(ctx, ax + 2 * u, ay + 2 * u, u, u, C.uiDestaque);
      }
      this.hit({ x: 0, y: 0, w: this.W, h: this.H }, () => this.avancar(), null);
      this.hits[this.hits.length - 1].semSom = true;
    } else {
      const cor = d.contexto && d.contexto.quem === 'narrador' ? '#e9d9b5' : C.uiSuave;
      for (const l of linhas) { drawText(ctx, l, bx + pad, y, u, cor, C.uiSombra); y += LINE_H * u; }
      if (linhas.length) y += 5 * u;
      d.opcoes.forEach((o, i) => {
        const r = { x: bx + pad, y: y + i * 19 * u, w: bw - 2 * pad, h: 16 * u };
        const hov = this.mouse && this.dentro(r, this.mouse.x, this.mouse.y);
        botao(ctx, r.x, r.y, r.w, r.h, o.t, u, { alinhar: 'left', numero: i + 1, hover: hov });
        this.hit(r, () => this.escolher(i));
        this.hits[this.hits.length - 1].semSom = true;
      });
    }
  }

  desenharPainelMissao(area, flutuante) {
    const ctx = this.ctx, u = this.u;
    const m = 4 * u;
    const info = this.roteiro.painel(this);
    if (!info) return;
    const bw = Math.min(area.w - 2 * m, 330 * u);
    const bx = Math.round(area.x + (area.w - bw) / 2);
    const pad = 8 * u;
    const innerW = Math.floor((bw - 2 * pad) / u);
    const dica = info.dica ? wrap(info.dica, innerW) : [];
    const itensH = info.itens.length * 11 * u;
    const bh = pad + 12 * u + itensH + (dica.length ? dica.length * LINE_H * u + 6 * u : 0) + pad - 2 * u;
    let by = flutuante ? Math.round(this.sceneRect.y + 24 * u) : area.y + m;
    if (!flutuante && by + bh > this.H) by = this.H - bh - u;
    painel(ctx, bx, by, bw, bh, u, { fundo: '#2b1d1a' });
    let y = by + pad - 2 * u;
    drawText(ctx, info.titulo, bx + pad, y, u, C.uiDestaque, C.uiSombra);
    y += 12 * u;
    for (const it of info.itens) {
      const cx = bx + pad;
      R(ctx, cx, y + 2 * u, 7 * u, 7 * u, C.uiSombra);
      R(ctx, cx + u, y + 3 * u, 5 * u, 5 * u, it.feito ? '#4f7f3c' : '#4a332c');
      if (it.feito) icone(ctx, 'check', cx, y + 2 * u, u, C.uiDestaque);
      drawText(ctx, it.texto, cx + 11 * u, y, u, it.feito ? C.uiSuave : C.uiTexto);
      if (it.feito) R(ctx, cx + 11 * u, y + 6 * u, measure(it.texto) * u, u, 'rgba(201,183,154,0.6)');
      y += 11 * u;
    }
    if (dica.length) {
      y += 4 * u;
      R(ctx, bx + pad, y - 2 * u, bw - 2 * pad, u, 'rgba(239,226,196,0.15)');
      for (const l of dica) { drawText(ctx, l, bx + pad, y, u, '#e9d9b5'); y += LINE_H * u; }
    }
    if (flutuante) this.hit({ x: 0, y: 0, w: this.W, h: this.H }, () => { this.painelAberto = false; });
  }

  confete(x, y, n = 60) {
    const cores = ['#ffd23f', '#ff6b9a', '#4aa0d8', '#7ad06a', '#f4f1ea', '#c8322e'];
    for (let i = 0; i < n; i++) {
      this.particulas.push({ x: x + (Math.random() - 0.5) * 120, y: y - Math.random() * 40, vx: (Math.random() - 0.5) * 30, vy: -10 + Math.random() * 25, cor: cores[i % cores.length], vida: 3000 + Math.random() * 2500, w: 1, h: 1 + (i % 2) });
    }
  }

  iniciar() {
    let ultimo = agora();
    const loop = () => {
      const t = agora();
      const dt = Math.min(50, t - ultimo);
      ultimo = t;
      this.atualizar(dt);
      this.desenhar(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
