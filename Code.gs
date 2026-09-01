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
// 랜딩링크 · 목적 · 타겟팅 · 담당자는 사람이 채우는 칸이다. (담당자는 앱에서도 보낸다)
var INPUT_HEADERS = ['랜딩링크', '목적', '타겟팅', '담당자'];
var FORMULA_HEADERS = ['LINK(GA)', 'NT(일반)', 'NT(쇼핑스토리)', 'FM(쇼핑라이브)',
  '캠페인명', '광고그룹명', '광고명'];
var UTM_HEADERS = INPUT_HEADERS.concat(FORMULA_HEADERS);

// 파트별 탭. 앱이 sheet 이름을 함께 보내면 그 탭에 적재한다.
var PART_SHEETS = ['세일즈마케팅', '더플렌더_파트', '생활가전_파트'];

// 맨 앞에 두는 열. 앱이 값을 보내도 시트에서 고쳐 쓰는 칸이다.
var FRONT_HEADERS = ['행사명'];

// 더 쓰지 않는 열. 값이 비어 있으면 지운다. (사람이 적은 값이 남아 있으면 손대지 않는다)
var OBSOLETE_HEADERS = ['쇼핑라이브링크', '메시지 유형', '최종행사명', '연령', '소재유형'];

// 수식으로 만들던 열. 링크 · 광고명 안에 이미 들어 있어 값이 있어도 지운다.
var DROP_HEADERS = ['발번시각', 'NT', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

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

    // action 이 있으면 시트 적재가 아니라 조회 요청이다 (매체별 성과 화면)
    if (payload.action) return json(handleAction_(payload));

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
    .addItem('메타 연결 확인', 'checkMetaToken')
    .addItem('구글 연결 확인', 'checkGoogleAds')
    .addItem('카카오 연결 확인', 'checkKakaoToken')
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
//   행사명(수기) → 앱이 보내는 열 → 랜딩링크 · 목적 · 타겟팅 → 링크 · 이름
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
//   NT(일반)      = 랜딩링크 ?nt_source(소스_미디엄) · nt_medium(광고명)
//   NT(쇼핑스토리) = 랜딩링크 &nt_source · nt_medium · nt_detail  ← 파라미터가 이미 붙은 주소 뒤에 잇는다
//   FM(쇼핑라이브) = 랜딩링크 ?fm · sn · ea               ← 랜딩링크가 비면 파라미터만 남는다
//   캠페인명      = 소스_제품정식명_목적(영문)           ← utm-builder 캠페인 열과 같은 규칙
//   광고그룹명    = [행사명]_타겟팅_매출채널              ← 빈 칸도 자리를 지킨다 ([a]_none_naver)
//   광고명        = 행사일자 _ 제품코드 _ 파일명 _ 담당자 (= utm_content)
// utm_source · utm_medium · utm_campaign · utm_term 은 열로 두지 않는다.
// 링크 안에 이미 들어 있어 그 자리에서 계산한다.
function utmFormulas_(map, row) {
  var cell = function (label) { return '$' + colLetter_(map[label]) + row; };
  var file = cell('파일명');
  var media = cell('매체');
  var url = cell('랜딩링크');
  var purpose = cell('목적');
  var age = map['연령'] ? cell('연령') : '""';
  var targeting = map['타겟팅'] ? cell('타겟팅') : '""';
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
    '=IF(' + source + '="","",' + url + '&"&"&TEXTJOIN("&",TRUE,'
      + param('nt_source', source) + ',' + param('nt_medium', medium) + ',' + param('nt_detail', content) + '))',
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

// ── 메타 광고 성과 조회 (워크스페이스 '매체별 성과' 화면) ──────────────
// 액세스 토큰은 스크립트 속성 META_ACCESS_TOKEN 에 둔다. 브라우저로는 내려보내지 않는다.
//   Apps Script 편집기 → 프로젝트 설정(톱니) → 스크립트 속성 → META_ACCESS_TOKEN 추가
var GRAPH_URL = 'https://graph.facebook.com/v21.0';

// 결과로 세는 행동 (구매 · 장바구니 · 리드).
// 한 묶음에서는 먼저 잡히는 것 하나만 센다. omni_* 와 픽셀 이벤트가 겹쳐 두 번 세지 않게 한다.
var RESULT_GROUPS = [
  { key: 'purchase', types: ['omni_purchase', 'offsite_conversion.fb_pixel_purchase', 'onsite_web_purchase', 'purchase'] },
  { key: 'addToCart', types: ['omni_add_to_cart', 'offsite_conversion.fb_pixel_add_to_cart', 'add_to_cart'] },
  { key: 'lead', types: ['lead', 'offsite_conversion.fb_pixel_lead', 'onsite_conversion.lead_grouped'] }
];

// 조회 결과를 담아 두는 시간(초). 같은 계정 · 같은 기간을 다시 물으면 그 안에서는 메타를 부르지 않는다.
var META_CACHE_SECONDS = 300;

// 결과 옆에 따로 보여 줄 어트리뷰션 기간. 기본 결과(value)는 계정 설정을 그대로 쓴다.
// (조회 기준 7일 · 28일은 2026년 1월부터 값을 주지 않는다)
var META_WINDOWS = ['1d_click', '7d_click'];

// 앱이 action 을 담아 보내면 시트 적재 대신 이쪽으로 온다.
function handleAction_(payload) {
  try {
    if (payload.action === 'metaAccounts') return { ok: true, accounts: metaAccounts_() };
    if (payload.action === 'metaReport') return metaReport_(payload);
    if (payload.action === 'googleAccounts') return { ok: true, accounts: adsAccounts_() };
    if (payload.action === 'googleReport') return adsReport_(payload);
    if (payload.action === 'kakaoAccounts') return { ok: true, accounts: kakaoAccounts_() };
    if (payload.action === 'kakaoReport') return kakaoReport_(payload);
    if (payload.action === 'metaCreatives') return metaCreatives_(payload);
    if (payload.action === 'googleCreatives') return adsCreatives_(payload);
    if (payload.action === 'kakaoCreatives') return kakaoCreatives_(payload);
    if (payload.action === 'metaBreakdown') return metaBreakdown_(payload);
    if (payload.action === 'googleBreakdown') return adsBreakdown_(payload);
    if (payload.action === 'kakaoBreakdown') return kakaoBreakdown_(payload);
    return { ok: false, error: '모르는 요청입니다: ' + payload.action };
  } catch (error) {
    return { ok: false, error: String(error && error.message ? error.message : error) };
  }
}

function metaToken_() {
  var raw = PropertiesService.getScriptProperties().getProperty('META_ACCESS_TOKEN');
  var token = cleanToken_(raw);
  if (!token) {
    throw new Error('META_ACCESS_TOKEN 스크립트 속성이 없습니다. '
      + 'Apps Script 편집기 → 프로젝트 설정 → 스크립트 속성에 토큰을 넣어 주세요.');
  }
  return token;
}

// 붙여넣기 사고를 걸러 낸다 — 줄바꿈 · 공백 · 따옴표 · 'META_ACCESS_TOKEN=' 까지 같이 붙은 경우.
// 토큰 자체에는 공백이 없다.
function cleanToken_(raw) {
  var token = String(raw === null || raw === undefined ? '' : raw).trim();
  var at = token.indexOf('META_ACCESS_TOKEN=');
  if (at >= 0) token = token.slice(at + 'META_ACCESS_TOKEN='.length);
  token = token.replace(/^\s*["']|["']\s*$/g, '');   // 앞뒤 따옴표
  return token.replace(/\s+/g, '');                  // 줄바꿈 · 공백
}

// 토큰을 드러내지 않고 모양만 알려 준다 (길이 · 앞 4글자)
function tokenShape_() {
  var token = cleanToken_(PropertiesService.getScriptProperties().getProperty('META_ACCESS_TOKEN'));
  if (!token) return '스크립트 속성이 비어 있습니다';
  return token.length + '자, ' + token.slice(0, 4) + '… 로 시작';
}

// path 가 http 로 시작하면 (다음 쪽 주소) 그대로 부른다.
function graph_(path, params) {
  var url = path;
  if (path.indexOf('http') !== 0) {
    var query = ['access_token=' + encodeURIComponent(metaToken_())];
    Object.keys(params || {}).forEach(function (key) {
      var value = params[key];
      if (value === undefined || value === null || value === '') return;
      query.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    });
    url = GRAPH_URL + path + '?' + query.join('&');
  }
  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var body = {};
  try { body = JSON.parse(response.getContentText() || '{}'); } catch (error) { body = {}; }
  if (body.error) {
    throw new Error('메타 API: ' + (body.error.error_user_msg || body.error.message || JSON.stringify(body.error)));
  }
  if (response.getResponseCode() >= 400) {
    throw new Error('메타 API 오류 (HTTP ' + response.getResponseCode() + ')');
  }
  return body;
}

function graphAll_(path, params, maxPages) {
  var rows = [];
  var body = graph_(path, params);
  var pages = 1;
  while (body && body.data) {
    rows = rows.concat(body.data);
    var next = body.paging && body.paging.next;
    if (!next || pages >= (maxPages || 5)) break;
    body = graph_(next, null);
    pages += 1;
  }
  return rows;
}

// 계정 목록을 못 읽는 토큰일 때 쓰는 목록 (메타 광고 세팅 화면과 같은 8개).
// 페이지 토큰은 /me 가 페이지라 adaccounts 를 못 준다. 그때는 이 id 로 하나씩 물어본다.
// 스크립트 속성 META_AD_ACCOUNTS 에 쉼표로 적어 두면 그 목록이 우선한다.
var DEFAULT_AD_ACCOUNTS = [
  ['미닉스', 'act_370223898721955'], ['컬리', 'act_876846528408565'],
  ['CJ', 'act_1467742828251405'], ['오늘의집', 'act_1194498995371808'],
  ['네이버', 'act_1010891704382690'], ['쿠팡', 'act_1182774429560123'],
  ['무신사', 'act_996624009865646'], ['29cm', 'act_1019016880920556']
];

// 토큰으로 볼 수 있는 광고 계정 목록
function metaAccounts_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('metaAccounts');
  if (hit) return JSON.parse(hit);

  var list = null;
  // 사용자 토큰이면 목록을 그대로 읽는다.
  try {
    list = graphAll_('/me/adaccounts', { fields: 'name,account_id,currency,account_status', limit: 100 }, 3)
      .map(function (row) {
        return {
          id: row.id,
          accountId: row.account_id || String(row.id || '').replace('act_', ''),
          name: row.name || row.id,
          currency: row.currency || 'KRW',
          disabled: Number(row.account_status) !== 1
        };
      });
  } catch (error) {
    list = null;   // 페이지 토큰 등 목록을 못 주는 토큰
  }

  if (!list || !list.length) list = listedAccounts_();
  cache.put('metaAccounts', JSON.stringify(list), 600);
  return list;
}

// 정해 둔 id 로 계정을 하나씩 물어본다. 볼 수 없는 계정은 건너뛴다.
function listedAccounts_() {
  var raw = PropertiesService.getScriptProperties().getProperty('META_AD_ACCOUNTS');
  var ids = raw ? String(raw).split(',') : DEFAULT_AD_ACCOUNTS.map(function (row) { return row[1]; });
  var names = {};
  DEFAULT_AD_ACCOUNTS.forEach(function (row) { names[row[1]] = row[0]; });

  var out = [];
  var lastError = null;
  ids.forEach(function (value) {
    var id = String(value).trim();
    if (!id) return;
    if (id.indexOf('act_') !== 0) id = 'act_' + id;
    try {
      var info = graph_('/' + id, { fields: 'name,currency,account_status' });
      out.push({
        id: id,
        accountId: id.replace('act_', ''),
        name: info.name || names[id] || id,
        currency: info.currency || 'KRW',
        disabled: Number(info.account_status) !== 1
      });
    } catch (error) {
      lastError = error;
    }
  });
  // 하나도 못 읽었으면 토큰 · 권한 문제다. 이유를 그대로 올려 보낸다.
  if (!out.length && lastError) throw lastError;
  return out;
}

function metaReport_(payload) {
  var account = String(payload.account || '').trim();
  if (!account) throw new Error('광고 계정을 고르지 않았습니다.');
  if (account.indexOf('act_') !== 0) account = 'act_' + account;

  var since = String(payload.since || '');
  var until = String(payload.until || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    throw new Error('조회 기간이 올바르지 않습니다.');
  }

  var cache = CacheService.getScriptCache();
  var key = ['meta', account, since, until].join('|');
  if (!payload.refresh) {
    var hit = cache.get(key);
    if (hit) {
      var cached = JSON.parse(hit);
      cached.cached = true;
      return cached;
    }
  }

  var range = JSON.stringify({ since: since, until: until });
  var fields = 'campaign_id,campaign_name,objective,spend,impressions,clicks,inline_link_clicks,actions,catalog_segment_actions';

  var info = graph_('/' + account, { fields: 'name,currency,account_status,timezone_name' });
  var campaignRows = graphAll_('/' + account + '/insights',
    { level: 'campaign', fields: fields, time_range: range, limit: 200, use_unified_attribution_setting: 'true', action_attribution_windows: META_WINDOWS.join(',') }, 8);
  var adsetRows = graphAll_('/' + account + '/insights',
    { level: 'adset', fields: 'adset_id,adset_name,' + fields, time_range: range, limit: 300, use_unified_attribution_setting: 'true', action_attribution_windows: META_WINDOWS.join(',') }, 8);
  var liveCampaigns = graphAll_('/' + account + '/campaigns',
    { fields: 'id,name,objective,effective_status,daily_budget,lifetime_budget', effective_status: '["ACTIVE"]', limit: 200 }, 5);
  var liveAdsets = graphAll_('/' + account + '/adsets',
    { fields: 'id,name,campaign_id,effective_status,daily_budget,lifetime_budget,optimization_goal', effective_status: '["ACTIVE"]', limit: 300 }, 5);

  // 기간 안에 돈을 쓴 것 + 지금 켜져 있는 것을 합친다.
  // (기간에는 돌았지만 지금 꺼진 캠페인도 광고비에는 들어가야 하므로 목록에서 빼지 않는다)
  var campaigns = {};
  campaignRows.forEach(function (row) {
    campaigns[row.campaign_id] = metrics_(row, {
      id: row.campaign_id,
      name: row.campaign_name || row.campaign_id,
      objective: row.objective || '',
      active: false, status: '', budget: 0, budgetKind: ''
    });
  });
  liveCampaigns.forEach(function (row) {
    var entry = campaigns[row.id];
    if (!entry) {
      entry = metrics_(null, {
        id: row.id, name: row.name || row.id, objective: row.objective || '',
        active: false, status: '', budget: 0, budgetKind: ''
      });
      campaigns[row.id] = entry;
    }
    entry.active = true;
    entry.status = row.effective_status || 'ACTIVE';
    if (!entry.objective) entry.objective = row.objective || '';
    if (row.daily_budget) { entry.budget = Number(row.daily_budget); entry.budgetKind = 'daily'; }
    else if (row.lifetime_budget) { entry.budget = Number(row.lifetime_budget); entry.budgetKind = 'lifetime'; }
  });

  var adsets = {};
  adsetRows.forEach(function (row) {
    adsets[row.adset_id] = metrics_(row, {
      id: row.adset_id,
      name: row.adset_name || row.adset_id,
      campaignId: row.campaign_id || '',
      objective: row.objective || '',
      active: false, status: '', budget: 0, budgetKind: '', goal: ''
    });
  });
  liveAdsets.forEach(function (row) {
    var entry = adsets[row.id];
    if (!entry) {
      entry = metrics_(null, {
        id: row.id, name: row.name || row.id, campaignId: row.campaign_id || '',
        objective: '', active: false, status: '', budget: 0, budgetKind: '', goal: ''
      });
      adsets[row.id] = entry;
    }
    entry.active = true;
    entry.status = row.effective_status || 'ACTIVE';
    entry.campaignId = entry.campaignId || row.campaign_id || '';
    entry.goal = row.optimization_goal || '';
    if (row.daily_budget) { entry.budget = Number(row.daily_budget); entry.budgetKind = 'daily'; }
    else if (row.lifetime_budget) { entry.budget = Number(row.lifetime_budget); entry.budgetKind = 'lifetime'; }
  });

  var result = {
    ok: true,
    account: {
      id: account,
      name: info.name || account,
      currency: info.currency || 'KRW',
      timezone: info.timezone_name || ''
    },
    range: { since: since, until: until },
    campaigns: sortBySpend_(campaigns),
    adsets: sortBySpend_(adsets),
    fetchedAt: new Date().toISOString()
  };

  var text = JSON.stringify(result);
  // 캐시 한 칸은 100KB 까지다. 넘치면 담지 않고 그냥 돌려준다.
  if (text.length < 90000) cache.put(key, text, META_CACHE_SECONDS);
  return result;
}

function sortBySpend_(map) {
  return Object.keys(map).map(function (id) { return map[id]; }).sort(function (a, b) {
    if (b.spend !== a.spend) return b.spend - a.spend;
    return String(a.name).localeCompare(String(b.name));
  });
}

function metrics_(row, base) {
  base.spend = row ? Number(row.spend || 0) : 0;
  base.impressions = row ? Number(row.impressions || 0) : 0;
  base.clicks = row ? Number(row.clicks || 0) : 0;
  base.linkClicks = row ? Number(row.inline_link_clicks || 0) : 0;

  // 카탈로그(Advantage+) 캠페인은 전환이 actions 가 아니라 catalog_segment_actions 로 온다.
  // actions 에 잡힌 게 없을 때만 그쪽 값을 쓴다. (둘 다 세면 같은 전환을 두 번 세게 된다)
  var counted = countResults_(row ? row.actions : null);
  var catalog = countResults_(row ? row.catalog_segment_actions : null);
  base.purchase = counted.purchase || catalog.purchase;
  base.addToCart = counted.addToCart || catalog.addToCart;
  base.lead = counted.lead || catalog.lead;
  base.results = base.purchase + base.addToCart + base.lead;

  // 어트리뷰션 기간별 결과. 계정 기본 설정을 쓰는 중이라 칸이 안 오면 null 로 둔다.
  base.windows = {};
  META_WINDOWS.forEach(function (field) {
    var one = countResults_(row ? row.actions : null, field);
    var two = countResults_(row ? row.catalog_segment_actions : null, field);
    base.windows[field] = (one.found || two.found)
      ? (one.purchase || two.purchase) + (one.addToCart || two.addToCart) + (one.lead || two.lead)
      : null;
  });
  return base;
}

// field 를 주면 그 어트리뷰션 칸(1d_click · 7d_click)을 읽는다. 없으면 value(계정 기본).
function countResults_(actions, field) {
  var out = { purchase: 0, addToCart: 0, lead: 0, found: false };
  if (!actions || !actions.length) return out;
  RESULT_GROUPS.forEach(function (group) {
    for (var i = 0; i < group.types.length; i += 1) {
      var value = pickAction_(actions, group.types[i], field);
      if (value !== null) { out[group.key] = value; out.found = true; break; }
    }
  });
  return out;
}

function pickAction_(actions, type, field) {
  var name = field || 'value';
  for (var i = 0; i < actions.length; i += 1) {
    if (actions[i].action_type !== type) continue;
    // 고른 어트리뷰션 칸이 안 오면 (계정 기본 설정을 쓰는 중이면) 없는 것으로 둔다
    if (actions[i][name] === undefined) return null;
    return Number(actions[i][name] || 0);
  }
  return null;
}

// 메타 연결 확인 — 스크립트 속성의 토큰으로 광고 계정을 불러와 본다.
// 처음 실행할 때 외부 요청 권한을 묻는다. (Apps Script 는 _ 로 끝나는 함수를 실행 목록에 보여주지 않아 이 함수를 둔다)
function checkMetaToken() {
  var message;
  try {
    // 담아 둔 목록 말고 지금 토큰으로 진짜 물어본다
    CacheService.getScriptCache().remove('metaAccounts');
    var accounts = metaAccounts_();
    message = '연결됐습니다. 광고 계정 ' + accounts.length + '개\n\n'
      + accounts.map(function (account) {
        return '· ' + account.name + ' (' + account.accountId + ')' + (account.disabled ? ' · 중지됨' : '');
      }).join('\n');
  } catch (error) {
    // 토큰 모양을 함께 알려 준다. 잘렸는지 · 엉뚱한 값이 들어갔는지 바로 보인다.
    message = '연결하지 못했습니다.\n\n' + (error && error.message ? error.message : error)
      + '\n\n넣어 둔 토큰: ' + tokenShape_()
      + '\n(정상이라면 EAA… 로 시작하고 150자가 넘습니다)';
  }
  Logger.log(message);
  // 편집기에서 실행하면 알림창이 없다. 그때는 실행 로그로 본다.
  try { SpreadsheetApp.getUi().alert(message); } catch (ignore) { /* 로그로만 */ }
  return message;
}

// ── 구글 광고 성과 조회 (매체별 성과 화면의 Google Ads 탭) ─────────────
// 스크립트 속성 5개가 필요하다 (env.txt 의 GOOGLE_ADS_* 와 같은 값):
//   GOOGLE_ADS_DEVELOPER_TOKEN · GOOGLE_ADS_CLIENT_ID · GOOGLE_ADS_CLIENT_SECRET
//   GOOGLE_ADS_REFRESH_TOKEN · GOOGLE_ADS_LOGIN_CUSTOMER_ID (MCC 번호)
// 리프레시 토큰으로 액세스 토큰을 받아 REST(GAQL)로 부른다.
var ADS_URL = 'https://googleads.googleapis.com/v22';

// 전환 카테고리 → 메타와 같은 묶음 (구매 · 장바구니 · 리드)
var ADS_RESULT_CATEGORIES = {
  PURCHASE: 'purchase',
  ADD_TO_CART: 'addToCart',
  SUBMIT_LEAD_FORM: 'lead'
};

// 소재 미리보기로 쓸 이미지 자리. 앞에 있는 것을 먼저 쓴다.
// LOGO 는 여기 없다 — 로고를 소재로 보여 주면 어떤 광고인지 알 수 없다.
var ADS_IMAGE_FIELDS = ['SQUARE_MARKETING_IMAGE', 'MARKETING_IMAGE', 'PORTRAIT_MARKETING_IMAGE'];

// CPA 에서 빼는 캠페인 유형. 메타의 트래픽 목적에 해당하는 자리다. (앱도 같은 목록을 쓴다)
var ADS_TRAFFIC_TYPES = ['VIDEO'];

// GOOGLE_ADS_CLIENT_ID 로 넣든 CLIENT_ID 로 넣든 받는다. (짧은 이름으로 적어 둔 경우가 있다)
function adsNames_(name) {
  var short = name.replace(/^GOOGLE_ADS_/, '');
  return [name, 'GOOGLE_' + short, short];
}

function adsProperty_(name) {
  var all = PropertiesService.getScriptProperties().getProperties();
  var names = adsNames_(name);
  for (var i = 0; i < names.length; i += 1) {
    var value = cleanToken_(all[names[i]]);
    if (value) return value;
  }
  throw new Error(name + ' 스크립트 속성이 없습니다 (' + names.join(' · ') + ' 중 아무 이름이나 됩니다). '
    + 'Apps Script 편집기 → 프로젝트 설정 → 스크립트 속성에 넣어 주세요.');
}

// 리프레시 토큰으로 액세스 토큰을 받는다. 한 시간짜리라 50분만 담아 둔다.
function adsAccessToken_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('adsAccessToken');
  if (hit) return hit;

  var response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    muteHttpExceptions: true,
    payload: {
      client_id: adsProperty_('GOOGLE_ADS_CLIENT_ID'),
      client_secret: adsProperty_('GOOGLE_ADS_CLIENT_SECRET'),
      refresh_token: adsProperty_('GOOGLE_ADS_REFRESH_TOKEN'),
      grant_type: 'refresh_token'
    }
  });
  var body = {};
  try { body = JSON.parse(response.getContentText() || '{}'); } catch (error) { body = {}; }
  if (!body.access_token) {
    throw new Error('구글 인증: ' + (body.error_description || body.error || 'access_token 을 받지 못했습니다'));
  }
  cache.put('adsAccessToken', body.access_token, 3000);
  return body.access_token;
}

