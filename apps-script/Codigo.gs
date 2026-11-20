// Recebe as confirmações de presença do jogo e grava numa aba da planilha.
// Também entrega a lista de personagens para a página galeria.html, mas só com a chave certa.
// Cole este código em Extensões > Apps Script, dentro da planilha que vai receber as respostas.

const ABA = 'Respostas';

// TROQUE por uma senha só sua (letras e números). Ela é pedida na página da galeria.
const CHAVE_GALERIA = 'TROQUE-ESTA-CHAVE';

function doPost(e) {
  const trava = LockService.getScriptLock();
  trava.waitLock(10000);
  try {
    const dados = JSON.parse(e.postData.contents || '{}');
    const aba = abaRespostas();
    aba.appendRow([
      new Date(),
      limpar(dados.nome, 80),
      limpar(dados.resposta, 20),
      limpar(dados.chegada, 80),
      limpar(dados.personagem, 40),
    ]);
    return ContentService.createTextOutput('ok');
  } catch (erro) {
    return ContentService.createTextOutput('erro');
  } finally {
    trava.releaseLock();
  }
}

// Lista de quem respondeu, para a galeria de personagens. Vale a última resposta de cada nome.
function doGet(e) {
  const chave = (e && e.parameter && e.parameter.chave) || '';
  if (CHAVE_GALERIA === 'TROQUE-ESTA-CHAVE' || chave !== CHAVE_GALERIA) return json({ erro: 'chave' });
  const linhas = abaRespostas().getDataRange().getValues().slice(1);
  const porNome = {};
  for (const [data, nome, resposta, chegada, personagem] of linhas) {
    if (!nome) continue;
    porNome[String(nome).trim().toLowerCase()] = { nome: String(nome), resposta: String(resposta), chegada: String(chegada), personagem: String(personagem || '') };
  }
  return json({ pessoas: Object.values(porNome) });
}

function abaRespostas() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName(ABA) || planilha.insertSheet(ABA);
  if (aba.getLastRow() === 0) aba.appendRow(['Data', 'Nome', 'Resposta', 'Chegada', 'Personagem']);
  return aba;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Corta o tamanho e impede que um texto vire fórmula na planilha.
function limpar(valor, max) {
  let s = String(valor || '').slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
