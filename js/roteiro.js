// Roteiro: onde cada personagem fica, o que cada um fala e como a missão avança.
// {nome} vira o primeiro nome do convidado.

import { FREQUENTADORES, AVATARES } from './personagens.js';
import { buildCharacter, ITENS } from './sprites.js';
import { sfx, iniciarSom, setLugar } from './audio.js';

const LUZ_IDX = { entardecer: 0, anoitecer: 1, noite: 2 };
const sorteio = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Mesa 18: mesa alta com o baldinho de guardanapo
const MESA = { x: 206, y: 168 };

// ---------------------------------------------------------------------------
// ajudantes

async function menu(j, quem, opcoesFn, sair = 'Até já.') {
  for (;;) {
    const ops = opcoesFn().filter(Boolean);
    const r = await j.escolha([...ops.map((o) => ({ t: o.t, v: o })), { t: sair, v: null }]);
    if (!r) return;
    const fim = await r.fn();
    if (fim === 'sair') return;
  }
}

function progresso(f) {
  return [f.polenta, f.palito, f.isqueiro, f.amigos.leo, f.amigos.duda, f.amigos.renatao, f.distraido, f.copoCheio].filter(Boolean).length;
}
const numAmigos = (f) => ['leo', 'duda', 'renatao'].filter((k) => f.amigos[k]).length;

function tudoPronto(f) {
  return f.polenta && f.palito && f.isqueiro && numAmigos(f) === 3 && f.distraido && f.copoCheio && (!f.alinneSaiu || f.alinneVoltou);
}

function ajustarPolenta(j) {
  const f = j.f;
  if (f.polenta && !f.festa) j.jogador.segurando = f.palito ? 'polentaVela' : 'polenta';
}

function copoBernardo(j) {
  const f = j.f, b = j.ent.bernardo;
  if (f.distraido && !f.festa) { b.segurando = 'celular'; b.pose = 'peito'; return; }
  b.segurando = f.copoCheio ? 'copoCheio' : (f.copoSecou ? 'copoVazio' : 'copoMetade');
}

function marcar(j, texto) {
  sfx.check();
  j.aviso(texto);
}

// ---------------------------------------------------------------------------
// falas por personagem

async function falarLeo(j) {
  const f = j.f;
  if (!f.leoSeda) {
    await j.fala('leo', 'Fala, {nome}! Tem seda aí? Ou um isqueiro?');
    const r = await j.escolha([
      { t: 'Tenho só guardanapo.', v: 'g' },
      { t: 'Seda? Em pleno 2026?', v: 's' },
      { t: 'Não tenho, foi mal.', v: 'n' },
    ]);
    if (r === 'g') await j.fala('leo', 'Porra, {nome}, que fase!');
    if (r === 's') await j.fala('leo', 'Em pleno 2026, {nome}. A tradição resiste.');
    if (r === 'n') await j.fala('leo', 'Tranquilo, tranquilo.');
    await j.fala('leo', 'Vou ali ver se alguém tem. Já volto.');
    f.leoSeda = true;
    f.leoSumiu = true;
    f.leoT = j.t;
    j.ent.leo.vel = 70;
    j.andar('leo', 420, 186).then(() => { if (!f.leoVoltou) j.ent.leo.visivel = false; });
    return;
  }
  const primeiraVolta = !f.leoConversouVolta;
  f.leoConversouVolta = true;
  if (primeiraVolta) {
    await j.fala('leo', 'E aí, {nome}! Achei um isqueiro. Tava no meu bolso o tempo todo.');
  } else {
    await j.fala('leo', sorteio(['Fala, {nome}!', 'Opa! Voltou pra rodinha?', 'E aí, conseguiu o que precisava?']));
  }
  await menu(j, 'leo', () => [
    f.missao && !f.amigos.leo && { t: 'Vai ter parabéns pro Bernardo. Cola lá dentro!', fn: async () => {
      await j.fala('leo', 'Parabéns? Demorou! Já tô indo. Daqui a pouco. Já já.');
      f.amigos.leo = true;
      marcar(j, 'Léo avisado');
    } },
    f.missao && !f.isqueiro && { t: 'Me empresta o isqueiro?', fn: async () => {
      if (!f.palito) {
        await j.fala('leo', 'Pra quê, {nome}? Você nem tem seda.');
        await j.voce('É pra vela do bolo.');
        await j.fala('leo', 'Que vela? Arruma a vela primeiro que eu acendo na hora.');
        return;
      }
      await j.voce('É pra vela do bolo. Um palito com guardanapo.');
      await j.fala('leo', 'Vela de palito com guardanapo? Respeito. Toma, mas devolve depois.');
      f.isqueiro = true;
      sfx.item();
      j.aviso('Isqueiro do Léo', 'pegar');
    } },
    !f.leoOnde && { t: 'Onde você tinha ido?', fn: async () => {
      f.leoOnde = true;
      await j.fala('leo', 'Fui ali.');
      await j.voce('Onde é ali?');
      await j.fala('leo', 'Ali, {nome}. Ali.');
    } },
  ]);
}

async function falarTati(j) {
  const f = j.f;
  if (f.leoSumiu && !f.leoVoltou) {
    await j.fala('tati', 'O Léo? Foi ali. Ninguém nunca descobriu onde fica o ali.');
    await j.fala('tati', 'Mas ele sempre volta. Dá um tempinho.');
    return;
  }
  if (f.missao && !f.tatiAvisada) {
    f.tatiAvisada = true;
    await j.fala('tati', '{nome}! Que cara é essa de quem tá tramando alguma coisa?');
    await j.voce('Parabéns surpresa pro Bernardo daqui a pouco.');
    await j.fala('tati', 'Amei. Me chama na hora que eu entro com tudo.');
    return;
  }
  await j.fala('tati', sorteio([
    '{nome}! Eu fico aqui fora porque o vento é de graça e o papo é melhor.',
    'Calçada do Sat\'s é patrimônio. Devia ter placa.',
  ]));
}

async function falarBia(j) {
  const f = j.f;
  if (f.leoSumiu && !f.leoVoltou) {
    await j.fala('bia', 'O Léo é tipo bumerangue. Sempre volta, só que mais devagar.');
    return;
  }
  await j.fala('bia', sorteio([
    'Você viu o Caramelo? Ele já ganhou três pedaços de frango hoje. Eu dei dois.',
    'Eu disse que ia ficar só uma hora. Isso foi às cinco.',
  ]));
}

async function falarCaramelo(j) {
  const f = j.f, c = j.ent.caramelo;
  if (f.alinneSaiu && !f.alinneVoltou) return falarAlinneCalcada(j);
  c.alvo = null; c.chegou = null;
  j.olhar(c, j.jogador);
  c.pose = 'senta';
  await j.narra('Caramelo abana o rabo com tanta força que o corpo inteiro abana junto.');
  await menu(j, 'caramelo', () => [
    { t: 'Fazer carinho', fn: async () => {
      sfx.latido();
      c.pose = 'feliz';
      await j.narra(sorteio([
        'Caramelo encosta a cabeça na sua perna. Pronto, agora vocês são amigos para sempre.',
        'Caramelo deita de barriga pra cima. Você não tem escolha a não ser continuar.',
      ]));
      c.pose = 'senta';
    } },
    !f.carameloBernardo && { t: 'Perguntar se ele viu o Bernardo', fn: async () => {
      f.carameloBernardo = true;
      await j.narra('Caramelo te olha como quem diz: eu só vejo petisco.');
    } },
  ], 'Deixar o Caramelo em paz');
  c.pose = null;
}

async function iniciarMissao(j) {
  const f = j.f;
  await j.fala('alinne', '{nome}! Que bom que você chegou. Fala baixo. Temos um problema.');
  await j.fala('alinne', 'Ninguém trouxe bolo. Ninguém. Nem eu, e eu sou a namorada.');
  const r = await j.escolha([
    { t: 'E agora? Qual o plano?', v: 'plano' },
    { t: 'Parabéns sem bolo? Isso é crime.', v: 'crime' },
  ]);
  if (r === 'crime') await j.fala('alinne', 'Crime inafiançável. Por isso a gente vai improvisar.');
  await j.fala('alinne', 'Uma polenta vira bolo. Um palito com guardanapo vira vela. Fogo a gente arruma lá fora.');
  await j.fala('alinne', 'Também precisa chamar a galera: o Léo da calçada, a Duda e o Renatão, antes que ele vá embora.');
  await j.fala('alinne', 'E alguém tem que distrair o Bernardo e garantir que o copo dele esteja cheio na hora do brinde.');
  await j.fala('alinne', 'Eu fico aqui de olho nele. Operação Parabéns Improvisado começa agora.');
  f.missao = true;
  f.missaoT = j.t;
  sfx.missao();
  j.aviso('Nova missão: Operação Parabéns', 'chopp');
}