// 구글이 준 오류에 어디서 났는지를 붙인다.
// 'Request contains an invalid argument.' 만 보면 무엇이 잘못됐는지 알 수 없다.
function adsError_(error, query, customerId) {
  var message = error.message || JSON.stringify(error);
  var from = (String(query).match(/FROM\s+([a-z_]+)/i) || [])[1] || '';
  var detail = '';

  // 구글이 어느 자리가 틀렸는지 알려 주면 그대로 옮긴다
  var details = error.details || [];
  details.forEach(function (item) {
    (item.errors || []).forEach(function (one) {
      if (!one) return;
      var code = one.errorCode ? JSON.stringify(one.errorCode).replace(/[{}"]/g, '') : '';
      detail += ' · ' + (one.message || '') + (code ? ' [' + code + ']' : '');
    });
  });

  // 관리자(MCC) 계정에는 광고가 없다. 이 오류가 가장 자주 나는 경우다.
  var mcc = '';
  try { mcc = adsProperty_('GOOGLE_ADS_LOGIN_CUSTOMER_ID').replace(/[^0-9]/g, ''); } catch (ignore) { mcc = ''; }
  if (mcc && String(customerId) === mcc) {
    detail += ' · 관리자(MCC) 계정에는 광고가 없습니다. 하위 광고 계정을 고르세요.';
  }

  return '구글 광고 API: ' + message + (from ? ' (' + from + ' 조회' : ' (')
    + ' · 계정 ' + customerId + ')' + detail;
}

// GAQL 질의. 쪽이 나뉘면 이어서 받는다.
function adsQuery_(customerId, query, maxPages) {
  var id = String(customerId).replace(/[^0-9]/g, '');
  var rows = [];
  var token = null;
  var pages = 0;
  do {
    var payload = { query: query };
    if (token) payload.pageToken = token;
    var response = UrlFetchApp.fetch(ADS_URL + '/customers/' + id + '/googleAds:search', {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      headers: {
        Authorization: 'Bearer ' + adsAccessToken_(),
        'developer-token': adsProperty_('GOOGLE_ADS_DEVELOPER_TOKEN'),
        'login-customer-id': adsProperty_('GOOGLE_ADS_LOGIN_CUSTOMER_ID').replace(/[^0-9]/g, '')
      },
      payload: JSON.stringify(payload)
    });
    var body = {};
    try { body = JSON.parse(response.getContentText() || '{}'); } catch (error) { body = {}; }
    if (body.error) throw new Error(adsError_(body.error, query, id));
    if (response.getResponseCode() >= 400) throw new Error('구글 광고 API 오류 (HTTP ' + response.getResponseCode() + ')');
    rows = rows.concat(body.results || []);
    token = body.nextPageToken || null;
    pages += 1;
  } while (token && pages < (maxPages || 8));
  return rows;
}

// MCC 아래 광고 계정 목록 (관리자 계정은 뺀다)
function adsAccounts_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('adsAccounts');
  if (hit) return JSON.parse(hit);

  var mcc = adsProperty_('GOOGLE_ADS_LOGIN_CUSTOMER_ID');
  var rows = adsQuery_(mcc, 'SELECT customer_client.id, customer_client.descriptive_name, '
    + 'customer_client.manager, customer_client.currency_code, customer_client.status '
    + 'FROM customer_client', 3);

  var list = [];
  rows.forEach(function (row) {
    var client = row.customerClient || {};
    if (client.manager) return;   // 관리자(MCC) 계정에는 광고가 없다
    list.push({
      id: String(client.id),
      accountId: String(client.id),
      name: client.descriptiveName || String(client.id),
      currency: client.currencyCode || 'KRW',
      disabled: client.status && client.status !== 'ENABLED'
    });
  });
  cache.put('adsAccounts', JSON.stringify(list), 600);
  return list;
}

function adsReport_(payload) {
  var customer = String(payload.account || '').replace(/[^0-9]/g, '');
  if (!customer) throw new Error('광고 계정을 고르지 않았습니다.');

  var since = String(payload.since || '');
  var until = String(payload.until || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    throw new Error('조회 기간이 올바르지 않습니다.');
  }

  var cache = CacheService.getScriptCache();
  var key = ['ads', customer, since, until].join('|');
  if (!payload.refresh) {
    var hit = cache.get(key);
    if (hit) {
      var cached = JSON.parse(hit);
      cached.cached = true;
      return cached;
    }
  }

  var period = ' WHERE segments.date BETWEEN "' + since + '" AND "' + until + '"';

  var info = adsQuery_(customer,
    'SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone FROM customer', 1);
  var account = (info[0] && info[0].customer) || {};

  var campaignRows = adsQuery_(customer,
    'SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, '
    + 'metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions FROM campaign' + period, 8);

  // 결과는 전환 카테고리로 나눠 받는다 (구매 · 장바구니 · 리드)
  var categoryRows = adsQuery_(customer,
    'SELECT campaign.id, segments.conversion_action_category, metrics.conversions FROM campaign'
    + period + ' AND metrics.conversions > 0', 8);

  var adGroupRows = adsQuery_(customer,
    'SELECT ad_group.id, ad_group.name, ad_group.status, campaign.id, '
    + 'metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions FROM ad_group' + period, 8);

  // 기간에 안 돌았어도 지금 켜져 있으면 목록에 넣는다
  var liveCampaigns = adsQuery_(customer,
    'SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, '
    + 'campaign_budget.amount_micros FROM campaign WHERE campaign.status = "ENABLED"', 5);
  var liveAdGroups = adsQuery_(customer,
    'SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.cpc_bid_micros, campaign.id '
    + 'FROM ad_group WHERE ad_group.status = "ENABLED" AND campaign.status = "ENABLED"', 5);

  var byCategory = {};
  categoryRows.forEach(function (row) {
    var id = String((row.campaign || {}).id);
    var category = (row.segments || {}).conversionActionCategory;
    var slot = ADS_RESULT_CATEGORIES[category];
    if (!slot) return;
    if (!byCategory[id]) byCategory[id] = { purchase: 0, addToCart: 0, lead: 0 };
    byCategory[id][slot] += Number((row.metrics || {}).conversions || 0);
  });

  var campaigns = {};
  campaignRows.forEach(function (row) {
    var campaign = row.campaign || {};
    var id = String(campaign.id);
    campaigns[id] = adsMetrics_(row, byCategory[id], {
      id: id,
      name: campaign.name || id,
      objective: campaign.advertisingChannelType || '',
      active: campaign.status === 'ENABLED',
      status: campaign.status || '',
      budget: 0, budgetKind: ''
    });
  });
  liveCampaigns.forEach(function (row) {
    var campaign = row.campaign || {};
    var id = String(campaign.id);
    var entry = campaigns[id];
    if (!entry) {
      entry = adsMetrics_(null, null, {
        id: id, name: campaign.name || id, objective: campaign.advertisingChannelType || '',
        active: false, status: '', budget: 0, budgetKind: ''
      });
      campaigns[id] = entry;
    }
    entry.active = true;
    entry.status = 'ENABLED';
    var budget = Number(((row.campaignBudget || {}).amountMicros) || 0) / 1000000;
    if (budget) { entry.budget = budget; entry.budgetKind = 'daily'; }
  });

  var adsets = {};
  adGroupRows.forEach(function (row) {
    var group = row.adGroup || {};
    var id = String(group.id);
    adsets[id] = adsMetrics_(row, null, {
      id: id,
      name: group.name || id,
      campaignId: String((row.campaign || {}).id || ''),
      objective: '',
      active: group.status === 'ENABLED',
      status: group.status || '',
      budget: 0, budgetKind: '', goal: ''
    });
  });
  liveAdGroups.forEach(function (row) {
    var group = row.adGroup || {};
    var id = String(group.id);
    var entry = adsets[id];
    if (!entry) {
      entry = adsMetrics_(null, null, {
        id: id, name: group.name || id, campaignId: String((row.campaign || {}).id || ''),
        objective: '', active: false, status: '', budget: 0, budgetKind: '', goal: ''
      });
      adsets[id] = entry;
    }
    entry.active = true;
    entry.status = 'ENABLED';
  });

  var result = {
    ok: true,
    source: 'google',
    account: {
      id: String(account.id || customer),
      name: account.descriptiveName || customer,
      currency: account.currencyCode || 'KRW',
      timezone: account.timeZone || ''
    },
    range: { since: since, until: until },
    campaigns: sortBySpend_(campaigns),
    adsets: sortBySpend_(adsets),
    fetchedAt: new Date().toISOString()
  };

  var text = JSON.stringify(result);
  if (text.length < 90000) cache.put(key, text, META_CACHE_SECONDS);
  return result;
}

// 메타 쪽과 같은 모양으로 맞춘다. 화면이 두 매체를 같은 코드로 그린다.
// 구글의 클릭은 링크 클릭이라 linkClicks 에 그대로 넣는다.
function adsMetrics_(row, categories, base) {
  var metrics = (row && row.metrics) || {};
  base.spend = Number(metrics.costMicros || 0) / 1000000;
  base.impressions = Number(metrics.impressions || 0);
  base.clicks = Number(metrics.clicks || 0);
  base.linkClicks = base.clicks;
  base.purchase = categories ? categories.purchase : 0;
  base.addToCart = categories ? categories.addToCart : 0;
  base.lead = categories ? categories.lead : 0;
  base.results = base.purchase + base.addToCart + base.lead;
  // 카테고리가 안 잡힌 계정(전환 액션 분류가 비어 있는 경우)은 전환수를 그대로 쓴다
  if (!base.results && metrics.conversions) base.results = Number(metrics.conversions);
  return base;
}

// 넣어 둔 속성이 무엇인지 이름만 보여 준다 (값은 길이만).
// 이름을 한 글자라도 다르게 적으면 '없습니다' 가 나오므로, 무엇이 들어와 있는지 보여 준다.
var ADS_PROPERTIES = [
  'GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN', 'GOOGLE_ADS_LOGIN_CUSTOMER_ID'
];

function adsShape_() {
  var all = PropertiesService.getScriptProperties().getProperties();
  var used = {};
  var lines = ADS_PROPERTIES.map(function (name) {
    var names = adsNames_(name);
    for (var i = 0; i < names.length; i += 1) {
      var value = cleanToken_(all[names[i]]);
      if (!value) continue;
      used[names[i]] = true;
      return '  O ' + names[i] + ' (' + value.length + '자)';
    }
    return '  X ' + name;
  });
  var others = Object.keys(all).filter(function (key) {
    return !used[key] && key !== 'META_ACCESS_TOKEN';
  });
  if (others.length) lines.push('\n쓰이지 않는 속성: ' + others.join(', '));
  return lines.join('\n');
}

// 구글 연결 확인 — 시트 UTM 메뉴에서 부른다.
function checkGoogleAds() {
  var message;
  try {
    CacheService.getScriptCache().remove('adsAccounts');
    CacheService.getScriptCache().remove('adsAccessToken');
    var accounts = adsAccounts_();
    message = '연결됐습니다. 광고 계정 ' + accounts.length + '개\n\n'
      + accounts.map(function (account) {
        return '· ' + account.name + ' (' + account.accountId + ')' + (account.disabled ? ' · 중지됨' : '');
      }).join('\n');
  } catch (error) {
    message = '연결하지 못했습니다.\n\n' + (error && error.message ? error.message : error)
      + '\n\n넣어 둔 스크립트 속성\n' + adsShape_();
  }
  Logger.log(message);
  try { SpreadsheetApp.getUi().alert(message); } catch (ignore) { /* 로그로만 */ }
  return message;
}

// ── 소재별 결과 ────────────────────────────────────────────────────
// 캠페인 · 광고그룹을 고르면 그 안의 광고(소재)를 성과와 함께 돌려준다.
// 두 매체가 같은 모양으로 답한다: { id, name, thumbnail, spend, impressions, clicks, linkClicks, results … }

// 소재를 몇 개까지 돌려줄지. 광고비 순으로 자른다.
var CREATIVE_LIMIT = 120;

function metaCreatives_(payload) {
  var account = String(payload.account || '').trim();
  if (!account) throw new Error('광고 계정을 고르지 않았습니다.');
  if (account.indexOf('act_') !== 0) account = 'act_' + account;

  var since = String(payload.since || '');
  var until = String(payload.until || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    throw new Error('조회 기간이 올바르지 않습니다.');
  }

  // 고른 자리로 좁혀 묻는다. 광고그룹 > 캠페인 > 계정 차례.
  var scope = String(payload.adset || payload.campaign || account).trim();
  var cache = CacheService.getScriptCache();
  var key = ['metaAds', scope, since, until].join('|');
  if (!payload.refresh) {
    var hit = cache.get(key);
    if (hit) {
      var cached = JSON.parse(hit);
      cached.cached = true;
      return cached;
    }
  }

  var range = JSON.stringify({ since: since, until: until });
  var rows = graphAll_('/' + scope + '/insights', {
    level: 'ad',
    fields: 'ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,spend,impressions,clicks,inline_link_clicks,actions,catalog_segment_actions',
    time_range: range,
    limit: 200,
    use_unified_attribution_setting: 'true', action_attribution_windows: META_WINDOWS.join(',')
  }, 8);

  var creatives = rows.map(function (row) {
    return metrics_(row, {
      id: String(row.ad_id),
      name: row.ad_name || String(row.ad_id),
      campaignId: row.campaign_id || '',
      campaignName: row.campaign_name || '',
      adsetId: row.adset_id || '',
      adsetName: row.adset_name || '',
      objective: '', active: false, status: '', thumbnail: '', video: ''
    });
  }).sort(function (a, b) { return b.spend - a.spend; }).slice(0, CREATIVE_LIMIT);

  // 돈을 쓴 광고의 소재만 가져온다 (한 번에 50개씩 id 로 물어본다)
  //   thumbnail_url 은 64x64 라 화면에서 뭉개진다. 그래서 큰 이미지를 차례로 찾는다.
  //     image_url → 인스타 미디어(1080px, 실제 소재) → 동영상 표지 → 게시물 이미지 → thumbnail_url
  //   게시물 이미지(full_picture)를 뒤로 둔 이유: 링크 게시물이면 소재가 아니라
  //   랜딩 페이지 미리보기 이미지가 온다.
  var ids = creatives.map(function (row) { return row.id; });
  var instagram = {};   // 광고 id → 인스타 미디어 id
  var videos = {};      // 광고 id → 동영상 id
  var stories = {};     // 광고 id → 게시물 id
  for (var at = 0; at < ids.length; at += 50) {
    var chunk = ids.slice(at, at + 50);
    var body = graph_('/', {
      ids: chunk.join(','),
      fields: 'name,effective_status,creative{thumbnail_url,image_url,object_type,video_id,'
        + 'effective_instagram_media_id,effective_object_story_id}'
    });
    creatives.forEach(function (row) {
      var found = body[row.id];
      if (!found) return;
      var creative = found.creative || {};
      row.thumbnail = creative.image_url || '';
      row.small = creative.thumbnail_url || '';
      row.video = creative.video_id || '';
      row.status = found.effective_status || '';
      row.active = found.effective_status === 'ACTIVE';
      if (found.name) row.name = found.name;
      if (creative.effective_instagram_media_id) instagram[row.id] = creative.effective_instagram_media_id;
      if (creative.video_id) videos[row.id] = creative.video_id;
      if (creative.effective_object_story_id) stories[row.id] = creative.effective_object_story_id;
    });
  }

  fillBigPictures_(creatives, instagram, 'media_url');
  fillBigPictures_(creatives, videos, 'picture');
  fillBigPictures_(creatives, stories, 'full_picture');

  // 큰 이미지를 못 찾은 줄은 작은 썸네일이라도 쓴다
  creatives.forEach(function (row) {
    if (!row.thumbnail) row.thumbnail = row.small || '';
    delete row.small;
  });

  var result = {
    ok: true,
    source: 'meta',
    scope: scope,
    range: { since: since, until: until },
    creatives: creatives,
    fetchedAt: new Date().toISOString()
  };
  var text = JSON.stringify(result);
  if (text.length < 90000) cache.put(key, text, META_CACHE_SECONDS);
  return result;
}

// 광고 id → (게시물 id · 동영상 id) 를 받아 큰 이미지 주소를 채운다.
// 볼 수 없는 게시물이 섞여 있어도 나머지는 채운다.
function fillBigPictures_(creatives, map, field) {
  // 아직 큰 이미지를 못 찾은 줄만 물어본다. 앞 단계에서 다 채웠으면 한 번도 부르지 않는다.
  var need = {};
  creatives.forEach(function (row) {
    if (!row.thumbnail && map[row.id]) need[map[row.id]] = true;
  });
  var ids = Object.keys(need);
  if (!ids.length) return;

  var pictures = {};
  for (var at = 0; at < ids.length; at += 50) {
    var chunk = ids.slice(at, at + 50);
    try {
      var body = graph_('/', { ids: chunk.join(','), fields: field });
      Object.keys(body).forEach(function (id) {
        if (body[id] && body[id][field]) pictures[id] = body[id][field];
      });
    } catch (error) {
      // 볼 수 없는 게시물(다른 페이지 것)이 하나라도 섞이면 묶음이 통째로 실패한다.
      // 그럴 때는 하나씩 되짚는다. 너무 오래 걸리지 않게 앞쪽 40개까지만 본다.
      chunk.slice(0, 40).forEach(function (id) {
        try {
          var one = graph_('/' + id, { fields: field });
          if (one && one[field]) pictures[id] = one[field];
        } catch (ignore) { /* 이 게시물은 볼 수 없다 */ }
      });
    }
  }

  creatives.forEach(function (row) {
    if (row.thumbnail) return;
    var found = pictures[map[row.id]];
    if (found) row.thumbnail = found;
  });
}

function adsCreatives_(payload) {
  var customer = String(payload.account || '').replace(/[^0-9]/g, '');
  if (!customer) throw new Error('광고 계정을 고르지 않았습니다.');

  var since = String(payload.since || '');
  var until = String(payload.until || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    throw new Error('조회 기간이 올바르지 않습니다.');
  }

  var campaign = String(payload.campaign || '').replace(/[^0-9]/g, '');
  var adGroup = String(payload.adset || '').replace(/[^0-9]/g, '');
  var cache = CacheService.getScriptCache();
  var key = ['adsAds', customer, campaign, adGroup, since, until].join('|');
  if (!payload.refresh) {
    var hit = cache.get(key);
    if (hit) {
      var cached = JSON.parse(hit);
      cached.cached = true;
      return cached;
    }
  }

  var where = ' WHERE segments.date BETWEEN "' + since + '" AND "' + until + '"'
    + (campaign ? ' AND campaign.id = ' + campaign : '')
    + (adGroup ? ' AND ad_group.id = ' + adGroup : '');

  // 그 기간에 실제로 돈 광고만 본다. (노출 0 인 줄까지 오면 목록이 빈 카드로 덮인다)
  var rows = adsQuery_(customer,
    'SELECT ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.type, ad_group_ad.status, '
    + 'ad_group_ad.ad.video_responsive_ad.videos, '
    + 'ad_group.id, ad_group.name, campaign.id, campaign.name, '
    + 'metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions FROM ad_group_ad'
    + where + ' AND metrics.impressions > 0', 8);

  var categoryRows = adsQuery_(customer,
    'SELECT ad_group_ad.ad.id, segments.conversion_action_category, metrics.conversions FROM ad_group_ad'
    + where + ' AND metrics.conversions > 0', 8);

  var assetRows = adsQuery_(customer,
    'SELECT ad_group_ad.ad.id, ad_group_ad_asset_view.field_type, asset.type, '
    + 'asset.image_asset.full_size.url, asset.image_asset.full_size.width_pixels, '
    + 'asset.youtube_video_asset.youtube_video_id FROM ad_group_ad_asset_view'
    + where + ' AND asset.type IN ("IMAGE","YOUTUBE_VIDEO")', 8);

  var byCategory = {};
  categoryRows.forEach(function (row) {
    var id = String((((row.adGroupAd || {}).ad) || {}).id);
    var slot = ADS_RESULT_CATEGORIES[(row.segments || {}).conversionActionCategory];
    if (!slot) return;
    if (!byCategory[id]) byCategory[id] = { purchase: 0, addToCart: 0, lead: 0 };
    byCategory[id][slot] += Number((row.metrics || {}).conversions || 0);
  });

  // 광고마다 미리보기 이미지 하나를 고른다.
  // 반응형 광고에는 **로고**도 애셋으로 들어 있어서, 먼저 잡히는 것을 쓰면 로고가 뜬다.
  // 그래서 소재 이미지 자리(field_type)만 쓰고 로고는 아예 뺀다.
  var thumbs = {};
  assetRows.forEach(function (row) {
    var id = String((((row.adGroupAd || {}).ad) || {}).id);
    var asset = row.asset || {};
    var field = String((row.adGroupAdAssetView || {}).fieldType || '');
    if (!thumbs[id]) thumbs[id] = { thumbnail: '', video: '', rank: 99 };

    if (asset.type === 'YOUTUBE_VIDEO' && !thumbs[id].video) {
      thumbs[id].video = (asset.youtubeVideoAsset || {}).youtubeVideoId || '';
      return;
    }
    if (asset.type !== 'IMAGE') return;
    if (field.indexOf('LOGO') >= 0) return;   // 로고는 소재가 아니다

    var rank = ADS_IMAGE_FIELDS.indexOf(field);
    if (rank < 0) rank = ADS_IMAGE_FIELDS.length;   // 모르는 자리는 뒤로
    if (rank >= thumbs[id].rank) return;
    var url = ((asset.imageAsset || {}).fullSize || {}).url || '';
    if (!url) return;
    thumbs[id].thumbnail = url;
    thumbs[id].rank = rank;
  });

  // 동영상 캠페인(VIDEO_RESPONSIVE_AD)은 애셋 뷰에 안 잡히는 일이 많다.
  // 광고에 적힌 영상 애셋 id 로 직접 물어 유튜브 id 와 제목을 받는다.
  var videoAssets = {};
  rows.forEach(function (row) {
    var ad = ((row.adGroupAd || {}).ad) || {};
    var list = ((ad.videoResponsiveAd || {}).videos) || [];
    var ids = list.map(function (item) {
      return String(item.asset || '').split('/').pop();
    }).filter(Boolean);
    if (ids.length) videoAssets[String(ad.id)] = ids;
  });

  var missing = [];
  Object.keys(videoAssets).forEach(function (adId) {
    var found = thumbs[adId];
    if (found && (found.thumbnail || found.video)) return;
    videoAssets[adId].forEach(function (assetId) {
      if (missing.indexOf(assetId) < 0) missing.push(assetId);
    });
  });

  var videoById = {};
  if (missing.length) {
    adsQuery_(customer, 'SELECT asset.id, asset.youtube_video_asset.youtube_video_id, '
      + 'asset.youtube_video_asset.youtube_video_title FROM asset WHERE asset.id IN ('
      + missing.slice(0, 200).join(',') + ')', 3).forEach(function (row) {
      var asset = row.asset || {};
      var youtube = asset.youtubeVideoAsset || {};
      if (youtube.youtubeVideoId) {
        videoById[String(asset.id)] = { video: youtube.youtubeVideoId, title: youtube.youtubeVideoTitle || '' };
      }
    });
  }

  var creatives = rows.map(function (row) {
    var ad = ((row.adGroupAd || {}).ad) || {};
    var id = String(ad.id);
    var thumb = thumbs[id] || { thumbnail: '', video: '' };

    // 애셋 뷰에 없던 동영상을 여기서 채운다
    var title = '';
    if (!thumb.thumbnail && !thumb.video) {
      (videoAssets[id] || []).forEach(function (assetId) {
        var found = videoById[assetId];
        if (!found || thumb.video) return;
        thumb = { thumbnail: thumb.thumbnail, video: found.video };
        title = found.title;
      });
    }

    // 반응형 광고는 이름이 비어 있는 일이 많다. 영상 제목 → 유형 + id 차례로 적는다.
    var name = ad.name || title || (ad.type ? ad.type + ' ' + id : id);
    var entry = adsMetrics_(row, byCategory[id], {
      id: id,
      name: name,
      campaignId: String((row.campaign || {}).id || ''),
      campaignName: (row.campaign || {}).name || '',
      adsetId: String((row.adGroup || {}).id || ''),
      adsetName: (row.adGroup || {}).name || '',
      objective: ad.type || '',
      active: (row.adGroupAd || {}).status === 'ENABLED',
      status: (row.adGroupAd || {}).status || '',
      thumbnail: thumb.thumbnail,
      video: thumb.video
    });
    // 유튜브 영상뿐이면 유튜브 썸네일을 쓴다
    if (!entry.thumbnail && entry.video) {
      entry.thumbnail = 'https://img.youtube.com/vi/' + entry.video + '/mqdefault.jpg';
    }
    return entry;
  }).sort(function (a, b) { return b.spend - a.spend; }).slice(0, CREATIVE_LIMIT);

  var result = {
    ok: true,
    source: 'google',
    scope: adGroup || campaign || customer,
    range: { since: since, until: until },
    creatives: creatives,
    fetchedAt: new Date().toISOString()
  };
  var text = JSON.stringify(result);
  if (text.length < 90000) cache.put(key, text, META_CACHE_SECONDS);
  return result;
}

// ── 카카오모먼트 성과 조회 (매체별 성과 · 소재별 결과의 카카오 탭) ──────────
// 어드민 키로는 부를 수 없다. 카카오모먼트는 '비즈니스 토큰' 만 받는다.
//   get_kakao_business_token.py 로 한 번 받아
//   Apps Script 편집기 → 프로젝트 설정 → 스크립트 속성 → KAKAO_BUSINESS_TOKEN 에 넣는다.
// 비즈니스 토큰에는 리프레시가 없다. 한 번 넣어 두면 계속 쓴다. (자주 재발급하면 막힌다)
var KAKAO_URL = 'https://apis.moment.kakao.com/openapi/v4';

// 보고서에 담아 달라고 할 지표 묶음. BASIC 은 노출 · 클릭 · 비용, PIXEL_SDK_CONVERSION 은 픽셀 전환.
var KAKAO_METRICS = 'BASIC,PIXEL_SDK_CONVERSION';

// 카카오는 보고서를 한 번에 31일까지만 준다.
var KAKAO_MAX_DAYS = 31;

// 한 번에 물어볼 수 있는 개수 (카카오가 정해 둔 값)
var KAKAO_CAMPAIGN_CHUNK = 5;    // campaigns/report 의 campaignId
var KAKAO_ADGROUP_CHUNK = 40;    // adGroups/report 의 adGroupId

// 광고그룹까지 파고들 캠페인 수. 광고비가 큰 쪽부터 본다. (호출 제한 때문에 끝을 둔다)
// 보고서는 5초에 한 번이라 이 수가 곧 기다리는 시간이다. 5개면 보고서 한 번으로 끝난다.
var KAKAO_CAMPAIGN_LIMIT = 5;
// 소재 미리보기 이미지를 물어볼 개수
var KAKAO_CREATIVE_LOOKUP = 20;

// 결과로 세는 전환. 카카오는 같은 전환을 어트리뷰션 기간별로 나눠서 준다.
//   conv_purchase_1d · conv_purchase_7d   구매 수
//   conv_add_to_cart_1d · _7d             장바구니 수
//   conv_signup_1d · _7d                  가입 수
// 뒤에 _q_ 가 붙으면 수량, _p_ 가 붙으면 금액, _rate 는 전환율이라 개수로 세지 않는다.
var KAKAO_RESULT_FIELDS = {
  purchase: 'conv_purchase_',
  addToCart: 'conv_add_to_cart_',
  lead: 'conv_signup_'
};

// 화면에서 고를 수 있는 어트리뷰션 기간 (1일 클릭 · 7일 클릭)
var KAKAO_ATTRIBUTIONS = ['1d', '7d'];
var KAKAO_DEFAULT_ATTRIBUTION = '7d';

function kakaoWindow_(value) {
  var wanted = String(value || '');
  return KAKAO_ATTRIBUTIONS.indexOf(wanted) >= 0 ? wanted : KAKAO_DEFAULT_ATTRIBUTION;
}

function kakaoToken_() {
  var token = cleanToken_(PropertiesService.getScriptProperties().getProperty('KAKAO_BUSINESS_TOKEN'));
  if (!token) {
    throw new Error('KAKAO_BUSINESS_TOKEN 스크립트 속성이 없습니다. '
      + 'get_kakao_business_token.py 로 비즈니스 토큰을 받아 '
      + 'Apps Script 편집기 → 프로젝트 설정 → 스크립트 속성에 넣어 주세요. (어드민 키로는 부를 수 없습니다)');
  }
  return token;
}

// 카카오는 자주 부르면 막는다. **보고서는 앱 기준 5초에 한 번**이라 그 간격을 코드가 지킨다.
// 목록(/campaigns · /adGroups · /creatives)은 그 제한을 받지 않아 짧게만 쉰다.
var KAKAO_REPORT_GAP = 5500;
var KAKAO_LIST_GAP = 200;
var kakaoLastCall = 0;
var kakaoLastReport = 0;

function kakaoWait_(gap, isReport) {
  var since = isReport ? Math.max(kakaoLastCall, kakaoLastReport) : kakaoLastCall;
  var rest = (gap || 0) - (Date.now() - since);
  if (rest > 0) Utilities.sleep(rest);
  kakaoLastCall = Date.now();
  if (isReport) kakaoLastReport = kakaoLastCall;
}

// adAccountId 는 쿼리가 아니라 헤더로 보낸다. (계정 목록만 헤더 없이 부른다)
function kakao_(path, params, adAccountId, gap, tried) {
  // 보고서는 5.5초, 목록은 0.2초를 지킨다. (gap 을 주면 그 값을 쓴다)
  var isReport = String(path).indexOf('/report') >= 0;
  kakaoWait_(gap === undefined ? (isReport ? KAKAO_REPORT_GAP : KAKAO_LIST_GAP) : gap, isReport);

  var query = [];
  Object.keys(params || {}).forEach(function (key) {
    var value = params[key];
    if (value === undefined || value === null || value === '') return;
    query.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
  });
  var headers = { Authorization: 'Bearer ' + kakaoToken_() };
  if (adAccountId) headers.adAccountId = String(adAccountId);

  var response = UrlFetchApp.fetch(KAKAO_URL + path + (query.length ? '?' + query.join('&') : ''),
    { method: 'get', muteHttpExceptions: true, headers: headers });
  var body = {};
  try { body = JSON.parse(response.getContentText() || '{}'); } catch (error) { body = {}; }
  var code = response.getResponseCode();

  // 너무 자주 불렀다. 한 번만 쉬었다가 다시 물어본다.
  // 그래도 막히면 점점 길게 쉬며 세 번까지 되짚는다.
  var turn = (tried || 0) + 1;
  if (code === 429 && turn <= 3) return kakao_(path, params, adAccountId, KAKAO_REPORT_GAP * turn, turn);

  if (code >= 400) {
    // 카카오는 'KakaoMomentException' 처럼 뭉뚱그린 이름만 줄 때가 있다.
    // 어느 요청이 왜 막혔는지 알 수 있게 부른 자리와 응답을 그대로 실어 보낸다.
    var reason = body.msg || body.message || (body.extras && body.extras.msg) || '';
    var detail = JSON.stringify(body).slice(0, 400);
    if (!reason || reason === 'KakaoMomentException') reason = detail;
    else if (detail.indexOf(reason) < 0 || detail.length > reason.length + 20) reason += ' · ' + detail;
    if (code === 401) reason += ' (비즈니스 토큰이 만료됐거나 잘못됐습니다)';
    if (code === 403) reason += ' (앱에 카카오모먼트 권한이 없거나, 인가한 계정이 이 광고계정의 멤버가 아닙니다)';
    throw new Error('카카오모먼트 API (HTTP ' + code + ') ' + path + ': ' + reason);
  }
  return body;
}

// 목록 응답은 content · data · 배열 중 하나로 온다.
function kakaoList_(body) {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.content)) return body.content;
  if (Array.isArray(body.data)) return body.data;
  return [];
}

