import { Jogo } from './motor.js';
import { roteiro } from './roteiro.js';
import { confirmarNome, CHEGADAS } from './telas.js';

const canvas = document.getElementById('tela');
const campo = document.getElementById('campo-nome');
const jogo = new Jogo(canvas, campo, roteiro);
roteiro.preparar(jogo);

campo.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); confirmarNome(jogo); }
});

// Atalho para testes locais: ?teste=1 pula as telas iniciais.
const params = new URLSearchParams(location.search);
if (params.has('teste')) {
  jogo.dados.nome = 'Visitante Teste';
  jogo.dados.primeiro = 'Visitante';
  jogo.dados.chegada = CHEGADAS[Number(params.get('chegada') || 1)];
  jogo.luz = jogo.dados.chegada.luz;
  jogo.dados.avatar = Number(params.get('avatar') || 0);
  jogo.fadeA = 1;
  roteiro.comecar(jogo);
}
if (params.has('teste') || params.has('debug')) window.jogo = jogo;

jogo.iniciar();