async function falarAlinne(j) {
  const f = j.f;
  if (f.alinneSaiu && !f.alinneVoltou) return falarAlinneCalcada(j);
  if (!f.missao) return iniciarMissao(j);
  if (tudoPronto(f)) return parabens(j);
  await j.fala('alinne', sorteio(['Psiu! Como tá indo, {nome}?', 'E aí? Ele não desconfia de nada.', 'Tô contando com você, {nome}.']));
  const dica = proximoPasso(j);
  await j.fala('alinne', dica.alinne);
}

async function falarAlinneCalcada(j) {
  const f = j.f, a = j.ent.alinne, c = j.ent.caramelo;
  await j.fala('alinne', '{nome}! Olha que coisa mais linda. Eu ia dar um petisco pra ele, mas acho que ele já comeu uns três hoje.');
  await menu(j, 'alinne', () => [
    { t: 'Fazer carinho junto', fn: async () => {
      sfx.latido();
      c.pose = 'feliz';
      await j.narra('Vocês dois fazem carinho no Caramelo ao mesmo tempo. Ele entra em estado de graça.');
      await j.fala('alinne', 'Viu? Ele gostou de você!');
      c.pose = 'senta';
    } },
    (f.polenta || f.polentaPedida) && !f.carameloTentou && { t: 'Ele tá de olho na polenta do bolo.', fn: async () => {
      await j.fala('alinne', 'Caramelo! A polenta é do Bernardo!');
      await j.fala('alinne', '...Tá bom, um pedacinho só.');
      c.pose = 'pede';
      await j.narra('Caramelo ganha um pedacinho de polenta. A confeitaria perdeu uma fatia.');
      c.pose = 'senta';
      f.carameloTentou = true;
    } },
    { t: 'Alinne, o parabéns!', fn: async () => {
      await j.fala('alinne', 'O PARABÉNS! Verdade. Foco, Alinne, foco.');
      await j.fala('alinne', 'Tchau, bebê. A tia volta já.');
      a.pose = null;
      c.pose = null;
      await j.andar(a, 282, 180);
      a.cena = 'corredor';
      a.x = 284; a.y = 171; a.face = -1;
      f.alinneVoltou = true;
      marcar(j, 'Alinne de volta ao corredor');
      return 'sair';
    } },
  ], 'Já volto');
}

async function falarBernardo(j) {
  const f = j.f, b = j.ent.bernardo;
  if (!f.missao) {
    await j.fala('bernardo', 'E aí, {nome}! Que bom que você veio. Já pegou um chopp? Aqui o chopp é sagrado.');
    await menu(j, 'bernardo', () => [
      !f.bParabens && { t: 'Parabéns, Bernardo!', fn: async () => {
        f.bParabens = true;
        await j.fala('bernardo', 'Valeu! Mas parabéns mesmo é conseguir lugar no balcão numa sexta.');
      } },
      !f.bAlinne && { t: 'A Alinne tá estranha, né?', fn: async () => {
        f.bAlinne = true;
        await j.fala('bernardo', 'Né? Tá cochichando com todo mundo. Deve ser fofoca boa.');
      } },
    ], 'Até já!');
    return;
  }
  if (f.distraido) {
    await j.fala('bernardo', sorteio([
      'Agora não, {nome}... tô vendo o trailer pela décima vez.',
      'Shhh. Olha esse pôr do sol. É de mentira, mas olha.',
      'Treze anos, {nome}. Treze.',
    ]));
    await j.narra('Ele nem tirou o olho do celular. Perfeito.');
    return;
  }
  await j.fala('bernardo', 'Fala, {nome}! Você tá com uma cara de quem tá aprontando alguma coisa.');
  if (f.polenta && !f.bPolenta) {
    f.bPolenta = true;
    await j.fala('bernardo', 'Isso aí é polenta? Vai dividir?');
    await j.voce('É... pra depois.');
    await j.fala('bernardo', 'Hum. Suspeito.');
  }
  if (f.copoSecou && !f.copoCheio) await j.fala('bernardo', 'E meu copo secou. Cadê o Seu Carlos quando a gente precisa?');
  await menu(j, 'bernardo', () => [
    !f.bFla && { t: 'Puxar assunto sobre o Flamengo', fn: async () => {
      f.bFla = true;
      await j.voce('E o Mengão, hein?');
      await j.fala('bernardo', 'Ah, o Mengão! É... aquele jogo de quarta, né? Foi bom. Teve gol.');
      await j.fala('bernardo', 'Ou foi domingo? Enfim. Isso aqui é Flamengo.');
      await j.narra('Bernardo concorda com tudo, mas o olho dele já está vagando pelo bar.');
      await j.fala('bernardo', 'Peraí. Por que a Alinne tá cochichando com o Seu Carlos?');
      await j.narra('Assunto errado. Ele é flamenguista, mas não tanto assim.');
    } },
    { t: 'Puxar assunto sobre o GTA 6', fn: async () => {
      await j.voce('E aí, já viu o GTA 6?');
      await j.fala('bernardo', 'GTA 6?! {nome}. Eu esperei TREZE ANOS por isso.');
      await j.fala('bernardo', 'Você viu o mapa? A praia? Eu vou zerar na primeira semana. Mentira, vou levar um ano.');
      f.distraido = true;
      copoBernardo(j);
      await j.narra('Bernardo saca o celular e mergulha num vídeo de gameplay. Uma bateria de escola de samba poderia passar aqui agora.');
      marcar(j, 'Bernardo distraído');
      return 'sair';
    } },
  ], 'Nada não, só vim dar um abraço');
}

async function falarCarlos(j) {
  const f = j.f, c = j.ent.carlos;
  if (!f.carlosViu) {
    await j.narra('Seu Carlos está anotando o pedido de outra mesa. Ele não te viu.');
    const r = await j.escolha([{ t: 'Acenar', v: 'a' }, { t: 'Gritar: "Garçom!"', v: 'g' }]);
    if (r === 'a') {
      await j.narra('Você acena. Seu Carlos acena de volta, simpático, e continua anotando.');
      await j.escolha([{ t: 'Acenar com as duas mãos', v: 'a2' }]);
      await j.fala('carlos', 'Opa! Fala, campeão!');
    } else {
      await j.fala('carlos', 'Já vai, campeão!');
      await j.espera(900);
      await j.fala('carlos', 'Pronto, campeão. Manda.');
    }
    f.carlosViu = true;
  } else {
    await j.fala('carlos', sorteio(['Fala, campeão!', 'Manda, campeão.', 'Opa! O que vai ser?']));
  }
  await menu(j, 'carlos', () => [
    { t: 'Quero pedir comida.', fn: () => pedirComida(j) },
    { t: 'Posso ver o cardápio?', fn: async () => {
      await j.fala('carlos', 'Claro, campeão. Tá aqui.');
      await j.abrirCardapio();
    } },
    f.polentaPedida && !f.polentaChegou && { t: 'Cadê minha polenta?', fn: async () => {
      f.cobrancas = (f.cobrancas || 0) + 1;
      const frases = ['Já vai, campeão!', 'Tá saindo, campeão!', 'Polenta boa demora, campeão. A cozinha tá caprichando.', 'Já vai! Já foi! Já tá indo!'];
      await j.fala('carlos', frases[(f.cobrancas - 1) % frases.length]);
      return 'sair';
    } },
    !f.copoCheio && { t: 'Um chopp pro Bernardo.', fn: async () => {
      await j.fala('carlos', 'Pro aniversariante? Sai na hora, campeão.');
      const b = j.ent.bernardo;
      const volta = { x: 452, y: 172 };
      j.foco = c;
      await encherNaChopeira(j, true);
      await j.andar(c, b.x + 14, b.y + 2);
      j.olhar(c, b);
      c.segurando = null;
      sfx.copo();
      f.copoCheio = true;
      copoBernardo(j);
      if (f.distraido) j.balao('carlos', 'Trocou o copo e ele nem viu.', 2200);
      else j.balao('bernardo', 'Opa, valeu, Seu Carlos!', 2200);
      await j.espera(1300);
      marcar(j, 'Copo do Bernardo cheio');
      await j.andar(c, volta.x, volta.y);
      c.face = -1;
      j.foco = null;
      return 'sair';
    } },
    !f.chopp && { t: 'Um chopp pra mim.', fn: async () => {
      await j.fala('carlos', 'Já vai, campeão!');
      const p = j.jogador;
      j.foco = c;
      await encherNaChopeira(j, true);
      await j.andar(c, p.x + (p.x < c.x ? 15 : -15), p.y);
      j.olhar(c, p); j.olhar(p, c);
      c.segurando = null;
      sfx.copo();
      f.chopp = true;
      f.bebeuT = j.t;
      p.copoT = null;
      if (!f.polenta) p.segurando = 'copoCheio';
      j.foco = null;
      await j.narra('Gelado, com colarinho. O Rio funciona.');
    } },
  ], 'Nada não, valeu.');
}