// 보고서 한 줄에서 결과 수를 센다. window 는 '1d' · '7d'.
function kakaoResults_(metrics, window) {
  var suffix = kakaoWindow_(window);
  var out = { purchase: 0, addToCart: 0, lead: 0 };
  if (!metrics) return out;
  Object.keys(KAKAO_RESULT_FIELDS).forEach(function (key) {
    var stem = KAKAO_RESULT_FIELDS[key];
    var value = metrics[stem + suffix];
    // 고른 기간이 안 담겨 오면 다른 기간이라도 쓴다
    if (typeof value !== 'number') {
      for (var i = 0; i < KAKAO_ATTRIBUTIONS.length; i += 1) {
        var other = metrics[stem + KAKAO_ATTRIBUTIONS[i]];
        if (typeof other === 'number') { value = other; break; }
      }
    }
    out[key] = typeof value === 'number' ? value : 0;
  });
  return out;
}

// 메타 · 구글과 같은 모양으로 맞춘다. 카카오의 클릭은 한 가지라 linkClicks 에 그대로 넣는다.
function kakaoMetrics_(metrics, base, window) {
  var found = metrics || {};
  base.spend = Number(found.cost || 0);
  base.impressions = Number(found.imp || 0);
  base.clicks = Number(found.click || 0);
  base.linkClicks = base.clicks;
  // 어트리뷰션 기간별 결과도 함께 담는다 (화면에서 결과 옆에 붙여 보여 준다)
  base.windows = {};
  KAKAO_ATTRIBUTIONS.forEach(function (name) {
    var each = kakaoResults_(found, name);
    base.windows[name] = each.purchase + each.addToCart + each.lead;
  });
  var counted = kakaoResults_(found, window);
  base.purchase = counted.purchase;
  base.addToCart = counted.addToCart;
  base.lead = counted.lead;
  base.results = base.purchase + base.addToCart + base.lead;
  return base;
}

