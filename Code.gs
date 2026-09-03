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
  ['인플루언서', 'influencer', 'affiliate']
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
    .addItem('Clarity 연결 확인', 'checkClarity')
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
  // 상품명 칸에는 앱이 **영어 제품코드**(flender-max)를 넣는다. 그래서 한글로 못 찾으면
  // 제품코드(I열)로 한 번 더 찾는다. 사람이 한글로 적어 둔 옛 줄도 그대로 계산된다.
  var productFull = 'IFERROR(VLOOKUP(' + productKo + ',' + cfg + '$H:$J,3,FALSE),'
    + 'IFERROR(VLOOKUP(' + productKo + ',' + cfg + '$I:$J,2,FALSE),' + productKo + '))';
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

// ── 설정 탭 대응표 읽기 · 쓰기 (워크스페이스 'UTM 빌더' 화면) ──────────
// 설정 탭이 시트 수식의 기준표다. 빌더에서 매체 · 상품을 새로 만들면 여기에도 넣어야
// 적재된 줄의 UTM 수식이 값을 찾는다. 반대로 빌더는 이 표를 읽어 드롭다운을 채운다.

function configRead_(config, column, width) {
  var last = config.getLastRow();
  if (last < 2) return [];
  var out = [];
  config.getRange(2, column, last - 1, width).getValues().forEach(function (line) {
    var name = String(line[0]).trim();
    if (!name) return;
    out.push(line.map(function (value) { return String(value).trim(); }));
  });
  return out;
}

function configList_() {
  var config = ensureConfigSheet_(SpreadsheetApp.openById(SHEET_ID));
  return {
    ok: true,
    media: configRead_(config, 1, 3),    // 매체 · utm_source · utm_medium
    purpose: configRead_(config, 5, 2),  // 목적 · 목적(영문)
    product: configRead_(config, 8, 2),  // 상품명 · 제품코드
    sales: configRead_(config, 11, 2)    // 행사채널 · 매출채널(영문)
  };
}

function configAdd_(payload) {
  var kind = String(payload.kind || '').trim();
  var name = String(payload.name || '').trim();
  if (!name) return { ok: false, error: '이름이 비어 있습니다.' };

  var column;
  var row;
  if (kind === 'media') {
    var source = String(payload.source || '').trim();
    if (!source) return { ok: false, error: 'utm_source 가 비어 있습니다.' };
    column = 1;
    row = [name, source, String(payload.medium || '').trim()];
  } else if (kind === 'product') {
    var code = String(payload.code || '').trim();
    if (!code) return { ok: false, error: '제품코드가 비어 있습니다.' };
    column = 8;
    row = [name, code];
  } else {
    return { ok: false, error: '모르는 종류입니다: ' + kind };
  }

  var config = ensureConfigSheet_(SpreadsheetApp.openById(SHEET_ID));

  // 이미 있으면 덮어쓰지 않는다. 사람이 시트에서 고쳐 둔 값을 지우면 안 된다.
  var last = config.getLastRow();
  if (last > 1) {
    var have = config.getRange(2, column, last - 1, 1).getValues();
    for (var i = 0; i < have.length; i += 1) {
      if (String(have[i][0]).trim() === name) return { ok: true, added: false, reason: '이미 있음' };
    }
  }

  addMissingRows_(config, column, [row]);
  return { ok: true, added: true };
}

// ── 발번 기록 조회 (워크스페이스 '광고소재 검수' 화면) ──────────────────
// 여러 명이 쓰는 워크스페이스다. 브라우저에 남은 값은 그 사람 것뿐이라 기준이 될 수 없다.
// 파일명 화면이 적재해 둔 이 시트가 팀이 함께 보는 기준이므로 여기서 행사명 · 매체를 읽는다.
var RECENT_LIMIT = 80;

function filenameRecent_(payload) {
  var book = SpreadsheetApp.openById(SHEET_ID);
  var want = String((payload && payload.sheet) || '').trim();
  var tabs = (want && PART_SHEETS.indexOf(want) >= 0) ? [want] : PART_SHEETS;

  var out = [];
  tabs.forEach(function (name) {
    var sheet = book.getSheetByName(name);
    if (!sheet) return;
    var last = sheet.getLastRow();
    if (last < 2) return;
    var map = headerMap_(sheet);
    var width = sheet.getLastColumn();
    // 뒤에 붙는 시트라 아래쪽이 최신이다. 끝에서부터 필요한 만큼만 읽는다.
    var from = Math.max(2, last - RECENT_LIMIT + 1);
    sheet.getRange(from, 1, last - from + 1, width).getValues().forEach(function (line, i) {
      var get = function (label) { return map[label] ? String(line[map[label] - 1]).trim() : ''; };
      var campaign = get('행사명');
      var filename = get('파일명');
      if (!campaign && !filename) return;
      out.push({
        part: name,
        row: from + i,
        campaign: campaign,
        filename: filename,
        media: get('매체'),
        product: get('상품명'),
        channel: get('행사채널')
      });
    });
  });

  // 최신이 앞으로 오게 뒤집는다
  return { ok: true, rows: out.reverse().slice(0, RECENT_LIMIT) };
}

// ── 콘텐츠 T&D 적재 (워크스페이스 '광고소재 T&D' 화면) ─────────────────
// 대상: "[통합] 콘텐츠 T&D" 시트의 매체별 탭. 탭마다 형식이 달라 [DA] 계열만 다룬다.
// 한 행사 = 한 블록이고, 블록은 위에서부터 최신순으로 쌓인다. 그래서 맨 위에 끼워 넣는다.
//
//   🔴{행사명}
//   행사명 | 구좌 | 파일명 | 광고문구 (피드65) (쇼핑57)
//   {행사명} | 피드     | 소재 전체 | {문구}
//           | 스마트채널 | new-9    | {문구}      ← 구좌는 바뀔 때만 적는다
var TND_SHEET_ID = '1dTWgLMwhFwitX4h7yXMJiCteO9n9IwqZfoApNLnp2J0';
var TND_HEADER = ['행사명', '구좌', '파일명', '광고문구 (피드65) (쇼핑57)'];
var TND_TABS = ['[DA] GFA', '[DA] 메타', '[DA] 카카오', '[DA] 구글 디맨드젠', '[DA] 당근'];

function tndAppend_(payload) {
  var tab = String(payload.tab || TND_TABS[0]).trim();
  var campaign = String(payload.campaign || '').trim();
  var rows = payload.rows || [];

  if (!campaign) return { ok: false, error: '행사명이 비어 있습니다.' };
  if (!rows.length) return { ok: false, error: '적재할 줄이 없습니다.' };
  // 형식이 다른 탭에 잘못 넣으면 되돌리기 어렵다. 아는 탭만 받는다.
  if (TND_TABS.indexOf(tab) < 0) return { ok: false, error: '적재할 수 없는 탭입니다: ' + tab };

  var sheet = SpreadsheetApp.openById(TND_SHEET_ID).getSheetByName(tab);
  if (!sheet) return { ok: false, error: '탭을 찾을 수 없습니다: ' + tab };

  var grid = [];
  grid.push(['🔴' + campaign, '', '', '']);
  grid.push(TND_HEADER);
  var lastSlot = '';
  rows.forEach(function (row, i) {
    var slot = String(row.slot || '').trim();
    grid.push([
      i === 0 ? campaign : '',
      slot && slot !== lastSlot ? slot : '',
      String(row.filename || '').trim(),
      String(row.copy || '')
    ]);
    if (slot) lastSlot = slot;
  });

  sheet.insertRowsBefore(1, grid.length);
  sheet.getRange(1, 2, grid.length, 4).setValues(grid); // A열은 비워 두는 시트다
  sheet.getRange(1, 2, grid.length, 4).setVerticalAlignment('top');
  sheet.getRange(1, 5, grid.length, 1).setWrap(true);

  return { ok: true, tab: tab, campaign: campaign, added: rows.length };
}

// 적재 전에 그 탭 맨 위 블록을 보여 준다 (같은 행사를 두 번 넣지 않도록)
function tndTop_(payload) {
  var tab = String(payload.tab || TND_TABS[0]).trim();
  if (TND_TABS.indexOf(tab) < 0) return { ok: false, error: '모르는 탭입니다: ' + tab };
  var sheet = SpreadsheetApp.openById(TND_SHEET_ID).getSheetByName(tab);
  if (!sheet) return { ok: false, error: '탭을 찾을 수 없습니다: ' + tab };
  if (sheet.getLastRow() < 1) return { ok: true, tab: tab, campaign: '' };
  var head = String(sheet.getRange(1, 2).getValue()).trim();
  return { ok: true, tab: tab, campaign: head.replace(/^🔴\s*/, '') };
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

// 광고 계정 목록은 몇 달에 한 번 바뀐다. 10분만 담아 두면 그 10분마다 누군가
// 계정 목록 때문에 10~17초를 기다린다. 6시간 담아 둔다 —
// 계정을 새로 만든 날은 시트 메뉴의 '연결 확인' 이 이 값을 지우고 다시 읽는다.
var ACCOUNT_CACHE_SECONDS = 21600;

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
    // 네이버 GFA 는 공개 API 가 없어 PC 의 스크래퍼가 적재하고, 화면은 그 시트를 읽는다.
    if (payload.action === 'naverAccounts') return { ok: true, accounts: naverAccounts_() };
    if (payload.action === 'naverReport') return naverReport_(payload);
    if (payload.action === 'naverCreatives') return naverCreatives_(payload);
    if (payload.action === 'naverAppend') return naverAppend_(payload);
    // 페이지 결과 (Microsoft Clarity)
    if (payload.action === 'clarityReport') return clarityReport_(payload);
    if (payload.action === 'clarityPages') return clarityPages_(payload);
    if (payload.action === 'clarityPage') return clarityPage_(payload);
    if (payload.action === 'budgetPlan') return budgetPlan_(payload);
    if (payload.action === 'kolLive') return kolLive_(payload);
    if (payload.action === 'configList') return configList_();
    if (payload.action === 'configAdd') return configAdd_(payload);
    if (payload.action === 'tndAppend') return tndAppend_(payload);
    if (payload.action === 'tndTop') return tndTop_(payload);
    if (payload.action === 'tndFilenames') return tndFilenames_(payload);
    if (payload.action === 'filenameRecent') return filenameRecent_(payload);
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
  cache.put('metaAccounts', JSON.stringify(list), ACCOUNT_CACHE_SECONDS);
  return list;
}

// 정해 둔 id 로 계정을 물어본다. 볼 수 없는 계정은 건너뛴다.
// **한꺼번에 부른다.** 하나씩 차례로 부르면 계정 8개에 17초가 걸렸다.
// ids= 로 묶어 한 번에 물어보는 방법을 먼저 썼다가 되돌렸다 — 볼 수 없는 계정이 하나라도
// 섞이면 묶음이 통째로 빈 답을 주고, 그래서 계정 목록이 0개가 됐다.
// fetchAll 은 계정마다 따로 답을 주므로 하나가 막혀도 나머지는 그대로 온다.
function listedAccounts_() {
  var raw = PropertiesService.getScriptProperties().getProperty('META_AD_ACCOUNTS');
  var ids = raw ? String(raw).split(',') : DEFAULT_AD_ACCOUNTS.map(function (row) { return row[1]; });
  var names = {};
  DEFAULT_AD_ACCOUNTS.forEach(function (row) { names[row[1]] = row[0]; });

  var wanted = [];
  ids.forEach(function (value) {
    var id = String(value).trim();
    if (!id) return;
    if (id.indexOf('act_') !== 0) id = 'act_' + id;
    if (wanted.indexOf(id) < 0) wanted.push(id);
  });
  if (!wanted.length) return [];

  var token = metaToken_();
  var requests = wanted.map(function (id) {
    return {
      url: GRAPH_URL + '/' + id + '?fields=name,currency,account_status'
        + '&access_token=' + encodeURIComponent(token),
      method: 'get',
      muteHttpExceptions: true
    };
  });

  var answers = [];
  try {
    answers = UrlFetchApp.fetchAll(requests);
  } catch (error) {
    answers = [];
  }

  var out = [];
  var trouble = '';
  wanted.forEach(function (id, i) {
    var response = answers[i];
    if (!response) return;
    var body = {};
    try { body = JSON.parse(response.getContentText() || '{}'); } catch (ignore) { body = {}; }
    if (response.getResponseCode() >= 400 || body.error) {
      // 볼 수 없는 계정. 무엇이 막혔는지는 하나만 적어 둔다 (전부 막혔을 때 알려 주려고)
      if (!trouble) trouble = (body.error && (body.error.message || body.error.type)) || ('HTTP ' + response.getResponseCode());
      return;
    }
    out.push({
      id: id,
      accountId: id.replace('act_', ''),
      name: body.name || names[id] || id,
      currency: body.currency || 'KRW',
      disabled: Number(body.account_status) !== 1
    });
  });

  // 하나도 못 읽었으면 토큰 · 권한 문제다. 이유를 그대로 올려 보낸다.
  if (!out.length) throw new Error('메타 광고 계정을 하나도 읽지 못했습니다' + (trouble ? ' — ' + trouble : ''));
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

  // 고른 어트리뷰션 기간. 비우면 계정 기본 설정이다.
  var window = META_WINDOWS.indexOf(String(payload.attribution || '')) >= 0
    ? String(payload.attribution) : '';

  var cache = CacheService.getScriptCache();
  var key = ['meta', account, since, until, window || 'default'].join('|');
  if (!payload.refresh) {
    var hit = cacheGet_(cache, key);
    if (hit) {
      var cached = JSON.parse(hit);
      cached.cached = true;
      return cached;
    }
  }

  var range = JSON.stringify({ since: since, until: until });
  var fields = 'campaign_id,campaign_name,objective,spend,impressions,clicks,inline_link_clicks,'
    + 'actions,catalog_segment_actions,action_values,catalog_segment_value';

  var info = graph_('/' + account, { fields: 'name,currency,account_status,timezone_name' });
  var campaignRows = graphAll_('/' + account + '/insights',
    { level: 'campaign', fields: fields, time_range: range, limit: 200, use_unified_attribution_setting: 'true', action_attribution_windows: META_WINDOWS.join(',') }, 8);
  var adsetRows = graphAll_('/' + account + '/insights',
    { level: 'adset', fields: 'adset_id,adset_name,' + fields, time_range: range, limit: 300, use_unified_attribution_setting: 'true', action_attribution_windows: META_WINDOWS.join(',') }, 8);
  var liveCampaigns = graphAll_('/' + account + '/campaigns',
    { fields: 'id,name,objective,effective_status,daily_budget,lifetime_budget', effective_status: '["ACTIVE"]', limit: 200 }, 5);
  var liveAdsets = graphAll_('/' + account + '/adsets',
    { fields: 'id,name,campaign_id,effective_status,daily_budget,lifetime_budget,optimization_goal,start_time,end_time', effective_status: '["ACTIVE"]', limit: 300 }, 5);

  // 기간 안에 돈을 쓴 것 + 지금 켜져 있는 것을 합친다.
  // (기간에는 돌았지만 지금 꺼진 캠페인도 광고비에는 들어가야 하므로 목록에서 빼지 않는다)
  var campaigns = {};
  campaignRows.forEach(function (row) {
    campaigns[row.campaign_id] = metrics_(row, {
      id: row.campaign_id,
      name: row.campaign_name || row.campaign_id,
      objective: row.objective || '',
      active: false, status: '', budget: 0, budgetKind: ''
    }, window);
  });
  liveCampaigns.forEach(function (row) {
    var entry = campaigns[row.id];
    if (!entry) {
      entry = metrics_(null, {
        id: row.id, name: row.name || row.id, objective: row.objective || '',
        active: false, status: '', budget: 0, budgetKind: ''
      }, window);
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
      active: false, status: '', budget: 0, budgetKind: '', goal: '', begin: '', end: ''
    }, window);
  });
  liveAdsets.forEach(function (row) {
    var entry = adsets[row.id];
    if (!entry) {
      entry = metrics_(null, {
        id: row.id, name: row.name || row.id, campaignId: row.campaign_id || '',
        objective: '', active: false, status: '', budget: 0, budgetKind: '', goal: '', begin: '', end: ''
      }, window);
      adsets[row.id] = entry;
    }
    entry.active = true;
    entry.status = row.effective_status || 'ACTIVE';
    entry.campaignId = entry.campaignId || row.campaign_id || '';
    entry.goal = row.optimization_goal || '';
    entry.begin = metaDay_(row.start_time);
    entry.end = metaDay_(row.end_time);
    if (row.daily_budget) { entry.budget = Number(row.daily_budget); entry.budgetKind = 'daily'; }
    else if (row.lifetime_budget) { entry.budget = Number(row.lifetime_budget); entry.budgetKind = 'lifetime'; }
  });
  // 기간에는 돌았지만 지금 꺼져 있는 광고세트는 위 목록에 없다. 그 줄만 id 로 물어 채운다.
  metaFillSchedule_(adsets);

  var result = {
    ok: true,
    account: {
      id: account,
      name: info.name || account,
      currency: info.currency || 'KRW',
      timezone: info.timezone_name || ''
    },
    range: { since: since, until: until },
    attribution: window,
    campaigns: sortBySpend_(campaigns),
    adsets: sortBySpend_(adsets),
    fetchedAt: new Date().toISOString()
  };

  var text = JSON.stringify(result);
  // 캐시 한 칸은 100KB 다. 넘치는 것은 여러 칸에 나눠 담는다 (cachePut_).
  // 이걸 안 하면 구글 · 카카오처럼 캠페인이 많은 계정은 한 번도 담기지 않아
  // 화면을 열 때마다 매체를 새로 불러 매번 7~24초가 걸린다.
  cachePut_(cache, key, text, META_CACHE_SECONDS);
  return result;
}

