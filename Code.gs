var SHEET_ID = '1-IrBGbuQmcQ9Za1LCZKfV6XUaGIV5gtut5npHw0Gu_E';

// 앱이 columns 를 함께 보내므로, 열이 늘어나도 이 스크립트는 다시 배포하지 않아도 된다.
var FALLBACK_COLUMNS = [
  { key: 'filename', label: '파일명' },
  { key: 'media', label: '매체' },
  { key: 'type', label: '메시지 유형' },
  { key: 'campaign', label: '최종행사명' },
  { key: 'createdAt', label: '발번시각' }
];

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var columns = (payload.columns && payload.columns.length) ? payload.columns : FALLBACK_COLUMNS;
    var rows = payload.rows || [];

    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(columns.map(function (column) { return column.label; }));
    }

    rows.forEach(function (row) {
      sheet.appendRow(columns.map(function (column) {
        var value = row[column.key];
        if (column.key === 'createdAt') return value ? new Date(value) : new Date();
        return value === undefined || value === null ? '' : value;
      }));
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