// 보고서 줄을 id 로 모은다. 같은 id 가 여러 줄로 나뉘어 오면 더한다.
// 카카오가 dimensions 의 키를 campaign_id 로 줄 때도 campaignId 로 줄 때도 있어 둘 다 받는다.
function kakaoDimension_(dimensions, idField) {
  var camel = idField.replace(/_([a-z])/g, function (all, letter) { return letter.toUpperCase(); });
  var value = dimensions[idField] || dimensions[camel];
  if (value) return String(value);
  // 그래도 못 찾으면 id 로 끝나는 칸을 찾아 쓴다 (키 이름이 또 바뀌어도 버티게)
  var keys = Object.keys(dimensions);
  for (var i = 0; i < keys.length; i += 1) {
    if (/(_id|Id)$/.test(keys[i]) && dimensions[keys[i]]) return String(dimensions[keys[i]]);
  }
  return '';
}

function kakaoRollUp_(rows, idField) {
  var out = {};
  rows.forEach(function (row) {
    var id = kakaoDimension_(row.dimensions || {}, idField);
    if (!id) return;
    var metrics = row.metrics || {};
    if (!out[id]) out[id] = {};
    Object.keys(metrics).forEach(function (key) {
      if (typeof metrics[key] !== 'number') return;
      out[id][key] = (out[id][key] || 0) + metrics[key];
    });
  });
  return out;
}

