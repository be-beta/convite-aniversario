// Página da galeria: busca na planilha (com a chave) os personagens que os convidados montaram.

import { RSVP_URL } from './config.js';
import { montarLook, selecaoDoCodigo } from './personagens.js';
import { buildCharacter, frameCanvas } from './sprites.js';
import { drawText, wrap } from './font.js';

const $ = (id) => document.getElementById(id);
const CHAVE_LOCAL = 'noite-galeria-chave';
const ORDEM = { 'Tô dentro': 0, 'Vou tentar': 1, 'Não vai': 2 };
const COR = { 'Tô dentro': '#7ad06a', 'Vou tentar': '#ffd27a', 'Não vai': '#ff8a7a' };

$('chave').value = localStorage.getItem(CHAVE_LOCAL) || '';

$('form-chave').addEventListener('submit', async (e) => {
  e.preventDefault();
  const chave = $('chave').value.trim();
  if (!chave) return;
  if (!RSVP_URL) { $('msg').textContent = 'O endereço da planilha ainda não está em js/config.js.'; return; }
  $('msg').textContent = 'Buscando...';
  try {
    const r = await fetch(RSVP_URL + '?chave=' + encodeURIComponent(chave));
    const dados = await r.json();
    if (dados.erro) { $('msg').textContent = 'Chave errada (ou ainda não configurada no Apps Script).'; return; }
    localStorage.setItem(CHAVE_LOCAL, chave);
    mostrar(dados.pessoas || []);
  } catch (err) {
    $('msg').textContent = 'Não consegui falar com a planilha. Tente de novo em instantes.';
  }
});

$('botao-colar').addEventListener('click', () => {
  const pessoas = [];
  for (const linha of $('colar').value.split(/\r?\n/)) {
    const cols = linha.split('\t').map((s) => s.trim()).filter(Boolean);
    if (!cols.length) continue;
    const personagem = cols.find((c) => /^[0-9a-z]{10,20}$/.test(c)) || '';
    const resposta = cols.find((c) => ORDEM[c] !== undefined) || '';
    const nome = cols.find((c) => c !== personagem && c !== resposta && !/^\d/.test(c)) || '?';
    if (nome === 'Nome') continue;
    pessoas.push({ nome, resposta, personagem });
  }
  mostrar(pessoas);
});

function mostrar(pessoas) {
  pessoas.sort((a, b) => (ORDEM[a.resposta] ?? 3) - (ORDEM[b.resposta] ?? 3) || a.nome.localeCompare(b.nome));
  const conta = (r) => pessoas.filter((p) => p.resposta === r).length;
  $('msg').textContent = pessoas.length ? '' : 'Ninguém respondeu ainda.';
  $('resumo').textContent = pessoas.length
    ? `Tô dentro: ${conta('Tô dentro')} · Vou tentar: ${conta('Vou tentar')} · Não vai: ${conta('Não vai')}`
    : '';
  const grade = $('grade');
  grade.innerHTML = '';
  for (const p of pessoas) grade.appendChild(cartao(p));
}

function cartao(p) {
  const W = 58, H = 92;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  c.title = p.nome;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.fillStyle = '#3a2722'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#4a332c'; g.fillRect(0, 52, W, H - 52);
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(W / 2 - 7, 55, 14, 2);
  if (p.personagem) {
    const sp = buildCharacter(montarLook(selecaoDoCodigo(p.personagem)));
    g.drawImage(frameCanvas(sp, 'idle0', false), Math.round(W / 2 - 15), 54 - 55);
  } else {
    drawText(g, '?', W / 2, 24, 2, '#c9b79a', null, 'center');
  }
  const primeiro = String(p.nome).split(' ')[0].slice(0, 14);
  wrap(primeiro, W - 4).slice(0, 1).forEach((l) => drawText(g, l, W / 2, 60, 1, '#f4ead2', '#140c0d', 'center'));
  if (p.resposta) drawText(g, p.resposta, W / 2, 74, 1, COR[p.resposta] || '#c9b79a', null, 'center');
  return c;
}