// O garçom vai até a chopeira, o copo aparece embaixo da torneira e enche.
async function encherNaChopeira(j, peloRoteiro = false) {
  const f = j.f, c = j.ent.carlos;
  const ok = await j.andar(c, 442, 165);
  if (!ok || f.festa || (!peloRoteiro && j.ocupado)) return false;
  c.face = -1;
  const marca = { t0: j.t, dono: peloRoteiro ? 'roteiro' : 'servico' };
  f.enchendo = marca;
  if (j.cenaAtual === 'corredor') sfx.chopeira();
  await j.espera(1900);
  if (f.enchendo === marca) f.enchendo = null;
  if (!peloRoteiro && (j.ocupado || f.festa)) return false;
  c.segurando = 'copoCheio';
  return true;
}

// Serviço de fundo: enche na chopeira e leva até quem pediu. Para se o convidado chamar o garçom.
async function servirChopp(j, alvo) {
  const f = j.f, c = j.ent.carlos;
  let entregou = false;
  try {
    if (!(await encherNaChopeira(j))) return;
    const lado = alvo.x > c.x ? -1 : 1;
    const ok = await j.andar(c, Math.max(14, Math.min(546, alvo.x + lado * 15)), Math.min(196, alvo.y + 2));
    if (!ok || f.festa) return;
    j.olhar(c, alvo);
    c.segurando = null;
    alvo.segurando = 'copoCheio';
    alvo.querChopp = false;
    alvo.copoT = 30000 + Math.random() * 30000;
    entregou = true;
    if (j.cenaAtual === 'corredor' && Math.abs(j.jogador.x - alvo.x) < 170) sfx.copo();
    j.balao('carlos', sorteio(['Tá na mão!', 'Gelado, campeão.', 'Já veio, campeão!']), 1600);
    await j.espera(900);
    if (!j.ocupado && !f.festa) {
      const ok2 = await j.andar(c, 452, 172);
      if (ok2) c.face = -1;
    }
  } finally {
    if (!entregou && c.segurando === 'copoCheio') c.segurando = null;
    if (f.enchendo && f.enchendo.dono === 'servico') f.enchendo = null;
    f.serv = null;
  }
}

const COMIDAS = [
  { id: 'polenta', t: 'Polenta frita', carlos: 'Uma polenta! Já vai, campeão.' },
  { id: 'galeto', t: 'Galeto na brasa', carlos: 'Galeto! O carro-chefe da casa. Já vai, campeão.',
    narra: 'Um galeto dourado chega cheirando a alho e some em minutos. Ninguém sabe quem comeu mais.' },
  { id: 'pao', t: 'Pão de alho', carlos: 'Pão de alho saindo!',
    narra: 'O pão de alho chega crocante. Agora você e o pão de alho têm o mesmo cheiro.' },
  { id: 'coracao', t: 'Coração de galinha', carlos: 'Coraçãozinho no espeto. Já vai!',
    narra: 'Os coraçõezinhos somem antes de esfriar. No Sat\'s eles não têm tempo de esfriar.' },
  { id: 'linguica', t: 'Linguiça na brasa', carlos: 'Linguiça! Boa pedida, campeão.',
    narra: 'A linguiça chega estalando. O Caramelo sentiu o cheiro lá da calçada.' },
];

async function pedirComida(j) {
  const f = j.f;
  await j.fala('carlos', 'Vai comer o quê, campeão?');
  const r = await j.escolha([
    ...COMIDAS.map((c) => ({ t: c.t, v: c.id })),
    { t: 'Deixa eu pensar.', v: null },
  ]);
  if (!r) return;
  const c = COMIDAS.find((x) => x.id === r);
  if (c.id === 'polenta') {
    if (f.polentaPedida && !f.polenta) { await j.fala('carlos', 'A sua polenta já tá saindo, campeão. Já vai!'); return 'sair'; }
    await j.fala('carlos', c.carlos);
    if (!f.polentaPedida) {
      f.polentaPedida = true;
      f.polentaT = j.t;
      f.polentaN = j.n.interacoes;
    } else {
      await j.narra('Mais uma polenta chega e desaparece. Essa não era o bolo.');
    }
    return 'sair';
  }
  await j.fala('carlos', c.carlos);
  if (f.missao && !f.polentaPedida) await j.fala('carlos', 'Ah, e se for pra vela ficar em pé, o ideal é polenta, viu?');
  await j.espera(500);
  await j.narra(c.narra);
  return 'sair';
}

async function ofertaSerjao(j) {
  const f = j.f, s = j.ent.serjao, p = j.jogador;
  f.serjaoOfereceu = true;
  j.balao('serjao', 'Ô, você aí!', 1500);
  const lado = p.x < s.x ? 1 : -1;
  await j.andar(s, p.x + lado * 18, p.y);
  j.olhar(s, p); j.olhar(p, s);
  await j.fala('serjao', 'Chegou mais um! Não sei seu nome, mas aqui todo mundo é de casa. Vai uma cachaça? É por conta da casa.');
  const r = await j.escolha([
    { t: 'Aceitar', v: 'sim' },
    { t: 'Recusar', v: 'nao' },
    { t: 'Quem é Serjão?', v: 'quem' },
  ]);
  if (r === 'sim') await aceitarCachaca(j);
  if (r === 'nao') {
    await j.fala('serjao', 'Recusar cachaça do Serjão... na casa do Serjão?');
    await j.fala('serjao', 'Tudo bem. Eu respeito. Não entendo, mas respeito.');
  }
  if (r === 'quem') {
    s.falando = false;
    await j.espera(700);
    await j.fala('serjao', '...Quem é Serjão?');
    await j.fala('serjao', 'Eu tô nesse balcão desde antes de você saber andar.');
    await j.fala('serjao', 'Tá vendo esse chopp? Essa polenta? Esse corredor? Tudo isso é Serjão.');
    sfx.triste();
    await j.narra('Serjão se afasta devagar, magoado, ajeitando o chapéu.');
    f.serjaoMagoado = true;
  }
  j.andar(s, 420, 184);
}

async function aceitarCachaca(j) {
  const f = j.f, p = j.jogador;
  const antes = p.segurando;
  p.segurando = 'dose';
  await j.fala('serjao', 'Isso aí! Essa aqui é da boa. Dizem que cura tudo, menos ressaca.');
  sfx.gole();
  await j.narra('Desce queimando e sobe sorrindo.');
  p.segurando = antes;
  f.cachaca = true;
  f.bebeuT = j.t;
}

async function falarSerjao(j) {
  const f = j.f;
  if (!f.serjaoOfereceu) return ofertaSerjao(j);
  if (f.serjaoMagoado && !f.serjaoPerdoou) {
    await j.fala('serjao', 'Ah, agora quer falar com o Serjão, né?');
    await j.fala('serjao', 'Tá bom. Uma cachaça pra fazer as pazes?');
    const r = await j.escolha([{ t: 'Aceitar', v: 'sim' }, { t: 'Pedir desculpas', v: 'desc' }]);
    if (r === 'sim') await aceitarCachaca(j);
    else await j.fala('serjao', 'Desculpa aceita. Mas a cachaça continua de pé, hein.');
    f.serjaoPerdoou = true;
    return;
  }
  await j.fala('serjao', sorteio([
    'Tá gostando? Essa casa tem história. Metade eu nem posso contar.',
    'O segredo do galeto? Amor, carvão e um pouco de cachaça. No cozinheiro.',
  ]));
  if (f.missao && !f.serjaoParabens) {
    const r = await j.escolha([{ t: 'Vai ter parabéns pro Bernardo!', v: 'p' }, { t: 'Valeu, Serjão.', v: 'x' }]);
    if (r === 'p') { f.serjaoParabens = true; await j.fala('serjao', 'Parabéns? Então depois tem cachaça pra todo mundo!'); }
  }
}

