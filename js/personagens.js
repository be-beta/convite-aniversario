// Visual de cada personagem. Para ajustar alguém, mude as propriedades aqui.
// pele: 0 (mais clara) a 5 (mais escura)
// cabelo: raspado, curto, longo, ondulado, cacheado, black, coque, rabo, trancas, chanel, calvo, careca
// blusa: camiseta, botao, regata, vestido, listrada, florida, fla, bota, flu
// baixo: calca, short, pantalona, saia | sapato: tenis, sapato, chinelo
// mobilidade: cadeira, muletas, bengala, protese

export const ELENCO = {
  bernardo: {
    nome: 'Bernardo', papel: 'Aniversariante',
    look: {
      pele: 1, cabelo: 'raspado', corCabelo: 'preto', barba: 'curta', oculos: 'redondo',
      chapeu: 'festa', blusa: 'camiseta', corBlusa: '#f4f1ea', baixo: 'short', corBaixo: '#34405a',
      sapato: 'tenis', corSapato: '#f4f1ea', meia: '#f4f1ea',
    },
  },
  alinne: {
    nome: 'Alinne', papel: 'Personagem principal',
    look: {
      pele: 0, cabelo: 'ondulado', corCabelo: 'louro', chapeu: 'festa', rubor: true,
      blusa: 'botao', corBlusa: '#f4f1ea', baixo: 'pantalona', corBaixo: '#c8322e',
      sapato: 'tenis', corSapato: '#f4f1ea', corpo: 'magro', brinco: '#f2c14e',
    },
  },
  serjao: {
    nome: 'Serjão', papel: 'Dono do bar',
    look: {
      pele: 2, cabelo: 'calvo', corCabelo: 'branco', barba: 'cheia', corBarba: 'branco',
      oculos: 'quadrado', corOculos: '#8a7f70', chapeu: 'panama',
      blusa: 'botao', corBlusa: '#9cc3e4', baixo: 'calca', corBaixo: '#bfae88',
      sapato: 'sapato', corSapato: '#5a3a24', corpo: 'largo', barriga: true,
    },
  },
  carlos: {
    nome: 'Seu Carlos', papel: 'Garçom',
    look: {
      pele: 1, cabelo: 'curto', corCabelo: 'grisalho', oculos: 'quadrado',
      blusa: 'botao', corBlusa: '#f4f1ea', avental: '#1d1c22', baixo: 'calca', corBaixo: '#25242a',
      sapato: 'sapato', corSapato: '#1d1c22',
    },
  },
  caramelo: { nome: 'Caramelo', papel: 'Mascote da calçada', cachorro: true },
  leo: {
    nome: 'Léo da Calçada', papel: 'Amigo da rodinha',
    look: {
      pele: 3, cabelo: 'cacheado', corCabelo: 'castanho', barba: 'bigode',
      blusa: 'regata', corBlusa: '#f2c14e', baixo: 'short', corBaixo: '#5a7a9a',
      sapato: 'chinelo', corSapato: '#3a7a3a',
    },
  },
  tati: {
    nome: 'Tati', papel: 'Amiga da rodinha',
    look: {
      pele: 4, cabelo: 'trancas', corCabelo: 'preto', mobilidade: 'cadeira',
      blusa: 'camiseta', corBlusa: '#4f8a5a', baixo: 'calca', corBaixo: '#3b5b8c',
      sapato: 'tenis', corSapato: '#e8e2d4', brinco: '#f2c14e',
    },
  },
  bia: {
    nome: 'Bia', papel: 'Amiga da rodinha',
    look: {
      pele: 2, cabelo: 'chanel', corCabelo: 'rosa', blusa: 'camiseta', corBlusa: '#2a2a30',
      baixo: 'saia', corBaixo: '#7a5aa0', sapato: 'tenis', corSapato: '#f4f1ea', corpo: 'magro',
    },
  },
  caio: {
    nome: 'Caio do Vinil', papel: 'Esquerdomacho do Belchior',
    look: {
      pele: 1, cabelo: 'cacheado', corCabelo: 'castanho', barba: 'bigode', oculos: 'redondo', corOculos: '#8a6a3a',
      blusa: 'botao', corBlusa: '#d8c8a0', baixo: 'calca', corBaixo: '#6b4a32',
      sapato: 'sapato', corSapato: '#4a2d1b', corpo: 'magro', altura: 'alto',
    },
  },
  renatao: {
    nome: 'Renatão', papel: 'Amigo que nunca vai embora',
    look: {
      pele: 4, cabelo: 'careca', chapeu: 'bone', corChapeu: '#3a5a9a', barba: 'curta',
      blusa: 'camiseta', corBlusa: '#8a8f96', baixo: 'short', corBaixo: '#2f2f35',
      sapato: 'tenis', corSapato: '#2f2f35', corpo: 'largo', altura: 'alto',
    },
  },
  juninho: {
    nome: 'Juninho do Firma', papel: 'Conhecido do papo furado',
    look: {
      pele: 0, cabelo: 'curto', corCabelo: 'castanho', blusa: 'botao', corBlusa: '#7f9cc4',
      baixo: 'calca', corBaixo: '#5a5e66', sapato: 'sapato', corSapato: '#1d1c22',
    },
  },
  duda: {
    nome: 'Duda', papel: 'Refém do papo furado',
    look: {
      pele: 5, cabelo: 'black', corCabelo: 'preto', blusa: 'camiseta', corBlusa: '#e2793a',
      baixo: 'short', corBaixo: '#4a6a9a', sapato: 'tenis', corSapato: '#f4f1ea', corpo: 'magro',
    },
  },
  rafa: {
    nome: 'Rafa', papel: 'Torcedor do Flamengo',
    look: {
      pele: 3, cabelo: 'curto', corCabelo: 'preto', blusa: 'fla', baixo: 'short', corBaixo: '#1d1c22',
      sapato: 'chinelo', corSapato: '#c4161c',
    },
  },
  beto: {
    nome: 'Beto', papel: 'Torcedor do Botafogo',
    look: {
      pele: 1, cabelo: 'calvo', corCabelo: 'grisalho', barba: 'bigode', corBarba: 'grisalho',
      blusa: 'bota', baixo: 'short', corBaixo: '#1d1c22', sapato: 'tenis', corSapato: '#2a2a30', corpo: 'largo', barriga: true,
    },
  },
  guto: {
    nome: 'Guto', papel: 'Torcedor do Fluminense',
    look: {
      pele: 0, cabelo: 'curto', corCabelo: 'louro', blusa: 'flu', baixo: 'calca', corBaixo: '#e8e2d4',
      sapato: 'sapato', corSapato: '#7a4a2c', corpo: 'magro',
    },
  },
};

