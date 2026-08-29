var SHEET_ID = '1-IrBGbuQmcQ9Za1LCZKfV6XUaGIV5gtut5npHw0Gu_E';

// 매체 · 목적 · 상품명 대응표가 들어가는 탭. 없으면 기본값으로 만들어 준다.
var CONFIG_SHEET_NAME = '설정';

// 앱이 columns 를 함께 보내므로, 열이 늘어나도 이 스크립트는 다시 배포하지 않아도 된다.
var FALLBACK_COLUMNS = [
  { key: 'filename', label: '파일명' },
  { key: 'media', label: '매체' },
  { key: 'eventDate', label: '행사일자' },
  { key: 'product', label: '상품명' },
  { key: 'channel', label: '행사채널' }
];

// 파일명 뒤에 붙는 열. utm-builder 시트와 같은 차례로 둔다.
//   url → LINK(GA) · NT · FM → 캠페인명 · 광고그룹명 · 광고명 → utm_*
// 랜딩링크 · 목적 · 연령 · 타겟팅은 사람이 채우는 칸이라 비워 둔다.
var INPUT_HEADERS = ['랜딩링크', '목적', '연령', '타겟팅', '소재유형', '담당자'];
var FORMULA_HEADERS = ['LINK(GA)', 'NT', 'FM(쇼핑라이브)', '캠페인명', '광고그룹명', '광고명'];
var UTM_HEADERS = INPUT_HEADERS.concat(FORMULA_HEADERS);

// 파트별 탭. 앱이 sheet 이름을 함께 보내면 그 탭에 적재한다.
var PART_SHEETS = ['세일즈마케팅', '더플렌더_파트', '생활가전_파트'];

// 맨 앞에 두는 열. 앱이 값을 보내도 시트에서 고쳐 쓰는 칸이다.
var FRONT_HEADERS = ['행사명'];

// 더 쓰지 않는 열. 값이 비어 있으면 지운다. (사람이 적은 값이 남아 있으면 손대지 않는다)
var OBSOLETE_HEADERS = ['쇼핑라이브링크', '메시지 유형', '최종행사명'];

