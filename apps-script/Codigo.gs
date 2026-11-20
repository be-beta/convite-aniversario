// Recebe as confirmações de presença do jogo e grava numa aba da planilha.
// Cole este código em Extensões > Apps Script, dentro da planilha que vai receber as respostas.

const ABA = 'Respostas';

function doPost(e) {
  const trava = LockService.getScriptLock();
  trava.waitLock(10000);
  try {
    const dados = JSON.parse(e.postData.contents || '{}');
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const aba = planilha.getSheetByName(ABA) || planilha.insertSheet(ABA);
    if (aba.getLastRow() === 0) aba.appendRow(['Data', 'Nome', 'Resposta', 'Chegada']);
    aba.appendRow([new Date(), limpar(dados.nome, 80), limpar(dados.resposta, 20), limpar(dados.chegada, 80)]);
    return ContentService.createTextOutput('ok');
  } catch (erro) {
    return ContentService.createTextOutput('erro');
  } finally {
    trava.releaseLock();
  }
}

// Corta o tamanho e impede que um texto vire fórmula na planilha.
function limpar(valor, max) {
  let s = String(valor || '').slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
