// Envio da confirmação de presença para a planilha (Google Apps Script).
// Só sai daqui: nome digitado, resposta, previsão de chegada e o código do personagem criado.

import { RSVP_URL } from './config.js';

export async function enviarRSVP({ nome, resposta, chegada, personagem }) {
  if (!RSVP_URL) return 'teste';
  try {
    // text/plain evita a pré-checagem de CORS; o Apps Script responde "ok" quando grava
    const r = await fetch(RSVP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ nome, resposta, chegada, personagem }),
    });
    const txt = (await r.text()).trim();
    return r.ok && txt === 'ok' ? 'ok' : 'erro';
  } catch (e) {
    return 'erro';
  }
}