function sortBySpend_(map) {
  return Object.keys(map).map(function (id) { return map[id]; }).sort(function (a, b) {
    if (b.spend !== a.spend) return b.spend - a.spend;
    return String(a.name).localeCompare(String(b.name));
  });
}

// 구글은 종료일을 안 잡은 캠페인에 2037-12-30 을 넣어 준다. 날짜로 그리면
// '12/30 까지' 로 보여 엉뚱하다. 아주 먼 날짜는 종료일이 없는 것으로 둔다.
var ADS_NO_END_FROM = '2037-01-01';

function adsDay_(text) {
  var raw = String(text || '').trim();
  if (!raw) return '';
  return raw >= ADS_NO_END_FROM ? '' : raw;
}

// 메타가 주는 시각은 '2026-08-19T00:00:00+0900' 처럼 계정 시간대로 온다.
// 앞 열 자리가 이미 그 시간대의 날짜라 그대로 잘라 쓴다.
function metaDay_(text) {
  var raw = String(text || '').trim();
  return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : '';
}

// 지금 꺼져 있는 광고세트의 집행 기간을 채운다.
// 켜진 것만 목록으로 받기 때문에, 기간에 돌고 지금은 꺼진 줄은 날짜가 비어 있다.
// 돈을 쓴 줄만, 50개씩 묶어 물어본다. (한 묶음이 실패해도 나머지는 채운다)
var META_SCHEDULE_LOOKUP = 150;

function metaFillSchedule_(adsets) {
  var need = Object.keys(adsets)
    .filter(function (id) { return !adsets[id].begin && adsets[id].spend > 0; })
    .sort(function (a, b) { return adsets[b].spend - adsets[a].spend; })
    .slice(0, META_SCHEDULE_LOOKUP);
  if (!need.length) return;

  for (var at = 0; at < need.length; at += 50) {
    var chunk = need.slice(at, at + 50);
    try {
      var body = graph_('/', { ids: chunk.join(','), fields: 'start_time,end_time' });
      chunk.forEach(function (id) {
        var found = body[id];
        if (!found) return;
        adsets[id].begin = metaDay_(found.start_time);
        adsets[id].end = metaDay_(found.end_time);
      });
    } catch (error) { /* 이 묶음은 볼 수 없다 */ }
  }
}