// 수식으로 만들던 열. 링크 · 광고명 안에 이미 들어 있어 값이 있어도 지운다.
var DROP_HEADERS = ['발번시각', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

// 세로 소재는 가로와 같은 소재라 UTM 을 따로 만들지 않는다. (앱도 적재에서 뺀다)
var VERTICAL_MARK = '(세로)';

// 수식이 참조하는 열. 하나라도 없으면 UTM 을 만들지 않는다.
var SOURCE_HEADERS = ['파일명', '매체'];

// 매체 대응표 — 시트에서 직접 고친 값을 그대로 옮겨 둔 것이다.
// utm_medium 에 지면을 적어 두면 쇼핑라이브의 sn 도 같은 값을 쓴다.
var DEFAULT_MEDIA = [
  ['메타', 'facebook', 'display'],
  ['GFA-피드', 'gfa', 'feed'],
  ['GFA-쇼핑소식', 'gfa', 'shopping'],
  ['GFA-스마트채널', 'gfa', 'smart'],
  ['카카오-비즈보드', 'kakao', 'bizboard'],
  ['카카오-디스플레이', 'kakao', 'display'],
  ['구글-디멘드젠', 'google', 'demandgen'],
  ['인플루언서-인스타', 'influencer-ig', 'affiliate'],
  ['인플루언서-유튜브', 'influencer-youtube', 'affiliate'],
  ['인플루언서', 'influencer', 'affiliate'],
  ['마케팅팀', '', '']
];

var DEFAULT_PURPOSE = [
  ['구매', 'purchase'], ['트래픽', 'traffic'], ['참여', 'participation'], ['잠재고객', 'prospect'],
  ['브랜딩', 'branding'], ['도달', 'reach'], ['가입', 'sign-up'], ['메시지', 'message'],
  ['친구추가', 'friend'], ['재생', 'view']
];

// 행사채널 → 매출채널 (광고그룹명 마지막 토막)
var DEFAULT_SALES = [
  ['자사몰', 'officialWebsite'], ['네이버', 'naver'], ['오늘의집', 'ohouse'], ['카카오', 'kakao'],
  ['CJ', 'cj'], ['G마켓', 'gmarket'], ['29CM', '29cm'], ['컬리', 'kurly'], ['이마트', 'emart'],
  ['11번가', '11st'], ['하이마트', 'himart'], ['전자랜드', 'etland'], ['현대홈쇼핑', 'hyundai'],
  ['롯데홈쇼핑', 'lotte'], ['롯데', 'lotte'], ['쿠팡', 'coupang'], ['공구', 'groupbuy'],
  ['오프라인', 'offline'], ['이벤트', 'event'], ['KOL 라이브', 'kolLive']
];

// 상품명 → 제품코드(광고명용) · 제품 정식명(캠페인명용). 정식명은 index 탭 J열 그대로다.
var DEFAULT_PRODUCT = [
  ['더플렌더', 'flender', '미닉스 더 플렌더'],
  ['더플렌더mini', 'flender-mini', '미닉스 더 플렌더(mini)'],
  ['더플렌더PLUS', 'flender-plus', '미닉스 더 플렌더_더 플렌더(PLUS)'],
  ['더플렌더MAX', 'flender-max', '미닉스 더 플렌더_더 플렌더(MAX)'],
  ['더슬림', 'theslim', '미닉스 더 슬림_더 슬림'],
  ['더시프트', 'theshift', '미닉스 더 시프트_더 시프트'],
  ['더에어드라이', 'theairdry', '미닉스 미니건조기_더 에어드라이'],
  ['식기세척기', 'dishwasher', '미닉스 미니 식기세척기'],
  ['건조기', 'dryer', '미닉스 미니건조기'],
  ['건조기필터', 'dryerfilter', '미닉스 리필상품'],
  ['건조기시트', 'dryersheets', '미닉스 리필상품'],
  ['하드필터', 'hardfilter', '미닉스 리필상품'],
  ['하드락필터', 'hardfilter-rock', '미닉스 리필상품'],
  ['푸드컨테이너', 'foodcontainer', '미닉스 리필상품'],
  ['식기세제', 'dishdetergent', '미닉스 리필상품'],
  ['악세사리', 'accessories', '미닉스 리필상품']
];

// ── 앱 → 시트 적재 ──────────────────────────────────────────────
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var columns = (payload.columns && payload.columns.length) ? payload.columns : FALLBACK_COLUMNS;
    var rows = payload.rows || [];

    var book = SpreadsheetApp.openById(SHEET_ID);
    var sheet = targetSheet_(book, payload.sheet);
    ensureConfigSheet_(book);
    var map = ensureColumns_(sheet, columns);

    // 앱이 보낸 열 차례가 아니라 시트의 헤더 자리에 맞춰 넣는다.
    var firstRow = sheet.getLastRow() + 1;
    if (rows.length) {
      var width = sheet.getLastColumn();
      var grid = rows.map(function (row) {
        var line = [];
        for (var i = 0; i < width; i += 1) line.push('');
        columns.forEach(function (column) {
          var at = map[column.label];
          if (!at) return;
          var value = row[column.key];
          if (column.key === 'createdAt') value = value ? new Date(value) : new Date();
          line[at - 1] = value === undefined || value === null ? '' : value;
        });
        return line;
      });
      sheet.getRange(firstRow, 1, grid.length, width).setValues(grid);
      writeUtm_(sheet, map, firstRow, rows.length);
    }

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

// 파트 이름으로 탭을 고른다. 없으면 만들고, 이름이 없으면 첫 파트 탭.
function targetSheet_(book, name) {
  var wanted = String(name || '').trim();
  if (wanted && PART_SHEETS.indexOf(wanted) >= 0) {
    return book.getSheetByName(wanted) || book.insertSheet(wanted, 0);
  }
  return book.getSheetByName(PART_SHEETS[0]) || book.getSheets()[0];
}

// UTM 을 붙이는 탭인가 (설정 탭은 건드리지 않는다)
function isPartSheet_(sheet) {
  var name = sheet.getName();
  if (name === CONFIG_SHEET_NAME) return false;
  return PART_SHEETS.indexOf(name) >= 0 || sheet.getIndex() === 1;
}

// ── 시트에서 직접 입력했을 때 ───────────────────────────────────
// 파일명을 손으로 적거나 붙여넣어도 같은 UTM 이 붙는다.
function onEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (!isPartSheet_(sheet)) return;

  var map = headerMap_(sheet);
  if (!hasSources_(map)) {
    // UTM 열이 아직 없는 시트라면 여기서 만들어 준다. (앱 적재를 기다리지 않아도 되게)
    try {
      ensureConfigSheet_(sheet.getParent());
      map = ensureColumns_(sheet, FALLBACK_COLUMNS);
    } catch (error) {
      return;
    }
    if (!hasSources_(map)) return;
  }
  // 손으로 고친 UTM 값을 곧바로 되돌리지 않도록, 입력 칸을 건드렸을 때만 다시 만든다.
  if (!touchesInput_(map, e.range)) return;

  var first = Math.max(e.range.getRow(), 2);
  var last = e.range.getRow() + e.range.getNumRows() - 1;
  if (last < first) return;
  writeUtm_(sheet, map, first, last - first + 1);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('UTM')
    .addItem('전체 행 다시 계산', 'fillAllUtm')
    .addItem('설정 시트 만들기 · 확인', 'openConfigSheet')
    .addToUi();
}

