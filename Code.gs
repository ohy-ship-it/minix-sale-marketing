var SHEET_ID = '1-IrBGbuQmcQ9Za1LCZKfV6XUaGIV5gtut5npHw0Gu_E';
var HEADER = ['파일명', '매체', '메시지 유형', '최종행사명', '발번시각'];

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADER);

    var rows = JSON.parse(e.postData.contents).rows || [];
    rows.forEach(function (row) {
      sheet.appendRow([
        row.filename || '',
        row.media || '',
        row.type || '',
        row.campaign || '',
        row.createdAt ? new Date(row.createdAt) : new Date()
      ]);
    });

    return json({ ok: true, added: rows.length });
  } catch (error) {
    return json({ ok: false, error: String(error) });
  }
}

function doGet() {
  return json({ ok: true, message: 'minix filename endpoint' });
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