// window 를 주면 그 어트리뷰션 칸(1d_click · 7d_click)을 읽는다.
// 비워 두면 계정 기본 설정(value 칸) 그대로다.
// **한 줄의 구매 · 장바구니 · 리드 · 구매매출이 모두 같은 칸에서 나와야 한다.**
// 개수는 1일 클릭인데 매출만 기본값이면 ROAS 가 실제보다 후하게 잡힌다.
function metrics_(row, base, window) {
  base.spend = row ? Number(row.spend || 0) : 0;
  base.impressions = row ? Number(row.impressions || 0) : 0;
  base.clicks = row ? Number(row.clicks || 0) : 0;
  base.linkClicks = row ? Number(row.inline_link_clicks || 0) : 0;

  // 카탈로그(Advantage+) 캠페인은 전환이 actions 가 아니라 catalog_segment_actions 로 온다.
  // actions 에 잡힌 게 없을 때만 그쪽 값을 쓴다. (둘 다 세면 같은 전환을 두 번 세게 된다)
  var field = window || null;
  var counted = countResults_(row ? row.actions : null, field);
  var catalog = countResults_(row ? row.catalog_segment_actions : null, field);
  base.purchase = counted.purchase || catalog.purchase;
  base.addToCart = counted.addToCart || catalog.addToCart;
  base.lead = counted.lead || catalog.lead;
  base.results = base.purchase + base.addToCart + base.lead;
  base.revenue = purchaseValue_(row, field);
  base.attribution = window || '';

  // 어트리뷰션 기간별 결과. 계정 기본 설정을 쓰는 중이라 칸이 안 오면 null 로 둔다.
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

// 구매전환값. 구매 수를 센 것과 **같은 자리(action_type)** 의 금액을 읽는다.
// 자리를 달리 잡으면 구매수와 전환값이 어긋나 ROAS 가 틀린다.
// 한 묶음에서 먼저 잡히는 하나만 쓴다 — omni_* 와 픽셀 값이 같은 구매를 두 번 세지 않게.
function purchaseValue_(row, field) {
  if (!row) return 0;
  var name = field || 'value';
  var types = [];
  RESULT_GROUPS.forEach(function (group) { if (group.key === 'purchase') types = group.types; });
  var lists = [row.action_values, row.catalog_segment_value];
  for (var at = 0; at < lists.length; at += 1) {
    var list = lists[at];
    if (!list || !list.length) continue;
    for (var i = 0; i < types.length; i += 1) {
      for (var k = 0; k < list.length; k += 1) {
        if (list[k].action_type !== types[i]) continue;
        // 고른 칸이 안 오면 (그 기간에 전환이 없었던 것) 0 으로 둔다.
        // 다른 칸 값을 대신 쓰면 개수와 매출의 기준이 어긋난다.
        return Number(list[k][name] || 0);
      }
    }
  }
  return 0;
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
  cache.put('adsAccounts', JSON.stringify(list), ACCOUNT_CACHE_SECONDS);
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
    var hit = cacheGet_(cache, key);
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
    + 'campaign.start_date, campaign.end_date, '
    + 'metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value FROM campaign' + period, 8);

  // 결과는 전환 카테고리로 나눠 받는다 (구매 · 장바구니 · 리드)
  var categoryRows = adsQuery_(customer,
    'SELECT campaign.id, segments.conversion_action_category, metrics.conversions FROM campaign'
    + period + ' AND metrics.conversions > 0', 8);

  var adGroupRows = adsQuery_(customer,
    'SELECT ad_group.id, ad_group.name, ad_group.status, campaign.id, '
    + 'metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value FROM ad_group' + period, 8);

  // 광고그룹 줄의 결과도 카테고리로 나눠 받는다.
  // 이걸 안 물으면 광고그룹의 구매 수가 늘 0 이라 CVR(구매) 이 전부 0% 로 보인다.
  var groupCategoryRows = adsQuery_(customer,
    'SELECT ad_group.id, segments.conversion_action_category, metrics.conversions FROM ad_group'
    + period + ' AND metrics.conversions > 0', 8);

  // 기간에 안 돌았어도 지금 켜져 있으면 목록에 넣는다
  var liveCampaigns = adsQuery_(customer,
    'SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, '
    + 'campaign.start_date, campaign.end_date, '
    + 'campaign_budget.amount_micros FROM campaign WHERE campaign.status = "ENABLED"', 5);
  var liveAdGroups = adsQuery_(customer,
    'SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.cpc_bid_micros, campaign.id '
    + 'FROM ad_group WHERE ad_group.status = "ENABLED" AND campaign.status = "ENABLED"', 5);

  var byCategory = adsCategories_(categoryRows, function (row) {
    return String((row.campaign || {}).id);
  });
  var byGroupCategory = adsCategories_(groupCategoryRows, function (row) {
    return String((row.adGroup || {}).id);
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
      budget: 0, budgetKind: '',
      begin: adsDay_(campaign.startDate), end: adsDay_(campaign.endDate)
    });
  });
  liveCampaigns.forEach(function (row) {
    var campaign = row.campaign || {};
    var id = String(campaign.id);
    var entry = campaigns[id];
    if (!entry) {
      entry = adsMetrics_(null, null, {
        id: id, name: campaign.name || id, objective: campaign.advertisingChannelType || '',
        active: false, status: '', budget: 0, budgetKind: '',
        begin: adsDay_(campaign.startDate), end: adsDay_(campaign.endDate)
      });
      campaigns[id] = entry;
    }
    entry.active = true;
    entry.status = 'ENABLED';
    entry.begin = entry.begin || adsDay_(campaign.startDate);
    entry.end = entry.end || adsDay_(campaign.endDate);
    var budget = Number(((row.campaignBudget || {}).amountMicros) || 0) / 1000000;
    if (budget) { entry.budget = budget; entry.budgetKind = 'daily'; }
  });

  var adsets = {};
  adGroupRows.forEach(function (row) {
    var group = row.adGroup || {};
    var id = String(group.id);
    adsets[id] = adsMetrics_(row, byGroupCategory[id], {
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

  // 구글 광고그룹에는 집행 기간이 없다. 기간은 캠페인에만 있어 그 값을 물려받는다.
  // (그래서 같은 캠페인 아래 광고그룹은 모두 같은 날짜로 보인다)
  Object.keys(adsets).forEach(function (id) {
    var parent = campaigns[adsets[id].campaignId];
    adsets[id].begin = parent ? parent.begin : '';
    adsets[id].end = parent ? parent.end : '';
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
  cachePut_(cache, key, text, META_CACHE_SECONDS);
  return result;
}

// 전환 카테고리 줄(구매 · 장바구니 · 리드)을 id 별로 더한다. 캠페인 · 광고그룹 · 상세가 같이 쓴다.
function adsCategories_(rows, keyOf) {
  var out = {};
  (rows || []).forEach(function (row) {
    var id = keyOf(row);
    var slot = ADS_RESULT_CATEGORIES[(row.segments || {}).conversionActionCategory];
    if (!id || !slot) return;
    if (!out[id]) out[id] = { purchase: 0, addToCart: 0, lead: 0 };
    out[id][slot] += Number((row.metrics || {}).conversions || 0);
  });
  return out;
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
  // 구매전환값 = 구글의 '전환 가치'. 구글도 이 값으로 ROAS 를 센다.
  base.revenue = Number(metrics.conversionsValue || 0);
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
  var window = META_WINDOWS.indexOf(String(payload.attribution || '')) >= 0
    ? String(payload.attribution) : '';
  var cache = CacheService.getScriptCache();
  var key = ['metaAds', scope, since, until, window || 'default'].join('|');
  if (!payload.refresh) {
    var hit = cacheGet_(cache, key);
    if (hit) {
      var cached = JSON.parse(hit);
      cached.cached = true;
      return cached;
    }
  }

  var range = JSON.stringify({ since: since, until: until });
  var rows = graphAll_('/' + scope + '/insights', {
    level: 'ad',
    fields: 'ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,spend,impressions,clicks,'
      + 'inline_link_clicks,actions,catalog_segment_actions,action_values,catalog_segment_value',
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
    }, window);
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
    attribution: window,
    creatives: creatives,
    fetchedAt: new Date().toISOString()
  };
  var text = JSON.stringify(result);
  cachePut_(cache, key, text, META_CACHE_SECONDS);
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
    var hit = cacheGet_(cache, key);
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
    + 'metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value FROM ad_group_ad'
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
  cachePut_(cache, key, text, META_CACHE_SECONDS);
  return result;
}

// ── 광고비에서 부가세 빼기 (카카오모먼트 · 네이버 GFA) ────────────────────
// 이 두 매체의 보고서 광고비는 부가세를 포함한 금액이라, 화면에는 10% 를 뺀 값을 쓴다.
// **빼는 건 읽을 때만 한다.** 네이버 시트에는 매체가 준 값이 그대로 남아 있어
// 언제든 네이버 화면과 맞춰 볼 수 있다. (메타 · 구글은 손대지 않는다)
// 비율만 고치면 네 화면(매체별 성과 · 소재별 결과 · 상세 · 전매체)이 함께 바뀐다.
var SPEND_NET_RATE = 0.9;

function netSpend_(value) {
  return Number(value || 0) * SPEND_NET_RATE;
}

// ── 카카오모먼트 성과 조회 (매체별 성과 · 소재별 결과의 카카오 탭) ──────────
// 어드민 키로는 부를 수 없다. 카카오모먼트는 '비즈니스 토큰' 만 받는다.
//   get_kakao_business_token.py 로 한 번 받아
//   Apps Script 편집기 → 프로젝트 설정 → 스크립트 속성 → KAKAO_BUSINESS_TOKEN 에 넣는다.
// 비즈니스 토큰에는 리프레시가 없다. 한 번 넣어 두면 계속 쓴다. (자주 재발급하면 막힌다)
var KAKAO_URL = 'https://apis.moment.kakao.com/openapi/v4';

// 보고서에 담아 달라고 할 지표 묶음.
//   BASIC                노출 · 클릭 · 비용
//   MESSAGE              카카오톡 채널 메시지(CRM) 의 열람 · 클릭 — 이걸 빼면 메시지 캠페인이
//                        광고비만 있고 노출 · 클릭이 0 으로 보인다 (메시지는 노출 개념이 없다)
//   PIXEL_SDK_CONVERSION 픽셀 전환
var KAKAO_METRICS = 'BASIC,MESSAGE,PIXEL_SDK_CONVERSION';

// 카카오는 보고서를 한 번에 31일까지만 준다.
var KAKAO_MAX_DAYS = 31;

// 한 번에 물어볼 수 있는 개수 (카카오가 정해 둔 값)
var KAKAO_CAMPAIGN_CHUNK = 5;    // campaigns/report 의 campaignId
var KAKAO_ADGROUP_CHUNK = 40;    // adGroups/report 의 adGroupId

// 광고그룹까지 파고들 캠페인 수. 광고비가 큰 쪽부터 본다. (호출 제한 때문에 끝을 둔다)
// 보고서는 5초에 한 번이라 이 수가 곧 기다리는 시간이다. 5개면 보고서 한 번으로 끝난다.
var KAKAO_CAMPAIGN_LIMIT = 5;
// 소재 미리보기 이미지 · 문구를 물어볼 개수. 소재마다 한 번 부른다.
// 60개까지 물었더니 카카오가 호출량으로 막아 전부 비어 돌아왔다.
// 화면에서 실제로 보는 건 광고비 위쪽 몇 개라 그만큼만 본다.
var KAKAO_CREATIVE_LOOKUP = 40;
// 소재의 미리보기 · 문구는 기간과 상관없는 값이다. 한 번 받아 두면 다시 물을 이유가 없어
// 길게 담아 둔다. 담아 둔 것은 조회 개수에서 세지 않으므로, 두어 번 돌면 소재 전부가 채워진다.
// (첫 조회가 90초 가까이 걸리던 것도 이 캐시로 짧아진다)
var KAKAO_CREATIVE_CACHE_SECONDS = 21600;   // 6시간

// 캠페인 목록(/campaigns)은 id · 이름 · 상태만 준다. **유형(campaignType)과 예산은 없다.**
// 그 두 값은 단건 조회(/campaigns/{id})에만 있다. 계정에 캠페인이 260개가 넘어
// 전부 물을 수는 없으니, 광고비가 큰 쪽만 채운다. (목록에 유형 필터를 붙여도 무시된다)
var KAKAO_TYPE_LOOKUP = 12;
// 카카오톡 채널 메시지(CRM) 캠페인의 유형. 소재별 결과에서는 이 캠페인을 뺀다.
var KAKAO_MESSAGE_TYPE = 'TALK_CHANNEL';
// 캠페인 이름에 이 낱말이 들어가면 CRM 으로 본다. 팀이 이름에 CRM 을 붙여 쓰고 있어
// 유형을 물어보지 않아도 가려낼 수 있다 — 유형은 광고비 큰 12개만 채우므로 이 규칙이 더 넓다.
// 계정의 261개 캠페인 중 이름에 crm 이 든 16개가 모두 TALK_CHANNEL 이었다 (헛걸림 없음).
var KAKAO_CRM_MARK = 'crm';
// 광고그룹에 설정해 둔 집행 기간은 목록(/adGroups)에 없다. 단건 조회에만 있어
// 광고비가 있는 쪽만 정해 둔 수만큼 물어본다. 기간은 자주 안 바뀌어 길게 담아 둔다.
var KAKAO_SCHEDULE_LOOKUP = 20;
var KAKAO_SCHEDULE_CACHE_SECONDS = 21600;   // 6시간

// 이 캠페인이 카카오톡 채널 메시지(CRM)인가. 세 가지로 본다.
//   1. 이름에 CRM  ← 가장 넓다. 유형을 안 물어봐도 걸린다
//   2. 유형이 TALK_CHANNEL  ← 이름에 CRM 을 안 붙인 것 (moment_..._250404message 같은 줄)
//   3. 노출 없이 열람(msg_open)만 온 줄  ← 위 둘을 다 못 잡았을 때의 대비
function kakaoIsCrm_(row) {
  if (!row) return false;
  if (String(row.name || '').toLowerCase().indexOf(KAKAO_CRM_MARK) >= 0) return true;
  if (row.objective === KAKAO_MESSAGE_TYPE) return true;
  return !!row.message;
}

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

// 구매전환값. 개수(conv_purchase_1d)와 같은 전환의 **금액** 자리다.
//   _p_ 금액 · _q_ 수량 · _per_cost 광고비 대비(=ROAS, 카카오가 이미 %로 준다)
// ROAS 는 우리가 전환값 ÷ 광고비 로 다시 센다 — 매체마다 같은 방법으로 세야 견줄 수 있다.
var KAKAO_VALUE_FIELD = 'conv_purchase_p_';

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

// 보고서 간격은 **앞선 보고서** 기준으로만 잰다.
// 앞서는 아무 호출이나 기준으로 삼았는데, 그러면 목록을 한 번 부를 때마다 다음 보고서가
// 5초 뒤로 밀렸다. 목록 · 단건은 보고서 제한과 무관하다 (29개를 동시에 불러도 안 막힌다).
// 이 한 줄이 매체별 성과에서 10초쯤을 그냥 잡아먹고 있었다.
function kakaoWait_(gap, isReport) {
  var since = isReport ? kakaoLastReport : kakaoLastCall;
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

// 주소 만들기 — 한꺼번에 부를 때도 같은 규칙을 쓴다.
function kakaoUrl_(path, params) {
  var query = [];
  Object.keys(params || {}).forEach(function (key) {
    var value = params[key];
    if (value === undefined || value === null || value === '') return;
    query.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
  });
  return KAKAO_URL + path + (query.length ? '?' + query.join('&') : '');
}

// 목록 · 단건 조회를 **한꺼번에** 부른다. 직접 재 본 값이다:
//   소재 단건 29개를 하나씩 → 0.16초 × 29 + 우리가 넣은 간격 0.6초 × 29 = 22초
//   소재 단건 29개를 한꺼번에 → 0.33초
// 카카오가 막는 건 **보고서뿐**이다. 보고서는 1초 뒤에 다시 부르면 429 를 준다
// ('허용된 API 요청을 초과하였습니다'). 그래서 보고서만 5.5초 간격을 지키고,
// 목록 · 단건은 이 함수로 한꺼번에 부른다.
var KAKAO_FETCH_CHUNK = 25;

function kakaoMany_(jobs, account) {
  var out = {};
  var token = kakaoToken_();
  for (var at = 0; at < jobs.length; at += KAKAO_FETCH_CHUNK) {
    var chunk = jobs.slice(at, at + KAKAO_FETCH_CHUNK);
    var requests = chunk.map(function (job) {
      var headers = { Authorization: 'Bearer ' + token };
      if (account) headers.adAccountId = String(account);
      return {
        url: kakaoUrl_(job.path, job.params),
        method: 'get',
        muteHttpExceptions: true,
        headers: headers
      };
    });
    var answers = [];
    try {
      answers = UrlFetchApp.fetchAll(requests);
    } catch (error) {
      answers = [];   // 한 묶음이 통째로 실패해도 나머지 묶음은 시도한다
    }
    chunk.forEach(function (job, i) {
      var response = answers[i];
      if (!response || response.getResponseCode() >= 400) return;
      try {
        out[job.key] = JSON.parse(response.getContentText() || 'null');
      } catch (ignore) { /* 이 줄만 건너뛴다 */ }
    });
    kakaoLastCall = Date.now();
  }
  return out;
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

function kakaoValue_(metrics, window) {
  if (!metrics) return 0;
  var value = metrics[KAKAO_VALUE_FIELD + kakaoWindow_(window)];
  if (typeof value !== 'number') {
    for (var i = 0; i < KAKAO_ATTRIBUTIONS.length; i += 1) {
      var other = metrics[KAKAO_VALUE_FIELD + KAKAO_ATTRIBUTIONS[i]];
      if (typeof other === 'number') { value = other; break; }
    }
  }
  return typeof value === 'number' ? value : 0;
}

// 메타 · 구글과 같은 모양으로 맞춘다. 카카오의 클릭은 한 가지라 linkClicks 에 그대로 넣는다.
function kakaoMetrics_(metrics, base, window) {
  var found = metrics || {};
  base.spend = netSpend_(found.cost);
  base.impressions = Number(found.imp || 0);
  base.clicks = Number(found.click || 0);
  // 카카오톡 채널 메시지(CRM) 캠페인은 노출 · 클릭이 없고 열람(msg_open) · 클릭(msg_click) 으로 온다.
  // 그대로 두면 광고비만 있고 노출 0 인 줄이 되어 CTR · CPC 가 빈칸이 된다.
  // 한 줄에 둘이 함께 오지는 않으므로, 없을 때만 메시지 값을 그 자리에 넣는다.
  base.message = !base.impressions && Number(found.msg_open || 0) > 0;
  if (base.message) {
    base.impressions = Number(found.msg_open || 0);
    base.clicks = Number(found.msg_click || 0);
  }
  base.linkClicks = base.clicks;
  // 어트리뷰션 기간별 결과도 함께 담는다 (화면에서 결과 옆에 붙여 보여 준다)
  base.attribution = kakaoWindow_(window);
  var counted = kakaoResults_(found, window);
  base.purchase = counted.purchase;
  base.addToCart = counted.addToCart;
  base.lead = counted.lead;
  base.results = base.purchase + base.addToCart + base.lead;
  base.revenue = kakaoValue_(found, window);
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

  // 카카오는 start/end 에 **오늘**이 들어가면 기간이 잘못됐다며 400 을 준다.
  //   detailCode 60008 · '조회하는 기간의 시작일, 종료일이 유효하지 않습니다.'
  // 당일은 start/end 대신 datePreset=TODAY 로만 받을 수 있다 (전환 지표 · 쪼개기 다 온다).
  // 그래서 오늘이 걸린 기간은 '어제까지'와 '오늘'을 따로 불러 합친다. (kakaoReportRows_)
  var today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  var yesterday = Utilities.formatDate(new Date(Date.now() - 86400000), 'Asia/Seoul', 'yyyy-MM-dd');
  var hasToday = until >= today;
  var plainEnd = hasToday ? yesterday : until;

  return {
    since: since, until: until,
    start: since.replace(/-/g, ''), end: until.replace(/-/g, ''),
    hasToday: hasToday,                 // 오늘이 기간에 들어 있는가
    onlyToday: since >= today,          // 오늘 하루만 보는가 (start/end 요청은 아예 하지 않는다)
    plainStart: since.replace(/-/g, ''),
    plainEnd: plainEnd.replace(/-/g, '')
  };
}

// 오늘이 걸린 기간은 두 번 불러 합친다. 합치는 건 kakaoRollUp_ 이 id 로 더해 주므로
// 줄을 이어 붙이기만 하면 된다.
function kakaoReportRows_(path, params, when, account) {
  var rows = [];
  if (!when.onlyToday) {
    var past = { start: when.plainStart, end: when.plainEnd };
    Object.keys(params).forEach(function (key) { past[key] = params[key]; });
    rows = rows.concat(kakaoList_(kakao_(path, past, account, 5000)));
  }
  if (when.hasToday) {
    var now = { datePreset: 'TODAY' };
    Object.keys(params).forEach(function (key) { now[key] = params[key]; });
    rows = rows.concat(kakaoList_(kakao_(path, now, account, 5000)));
  }
  return rows;
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
  cache.put('kakaoAccounts', JSON.stringify(list), ACCOUNT_CACHE_SECONDS);
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
  cachePut_(cache, key, text, META_CACHE_SECONDS);
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
    var hit = cacheGet_(cache, key);
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
  var campaignReport = kakaoRollUp_(kakaoReportRows_('/adAccounts/report', {
    adAccountId: account, metricsGroup: KAKAO_METRICS, level: 'CAMPAIGN'
  }, when, account), 'campaign_id');

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

  // 유형 · 예산은 목록에 없다. 광고비가 큰 캠페인만 단건으로 물어 채운다.
  // 이 값이 있어야 목적별 보기가 되고, 소재별 결과에서 카카오톡 채널 메시지(CRM)를 가려낼 수 있다.
  var typeWanted = Object.keys(campaigns)
    .filter(function (id) { return !campaigns[id].objective && campaigns[id].spend > 0; })
    .sort(function (a, b) { return campaigns[b].spend - campaigns[a].spend; })
    .slice(0, KAKAO_TYPE_LOOKUP);
  var typeAnswers = kakaoMany_(typeWanted.map(function (id) {
    return { key: id, path: '/campaigns/' + id };
  }), account);
  typeWanted.forEach(function (id) {
    var one = typeAnswers[id];
    if (!one) return;   // 지워졌거나 볼 수 없는 캠페인
    var goal = one.campaignTypeGoal || {};
    campaigns[id].objective = goal.campaignType || '';
    if (one.dailyBudgetAmount) {
      campaigns[id].budget = Number(one.dailyBudgetAmount);
      campaigns[id].budgetKind = 'daily';
    }
  });

  // 광고그룹은 캠페인을 5개씩 묶어 물어본다. 광고비가 큰 캠페인부터 정해 둔 수만큼만 본다.
  var digging = Object.keys(campaigns)
    .filter(function (id) { return campaigns[id].spend > 0 || campaigns[id].active; })
    .sort(function (a, b) { return campaigns[b].spend - campaigns[a].spend; })
    .slice(0, KAKAO_CAMPAIGN_LIMIT);

  var adsetReport = {};
  kakaoChunks_(digging, KAKAO_CAMPAIGN_CHUNK).forEach(function (chunk) {
    var rolled = kakaoRollUp_(kakaoReportRows_('/campaigns/report', {
      campaignId: chunk.join(','), metricsGroup: KAKAO_METRICS, level: 'AD_GROUP'
    }, when, account), 'ad_group_id');
    Object.keys(rolled).forEach(function (id) { adsetReport[id] = rolled[id]; });
  });

  // 광고그룹 이름 · 상태는 목록에서 따로 받는다 (캠페인마다 한 번)
  // 보고서에는 지워진 캠페인도 들어 있다. 그 id 로 목록을 물으면
  // '캠페인이 존재하지 않습니다' 로 400 이 나므로, 그 캠페인만 건너뛴다.
  var adsets = {};
  var groupAnswers = kakaoMany_(digging.map(function (campaignId) {
    return { key: campaignId, path: '/adGroups', params: { campaignId: campaignId, config: 'ON,OFF' } };
  }), account);
  digging.forEach(function (campaignId) {
    // 답이 없으면 지워졌거나 볼 수 없는 캠페인이다
    var groupRows = kakaoList_(groupAnswers[campaignId]);
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
        goal: row.bidStrategy || row.pricingType || '',
        begin: '', end: ''
      }, window);
    });
  });
  // 목록에 없는데 숫자만 있는 광고그룹 (지워졌지만 기간 안에는 돈을 쓴 것)
  Object.keys(adsetReport).forEach(function (id) {
    if (adsets[id]) return;
    adsets[id] = kakaoMetrics_(adsetReport[id], {
      id: id, name: '(지워진 광고그룹) ' + id, campaignId: '', objective: '',
      active: false, status: 'DEL', budget: 0, budgetKind: '', goal: '',
      begin: '', end: ''
    }, window);
  });

  kakaoFillSchedule_(adsets, account);

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

// 광고그룹에 설정해 둔 집행 기간(schedule.beginDate ~ endDate).
// 목록에는 안 오고 단건 조회에만 있어서, 광고비가 있는 쪽부터 정해 둔 수만큼만 물어본다.
// 담아 둔 것은 조회 개수에서 세지 않으므로 두어 번 열어 보면 나머지도 채워진다.
function kakaoFillSchedule_(adsets, account) {
  var store = CacheService.getScriptCache();
  var need = [];
  Object.keys(adsets)
    .filter(function (id) { return adsets[id].spend > 0; })
    .sort(function (a, b) { return adsets[b].spend - adsets[a].spend; })
    .forEach(function (id) {
      var saved = store.get('kakaoSchedule|' + id);
      if (saved) {
        var kept = String(saved).split('~');
        adsets[id].begin = kept[0] || '';
        adsets[id].end = kept[1] || '';
        return;
      }
      if (need.length < KAKAO_SCHEDULE_LOOKUP) need.push(id);
    });
  if (!need.length) return;

  var answers = kakaoMany_(need.map(function (id) {
    return { key: id, path: '/adGroups/' + id };
  }), account);
  var keep = {};
  need.forEach(function (id) {
    var one = answers[id];
    if (!one) return;   // 지워졌거나 볼 수 없는 광고그룹
    var schedule = one.schedule || {};
    adsets[id].begin = String(schedule.beginDate || '');
    adsets[id].end = String(schedule.endDate || '');
    keep['kakaoSchedule|' + id] = adsets[id].begin + '~' + adsets[id].end;
  });
  try { store.putAll(keep, KAKAO_SCHEDULE_CACHE_SECONDS); } catch (error) { /* 담아 두기는 거들기다 */ }
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
    var hit = cacheGet_(cache, key);
    if (hit) {
      var cached = JSON.parse(hit);
      cached.cached = true;
      return cached;
    }
  }

  // 어느 광고그룹을 볼지는 매체별 성과와 같은 보고서에서 고른다.
  // (그 화면이 먼저 부르고 담아 두므로 대개 다시 묻지 않는다)
  var report = kakaoReport_({ account: account, since: when.since, until: when.until, attribution: window });

  // 카카오톡 채널 메시지(CRM)는 소재별 결과에서 보지 않는다. 문구 · 이미지가 광고 소재와
  // 성격이 달라 나란히 두면 비교가 안 된다. **광고비(매체별 성과)에는 그대로 들어간다.**
  // 캠페인 쪽에서 가린다. 광고그룹 이름으로는 못 가리기 때문이다 — CRM 광고그룹 이름도
  // '[kimsinyoung-0818]25-65__cj' 처럼 행사명이라 일반 광고와 구별되지 않는다.
  var crmCampaign = {};
  report.campaigns.forEach(function (row) {
    if (kakaoIsCrm_(row)) crmCampaign[row.id] = true;
  });

  var picked = report.adsets.filter(function (row) {
    if (crmCampaign[row.campaignId]) return false;
    if (row.message) return false;
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

  var rows = kakaoReportRows_('/adGroups/report', {
    adGroupId: picked.map(function (row) { return row.id; }).join(','),
    metricsGroup: KAKAO_METRICS, level: 'CREATIVE'
  }, when, account);

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
  }).filter(function (row) {
    return !row.message;   // 메시지 소재는 위와 같은 이유로 뺀다
  }).sort(function (a, b) { return b.spend - a.spend; }).slice(0, CREATIVE_LIMIT);

  var filled = kakaoFillCreatives_(creatives, account, picked.map(function (row) { return row.id; }));
  // 광고그룹 이름은 위에서 되짚은 adsetId 로 채운다 (보고서에는 안 실려 온다)
  creatives.forEach(function (row) {
    if (!row.adsetName && byAdset[row.adsetId]) {
      row.adsetName = byAdset[row.adsetId].name;
      row.campaignId = row.campaignId || byAdset[row.adsetId].campaignId;
      row.campaignName = row.campaignName || campaignName[byAdset[row.adsetId].campaignId] || '';
    }
  });
  return kakaoCache_(cache, key, {
    ok: true, source: 'kakao', scope: adGroup || campaign || account,
    range: { since: when.since, until: when.until },
    notice: (filled && filled.note) || '',
    creatives: creatives, fetchedAt: new Date().toISOString()
  });
}

// 소재 이름 · 상태는 광고그룹마다 한 번, 미리보기 이미지는 소재마다 한 번 물어본다.
// 보고서에는 이름도 이미지도 담겨 오지 않는다. 호출이 늘어나므로 위쪽부터 정해 둔 수만큼만 본다.
// groups 는 보고서를 물어본 광고그룹 id 목록이다.
// 소재 단위 보고서의 dimensions 에는 creative_id 만 오고 광고그룹이 안 실려 온다.
// 그래서 소재가 어느 그룹 것인지 여기서 되짚어 이름 · 상태 · 이미지를 채운다.
// (이 값이 없으면 화면에 소재 번호만 뜨고 미리보기도 안 붙는다)
function kakaoFillCreatives_(creatives, account, groups) {
  // 광고그룹마다 소재 목록을 하나씩 부르던 것을 한꺼번에 부른다
  var listAnswers = kakaoMany_((groups || []).map(function (adGroupId) {
    return { key: adGroupId, path: '/creatives', params: { adGroupId: adGroupId, config: 'ON,OFF' } };
  }), account);

  var known = {};
  var owner = {};
  (groups || []).forEach(function (adGroupId) {
    kakaoList_(listAnswers[adGroupId]).forEach(function (row) {
      known[String(row.id)] = row;
      owner[String(row.id)] = String(adGroupId);
    });
  });

  creatives.forEach(function (row) {
    if (!row.adsetId && owner[row.id]) row.adsetId = owner[row.id];
    var found = known[row.id];
    if (!found) return;
    row.name = found.name || row.name;
    row.status = found.config || '';
    row.active = found.config === 'ON';
  });

  // 미리보기 · 문구는 소재마다 한 번 물어야 한다. 이것도 한꺼번에 부른다 —
  // 하나씩 0.6초씩 쉬며 부르던 것이 소재별 결과 40초의 대부분이었다 (40개면 24초).
  // 담아 둔 것은 묻지 않으므로 두 번째부터는 부를 것이 거의 없다.
  var store = CacheService.getScriptCache();
  var need = [];
  creatives.forEach(function (row) {
    var saved = store.get('kakaoCreative|' + row.id);
    if (saved) {
      try {
        var kept = JSON.parse(saved);
        row.thumbnail = kept.image || '';
        row.copy = kept.copy || '';
        return;
      } catch (ignore) { /* 담아 둔 값이 깨졌으면 다시 묻는다 */ }
    }
    if (need.length < KAKAO_CREATIVE_LOOKUP) need.push(row);
  });
  if (!need.length) return { note: '', asked: 0 };

  var answers = kakaoMany_(need.map(function (row) {
    return { key: row.id, path: '/creatives/' + row.id };
  }), account);

  // 하나도 못 받았으면 까닭을 알려 준다. 화면에 '이미지 없음' 만 남으면 원인을 알 수 없다.
  var keep = {};
  var asked = 0;
  need.forEach(function (row) {
    var one = answers[row.id];
    if (!one) return;
    row.thumbnail = kakaoImage_(one) || '';
    row.copy = kakaoCopy_(one);
    keep['kakaoCreative|' + row.id] = JSON.stringify({ image: row.thumbnail, copy: row.copy });
    asked += 1;
  });
  try { store.putAll(keep, KAKAO_CREATIVE_CACHE_SECONDS); } catch (error) { /* 거들기다 */ }

  var trouble = asked ? '' : ('소재 미리보기를 ' + need.length + '개 모두 받지 못했습니다. '
    + '카카오가 호출을 막았거나 소재가 지워진 것일 수 있습니다.');
  return { note: trouble, asked: asked };
}

// 광고 문구. 소재 유형마다 들어 있는 자리가 다르다.
//   BASIC_TEXT_MESSAGE    messageElement.title
//   CAROUSEL_FEED_MESSAGE messageElement.itemAssetGroups[].title · description  ← 카드마다 따로 있다
//   IMAGE_BANNER          altText (비즈보드 배너)
// opinionProof.opinion 은 쓰지 않는다 — 검수자에게 보내는 증빙 메모지 광고 문구가 아니다.
function kakaoCopy_(one) {
  var element = (one && one.messageElement) || one || {};
  var title = String(element.title || '').trim();
  if (title) return title;

  var alt = String((one && one.altText) || element.altText || '').trim();
  if (alt) return alt;

  var items = element.itemAssetGroups || [];
  for (var i = 0; i < items.length; i += 1) {
    var card = items[i] || {};
    var parts = [];
    if (String(card.title || '').trim()) parts.push(String(card.title).trim());
    if (String(card.description || '').trim()) parts.push(String(card.description).trim());
    if (parts.length) return parts.join(' · ');
  }
  return '';
}

// 소재 응답 어디에 이미지 주소가 들어 있는지는 소재 유형마다 다르다.
// 정해진 칸을 먼저 보고, 없으면 응답을 훑는다.
//   메시지 소재: messageElement.image.url · messageElement.thumbnailUrl
// 주소가 프로토콜 없이 온다 — '//t1.kakaocdn.net/…' 꼴이라 그대로 쓰면 화면에서 안 열린다.
// 확장자(.png)가 안 붙는 주소도 있어서 확장자로 걸러서도 안 된다.
function kakaoImage_(node) {
  if (!node || typeof node !== 'object') return '';
  var element = node.messageElement || node;
  var direct = ((element.image || {}).url) || element.thumbnailUrl
    || ((node.image || {}).url) || node.thumbnailUrl || '';
  return kakaoImageUrl_(direct || kakaoFindImage_(node, 0));
}

// 프로토콜이 빠진 주소에 https: 를 붙인다. 그림이 아닌 주소(랜딩 링크)는 버린다.
function kakaoImageUrl_(url) {
  var text = String(url || '').trim();
  if (!text) return '';
  if (text.indexOf('//') === 0) text = 'https:' + text;
  if (!/^https?:\/\//.test(text)) return '';
  // 랜딩 링크가 섞여 들어오지 않게, 카카오 이미지 서버이거나 그림 확장자인 것만 쓴다
  return /kakaocdn|daumcdn|\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(text) ? text : '';
}

function kakaoFindImage_(node, depth) {
  if (!node || depth > 4) return '';
  if (typeof node === 'string') return kakaoImageUrl_(node);
  if (typeof node !== 'object') return '';
  var keys = Object.keys(node);
  for (var i = 0; i < keys.length; i += 1) {
    var found = kakaoFindImage_(node[keys[i]], depth + 1);
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
  ageGender: 'age,gender',
  region: 'region'
};

var KAKAO_BREAKDOWNS = {
  placement: 'PLACEMENT',
  age: 'AGE_BAND',
  gender: 'GENDER',
  ageGender: 'AGE_BAND_GENDER',
  region: 'LOCATION'
};

// 구글은 쪼개기마다 보는 자리(리소스)가 다르다. 위치는 지역 번호만 와서 아직 붙이지 않았다.
// 광고그룹으로 좁힐 때는 게재지면도 ad_group 에서 읽는다 (campaign 리소스로는 못 거른다).
var ADS_BREAKDOWNS = {
  placement: { from: 'campaign', adGroupFrom: 'ad_group', field: 'segments.ad_network_type', pick: function (row) { return (row.segments || {}).adNetworkType; } },
  age: { from: 'age_range_view', field: 'ad_group_criterion.age_range.type', pick: function (row) { return ((row.adGroupCriterion || {}).ageRange || {}).type; } },
  gender: { from: 'gender_view', field: 'ad_group_criterion.gender.type', pick: function (row) { return ((row.adGroupCriterion || {}).gender || {}).type; } }
};

var BREAKDOWN_CACHE_SECONDS = 600;

// 상세 한 줄도 캠페인 줄과 같은 칸을 쓴다. 화면이 같은 코드로 그린다.
// 연령 × 성별처럼 두 가지로 쪼갤 때는 series 에 둘째 값을 담는다.
function breakdownRow_(label, base, series) {
  base.id = series ? label + '|' + series : label;
  base.name = label || '(알 수 없음)';
  base.series = series || '';
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

  var window = META_WINDOWS.indexOf(String(payload.attribution || '')) >= 0
    ? String(payload.attribution) : '';
  var cache = CacheService.getScriptCache();
  var key = ['metaBd', scope, payload.breakdown, since, until, window || 'default'].join('|');
  if (!payload.refresh) {
    var hit = cacheGet_(cache, key);
    if (hit) return JSON.parse(hit);
  }

  var rows = graphAll_('/' + scope + '/insights', {
    breakdowns: breakdown,
    fields: 'spend,impressions,clicks,inline_link_clicks,'
      + 'actions,catalog_segment_actions,action_values,catalog_segment_value',
    time_range: JSON.stringify({ since: since, until: until }),
    limit: 300,
    use_unified_attribution_setting: 'true', action_attribution_windows: META_WINDOWS.join(',')
  }, 5);

  var out = rows.map(function (row) {
    if (payload.breakdown === 'placement') {
      var place = [row.publisher_platform, row.platform_position]
        .filter(function (part) { return !!part; }).join(' · ');
      return breakdownRow_(place, metrics_(row, {}, window));
    }
    if (payload.breakdown === 'ageGender') {
      return breakdownRow_(row.age || '', metrics_(row, {}, window), row.gender || '');
    }
    return breakdownRow_(row[payload.breakdown] || '', metrics_(row, {}, window));
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
  var adGroup = String(payload.adset || '').replace(/[^0-9]/g, '');

  var cache = CacheService.getScriptCache();
  var key = ['kakaoBd', account, campaign, adGroup, payload.breakdown, when.since, when.until, window].join('|');
  if (!payload.refresh) {
    var hit = cacheGet_(cache, key);
    if (hit) return JSON.parse(hit);
  }

  // 광고그룹을 고르면 그 그룹만, 캠페인을 고르면 그 캠페인만, 아니면 계정 전체를 쪼갠다.
  var rows;
  if (adGroup) {
    rows = kakaoReportRows_('/adGroups/report', {
      adGroupId: adGroup, metricsGroup: KAKAO_METRICS, dimension: dimension, level: 'AD_GROUP'
    }, when, account);
  } else if (campaign) {
    rows = kakaoReportRows_('/campaigns/report', {
      campaignId: campaign, metricsGroup: KAKAO_METRICS, dimension: dimension, level: 'CAMPAIGN'
    }, when, account);
  } else {
    rows = kakaoReportRows_('/adAccounts/report', {
      adAccountId: account, metricsGroup: KAKAO_METRICS, dimension: dimension
    }, when, account);
  }

  // dimensions 에는 id 칸과 쪼갠 칸이 함께 온다. id 가 아닌 쪽이 우리가 볼 이름이다.
  // 연령 × 성별은 두 칸으로 오기도 하고 한 칸에 붙여 오기도 해서 둘 다 받는다.
  var merged = {};
  var labels = {};
  rows.forEach(function (row) {
    var dimensions = row.dimensions || {};
    var found = [];
    Object.keys(dimensions).forEach(function (name) {
      if (/(_id|Id)$/.test(name)) return;
      found.push(String(dimensions[name]));
    });
    if (payload.breakdown === 'ageGender' && found.length === 1) {
      found = found[0].split(/\s*[|/,_]\s*/);
    }
    var key = found.join('|');
    if (!labels[key]) labels[key] = { name: found[0] || '', series: found[1] || '' };
    if (!merged[key]) merged[key] = {};
    var metrics = row.metrics || {};
    Object.keys(metrics).forEach(function (name) {
      if (typeof metrics[name] !== 'number') return;
      merged[key][name] = (merged[key][name] || 0) + metrics[name];
    });
  });

  var out = Object.keys(merged).map(function (key) {
    return breakdownRow_(labels[key].name, kakaoMetrics_(merged[key], {}, window), labels[key].series);
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
  var adGroup = String(payload.adset || '').replace(/[^0-9]/g, '');

  var cache = CacheService.getScriptCache();
  var key = ['adsBd', customer, campaign, adGroup, payload.breakdown, since, until].join('|');
  if (!payload.refresh) {
    var hit = cacheGet_(cache, key);
    if (hit) return JSON.parse(hit);
  }

  var from = adGroup ? (spec.adGroupFrom || spec.from) : spec.from;
  var where = ' WHERE segments.date BETWEEN "' + since + '" AND "' + until + '"'
    + (campaign ? ' AND campaign.id = ' + campaign : '')
    + (adGroup ? ' AND ad_group.id = ' + adGroup : '');
  var rows = adsQuery_(customer, 'SELECT ' + spec.field + ', '
    + 'metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value '
    + 'FROM ' + from + where, 8);

  // 쪼갠 줄의 결과도 카테고리로 나눠 받는다 (구매 · 장바구니 · 리드).
  // 게재지면 · 연령 · 성별 모두 이 조각을 함께 준다 — 직접 물어보고 확인했다.
  var byCategory = adsCategories_(adsQuery_(customer, 'SELECT ' + spec.field + ', '
    + 'segments.conversion_action_category, metrics.conversions '
    + 'FROM ' + from + where + ' AND metrics.conversions > 0', 8), function (row) {
    return String(spec.pick(row) || '');
  });

  // 같은 값이 광고그룹마다 나뉘어 오므로 이름으로 모은다.
  var merged = {};
  rows.forEach(function (row) {
    var label = String(spec.pick(row) || '');
    if (!merged[label]) {
      merged[label] = { costMicros: 0, impressions: 0, clicks: 0, conversions: 0, conversionsValue: 0 };
    }
    var metrics = row.metrics || {};
    merged[label].costMicros += Number(metrics.costMicros || 0);
    merged[label].impressions += Number(metrics.impressions || 0);
    merged[label].clicks += Number(metrics.clicks || 0);
    merged[label].conversions += Number(metrics.conversions || 0);
    merged[label].conversionsValue += Number(metrics.conversionsValue || 0);
  });

  var out = Object.keys(merged).map(function (label) {
    return breakdownRow_(label, adsMetrics_({ metrics: merged[label] }, byCategory[label], {}));
  });

  return breakdownCache_(cache, key, { ok: true, source: 'google', breakdown: payload.breakdown, rows: breakdownSort_(out) });
}

function breakdownCache_(cache, key, result) {
  var text = JSON.stringify(result);
  cachePut_(cache, key, text, BREAKDOWN_CACHE_SECONDS);
  return result;
}

// ── 네이버 GFA 성과 (매체별 성과 화면의 네이버 탭) ────────────────────────
// GFA 에는 공개 API 가 없다. 그래서 이 매체만 흐름이 거꾸로다.
//   PC 에서 get_gfa_report.py 가 관리 화면 내부 API 로 성과를 받아 → naverAppend 로 여기에 쌓고
//   화면은 naverReport 로 그 시트를 읽는다. (다른 매체처럼 실시간 조회가 아니다)
// **하루 단위로 쌓는다.** 그래야 화면이 아무 기간이나 골라도 합쳐서 답할 수 있다.
var NAVER_SHEET_NAME = '네이버성과';

// 시트 열. 날짜 · 계정 · 단위 · ID 네 칸이 한 줄을 가리키는 열쇠다.
// cpc · ctr · roas 는 두지 않는다. 더하면 틀리는 값이라 합계에서 다시 계산한다.
// 상태 · 예산은 '적재한 그 시각의 값' 이라 날짜별 값이 아니다. 그래서 맨 뒤에 두었고,
// 합칠 때는 가장 늦은 날짜의 줄에 적힌 값을 쓴다. (이미 쌓인 줄을 밀지 않으려고 뒤에 붙였다)
var NAVER_HEADERS = ['날짜', '계정', '계정명', '단위', 'ID', '이름',
  '캠페인ID', '캠페인명', '광고그룹ID', '광고그룹명', '목적',
  '광고비', '노출', '클릭', '구매', '장바구니', '가입', '결과', '전환매출', '적재시각',
  '상태', '예산', '썸네일', '문구', '짧은문구', '집행시작', '집행종료'];

function naverSheet_() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  var sheet = book.getSheetByName(NAVER_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(NAVER_SHEET_NAME, book.getNumSheets());
    sheet.getRange(1, 1, 1, NAVER_HEADERS.length).setValues([NAVER_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    return sheet;
  }
  // 열이 늘어난 뒤 처음 열렸으면 머리글만 채운다. 쌓여 있던 줄은 그대로 둔다.
  var width = sheet.getLastColumn();
  if (width < NAVER_HEADERS.length) {
    sheet.getRange(1, width + 1, 1, NAVER_HEADERS.length - width)
      .setValues([NAVER_HEADERS.slice(width)]).setFontWeight('bold');
  }
  return sheet;
}

// 날짜 칸은 시트가 날짜로 바꿔 둘 수도, 글자로 남을 수도 있다. 늘 YYYY-MM-DD 로 읽는다.
function naverDay_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, 'Asia/Seoul', 'yyyy-MM-dd');
  return String(value || '').trim().slice(0, 10);
}

function naverKey_(row) {
  return [row.date, row.accountId, row.level, row.id].join('|');
}

// ── 적재 (PC 의 스크래퍼가 부른다) ──────────────────────────────────
// 같은 날짜 · 같은 줄이 다시 오면 덮어쓴다. 어제 값이 나중에 바뀌어도 두 줄로 남지 않는다.
function naverAppend_(payload) {
  var rows = payload.rows || [];
  if (!rows.length) return { ok: false, error: '적재할 줄이 없습니다.' };

  // 적재는 여러 PC 에서 올 수 있다. 두 번이 겹치면 둘 다 '새 줄' 로 보고 같은 줄을 두 개 붙여
  // 숫자가 두 배가 된다. 그래서 한 번에 한 사람만 쓰게 한다.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(60000)) {
    return { ok: false, error: '다른 곳에서 적재하는 중입니다. 잠시 뒤 다시 시도해 주세요.' };
  }
  try {
    var done = naverWrite_(rows);
    naverStamp_(true);   // 담아 둔 조회를 버린다
    return done;
  } finally {
    lock.releaseLock();
  }
}

function naverWrite_(rows) {
  var sheet = naverSheet_();
  var stamp = new Date();

  // 이미 있는 줄의 자리를 열쇠로 찾아 둔다.
  // 썸네일 · 문구도 함께 읽어 둔다 — 적재가 미리보기를 광고그룹 몇 개까지만 물어보므로,
  // 이번에 못 받은 소재를 빈 값으로 덮으면 이미 채워 둔 미리보기가 사라진다.
  var at = {};
  var kept = {};   // 행번호 → [썸네일, 문구, 짧은문구]
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var have = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
    var side = sheet.getRange(2, 23, lastRow - 1, 3).getValues();
    have.forEach(function (line, i) {
      var key = [naverDay_(line[0]), String(line[1]), String(line[3]), String(line[4])].join('|');
      at[key] = i + 2;
      kept[i + 2] = side[i];
    });
  }

  var fresh = [];
  var updates = [];   // [행번호, 한 줄]
  rows.forEach(function (row) {
    var line = [
      String(row.date || '').slice(0, 10),
      String(row.accountId || ''),
      String(row.accountName || ''),
      String(row.level || ''),
      String(row.id || ''),
      String(row.name || ''),
      String(row.campaignId || ''),
      String(row.campaignName || ''),
      String(row.adsetId || ''),
      String(row.adsetName || ''),
      String(row.objective || ''),
      Number(row.spend || 0),
      Number(row.impressions || 0),
      Number(row.clicks || 0),
      Number(row.purchase || 0),
      Number(row.addToCart || 0),
      Number(row.lead || 0),
      Number(row.results || 0),
      Number(row.revenue || 0),
      stamp,
      String(row.status || ''),
      Number(row.budget || 0),
      String(row.thumbnail || ''),
      String(row.copy || ''),
      String(row.altCopy || ''),
      String(row.begin || ''),
      String(row.end || '')
    ];
    var found = at[naverKey_(row)];
    if (found) {
      // 빈 값은 이미 있는 값을 지우지 않는다 (썸네일 · 문구 · 짧은문구)
      var side = kept[found] || ['', '', ''];
      if (!line[22] && side[0]) line[22] = String(side[0]);
      if (!line[23] && side[1]) line[23] = String(side[1]);
      if (!line[24] && side[2]) line[24] = String(side[2]);
      updates.push([found, line]);
    } else {
      fresh.push(line);
    }
  });

  // 고칠 줄은 한 줄씩, 새 줄은 한 번에 붙인다
  updates.forEach(function (pair) {
    sheet.getRange(pair[0], 1, 1, NAVER_HEADERS.length).setValues([pair[1]]);
  });
  if (fresh.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, fresh.length, NAVER_HEADERS.length).setValues(fresh);
  }

  return { ok: true, added: fresh.length, updated: updates.length };
}

// ── 조회 (화면이 부른다) ────────────────────────────────────────────
// 시트에 쌓인 하루치 줄을 고른 기간만큼 합쳐 준다.
// 모양은 metaReport_ · kakaoReport_ 와 같다. 화면이 같은 코드로 표를 그린다.
// 시트를 한 번만 훑어, 고른 계정 · 기간의 줄을 단위별로 합쳐 둔다.
// (성과 화면과 소재 화면이 같은 함수를 쓴다. 시트 읽기가 가장 느린 일이라 한 번에 끝낸다)
function naverGather_(account, since, until) {
  var sheet = naverSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    throw new Error('네이버 성과가 아직 적재되지 않았습니다. PC 에서 get_gfa_report.py 를 돌려 주세요.');
  }

  var grid = sheet.getRange(2, 1, lastRow - 1, NAVER_HEADERS.length).getValues();
  var found = { levels: {}, days: {}, names: {}, newest: '' };
  var latest = {};   // 단위|ID → 그 줄에서 본 가장 늦은 날짜 (상태 · 예산을 그 날 값으로 쓴다)

  grid.forEach(function (line) {
    var day = naverDay_(line[0]);
    var accountId = String(line[1]);
    if (account && accountId !== account) return;
    found.names[accountId] = String(line[2]) || accountId;
    if (day < since || day > until) return;

    var level = String(line[3]);
    if (!found.levels[level]) found.levels[level] = {};
    var into = found.levels[level];

    found.days[day] = true;
    var id = String(line[4]);
    var entry = into[id];
    if (!entry) {
      entry = {
        id: id,
        name: String(line[5]) || id,
        campaignId: String(line[6]),
        campaignName: String(line[7]),
        adsetId: String(line[8]),
        adsetName: String(line[9]),
        objective: String(line[10]),
        spend: 0, impressions: 0, clicks: 0, linkClicks: 0,
        purchase: 0, addToCart: 0, lead: 0, results: 0, revenue: 0,
        active: false, status: '', budget: 0, budgetKind: '', goal: '',
        thumbnail: '', copy: '', altCopy: '', begin: '', end: ''
      };
      into[id] = entry;
    }

    // 상태 · 예산은 적재한 시각의 값이다. 가장 늦은 날짜의 줄에 적힌 것을 쓴다.
    var mark = level + '|' + id;
    if (!latest[mark] || day >= latest[mark]) {
      latest[mark] = day;
      entry.status = String(line[20] || '');
      entry.active = entry.status === 'ON';
      entry.budget = Number(line[21] || 0);
      entry.budgetKind = entry.budget ? 'daily' : '';
      entry.thumbnail = String(line[22] || '');
      entry.copy = String(line[23] || '');
      entry.altCopy = String(line[24] || '');
      entry.begin = naverDay_(line[25]);
      entry.end = naverDay_(line[26]);
    }
    entry.spend += netSpend_(line[11]);
    entry.impressions += Number(line[12] || 0);
    entry.clicks += Number(line[13] || 0);
    entry.purchase += Number(line[14] || 0);
    entry.addToCart += Number(line[15] || 0);
    entry.lead += Number(line[16] || 0);
    entry.results += Number(line[17] || 0);
    entry.revenue += Number(line[18] || 0);
    entry.linkClicks = entry.clicks;   // GFA 는 클릭이 한 가지다

    var loaded = line[19] instanceof Date ? line[19].toISOString() : String(line[19] || '');
    if (loaded > found.newest) found.newest = loaded;
  });
  return found;
}

// 여러 단위를 한 표에 합친다. 애드부스트는 광고그룹이 없고 애셋그룹을 쓰기 때문이다.
function naverMerge_(found, levels) {
  var out = {};
  levels.forEach(function (level) {
    var bucket = found.levels[level] || {};
    Object.keys(bucket).forEach(function (id) { out[id] = bucket[id]; });
  });
  return out;
}

function naverDates_(payload) {
  var since = String(payload.since || '');
  var until = String(payload.until || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    throw new Error('조회 기간이 올바르지 않습니다.');
  }
  return { since: since, until: until };
}

// 적재하면 담아 둔 조회를 버려야 한다. 열쇠에 계정 · 기간이 들어 있어 하나씩 지울 수 없으니,
// 열쇠에 '판 번호' 를 함께 넣고 적재할 때 그 번호를 올린다. 번호가 바뀌면 옛 열쇠는
// 아무도 찾지 않으므로 곧바로 새로 읽는다. (적재하고 화면을 열었을 때 옛 숫자가 보이면 안 된다)
function naverStamp_(bump) {
  var store = PropertiesService.getScriptProperties();
  var now = Number(store.getProperty('NAVER_STAMP') || 0);
  if (bump) {
    now += 1;
    store.setProperty('NAVER_STAMP', String(now));
  }
  return now;
}

// GFA 는 시트를 통째로 훑는다 — 줄이 만 개 넘어가면 그것만 30초가 넘는다.
// 다른 매체와 같이 담아 둔다. 적재는 하루 세 번이라 5분 담아 두어도 값이 어긋나지 않는다.
function naverReport_(payload) {
  var account = String(payload.account || '').replace(/[^0-9]/g, '');
  var when = naverDates_(payload);

  var cache = CacheService.getScriptCache();
  var key = ['naver', naverStamp_(false), account, when.since, when.until].join('|');
  if (!payload.refresh) {
    var hit = cacheGet_(cache, key);
    if (hit) {
      try {
        var cached = JSON.parse(hit);
        cached.cached = true;
        return cached;
      } catch (error) { /* 깨졌으면 다시 읽는다 */ }
    }
  }

  var found = naverGather_(account, when.since, when.until);

  var result = {
    ok: true,
    source: 'naver',
    account: {
      id: account,
      name: found.names[account] || account,
      currency: 'KRW',
      timezone: 'Asia/Seoul'
    },
    range: when,
    campaigns: sortBySpend_(naverMerge_(found, ['CAMPAIGN'])),
    adsets: sortBySpend_(naverMerge_(found, ['AD_SET', 'ASSET_GROUP'])),
    // 적재가 빠진 날을 알려 준다. 화면이 '이 기간은 일부만 적재됨' 을 띄울 수 있게.
    coverage: naverCoverage_(when.since, when.until, found.days),
    fetchedAt: found.newest || new Date().toISOString()
  };

  cachePut_(cache, key, JSON.stringify(result), META_CACHE_SECONDS);
  return result;
}

// 소재별 결과. 적재할 때 --level CREATIVE 를 함께 넣어야 값이 있다.
// 미리보기 이미지는 적재할 때 소재 목록에서 받아 함께 쌓는다 (썸네일 열).
function naverCreatives_(payload) {
  var account = String(payload.account || '').replace(/[^0-9]/g, '');
  var when = naverDates_(payload);
  var campaign = String(payload.campaign || '').replace(/[^0-9]/g, '');
  var adset = String(payload.adset || '').replace(/[^0-9]/g, '');

  // 성과 쪽과 같이 담아 둔다. 여기도 시트를 통째로 훑어 10초쯤 걸린다.
  var cache = CacheService.getScriptCache();
  var key = ['naverAds', naverStamp_(false), account, campaign, adset, when.since, when.until].join('|');
  if (!payload.refresh) {
    var hit = cacheGet_(cache, key);
    if (hit) {
      try {
        var cached = JSON.parse(hit);
        cached.cached = true;
        return cached;
      } catch (error) { /* 깨졌으면 다시 읽는다 */ }
    }
  }

  var found = naverGather_(account, when.since, when.until);
  var bucket = naverMerge_(found, ['CREATIVE']);
  var creatives = Object.keys(bucket).map(function (id) {
    var row = bucket[id];
    row.video = '';   // GFA 소재는 이미지만 적재한다 (동영상 소재도 표지 이미지가 온다)
    return row;
  }).filter(function (row) {
    if (adset) return row.adsetId === adset;
    if (campaign) return row.campaignId === campaign;
    return true;
  }).sort(function (a, b) { return b.spend - a.spend; }).slice(0, CREATIVE_LIMIT);

  var result = {
    ok: true,
    source: 'naver',
    scope: adset || campaign || account,
    range: when,
    creatives: creatives,
    coverage: naverCoverage_(when.since, when.until, found.days),
    fetchedAt: found.newest || new Date().toISOString()
  };

  cachePut_(cache, key, JSON.stringify(result), META_CACHE_SECONDS);
  return result;
}

// 기간 안에서 적재된 날 · 빠진 날을 센다.
function naverCoverage_(since, until, days) {
  var missing = [];
  var at = new Date(since + 'T00:00:00+09:00');
  var end = new Date(until + 'T00:00:00+09:00');
  var loaded = 0;
  while (at <= end && missing.length < 40) {
    var day = Utilities.formatDate(at, 'Asia/Seoul', 'yyyy-MM-dd');
    if (days[day]) loaded += 1;
    else missing.push(day);
    at.setDate(at.getDate() + 1);
  }
  return { loaded: loaded, missing: missing };
}

// ── 페이지 결과 (Microsoft Clarity) ──────────────────────────────────
// Clarity 대시보드는 iframe 을 막아 둔다. 그래서 데이터 내보내기 API 로 숫자만 받아
// 매체별 성과와 같은 카드 · 표로 그린다.
//
// 넣을 곳: Apps Script 편집기 → 프로젝트 설정(톱니) → 스크립트 속성
//   CLARITY_API_TOKEN    Clarity → Settings → Data export → Generate new API token
//   CLARITY_PROJECT_ID   화면에 'Clarity 에서 열기' 링크를 걸 때만 쓴다 (조회에는 안 쓴다)
//
// **토큰이 프로젝트 하나에 묶여 있다.** 그래서 API 를 부를 때 프로젝트 ID 를 보내지 않는다.
// 프로젝트가 여러 개면 토큰도 여러 개다.
//
// 이 API 에는 두 가지 굵은 제약이 있다. 화면을 짤 때 이걸 먼저 고려해야 한다.
//   1. **프로젝트마다 하루 10번**만 부를 수 있다 (넘으면 429).
//   2. 한 번에 **최대 3일치**만 준다. 시작일 · 종료일 파라미터가 없어 '지난 N일' 로만 물을 수 있다.
//      (그래서 화면의 기간 고르개도 1 · 2 · 3일뿐이다. 지난주 같은 지나간 기간은 볼 수 없다)
// 그래서 받은 값을 6시간 담아 두고, 오늘 몇 번 불렀는지 세어 화면에 같이 알려 준다.
var CLARITY_URL = 'https://www.clarity.ms/export-data/api/v1/project-live-insights';
var CLARITY_MAX_DAYS = 3;
var CLARITY_DAILY_CALLS = 10;
var CLARITY_CACHE_SECONDS = 21600;   // 6시간

// 쪼개서 볼 수 있는 기준. 한 번에 세 개까지 겹칠 수 있다.
var CLARITY_DIMENSIONS = ['URL', 'Source', 'Medium', 'Campaign', 'Channel',
  'Browser', 'Device', 'OS', 'Country/Region', 'ReferrerURL'];

function clarityToken_() {
  var token = cleanToken_(PropertiesService.getScriptProperties().getProperty('CLARITY_API_TOKEN'));
  if (!token) {
    throw new Error('CLARITY_API_TOKEN 스크립트 속성이 없습니다. '
      + 'Clarity → Settings → Data export → Generate new API token 으로 받아 '
      + 'Apps Script 편집기 → 프로젝트 설정 → 스크립트 속성에 넣어 주세요.');
  }
  return token;
}

// 오늘 몇 번 불렀는지. 하루 10번이 끝이라 세어 두지 않으면 까닭 모르고 막힌다.
function clarityCalls_(add) {
  var store = PropertiesService.getScriptProperties();
  var today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  var raw = String(store.getProperty('CLARITY_CALLS') || '');
  var parts = raw.split('|');
  var count = parts[0] === today ? Number(parts[1] || 0) : 0;
  if (add) {
    count += 1;
    store.setProperty('CLARITY_CALLS', today + '|' + count);
  }
  return count;
}

function clarityReport_(payload) {
  var days = Math.min(Math.max(Number(payload.days || 1), 1), CLARITY_MAX_DAYS);
  var picked = (payload.dimensions || []).filter(function (name) {
    return CLARITY_DIMENSIONS.indexOf(name) >= 0;
  }).slice(0, 3);

  var cache = CacheService.getScriptCache();
  var key = ['clarity', days, picked.join(',')].join('|');
  if (!payload.refresh) {
    var hit = cacheGet_(cache, key);
    if (hit) {
      var kept = JSON.parse(hit);
      kept.cached = true;
      return kept;
    }
  }

  var used = clarityCalls_(false);
  if (used >= CLARITY_DAILY_CALLS) {
    throw new Error('Clarity 는 하루 ' + CLARITY_DAILY_CALLS + '번까지만 부를 수 있습니다. '
      + '오늘 ' + used + '번 불렀습니다. 담아 둔 값은 6시간 동안 그대로 보실 수 있고, '
      + '한국 시간 자정에 횟수가 초기화됩니다.');
  }

  var query = ['numOfDays=' + days];
  picked.forEach(function (name, at) {
    query.push('dimension' + (at + 1) + '=' + encodeURIComponent(name));
  });

  var response = UrlFetchApp.fetch(CLARITY_URL + '?' + query.join('&'), {
    method: 'get',
    muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + clarityToken_() }
  });
  clarityCalls_(true);

  var code = response.getResponseCode();
  var text = response.getContentText() || '';
  if (code === 401 || code === 403) {
    throw new Error('Clarity API (HTTP ' + code + '): 토큰이 잘못됐거나 만료됐습니다. '
      + 'Clarity → Settings → Data export 에서 다시 발급해 주세요.');
  }
  if (code === 429) {
    throw new Error('Clarity API (HTTP 429): 하루 조회 횟수를 넘었습니다. '
      + '한국 시간 자정에 초기화됩니다.');
  }
  if (code >= 400) {
    throw new Error('Clarity API (HTTP ' + code + '): ' + text.slice(0, 300));
  }

  var body = null;
  try { body = JSON.parse(text); } catch (error) { body = null; }
  if (!body) throw new Error('Clarity 응답을 읽지 못했습니다: ' + text.slice(0, 200));

  var result = {
    ok: true,
    source: 'clarity',
    projectId: cleanToken_(PropertiesService.getScriptProperties().getProperty('CLARITY_PROJECT_ID')),
    days: days,
    dimensions: picked,
    calls: { used: clarityCalls_(false), limit: CLARITY_DAILY_CALLS },
    metrics: body,
    fetchedAt: new Date().toISOString()
  };

  var kept = JSON.stringify(result);
  cachePut_(cache, key, kept, CLARITY_CACHE_SECONDS);
  return result;
}

// ── 페이지 목록 담아 두기 ────────────────────────────────────────────
// 캐시 한 칸은 100KB 다. Clarity 의 페이지 목록은 한 칸에 안 들어간다 —
// 주소에 한글이 %EB%AF%B8… 로 늘어나 있어서 1,500개면 460KB 쯤 된다.
// 그래서 여러 칸에 나눠 담고, 몇 조각인지 따로 적어 둔다.
// 이게 없으면 화면을 열 때마다 API 를 부르게 되고, 하루 10번이 끝인 API 라 곧 막힌다.
var CACHE_SLOT = 80000;
var CACHE_MAX_SLOTS = 20;

function cachePut_(cache, key, text, seconds) {
  var count = Math.ceil(text.length / CACHE_SLOT);
  if (count > CACHE_MAX_SLOTS) return false;
  var slots = {};
  for (var i = 0; i < count; i += 1) {
    slots[key + '#' + i] = text.slice(i * CACHE_SLOT, (i + 1) * CACHE_SLOT);
  }
  slots[key + '#n'] = String(count);
  // 담아 두기는 **거들기**다. 여기서 실패해도 조회 자체는 이미 끝났으니 그대로 돌려준다.
  // (캐시가 꽉 차거나 칸이 너무 크면 던진다. 그때 화면까지 죽으면 안 된다)
  try {
    cache.putAll(slots, seconds);
    return true;
  } catch (error) {
    return false;
  }
}

function cacheGet_(cache, key) {
  var count = 0;
  try { count = Number(cache.get(key + '#n') || 0); } catch (error) { return null; }
  if (!count) return null;
  var names = [];
  for (var i = 0; i < count; i += 1) names.push(key + '#' + i);
  var slots = {};
  try { slots = cache.getAll(names); } catch (error) { return null; }
  var text = '';
  for (var k = 0; k < count; k += 1) {
    var piece = slots[key + '#' + k];
    // 한 조각이라도 사라졌으면 (칸마다 따로 만료된다) 통째로 버린다
    if (piece === undefined || piece === null) return null;
    text += piece;
  }
  return text;
}

// 페이지마다 필요한 두 값만 남긴다.
//   url 주소 · sessions 세션 · scroll 평균 스크롤 깊이(%)
// 지표 아홉 가지를 그대로 내려보내면 1MB 가 넘어 브라우저까지 무겁다.
function clarityAll_(days, refresh) {
  var cache = CacheService.getScriptCache();
  var key = 'clarityAll|' + days;
  if (!refresh) {
    var hit = cacheGet_(cache, key);
    if (hit) {
      try { return JSON.parse(hit); } catch (error) { /* 깨졌으면 다시 받는다 */ }
    }
  }

  var body = clarityReport_({ days: days, dimensions: ['URL'], refresh: true });
  var found = {};
  (body.metrics || []).forEach(function (one) {
    var name = one.metricName;
    (one.information || []).forEach(function (row) {
      var url = String(row.Url || '').trim();
      // Traffic 의 첫 줄은 주소가 없다 — 계정 전체 합계다. 페이지 목록에 넣지 않는다.
      if (!url) return;
      if (!found[url]) found[url] = { url: url, sessions: 0, scroll: null };
      if (name === 'Traffic') found[url].sessions = Number(row.totalSessionCount || 0);
      if (name === 'ScrollDepth') found[url].scroll = Number(row.averageScrollDepth || 0);
    });
  });

  // http · https · www · 끝 슬래시만 다른 주소는 **같은 페이지**다. Clarity 는 이걸 따로 센다
  //   https://minix.life/ 4,177 · https://www.minix.life/ 367 · http://minix.life/ 12
  // 합치지 않으면 어느 하나만 보게 되고 세션이 실제보다 적어 보인다.
  // 스크롤 깊이는 세션 수로 가중 평균한다 (그냥 평균하면 12세션짜리가 4,177세션과 같은 무게가 된다).
  // 담아 두는 줄에는 **주소 하나만** 남긴다. key · path 는 주소에서 그때그때 만들 수 있는데,
  // 함께 담아 두면 긴 주소를 세 번 적는 셈이라 캐시가 세 배로 커지고 그만큼 읽기가 느려진다.
  var merged = {};
  Object.keys(found).forEach(function (url) {
    var row = found[url];
    var key = clarityKey_(url);
    if (!merged[key]) {
      merged[key] = { url: url, sessions: 0, scroll: null, top: -1 };
    }
    var into = merged[key];
    into.sessions += row.sessions;
    if (row.sessions > into.top) { into.top = row.sessions; into.url = url; }
    if (row.scroll !== null) {
      var weight = row.sessions || 1;
      into.scrollSum = (into.scrollSum || 0) + row.scroll * weight;
      into.scrollWeight = (into.scrollWeight || 0) + weight;
    }
  });

  var rows = Object.keys(merged).map(function (key) {
    var one = merged[key];
    one.scroll = one.scrollWeight ? Math.round((one.scrollSum / one.scrollWeight) * 100) / 100 : null;
    delete one.scrollSum;
    delete one.scrollWeight;
    delete one.top;
    return one;
  }).sort(function (a, b) { return b.sessions - a.sessions; });

  var out = {
    projectId: body.projectId,
    days: days,
    calls: body.calls,
    rows: rows,
    fetchedAt: new Date().toISOString()
  };
  cachePut_(cache, key, JSON.stringify(out), CLARITY_CACHE_SECONDS);
  return out;
}

// 주소를 견줄 수 있는 꼴로 바꾼다.
// 사람은 브라우저에서 복사한 주소를 붙여넣는다 — 한글이 그대로 보이는 주소다.
// Clarity 는 %EB%AF%B8… 로 준다. 그래서 둘 다 풀어서 견준다.
// http/https · www · 끝 슬래시 · #조각은 같은 페이지로 본다.
function clarityKey_(url) {
  var text = String(url || '').trim().toLowerCase();
  text = text.replace(/^https?:[/][/]/, '').replace(/^www[.]/, '');
  text = text.replace(/#.*$/, '');
  // 끝 슬래시는 **물음표 앞부분에서만** 뗀다.
  // 광고 링크는 '/436/?utm_source=gfa' 꼴로 오는데, 통째로 떼면 슬래시가 남아
  // 파라미터 없는 '/436' 과 다른 페이지로 갈린다.
  var at = text.indexOf('?');
  var head = (at >= 0 ? text.slice(0, at) : text).replace(/[/]+$/, '');
  var out = head + (at >= 0 ? text.slice(at) : '');
  try { out = decodeURIComponent(out); } catch (error) { /* 못 풀면 그대로 */ }
  return out;
}

// 물음표 뒤(utm 같은 파라미터)를 뗀 주소. 사람이 광고 링크를 그대로 붙여넣어도
// 같은 페이지로 찾아 주려면 이 자리가 필요하다.
function clarityPath_(url) {
  return clarityKey_(url).replace(/[?].*$/, '');
}

var CLARITY_PICK_LIMIT = 60;
// 넣은 말이 들어간 페이지를 몇 개까지 돌려줄지. '436' 처럼 짧은 말은 수십 개가 걸린다.
var CLARITY_HIT_LIMIT = 60;

function clarityPages_(payload) {
  var days = Math.min(Math.max(Number(payload.days || 3), 1), CLARITY_MAX_DAYS);
  var all = clarityAll_(days, Boolean(payload.refresh));
  return {
    ok: true, source: 'clarity', projectId: all.projectId, days: all.days,
    calls: all.calls, total: all.rows.length,
    pages: all.rows.slice(0, CLARITY_PICK_LIMIT),
    fetchedAt: all.fetchedAt
  };
}

// 링크 하나를 넣으면 그 페이지의 스크롤 깊이 · 세션을 돌려준다.
// 딱 맞는 줄이 없으면 (주소에 붙은 파라미터가 다를 때가 많다) 비슷한 줄을 후보로 준다.
function clarityPage_(payload) {
  var wanted = clarityKey_(payload.url);
  if (!wanted) throw new Error('페이지 링크를 넣어 주세요.');
  var days = Math.min(Math.max(Number(payload.days || 3), 1), CLARITY_MAX_DAYS);
  var all = clarityAll_(days, Boolean(payload.refresh));

  var wantedPath = clarityPath_(payload.url);
  var exact = null;
  var samePath = [];
  var hits = [];
  all.rows.forEach(function (row) {
    var key = clarityKey_(row.url);
    // 넣은 말이 주소 어디에든 들어가면 걸린다. 주소를 통째로 붙여넣어도 되고
    // '플렌더-max' 나 '436' 처럼 한 토막만 넣어도 된다.
    if (key.indexOf(wanted) >= 0) hits.push(row);
    if (key === wanted) { if (!exact) exact = row; return; }
    // 파라미터만 다른 주소 (광고 링크에 utm 이 붙어 온 경우)
    if (key.replace(/[?].*$/, '') === wantedPath) samePath.push(row);
  });

  var page = exact;
  var how = 'exact';
  if (!page && samePath.length) {
    // 파라미터만 다른 줄이 여럿이면 합쳐서 한 페이지로 본다
    var sessions = 0;
    var sum = 0;
    var weight = 0;
    samePath.forEach(function (row) {
      sessions += row.sessions;
      if (row.scroll !== null) { sum += row.scroll * (row.sessions || 1); weight += row.sessions || 1; }
    });
    page = {
      url: samePath[0].url, sessions: sessions,
      scroll: weight ? Math.round((sum / weight) * 100) / 100 : null
    };
    how = 'path';
  }

  return {
    ok: true, source: 'clarity', projectId: all.projectId, days: all.days,
    calls: all.calls, total: all.rows.length,
    matched: page ? how : (hits.length ? 'some' : 'none'),
    page: page || null,
    hits: hits.sort(function (a, b) { return b.sessions - a.sessions; }).slice(0, CLARITY_HIT_LIMIT),
    hitCount: hits.length,
    fetchedAt: all.fetchedAt
  };
}

// Clarity 연결 확인 — 시트 UTM 메뉴에서 부른다.
// 응답 모양(지표 이름 · 칸 이름)이 문서와 달라질 수 있어, 받은 원문을 그대로 보여 준다.
function checkClarity() {
  var message;
  try {
    var body = clarityReport_({ days: 1, dimensions: [], refresh: true });
    var names = (body.metrics || []).map(function (one) { return one.metricName || '(이름 없음)'; });
    message = '연결됐습니다.' + '\n\n지표 ' + names.length + '개: ' + names.join(', ')
      + '\n\n오늘 부른 횟수: ' + body.calls.used + '/' + body.calls.limit
      + '\n\n[응답 원문 앞부분]\n' + JSON.stringify(body.metrics).slice(0, 1200);
  } catch (error) {
    message = '연결하지 못했습니다.' + '\n\n' + (error && error.message ? error.message : error);
  }
  Logger.log(message);
  try { SpreadsheetApp.getUi().alert(message); } catch (ignore) { /* 로그로만 */ }
  return message;
}

// 적재된 광고계정 목록. 다른 매체의 계정 고르기와 같은 모양으로 답한다.
function naverAccounts_() {
  var sheet = naverSheet_();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var seen = {};
  var out = [];
  sheet.getRange(2, 2, lastRow - 1, 2).getValues().forEach(function (line) {
    var id = String(line[0]).trim();
    if (!id || seen[id]) return;
    seen[id] = true;
    out.push({ id: id, accountId: id, name: String(line[1]).trim() || id, currency: 'KRW', disabled: false });
  });
  return out;
}

// ── 월별 예산 (퍼포먼스 마스터 시트) ─────────────────────────────────
// 세일즈 퍼포먼스 예산은 사람이 이 시트에 손으로 짠다. 화면은 그 시트를 읽어 그림으로 다시 그린다.
// 적재하지 않는다 — 시트가 원본이고, 우리는 읽어 보여 주기만 한다.
//
// **줄 번호로 잡지 않는다.** 달마다 프로모션 줄이 늘고 줄어들기 때문에, 머리글 낱말로 찾는다.
//   [26년 9월] …            제목
//   카테고리별              카테고리 표 (더 플렌더 · 생활가전 · 종합)
//   상세) SKU별 …           SKU 표
//   *고정비                 고정비 표 (SKU × 항목)
//   (3) 프로모션/ 더플렌더   프로모션 표. (숫자) 로 시작하는 덩어리는 모두 프로모션으로 읽는다
var BUDGET_SHEET_ID = '1s8NpUIburD1t7dY6BVz-DwZwihPSQnwWRZKeXjd6-nY';
var BUDGET_CACHE_SECONDS = 600;

// 달이 바뀌어 시트를 새로 만들면 스크립트 속성 BUDGET_SHEET_ID 에 새 주소만 넣으면 된다.
// (다시 배포하지 않아도 바뀐다. 속성이 없으면 위에 적어 둔 시트를 쓴다)
function budgetSheetId_() {
  var found = cleanToken_(PropertiesService.getScriptProperties().getProperty('BUDGET_SHEET_ID'));
  var picked = found || BUDGET_SHEET_ID;
  // 주소를 통째로 붙여 넣어도 받는다
  var inside = String(picked).match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  return inside ? inside[1] : picked;
}

function budgetText_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, 'Asia/Seoul', 'M/d');
  return String(value === null || value === undefined ? '' : value).trim();
}

// 숫자 칸. '-' 와 빈 칸은 **값이 없는 것**으로 둔다 (0 과 다르다 — 0 은 '안 쓴다'고 적어 둔 것이다).
function budgetNumber_(value) {
  if (typeof value === 'number') return value;
  var text = budgetText_(value).replace(/[,\s\u20a9원]/g, '');
  if (!text || text === '-') return null;
  if (/^-?\d+(\.\d+)?%$/.test(text)) return Number(text.slice(0, -1)) / 100;
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : null;
}

function budgetFirst_(line) {
  for (var c = 0; c < line.length; c += 1) {
    if (budgetText_(line[c])) return c;
  }
  return -1;
}

function budgetFindRow_(grid, from, test) {
  for (var r = Math.max(from, 0); r < grid.length; r += 1) {
    if (test(grid[r] || [], r)) return r;
  }
  return -1;
}

// 머리글 줄 위에 얹혀 있는 묶음 이름(플랜 · Actial · 세일즈팀 · 마케팅팀 FU).
// 병합된 칸이라 첫 칸에만 값이 있다. 오른쪽으로 이어 붙인다.
function budgetGroups_(line, first, count) {
  var out = [];
  var now = '';
  for (var i = 0; i < count; i += 1) {
    var found = budgetText_((line || [])[first + i]);
    if (found) now = found;
    out.push(now);
  }
  return out;
}

// 머리글 한 줄 아래로 표를 읽는다. 값이 있는 칸까지가 열이고,
// 빈 줄이 두 번 이어지거나 다음 덩어리 머리가 나오면 끝이다.
// (빈 줄 하나로 끊지 않는 이유: 프로모션 표에는 '-' 만 적힌 빈 줄이 종합 앞에 끼어 있다)
function budgetTable_(grid, headRow) {
  var head = grid[headRow] || [];
  var first = budgetFirst_(head);
  if (first < 0) return null;

  var columns = [];
  for (var c = first; c < head.length; c += 1) {
    var name = budgetText_(head[c]);
    if (!name) break;
    columns.push(name);
  }
  // 묶음 이름은 **두 군데 이상**에 적혀 있을 때만 묶음으로 본다.
  // 한 군데만 있으면 그건 덩어리 제목이다 ('상세) SKU별 …' 처럼).
  var above = grid[headRow - 1] || [];
  var marks = 0;
  for (var m = first; m < first + columns.length; m += 1) {
    if (budgetText_(above[m])) marks += 1;
  }
  var groups = marks >= 2 ? budgetGroups_(above, first, columns.length) : null;
  if (groups) groups[0] = '';   // 첫 칸은 이름 칸이다 (SKU · 구분)

  var rows = [];
  var total = null;
  var blanks = 0;
  for (var r = headRow + 1; r < grid.length; r += 1) {
    var line = grid[r] || [];
    var label = budgetText_(line[first]);
    if (/^[(*]/.test(label) || label.indexOf('상세)') === 0) break;   // 다음 덩어리

    var cells = [];
    var any = false;
    for (var k = 0; k < columns.length; k += 1) {
      var raw = line[first + k];
      var number = budgetNumber_(raw);
      var text = budgetText_(raw);
      cells.push(number === null ? text : number);
      if (text && text !== '-') any = true;
    }
    if (!any) {
      blanks += 1;
      if (blanks >= 2 && (rows.length || total)) break;
      continue;
    }
    var words = 0;
    var numbers = 0;
    cells.forEach(function (one) {
      if (typeof one === 'number') numbers += 1;
      else if (one !== '' && one !== '-') words += 1;
    });
    if (!numbers && words >= 3 && (rows.length || total)) break;   // 다음 표의 머리글
    blanks = 0;
    if (/^(종합|합계|총합|소계|total|전체[^]*total)$/i.test(label)) { total = cells; continue; }
    rows.push(cells);
  }

  return { columns: columns, groups: groups, rows: rows, total: total };
}

function budgetPlan_(payload) {
  var cache = CacheService.getScriptCache();
  var key = 'budget|' + budgetSheetId_();
  if (!payload || !payload.refresh) {
    var hit = cacheGet_(cache, key);
    if (hit) {
      try {
        var kept = JSON.parse(hit);
        kept.cached = true;
        return kept;
      } catch (error) { /* 깨졌으면 다시 읽는다 */ }
    }
  }

  var book = SpreadsheetApp.openById(budgetSheetId_());
  var sheet = book.getSheets()[0];
  var grid = sheet.getDataRange().getValues();

  var titleRow = budgetFindRow_(grid, 0, function (line) {
    return line.some(function (cell) { return /^\[/.test(budgetText_(cell)); });
  });
  var title = '';
  if (titleRow >= 0) {
    grid[titleRow].forEach(function (cell) {
      var text = budgetText_(cell);
      if (!title && /^\[/.test(text)) title = text;
    });
  }

  var categoryHead = budgetFindRow_(grid, 0, function (line) {
    return line.some(function (cell) { return budgetText_(cell) === '카테고리별'; });
  });
  var skuHead = budgetFindRow_(grid, categoryHead + 1, function (line) {
    return line.some(function (cell) { return budgetText_(cell) === 'SKU'; })
      && line.some(function (cell) { return budgetText_(cell).indexOf('총 퍼포먼스 예산') >= 0; });
  });
  var fixedMark = budgetFindRow_(grid, 0, function (line) {
    return budgetText_(line[budgetFirst_(line)] || '').indexOf('*고정비') === 0;
  });
  var fixedHead = fixedMark < 0 ? -1 : budgetFindRow_(grid, fixedMark + 1, function (line) {
    return line.some(function (cell) { return budgetText_(cell) === 'SKU'; });
  });

  // (숫자) 로 시작하는 덩어리는 모두 프로모션 표다. 머리글은 '프로모션명' 이 든 줄이다.
  var promos = [];
  for (var r = 0; r < grid.length; r += 1) {
    var at = budgetFirst_(grid[r] || []);
    if (at < 0) continue;
    var name = budgetText_(grid[r][at]);
    if (!/^\(\s*\d+\s*\)/.test(name)) continue;
    var head = budgetFindRow_(grid, r + 1, function (line) {
      return line.some(function (cell) { return budgetText_(cell) === '프로모션명'; });
    });
    if (head < 0) continue;
    var table = budgetTable_(grid, head);
    if (!table) continue;
    table.name = name.replace(/^\(\s*\d+\s*\)\s*/, '').replace(/\s*\/\s*/, ' · ');
    promos.push(table);
  }

  var result = {
    ok: true,
    source: 'budget',
    title: title,
    bookName: book.getName(),
    sheetName: sheet.getName(),
    url: 'https://docs.google.com/spreadsheets/d/' + budgetSheetId_() + '/edit',
    category: categoryHead < 0 ? null : budgetTable_(grid, categoryHead),
    sku: skuHead < 0 ? null : budgetTable_(grid, skuHead),
    fixed: fixedHead < 0 ? null : budgetTable_(grid, fixedHead),
    promos: promos,
    fetchedAt: new Date().toISOString()
  };

  cachePut_(cache, key, JSON.stringify(result), BUDGET_CACHE_SECONDS);
  return result;
}

// ── KOL 라이브 (라이브 & 행사 결과 시트) ────────────────────────────────
// 라이브 하나가 탭 하나다. 탭마다 표 모양이 조금씩 달라서 (사람이 그때그때 늘려 온 시트다)
// 줄 · 열 번호로 잡지 않고 머리글 낱말로 찾는다. 못 찾은 덩어리는 그냥 비워 둔다.
//   종합    광고비 · 매출 · 주문수 · ROAS · CPS · AOV
//   단계별  Phase(사전 · 당일 · 사후) 별 같은 지표
//   매체별  Phase × 매체 × 광고비 · 노출 · 클릭 · 전환 · CPA · CVR · CPM · CPC · CTR
//   사전    신청자 · 사전신청 구매자 · 구매 CVR · 사전신청 CPA
var KOL_SHEET_ID = '1LYGn3DUUKS0eUvCgGtSaVT6WtBFAKjQYUt7R5lcEIzs';
var KOL_CACHE_SECONDS = 600;

function kolSheetId_() {
  var found = cleanToken_(PropertiesService.getScriptProperties().getProperty('KOL_SHEET_ID'));
  var picked = found || KOL_SHEET_ID;
  var inside = String(picked).match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  return inside ? inside[1] : picked;
}

// 이 줄이 우리가 찾는 머리글인가. 낱말이 모두 들어 있어야 한다.
function kolHead_(line, words, without) {
  var text = line.map(function (cell) { return budgetText_(cell); }).join(' ');
  for (var i = 0; i < words.length; i += 1) {
    if (text.indexOf(words[i]) < 0) return false;
  }
  for (var k = 0; k < (without || []).length; k += 1) {
    if (text.indexOf(without[k]) >= 0) return false;
  }
  return true;
}

// 시트에 적힌 대로 '사전\n(8/9~8/11)' 처럼 줄바꿈이 든 칸이 있다. 한 줄로 편다.
function kolFlat_(value) {
  return budgetText_(value).replace(/\s*\n\s*/g, ' ');
}

// 표 하나를 { columns, rows, total } 로 읽고, Phase 처럼 병합된 첫 칸은 위 줄에서 물려받는다.
function kolBlock_(grid, headRow, carry) {
  var table = budgetTable_(grid, headRow);
  if (!table) return null;
  table.columns = table.columns.map(kolFlat_);
  var last = '';
  table.rows = table.rows.map(function (row) {
    var out = row.map(function (cell) { return typeof cell === 'number' ? cell : kolFlat_(cell); });
    if (carry) {
      if (out[0]) last = out[0];
      else out[0] = last;
    }
    return out;
  });
  // 숫자가 하나도 없는 줄은 값 줄이 아니다 — 다음 덩어리의 제목('단계별 결과')이 딸려 온 것이다.
  table.rows = table.rows.filter(function (row) {
    return row.some(function (cell) { return typeof cell === 'number'; });
  });
  if (table.total) {
    table.total = table.total.map(function (cell) { return typeof cell === 'number' ? cell : kolFlat_(cell); });
  }
  return table;
}

function kolTab_(sheet) {
  var grid = sheet.getDataRange().getValues();

  // 탭 이름이 라이브 이름이다. 시트 안에 적어 둔 날짜 · 이름은 곁말로 쓴다.
  var caption = '';
  for (var r = 0; r < Math.min(grid.length, 8) && !caption; r += 1) {
    (grid[r] || []).forEach(function (cell) {
      var text = kolFlat_(cell);
      if (caption) return;
      if (/라이브|\d{2}\.\d{2}\.\d{2}|^\d{1,2}\/\d{1,2}/.test(text)) caption = text;
    });
  }

  // 종합 — 광고비 · 매출(전환값) · ROAS 가 한 줄에 있는 머리글
  var sumHead = budgetFindRow_(grid, 0, function (line) {
    return (kolHead_(line, ['광고비', 'ROAS', '매출']) || kolHead_(line, ['광고비', 'ROAS', '전환값']))
      && !kolHead_(line, ['Phase']) && !kolHead_(line, ['노출']);
  });
  var summary = sumHead < 0 ? null : kolBlock_(grid, sumHead, false);

  // 단계별 — Phase 로 시작하고 ROAS 가 있으며 매체 쪼개기가 아닌 것
  var phaseHead = budgetFindRow_(grid, 0, function (line) {
    return budgetText_(line[budgetFirst_(line)] || '') === 'Phase'
      && kolHead_(line, ['ROAS'], ['매체']);
  });
  var phases = phaseHead < 0 ? null : kolBlock_(grid, phaseHead, true);

  // 매체별 — Phase × 매체 × 노출
  var mediaHead = budgetFindRow_(grid, 0, function (line) {
    return budgetText_(line[budgetFirst_(line)] || '') === 'Phase' && kolHead_(line, ['매체', '광고비'])
      && (kolHead_(line, ['노출']) || kolHead_(line, ['클릭']));
  });
  var media = mediaHead < 0 ? null : kolBlock_(grid, mediaHead, true);

  // 사전 신청유저 구매율
  var preHead = budgetFindRow_(grid, 0, function (line) {
    return budgetText_(line[budgetFirst_(line)] || '') === '신청자';
  });
  var pre = preHead < 0 ? null : kolBlock_(grid, preHead, false);

  return {
    name: sheet.getName(),
    caption: caption,
    gid: sheet.getSheetId(),
    summary: summary,
    phases: phases,
    media: media,
    pre: pre
  };
}

function kolLive_(payload) {
  var cache = CacheService.getScriptCache();
  var key = 'kol|' + kolSheetId_();
  if (!payload || !payload.refresh) {
    var hit = cacheGet_(cache, key);
    if (hit) {
      try {
        var kept = JSON.parse(hit);
        kept.cached = true;
        return kept;
      } catch (error) { /* 깨졌으면 다시 읽는다 */ }
    }
  }

  var book = SpreadsheetApp.openById(kolSheetId_());
  var lives = book.getSheets().map(function (sheet) {
    try {
      return kolTab_(sheet);
    } catch (error) {
      return { name: sheet.getName(), caption: '', error: String(error && error.message ? error.message : error) };
    }
  });

  var result = {
    ok: true,
    source: 'kol',
    bookName: book.getName(),
    url: 'https://docs.google.com/spreadsheets/d/' + kolSheetId_() + '/edit',
    lives: lives,
    fetchedAt: new Date().toISOString()
  };

  cachePut_(cache, key, JSON.stringify(result), KOL_CACHE_SECONDS);
  return result;
}

// ── 소재문구 탭 (발번한 파일명 · 광고문구) ─────────────────────────────
// 사람이 쓰던 '콘텐츠 T&D' 시트는 한 행사가 [🔴행사명 · 머리글 · 소재 줄들] 한 덩어리이고
// 매체 · 구좌 칸을 병합해 비워 두는 표다. 사람 눈에는 읽기 좋지만 프로그램이 넣기에는 나쁘다 —
// 블록을 찾아야 하고, 없으면 만들어야 하고, 색(🔴🔵)과 머리글(매체/구좌)이 블록마다 다르다.
//
// 그래서 **적재 시트 안에 판판한 탭**을 매체 계열마다 하나씩 둔다. 한 줄이 소재 하나다.
//   소재문구-메타 · 소재문구-GFA · 소재문구-카카오 · 소재문구-구글 · 소재문구-인플루언서 …
//   행사명 | 매체 | 파일명 | 광고문구 | 글자수 | 적재시각
//
// 계열은 매체 이름의 **첫 토막**이다 (GFA-피드 → GFA · 카카오-비즈보드 → 카카오).
// 표를 손대지 않고도 새 매체가 늘면 그 계열 탭이 저절로 생긴다. 지면(피드 · 쇼핑소식 …)은
// 탭을 더 쪼개지 않고 매체 열에 그대로 남긴다 — T&D 시트가 쓰던 방식과 같다.
//
// 열쇠는 행사명|매체|파일명 세 칸이다. 같은 열쇠가 다시 오면 문구만 채우고(적혀 있으면 그대로),
// 없으면 아래에 붙인다. 그래서 최종완료를 몇 번 눌러도 줄이 겹치지 않는다.
// 글자수는 수식으로 둔다 — 문구를 시트에서 고쳐도 알아서 다시 센다. (피드 65자 · 쇼핑 57자)
var TND_FLAT_PREFIX = '소재문구-';
var TND_FLAT_HEADERS = ['행사명', '매체', '파일명', '광고문구', '글자수', '적재시각'];
var TND_FLAT_ETC = '기타';

// 매체 → 계열 이름. 첫 '-' 앞을 쓴다. 시트 탭 이름에 쓸 수 없는 글자는 뺀다.
function tndFamily_(media) {
  var name = String(media || '').trim();
  var at = name.indexOf('-');
  var head = (at > 0 ? name.slice(0, at) : name).trim();
  head = head.replace(/[:\\\/\?\*\[\]]/g, '').trim();
  return head || TND_FLAT_ETC;
}

function tndFlatSheet_(book, family) {
  var name = TND_FLAT_PREFIX + family;
  var sheet = book.getSheetByName(name);
  if (!sheet) {
    sheet = book.insertSheet(name, book.getNumSheets());
    sheet.getRange(1, 1, 1, TND_FLAT_HEADERS.length).setValues([TND_FLAT_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 260);   // 행사명
    sheet.setColumnWidth(2, 130);   // 매체
    sheet.setColumnWidth(3, 130);   // 파일명
    sheet.setColumnWidth(4, 520);   // 광고문구
    sheet.getRange('D:D').setWrap(true);
    return sheet;
  }
  // 열이 늘어난 뒤 처음 열렸으면 머리글만 채운다
  var width = sheet.getLastColumn();
  if (width < TND_FLAT_HEADERS.length) {
    sheet.getRange(1, width + 1, 1, TND_FLAT_HEADERS.length - width)
      .setValues([TND_FLAT_HEADERS.slice(width)]).setFontWeight('bold');
  }
  return sheet;
}

function tndFlatKey_(campaign, media, filename) {
  return [String(campaign || '').trim(), String(media || '').trim(), String(filename || '').trim()].join('|');
}

// 한 탭에 그 계열 줄을 넣는다. { added, filled, kept } 를 돌려준다.
function tndFlatWrite_(sheet, campaign, rows) {
  var lastRow = sheet.getLastRow();
  var at = {};
  var copies = {};
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 4).getValues().forEach(function (line, i) {
      at[tndFlatKey_(line[0], line[1], line[2])] = i + 2;
      copies[i + 2] = String(line[3] || '');
    });
  }

  var fresh = [];
  var filled = 0;
  var kept = 0;
  var stamp = new Date();

  rows.forEach(function (row) {
    var key = tndFlatKey_(campaign, row.media, row.filename);
    var found = at[key];
    if (found) {
      // 이미 있는 줄. 문구를 새로 보냈고 그 칸이 비어 있으면 채운다.
      // **적혀 있는 문구는 덮지 않는다** — 사람이 시트에서 다듬어 둔 값이다.
      if (row.copy && !copies[found]) {
        sheet.getRange(found, 4).setValue(row.copy);
        copies[found] = row.copy;
        filled += 1;
      } else {
        kept += 1;
      }
      return;
    }
    if (fresh.some(function (one) { return one.key === key; })) return;   // 한 요청 안의 중복
    fresh.push({ key: key, line: [campaign, row.media, row.filename, row.copy, '', stamp] });
    at[key] = -1;
  });

  if (fresh.length) {
    var start = sheet.getLastRow() + 1;
    sheet.getRange(start, 1, fresh.length, TND_FLAT_HEADERS.length)
      .setValues(fresh.map(function (one) { return one.line; }));
    // 글자수는 수식으로 둔다 (시트에서 문구를 고쳐도 알아서 다시 센다)
    sheet.getRange(start, 5, fresh.length, 1).setFormulas(fresh.map(function (one, i) {
      return ['=IF(D' + (start + i) + '="","",LEN(D' + (start + i) + '))'];
    }));
    sheet.getRange(start, 4, fresh.length, 1).setWrap(true);
  }

  return { added: fresh.length, filled: filled, kept: kept };
}

// 파일명 화면의 '최종완료' 가 부른다. 문구를 함께 보내면 그 칸도 채운다.
function tndFilenames_(payload) {
  var campaign = String(payload.campaign || '').trim();
  var rows = payload.rows || [];
  if (!campaign) return { ok: false, error: '행사명이 비어 있습니다.' };
  if (!rows.length) return { ok: false, error: '넣을 줄이 없습니다.' };

  // 계열별로 갈라 모은다
  var byFamily = {};
  rows.forEach(function (row) {
    var filename = String(row.filename || '').trim();
    if (!filename) return;
    var media = String(row.media || '').trim();
    var family = tndFamily_(media);
    if (!byFamily[family]) byFamily[family] = [];
    byFamily[family].push({ media: media, filename: filename, copy: String(row.copy || '') });
  });

  // 여러 사람이 같은 순간에 누를 수 있다. 겹치면 같은 줄이 두 개 붙는다.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return { ok: false, error: '다른 곳에서 적재하는 중입니다. 잠시 뒤 다시 눌러 주세요.' };
  }

  try {
    var book = SpreadsheetApp.openById(SHEET_ID);
    var added = [];
    var kept = 0;
    var filled = 0;
    var tabs = [];

    Object.keys(byFamily).forEach(function (family) {
      var sheet = tndFlatSheet_(book, family);
      var done = tndFlatWrite_(sheet, campaign, byFamily[family]);
      kept += done.kept;
      filled += done.filled;
      if (done.added) added.push(sheet.getName() + ' ' + done.added + '줄');
      tabs.push({
        name: sheet.getName(),
        url: 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit#gid=' + sheet.getSheetId()
      });
    });

    return {
      ok: true,
      matched: true,
      campaign: campaign,
      added: added,          // ['소재문구-GFA 3줄', '소재문구-메타 1줄']
      filled: filled,
      kept: kept,
      tabs: tabs,
      url: tabs.length ? tabs[0].url : ('https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit')
    };
  } finally {
    lock.releaseLock();
  }
}