function kakaoDates_(payload) {
  var since = String(payload.since || '');
  var until = String(payload.until || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    throw new Error('조회 기간이 올바르지 않습니다.');
  }
  var days = Math.round((new Date(until) - new Date(since)) / 86400000) + 1;
  if (days > KAKAO_MAX_DAYS) {
    throw new Error('카카오는 한 번에 ' + KAKAO_MAX_DAYS + '일까지만 봅니다. 기간을 줄여 주세요.');
  }
  return { since: since, until: until, start: since.replace(/-/g, ''), end: until.replace(/-/g, '') };
}

function kakaoChunks_(list, size) {
  var out = [];
  for (var at = 0; at < list.length; at += size) out.push(list.slice(at, at + size));
  return out;
}

// 토큰으로 볼 수 있는 광고계정 목록
function kakaoAccounts_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('kakaoAccounts');
  if (hit) return JSON.parse(hit);

  // 파라미터를 붙이지 않는다. 기본값이 이미 'ON, OFF · 첫 쪽' 이고,
  // config 를 쉼표로 붙여 보내면 400 을 주는 경우가 있다.
  var list = kakaoList_(kakao_('/adAccounts/pages', null, null, 0))
    .map(function (row) {
      return {
        id: String(row.id),
        accountId: String(row.id),
        name: row.name || String(row.id),
        currency: 'KRW',
        disabled: !!(row.config && row.config !== 'ON')
      };
    });
  cache.put('kakaoAccounts', JSON.stringify(list), 600);
  return list;
}