async function falarDudaOuJuninho(j) {
  const f = j.f, J = j.ent.juninho, D = j.ent.duda;
  if (!f.dudaLivre) {
    j.olhar(J, j.jogador);
    await j.fala('juninho', '{nome}!! Quanto tempo! Vem cá, vem cá.');
    await j.fala('juninho', 'E o trabalho? Tá onde agora?');
    const r1 = await j.escolha([
      { t: 'Tô no mesmo lugar.', v: 1 },
      { t: 'Mudei de emprego.', v: 2 },
      { t: 'Prefiro não falar de trabalho na sexta.', v: 3 },
    ]);
    await j.fala('juninho', ['', 'Mesmo lugar? Estabilidade! Admiro. Eu mudei três vezes esse ano.', 'Mudou? Pra onde? Paga bem? Tem vale-refeição? É home office?', 'Justo, justo. Mas e aí, o que você faz lá mesmo?'][r1]);
    await j.narra('Juninho dá um gole no chopp. O copo dele nunca esvazia.');
    await j.fala('juninho', 'E a família? Todo mundo bem? E a sua tia, aquela?');
    const r2 = await j.escolha([{ t: 'Todo mundo bem!', v: 1 }, { t: 'Que tia?', v: 2 }]);
    await j.fala('juninho', r2 === 1 ? 'Que bom, que bom. Manda um abraço pra ela.' : 'Aquela! Do aniversário! Você sabe quem.');
    await j.fala('juninho', 'E a vida, {nome}? Tá feliz? Onde você se vê daqui a cinco anos?');
    const r3 = await j.escolha([{ t: 'Aqui no Sat\'s.', v: 1 }, { t: 'Juninho, acho que o Serjão tá te chamando.', v: 2 }]);
    if (r3 === 1) {
      await j.fala('juninho', 'Hahaha! Melhor resposta. Mas falando sério, e o mestrado?');
      await j.escolha([{ t: 'Juninho, acho que o Serjão tá te chamando.', v: 2 }]);
    }
    await j.fala('juninho', 'O Serjão? Me chamando? Que honra!');
    j.andar(J, 470, 188).then(() => { J.face = -1; });
    f.dudaLivre = true;
    j.olhar(D, j.jogador);
    await j.espera(500);
    await j.fala('duda', '{nome}, você salvou a minha vida. Eu tava ali desde 2019.');
    if (f.missao) {
      await j.voce('Parabéns surpresa pro Bernardo. Tá dentro?');
      await j.fala('duda', 'Depois disso eu topo qualquer coisa. Bora!');
      f.amigos.duda = true;
      marcar(j, 'Duda avisada');
    } else {
      await j.fala('duda', 'Te devo uma. Me chama se precisar de qualquer coisa.');
    }
  }
}

async function falarDuda(j) {
  const f = j.f;
  if (!f.dudaLivre) return falarDudaOuJuninho(j);
  if (f.missao && !f.amigos.duda) {
    await j.voce('Duda, parabéns surpresa pro Bernardo. Tá dentro?');
    await j.fala('duda', 'Tô dentro! Eu puxo o coro.');
    f.amigos.duda = true;
    marcar(j, 'Duda avisada');
    return;
  }
  await j.fala('duda', 'Tô livre! Nunca mais paro perto do Juninho sem plano de fuga.');
}

async function falarJuninho(j) {
  const f = j.f;
  if (!f.dudaLivre) return falarDudaOuJuninho(j);
  await j.fala('juninho', '{nome}! E aquela viagem? Você foi?');
  const r = await j.escolha([{ t: 'Que viagem?', v: 1 }, { t: 'Juninho, o Serjão tá te chamando de novo.', v: 2 }]);
  if (r === 1) await j.fala('juninho', 'Ah, então não foi você. Enfim! E o trabalho?');
  else await j.fala('juninho', 'De novo? Esse Serjão não vive sem mim!');
}

async function falarRenatao(j) {
  const f = j.f, R = j.ent.renatao;
  if (f.amigos.renatao) {
    await j.fala('renatao', 'Fico até o parabéns. Depois vou embora. Juro.');
    return;
  }
  if (f.renataoSumiu && !f.renataoVisto) {
    f.renataoVisto = true;
    await j.voce('Ué, não tinha ido embora?');
    await j.fala('renatao', 'Encontrei um conhecido.');
  }
  await j.fala('renatao', sorteio(['{nome}! Tô indo nessa, viu? Amanhã acordo cedo.', 'Vou nessa, {nome}. Último chopp. Esse aqui é o último. Esse também.']));
  const r = await j.escolha([
    f.missao && { t: 'Fica pro parabéns do Bernardo!', v: 'fica' },
    { t: 'Vai com Deus, Renatão.', v: 'vai' },
  ]);
  if (r === 'fica') {
    await j.fala('renatao', 'Parabéns? Ah, então fico. Mas só até o parabéns. E talvez mais um chopp.');
    f.amigos.renatao = true;
    marcar(j, 'Renatão avisado');
    return;
  }
  await j.fala('renatao', 'Valeu! Tchau, galera! Agora vou mesmo.');
  f.renataoSumiu = true;
  f.renataoVisto = false;
  const saida = j.cenaAtual === 'corredor' ? 6 : 420;
  j.andar(R, saida, R.y).then(() => { if (!f.amigos.renatao) R.cena = null; });
}

async function falarCaio(j) {
  const f = j.f;
  if (!f.caioBelchior) {
    f.caioBelchior = true;
    await j.fala('caio', '{nome}, posso te fazer uma pergunta séria? Você já ouviu Belchior?');
    const r = await j.escolha([{ t: 'Já ouvi, sim.', v: 1 }, { t: 'Quem?', v: 2 }, { t: 'Prefiro pagode.', v: 3 }]);
    await j.fala('caio', ['', 'Ouviu ou ESCUTOU? Porque são coisas bem diferentes, {nome}.', '...Vou fingir que não ouvi isso. Pelo bem da nossa amizade.', 'Pagode também é resistência. Mas Belchior é conceito.'][r]);
    await j.fala('caio', 'Passa lá em casa depois. Tenho o vinil original, uma cerveja artesanal de goiaba e três horas de análise de letra.');
    const r2 = await j.escolha([{ t: 'Topo!', v: 1 }, { t: 'Vou pensar.', v: 2 }]);
    await j.fala('caio', r2 === 1 ? 'Sabia. Você tem cara de quem entende um disco de verdade.' : 'Pensar é o primeiro passo. O segundo é o vinil.');
    return;
  }
  if (f.missao && !f.caioParabens) {
    f.caioParabens = true;
    await j.voce('Vai ter parabéns surpresa pro Bernardo.');
    await j.fala('caio', 'Parabéns é uma construção social. Mas eu vou, claro.');
    return;
  }
  await j.fala('caio', sorteio(['O convite pro vinil continua de pé, {nome}.', 'Sabe o que falta nesse bar? Uma vitrola.']));
}

async function falarTorcedores(j) {
  const f = j.f;
  await j.fala('rafa', '{nome}! Resolve aqui pra gente.');
  await j.fala('beto', 'Não tem o que resolver. O Botafogo tá voando.');
  await j.fala('guto', 'Com todo o respeito, cavalheiros, tradição não se compra.');
  await menu(j, 'rafa', () => [
    !f.tMaior && { t: 'Quem tem a maior torcida?', fn: async () => {
      f.tMaior = true;
      await j.fala('rafa', 'Pergunta retórica, né?');
      await j.fala('beto', 'Torcida não ganha título, meu filho.');
      await j.fala('guto', 'Mas canta bonito. Isso eu reconheço.');
    } },
    !f.tSofre && { t: 'Quem sofre mais?', fn: async () => {
      f.tSofre = true;
      await j.fala('beto', 'Sofrer era a nossa especialidade. Agora a gente só comemora.');
      await j.fala('guto', 'O tricolor sofre com elegância. É diferente.');
      await j.fala('rafa', 'Flamenguista não sofre. Flamenguista se irrita.');
    } },
    !f.tBernardo && { t: 'O Bernardo é flamenguista, sabiam?', fn: async () => {
      f.tBernardo = true;
      await j.fala('rafa', 'Ele? Ele me perguntou ontem se o Zico ainda joga.');
      await j.fala('beto', 'Esse é o único flamenguista que eu respeito.');
    } },
  ], 'Só vou observar.');
  await j.fala('rafa', 'No fim das contas, isso aqui é Flamengo.');
  j.balao('beto', 'Começou...', 1800);
  j.balao('guto', 'Sempre isso.', 1800);
}

// objetos -------------------------------------------------------------------

async function usarBalde(j) {
  const f = j.f;
  if (!f.missao) return j.narra('Porta-guardanapo da mesa 18. Contém aproximadamente três guardanapos e 47 histórias.');
  if (!f.palito) {
    await j.narra('Você pega um palito de dente e enrola um guardanapo nele. Com um pouco de fé, isso é uma vela.');
    f.palito = true;
    sfx.item();
    ajustarPolenta(j);
    j.aviso('Palito de vela', 'pegar');
    return;
  }
  await j.narra('Sobraram dois guardanapos e 46 histórias. Uma delas agora é sua.');
}

