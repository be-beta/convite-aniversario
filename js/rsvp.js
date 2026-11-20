// Envio da confirmação de presença para a planilha (Google Apps Script).
// Só sai daqui: nome digitado, resposta, previsão de chegada e o código do personagem criado.

import { RSVP_URL } from './config.js';

export async function enviarRSVP({ nome, resposta, chegada, personagem }) {
  if (!RSVP_URL) return 'teste';
  try {
    await fetch(RSVP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ nome, resposta, chegada, personagem }),
    });
    return 'ok';
  } catch (e) {
    return 'erro';
  }
}