// 계정 이름은 목록에서 찾아 쓴다. 목록을 못 받으면 번호를 그대로 쓴다.
function kakaoAccountName_(account) {
  try {
    var found = null;
    kakaoAccounts_().forEach(function (row) { if (row.id === String(account)) found = row.name; });
    return found || String(account);
  } catch (error) {
    return String(account);
  }
}

function kakaoCache_(cache, key, result) {
  var text = JSON.stringify(result);
  if (text.length < 90000) cache.put(key, text, META_CACHE_SECONDS);
  return result;
}

function kakaoReport_(payload) {
  var account = String(payload.account || '').replace(/[^0-9]/g, '');
  if (!account) throw new Error('광고 계정을 고르지 않았습니다.');
  var when = kakaoDates_(payload);

  var window = kakaoWindow_(payload.attribution);
  var cache = CacheService.getScriptCache();
  var key = ['kakao', account, when.since, when.until, window].join('|');
  if (!payload.refresh) {
    var hit = cache.get(key);
    if (hit) {
      var cached = JSON.parse(hit);
      cached.cached = true;
      return cached;
    }
  }

  // 캠페인 이름 · 유형 · 예산은 목록에서, 숫자는 보고서에서 온다. (보고서에는 id 만 담겨 온다)
  // 지워진 캠페인도 이름을 알아야 한다. 보고서에는 그 캠페인의 광고비가 그대로 남아 있어서,
  // ON,OFF 만 물으면 '(지워진 캠페인) 1488536' 처럼 번호만 뜬다.
  var campaignRows = kakaoList_(kakao_('/campaigns', { config: 'ON,OFF,DEL' }, account, 0));
  var campaignReport = kakaoRollUp_(kakaoList_(kakao_('/adAccounts/report', {
    adAccountId: account, start: when.start, end: when.end,
    metricsGroup: KAKAO_METRICS, level: 'CAMPAIGN'
  }, account, 5000)), 'campaign_id');

  var campaigns = {};
  campaignRows.forEach(function (row) {
    var id = String(row.id);
    var goal = row.campaignTypeGoal || {};
    campaigns[id] = kakaoMetrics_(campaignReport[id], {
      id: id,
      name: row.name || id,
      objective: goal.campaignType || '',
      active: row.config === 'ON' && row.systemConfig !== 'ADMIN_STOP',
      status: row.config || '',
      budget: Number(row.dailyBudgetAmount || 0),
      budgetKind: row.dailyBudgetAmount ? 'daily' : ''
    }, window);
  });
  // 목록에 없지만 보고서에는 있는 캠페인. 광고비에서 빠지면 안 된다.
  // 카카오톡 채널 메시지(TALK_CHANNEL) 캠페인이 여기 걸린다 — /campaigns 목록에 안 나오고,
  // 단건 조회(/campaigns/{id})로는 이름이 나온다. 광고비가 큰 쪽 몇 개만 이름을 찾아 온다.
  var strangers = Object.keys(campaignReport).filter(function (id) { return !campaigns[id]; })
    .sort(function (a, b) {
      return Number((campaignReport[b] || {}).cost || 0) - Number((campaignReport[a] || {}).cost || 0);
    });
  strangers.forEach(function (id, at) {
    var name = '(목록에 없는 캠페인) ' + id;
    var objective = '';
    var live = false;
    if (at < KAKAO_CAMPAIGN_LIMIT) {
      try {
        var one = kakao_('/campaigns/' + id, null, account);
        if (one && one.name) {
          name = one.name;
          objective = (one.campaignTypeGoal || {}).campaignType || '';
          live = one.config === 'ON';
        }
      } catch (error) { /* 지워졌거나 볼 수 없는 캠페인 */ }
    }
    campaigns[id] = kakaoMetrics_(campaignReport[id], {
      id: id, name: name, objective: objective,
      active: live, status: live ? 'ON' : 'DEL', budget: 0, budgetKind: ''
    }, window);
  });

  // 광고그룹은 캠페인을 5개씩 묶어 물어본다. 광고비가 큰 캠페인부터 정해 둔 수만큼만 본다.
  var digging = Object.keys(campaigns)
    .filter(function (id) { return campaigns[id].spend > 0 || campaigns[id].active; })
    .sort(function (a, b) { return campaigns[b].spend - campaigns[a].spend; })
    .slice(0, KAKAO_CAMPAIGN_LIMIT);

  var adsetReport = {};
  kakaoChunks_(digging, KAKAO_CAMPAIGN_CHUNK).forEach(function (chunk) {
    var rolled = kakaoRollUp_(kakaoList_(kakao_('/campaigns/report', {
      campaignId: chunk.join(','), start: when.start, end: when.end,
      metricsGroup: KAKAO_METRICS, level: 'AD_GROUP'
    }, account, 5000)), 'ad_group_id');
    Object.keys(rolled).forEach(function (id) { adsetReport[id] = rolled[id]; });
  });

  // 광고그룹 이름 · 상태는 목록에서 따로 받는다 (캠페인마다 한 번)
  // 보고서에는 지워진 캠페인도 들어 있다. 그 id 로 목록을 물으면
  // '캠페인이 존재하지 않습니다' 로 400 이 나므로, 그 캠페인만 건너뛴다.
  var adsets = {};
  digging.forEach(function (campaignId) {
    var groupRows = [];
    try {
      groupRows = kakaoList_(kakao_('/adGroups', { campaignId: campaignId, config: 'ON,OFF' }, account));
    } catch (error) {
      return;   // 지워졌거나 볼 수 없는 캠페인
    }
    groupRows.forEach(function (row) {
      var id = String(row.id);
      adsets[id] = kakaoMetrics_(adsetReport[id], {
        id: id,
        name: row.name || id,
        campaignId: String(campaignId),
        objective: campaigns[campaignId] ? campaigns[campaignId].objective : '',
        active: row.config === 'ON' && row.systemConfig !== 'ADMIN_STOP',
        status: row.config || '',
        budget: Number(row.dailyBudgetAmount || 0),
        budgetKind: row.dailyBudgetAmount ? 'daily' : '',
        goal: row.bidStrategy || row.pricingType || ''
      }, window);
    });
  });
  // 목록에 없는데 숫자만 있는 광고그룹 (지워졌지만 기간 안에는 돈을 쓴 것)
  Object.keys(adsetReport).forEach(function (id) {
    if (adsets[id]) return;
    adsets[id] = kakaoMetrics_(adsetReport[id], {
      id: id, name: '(지워진 광고그룹) ' + id, campaignId: '', objective: '',
      active: false, status: 'DEL', budget: 0, budgetKind: '', goal: ''
    }, window);
  });

  return kakaoCache_(cache, key, {
    ok: true,
    source: 'kakao',
    account: { id: account, name: kakaoAccountName_(account), currency: 'KRW', timezone: 'Asia/Seoul' },
    range: { since: when.since, until: when.until },
    attribution: window,
    campaigns: sortBySpend_(campaigns),
    adsets: sortBySpend_(adsets),
    fetchedAt: new Date().toISOString()
  });
}