async function usarPolentaMesa(j) {
  const f = j.f;
  await j.narra('Você pega a polenta com a delicadeza de um confeiteiro francês. Um bolo de três andares, só que deitado.');
  f.polenta = true;
  sfx.item();
  ajustarPolenta(j);
  marcar(j, 'Polenta: o bolo');
}

async function usarBanheiro(j) {
  const f = j.f;
  const est = j.estado;
  if (f.wc === 3) return j.narra('Banheiro livre. A moeda continua lá. Ninguém tem coragem de pegar.');
  if (!f.vontade) return j.narra('Banheiro. Não recomendamos investigar.');
  if (f.wc && j.n.interacoes <= f.wcN) return j.narra('Melhor dar uma volta antes de tentar de novo.');
  if (!f.wc) {
    sfx.bater();
    await j.espera(600);
    j.balaoEm('corredor', 518, 64, 'Ocupado!', 1600);
    await j.espera(1200);
    sfx.moedas();
    j.balaoEm('corredor', 518, 64, '*tlin tlin tlin*', 1500);
    await j.espera(1400);
    j.balaoEm('corredor', 518, 64, 'Só tô contando umas moedinhas aqui!', 2400);
    await j.espera(2300);
    j.balao('jogador', '...moedinhas?', 2000, true);
    await j.espera(1500);
    f.wc = 1;
    f.wcN = j.n.interacoes + 1;
    return;
  }
  if (f.wc === 1) {
    sfx.bater();
    await j.espera(500);
    sfx.moedas();
    j.balaoEm('corredor', 518, 64, 'Ainda ocupado! O papo aqui dentro tá bom demais.', 2400);
    await j.espera(2400);
    await j.narra('Pelo barulho, alguém está abrindo uma casa de câmbio lá dentro.');
    f.wc = 2;
    f.wcN = j.n.interacoes + 1;
    return;
  }
  sfx.porta();
  est.banheiroAberto = true;
  f.wc = 3;
  await j.espera(500);
  await j.narra('A porta abre. Não tem ninguém. Só uma moeda no chão, brilhando.');
  // entra, fecha a porta, xixi, descarga, sai
  const p = j.jogador;
  await j.andar(p, 518, 157);
  p.visivel = false;
  est.banheiroAberto = false;
  sfx.porta();
  await j.espera(800);
  sfx.xixi();
  j.balaoEm('corredor', 518, 64, '*psssssssss*', 2900);
  await j.espera(3100);
  sfx.descarga();
  j.balaoEm('corredor', 518, 64, '*chuááááá*', 1800);
  await j.espera(1900);
  sfx.porta();
  est.banheiroAberto = true;
  p.visivel = true;
  await j.andar(p, 518, 172);
  await j.narra('Alívio. A vida segue.');
  f.vontade = false;
}

// ---------------------------------------------------------------------------
// próximos passos (painel e dicas da Alinne)

function proximoPasso(j) {
  const f = j.f;
  if (f.alinneSaiu && !f.alinneVoltou) return { dica: 'A Alinne foi atrás do Caramelo na calçada. Traga ela de volta.', alinne: '' };
  if (!f.polentaPedida) return { dica: 'Peça uma polenta ao Seu Carlos, o garçom do fundo do corredor.', alinne: 'Começa pela polenta. O Seu Carlos tá lá no fundo, perto do bar.' };
  if (!f.polentaChegou) return { dica: 'A polenta já vai sair. Já vai, campeão. Enquanto isso, adiante outra coisa.', alinne: 'A polenta já foi pedida? Enquanto não chega, adianta o resto.' };
  if (!f.polenta) return { dica: 'A polenta chegou na mesa 18. Vá buscar.', alinne: 'A polenta tá na mesa 18! Pega antes do Caramelo.' };
  if (!f.palito) return { dica: 'Toda vela improvisada começa num porta-guardanapo. Olhe o da mesa 18.', alinne: 'Falta a vela. Um palito e um guardanapo resolvem, olha na mesa 18.' };
  if (!f.isqueiro) return { dica: f.leoSumiu && !f.leoVoltou ? 'O Léo sumiu. Ele sempre volta. Enquanto isso, adiante outra coisa.' : 'Alguém na rodinha da calçada deve ter fogo.', alinne: 'Falta fogo pra vela. A rodinha da calçada sempre tem um isqueiro.' };
  if (numAmigos(f) < 3) {
    const faltam = [!f.amigos.leo && 'o Léo, na calçada', !f.amigos.duda && 'a Duda, presa no papo do Juninho', !f.amigos.renatao && 'o Renatão, onde quer que ele esteja'].filter(Boolean);
    return { dica: 'Avise a galera: ' + faltam.join('; ') + '.', alinne: 'Falta chamar ' + faltam.join(' e ') + '.' };
  }
  if (!f.distraido) return { dica: 'Puxe assunto com o Bernardo. Escolha bem o assunto.', alinne: 'Agora distrai o Bernardo. E não fala de futebol, que ele se perde.' };
  if (!f.copoCheio) return { dica: 'O copo do Bernardo precisa estar cheio. O Seu Carlos resolve.', alinne: 'O copo dele tá vazio! Chama o Seu Carlos.' };
  return { dica: 'Tudo pronto! Fale com a Alinne para puxar o parabéns.', alinne: 'Tá tudo pronto?' };
}

// ---------------------------------------------------------------------------
// final

async function parabens(j) {
  const f = j.f;
  await j.fala('alinne', 'Polenta? Confere. Vela? Mais ou menos, mas confere. Galera? Confere.');
  await j.fala('alinne', 'Bernardo distraído e de copo cheio? Perfeito. {nome}, é com você.');
  await j.escolha([{ t: 'Puxar o parabéns!', v: 1 }]);
  f.festa = true;
  await j.fade(1, 500);
  const E = j.ent, p = j.jogador;
  const pos = {
    bernardo: [262, 172, 1], alinne: [286, 174, -1], caio: [214, 175, 1], beto: [196, 186, 1], leo: [232, 186, 1],
    rafa: [246, 192, 1], duda: [318, 184, -1], renatao: [336, 176, -1], guto: [306, 193, -1], serjao: [352, 186, -1],
    carlos: [368, 172, -1], tati: [178, 190, 1], bia: [224, 194, 1], juninho: [382, 182, -1], caramelo: [276, 194, 1],
  };
  for (const [id, [x, y, face]] of Object.entries(pos)) {
    const e = E[id];
    if (!e) continue;
    e.cena = 'corredor'; e.visivel = true; e.x = x; e.y = y; e.face = face; e.alvo = null; e.pose = null; e.balaoTxt = null;
  }
  p.x = 298; p.y = 184; p.face = -1; p.alvo = null;
  p.segurando = 'polentaVela';
  E.bernardo.segurando = 'celular'; E.bernardo.pose = 'peito';
  j.foco = E.bernardo;
  j.camCentro = 270;
  j.camX = j.alvoCamera();
  await j.fade(0, 500);
  j.balao('alinne', 'Bernardo! Olha pra cá!', 1800);
  await j.espera(1500);
  E.bernardo.pose = null; E.bernardo.segurando = 'copoCheio';
  j.balao('bernardo', 'Hã? O quê? ...GENTE!', 1800);
  await j.espera(1300);
  sfx.isqueiro();
  f.velaAcesa = true;
  await j.espera(500);
  const dur = sfx.parabens() * 1000;
  j.confete(270, 40, 90);
  for (const id of Object.keys(pos)) if (E[id] && !E[id].sprite.dog) E[id].pose = 'alto';
  E.caramelo.pose = 'feliz';
  p.pose = null;
  const coro = [['duda', '♪ Parabéns! ♪'], ['leo', '♪ ♪ ♪'], ['renatao', 'Ê, BERNARDO!'], ['rafa', '♪ ♪'], ['serjao', '♪ Viva o Bernardo! ♪'], ['tati', 'Discurso!'], ['beto', 'Rá-tim-bum!']];
  const passo = dur / coro.length;
  for (const [id, txt] of coro) { j.balao(id, txt, passo * 0.9); await j.espera(passo); }
  sfx.latido();
  j.confete(270, 30, 60);
  for (const id of Object.keys(pos)) if (E[id] && !E[id].sprite.dog) E[id].pose = null;
  E.caramelo.pose = 'senta';
  await j.espera(500);
  await j.fala('bernardo', 'Uma polenta com um palito. É o melhor bolo da minha vida.');
  await j.fala('alinne', 'Quem fez tudo acontecer foi {nome}. Eu só fiz carinho no Caramelo.');
  await j.fala('bernardo', 'Valeu, {nome}! Agora alguém me explica o GTA 6 de novo, que eu perdi o fio.');
  await j.fala('serjao', 'Rodada de cachaça por conta da casa! Da minha casa!');
  await j.narra('Caramelo comeu um pedaço da polenta. Ninguém viu. Todo mundo viu.');
  await j.fade(1, 600);
  j.tela = 'convite';
  j.convite = { etapa: 'pergunta' };
  await j.fade(0, 500);
}