// 파트 탭을 모두 돌며 이미 쌓여 있던 행까지 채운다.
function fillAllUtm() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  ensureConfigSheet_(book);
  book.getSheets().forEach(function (sheet) {
    if (!isPartSheet_(sheet)) return;
    var map = ensureColumns_(sheet, FALLBACK_COLUMNS);
    if (sheet.getLastRow() < 2) return;
    writeUtm_(sheet, map, 2, sheet.getLastRow() - 1);
  });
}

function openConfigSheet() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  book.setActiveSheet(ensureConfigSheet_(book));
}

// ── 열 맞추기 ───────────────────────────────────────────────────
function headerMap_(sheet) {
  var width = Math.max(sheet.getLastColumn(), 1);
  var header = sheet.getRange(1, 1, 1, width).getValues()[0];
  var map = {};
  header.forEach(function (label, i) {
    var key = String(label).trim();
    if (key && !map[key]) map[key] = i + 1;
  });
  return map;
}

function hasSources_(map) {
  return SOURCE_HEADERS.concat(UTM_HEADERS).every(function (label) { return !!map[label]; });
}

// 없는 열은 만들고, 정해진 차례대로 놓는다.
//   행사명(수기) → 앱이 보내는 열 → 랜딩링크 · 목적 · 연령 · 타겟팅 → 링크 · 이름 · utm
// 목록에 없는 옛 열은 오른쪽 끝으로 밀린다.
function ensureColumns_(sheet, columns) {
  dropObsolete_(sheet);

  // 어떤 화면이 보내든 차례는 늘 같다. 이번에 안 보낸 열도 제자리를 지킨다.
  var wanted = [];
  FRONT_HEADERS
    .concat(FALLBACK_COLUMNS.map(function (column) { return column.label; }))
    .concat(columns.map(function (column) { return column.label; }))
    .concat(UTM_HEADERS)
    .forEach(function (label) {
      if (OBSOLETE_HEADERS.indexOf(label) >= 0) return;   // 옛 앱이 보내도 다시 만들지 않는다
      if (wanted.indexOf(label) < 0) wanted.push(label);
    });

  var map = headerMap_(sheet);
  var next = sheet.getLastColumn() + 1;
  wanted.forEach(function (label) {
    if (map[label]) return;
    sheet.getRange(1, next).setValue(label);
    map[label] = next;
    next += 1;
  });

  map = orderColumns_(sheet, wanted);
  applyPurposeRule_(sheet, map);
  return map;
}