function kakaoCreatives_(payload) {
  var account = String(payload.account || '').replace(/[^0-9]/g, '');
  if (!account) throw new Error('광고 계정을 고르지 않았습니다.');
  var when = kakaoDates_(payload);

  var campaign = String(payload.campaign || '').replace(/[^0-9]/g, '');
  var adGroup = String(payload.adset || '').replace(/[^0-9]/g, '');
  var window = kakaoWindow_(payload.attribution);
  var cache = CacheService.getScriptCache();
  var key = ['kakaoAds', account, campaign, adGroup, when.since, when.until, window].join('|');
  if (!payload.refresh) {
    var hit = cache.get(key);
    if (hit) {
      var cached = JSON.parse(hit);
      cached.cached = true;
      return cached;
    }
  }

  // 어느 광고그룹을 볼지는 매체별 성과와 같은 보고서에서 고른다.
  // (그 화면이 먼저 부르고 담아 두므로 대개 다시 묻지 않는다)
  var report = kakaoReport_({ account: account, since: when.since, until: when.until, attribution: window });
  var picked = report.adsets.filter(function (row) {
    if (adGroup) return row.id === adGroup;
    if (campaign) return row.campaignId === campaign;
    return true;
  }).sort(function (a, b) { return b.spend - a.spend; }).slice(0, KAKAO_ADGROUP_CHUNK);

  var empty = {
    ok: true, source: 'kakao', scope: adGroup || campaign || account,
    range: { since: when.since, until: when.until }, creatives: [], fetchedAt: new Date().toISOString()
  };
  if (!picked.length) return empty;

  var byAdset = {};
  picked.forEach(function (row) { byAdset[row.id] = row; });

  var rows = kakaoList_(kakao_('/adGroups/report', {
    adGroupId: picked.map(function (row) { return row.id; }).join(','),
    start: when.start, end: when.end, metricsGroup: KAKAO_METRICS, level: 'CREATIVE'
  }, account, 5000));

  // 소재 줄에 광고그룹 id 도 함께 오면 어느 그룹 것인지 이어 둔다.
  var owner = {};
  rows.forEach(function (row) {
    var dimensions = row.dimensions || {};
    var creative = dimensions.creative_id || dimensions.creativeId;
    var group = dimensions.ad_group_id || dimensions.adGroupId;
    if (creative && group) owner[String(creative)] = String(group);
  });

  var rolled = kakaoRollUp_(rows, 'creative_id');
  var campaignName = {};
  report.campaigns.forEach(function (row) { campaignName[row.id] = row.name; });

  var creatives = Object.keys(rolled).map(function (id) {
    var parent = byAdset[owner[id]] || {};
    return kakaoMetrics_(rolled[id], {
      id: id,
      name: id,
      campaignId: parent.campaignId || campaign,
      campaignName: campaignName[parent.campaignId] || '',
      adsetId: owner[id] || adGroup,
      adsetName: parent.name || '',
      objective: parent.objective || '',
      active: false, status: '', thumbnail: '', video: ''
    }, window);
  }).sort(function (a, b) { return b.spend - a.spend; }).slice(0, CREATIVE_LIMIT);

  kakaoFillCreatives_(creatives, account);
  return kakaoCache_(cache, key, {
    ok: true, source: 'kakao', scope: adGroup || campaign || account,
    range: { since: when.since, until: when.until },
    creatives: creatives, fetchedAt: new Date().toISOString()
  });
}

// 소재 이름 · 상태는 광고그룹마다 한 번, 미리보기 이미지는 소재마다 한 번 물어본다.
// 보고서에는 이름도 이미지도 담겨 오지 않는다. 호출이 늘어나므로 위쪽부터 정해 둔 수만큼만 본다.
function kakaoFillCreatives_(creatives, account) {
  var groups = [];
  creatives.forEach(function (row) {
    if (row.adsetId && groups.indexOf(row.adsetId) < 0) groups.push(row.adsetId);
  });

  var known = {};
  groups.forEach(function (adGroupId) {
    try {
      kakaoList_(kakao_('/creatives', { adGroupId: adGroupId, config: 'ON,OFF' }, account)).forEach(function (row) {
        known[String(row.id)] = row;
      });
    } catch (error) { /* 이 광고그룹은 볼 수 없다 */ }
  });

  creatives.forEach(function (row) {
    var found = known[row.id];
    if (!found) return;
    row.name = found.name || row.name;
    row.status = found.config || '';
    row.active = found.config === 'ON';
  });

  creatives.slice(0, KAKAO_CREATIVE_LOOKUP).forEach(function (row) {
    try {
      row.thumbnail = kakaoImage_(kakao_('/creatives/' + row.id, null, account)) || '';
    } catch (error) { /* 이 소재는 볼 수 없다 */ }
  });
}

// 소재 응답 어디에 이미지 주소가 들어 있는지는 소재 유형마다 다르다. 처음 찾은 그림 주소를 쓴다.
function kakaoImage_(node, depth) {
  if (!node || (depth || 0) > 4) return '';
  if (typeof node === 'string') {
    return /^https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(node) ? node : '';
  }
  if (typeof node !== 'object') return '';
  var keys = Object.keys(node);
  for (var i = 0; i < keys.length; i += 1) {
    var found = kakaoImage_(node[keys[i]], (depth || 0) + 1);
    if (found) return found;
  }
  return '';
}