// ---------------------------------------------------------------------------

export const roteiro = {
  preparar(j) {
    const f = j.f;
    Object.assign(f, { amigos: {} });
    const c = (id, cena, x, y, face, usar, extra = {}) => j.criar(id, { cena, x, y, face, usar, ...extra });

    // calçada
    c('leo', 'calcada', 132, 178, 1, falarLeo);
    c('bia', 'calcada', 152, 176, -1, falarBia);
    c('tati', 'calcada', 96, 184, 1, falarTati);
    c('caramelo', 'calcada', 236, 188, -1, falarCaramelo, { vel: 28 });
    // corredor
    c('bernardo', 'corredor', 262, 170, 1, falarBernardo, { fixoFace: true });
    c('alinne', 'corredor', 284, 171, -1, falarAlinne, { fixoFace: true });
    c('rafa', 'corredor', 146, 176, 1, falarTorcedores, { fixoFace: true });
    c('beto', 'corredor', 164, 181, -1, falarTorcedores, { fixoFace: true });
    c('guto', 'corredor', 180, 174, -1, falarTorcedores, { fixoFace: true });
    c('caio', 'corredor', 234, 186, -1, falarCaio);
    c('juninho', 'corredor', 346, 178, 1, falarJuninho, { fixoFace: true });
    c('duda', 'corredor', 364, 179, -1, falarDuda, { fixoFace: true });
    c('renatao', 'corredor', 44, 182, 1, falarRenatao, { vel: 45 });
    c('serjao', 'corredor', 420, 186, -1, falarSerjao, { vel: 38 });
    c('carlos', 'corredor', 452, 172, -1, falarCarlos, { vel: 55 });
    j.ent.bernardo.segurando = 'copoMetade';
    j.ent.juninho.segurando = 'copoCheio';
    j.ent.rafa.segurando = 'copoMetade';
    j.ent.beto.segurando = 'copoCheio';
    j.ent.guto.segurando = 'copoMetade';
    j.ent.duda.segurando = 'copoMetade';
    j.ent.renatao.segurando = 'copoCheio';
    this.frequentadores(j);

    const O = (o) => j.objetos.push(o);
    // calçada
    O({ id: 'portao', cena: 'calcada', nome: 'Portão do Sat\'s', papel: 'Entrada do corredor', acao: 'ir', rect: { x: 256, y: 96, w: 30, h: 70 }, ir: { x: 280, y: 178 },
      usar: (j2) => j2.irPara('corredor', 26, 182, 1) });
    O({ id: 'letreiro', cena: 'calcada', nome: 'Letreiro', papel: 'Galeto Sat\'s', rect: { x: 266, y: 62, w: 48, h: 30 }, ir: { x: 292, y: 176 },
      usar: (j2) => j2.narra('Galeto Sat\'s, Botafogo. Um letreiro que já viu mais aniversários do que qualquer bolo.') });
    O({ id: 'janela', cena: 'calcada', nome: 'Janela do salão', rect: { x: 164, y: 104, w: 30, h: 46 }, ir: { x: 180, y: 176 },
      usar: (j2) => j2.narra('Lá dentro, o salão principal. Hoje a noite é no corredor.') });
    O({ id: 'numero', cena: 'calcada', nome: 'Número 212', rect: { x: 220, y: 132, w: 22, h: 12 }, ir: { x: 230, y: 176 },
      usar: (j2) => j2.narra('Rua Real Grandeza, 212. Anote, caso o GPS resolva brincar com você na sexta.') });
    O({ id: 'arvore', cena: 'calcada', nome: 'Amendoeira', rect: { x: 4, y: 0, w: 60, h: 40 }, ir: { x: 30, y: 176 },
      usar: (j2) => j2.narra('Uma amendoeira carioca. Já viu de tudo e não conta nada pra ninguém.') });
    // corredor
    O({ id: 'saida', cena: 'corredor', nome: 'Calçada', papel: 'Voltar para a rua', acao: 'ir', rect: { x: 0, y: 40, w: 30, h: 126 }, ir: { x: 14, y: 182 },
      usar: (j2) => j2.irPara('calcada', 278, 182, -1) });
    O({ id: 'espelho', cena: 'corredor', nome: 'Espelho', rect: { x: 96, y: 60, w: 70, h: 32 }, ir: { x: 128, y: 168 },
      usar: (j2) => j2.narra('Você parece alguém que deveria estar trabalhando amanhã.') });
    O({ id: 'balde', cena: 'corredor', nome: 'Porta-guardanapo', papel: 'Mesa 18', acao: 'pegar', rect: { x: 196, y: 127, w: 10, h: 13 }, ir: { x: 190, y: 172 }, face: 1, prioridade: 300,
      usar: usarBalde });
    O({ id: 'mesa', cena: 'corredor', nome: 'Mesa 18', papel: 'Mesa bamba', rect: { x: 197, y: 140, w: 19, h: 28 }, ir: { x: 194, y: 172 }, face: 1, yProf: MESA.y,
      usar: (j2) => j2.narra('Mesa bamba. A engenharia civil ainda não chegou até aqui.'),
      desenhar: desenharMesa, sempreVisivel: true });
    O({ id: 'polentaMesa', cena: 'corredor', nome: 'Polenta', papel: 'O bolo do Bernardo', acao: 'pegar', rect: { x: 205, y: 128, w: 13, h: 12 }, ir: { x: 194, y: 172 }, face: 1, prioridade: 400,
      ativo: (j2) => j2.f.polentaChegou && !j2.f.polenta, usar: usarPolentaMesa });
    O({ id: 'banheiro', cena: 'corredor', nome: (j2) => j2.f.vontade ? 'Banheiro (urgente)' : 'Banheiro', acao: 'olhar', rect: { x: 500, y: 60, w: 36, h: 92 }, ir: { x: 518, y: 168 },
      usar: usarBanheiro });
    O({ id: 'moeda', cena: 'corredor', nome: 'Moeda', rect: { x: 512, y: 152, w: 7, h: 6 }, ir: { x: 520, y: 170 }, prioridade: 500,
      ativo: (j2) => j2.f.wc === 3, usar: (j2) => j2.narra('Uma moeda solitária. O Brasil inteiro conhece essa história.') });
    O({ id: 'tv', cena: 'corredor', nome: 'TV', rect: { x: 336, y: 26, w: 36, h: 24 }, ir: { x: 354, y: 168 },
      usar: async (j2) => {
        sfx.apito();
        await j2.espera(700);
        await j2.narra('Está passando um jogo. Ninguém sabe de quando, nem de quem. Todo mundo opina mesmo assim.');
      } });
    O({ id: 'lustre', cena: 'corredor', nome: 'Lustre de isoladores', rect: { x: 426, y: 26, w: 40, h: 24 }, ir: { x: 446, y: 170 },
      usar: (j2) => j2.narra('Um lustre feito de isoladores de vidro de poste. Alguém olhou pra um poste e pensou: decoração.') });
    O({ id: 'chopeira', cena: 'corredor', nome: 'Chopeira', rect: { x: 434, y: 86, w: 16, h: 22 }, ir: { x: 440, y: 168 },
      usar: (j2) => j2.narra('A chopeira. O coração do Sat\'s. Bate gelado.') });
    O({ id: 'barril', cena: 'corredor', nome: 'Banquinho de barril', rect: { x: 100, y: 132, w: 13, h: 26 }, ir: { x: 106, y: 168 },
      usar: (j2) => j2.narra('Um barril de chopp com almofada vermelha. Reciclagem com propósito.') });
  },

  frequentadores(j) {
    const idx = LUZ_IDX[j.luz] ?? 1;
    for (const fr of FREQUENTADORES) {
      if (j.ent[fr.id]) delete j.ent[fr.id];
      if (fr.desde > idx) continue;
      j.criar(fr.id, { look: fr.look, cena: fr.cena, x: fr.x, y: fr.y, face: fr.face, clicavel: false });
      if (fr.id === 'f2' || fr.id === 'f5') j.ent[fr.id].segurando = 'copoMetade';
    }
  },

  async comecar(j) {
    const p = j.criar('jogador', { look: j.dados.look || AVATARES[j.dados.avatar || 0], cena: 'calcada', x: 30, y: 184, face: 1, vel: 72, clicavel: false });
    p.nome = j.dados.primeiro; p.papel = 'Você';
    j.jogador = p;
    this.frequentadores(j);
    j.cenaAtual = 'calcada';
    j.camX = 0;
    j.tela = 'jogo';
    iniciarSom();
    setLugar('rua');
    await j.fade(0, 500);
    j.rodar(async () => {
      const ch = j.dados.chegada;
      await j.narra(`Sexta-feira, ${ch ? ch.carioca : '20h'}. Galeto Sat's, Botafogo. O aniversário do Bernardo já começou.`);
      j.balao('leo', 'Olha quem chegou!', 1600);
      await j.espera(900);
      await j.fala('leo', '{nome}! Chegou no horário carioca, que é o horário certo.');
      await j.fala('leo', 'O Bernardo e a Alinne tão lá dentro, no corredor. É só entrar pelo portão.');
      const verbo = window.matchMedia('(pointer: coarse)').matches ? 'Toque' : 'Clique';
      await j.narra(`${verbo} no chão para andar e nas pessoas e coisas para interagir. A lupa, no canto de cima, mostra tudo o que dá para ${verbo === 'Toque' ? 'tocar' : 'clicar'}.`);
    });
  },

  aoEntrar(j, cena) {
    setLugar(cena === 'corredor' ? 'bar' : 'rua');
    const f = j.f, R = j.ent.renatao;
    if (cena === 'corredor') f.entrouCorredor = true;
    // o amigo que nunca vai embora reaparece onde você estiver
    if (R && R.cena === null && !f.amigos.renatao && f.renataoSumiu) {
      const spots = { calcada: [[330, 182], [70, 186]], corredor: [[386, 184], [108, 186], [470, 184]] };
      f.renataoHop = (f.renataoHop || 0) + 1;
      const lista = spots[cena];
      const [x, y] = lista[f.renataoHop % lista.length];
      R.cena = cena; R.x = x; R.y = y; R.face = -1; R.alvo = null;
      f.renataoVisto = false;
      setTimeout(() => {
        j.balao('jogador', 'Ué, não tinha ido embora?', 2200, true);
        setTimeout(() => j.balao('renatao', sorteio(['Encontrei um conhecido.', 'Saideira. A última. Juro.', 'Tô indo! Só mais esse.']), 2400), 1300);
      }, 700);
    }
  },

  atualizar(j, dt) {
    const f = j.f, E = j.ent;
    if (!j.jogador) return;
    const livre = !j.ocupado && !j.dialogo && j.fadeA === 0 && !j.pendente && !f.festa;
    if (j.cenaAtual === 'corredor') f.tCorredor = (f.tCorredor || 0) + dt;
    f.tJogo = (f.tJogo || 0) + dt;

    // polenta fica pronta
    if (f.polentaPedida && !f.polentaChegou && j.t - f.polentaT > 16000 && j.n.interacoes > f.polentaN) {
      f.polentaChegou = true;
      sfx.copo();
      if (j.cenaAtual === 'corredor') j.balao('carlos', 'Polenta na mesa 18, campeão!', 2600);
      else j.aviso('A polenta chegou na mesa 18', 'pegar');
    }
    // Léo volta de "ali"
    if (f.leoSumiu && !f.leoVoltou && j.t - f.leoT > 22000) {
      f.leoVoltou = true;
      const L = E.leo;
      L.visivel = true; L.x = 132; L.y = 178; L.face = 1; L.alvo = null;
      if (j.cenaAtual === 'calcada') j.balao('leo', 'Voltei. Perdi alguma coisa?', 2400);
    }
    // copo do Bernardo seca
    if (f.missao && !f.copoSecou && !f.copoCheio && j.t - f.missaoT > 25000) { f.copoSecou = true; copoBernardo(j); }
    // vontade de ir ao banheiro
    if (livre && !f.vontade && !f.wc && j.cenaAtual === 'corredor' &&
      ((f.bebeuT && j.t - f.bebeuT > 9000) || f.tCorredor > 130000)) {
      f.vontade = true;
      j.balao('jogador', 'Hmm... preciso ir ao banheiro.', 2600, true);
    }
    // Serjão vem oferecer cachaça, já com a missão andando (ou depois de um bom tempo no bar)
    const horaDoSerjao = (f.missao && progresso(f) >= 3 && j.t - (f.alinneSaiuT || 0) > 15000) || f.tCorredor > 150000;
    if (livre && !f.serjaoOfereceu && j.cenaAtual === 'corredor' && horaDoSerjao && !E.carlos.alvo) {
      j.rodar(ofertaSerjao);
      return;
    }
    // Alinne vai atrás do Caramelo
    if (livre && f.missao && !f.alinneSaiu && progresso(f) >= 2 && j.cenaAtual === 'corredor') {
      f.alinneSaiu = true;
      f.alinneSaiuT = j.t;
      j.rodar(async () => {
        const A = E.alinne;
        sfx.latido();
        await j.espera(500);
        j.balao('alinne', 'Esse latido... É O CARAMELO!', 2000);
        await j.espera(1600);
        j.foco = A;
        A.vel = 70;
        await j.andar(A, 4, 182);
        A.cena = 'calcada'; A.x = 222; A.y = 188; A.face = 1; A.pose = 'agachada';
        const C2 = E.caramelo;
        C2.alvo = null; C2.chegou = null; C2.x = 246; C2.y = 188; C2.face = -1; C2.pose = 'senta';
        j.foco = null;
        j.aviso('A Alinne foi atrás do Caramelo', 'ir');
      });
      return;
    }
    // Caramelo tenta pegar a polenta
    if (livre && j.cenaAtual === 'calcada' && f.polenta && !f.carameloTentou && !(f.alinneSaiu && !f.alinneVoltou)) {
      const C2 = E.caramelo, p = j.jogador;
      if (Math.abs(C2.x - p.x) < 70) {
        f.carameloTentou = true;
        j.rodar(async () => {
          C2.pose = null;
          await j.andar(C2, p.x + (p.x < C2.x ? 16 : -16), p.y + 1);
          j.olhar(C2, p);
          C2.pose = 'pede';
          sfx.latido();
          await j.narra('Caramelo olha pra polenta. A polenta olha pro Caramelo.');
          const r = await j.escolha([{ t: 'Fazer carinho', v: 1 }, { t: 'Proteger a polenta', v: 2 }]);
          if (r === 1) await j.narra('Enquanto você faz carinho, um pedacinho de polenta some misteriosamente. Caramelo não sabe de nada.');
          else await j.narra('Você ergue a polenta como um troféu. Caramelo aceita a derrota com dignidade. Por enquanto.');
          C2.pose = null;
        });
        return;
      }
    }
    // Caramelo passeia pela calçada
    const C2 = E.caramelo;
    if (C2.cena === 'calcada' && !(f.alinneSaiu && !f.alinneVoltou) && !j.ocupado && !C2.alvo && j.t > (f.caraT || 0)) {
      f.caraT = j.t + 2500 + Math.random() * 4500;
      if (Math.random() < 0.35) C2.pose = 'senta';
      else {
        C2.pose = null;
        j.andar(C2, 170 + Math.random() * 150, 184 + Math.random() * 8);
      }
    }
    // Serjão circula
    const S = E.serjao;
    if (f.serjaoOfereceu && !j.ocupado && !S.alvo && S.cena === 'corredor' && j.t > (f.serjaoT || 0)) {
      f.serjaoT = j.t + 5000 + Math.random() * 5000;
      j.andar(S, 380 + Math.random() * 90, 180 + Math.random() * 12);
    }
    // copos esvaziando e o garçom servindo
    this.copos(j, dt);
    // conversas de fundo (balões)
    this.baloesAmbiente(j);
  },

  copos(j, dt) {
    const f = j.f, E = j.ent;
    if (f.festa) return;
    const BEBEDORES = ['rafa', 'beto', 'guto', 'renatao', 'f2', 'f5', 'duda'];
    for (const id of [...BEBEDORES, 'jogador']) {
      const e = E[id];
      if (!e || e.cena !== 'corredor' || !e.visivel || !e.segurando || !e.segurando.startsWith('copo')) continue;
      if (id === 'duda' && !f.dudaLivre) continue;
      if (e.goleAte && j.t > e.goleAte) { e.pose = null; e.goleAte = 0; }
      if (e.querChopp || e.alvo) continue;
      e.copoT = (e.copoT ?? 12000 + Math.random() * 40000) - dt;
      if (e.copoT > 0) continue;
      // um gole
      if (!e.pose) { e.pose = 'peito'; e.goleAte = j.t + 800; }
      if (e.segurando === 'copoCheio') {
        e.segurando = 'copoMetade';
        e.copoT = 30000 + Math.random() * 30000;
      } else if (e.segurando === 'copoMetade') {
        e.segurando = 'copoVazio';
        if (id === 'jogador') { f.chopp = false; continue; }
        e.querChopp = true;
        if (j.cenaAtual === 'corredor') j.balao(id, sorteio(['Seu Carlos!', 'Desce mais um!', 'Mais um, por favor!', 'Garçom!']), 2000);
      }
    }
    // o garçom vai até quem está com o copo vazio
    const c = E.carlos;
    if (f.serv || j.ocupado || c.alvo || c.cena !== 'corredor') return;
    const alvo = BEBEDORES.map((id) => E[id]).find((e) => e && e.querChopp && e.cena === 'corredor' && e.visivel);
    if (!alvo) {
      if (Math.hypot(c.x - 452, c.y - 172) > 4) j.andar(c, 452, 172).then((ok) => { if (ok) c.face = -1; });
      return;
    }
    f.serv = alvo.id;
    servirChopp(j, alvo);
  },

  baloesAmbiente(j) {
    const f = j.f, E = j.ent;
    if (j.ocupado || j.dialogo || f.festa) return;
    if (j.t < (f.ambT || 0)) return;
    f.ambT = j.t + 3800;
    const px = j.jogador.x;
    const op = [];
    if (j.cenaAtual === 'corredor') {
      if (Math.abs(px - 165) < 130) {
        const linhas = [['beto', 'Esse ano é nosso de novo, aceitem.'], ['guto', 'Tradição não se compra, meu caro.'], ['rafa', 'Isso aqui é Flamengo.'], ['beto', 'Pergunta pra América do Sul.'], ['guto', 'Pó de arroz é estilo de vida.'], ['rafa', 'Maior torcida do mundo, irmão.']];
        f.torcIdx = ((f.torcIdx ?? -1) + 1) % linhas.length;
        op.push(linhas[f.torcIdx]);
      }
      if (!f.dudaLivre && Math.abs(px - 347) < 140) op.push(sorteio([['juninho', 'E o trabalho?'], ['juninho', 'E a família?'], ['juninho', 'E o mestrado?'], ['duda', '...socorro']]));
      if (f.distraido && !f.festa) op.push(['bernardo', sorteio(['Olha esse gráfico...', 'Treze anos!', 'Que mapa!'])]);
      else if (f.copoSecou && !f.copoCheio) op.push(['bernardo', 'Cadê meu chopp?']);
      if (!f.renataoSumiu && E.renatao.cena === 'corredor' && Math.abs(px - E.renatao.x) < 120) op.push(['renatao', 'Galera, vou nessa!']);
      if (Math.random() < 0.3) op.push(['carlos', 'Já vai!']);
    } else {
      if (f.alinneSaiu && !f.alinneVoltou) op.push(['alinne', sorteio(['Quem é o bebê mais lindo dessa calçada?', 'É você! É VOCÊ!', 'Que orelhinha!'])]);
      else if (Math.random() < 0.25) { op.push(['caramelo', 'Au!']); }
      if (!f.leoSumiu || f.leoVoltou) op.push(sorteio([['bia', 'E aí, a gente entra ou não?'], ['leo', 'Ninguém tem um isqueiro?'], ['tati', 'Essa calçada é minha sala de estar.']]));
    }
    if (!op.length) return;
    const [id, txt] = sorteio(op);
    const e = E[id];
    if (!e || e.cena !== j.cenaAtual || !e.visivel) return;
    if (id === 'caramelo') sfx.latido();
    j.balao(id, txt, 2600, txt === '...socorro');
  },

  painel(j) {
    const f = j.f;
    if (f.festa) return null;
    if (!f.missao) {
      return {
        titulo: 'SEXTA À NOITE NO SAT\'S',
        itens: [],
        dica: j.cenaAtual === 'calcada' && !f.entrouCorredor
          ? 'Entre pelo portão do Sat\'s e procure a Alinne no corredor.'
          : 'Fale com a Alinne. Ela está no balcão, ao lado do Bernardo.',
      };
    }
    const n = numAmigos(f);
    const itens = [
      { texto: 'Polenta (o bolo)', feito: !!f.polenta },
      { texto: 'Vela: palito', feito: !!f.palito },
      { texto: 'Vela: fogo', feito: !!f.isqueiro },
      { texto: `Galera avisada (${n}/3)`, feito: n === 3 },
      { texto: 'Bernardo distraído', feito: !!f.distraido },
      { texto: 'Copo do Bernardo cheio', feito: !!f.copoCheio },
    ];
    if (f.alinneSaiu) itens.push({ texto: 'Trazer a Alinne de volta', feito: !!f.alinneVoltou });
    let dica = proximoPasso(j).dica;
    if (f.vontade && f.wc !== 3) dica += ' (E você precisa ir ao banheiro.)';
    return { titulo: 'OPERAÇÃO PARABÉNS', itens, dica };
  },

  props(j) {
    const f = j.f;
    const out = [];
    if (f.polentaChegou && !f.polenta) out.push({ cena: 'corredor', y: MESA.y + 0.5, desenhar: (g) => g.drawImage(ITENS.polenta.cv, MESA.x - 1, MESA.y - 41) });
    if (f.wc === 3) out.push({ cena: 'corredor', y: 157, desenhar: (g, j2, t) => { g.drawImage(ITENS.moeda.cv, 512, 152); if (Math.floor(t / 400) % 3 === 0) { g.fillStyle = '#fffbe0'; g.fillRect(516, 151, 1, 1); } } });
    // copo enchendo embaixo da torneira da chopeira
    if (f.enchendo) {
      const p = Math.min(1, (j.t - f.enchendo.t0) / 1700);
      out.push({ cena: 'corredor', y: 110, desenhar: (g) => desenharCopoNaChopeira(g, p) });
    }
    // chama da vela na festa
    if (f.velaAcesa) {
      const p = j.jogador;
      p.segurando = Math.floor(j.t / 150) % 2 ? 'polentaAcesa1' : 'polentaAcesa2';
    }
    return out;
  },
};