// Frequentadores de fundo (sem diálogo). "desde" indica a partir de qual luz aparecem.
export const FREQUENTADORES = [
  { id: 'f1', cena: 'corredor', x: 120, y: 166, face: 1, desde: 0, look: { pele: 2, cabelo: 'coque', corCabelo: 'grisalho', oculos: 'redondo', blusa: 'vestido', corBlusa: '#7a5aa0', sapato: 'sapato', corSapato: '#3a2a2a', mobilidade: 'bengala' } },
  { id: 'f2', cena: 'corredor', x: 392, y: 168, face: -1, desde: 0, look: { pele: 3, cabelo: 'rabo', corCabelo: 'castanho', blusa: 'listrada', corBlusa: '#f4f1ea', corBlusa2: '#3a6a9a', baixo: 'calca', corBaixo: '#2f3a4f', aparelho: true } },
  { id: 'f3', cena: 'corredor', x: 318, y: 164, face: 1, desde: 1, look: { pele: 2, cabelo: 'curto', corCabelo: 'preto', blusa: 'camiseta', corBlusa: '#b8322e', baixo: 'calca', corBaixo: '#3a3a42', mobilidade: 'cadeira' } },
  { id: 'f4', cena: 'corredor', x: 470, y: 170, face: -1, desde: 1, look: { pele: 1, cabelo: 'curto', corCabelo: 'ruivo', chapeu: 'bone', corChapeu: '#2a2a30', blusa: 'florida', corBlusa: '#3a8a8a', corBlusa2: '#f2c14e', baixo: 'short', corBaixo: '#c9b48a', mobilidade: 'protese', sapato: 'tenis' } },
  { id: 'f5', cena: 'corredor', x: 60, y: 168, face: 1, desde: 2, look: { pele: 5, cabelo: 'chanel', corCabelo: 'preto', blusa: 'regata', corBlusa: '#5a8a4a', baixo: 'pantalona', corBaixo: '#f4f1ea' } },
  { id: 'f6', cena: 'calcada', x: 210, y: 174, face: -1, desde: 2, look: { pele: 0, cabelo: 'longo', corCabelo: 'castanho', blusa: 'camiseta', corBlusa: '#d9729a', baixo: 'short', corBaixo: '#3d4a6b', sapato: 'chinelo', corSapato: '#2a6aa0' } },
];