// 카카오 연결 확인 — 시트 UTM 메뉴에서 부른다.
// 전환 지표 이름이 계정마다 달라서, 어떤 이름으로 오는지 그대로 보여 준다.
// (KAKAO_RESULT_FIELDS 를 그 이름에 맞춰 고치면 결과 수가 정확해진다)
function checkKakaoToken() {
  var message;
  try {
    CacheService.getScriptCache().remove('kakaoAccounts');
    var accounts = kakaoAccounts_();
    message = '연결됐습니다. 광고계정 ' + accounts.length + '개\n\n'
      + accounts.map(function (account) {
        return '· ' + account.name + ' (' + account.accountId + ')' + (account.disabled ? ' · 중지됨' : '');
      }).join('\n');

    if (accounts.length) {
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      var day = Utilities.formatDate(yesterday, 'Asia/Seoul', 'yyyyMMdd');
      var rows = kakaoList_(kakao_('/adAccounts/report', {
        adAccountId: accounts[0].accountId, start: day, end: day,
        metricsGroup: KAKAO_METRICS, level: 'CAMPAIGN'
      }, accounts[0].accountId, 5000));
      var metrics = (rows[0] && rows[0].metrics) || {};
      var names = Object.keys(metrics).sort();
      message += '\n\n어제(' + day + ') ' + accounts[0].name + ' 보고서 줄 ' + rows.length + '개'
        + '\n\n[보고서 첫 줄 원문]\n' + JSON.stringify(rows[0] || {}).slice(0, 900)
        + '\n\n받은 지표 이름 ' + names.length + '개:\n' + (names.join(', ') || '(없음)')
        + '\n\n결과로 센 값 (1일 클릭): ' + JSON.stringify(kakaoResults_(metrics, '1d'))
        + '\n결과로 센 값 (7일 클릭): ' + JSON.stringify(kakaoResults_(metrics, '7d'));

      // 캠페인 목록의 칸 이름도 함께 본다 (유형 · 예산이 비어 보이는 이유를 찾으려고)
      var one = kakaoList_(kakao_('/campaigns', null, accounts[0].accountId, 0))[0];
      message += '\n\n[캠페인 목록 첫 줄 원문]\n' + JSON.stringify(one || {}).slice(0, 700);
    }
  } catch (error) {
    message = '연결하지 못했습니다.\n\n' + (error && error.message ? error.message : error)
      + '\n\n넣어 둔 토큰: ' + kakaoTokenShape_()
      + '\n(비즈니스 토큰이어야 합니다. 어드민 키로는 부를 수 없습니다)';
  }
  Logger.log(message);
  try { SpreadsheetApp.getUi().alert(message); } catch (ignore) { /* 로그로만 */ }
  return message;
}

function kakaoTokenShape_() {
  var token = cleanToken_(PropertiesService.getScriptProperties().getProperty('KAKAO_BUSINESS_TOKEN'));
  if (!token) return '스크립트 속성이 비어 있습니다';
  return token.length + '자, ' + token.slice(0, 4) + '… 로 시작';
}

// ── 상세 보기 (게재지면 · 연령대 · 성별 · 위치) ────────────────────────
// 매체마다 부르는 이름이 달라서 화면이 쓰는 한 낱말로 맞춰 둔다.
//   placement 게재지면 · age 연령대 · gender 성별 · region 위치
// 한 번에 하나씩만 쪼갠다. (여러 개를 겹치면 줄 수가 폭발하고 매체마다 되는 조합이 다르다)
var META_BREAKDOWNS = {
  placement: 'publisher_platform,platform_position',
  age: 'age',
  gender: 'gender',
  region: 'region'
};

var KAKAO_BREAKDOWNS = {
  placement: 'PLACEMENT',
  age: 'AGE_BAND',
  gender: 'GENDER',
  region: 'LOCATION'
};

// 구글은 쪼개기마다 보는 자리(리소스)가 다르다. 위치는 지역 번호만 와서 아직 붙이지 않았다.
var ADS_BREAKDOWNS = {
  placement: { from: 'campaign', field: 'segments.ad_network_type', pick: function (row) { return (row.segments || {}).adNetworkType; } },
  age: { from: 'age_range_view', field: 'ad_group_criterion.age_range.type', pick: function (row) { return ((row.adGroupCriterion || {}).ageRange || {}).type; } },
  gender: { from: 'gender_view', field: 'ad_group_criterion.gender.type', pick: function (row) { return ((row.adGroupCriterion || {}).gender || {}).type; } }
};

var BREAKDOWN_CACHE_SECONDS = 600;

// 상세 한 줄도 캠페인 줄과 같은 칸을 쓴다. 화면이 같은 코드로 그린다.
function breakdownRow_(label, base) {
  base.id = label;
  base.name = label || '(알 수 없음)';
  return base;
}

function breakdownSort_(rows) {
  return rows.sort(function (a, b) {
    if (b.spend !== a.spend) return b.spend - a.spend;
    return String(a.name).localeCompare(String(b.name));
  });
}

// ── 메타 ────────────────────────────────────────────────────────
function metaBreakdown_(payload) {
  var breakdown = META_BREAKDOWNS[payload.breakdown];
  if (!breakdown) throw new Error('모르는 상세 항목입니다: ' + payload.breakdown);

  var account = String(payload.account || '').trim();
  if (account && account.indexOf('act_') !== 0) account = 'act_' + account;
  var scope = String(payload.adset || payload.campaign || account).trim();
  if (!scope) throw new Error('광고 계정을 고르지 않았습니다.');

  var since = String(payload.since || '');
  var until = String(payload.until || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    throw new Error('조회 기간이 올바르지 않습니다.');
  }

  var cache = CacheService.getScriptCache();
  var key = ['metaBd', scope, payload.breakdown, since, until].join('|');
  if (!payload.refresh) {
    var hit = cache.get(key);
    if (hit) return JSON.parse(hit);
  }

  var rows = graphAll_('/' + scope + '/insights', {
    breakdowns: breakdown,
    fields: 'spend,impressions,clicks,inline_link_clicks,actions,catalog_segment_actions',
    time_range: JSON.stringify({ since: since, until: until }),
    limit: 300,
    use_unified_attribution_setting: 'true', action_attribution_windows: META_WINDOWS.join(',')
  }, 5);

  var out = rows.map(function (row) {
    var label = payload.breakdown === 'placement'
      ? [row.publisher_platform, row.platform_position].filter(function (part) { return !!part; }).join(' · ')
      : (row[payload.breakdown] || '');
    return breakdownRow_(label, metrics_(row, {}));
  });

  return breakdownCache_(cache, key, { ok: true, source: 'meta', breakdown: payload.breakdown, rows: breakdownSort_(out) });
}

// ── 카카오 ──────────────────────────────────────────────────────
function kakaoBreakdown_(payload) {
  var dimension = KAKAO_BREAKDOWNS[payload.breakdown];
  if (!dimension) throw new Error('모르는 상세 항목입니다: ' + payload.breakdown);

  var account = String(payload.account || '').replace(/[^0-9]/g, '');
  if (!account) throw new Error('광고 계정을 고르지 않았습니다.');
  var when = kakaoDates_(payload);
  var window = kakaoWindow_(payload.attribution);
  var campaign = String(payload.campaign || '').replace(/[^0-9]/g, '');

  var cache = CacheService.getScriptCache();
  var key = ['kakaoBd', account, campaign, payload.breakdown, when.since, when.until, window].join('|');
  if (!payload.refresh) {
    var hit = cache.get(key);
    if (hit) return JSON.parse(hit);
  }

  // 캠페인을 고르면 그 캠페인만, 아니면 계정 전체를 쪼갠다.
  var rows = campaign
    ? kakaoList_(kakao_('/campaigns/report', {
        campaignId: campaign, start: when.start, end: when.end,
        metricsGroup: KAKAO_METRICS, dimension: dimension, level: 'CAMPAIGN'
      }, account, 5000))
    : kakaoList_(kakao_('/adAccounts/report', {
        adAccountId: account, start: when.start, end: when.end,
        metricsGroup: KAKAO_METRICS, dimension: dimension
      }, account, 5000));

  // dimensions 에는 id 칸과 쪼갠 칸이 함께 온다. id 가 아닌 쪽이 우리가 볼 이름이다.
  var merged = {};
  rows.forEach(function (row) {
    var dimensions = row.dimensions || {};
    var label = '';
    Object.keys(dimensions).forEach(function (name) {
      if (/(_id|Id)$/.test(name)) return;
      if (!label) label = String(dimensions[name]);
    });
    if (!merged[label]) merged[label] = {};
    var metrics = row.metrics || {};
    Object.keys(metrics).forEach(function (name) {
      if (typeof metrics[name] !== 'number') return;
      merged[label][name] = (merged[label][name] || 0) + metrics[name];
    });
  });

  var out = Object.keys(merged).map(function (label) {
    return breakdownRow_(label, kakaoMetrics_(merged[label], {}, window));
  });

  return breakdownCache_(cache, key, { ok: true, source: 'kakao', breakdown: payload.breakdown, rows: breakdownSort_(out) });
}

// ── 구글 ────────────────────────────────────────────────────────
function adsBreakdown_(payload) {
  var spec = ADS_BREAKDOWNS[payload.breakdown];
  if (!spec) {
    throw new Error('구글은 이 항목을 아직 볼 수 없습니다: ' + payload.breakdown
      + ' (게재지면 · 연령대 · 성별만 됩니다)');
  }

  var customer = String(payload.account || '').replace(/[^0-9]/g, '');
  if (!customer) throw new Error('광고 계정을 고르지 않았습니다.');
  var since = String(payload.since || '');
  var until = String(payload.until || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    throw new Error('조회 기간이 올바르지 않습니다.');
  }
  var campaign = String(payload.campaign || '').replace(/[^0-9]/g, '');

  var cache = CacheService.getScriptCache();
  var key = ['adsBd', customer, campaign, payload.breakdown, since, until].join('|');
  if (!payload.refresh) {
    var hit = cache.get(key);
    if (hit) return JSON.parse(hit);
  }

  var where = ' WHERE segments.date BETWEEN "' + since + '" AND "' + until + '"'
    + (campaign ? ' AND campaign.id = ' + campaign : '');
  var rows = adsQuery_(customer, 'SELECT ' + spec.field + ', '
    + 'metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions '
    + 'FROM ' + spec.from + where, 8);

  // 같은 값이 광고그룹마다 나뉘어 오므로 이름으로 모은다.
  var merged = {};
  rows.forEach(function (row) {
    var label = String(spec.pick(row) || '');
    if (!merged[label]) merged[label] = { costMicros: 0, impressions: 0, clicks: 0, conversions: 0 };
    var metrics = row.metrics || {};
    merged[label].costMicros += Number(metrics.costMicros || 0);
    merged[label].impressions += Number(metrics.impressions || 0);
    merged[label].clicks += Number(metrics.clicks || 0);
    merged[label].conversions += Number(metrics.conversions || 0);
  });

  var out = Object.keys(merged).map(function (label) {
    return breakdownRow_(label, adsMetrics_({ metrics: merged[label] }, null, {}));
  });

  return breakdownCache_(cache, key, { ok: true, source: 'google', breakdown: payload.breakdown, rows: breakdownSort_(out) });
}

function breakdownCache_(cache, key, result) {
  var text = JSON.stringify(result);
  if (text.length < 90000) cache.put(key, text, BREAKDOWN_CACHE_SECONDS);
  return result;
}
