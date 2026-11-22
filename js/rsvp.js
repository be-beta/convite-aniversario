// Envio da confirmação de presença para a planilha (Google Apps Script).
// Só sai daqui: nome digitado, resposta, previsão de chegada e o código do personagem criado.

import { RSVP_URL } from './config.js';

// Linha de "começou a jogar": vai com este sufixo no nome para nunca sobrescrever uma resposta de verdade.
export const RESPOSTA_INICIO = 'Não finalizou';
export const SUFIXO_INICIO = ' (não finalizou)';

// nomes de teste não vão para a planilha (para testar o jogo sem registrar)
export const ehNomeTeste = (nome) => /^(test|teste)$/i.test(String(nome || '').trim());

function postar(dados, keepalive = false) {
  return fetch(RSVP_URL, {
    method: 'POST',
    // text/plain evita a pré-checagem de CORS; o Apps Script responde "ok" quando grava
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(dados),
    keepalive,
  });
}

export async function enviarRSVP({ nome, resposta, chegada, personagem }) {
  if (!RSVP_URL) return 'teste';
  try {
    const r = await postar({ nome, resposta, chegada, personagem });
    const txt = (await r.text()).trim();
    return r.ok && txt === 'ok' ? 'ok' : 'erro';
  } catch (e) {
    return 'erro';
  }
}

// Registra quem montou o personagem, antes de terminar o jogo. Não espera resposta e nunca atrapalha o jogo.
export function avisarInicio({ nome, chegada, personagem }) {
  if (!RSVP_URL || !nome || ehNomeTeste(nome)) return;
  try {
    postar({ nome: String(nome).trim() + SUFIXO_INICIO, resposta: RESPOSTA_INICIO, chegada, personagem }, true).catch(() => {});
  } catch (e) { /* sem rede: segue o jogo */ }
}