// Avatares que o convidado pode escolher
export const AVATARES = [
  { pele: 5, cabelo: 'black', corCabelo: 'preto', blusa: 'camiseta', corBlusa: '#f2c14e', baixo: 'short', corBaixo: '#4a6a9a', sapato: 'chinelo', corSapato: '#2a6aa0', brinco: '#f2c14e' },
  { pele: 3, cabelo: 'curto', corCabelo: 'preto', blusa: 'camiseta', corBlusa: '#4f8a5a', baixo: 'short', corBaixo: '#c9b48a', sapato: 'tenis', corSapato: '#f4f1ea', barba: 'curta' },
  { pele: 0, cabelo: 'longo', corCabelo: 'ruivo', blusa: 'vestido', corBlusa: '#3a6a9a', sapato: 'chinelo', corSapato: '#c8322e', rubor: true },
  { pele: 4, cabelo: 'curto', corCabelo: 'preto', blusa: 'botao', corBlusa: '#5a7ab8', baixo: 'calca', corBaixo: '#2f3a4f', mobilidade: 'cadeira' },
  { pele: 3, cabelo: 'trancas', corCabelo: 'castanho', blusa: 'regata', corBlusa: '#f4f1ea', baixo: 'pantalona', corBaixo: '#d98a3a', aparelho: true },
  { pele: 1, cabelo: 'curto', corCabelo: 'castanho', barba: 'cheia', chapeu: 'bone', corChapeu: '#c8322e', blusa: 'florida', corBlusa: '#2a7a6a', corBlusa2: '#ffd23f', baixo: 'short', corBaixo: '#e8e2d4', mobilidade: 'protese' },
  { pele: 2, cabelo: 'coque', corCabelo: 'grisalho', oculos: 'redondo', blusa: 'vestido', corBlusa: '#b8494a', sapato: 'sapato', corSapato: '#3a2a2a', mobilidade: 'bengala' },
  { pele: 1, cabelo: 'chanel', corCabelo: 'rosa', blusa: 'camiseta', corBlusa: '#2a2a30', baixo: 'calca', corBaixo: '#2a2a30', sapato: 'tenis', corSapato: '#f4f1ea', corpo: 'magro' },
  { pele: 5, cabelo: 'careca', barba: 'bigode', blusa: 'camiseta', corBlusa: '#e2793a', baixo: 'calca', corBaixo: '#3d4a6b', mobilidade: 'muletas' },
  { pele: 2, cabelo: 'ondulado', corCabelo: 'castanho', blusa: 'camiseta', corBlusa: '#7a5aa0', baixo: 'calca', corBaixo: '#3b5b8c', corpo: 'largo' },
  { pele: 0, cabelo: 'curto', corCabelo: 'preto', oculos: 'quadrado', blusa: 'botao', corBlusa: '#f4f1ea', baixo: 'calca', corBaixo: '#c9b48a', sapato: 'sapato', corSapato: '#5a3a24', altura: 'alto', corpo: 'magro' },
  { pele: 4, cabelo: 'cacheado', corCabelo: 'castanho', blusa: 'listrada', corBlusa: '#f2c14e', corBlusa2: '#c8322e', baixo: 'short', corBaixo: '#3d4a6b', mobilidade: 'cadeira' },
];