function desenharCopoNaChopeira(g, p) {
  const x = 434, y = 99; // copo de 5x9 em cima do balcão de mármore, embaixo da torneira
  const px = (cx, cy, w, h, c) => { g.fillStyle = c; g.fillRect(cx, cy, w, h); };
  px(x, y, 1, 9, '#2a1a1f'); px(x + 6, y, 1, 9, '#2a1a1f'); px(x, y + 9, 7, 1, '#2a1a1f');
  px(x + 1, y, 5, 9, '#e9f1f2');
  const cheio = Math.round(p * 8);
  if (cheio > 0) px(x + 1, y + 9 - cheio, 5, cheio, '#e8a33a');
  if (cheio > 1) px(x + 2, y + 9 - cheio + 1, 1, cheio - 1, '#f4c66a');
  if (p > 0.55) {
    const espuma = p > 0.9 ? 2 : 1;
    px(x + 1, y + 9 - cheio - espuma + 1, 5, espuma, '#fbf6ea');
  }
  // fio de chopp saindo da torneira
  if (p < 1) px(x + 3, 94, 1, Math.max(1, y + 9 - cheio - 94), '#f0b04a');
}

function desenharMesa(g) {
  const { x, y } = MESA;
  g.fillStyle = 'rgba(20,10,14,0.28)'; g.fillRect(x - 7, y + 1, 15, 2);
  g.fillStyle = '#1d1c22'; g.fillRect(x - 5, y - 1, 11, 2);
  g.fillStyle = '#2a2a30'; g.fillRect(x - 1, y - 26, 2, 25);
  g.fillStyle = '#4e2d1b'; g.fillRect(x - 9, y - 28, 19, 3);
  g.fillStyle = '#7a4a2c'; g.fillRect(x - 9, y - 29, 19, 2);
  g.fillStyle = '#9c6538'; g.fillRect(x - 9, y - 29, 19, 1);
  // baldinho vermelho com guardanapo e o número 18
  const bx = x - 9;
  g.fillStyle = '#2a1a1f'; g.fillRect(bx, y - 37, 9, 8);
  g.fillStyle = '#c8322e'; g.fillRect(bx + 1, y - 36, 7, 7);
  g.fillStyle = '#e0524a'; g.fillRect(bx + 1, y - 36, 7, 1);
  g.fillStyle = '#f6f2e8'; g.fillRect(bx + 2, y - 40, 5, 4); g.fillRect(bx + 4, y - 41, 2, 1);
  g.fillStyle = '#ffffff'; g.fillRect(bx + 2, y - 34, 1, 3); g.fillRect(bx + 4, y - 34, 3, 1); g.fillRect(bx + 4, y - 32, 3, 1); g.fillRect(bx + 4, y - 33, 1, 1); g.fillRect(bx + 6, y - 33, 1, 1);
}

export function criarJogador(look) { return buildCharacter(look); }