// 수식으로 만들던 열은 값이 있어도 지운다. (다시 만들 수 있는 값이다)
function dropObsolete_(sheet) {
  DROP_HEADERS.forEach(function (label) {
    var column = headerMap_(sheet)[label];
    if (column) sheet.deleteColumn(column);
  });

  OBSOLETE_HEADERS.forEach(function (label) {
    var column = headerMap_(sheet)[label];
    if (!column) return;
    var lastRow = sheet.getLastRow();
    var used = lastRow > 1 && sheet.getRange(2, column, lastRow - 1, 1).getValues().some(function (line) {
      return String(line[0]).trim() !== '';
    });
    if (!used) sheet.deleteColumn(column);
  });
}

// 정해진 차례대로 앞에서부터 끌어온다. 왼쪽으로만 옮기므로 순서가 꼬이지 않는다.
function orderColumns_(sheet, wanted) {
  wanted.forEach(function (label, i) {
    var at = headerMap_(sheet)[label];
    if (!at || at <= i + 1) return;
    sheet.moveColumns(sheet.getRange(1, at, 1, 1), i + 1);
  });
  return headerMap_(sheet);
}

// 목적 칸은 설정 시트의 목록에서 고르게 한다.
function applyPurposeRule_(sheet, map) {
  var config = sheet.getParent().getSheetByName(CONFIG_SHEET_NAME);
  if (!config || !map['목적']) return;
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(config.getRange('F2:F200'), true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange(2, map['목적'], Math.max(sheet.getMaxRows() - 1, 1)).setDataValidation(rule);
}

// ── UTM 수식 쓰기 ───────────────────────────────────────────────
// 수식 열이 아닌 칸(행사명 · 파일명 · 매체 · 상품명 · 랜딩링크 · 목적 …) 을 건드렸는가
function touchesInput_(map, range) {
  var formulaColumns = {};
  FORMULA_HEADERS.forEach(function (label) { formulaColumns[map[label]] = true; });
  var first = range.getColumn();
  var last = first + range.getNumColumns() - 1;
  for (var column = first; column <= last; column += 1) {
    if (!formulaColumns[column]) return true;
  }
  return false;
}

function writeUtm_(sheet, map, startRow, numRows) {
  if (!hasSources_(map) || numRows < 1) return;

  var names = sheet.getRange(startRow, map['파일명'], numRows, 1).getValues();
  var blank = FORMULA_HEADERS.map(function () { return ''; });
  var grid = [];
  for (var i = 0; i < numRows; i += 1) {
    var name = String(names[i][0]).trim();
    var wanted = name !== '' && name.indexOf(VERTICAL_MARK) < 0;
    grid.push(wanted ? utmFormulas_(map, startRow + i) : blank);
  }

  // 붙어 있는 열끼리 묶어 한 번에 쓴다. 자리를 못 찾은 열이 있어도 나머지는 그대로 쓴다.
  var columns = FORMULA_HEADERS.map(function (label) { return map[label]; });
  var run = [];
  var flush = function () {
    if (!run.length) return;
    sheet.getRange(startRow, columns[run[0]], numRows, run.length).setFormulas(grid.map(function (line) {
      return run.map(function (index) { return line[index]; });
    }));
    run = [];
  };
  for (var k = 0; k < columns.length; k += 1) {
    if (!columns[k]) { flush(); continue; }
    if (run.length && columns[k] !== columns[run[run.length - 1]] + 1) flush();
    run.push(k);
  }
  flush();
}

function colLetter_(index) {
  var letter = '';
  var n = index;
  while (n > 0) {
    var rest = (n - 1) % 26;
    letter = String.fromCharCode(65 + rest) + letter;
    n = Math.floor((n - rest - 1) / 26);
  }
  return letter;
}

// utm-builder 탭의 규칙을 그 행 안에서 그대로 계산한다.
//   LINK(GA)     = 랜딩링크 ? utm 파라미터              ← 랜딩링크를 채우면 그때 만들어진다
//   NT           = 랜딩링크 ?nt_source(소스_미디엄) · nt_medium(콘텐츠)
//   FM(쇼핑라이브) = 랜딩링크 ?fm · sn · ea               ← 랜딩링크가 비면 파라미터만 남는다
//   캠페인명      = 소스_제품정식명_목적(영문)           ← utm-builder 캠페인 열과 같은 규칙
//   광고그룹명    = [행사명]연령_타겟팅_매출채널          ← 빈 칸도 자리를 지킨다 ([a]_none_naver)
//   광고명        = 행사일자 _ 제품코드 _ 파일명 _ 소재유형 _ 담당자 (= utm_content)
// utm_source · utm_medium · utm_campaign · utm_term 은 열로 두지 않는다.
// 링크 안에 이미 들어 있어 그 자리에서 계산한다.
function utmFormulas_(map, row) {
  var cell = function (label) { return '$' + colLetter_(map[label]) + row; };
  var file = cell('파일명');
  var media = cell('매체');
  var url = cell('랜딩링크');
  var purpose = cell('목적');
  var age = cell('연령');
  var targeting = cell('타겟팅');
  var creative = map['소재유형'] ? cell('소재유형') : '""';
  var owner = map['담당자'] ? cell('담당자') : '""';
  var cfg = "'" + CONFIG_SHEET_NAME + "'!";
  // utm 낱개 열은 두지 않는다. 링크 안에 들어가는 값이라 그 자리에서 계산한다.
  var source = 'IF(' + media + '="","",IFERROR(VLOOKUP(' + media + ',' + cfg + '$A:$C,2,FALSE),""))';
  var medium = 'IF(' + media + '="","",IFERROR(VLOOKUP(' + media + ',' + cfg + '$A:$C,3,FALSE),""))';
  var campaign = 'IF(' + purpose + '="","",IFERROR(VLOOKUP(' + purpose + ',' + cfg + '$E:$F,2,FALSE),' + purpose + '))';
  var term = 'IF(REGEXMATCH(' + medium + '&"","sa"),"{keyword}","")';
  var content = cell('광고명');
  // 행사일자는 날짜 · 글자 어느 쪽으로 들어와도 YYYYMMDD 로 만든다
  var dateCell = map['행사일자'] ? cell('행사일자') : '';
  var stamp = dateCell
    ? 'IF(' + dateCell + '="","",IF(ISNUMBER(' + dateCell + '),TEXT(' + dateCell + ',"yyyymmdd"),SUBSTITUTE(' + dateCell + '&"","-","")))'
    : '""';
  var productKo = map['상품명'] ? cell('상품명') : '""';
  var product = 'IFERROR(VLOOKUP(' + productKo + ',' + cfg + '$H:$J,2,FALSE),' + productKo + ')';
  // 캠페인명에는 index 탭의 제품 정식명을 쓴다 (미닉스 더 플렌더(mini) …)
  var productFull = 'IFERROR(VLOOKUP(' + productKo + ',' + cfg + '$H:$J,3,FALSE),' + productKo + ')';
  // 메시지코드는 번호까지가 한 덩어리다. (파일명 = 메시지코드-순번)
  var code = 'IFERROR(REGEXEXTRACT(' + file + ',"^[A-Za-z0-9]+-\\d+"),' + file + ')';
  var param = function (name, value) { return 'IF(' + value + '="","","' + name + '="&' + value + ')'; };
  var channelKo = map['행사채널'] ? cell('행사채널') : '""';
  var sales = 'IFERROR(VLOOKUP(' + channelKo + ',' + cfg + '$K:$L,2,FALSE),' + channelKo + ')';
  var promo = map['행사명'] ? cell('행사명') : '""';
  // NT 는 소스 자리에 소스+미디엄을, 미디엄 자리에 콘텐츠를 넣는다.
  var sourceMedium = 'TEXTJOIN("_",TRUE,' + source + ',' + medium + ')';
  // 랜딩링크가 있으면 그 뒤에 이어 붙이고, 없으면 ? 로 시작하는 파라미터만 남긴다.
  var head = 'IF(' + url + '="","?",' + url + '&IF(ISNUMBER(FIND("?",' + url + ')),"&","?"))';

  return [
    '=IF(OR(' + url + '="",' + source + '=""),"",' + head + '&TEXTJOIN("&",TRUE,'
      + param('utm_source', source) + ',' + param('utm_medium', medium) + ',' + param('utm_campaign', campaign) + ','
      + param('utm_content', content) + ',' + param('utm_term', term) + '))',
    '=IF(' + source + '="","",' + head + '&TEXTJOIN("&",TRUE,'
      + param('nt_source', sourceMedium) + ',' + param('nt_medium', content) + '))',
    '=IF(' + source + '="","",' + head + '&TEXTJOIN("&",TRUE,'
      + param('fm', source) + ',' + param('sn', medium) + ',' + param('ea', content) + '))',
    '=IF(' + source + '="","",TEXTJOIN("_",TRUE,' + source + ',' + productFull + ',' + campaign + '))',
    '=IF(TEXTJOIN("",TRUE,' + promo + ',' + age + ',' + targeting + ',' + sales + ')="","",'
      + '"["&' + promo + '&"]"&' + age + '&"_"&' + targeting + '&"_"&' + sales + ')',
    '=IF(' + file + '="","",TEXTJOIN("_",TRUE,' + stamp + ',' + product + ',' + code + ',' + creative + ',' + owner + '))'
  ];
}

// ── 설정 시트 ───────────────────────────────────────────────────
// 대응표를 코드가 아니라 시트에 두어, 매체나 상품이 늘어도 재배포 없이 고칠 수 있게 한다.
function ensureConfigSheet_(book) {
  var config = book.getSheetByName(CONFIG_SHEET_NAME);
  if (!config) {
    config = book.insertSheet(CONFIG_SHEET_NAME, book.getNumSheets());
    config.getRange('A1:L1').setValues([[
      '매체', 'utm_source', 'utm_medium', '', '목적', '목적(영문)', '', '상품명', '제품코드', '제품 정식명', '행사채널', '매출채널'
    ]]).setFontWeight('bold');
    config.setFrozenRows(1);
  }

  // 새 매체 · 목적 · 상품이 늘면 빠진 줄만 덧붙인다. 사람이 고쳐 둔 값은 손대지 않는다.
  addMissingRows_(config, 1, DEFAULT_MEDIA);
  addMissingRows_(config, 5, DEFAULT_PURPOSE);
  addMissingRows_(config, 8, DEFAULT_PRODUCT);
  addMissingRows_(config, 11, DEFAULT_SALES);
  if (!String(config.getRange('K1').getValue()).trim()) {
    config.getRange('K1:L1').setValues([['행사채널', '매출채널']]).setFontWeight('bold');
  }
  if (!String(config.getRange('J1').getValue()).trim()) {
    config.getRange('J1').setValue('제품 정식명').setFontWeight('bold');
  }
  config.autoResizeColumns(1, 12);
  return config;
}

function addMissingRows_(config, column, rows) {
  var last = config.getLastRow();
  var have = {};
  var end = 1;
  if (last > 1) {
    config.getRange(2, column, last - 1, 1).getValues().forEach(function (line, i) {
      var key = String(line[0]).trim();
      if (!key) return;
      have[key] = true;
      end = i + 2;
    });
  }
  // 이미 있는 줄에 새로 생긴 칸(예: 제품 정식명)이 비어 있으면 기본값으로 채운다
  if (last > 1) {
    var width = rows[0].length;
    var block = config.getRange(2, column, last - 1, width).getValues();
    var touched = false;
    block.forEach(function (line) {
      var known = null;
      rows.forEach(function (row) { if (row[0] === String(line[0]).trim()) known = row; });
      if (!known) return;
      for (var i = 1; i < width; i += 1) {
        if (String(line[i]).trim() === '' && known[i]) { line[i] = known[i]; touched = true; }
      }
    });
    if (touched) config.getRange(2, column, last - 1, width).setValues(block);
  }

  var missing = rows.filter(function (row) { return !have[row[0]]; });
  if (!missing.length) return;
  config.getRange(end + 1, column, missing.length, rows[0].length).setValues(missing);
}
