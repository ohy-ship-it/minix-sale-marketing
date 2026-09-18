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

// 맨 앞에 두는 열. 이 차례대로 왼쪽에 놓는다 (이미 있는 열도 여기로 끌어온다).
// 세팅명 → 행사명 → 상품명 차례다. 시트를 열면 '어느 세팅의 무슨 행사, 무슨 제품' 이
// 왼쪽 세 칸에서 한눈에 보여야 한다. 세팅명은 사람이 적는 칸이라 앱은 비운 채로 만든다.
var FRONT_HEADERS = ['세팅명', '행사명', '상품명'];

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
// ── 로그인 확인 (미닉스 구글 계정만) ───────────────────────────────────
// 화면(파이어베이스 호스팅)은 정적 파일이라 그 자체로 문을 걸 수 없다. 그래서 여기서 막는다 —
// 웹 앱 주소가 새어도, 로그인 표(ID 토큰) 없이는 시트를 읽지도 쓰지도 못한다.
//
//   사람    화면이 구글 로그인으로 받은 ID 토큰을 payload.token 에 실어 보낸다.
//   기계    내 PC 에서 도는 네이버 적재 스크립트는 payload.key 에 스크립트 속성
//           PUSH_KEY 와 같은 글자를 실어 보낸다 (그 PC 에만 두는 값이다).
//
// 급할 때 끄는 법: 스크립트 속성 REQUIRE_LOGIN 을 off 로 둔다 (다시 배포할 것 없다).
var LOGIN_DOMAINS = ['athomecorp.com'];
var LOGIN_API_KEY = 'AIzaSyB6ce9On5hjmyB_5Gz-uSljpZAryWtwBo8';   // 파이어베이스 웹 키 (공개돼도 되는 값)

function loginCheck_(payload) {
  var props = PropertiesService.getScriptProperties();
  if (String(props.getProperty('REQUIRE_LOGIN') || '').toLowerCase() === 'off') return '';

  var key = String((payload && payload.key) || '');
  if (key) {
    var want = String(props.getProperty('PUSH_KEY') || '');
    if (want && key === want) return '적재도구';
    throw new Error('적재 열쇠가 맞지 않습니다.');
  }

  var token = String((payload && payload.token) || '');
  if (!token) throw new Error('로그인이 필요합니다 — 화면을 새로 고쳐 미닉스 계정으로 들어와 주세요.');

  // 요청마다 구글에 물으면 느리다. 같은 표는 5분간 기억한다.
  var cache = CacheService.getScriptCache();
  var slot = 'login:' + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token));
  var kept = cache.get(slot);
  if (kept) return kept;

  var answer = UrlFetchApp.fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + LOGIN_API_KEY,
    { method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ idToken: token }), muteHttpExceptions: true });
  if (answer.getResponseCode() !== 200) {
    throw new Error('로그인이 만료됐습니다 — 화면을 새로 고쳐 주세요.');
  }
  var body = JSON.parse(answer.getContentText() || '{}');
  var who = (body.users && body.users[0]) || null;
  var mail = String((who && who.email) || '').toLowerCase();
  var ok = false;
  for (var i = 0; i < LOGIN_DOMAINS.length; i++) {
    if (mail.slice(-(LOGIN_DOMAINS[i].length + 1)) === '@' + LOGIN_DOMAINS[i]) ok = true;
  }
  if (!ok) throw new Error(mail ? mail + ' 은 미닉스 계정이 아닙니다.' : '로그인을 확인하지 못했습니다.');
  cache.put(slot, mail, 300);
  return mail;
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var who = loginCheck_(payload);             // 로그인 표를 먼저 본다
    if (who && !payload.by) payload.by = who;   // 누가 고쳤는지 시트에 남긴다

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
    .addSeparator()
    .addSubMenu(SpreadsheetApp.getUi().createMenu('월별 예산')
      .addItem('지금 한 번 올리기', 'budgetDailyRun')
      .addItem('아침 자동 올리기 켜기', 'budgetDailyInstall')
      .addItem('아침 자동 올리기 끄기', 'budgetDailyRemove')
      .addItem('자동 올리기 확인', 'budgetDailyCheck')
      .addItem('손으로 건 트리거 표시하기', 'budgetDailyMarkOn'))
    .addToUi();
}

// 파트 탭을 모두 돌며 이미 쌓여 있던 행까지 채운다.
// 소재문구-* 탭도 함께 훑는다 — 거기엔 UTM 수식이 없어 머리글만 맞춰 준다.
// (그 탭은 적재할 때 tndFlatSheet_ 가 고치는데, 요즘은 GFA · 카카오만 적재해서
//  나머지 탭은 아무도 건드리지 않는다. 그래서 여기서 한 번에 맞춘다)
function fillAllUtm() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  ensureConfigSheet_(book);
  var fixed = 0;
  book.getSheets().forEach(function (sheet) {
    if (String(sheet.getName()).indexOf(TND_FLAT_PREFIX) === 0) {
      tndFlatFix_(sheet);
      fixed += 1;
      return;
    }
    if (!isPartSheet_(sheet)) return;
    var map = ensureColumns_(sheet, FALLBACK_COLUMNS);
    if (sheet.getLastRow() < 2) return;
    writeUtm_(sheet, map, 2, sheet.getLastRow() - 1);
  });
  return fixed;
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

// ── 주간 소재요청 (광고소재 기획) ─────────────────────────────────────────
// 브라우저마다 따로 갖고 있으면 다른 PC 에서 안 보인다. 그래서 시트에 담는다.
// 주차마다 한 줄 · 카드는 한 칸에 JSON (한 칸에 5만 자까지 들어간다).
var WEEKS_SHEET_NAME = '주간소재요청';
var WEEKS_HEADERS = ['차례', 'ID', '년도', '월', '주차', '카드(JSON)', '수정자', '수정시각'];

// 목록 전체를 받아 시트를 맞추는 저장(주간소재요청 · 퍼포먼스일정 · UTM대기)에 함께 쓴다.
// 화면이 보내온 base(그 화면이 아는 ID) 와 rows(지금 저장할 줄) 를 놓고,
// 시트에만 있고 둘 다에 없는 줄을 찾아 준다 — 그 화면이 본 적 없는 줄이라 지우면 안 된다.
//
// 이걸 안 하면 오래된 화면이 저장할 때마다 그 뒤에 남이 만든 줄이 사라진다.
// base 를 안 보내는 옛 화면(배포 전 브라우저)은 아무 것도 못 지우게 둔다 — 안전한 쪽이다.
function keepUnseen_(sheet, width, idColumn, rows, base) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var known = {};
  (base || []).forEach(function (id) { known[String(id)] = true; });
  (rows || []).forEach(function (one) { known[String(one && one.id)] = true; });

  var grid = sheet.getRange(2, 1, last - 1, width).getValues();
  var kept = [];
  grid.forEach(function (line) {
    var id = String(line[idColumn - 1] || '').trim();
    if (!id || known[id]) return;
    kept.push(line);
  });
  return kept;
}

function weeksSheet_() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  var sheet = book.getSheetByName(WEEKS_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(WEEKS_SHEET_NAME, book.getNumSheets());
    sheet.getRange(1, 1, 1, WEEKS_HEADERS.length).setValues([WEEKS_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 50);
    sheet.setColumnWidth(2, 240);
    sheet.setColumnWidth(6, 520);
  }
  return sheet;
}

function weeksGet_() {
  var sheet = weeksSheet_();
  var grid = sheet.getDataRange().getValues();
  var weeks = [];
  for (var at = 1; at < grid.length; at++) {
    var line = grid[at];
    var id = String(line[1] || '').trim();
    if (!id) continue;
    var rows = [];
    try { rows = JSON.parse(String(line[5] || '[]')) || []; } catch (error) { rows = []; }
    weeks.push({
      order: Number(line[0] || at),
      id: id,
      year: String(line[2] || ''),
      month: String(line[3] || ''),
      week: String(line[4] || ''),
      rows: rows,
      updatedBy: String(line[6] || ''),
      updatedAt: line[7] instanceof Date ? line[7].toISOString() : String(line[7] || '')
    });
  }
  weeks.sort(function (a, b) { return a.order - b.order; });
  return {
    ok: true,
    weeks: weeks,
    url: 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit',
    fetchedAt: new Date().toISOString()
  };
}

// 화면이 가진 목록 전체를 그대로 받아 시트를 그 모양으로 맞춘다 (차례까지 그대로).
// 여러 사람이 같은 순간에 저장하면 뒤에 온 것이 이긴다 — 자물쇠로 겹쳐 쓰는 것만 막는다.
function weeksPut_(payload) {
  var weeks = (payload && payload.weeks) || [];
  if (!weeks.length && !(payload && payload.allowEmpty)) {
    throw new Error('빈 목록으로는 덮어쓰지 않습니다 (실수로 다 지우는 것을 막습니다).');
  }
  var who = String((payload && payload.by) || '');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = weeksSheet_();
    // 이 화면이 본 적 없는 주차는 지우지 않고 뒤에 살려 둔다
    var kept = keepUnseen_(sheet, WEEKS_HEADERS.length, 2, weeks, payload && payload.base);
    var last = sheet.getLastRow();
    if (last > 1) sheet.getRange(2, 1, last - 1, WEEKS_HEADERS.length).clearContent();
    if (weeks.length) {
      var now = new Date();
      var lines = weeks.map(function (one, at) {
        return [
          at + 1,
          String(one.id || ''),
          String(one.year || ''),
          String(one.month || ''),
          String(one.week || ''),
          JSON.stringify(one.rows || []),
          who,
          now
        ];
      });
      sheet.getRange(2, 1, lines.length, WEEKS_HEADERS.length).setValues(lines);
    }
    if (kept.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, kept.length, WEEKS_HEADERS.length).setValues(kept);
    }
    return { ok: true, saved: weeks.length, kept: kept.length, savedAt: new Date().toISOString() };
  } finally {
    lock.releaseLock();
  }
}

// ── 퍼포먼스일정 (마케팅팀 일정표) ────────────────────────────────────
// 주간소재요청과 같은 이유로 시트에 담는다 — 브라우저마다 따로 갖고 있으면 다른 PC 에서
// 안 보인다. 일정 하나가 한 줄이고, 칸을 그대로 펼쳐 둔다 (사람이 시트에서도 읽게).
var SCHED_SHEET_NAME = '퍼포먼스일정';
/* 수급일자는 **맨 뒤에** 붙인다. 종료일 옆에 끼워 넣으면 이미 쌓인 줄의 SKU 부터
   수정시각까지가 두 칸씩 밀려 엉뚱하게 읽힌다 (단계날짜에서 겪은 것과 같다). */
var SCHED_HEADERS = ['차례', 'ID', '일정명', '시작일', '종료일', 'SKU', '판매채널', '매체',
  '세팅완료', '수정자', '수정시각', '수급시작일', '수급종료일'];

function schedSheet_() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  var sheet = book.getSheetByName(SCHED_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SCHED_SHEET_NAME, book.getNumSheets());
    sheet.getRange(1, 1, 1, SCHED_HEADERS.length).setValues([SCHED_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 50);
    sheet.setColumnWidth(2, 240);
    sheet.setColumnWidth(3, 320);
    return sheet;
  }
  // 수급일자 칸이 생기기 전에 만든 시트면 머리글만 이어 붙인다 (쌓인 줄은 그대로 둔다)
  var width = sheet.getLastColumn();
  if (width < SCHED_HEADERS.length) {
    sheet.getRange(1, width + 1, 1, SCHED_HEADERS.length - width)
      .setValues([SCHED_HEADERS.slice(width)]).setFontWeight('bold');
  }
  return sheet;
}

// 목록 칸(SKU · 판매채널 · 매체)은 쉼표로 이어 적는다. 읽을 때 다시 나눈다.
function schedList_(value) {
  return String(value === null || value === undefined ? '' : value)
    .split(',')
    .map(function (one) { return String(one).trim(); })
    .filter(function (one) { return one !== ''; });
}

function schedGet_() {
  var sheet = schedSheet_();
  var grid = sheet.getDataRange().getValues();
  var rows = [];
  for (var at = 1; at < grid.length; at++) {
    var line = grid[at];
    var id = String(line[1] || '').trim();
    if (!id) continue;
    var start = naverDay_(line[3]);
    var supply = naverDay_(line[11]);
    rows.push({
      order: Number(line[0] || at),
      id: id,
      name: String(line[2] || ''),
      date: start ? { start: start, end: naverDay_(line[4]) } : null,
      supply: supply ? { start: supply, end: naverDay_(line[12]) } : null,
      sku: schedList_(line[5]),
      channel: schedList_(line[6]),
      media: schedList_(line[7]),
      done: line[8] === true || String(line[8]).trim() === 'TRUE' || String(line[8]).trim() === 'O',
      updatedBy: String(line[9] || ''),
      updatedAt: line[10] instanceof Date ? line[10].toISOString() : String(line[10] || '')
    });
  }
  rows.sort(function (a, b) { return a.order - b.order; });
  return {
    ok: true,
    rows: rows,
    url: 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit',
    fetchedAt: new Date().toISOString()
  };
}

// 화면이 가진 목록 전체를 그대로 받아 시트를 그 모양으로 맞춘다 (차례까지 그대로).
// 날짜는 글자로 넣는다 — 시트가 날짜로 바꿔 두면 읽을 때 naverDay_ 가 다시 펴 준다.
function schedPut_(payload) {
  var rows = (payload && payload.rows) || [];
  if (!rows.length && !(payload && payload.allowEmpty)) {
    throw new Error('빈 목록으로는 덮어쓰지 않습니다 (실수로 다 지우는 것을 막습니다).');
  }
  var who = String((payload && payload.by) || '');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = schedSheet_();
    // 이 화면이 본 적 없는 일정은 지우지 않고 뒤에 살려 둔다
    var kept = keepUnseen_(sheet, SCHED_HEADERS.length, 2, rows, payload && payload.base);
    var last = sheet.getLastRow();
    if (last > 1) sheet.getRange(2, 1, last - 1, SCHED_HEADERS.length).clearContent();
    if (rows.length) {
      var now = new Date();
      var lines = rows.map(function (one, at) {
        var date = one.date || {};
        var supply = one.supply || {};
        return [
          at + 1,
          String(one.id || ''),
          String(one.name || ''),
          String(date.start || ''),
          String(date.end || ''),
          (one.sku || []).join(', '),
          (one.channel || []).join(', '),
          (one.media || []).join(', '),
          one.done ? true : false,
          who,
          now,
          String(supply.start || ''),
          String(supply.end || '')
        ];
      });
      sheet.getRange(2, 1, lines.length, SCHED_HEADERS.length).setValues(lines);
    }
    if (kept.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, kept.length, SCHED_HEADERS.length).setValues(kept);
    }
    return { ok: true, saved: rows.length, kept: kept.length, savedAt: new Date().toISOString() };
  } finally {
    lock.releaseLock();
  }
}

// ── 단계 날짜 (매체별 성과 · 전매체 찾기) ──────────────────────────────
// 사전 · 당일 · 사후를 가르는 날짜다. 이 날짜로 광고비와 결과가 갈리므로 사람마다
// 다르면 같은 행사인데 숫자가 달라진다. 그래서 시트에 담아 함께 쓴다.
// 열쇠는 **검색어(행사)** 다 — 날짜는 그 행사의 것이라 하나로 뭉치면 서로 덮어쓴다.
// 줄마다 따로 고치므로(끼워넣기) 다른 행사 줄은 건드리지 않는다.
var PHASE_SHEET_NAME = '단계날짜';
var PHASE_NAMES = ['사전', '당일', '사후', '상시'];
/* 상시 칸은 **맨 뒤에** 붙인다. 사후 뒤에 끼워 넣으면 이미 쌓인 줄의
   수정자 · 수정시각이 한 칸씩 밀려 엉뚱하게 읽힌다.
   그래서 칸 자리를 이름으로 못 박아 둔다 (차례로 세지 않는다). */
var PHASE_HEADERS = ['검색어', '사전 시작', '사전 종료', '당일 시작', '당일 종료',
  '사후 시작', '사후 종료', '수정자', '수정시각', '상시 시작', '상시 종료'];
var PHASE_AT = { '사전': 1, '당일': 3, '사후': 5, '상시': 9 };   // 시작 칸 (종료는 그 다음)

function phaseSheet_() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  var sheet = book.getSheetByName(PHASE_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(PHASE_SHEET_NAME, book.getNumSheets());
    sheet.getRange(1, 1, 1, PHASE_HEADERS.length).setValues([PHASE_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 260);
    return sheet;
  }
  // 상시 칸이 생기기 전에 만든 시트면 머리글만 이어 붙인다
  var width = sheet.getLastColumn();
  if (width < PHASE_HEADERS.length) {
    sheet.getRange(1, width + 1, 1, PHASE_HEADERS.length - width)
      .setValues([PHASE_HEADERS.slice(width)]).setFontWeight('bold');
  }
  return sheet;
}

function phaseRow_(line) {
  var spans = {};
  PHASE_NAMES.forEach(function (name) {
    var at = PHASE_AT[name];
    spans[name] = { since: naverDay_(line[at]), until: naverDay_(line[at + 1]) };
  });
  return {
    word: String(line[0] || ''),
    spans: spans,
    updatedBy: String(line[7] || ''),
    updatedAt: line[8] instanceof Date ? line[8].toISOString() : String(line[8] || '')
  };
}

function phaseGet_() {
  var sheet = phaseSheet_();
  var grid = sheet.getDataRange().getValues();
  var rows = [];
  for (var at = 1; at < grid.length; at++) {
    if (!String(grid[at][0] || '').trim()) continue;
    rows.push(phaseRow_(grid[at]));
  }
  return {
    ok: true,
    rows: rows,
    url: 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit',
    fetchedAt: new Date().toISOString()
  };
}

// 한 검색어의 날짜만 고친다. 날짜가 모두 비면 그 줄을 지운다.
// 날짜는 글자로 넣는다 (시트가 날짜로 바꿔 두어도 naverDay_ 가 다시 펴 준다).
function phasePut_(payload) {
  var word = String((payload && payload.word) || '').trim();
  if (!word) throw new Error('검색어가 비어 있습니다.');
  var spans = (payload && payload.spans) || {};
  var who = String((payload && payload.by) || '');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = phaseSheet_();
    var last = sheet.getLastRow();
    var at = 0;
    if (last > 1) {
      var have = sheet.getRange(2, 1, last - 1, 1).getValues();
      for (var i = 0; i < have.length; i++) {
        if (String(have[i][0]).trim().toLowerCase() === word.toLowerCase()) { at = i + 2; break; }
      }
    }

    // 칸 자리를 못 박아 채운다 (상시가 맨 뒤라 차례로 밀어 넣을 수 없다)
    var line = [];
    for (var k = 0; k < PHASE_HEADERS.length; k++) line.push('');
    line[0] = word;
    var any = false;
    PHASE_NAMES.forEach(function (name) {
      var one = spans[name] || {};
      var since = String(one.since || '').slice(0, 10);
      var until = String(one.until || '').slice(0, 10);
      if (since || until) any = true;
      line[PHASE_AT[name]] = since;
      line[PHASE_AT[name] + 1] = until;
    });
    line[7] = who;
    line[8] = new Date();

    if (!any) {
      // 날짜를 다 지운 것이다. 줄도 없앤다 (모두에게 지워진다).
      if (at) sheet.deleteRow(at);
      return { ok: true, word: word, removed: !!at };
    }
    if (!at) at = sheet.getLastRow() + 1;
    sheet.getRange(at, 1, 1, PHASE_HEADERS.length).setValues([line]);
    return { ok: true, word: word, savedAt: new Date().toISOString() };
  } finally {
    lock.releaseLock();
  }
}

// ── 주간미팅 작성 ─────────────────────────────────────────────────────
// 미닉스 워크스페이스의 '주간 리포트(팀)' 와 같은 짜임새다: 한 주 안에 파트가 여럿,
// 파트 하나는 한 사람이 적는다. 그래서 한 주 × 한 파트가 한 줄이고,
// 저장은 그 줄만 덮어쓴다 (동시에 같은 줄을 고칠 일이 없다).
//
// 주(週) 는 그 주 월요일 날짜(2026-09-07)로 적어 둔다 — 이름표는 화면에서 만든다.
// 빈 줄도 지우지 않는다. 줄이 있으면 '그 주가 열려 있다'는 뜻이다.
var WEEKLY_SHEET_NAME = '주간미팅';
var WEEKLY_HEADERS = ['주', '파트', '이름', '내용', '상태', '수정자', '수정시각'];

function weeklySheet_() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  var sheet = book.getSheetByName(WEEKLY_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(WEEKLY_SHEET_NAME, book.getNumSheets());
    sheet.getRange(1, 1, 1, WEEKLY_HEADERS.length).setValues([WEEKLY_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 100);
    sheet.setColumnWidth(2, 90);
    sheet.setColumnWidth(3, 90);
    sheet.setColumnWidth(4, 520);
  }
  return sheet;
}

function weeklyDay_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, 'Asia/Seoul', 'yyyy-MM-dd');
  }
  return String(value || '').trim().slice(0, 10);
}

function weeklyGet_() {
  var sheet = weeklySheet_();
  var grid = sheet.getDataRange().getValues();
  var rows = [];
  for (var at = 1; at < grid.length; at++) {
    var week = weeklyDay_(grid[at][0]);
    var part = String(grid[at][1] || '').trim();
    if (!week || !part) continue;
    rows.push({
      week: week,
      part: part,
      name: String(grid[at][2] || ''),
      text: String(grid[at][3] || ''),
      status: String(grid[at][4] || 'wip'),
      by: String(grid[at][5] || ''),
      at: grid[at][6] instanceof Date ? grid[at][6].toISOString() : String(grid[at][6] || '')
    });
  }
  return {
    ok: true,
    rows: rows,
    url: 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit',
    fetchedAt: new Date().toISOString()
  };
}

// 한 주 · 한 파트의 글만 고친다 (없으면 새로 넣는다). 빈 글도 그대로 둔다.
function weeklyPut_(payload) {
  var week = weeklyDay_((payload && payload.week) || '');
  var part = String((payload && payload.part) || '').trim();
  if (!week || !part) throw new Error('주와 파트가 있어야 합니다.');
  var name = String((payload && payload.name) || '');
  var text = String((payload && payload.text) || '');
  var status = String((payload && payload.status) || 'wip');
  var who = String((payload && payload.by) || '');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = weeklySheet_();
    var last = sheet.getLastRow();
    var at = 0;
    if (last > 1) {
      var have = sheet.getRange(2, 1, last - 1, 2).getValues();
      for (var i = 0; i < have.length; i++) {
        if (weeklyDay_(have[i][0]) === week && String(have[i][1]).trim() === part) { at = i + 2; break; }
      }
    }
    if (!at) at = sheet.getLastRow() + 1;
    sheet.getRange(at, 1, 1, WEEKLY_HEADERS.length)
      .setValues([[week, part, name, text, status, who, new Date()]]);
    return { ok: true, week: week, part: part, savedAt: new Date().toISOString() };
  } finally {
    lock.releaseLock();
  }
}

// 한 주를 통째로 지운다 (그 주의 모든 파트 줄).
function weeklyDrop_(payload) {
  var week = weeklyDay_((payload && payload.week) || '');
  if (!week) throw new Error('지울 주가 비어 있습니다.');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = weeklySheet_();
    var last = sheet.getLastRow();
    if (last < 2) return { ok: true, week: week, removed: 0 };
    var have = sheet.getRange(2, 1, last - 1, 1).getValues();
    var gone = 0;
    for (var i = have.length - 1; i >= 0; i--) {      // 아래에서부터 지운다 (줄 번호가 밀리지 않게)
      if (weeklyDay_(have[i][0]) === week) { sheet.deleteRow(i + 2); gone++; }
    }
    return { ok: true, week: week, removed: gone };
  } finally {
    lock.releaseLock();
  }
}

// ── 붙여넣은 그림 담기 (주간미팅 작성) ─────────────────────────────────
// 시트 칸에는 글자만 담긴다 (한 칸 5만 자). 화면에서 붙인 그림은 그보다 훨씬 크므로
// 드라이브에 파일로 두고, 글에는 ![그림](주소) 한 줄만 남긴다.
//
// 처음 부를 때 드라이브 권한을 새로 묻는다 (스크립트를 다시 배포한 뒤 한 번 승인해야 한다).
// 폴더는 한 번 만들어 그 ID 를 스크립트 속성 IMAGE_FOLDER_ID 에 적어 둔다.
// 나눔 설정은 **회사 도메인 안에서 링크로 보기**를 먼저 시도한다 (개인 계정이면 링크 공개로 물러선다).
var IMAGE_FOLDER_NAME = '미닉스 워크스페이스 그림';
var IMAGE_MAX_BASE64 = 14 * 1000 * 1000;   // 밑글자 1,400만 자 ≒ 파일 10MB

function imageFolder_() {
  var store = PropertiesService.getScriptProperties();
  var id = store.getProperty('IMAGE_FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (error) { /* 지워졌으면 다시 만든다 */ }
  }
  var found = DriveApp.getFoldersByName(IMAGE_FOLDER_NAME);
  var folder = found.hasNext() ? found.next() : DriveApp.createFolder(IMAGE_FOLDER_NAME);
  store.setProperty('IMAGE_FOLDER_ID', folder.getId());
  return folder;
}

function imageSave_(payload) {
  var data = String((payload && payload.data) || '');      // 밑글자(base64) 만 온다
  var mime = String((payload && payload.mime) || 'image/png');
  var name = String((payload && payload.name) || '붙인 그림');
  if (!data) throw new Error('그림이 비어 있습니다.');
  if (data.length > IMAGE_MAX_BASE64) throw new Error('그림이 너무 큽니다 (10MB 넘음). 크기를 줄여 주세요.');
  if (mime.indexOf('image/') !== 0) throw new Error('그림 파일이 아닙니다: ' + mime);

  var blob = Utilities.newBlob(Utilities.base64Decode(data), mime, name);
  var file = imageFolder_().createFile(blob);

  // 화면(<img>)에서 바로 보이게 나눔을 열어 준다. 회사 도메인 안으로 먼저 시도한다.
  var access = '';
  try {
    file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);
    access = 'domain';
  } catch (error) {
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      access = 'anyone';
    } catch (deeper) {
      access = 'private';   // 나눔을 못 열었다 — 만든 사람만 보인다
    }
  }

  return {
    ok: true,
    id: file.getId(),
    // <img> 로 바로 보이는 주소. uc?export=view 는 큰 파일에서 안내 페이지를 주기도 해 썸네일 주소를 쓴다.
    url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1600',
    open: file.getUrl(),
    name: file.getName(),
    bytes: blob.getBytes().length,
    access: access,
    savedAt: new Date().toISOString()
  };
}

// 그림을 화면 안에서 그리려면 바이트가 필요하다.
// 드라이브 주소(thumbnail?id=…)를 <img> 에 그대로 걸면 보는 사람이 회사 구글 계정으로
// 로그인돼 있어야 하고, 여러 계정을 함께 쓰면 엉뚱한 계정으로 물어 깨진 그림이 된다.
// 그래서 이 길로 바이트를 받아 화면에서 data: 로 그린다 (웹앱이 소유자 권한으로 읽는다).
//
// **우리 그림 폴더 안의 파일만 준다.** 이 웹앱은 누구나 부를 수 있어서, 아무 파일 번호나
// 받아 주면 소유자의 드라이브를 통째로 읽는 창구가 되어 버린다.
function imageGet_(payload) {
  var id = String((payload && payload.id) || '').trim();
  if (!id) throw new Error('그림 번호가 비어 있습니다.');

  var file;
  try {
    file = DriveApp.getFileById(id);
  } catch (error) {
    throw new Error('그림을 찾지 못했습니다.');
  }

  var folderId = imageFolder_().getId();
  var mine = false;
  var parents = file.getParents();
  while (parents.hasNext()) {
    if (parents.next().getId() === folderId) { mine = true; break; }
  }
  if (!mine) throw new Error('워크스페이스 그림 폴더의 파일이 아닙니다.');

  var blob = file.getBlob();
  var mime = String(blob.getContentType() || '');
  if (mime.indexOf('image/') !== 0) throw new Error('그림 파일이 아닙니다: ' + mime);
  var bytes = blob.getBytes();

  return {
    ok: true,
    id: id,
    mime: mime,
    name: file.getName(),
    bytes: bytes.length,
    data: Utilities.base64Encode(bytes)
  };
}

// 한 사람(파트)을 통째로 뺀다 — 모든 주의 그 사람 줄을 지운다.
function weeklyPartDrop_(payload) {
  var part = String((payload && payload.part) || '').trim();
  if (!part) throw new Error('뺄 파트가 비어 있습니다.');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = weeklySheet_();
    var last = sheet.getLastRow();
    if (last < 2) return { ok: true, part: part, removed: 0 };
    var have = sheet.getRange(2, 2, last - 1, 1).getValues();      // 파트 칸
    var gone = 0;
    for (var i = have.length - 1; i >= 0; i--) {                    // 아래에서부터 (줄 번호가 밀리지 않게)
      if (String(have[i][0]).trim() === part) { sheet.deleteRow(i + 2); gone++; }
    }
    return { ok: true, part: part, removed: gone };
  } finally {
    lock.releaseLock();
  }
}

// 드라이브 권한 승인용. 편집기에서 이 함수를 실행하면 권한 창이 뜬다.
// **일부러 try/catch 를 두지 않는다.** 오류를 붙잡으면 Apps Script 가 권한 창을 띄우지 못하고
// 우리 코드가 오류만 로그로 적어 버린다 (checkImageSave 가 그래서 안 먹혔다).
// getUi() 도 부르지 않는다 — 편집기에서는 알림창을 띄울 수 없어 실행이 멈춘다.
function grantDrive() {
  var folder = imageFolder_();
  var line = '드라이브 권한 OK · 폴더: ' + folder.getName() + ' · ' + folder.getUrl();
  Logger.log(line);
  return line;
}

// 그림 담을 폴더 확인 — 편집기에서 한 번 실행해 드라이브 권한을 승인해 두면 된다.
// (새 권한은 스크립트를 다시 배포한 뒤 한 번 승인해야 붙여넣기가 된다)
function checkImageSave() {
  var message;
  try {
    var folder = imageFolder_();
    message = '드라이브 권한이 있습니다.\n\n폴더: ' + folder.getName()
      + '\n주소: ' + folder.getUrl()
      + '\n\n이제 주간미팅 작성에서 그림을 붙여넣을 수 있습니다.';
  } catch (error) {
    message = '드라이브를 쓸 수 없습니다.\n\n' + (error && error.message ? error.message : error);
  }
  Logger.log(message);
  try { SpreadsheetApp.getUi().alert(message); } catch (ignore) { /* 로그로만 */ }
  return message;
}

// ── 팀 메모 (대시보드 홈) ─────────────────────────────────────────────
// 이름이 '팀 메모' 인데 그 브라우저에만 있었다. 시트에 한 칸으로 담는다.
// 여러 사람이 같은 순간에 고치면 뒤에 온 것이 이긴다 — 자물쇠로 겹쳐 쓰는 것만 막는다.
var NOTE_SHEET_NAME = '팀메모';
var NOTE_HEADERS = ['메모', '수정자', '수정시각'];

function noteSheet_() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  var sheet = book.getSheetByName(NOTE_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(NOTE_SHEET_NAME, book.getNumSheets());
    sheet.getRange(1, 1, 1, NOTE_HEADERS.length).setValues([NOTE_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 620);
    sheet.getRange('A2').setWrap(true);
  }
  return sheet;
}

function noteGet_() {
  var sheet = noteSheet_();
  var line = sheet.getRange(2, 1, 1, NOTE_HEADERS.length).getValues()[0];
  var when = line[2];
  return {
    ok: true,
    text: String(line[0] === null || line[0] === undefined ? '' : line[0]),
    updatedBy: String(line[1] || ''),
    updatedAt: when instanceof Date ? when.toISOString() : String(when || ''),
    url: 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit',
    fetchedAt: new Date().toISOString()
  };
}

function notePut_(payload) {
  var text = String((payload && payload.text) || '');
  var who = String((payload && payload.by) || '');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = noteSheet_();
    var now = new Date();
    sheet.getRange(2, 1, 1, NOTE_HEADERS.length).setValues([[text, who, now]]);
    sheet.getRange('A2').setWrap(true);
    return { ok: true, saved: text.length, savedAt: now.toISOString() };
  } finally {
    lock.releaseLock();
  }
}

// ── UTM 대기 줄 (UTM 빌더에서 아직 적재하지 않은 줄) ─────────────────────
// 적재를 누르기 전의 줄이 그 브라우저에만 있었다. 그 PC 를 안 켜면 아무도 모르고,
// 브라우저를 비우면 잃는다. 그래서 여기에 담는다. **적재된 줄은 담지 않는다** —
// 그건 이미 파트 탭에 들어가 있다.
// 한 줄이 대기 한 건이고 값은 한 칸에 JSON 으로 둔다 (칸이 늘어도 시트를 안 고치게).
var UTM_WAIT_SHEET_NAME = 'UTM대기';
var UTM_WAIT_HEADERS = ['차례', 'ID', '파트', '파일명', '행사명', '담당자', '내용(JSON)', '수정자', '수정시각'];

function utmWaitSheet_() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  var sheet = book.getSheetByName(UTM_WAIT_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(UTM_WAIT_SHEET_NAME, book.getNumSheets());
    sheet.getRange(1, 1, 1, UTM_WAIT_HEADERS.length).setValues([UTM_WAIT_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 50);
    sheet.setColumnWidth(2, 240);
    sheet.setColumnWidth(7, 520);
  }
  return sheet;
}

function utmWaitGet_() {
  var sheet = utmWaitSheet_();
  var grid = sheet.getDataRange().getValues();
  var rows = [];
  for (var at = 1; at < grid.length; at++) {
    var line = grid[at];
    var id = String(line[1] || '').trim();
    if (!id) continue;
    var one = null;
    try { one = JSON.parse(String(line[6] || 'null')); } catch (error) { one = null; }
    if (!one || typeof one !== 'object') continue;
    one.id = id;
    one.sent = false;              // 대기 탭에는 안 보낸 줄만 담는다
    rows.push(one);
  }
  return {
    ok: true,
    rows: rows,
    url: 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit',
    fetchedAt: new Date().toISOString()
  };
}

// 화면이 가진 대기 목록 그대로 시트를 맞춘다.
// 여기는 **빈 목록도 받는다** — 적재하거나 비우면 대기 줄이 없어지는 것이 정상이다.
function utmWaitPut_(payload) {
  var rows = (payload && payload.rows) || [];
  var who = String((payload && payload.by) || '');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = utmWaitSheet_();
    // 이 화면이 본 적 없는 대기 줄은 지우지 않고 뒤에 살려 둔다
    var kept = keepUnseen_(sheet, UTM_WAIT_HEADERS.length, 2, rows, payload && payload.base);
    var last = sheet.getLastRow();
    if (last > 1) sheet.getRange(2, 1, last - 1, UTM_WAIT_HEADERS.length).clearContent();
    if (rows.length) {
      var now = new Date();
      var lines = rows.map(function (one, at) {
        return [
          at + 1,
          String(one.id || ''),
          String(one.part || ''),
          String(one.filename || ''),
          String(one.event || ''),
          String(one.owner || ''),
          JSON.stringify(one),
          who,
          now
        ];
      });
      sheet.getRange(2, 1, lines.length, UTM_WAIT_HEADERS.length).setValues(lines);
    }
    if (kept.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, kept.length, UTM_WAIT_HEADERS.length).setValues(kept);
    }
    return { ok: true, saved: rows.length, kept: kept.length, savedAt: new Date().toISOString() };
  } finally {
    lock.releaseLock();
  }
}

// ── 소재 수급 일정 (일정관리 · 콘텐츠 일정) ────────────────────────────
// 노션 '[콘마] 소재 수급 일정' 의 '행사 광고 일정' 표를 그대로 옮긴 것이다.
// 칸 이름도 노션과 같게 둔다 — 옮겨 적을 때 헷갈리지 않게.
//   이름 · SKU · 전달 일자 · 수급 일자 · 광고 매체 · 참고사항 · 담당자
// 달력은 **전달 일자**에 놓고 카드에는 수급 일자를 적는다 (노션 보기와 같다).
// 아이콘 · 색은 노션 카드에 보이던 것이라 함께 담는다.
var SUPPLY_SHEET_NAME = '소재수급일정';
var SUPPLY_HEADERS = ['차례', 'ID', '아이콘', '이름', 'SKU', '전달 일자', '수급 일자',
  '광고 매체', '참고사항', '담당자', '색', '수정자', '수정시각'];

function supplySheet_() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  var sheet = book.getSheetByName(SUPPLY_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SUPPLY_SHEET_NAME, book.getNumSheets());
    sheet.getRange(1, 1, 1, SUPPLY_HEADERS.length).setValues([SUPPLY_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 50);
    sheet.setColumnWidth(2, 240);
    sheet.setColumnWidth(3, 60);
    sheet.setColumnWidth(4, 300);
    sheet.setColumnWidth(5, 200);
    sheet.setColumnWidth(8, 200);
    sheet.setColumnWidth(9, 260);
  }
  return sheet;
}

function supplyGet_() {
  var sheet = supplySheet_();
  var grid = sheet.getDataRange().getValues();
  var rows = [];
  for (var at = 1; at < grid.length; at++) {
    var line = grid[at];
    var id = String(line[1] || '').trim();
    if (!id) continue;
    rows.push({
      order: Number(line[0] || at),
      id: id,
      icon: String(line[2] || ''),
      name: String(line[3] || ''),
      sku: schedList_(line[4]),
      hand: naverDay_(line[5]),       // 전달 일자 (달력에 놓는 날)
      take: naverDay_(line[6]),       // 수급 일자 (카드에 적는 날)
      media: schedList_(line[7]),
      note: String(line[8] || ''),
      owners: schedList_(line[9]),
      color: String(line[10] || ''),
      updatedBy: String(line[11] || ''),
      updatedAt: line[12] instanceof Date ? line[12].toISOString() : String(line[12] || '')
    });
  }
  rows.sort(function (a, b) { return a.order - b.order; });
  return {
    ok: true,
    rows: rows,
    url: 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit',
    fetchedAt: new Date().toISOString()
  };
}

// 화면이 가진 목록 전체를 그대로 받아 맞춘다. 본 적 없는 줄은 지우지 않는다 (keepUnseen_).
function supplyPut_(payload) {
  var rows = (payload && payload.rows) || [];
  if (!rows.length && !(payload && payload.allowEmpty)) {
    throw new Error('빈 목록으로는 덮어쓰지 않습니다 (실수로 다 지우는 것을 막습니다).');
  }
  var who = String((payload && payload.by) || '');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = supplySheet_();
    var kept = keepUnseen_(sheet, SUPPLY_HEADERS.length, 2, rows, payload && payload.base);
    var last = sheet.getLastRow();
    if (last > 1) sheet.getRange(2, 1, last - 1, SUPPLY_HEADERS.length).clearContent();
    if (rows.length) {
      var now = new Date();
      var lines = rows.map(function (one, at) {
        return [
          at + 1,
          String(one.id || ''),
          String(one.icon || ''),
          String(one.name || ''),
          (one.sku || []).join(', '),
          String(one.hand || ''),
          String(one.take || ''),
          (one.media || []).join(', '),
          String(one.note || ''),
          (one.owners || []).join(', '),
          String(one.color || ''),
          who,
          now
        ];
      });
      sheet.getRange(2, 1, lines.length, SUPPLY_HEADERS.length).setValues(lines);
    }
    if (kept.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, kept.length, SUPPLY_HEADERS.length).setValues(kept);
    }
    return { ok: true, saved: rows.length, kept: kept.length, savedAt: new Date().toISOString() };
  } finally {
    lock.releaseLock();
  }
}

// **읽기만 할 때는 표를 손보지 않는다.**
// ensureConfigSheet_ 는 빠진 줄을 채우고 autoResizeColumns 까지 부르는데, 그 한 줄이
// 6~12초를 잡아먹는다 (직접 재 봤다). 고르개를 채우려고 읽는 길에서는 그만큼이 통째로
// 사람이 기다리는 시간이 된다. 표가 아예 없을 때만 만들어 준다.
function configList_() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  var config = book.getSheetByName(CONFIG_SHEET_NAME) || ensureConfigSheet_(book);
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

// ── 파일명 순번 ────────────────────────────────────────────────────
// 발번은 브라우저에서 하지만, 다음 번호를 그 브라우저 기록으로만 세면 PC 마다 같은 번호가
// 나온다. 적재 시트가 원본이다 — 파트 탭들의 '파일명' 칸을 훑어 코드마다 가장 큰 번호를
// 알려 주고, 화면은 그 위에서 이어 쓴다.
//
// 파일명은 `코드-순번` 이고 코드 안에도 붙임표가 있다 (promotion-2, 1miniute-secondaryUse).
// 그래서 앞은 길게 먹고 맨 뒤의 `-숫자` 만 순번으로 본다. 뒤에 (세로) 가 붙어 있어도 된다.
var SEQ_RULE = /^([A-Za-z0-9][A-Za-z0-9_-]*)-(\d+)/;

function filenameSeq_() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  var top = {};
  var read = 0;
  PART_SHEETS.forEach(function (name) {
    var sheet = book.getSheetByName(name);
    if (!sheet) return;
    var last = sheet.getLastRow();
    if (last < 2) return;
    var at = headerMap_(sheet)['파일명'];
    if (!at) return;
    sheet.getRange(2, at, last - 1, 1).getValues().forEach(function (line) {
      var found = SEQ_RULE.exec(String(line[0]).trim());
      if (!found) return;
      read += 1;
      var code = found[1];
      top[code] = Math.max(top[code] || 0, Number(found[2]));
    });
  });
  return { ok: true, top: top, read: read };
}

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

/* ── 파트 탭의 번호(gid) ───────────────────────────────────────────
   화면이 적재 시트를 읽을 때는 구글의 gviz 라는 빠른 길을 쓴다 (시트를 CSV 로 그냥 준다).
   그런데 그 길은 **탭을 이름으로 못 고른다** — sheet=더플렌더_파트 라고 적어도 조용히
   첫 탭을 준다 (없는 이름을 넣어 봐도 똑같이 첫 탭이 왔다). 그래서 엉뚱한 파트를 읽고도
   아무 말이 없었다. gid=번호 로는 제대로 골라진다.

   번호는 시트만 아는 값이라 여기서 알려 준다. 탭이 새로 생기지 않는 한 바뀌지 않아
   6시간 담아 둔다. */
var PART_TAB_CACHE_SECONDS = 21600;

function partTabs_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get('partTabs');
  if (hit) {
    try { return { ok: true, tabs: JSON.parse(hit), cached: true }; } catch (ignore) { /* 깨졌으면 다시 읽는다 */ }
  }

  var book = SpreadsheetApp.openById(SHEET_ID);
  var out = [];
  PART_SHEETS.forEach(function (name) {
    var sheet = book.getSheetByName(name);
    if (sheet) out.push({ name: name, gid: String(sheet.getSheetId()) });
  });

  try { cache.put('partTabs', JSON.stringify(out), PART_TAB_CACHE_SECONDS); } catch (ignore) { /* 거들기다 */ }
  return { ok: true, tabs: out };
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
  { key: 'lead', types: ['lead', 'offsite_conversion.fb_pixel_lead', 'onsite_conversion.lead_grouped'] },
  /* 커스텀 이벤트 (맞춤 이벤트). 광고세트가 promoted_object 의 custom_event_str 로
     최적화하는 캠페인들이 여기 걸린다 — lead_Alarm 계열이 그렇다. 이걸 안 세면
     그 캠페인은 리드가 0 으로 잡히고 결과가 구매+장바구니 합으로만 남는다.

     **메타 화면의 '결과' 와 딱 맞지는 않는다.** API 가 낱개로 주는 것은 계정에
     '맞춤 전환' 을 만들어 둔 것뿐이고(지금은 mini_restock_event 하나), 나머지는
     offsite_conversion.fb_pixel_custom 하나에 **그 줄의 커스텀 이벤트가 다 합쳐** 온다.
     이벤트마다 맞춤 전환을 만들어 두면 offsite_conversion.custom.<번호> 로 낱개가 와
     그때 정확히 맞출 수 있다. */
  { key: 'custom', types: ['offsite_conversion.fb_pixel_custom'] }
];

/* 결과는 **그 줄이 최적화하는 전환 하나**만 센다.
   구매 목표면 구매, 맞춤 이벤트 목표면 커스텀 — 장바구니 · 가입은 더하지 않는다.
   더해 두면 목표가 다른 줄끼리 CPA 를 견줄 수가 없다 (구매 캠페인은 장바구니가 얹혀
   싸 보이고, 알람 신청 캠페인은 구매가 0 이라 비싸 보인다).

   무엇으로 최적화하는지는 **광고세트**의 promoted_object 에 적혀 있다.
   custom_event_type 이 OTHER 면 맞춤 이벤트이고 그 이름은 custom_event_str 에 있다
   (lead_Alarm 계열이 그렇다). 캠페인 · 소재에는 그 칸이 없어 광고세트에서 물려받는다. */
var META_GOAL_SLOT = {
  PURCHASE: 'purchase',
  ADD_TO_CART: 'addToCart',
  LEAD: 'lead',
  COMPLETE_REGISTRATION: 'lead',
  OTHER: 'custom'
};

/* 못 읽으면 **구매**로 본다. 전환 목표가 아닌 줄(트래픽 · 도달 · 참여)도 여기로 온다 —
   그런 줄은 구매가 대개 0 이라 결과도 0 이 되는데, 그게 맞다. 결과는 목표를 센 값이고
   트래픽 캠페인의 목표는 클릭이지 전환이 아니다. */
function metaSlotOf_(promoted) {
  var type = String(((promoted || {}).custom_event_type) || '');
  return META_GOAL_SLOT[type] || 'purchase';
}

// 목표에 맞는 전환 하나를 결과로 다시 적는다
function metaPick_(entry, slot) {
  entry.slot = slot || entry.slot || 'purchase';
  entry.results = Number(entry[entry.slot] || 0);
  return entry;
}

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
    if (payload.action === 'metaCampaigns') return metaCampaigns_(payload);
    if (payload.action === 'metaMake') return metaMake_(payload);
    if (payload.action === 'metaAd') return metaAd_(payload);
    if (payload.action === 'metaVideoStart') return metaVideoStart_(payload);
    if (payload.action === 'metaVideoChunk') return metaVideoChunk_(payload);
    if (payload.action === 'metaVideoFinish') return metaVideoFinish_(payload);
    if (payload.action === 'metaVideoReady') return metaVideoReady_(payload);
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
    if (payload.action === 'kakaoTree') return kakaoTree_(payload);
    if (payload.action === 'kakaoSpec') return kakaoSpec_(payload);
    if (payload.action === 'kakaoDefaults') return kakaoDefaults_(payload);
    if (payload.action === 'kakaoMake') return kakaoMake_(payload);
    if (payload.action === 'kakaoCreative') return kakaoCreative_(payload);
    // 네이버 GFA 는 공개 API 가 없어 PC 의 스크래퍼가 적재하고, 화면은 그 시트를 읽는다.
    if (payload.action === 'naverAccounts') return { ok: true, accounts: naverAccounts_() };
    if (payload.action === 'naverReport') return naverReport_(payload);
    if (payload.action === 'naverCreatives') return naverCreatives_(payload);
    if (payload.action === 'naverAppend') return naverAppend_(payload);
    // 네이버 검색광고(브랜드검색) — GFA 와 달리 공개 API 가 있어 여기서 바로 부른다
    if (payload.action === 'naverSaAccounts') return { ok: true, accounts: naverSaAccounts_() };
    if (payload.action === 'naverSaReport') return naverSaReport_(payload);
    if (payload.action === 'naverSaCreatives') return naverSaCreatives_(payload);
    if (payload.action === 'naverSaCostGet') return naverSaCostGet_();
    if (payload.action === 'naverSaCostPut') return naverSaCostPut_(payload);
    if (payload.action === 'saPeek') return saPeek_(payload);
    if (payload.action === 'budgetFixedSpend') return budgetFixedSpend_(payload);
    // 페이지 결과 (Microsoft Clarity)
    if (payload.action === 'clarityReport') return clarityReport_(payload);
    if (payload.action === 'clarityPages') return clarityPages_(payload);
    if (payload.action === 'clarityPage') return clarityPage_(payload);
    if (payload.action === 'budgetGet') return budgetGet_(payload);
    if (payload.action === 'budgetTrend') return budgetTrend_(payload);
    if (payload.action === 'trendChannelPut') return trendChannelPut_(payload);
    if (payload.action === 'budgetPut') return budgetPut_(payload);
    if (payload.action === 'budgetDrop') return budgetDrop_(payload);
    if (payload.action === 'promoCalendar') return promoCalendar_(payload);
    if (payload.action === 'kolGet') return kolGet_();
    if (payload.action === 'kolPut') return kolPut_(payload);
    if (payload.action === 'kolDrop') return kolDrop_(payload);
    if (payload.action === 'weeksGet') return weeksGet_();
    if (payload.action === 'weeksPut') return weeksPut_(payload);
    if (payload.action === 'scheduleGet') return schedGet_();
    if (payload.action === 'schedulePut') return schedPut_(payload);
    if (payload.action === 'phaseGet') return phaseGet_();
    if (payload.action === 'phasePut') return phasePut_(payload);
    if (payload.action === 'weeklyGet') return weeklyGet_();
    if (payload.action === 'weeklyPut') return weeklyPut_(payload);
    if (payload.action === 'weeklyDrop') return weeklyDrop_(payload);
    if (payload.action === 'weeklyPartDrop') return weeklyPartDrop_(payload);
    if (payload.action === 'imageSave') return imageSave_(payload);
    if (payload.action === 'imageGet') return imageGet_(payload);
    if (payload.action === 'noteGet') return noteGet_();
    if (payload.action === 'notePut') return notePut_(payload);
    if (payload.action === 'utmWaitGet') return utmWaitGet_();
    if (payload.action === 'utmWaitPut') return utmWaitPut_(payload);
    if (payload.action === 'supplyGet') return supplyGet_();
    if (payload.action === 'supplyPut') return supplyPut_(payload);
    if (payload.action === 'configList') return configList_();
    if (payload.action === 'configAdd') return configAdd_(payload);
    if (payload.action === 'tndAppend') return tndAppend_(payload);
    if (payload.action === 'tndTop') return tndTop_(payload);
    if (payload.action === 'tndFilenames') return tndFilenames_(payload);
    if (payload.action === 'filenameRecent') return filenameRecent_(payload);
    if (payload.action === 'filenameSeq') return filenameSeq_();
    if (payload.action === 'partTabs') return partTabs_();
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

/* 켜져 있는 캠페인 목록 (메타 광고 세팅의 캠페인명 고르개가 쓴다) ──────────
   캠페인명을 손으로 적다 보면 이미 도는 캠페인과 한 글자가 달라 같은 캠페인이 하나 더 생긴다.
   그래서 계정에서 **지금 켜져 있는** 캠페인 이름을 그대로 가져와 고르게 한다.
   담아 두는 까닭: 목록은 자주 바뀌지 않는데 Apps Script 는 팀이 실행 줄 하나를 같이 쓴다.
   방금 만든 캠페인이 안 보이면 화면의 [다시 읽기] 가 refresh 로 담아 둔 것을 버린다. */
var META_CAMPAIGN_CACHE_SECONDS = 300;

function metaCampaigns_(payload) {
  var account = String(payload.account || '').trim();
  if (!account) throw new Error('광고 계정을 고르지 않았습니다.');
  if (account.indexOf('act_') !== 0) account = 'act_' + account;

  var cache = CacheService.getScriptCache();
  var key = 'metaCampaigns:' + account;
  if (!payload.refresh) {
    var hit = cache.get(key);
    if (hit) {
      try { return { ok: true, campaigns: JSON.parse(hit), cached: true }; } catch (ignore) { /* 담아 둔 값이 깨졌으면 다시 읽는다 */ }
    }
  }

  // status 가 ACTIVE 여도 캠페인 기간이 지났거나 계정이 막히면 돌지 않는다.
  // 그래서 status 가 아니라 effective_status(실제 상태)로 거른다.
  var rows = graphAll_('/' + account + '/campaigns', {
    fields: 'name,objective,status,effective_status,updated_time',
    effective_status: JSON.stringify(['ACTIVE']),
    limit: 200
  }, 5);

  var out = [];
  rows.forEach(function (row) {
    var name = String(row.name || '').trim();
    if (!name) return;
    out.push({
      id: row.id,
      name: name,
      objective: row.objective || '',
      updated: row.updated_time || ''
    });
  });

  // 최근에 손댄 것이 위로 온다 (대개 지금 쓰는 캠페인이다)
  out.sort(function (a, b) { return String(b.updated).localeCompare(String(a.updated)); });

  // 담아 두다 실패해도(캐시 한 칸은 100KB) 목록은 그대로 준다
  try { cache.put(key, JSON.stringify(out), META_CAMPAIGN_CACHE_SECONDS); } catch (ignore) { /* 너무 길면 담지 않는다 */ }
  return { ok: true, campaigns: out };
}

/* ── 메타 광고 만들기 ─────────────────────────────────────────────
   예전에는 화면이 PowerShell(.ps1) 을 만들어 주고 사람이 내려받아 돌렸다. 브라우저가
   NAS 를 마운트하지 못하고 토큰을 맡길 곳도 없어서였다. 이제 소재는 사람이 화면에
   끌어다 놓고(브라우저가 base64 로 실어 보낸다), 메타 API 는 여기서 부른다.
   카카오 광고 세팅과 같은 길이다 — 토큰은 스크립트 속성에만 있다.

   .ps1 이 하던 일을 그대로 옮겼다:
     metaMake_  캠페인 · 광고세트 조회/생성 (Step 5-0 · 5)
     metaAd_    소재 업로드 → 크리에이티브 → 광고 (Step 4 · 6)
   만든 것은 모두 **PAUSED** 다. Ads Manager 에서 보고 사람이 켠다.                  */

// 화면이 보낸 값이 이 목록에 있어야 받는다. 엉뚱한 값을 그대로 넘기면
// 메타가 알아듣기 어려운 오류를 돌려주고, 무엇이 틀렸는지 화면에서 알 수 없다.
var META_OBJECTIVES = ['OUTCOME_SALES', 'OUTCOME_TRAFFIC', 'OUTCOME_AWARENESS',
  'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS'];
var META_OPT_GOALS = ['OFFSITE_CONVERSIONS', 'LINK_CLICKS', 'REACH', 'IMPRESSIONS',
  'LANDING_PAGE_VIEWS', 'POST_ENGAGEMENT'];
var META_BILL_EVENTS = ['IMPRESSIONS', 'LINK_CLICKS', 'POST_ENGAGEMENT'];
var META_CTAS = ['SHOP_NOW', 'APPLY_NOW', 'LEARN_MORE', 'SIGN_UP', 'GET_OFFER',
  'ORDER_NOW', 'SUBSCRIBE', 'CONTACT_US'];

// 게시 주체(페이지 · 인스타 계정). 스크립트 속성에 적어 두면 그것을 쓰고,
// 없으면 그 계정이 이미 쓰고 있는 크리에이티브에서 찾아 온다 — 손으로 적을 것을 줄인다.
var META_IG_FALLBACK = '17841446818074113';   // @minix_official
var META_STORY_CACHE_SECONDS = 21600;         // 6시간

function metaOneOf_(value, list, what) {
  var picked = String(value || '').trim().toUpperCase();
  if (list.indexOf(picked) < 0) {
    throw new Error(what + ' 값이 올바르지 않습니다: ' + (value || '(비어 있음)'));
  }
  return picked;
}

function metaAccountId_(value) {
  var account = String(value || '').trim();
  if (!account) throw new Error('광고 계정을 고르지 않았습니다.');
  return account.indexOf('act_') === 0 ? account : 'act_' + account;
}

/* 'YYYY-MM-DDTHH:mm' 을 유닉스 초로. 광고 계정 시간대(한국)로 읽는다.
   읽지 못하면 **0 을 준다** (비어 있는 것과 같게 본다). 예전에는 던졌는데,
   그러면 날짜 하나 때문에 만들기가 통째로 멈춘다 — 종료일시는 없어도 되는 값이다.
   시작일시는 부르는 쪽에서 0 인지 따로 본다. */
function metaTime_(value) {
  var text = String(value || '').trim();
  if (!text) return 0;
  var found = text.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!found) return 0;
  var when = new Date(found[1] + '-' + found[2] + '-' + found[3]
    + 'T' + found[4] + ':' + found[5] + ':00+09:00');
  var stamp = when.getTime();
  if (!stamp || isNaN(stamp)) return 0;
  return Math.floor(stamp / 1000);
}

// 폼(application/x-www-form-urlencoded)으로 보낸다. 빈 칸은 아예 보내지 않는다.
// 값은 **글자로 굳혀서** 보낸다. 숫자가 아닌 숫자(NaN · Infinity)가 섞이면
// 메타는 'Must be a unixtime…' 같은 말을 돌려주는데, 그것만 봐서는 어느 값이
// 어쩌다 그렇게 됐는지 알 수 없다. 그런 값은 여기서 아예 빼 버린다.
function graphPost_(path, params) {
  var payload = { access_token: metaToken_() };
  Object.keys(params || {}).forEach(function (key) {
    var value = params[key];
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'number' && !isFinite(value)) return;
    var text = String(value);
    if (text === 'NaN' || text === 'Infinity' || text === '-Infinity' || text === 'undefined') return;
    payload[key] = text;
  });
  var response = UrlFetchApp.fetch(GRAPH_URL + path, {
    method: 'post', payload: payload, muteHttpExceptions: true
  });
  return metaAnswer_(response, 'POST ' + path);
}

function metaAnswer_(response, where) {
  var text = response.getContentText() || '';
  var body = {};
  try { body = JSON.parse(text || '{}'); } catch (error) { body = {}; }
  var code = response.getResponseCode();
  if (body.error) {
    var reason = body.error.error_user_msg || body.error.message || JSON.stringify(body.error);
    // 토큰에 만들기 권한이 없을 때가 가장 흔하다. 무엇을 하면 되는지 함께 적는다.
    if (/permission|ads_management|OAuth/i.test(reason)) {
      reason += ' — 광고를 만들려면 토큰에 ads_management 권한이 있어야 합니다 '
        + '(지금 토큰은 읽기만 되는 것일 수 있습니다).';
    }
    throw new Error('메타 API ' + where + ': ' + reason);
  }
  if (code >= 400) throw new Error('메타 API ' + where + ' (HTTP ' + code + '): ' + text.slice(0, 300));
  return body;
}

/* 게시 주체를 찾는다.
   스크립트 속성 META_PAGE_ID · META_IG_USER_ID 가 있으면 그것을 쓴다.
   없으면 계정이 이미 만들어 둔 크리에이티브에서 page_id · instagram_user_id 를 꺼낸다 —
   지금 쓰고 있는 페이지라 가장 틀릴 일이 없다. */
function metaStory_(account) {
  var store = PropertiesService.getScriptProperties();
  var page = cleanToken_(store.getProperty('META_PAGE_ID'));
  var insta = cleanToken_(store.getProperty('META_IG_USER_ID'));
  if (page) return { pageId: page, igId: insta || META_IG_FALLBACK, from: '스크립트 속성' };

  var cache = CacheService.getScriptCache();
  var key = 'metaStory:' + account;
  var hit = cache.get(key);
  if (hit) {
    try {
      var kept = JSON.parse(hit);
      if (kept && kept.pageId) return kept;
    } catch (ignore) { /* 깨졌으면 다시 찾는다 */ }
  }

  var found = { pageId: '', igId: insta || META_IG_FALLBACK, from: '' };

  /* ① 토큰 자신에게 물어본다.
     지금 쓰는 토큰은 **페이지 토큰**이다 — 그러면 토큰이 곧 그 페이지의 것이라
     따로 적어 둘 필요가 없다. debug_token 이 type: PAGE · profile_id 로 알려 준다.
     사용자 토큰이면 type 이 USER 라 여기서 걸러지고 아래로 내려간다. */
  try {
    var token = metaToken_();
    var body = graph_('/debug_token', { input_token: token });
    var info = body.data || {};
    if (String(info.type || '') === 'PAGE' && info.profile_id) {
      found.pageId = String(info.profile_id);
      found.from = '토큰(페이지 토큰)';
    }
  } catch (error) { /* 못 물어보면 아래 길로 간다 */ }

  // ② 계정이 이미 만들어 둔 크리에이티브에서 꺼낸다 (사용자 토큰일 때의 길)
  if (!found.pageId) {
    try {
      var rows = graphAll_('/' + account + '/adcreatives',
        { fields: 'object_story_spec{page_id,instagram_user_id}', limit: 25 }, 1);
      for (var i = 0; i < rows.length && !found.pageId; i += 1) {
        var spec = (rows[i] || {}).object_story_spec || {};
        if (spec.page_id) { found.pageId = String(spec.page_id); found.from = '계정의 기존 소재'; }
        if (!insta && spec.instagram_user_id) found.igId = String(spec.instagram_user_id);
      }
    } catch (error) { /* 못 읽으면 아래에서 알려 준다 */ }
  }

  if (!found.pageId) {
    throw new Error('광고를 게시할 페이지(page_id)를 찾지 못했습니다. '
      + 'Apps Script 편집기 → 프로젝트 설정 → 스크립트 속성에 META_PAGE_ID 를 넣어 주세요 '
      + '(공유 폴더 .env 의 META_PAGE_ID 와 같은 값입니다).');
  }
  try { cache.put(key, JSON.stringify(found), META_STORY_CACHE_SECONDS); } catch (ignore) { /* 거들기다 */ }
  return found;
}

/* 캠페인 · 광고세트를 찾거나 만든다.
   **이름이 같으면 이미 있는 것을 쓴다** — 두 번 눌러도 캠페인이 겹치지 않게.
   새 광고세트는 같은 캠페인의 기존 광고세트에서 promoted_object(픽셀 · 전환 이벤트)와
   최적화 · 과금 기준을 물려받는다. 물려받을 것이 없으면 계정의 픽셀을 찾아 붙인다. */
function metaMake_(payload) {
  var account = metaAccountId_(payload.account);
  var campaignName = String(payload.campaignName || '').trim();
  var adsetName = String(payload.adsetName || '').trim();
  if (!campaignName) throw new Error('캠페인명이 비어 있습니다.');
  if (!adsetName) throw new Error('광고그룹명이 비어 있습니다.');

  var objective = metaOneOf_(payload.objective, META_OBJECTIVES, '캠페인 목적');
  var optGoal = metaOneOf_(payload.optGoal, META_OPT_GOALS, '최적화 기준');
  var billEvent = metaOneOf_(payload.billEvent, META_BILL_EVENTS, '과금 기준');
  var budgetType = String(payload.budgetType || 'daily') === 'lifetime' ? 'lifetime' : 'daily';
  var budget = Math.round(Number(payload.budget) || 0);
  if (budget <= 0) throw new Error('예산이 0원입니다.');

  var start = metaTime_(payload.startAt);
  if (!(start > 0)) throw new Error('시작일시를 읽지 못했습니다: ' + JSON.stringify(String(payload.startAt || '')));
  var end = metaTime_(payload.endAt);
  // 적어 두었는데 못 읽었으면 조용히 버리지 않는다 — 무엇이 들어왔는지 그대로 알려 준다
  if (String(payload.endAt === undefined || payload.endAt === null ? '' : payload.endAt).trim() && !(end > 0)) {
    throw new Error('종료일시를 읽지 못했습니다: ' + JSON.stringify(String(payload.endAt)));
  }
  if (budgetType === 'lifetime' && !(end > 0)) throw new Error('총예산을 쓰려면 종료일시가 있어야 합니다.');
  if (end > 0 && end <= start) throw new Error('종료일시가 시작일시보다 빠르거나 같습니다.');

  var log = [];

  // ① 캠페인 — 이름이 같은 것이 있으면 그것을 쓴다
  var campaignId = '';
  try {
    var already = graphAll_('/' + account + '/campaigns', { fields: 'id,name', limit: 200 }, 3);
    for (var i = 0; i < already.length && !campaignId; i += 1) {
      if (String(already[i].name || '') === campaignName) campaignId = String(already[i].id);
    }
  } catch (error) { /* 못 읽으면 새로 만든다 */ }

  if (campaignId) {
    log.push('캠페인은 이미 있는 것을 씁니다 (' + campaignId + ')');
  } else {
    var made = graphPost_('/' + account + '/campaigns', {
      name: campaignName, objective: objective, status: 'PAUSED',
      special_ad_categories: JSON.stringify([]),
      is_adset_budget_sharing_enabled: 'false'
    });
    campaignId = String(made.id || '');
    if (!campaignId) throw new Error('캠페인을 만들었는데 번호를 못 받았습니다.');
    log.push('캠페인을 만들었습니다 (' + campaignId + ' · ' + objective + ')');
  }

  // ② 광고세트 — 이름이 같은 것이 있으면 그것을 쓴다
  var adsetId = '';
  try {
    var groups = graphAll_('/' + campaignId + '/adsets', { fields: 'id,name', limit: 200 }, 3);
    for (var k = 0; k < groups.length && !adsetId; k += 1) {
      if (String(groups[k].name || '') === adsetName) adsetId = String(groups[k].id);
    }
  } catch (error) { /* 못 읽으면 새로 만든다 */ }

  if (adsetId) {
    log.push('광고세트는 이미 있는 것을 씁니다 (' + adsetId + ')');
  } else {
    var promoted = '';
    try {
      var sample = graphAll_('/' + campaignId + '/adsets',
        { fields: 'promoted_object,optimization_goal,billing_event', limit: 1 }, 1);
      if (sample.length) {
        if (sample[0].promoted_object) promoted = JSON.stringify(sample[0].promoted_object);
        if (sample[0].optimization_goal) optGoal = sample[0].optimization_goal;
        if (sample[0].billing_event) billEvent = sample[0].billing_event;
        log.push('기존 광고세트 설정을 물려받았습니다 (최적화 ' + optGoal
          + ' · 픽셀 ' + (promoted ? '있음' : '없음') + ')');
      }
    } catch (error) { /* 물려받을 것이 없으면 아래에서 픽셀을 찾는다 */ }

    if (!promoted && optGoal === 'OFFSITE_CONVERSIONS') {
      try {
        var pixels = graphAll_('/' + account + '/adspixels', { fields: 'id', limit: 1 }, 1);
        if (pixels.length && pixels[0].id) {
          promoted = JSON.stringify({ pixel_id: String(pixels[0].id), custom_event_type: 'PURCHASE' });
          log.push('픽셀을 붙였습니다 (' + pixels[0].id + ' · PURCHASE)');
        }
      } catch (error) { /* 픽셀이 없으면 그대로 만든다 */ }
    }

    var targeting = {
      geo_locations: { countries: ['KR'] },
      age_min: Math.max(Number(payload.ageMin) || 0, 13),
      age_max: Math.min(Number(payload.ageMax) || 65, 65),
      targeting_automation: { advantage_audience: 0 }
    };
    var gender = String(payload.gender || '전체');
    if (gender === '여성') targeting.genders = [2];
    else if (gender === '남성') targeting.genders = [1];

    var params = {
      name: adsetName, campaign_id: campaignId,
      optimization_goal: optGoal, billing_event: billEvent,
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      targeting: JSON.stringify(targeting), status: 'PAUSED',
      promoted_object: promoted
    };
    // 시각은 **0보다 큰 수일 때만** 넣는다. 숫자가 아닌 값이 새어 나가지 않게
    // 글자로 굳혀서 넣는다 (메타는 유닉스 초를 받는다).
    if (start > 0) params.start_time = String(start);
    if (end > 0) params.end_time = String(end);
    params[budgetType === 'lifetime' ? 'lifetime_budget' : 'daily_budget'] = budget;

    var group;
    try {
      group = graphPost_('/' + account + '/adsets', params);
    } catch (error) {
      // 메타가 어느 값을 물고 늘어지는지 알 수 있게, 보낸 시각을 함께 적어 준다.
      throw new Error(String((error && error.message) || error)
        + ' [보낸 값 — 시작 ' + (params.start_time || '(없음)')
        + ' · 종료 ' + (params.end_time || '(없음)')
        + ' · 받은 값 ' + JSON.stringify(String(payload.startAt || '')) + ' ~ '
        + JSON.stringify(String(payload.endAt || '')) + ']');
    }
    adsetId = String(group.id || '');
    if (!adsetId) throw new Error('광고세트를 만들었는데 번호를 못 받았습니다.');
    log.push('광고세트를 만들었습니다 (' + adsetId + ' · '
      + (budgetType === 'lifetime' ? '총예산 ' : '일예산 ') + budget + '원)');
  }

  // ③ 이미 있는 광고 이름 — 같은 이름으로 두 번 만들지 않게 화면에 알려 준다
  var names = [];
  try {
    graphAll_('/' + adsetId + '/ads', { fields: 'name', limit: 200 }, 3).forEach(function (one) {
      if (one && one.name) names.push(String(one.name));
    });
    if (names.length) log.push('광고세트에 이미 있는 광고 ' + names.length + '건은 건너뜁니다');
  } catch (error) { /* 못 읽으면 그냥 만든다 */ }

  var story = metaStory_(account);
  log.push('게시 주체: 페이지 ' + story.pageId
    + (story.igId ? ' · 인스타 ' + story.igId : '') + ' (' + story.from + ')');

  return { ok: true, source: 'meta', account: account,
    campaign: campaignId, adset: adsetId, adNames: names,
    page: story.pageId, instagram: story.igId, log: log };
}

// 그림 한 장을 올려 해시를 받는다. 해시는 크리에이티브가 소재를 가리키는 번호다.
function metaUpload_(account, fileName, base64) {
  var name = String(fileName || 'creative.jpg');
  var mime = /\.png$/i.test(name) ? 'image/png' : 'image/jpeg';
  var blob = Utilities.newBlob(Utilities.base64Decode(String(base64 || '')), mime, name);
  var response = UrlFetchApp.fetch(GRAPH_URL + '/' + account + '/adimages', {
    method: 'post',
    payload: { access_token: metaToken_(), filename: blob },
    muteHttpExceptions: true
  });
  var body = metaAnswer_(response, 'POST /adimages (' + name + ')');
  var images = body.images || {};
  var keys = Object.keys(images);
  if (!keys.length || !images[keys[0]].hash) {
    throw new Error('소재를 올렸는데 해시를 못 받았습니다: ' + name);
  }
  return images[keys[0]].hash;
}

/* ── 영상 올리기 (쪼개서 보낸다) ──────────────────────────────────
   그림은 한 번에 올리면 되지만 영상은 수십~수백 MB다. Apps Script 는 한 번에 6분 · 50MB 가
   끝이라 통째로는 못 넘긴다. 그래서 메타가 마련해 둔 **나눠 올리기**를 쓴다.

     start     크기를 알려 주고 자리(세션)를 받는다 → video_id 도 이때 나온다
     transfer  브라우저가 4MB씩 잘라 보내면 그 조각을 그대로 메타에 넘긴다 (요청 하나에 조각 하나)
     finish    다 보냈다고 알린다

   조각마다 요청이 따로라 6분 제한에 걸리지 않는다. 올린 뒤에도 메타가 인코딩하는 동안은
   쓸 수 없어서, 다 됐는지(video_status) 화면이 몇 초씩 물어본다.                      */

function metaVideoStart_(payload) {
  var account = metaAccountId_(payload.account);
  var size = Math.round(Number(payload.fileSize) || 0);
  if (size <= 0) throw new Error('영상 크기를 알 수 없습니다.');
  var body = graphPost_('/' + account + '/advideos', {
    upload_phase: 'start', file_size: size
  });
  if (!body.upload_session_id || !body.video_id) {
    throw new Error('영상 올릴 자리를 받지 못했습니다: ' + JSON.stringify(body).slice(0, 200));
  }
  return { ok: true, source: 'meta', session: String(body.upload_session_id),
    video: String(body.video_id), start: Number(body.start_offset || 0),
    end: Number(body.end_offset || 0) };
}

function metaVideoChunk_(payload) {
  var account = metaAccountId_(payload.account);
  var session = String(payload.session || '').trim();
  var offset = String(payload.offset === undefined ? '' : payload.offset).trim();
  if (!session) throw new Error('영상 올리는 자리(세션)가 없습니다.');
  if (offset === '') throw new Error('보낼 자리(offset)가 없습니다.');
  if (!payload.chunk) throw new Error('영상 조각이 실려 오지 않았습니다.');

  var blob = Utilities.newBlob(Utilities.base64Decode(String(payload.chunk)),
    'application/octet-stream', String(payload.fileName || 'video.mp4'));
  var response = UrlFetchApp.fetch(GRAPH_URL + '/' + account + '/advideos', {
    method: 'post',
    payload: {
      access_token: metaToken_(), upload_phase: 'transfer',
      upload_session_id: session, start_offset: offset, video_file_chunk: blob
    },
    muteHttpExceptions: true
  });
  var body = metaAnswer_(response, 'POST /advideos (transfer ' + offset + ')');
  return { ok: true, source: 'meta',
    start: Number(body.start_offset || 0), end: Number(body.end_offset || 0) };
}

function metaVideoFinish_(payload) {
  var account = metaAccountId_(payload.account);
  var session = String(payload.session || '').trim();
  if (!session) throw new Error('영상 올리는 자리(세션)가 없습니다.');
  graphPost_('/' + account + '/advideos', {
    upload_phase: 'finish', upload_session_id: session,
    title: String(payload.title || '')
  });
  return { ok: true, source: 'meta', session: session };
}

/* 인코딩이 끝났는지 · 표지(썸네일)가 나왔는지 본다.
   표지를 따로 주지 않으면 메타가 뽑아 준 것을 쓴다 — 그것도 인코딩이 끝나야 나온다. */
function metaVideoReady_(payload) {
  var video = String(payload.video || '').replace(/[^0-9]/g, '');
  if (!video) throw new Error('영상 번호가 없습니다.');
  var body = graph_('/' + video, { fields: 'status,thumbnails{uri,is_preferred}' });
  var status = String(((body.status || {}).video_status) || '');
  var thumb = '';
  var list = ((body.thumbnails || {}).data) || [];
  for (var i = 0; i < list.length && !thumb; i += 1) {
    if (list[i] && list[i].is_preferred && list[i].uri) thumb = String(list[i].uri);
  }
  if (!thumb && list.length && list[0].uri) thumb = String(list[0].uri);
  if (status === 'error') {
    throw new Error('메타가 영상을 처리하지 못했습니다 (형식 · 길이를 확인해 주세요).');
  }
  return { ok: true, source: 'meta', video: video,
    ready: status === 'ready', status: status, thumb: thumb };
}

/* 소재 하나로 크리에이티브와 광고를 만든다 (둘 다 PAUSED).
   세로 소재를 함께 보내면 asset_feed_spec 으로 묶어 **피드는 기본 소재 · 스토리와 릴스는
   세로 소재**가 나가게 한다 — .ps1 이 하던 것과 같은 규칙이다. */
function metaAd_(payload) {
  var account = metaAccountId_(payload.account);
  var adsetId = String(payload.adset || '').replace(/[^0-9]/g, '');
  var name = String(payload.name || '').trim();
  var landing = String(payload.landing || '').trim();
  if (!adsetId) throw new Error('광고세트 번호가 없습니다.');
  if (!name) throw new Error('광고명이 비어 있습니다.');
  if (!landing) throw new Error('랜딩 URL 이 없습니다: ' + name);
  var videoId = String(payload.video || '').replace(/[^0-9]/g, '');
  if (!payload.image && !videoId) throw new Error('소재가 실려 오지 않았습니다: ' + name);

  var cta = metaOneOf_(payload.cta || 'LEARN_MORE', META_CTAS, '행동 유도 버튼');
  var headline = String(payload.headline || '');
  var body = String(payload.body || '');
  var story = metaStory_(account);

  // 이미 같은 이름의 광고가 있으면 그것을 그대로 돌려준다.
  // 되묻기(구글이 답을 흘렸을 때)로 같은 요청이 두 번 와도 광고가 둘이 되지 않게 하는 자리다.
  try {
    var made = graphAll_('/' + adsetId + '/ads', { fields: 'id,name', limit: 200 }, 3);
    for (var i = 0; i < made.length; i += 1) {
      if (String(made[i].name || '') === name) {
        return { ok: true, source: 'meta', name: name, ad: String(made[i].id),
          creative: '', vertical: false, skipped: true };
      }
    }
  } catch (error) { /* 못 읽으면 그냥 만든다 */ }

  // 영상이면 payload.image 는 소재가 아니라 **표지**다 (같은 이름의 jpg 를 끌어다 놓았을 때)
  var hash = payload.image ? metaUpload_(account, payload.fileName, payload.image) : '';
  var vertical = (!videoId && payload.story)
    ? metaUpload_(account, payload.storyFileName, payload.story) : '';

  var spec = { page_id: story.pageId };
  if (story.igId) spec.instagram_user_id = story.igId;

  var params = { name: name };
  if (videoId) {
    /* 영상 광고. 그림과 칸 이름이 다르다 —
       랜딩 URL 이 link 가 아니라 call_to_action.value.link 에 들어가고, 표지가 반드시 필요하다.
       끌어다 놓은 표지가 있으면 그 해시를, 없으면 메타가 뽑아 준 표지 주소를 쓴다. */
    var data = {
      video_id: videoId, message: body, title: headline,
      call_to_action: { type: cta, value: { link: landing } }
    };
    if (hash) data.image_hash = hash;
    else if (payload.thumbUrl) data.image_url = String(payload.thumbUrl);
    else throw new Error('영상 표지를 찾지 못했습니다: ' + name
      + ' (같은 이름의 jpg 를 함께 끌어다 놓으면 그것을 표지로 씁니다)');
    spec.video_data = data;
  } else if (vertical) {
    // 게재위치마다 다른 소재를 쓴다. 이름표(img_feed · img_story)로 짝지어 준다.
    params.asset_feed_spec = JSON.stringify({
      ad_formats: ['SINGLE_IMAGE'],
      images: [
        { hash: hash, adlabels: [{ name: 'img_feed' }] },
        { hash: vertical, adlabels: [{ name: 'img_story' }] }
      ],
      bodies: [{ text: body }],
      titles: [{ text: headline }],
      link_urls: [{ website_url: landing }],
      call_to_action_types: [cta],
      asset_customization_rules: [
        { customization_spec: { publisher_platforms: ['facebook', 'instagram'],
          facebook_positions: ['feed'], instagram_positions: ['stream'] },
          image_label: { name: 'img_feed' } },
        { customization_spec: { publisher_platforms: ['facebook', 'instagram'],
          facebook_positions: ['story', 'facebook_reels'], instagram_positions: ['story', 'reels'] },
          image_label: { name: 'img_story' } }
      ]
    });
  } else {
    spec.link_data = { link: landing, message: body, name: headline,
      image_hash: hash, call_to_action: { type: cta } };
  }
  params.object_story_spec = JSON.stringify(spec);

  var creative = graphPost_('/' + account + '/adcreatives', params);
  var creativeId = String(creative.id || '');
  if (!creativeId) throw new Error('크리에이티브를 만들었는데 번호를 못 받았습니다: ' + name);

  var ad = graphPost_('/' + account + '/ads', {
    name: name, adset_id: adsetId,
    creative: JSON.stringify({ creative_id: creativeId }), status: 'PAUSED'
  });
  var adId = String(ad.id || '');
  if (!adId) throw new Error('광고를 만들었는데 번호를 못 받았습니다: ' + name);

  return { ok: true, source: 'meta', name: name, creative: creativeId, ad: adId,
    vertical: !!vertical, video: videoId };
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
    { fields: 'id,name,campaign_id,effective_status,daily_budget,lifetime_budget,optimization_goal,'
      + 'promoted_object,start_time,end_time', effective_status: '["ACTIVE"]', limit: 300 }, 5);

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
    metaPick_(entry, metaSlotOf_(row.promoted_object));   // 결과를 목표 전환 하나로
    entry.begin = metaDay_(row.start_time);
    entry.end = metaDay_(row.end_time);
    if (row.daily_budget) { entry.budget = Number(row.daily_budget); entry.budgetKind = 'daily'; }
    else if (row.lifetime_budget) { entry.budget = Number(row.lifetime_budget); entry.budgetKind = 'lifetime'; }
  });
  // 기간에는 돌았지만 지금 꺼져 있는 광고세트는 위 목록에 없다. 그 줄만 id 로 물어 채운다.
  metaFillAdsets_(adsets);

  /* 캠페인 줄의 결과는 **그 아래 광고세트 결과의 합**이다.
     캠페인 하나에 목표가 다른 광고세트가 섞여 있을 수 있어 캠페인 단위로는 하나를 못 고른다.
     광고세트를 하나도 못 받은 캠페인은 구매로 둔다 (metrics_ 이 적어 둔 값 그대로). */
  var byCampaign = {};
  Object.keys(adsets).forEach(function (id) {
    var one = adsets[id];
    if (!one.campaignId) return;
    byCampaign[one.campaignId] = (byCampaign[one.campaignId] || 0) + Number(one.results || 0);
  });
  Object.keys(campaigns).forEach(function (id) {
    if (byCampaign[id] === undefined) return;
    campaigns[id].results = byCampaign[id];
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

// 지금 꺼져 있는 광고세트의 집행 기간과 **목표 전환**을 채운다.
// 켜진 것만 목록으로 받기 때문에, 기간에 돌고 지금은 꺼진 줄은 둘 다 비어 있다.
// 돈을 쓴 줄만, 50개씩 묶어 물어본다. (한 묶음이 실패해도 나머지는 채운다)
// 여기서 못 채운 줄의 결과는 구매로 남는다 — 알 수 없는 것을 지어내지 않는다.
var META_SCHEDULE_LOOKUP = 150;

function metaFillAdsets_(adsets) {
  var need = Object.keys(adsets)
    .filter(function (id) { return !adsets[id].begin && adsets[id].spend > 0; })
    .sort(function (a, b) { return adsets[b].spend - adsets[a].spend; })
    .slice(0, META_SCHEDULE_LOOKUP);
  if (!need.length) return;

  for (var at = 0; at < need.length; at += 50) {
    var chunk = need.slice(at, at + 50);
    try {
      var body = graph_('/', { ids: chunk.join(','), fields: 'start_time,end_time,promoted_object' });
      chunk.forEach(function (id) {
        var found = body[id];
        if (!found) return;
        adsets[id].begin = metaDay_(found.start_time);
        adsets[id].end = metaDay_(found.end_time);
        metaPick_(adsets[id], metaSlotOf_(found.promoted_object));
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
  base.custom = counted.custom || catalog.custom;
  /* 결과는 목표 전환 하나다 (metaPick_). 여기서는 구매로 두고, 광고세트의 목표를
     읽은 뒤 그 줄의 전환으로 다시 적는다. 쪼개기(게재지면 · 연령 · 성별)처럼
     목표를 알 수 없는 줄은 이 값 그대로 남는다. */
  base.slot = 'purchase';
  base.results = base.purchase;
  base.revenue = purchaseValue_(row, field);
  base.attribution = window || '';

  // 어트리뷰션 기간별 결과. 계정 기본 설정을 쓰는 중이라 칸이 안 오면 null 로 둔다.
  return base;
}

// field 를 주면 그 어트리뷰션 칸(1d_click · 7d_click)을 읽는다. 없으면 value(계정 기본).
function countResults_(actions, field) {
  var out = { purchase: 0, addToCart: 0, lead: 0, custom: 0, found: false };
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
  base.custom = 0;                     // 구글은 커스텀 이벤트를 따로 주지 않는다
  /* 결과는 구매 하나만 센다 (메타와 같은 규칙 — 장바구니 · 리드는 칸으로만 남는다).
     구글은 캠페인이 무슨 전환으로 최적화하는지를 보고서에서 주지 않아 구매로 둔다. */
  base.slot = 'purchase';
  base.results = base.purchase;
  /* 전환 액션 분류가 비어 있는 계정은 구매 · 장바구니 · 리드가 다 0 으로 온다.
     그때만 전환수를 그대로 쓴다 — 구매가 0 인 것과 분류가 없는 것은 다르다. */
  if (!categories && metrics.conversions) base.results = Number(metrics.conversions);
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

  /* 소재 줄의 결과도 **그 광고세트의 목표**를 따른다 (매체별 성과와 같은 규칙).
     소재에는 promoted_object 가 없어 광고세트에 물어 물려받는다. */
  var wantSets = [];
  creatives.forEach(function (row) {
    var one = String(row.adsetId || '');
    if (one && wantSets.indexOf(one) < 0) wantSets.push(one);
  });
  var slotOf = {};
  for (var st = 0; st < wantSets.length; st += 50) {
    var pack = wantSets.slice(st, st + 50);
    try {
      var goals = graph_('/', { ids: pack.join(','), fields: 'promoted_object' });
      pack.forEach(function (one) {
        if (goals[one]) slotOf[one] = metaSlotOf_(goals[one].promoted_object);
      });
    } catch (error) { /* 이 묶음은 볼 수 없다 — 구매로 둔다 */ }
  }
  creatives.forEach(function (row) { metaPick_(row, slotOf[String(row.adsetId || '')]); });

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
  // 소재가 하나도 없는 답은 짧게만 담아 둔다. 매체가 이따금 빈 목록을 주는데,
  // 그것을 5분 담아 두면 그 사이 화면에는 '소재 없음' 만 보인다 (구글에서 그랬다).
  var keep = creatives.length ? META_CACHE_SECONDS : 30;
  cachePut_(cache, key, text, keep);
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
  // 소재가 하나도 없는 답은 짧게만 담아 둔다. 매체가 이따금 빈 목록을 주는데,
  // 그것을 5분 담아 두면 그 사이 화면에는 '소재 없음' 만 보인다 (구글에서 그랬다).
  var keep = creatives.length ? META_CACHE_SECONDS : 30;
  cachePut_(cache, key, text, keep);
  return result;
}

// ── 광고비에서 부가세 빼기 (네이버 GFA · 브랜드검색) ──────────────────────
// 네이버 GFA 의 보고서 광고비와, 사람이 적는 브랜드검색 광고비는 부가세를 포함한 금액이다.
// 화면에는 **공급가**(부가세 별도)를 쓴다 — 다른 매체가 그 기준이라 그래야 견줄 수 있다.
//
//   포함액 = 공급가 × 1.1   →   공급가 = 포함액 ÷ 1.1
//
// 10% 를 '곱해서 빼면' 90% 가 되는데 공급가는 90.909…% 다. 1% 가 어긋나므로 나눈다.
// (110,000원짜리의 공급가는 99,000원이 아니라 100,000원이다)
//
// **빼는 건 읽을 때만 한다.** 시트에는 적힌 값이 그대로 남아 매체 화면 · 계약서와
// 맞춰 볼 수 있다. 메타 · 구글 · 카카오모먼트는 손대지 않는다 — 매체가 준 값 그대로다.
var SPEND_VAT_RATE = 1.1;

function netSpend_(value) {
  return Number(value || 0) / SPEND_VAT_RATE;
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
  // 카카오모먼트는 매체가 준 값을 그대로 쓴다 (메타 · 구글과 같게)
  base.spend = Number(found.cost || 0);
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
  base.custom = 0;                     // 카카오는 커스텀 이벤트를 따로 주지 않는다
  /* 결과는 구매 하나만 센다 (메타와 같은 규칙). 카카오모먼트는 전환 목표가 'CONVERSION'
     하나뿐이라 무슨 이벤트로 최적화하는지를 알려 주지 않는다 — 구매로 둔다. */
  base.slot = 'purchase';
  base.results = base.purchase;
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

// 캠페인 · 광고그룹을 한 번에 훑어 준다 (카카오 광고 세팅의 '틀' 고르개).
// 목록 응답에는 유형 · 목표가 없어서 캠페인 단건을 한꺼번에 더 부른다 (kakaoMany_ 는 묶음 조회).
var KAKAO_TREE_CACHE_SECONDS = 1800;   // 30분. 새로 만든 캠페인은 새로고침으로 다시 읽는다.

function kakaoTree_(payload) {
  var account = String(payload.account || '').replace(/[^0-9]/g, '');
  if (!account) throw new Error('광고 계정을 고르지 않았습니다.');

  var cache = CacheService.getScriptCache();
  var key = 'kakaoTree:' + account;
  if (!payload.refresh) {
    var hit = cacheGet_(cache, key);
    if (hit) return JSON.parse(hit);
  }

  var campaigns = kakaoList_(kakao_('/campaigns', { config: 'ON,OFF' }, account, 0));

  var detailJobs = campaigns.map(function (one) {
    return { key: 'c' + one.id, path: '/campaigns/' + one.id };
  });
  var groupJobs = campaigns.map(function (one) {
    return { key: 'g' + one.id, path: '/adGroups', params: { campaignId: one.id, config: 'ON,OFF' } };
  });
  var details = kakaoMany_(detailJobs, account);
  var groups = kakaoMany_(groupJobs, account);

  var rows = campaigns.map(function (one) {
    var detail = details['c' + one.id] || {};
    var goal = detail.campaignTypeGoal || {};
    return {
      id: String(one.id),
      name: one.name || String(one.id),
      config: one.config || '',
      type: goal.campaignType || '',
      goal: goal.goal || '',
      groups: kakaoList_(groups['g' + one.id]).map(function (group) {
        return { id: String(group.id), name: group.name || String(group.id), config: group.config || '' };
      })
    };
  });

  var result = { ok: true, source: 'kakao', account: account, campaigns: rows };
  cachePut_(cache, key, JSON.stringify(result), KAKAO_TREE_CACHE_SECONDS);
  return result;
}

// 틀로 고른 캠페인 · 광고그룹의 설정을 그대로 돌려준다 (타겟팅 · 게재지면 · 입찰까지).
function kakaoSpec_(payload) {
  var account = String(payload.account || '').replace(/[^0-9]/g, '');
  var campaignId = String(payload.campaign || '').replace(/[^0-9]/g, '');
  var groupId = String(payload.group || '').replace(/[^0-9]/g, '');
  if (!account) throw new Error('광고 계정을 고르지 않았습니다.');
  if (!campaignId || !groupId) throw new Error('본뜰 캠페인과 광고그룹을 고르지 않았습니다.');

  var got = kakaoMany_([
    { key: 'campaign', path: '/campaigns/' + campaignId },
    { key: 'group', path: '/adGroups/' + groupId },
    { key: 'creatives', path: '/creatives', params: { adGroupId: groupId, config: 'ON,OFF' } }
  ], account);

  if (!got.campaign) throw new Error('캠페인 설정을 못 읽었습니다 (번호 ' + campaignId + ').');
  if (!got.group) throw new Error('광고그룹 설정을 못 읽었습니다 (번호 ' + groupId + ').');

  // 소재 하나를 같이 준다 — 프로필 이름 · 프로필 이미지 · 행동버튼처럼
  // 화면에서 일일이 적기 번거로운 값을 그대로 물려받기 위해서다.
  var sample = null;
  var made = kakaoList_(got.creatives);
  for (var i = 0; i < made.length; i += 1) {
    var one = kakaoMany_([{ key: 'one', path: '/creatives/' + made[i].id }], account).one;
    if (one) { sample = one; break; }
  }

  return { ok: true, source: 'kakao', account: account,
    campaign: got.campaign, group: got.group, sample: sample };
}

// ── 카카오 광고 만들기 ───────────────────────────────────────────
// 화면에서 [만들기] 를 누르면 여기가 캠페인 · 광고그룹 · 소재를 실제로 만든다.
// 소재 파일은 브라우저가 골라 base64 로 실어 보낸다 — 예전처럼 PowerShell 을 거치지 않는다.
// 카카오는 광고계정마다 1초에 한 번만 받아 주므로 쓰기 앞에서는 꼭 쉰다.
var KAKAO_WRITE_GAP = 1200;

function kakaoSend_(method, path, body, account) {
  kakaoWait_(KAKAO_WRITE_GAP, false);
  var response = UrlFetchApp.fetch(KAKAO_URL + path, {
    method: method,
    contentType: 'application/json; charset=utf-8',
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + kakaoToken_(), adAccountId: String(account) }
  });
  return kakaoAnswer_(response, method.toUpperCase() + ' ' + path);
}

function kakaoAnswer_(response, where) {
  var text = response.getContentText() || '';
  var body = {};
  try { body = JSON.parse(text || '{}'); } catch (error) { body = {}; }
  var code = response.getResponseCode();
  if (code >= 400) {
    var extras = body.extras || {};
    var reason = extras.detailMsg || body.msg || body.message || text.slice(0, 300);
    if (code === 401) reason += ' (비즈니스 토큰이 만료됐거나 잘못됐습니다)';
    if (code === 403) reason += ' (이 광고계정에 광고를 만들 권한이 없습니다)';
    throw new Error('카카오모먼트 (HTTP ' + code + ') ' + where + ': ' + reason);
  }
  return body;
}

// 응답은 { id: 123 } 이기도 하고 숫자 하나이기도 하다. 번호만 뽑는다.
function kakaoNewId_(body) {
  if (body === null || body === undefined) return '';
  if (typeof body === 'number' || typeof body === 'string') return String(body);
  if (body.id) return String(body.id);
  if (Array.isArray(body) && body.length && body[0].id) return String(body[0].id);
  return '';
}

// 유형 × 목표에 맞는 **가장 최근** 캠페인 · 광고그룹을 찾는다.
// 사람이 고르지 않아도 되도록, 같은 종류로 마지막에 집행한 것을 기준으로 삼는다.
// (번호가 클수록 나중에 만든 것이다 — 카카오는 만든 차례로 번호를 준다)
var KAKAO_TYPE_OF = { bizboard: 'TALK_BIZ_BOARD', display: 'DISPLAY' };

function kakaoBase_(account, kind, goal, refresh) {
  var want = KAKAO_TYPE_OF[String(kind || 'bizboard')] || 'TALK_BIZ_BOARD';
  var tree = kakaoTree_({ account: account, refresh: refresh });
  var mine = (tree.campaigns || []).filter(function (one) {
    return one.type === want && one.groups.length;
  });
  if (!mine.length) {
    throw new Error('계정에 ' + want + ' 캠페인이 하나도 없습니다. '
      + '모먼트에서 같은 종류의 캠페인을 한 번 만들어 두면 그 설정을 본떠 만듭니다.');
  }
  // 목표까지 같은 것이 있으면 그것을, 없으면 같은 유형 아무거나 쓴다
  var same = goal ? mine.filter(function (one) { return one.goal === goal; }) : [];
  var pool = same.length ? same : mine;
  pool.sort(function (a, b) { return Number(b.id) - Number(a.id); });
  var campaign = pool[0];
  var groups = campaign.groups.slice().sort(function (a, b) { return Number(b.id) - Number(a.id); });

  var got = kakaoMany_([
    { key: 'campaign', path: '/campaigns/' + campaign.id },
    { key: 'group', path: '/adGroups/' + groups[0].id }
  ], account);
  if (!got.campaign || !got.group) throw new Error('기준 광고그룹 설정을 못 읽었습니다.');
  return { campaign: got.campaign, group: got.group, groupName: groups[0].name,
    campaignName: campaign.name, matchedGoal: same.length > 0 };
}

/* 화면에서 고를 수 있는 게재지면 · 입찰형태를 모은다.
   카카오 문서의 코드를 외워 박아 두면 캠페인 유형마다 되고 안 되고가 갈려 400 이 난다.
   그래서 **같은 유형으로 이미 만든 광고그룹**을 훑어, 이 계정에서 실제로 통한 값만 모아 준다.
   (화면은 여기 없는 지면도 보여 주되 '미사용' 이라고 적어 둔다) */
var KAKAO_SCAN_GROUPS = 12;

function kakaoChoices_(account, kind) {
  var want = KAKAO_TYPE_OF[String(kind || 'bizboard')] || 'TALK_BIZ_BOARD';
  var tree = kakaoTree_({ account: account, refresh: false });
  var ids = [];
  (tree.campaigns || []).forEach(function (one) {
    if (one.type !== want) return;
    one.groups.forEach(function (group) { ids.push(Number(group.id)); });
  });
  // 번호가 클수록 나중에 만든 것이다 — 요즘 쓰는 설정부터 본다
  ids.sort(function (a, b) { return b - a; });
  ids = ids.slice(0, KAKAO_SCAN_GROUPS);
  if (!ids.length) return { placements: [], deviceTypes: [], bids: [] };

  var got = kakaoMany_(ids.map(function (id) {
    return { key: 'g' + id, path: '/adGroups/' + id };
  }), account);

  var placements = [];
  var devices = [];
  var bids = [];
  ids.forEach(function (id) {
    var group = got['g' + id];
    if (!group) return;
    (group.placements || []).forEach(function (one) {
      if (one && placements.indexOf(one) < 0) placements.push(one);
    });
    (group.deviceTypes || []).forEach(function (one) {
      if (one && devices.indexOf(one) < 0) devices.push(one);
    });
    var strategy = String(group.bidStrategy || '');
    var pricing = String(group.pricingType || '');
    if (!strategy && !pricing) return;
    var key = strategy + '|' + pricing;
    for (var i = 0; i < bids.length; i += 1) if (bids[i].key === key) return;
    bids.push({ key: key, bidStrategy: strategy, pricingType: pricing });
  });
  return { placements: placements, deviceTypes: devices, bids: bids };
}

/* 화면에 보여 줄 기준값 — 무엇을 본떠 만들지 한 줄로 알려 주고,
   음성 안내(altText) · 프로필 이름 · 행동 버튼처럼 적기 번거로운 값을 미리 채워 준다. */
function kakaoDefaults_(payload) {
  var account = String(payload.account || '').replace(/[^0-9]/g, '');
  if (!account) throw new Error('광고 계정을 고르지 않았습니다.');
  var base = kakaoBase_(account, payload.kind, payload.goal, !!payload.refresh);

  var sample = null;
  var made = kakaoList_(kakaoMany_([{ key: 'list', path: '/creatives',
    params: { adGroupId: base.group.id, config: 'ON,OFF' } }], account).list);
  for (var i = 0; i < made.length; i += 1) {
    var one = kakaoMany_([{ key: 'one', path: '/creatives/' + made[i].id }], account).one;
    if (one) { sample = one; break; }
  }

  // 기준을 새로 읽었다면 캠페인 나무도 방금 갱신됐다 — 여기서는 담아 둔 것을 쓴다
  var choices = { placements: [], deviceTypes: [], bids: [] };
  try { choices = kakaoChoices_(account, payload.kind); } catch (error) { /* 고를거리는 없어도 만들 수 있다 */ }

  return { ok: true, source: 'kakao', account: account,
    campaign: base.campaign, group: base.group, sample: sample, choices: choices,
    basedOn: { campaign: base.campaignName, group: base.groupName, matchedGoal: base.matchedGoal } };
}

/* 캠페인과 광고그룹을 만든다.
   - 캠페인은 이름이 같은 것이 있으면 그것을 쓴다 (두 번 눌러도 캠페인이 겹치지 않게)
   - 광고그룹은 '틀' 로 고른 기존 광고그룹의 타겟팅 · 요일시간표를 그대로 본뜨고
     이름 · 기간 · 예산과 **화면에서 고른 게재지면 · 입찰형태**를 새로 넣는다
     (게재지면 · 입찰형태를 안 보내면 예전처럼 틀의 값을 그대로 쓴다)
   - 만든 광고그룹은 바로 끈다. 심사가 끝나고 사람이 켜야 한다. */
function kakaoMake_(payload) {
  var account = String(payload.account || '').replace(/[^0-9]/g, '');
  var campaignName = String(payload.campaignName || '').trim();
  var groupName = String(payload.groupName || '').trim();
  var budget = Math.round(Number(payload.budget) || 0);
  var bid = Math.round(Number(payload.bid) || 0);
  var beginDate = String(payload.beginDate || '').trim();
  var endDate = String(payload.endDate || '').trim();
  // 화면에서 고른 게재지면 · 입찰형태. 안 보내면 틀의 값을 쓴다.
  var placements = (Array.isArray(payload.placements) ? payload.placements : [])
    .map(function (one) { return String(one || '').trim(); })
    .filter(function (one) { return !!one; });
  var bidStrategy = String(payload.bidStrategy || '').trim();
  var pricingType = String(payload.pricingType || '').trim();

  if (!account) throw new Error('광고 계정을 고르지 않았습니다.');
  if (!campaignName) throw new Error('캠페인명이 비어 있습니다.');
  if (!groupName) throw new Error('광고그룹명이 비어 있습니다.');
  if (!beginDate) throw new Error('시작일이 비어 있습니다.');
  if (budget < 10000) throw new Error('일예산은 10,000원 이상이어야 합니다.');

  // 같은 종류 × 목표로 마지막에 만든 광고그룹을 기준으로 삼는다 (사람이 고르지 않는다)
  var base = kakaoBase_(account, payload.kind, payload.goal, false);
  var tpl = { campaign: base.campaign, group: base.group };

  var log = ['기준: ' + base.groupName + ' (' + base.campaignName + ')'
    + (base.matchedGoal ? '' : ' — 같은 목표가 없어 같은 유형에서 가져왔습니다')];

  // ① 캠페인
  var campaignId = '';
  var already = kakaoList_(kakao_('/campaigns', { config: 'ON,OFF' }, account, 0));
  for (var i = 0; i < already.length; i += 1) {
    if (String(already[i].name || '') === campaignName) { campaignId = String(already[i].id); break; }
  }
  if (campaignId) {
    log.push('캠페인은 이미 있는 것을 씁니다 (' + campaignId + ')');
  } else {
    var goal = tpl.campaign.campaignTypeGoal || {};
    var campaignBody = { name: campaignName,
      campaignTypeGoal: { campaignType: goal.campaignType, goal: goal.goal } };
    if (tpl.campaign.objective) campaignBody.objective = tpl.campaign.objective;
    if (tpl.campaign.trackId) campaignBody.trackId = tpl.campaign.trackId;
    if (tpl.campaign.kclid !== null && tpl.campaign.kclid !== undefined) campaignBody.kclid = tpl.campaign.kclid;
    campaignId = kakaoNewId_(kakaoSend_('post', '/campaigns', campaignBody, account));
    if (!campaignId) throw new Error('캠페인을 만들었는데 번호를 못 받았습니다.');
    log.push('캠페인을 만들었습니다 (' + campaignId + ' · '
      + goal.campaignType + ' × ' + goal.goal + ')');
  }

  // ② 광고그룹 — 틀 그대로, 이름 · 기간 · 예산만 새로
  var from = tpl.group;
  var targeting = {};
  Object.keys(from.targeting || {}).forEach(function (key) {
    // adAccountId 는 그 광고그룹에만 붙는 값이라 뗀다
    if (key === 'adAccountId') return;
    if (from.targeting[key] === null) return;
    targeting[key] = from.targeting[key];
  });

  var schedule = { beginDate: beginDate };
  if (endDate) schedule.endDate = endDate;
  ['mondayTime', 'tuesdayTime', 'wednesdayTime', 'thursdayTime',
    'fridayTime', 'saturdayTime', 'sundayTime'].forEach(function (day) {
    if ((from.schedule || {})[day]) schedule[day] = from.schedule[day];
  });
  if ((from.schedule || {}).detailTime !== undefined && from.schedule.detailTime !== null) {
    schedule.detailTime = from.schedule.detailTime;
  }

  var usePlacements = placements.length ? placements : (from.placements || []);
  var useStrategy = bidStrategy || from.bidStrategy;
  var usePricing = pricingType || from.pricingType;

  var groupBody = {
    campaign: { id: Number(campaignId) },
    name: groupName,
    placements: usePlacements,
    deviceTypes: from.deviceTypes,
    targeting: targeting,
    pricingType: usePricing,
    bidStrategy: useStrategy,
    bidAmount: bid,
    dailyBudgetAmount: budget,
    pacing: from.pacing,
    schedule: schedule
  };
  var groupId = kakaoNewId_(kakaoSend_('post', '/adGroups', groupBody, account));
  if (!groupId) throw new Error('광고그룹을 만들었는데 번호를 못 받았습니다.');
  log.push('광고그룹을 만들었습니다 (' + groupId + ') — 게재지면 '
    + usePlacements.join(' · ') + (placements.length ? ' (고른 값)' : ' (기준 그대로)')
    + ' / 입찰 ' + useStrategy + ' ' + usePricing
    + (bidStrategy || pricingType ? ' (고른 값)' : ' (기준 그대로)'));

  // ③ 바로 끈다. 심사를 통과한 뒤 사람이 켠다.
  var off = false;
  try {
    kakaoSend_('put', '/adGroups/onOff', { adGroupId: Number(groupId), config: 'OFF' }, account);
    off = true;
  } catch (error) {
    try {
      kakaoSend_('put', '/adGroups/onOff', { id: Number(groupId), config: 'OFF' }, account);
      off = true;
    } catch (second) {
      log.push('[주의] 광고그룹을 끄지 못했습니다 — 모먼트에서 직접 꺼 주세요. ' + second.message);
    }
  }
  if (off) log.push('광고그룹을 꺼 두었습니다 (OFF)');

  return { ok: true, source: 'kakao', account: account,
    campaign: campaignId, group: groupId, off: off, log: log };
}

/* 소재 하나를 만든다. 그림은 브라우저가 base64 로 보낸다.
   UrlFetchApp 은 payload 안에 Blob 이 있으면 multipart/form-data 로 보낸다 —
   카카오가 요구하는 모양이 그것이다. */
function kakaoCreative_(payload) {
  var account = String(payload.account || '').replace(/[^0-9]/g, '');
  var groupId = String(payload.group || '').replace(/[^0-9]/g, '');
  var format = String(payload.format || '').trim();
  var name = String(payload.name || '').trim();
  var altText = String(payload.altText || '').trim();
  var landing = String(payload.landing || '').trim();
  var fileName = String(payload.fileName || 'creative.png').trim();
  var mime = /\.png$/i.test(fileName) ? 'image/png' : 'image/jpeg';

  if (!account) throw new Error('광고 계정을 고르지 않았습니다.');
  if (!groupId) throw new Error('광고그룹 번호가 없습니다.');
  if (!format) throw new Error('소재 형식이 없습니다.');
  if (!landing) throw new Error('랜딩 URL 이 없습니다: ' + name);
  if (!payload.image) throw new Error('그림이 실려 오지 않았습니다: ' + name);

  var bytes = Utilities.base64Decode(String(payload.image));
  var blob = Utilities.newBlob(bytes, mime, fileName);

  var form = {
    adGroupId: groupId,
    format: format,
    name: name,
    altText: altText,
    imageFile: blob
  };
  if (format === 'IMAGE_BANNER') {
    // 비즈보드는 랜딩을 landingInfo 로 넣는다 (계정에 있는 소재가 그 모양이다)
    form['landingInfo.landingType'] = 'URL';
    form['landingInfo.url'] = landing;
    form.mobileLandingUrl = landing;
  } else {
    // 반응형 랜딩은 다른 URL 과 같이 못 쓴다 — 이것 하나만 보낸다
    form.rspvLandingUrl = landing;
    form.title = String(payload.title || '').trim();
    form.description = String(payload.description || '').trim();
    form.profileName = String(payload.profileName || '').trim();
    form.actionButton = String(payload.actionButton || 'PURCHASE').trim();
    if (payload.profileImageUrl) form.profileImageFileUrl = String(payload.profileImageUrl);
  }

  kakaoWait_(KAKAO_WRITE_GAP, false);
  var response = UrlFetchApp.fetch(KAKAO_URL + '/creatives', {
    method: 'post',
    payload: form,
    muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + kakaoToken_(), adAccountId: String(account) }
  });
  var body = kakaoAnswer_(response, 'POST /creatives (' + name + ')');
  return { ok: true, source: 'kakao', creative: kakaoNewId_(body), name: name };
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
        purchase: 0, addToCart: 0, lead: 0, custom: 0, results: 0, revenue: 0,
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
    /* 결과는 **구매완료 수**(14번 칸)만 센다.
       시트의 '결과' 칸(17번)은 GFA 화면이 센 전환 합(convCount)이라 위시리스트 ·
       페이지뷰처럼 우리가 안 보는 전환까지 들어가 있다. 그대로 쓰면 GFA 만 결과가
       부풀고 CPA 가 싸 보인다.
       시트에는 매체가 센 값이 그 칸에 그대로 남는다 — 바꿔 보는 것은 읽을 때뿐이다. */
    entry.results += Number(line[14] || 0);
    // 전환값도 구매완료 전환매출액이다 (적재가 purchaseConvSales 를 넣는다)
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

// ── 네이버 검색광고 (브랜드검색) ──────────────────────────────────
// 지금은 **브랜드검색만** 본다 (캠페인 유형 BRAND_SEARCH).
// GFA 와 달리 공개 API 가 있어 여기서 바로 부른다 (적재 시트를 거치지 않는다).
//
// 인증은 토큰이 아니라 **요청마다 서명**이다 — 만료도 재발급도 없다.
//   X-API-KEY   = 액세스 라이선스 (NAVER_SA_API_KEY)
//   X-Customer  = 고객 ID        (NAVER_SA_CUSTOMER_ID)
//   X-Timestamp = 밀리초
//   X-Signature = base64(HMAC-SHA256(비밀키, '<timestamp>.<METHOD>.<경로>'))
// 서명에 쓰는 경로는 **쿼리를 뺀** 경로다 ('/ncc/campaigns?x=1' → '/ncc/campaigns').
var SA_URL = 'https://api.searchad.naver.com';

// 받아 올 지표. 전환(ccnt · convAmt)은 프리미엄로그분석이 붙어 있어야 온다 —
// 없으면 400 이 오므로 그때는 핵심 지표만 다시 부른다.
var SA_FIELDS = ['impCnt', 'clkCnt', 'salesAmt', 'ctr', 'cpc', 'ccnt', 'crto', 'convAmt', 'ror'];
var SA_FIELDS_PLAIN = ['impCnt', 'clkCnt', 'salesAmt', 'ctr', 'cpc'];
// /stats 는 id 를 여러 개 받지만, UrlFetchApp 은 **주소를 2KB 까지만** 보낸다
// (넘으면 '제한 초과 : url fetch url 길이'). 검색광고 id 는 길어서 개수로 자르면 넘친다.
// 그래서 주소 길이를 재어 나누고, 개수로도 넉넉한 끝을 둔다.
var SA_URL_LIMIT = 1800;
var SA_ID_CHUNK = 30;
var SA_CACHE_SECONDS = 600;       // 10분 (숫자)
// 캠페인 · 광고그룹 · 소재의 짜임새는 기간과 상관없다. 길게 담아 둔다 —
// 기간을 바꿀 때마다 이걸 다시 훑어 브랜드검색 조회가 3분을 넘겼다.
var SA_TREE_CACHE_SECONDS = 3600;

function saProp_(name) {
  var value = String(PropertiesService.getScriptProperties().getProperty(name) || '').trim();
  if (!value) {
    throw new Error(name + ' 스크립트 속성이 없습니다. 검색광고 관리자센터 → 도구 → API 사용 관리에서 '
      + '발급한 값을 Apps Script 프로젝트 설정 → 스크립트 속성에 넣어 주세요.');
  }
  return value;
}

function saHeaders_(method, path) {
  var stamp = String(Date.now());
  var message = stamp + '.' + method.toUpperCase() + '.' + path;
  var sign = Utilities.base64Encode(
    Utilities.computeHmacSha256Signature(message, saProp_('NAVER_SA_SECRET_KEY')));
  return {
    'X-Timestamp': stamp,
    'X-API-KEY': saProp_('NAVER_SA_API_KEY'),
    'X-Customer': saProp_('NAVER_SA_CUSTOMER_ID'),
    'X-Signature': sign
  };
}

// 값이 목록이면 **같은 이름을 여러 번** 적는다 (ids=A&ids=B).
// 네이버 검색광고의 ids 가 그 모양이다 — JSON 글자로 보내면
// '["grp-…"]' 통째를 id 하나로 읽어 '유효하지 않은 ID 형식입니다' 로 막는다.
function saQuery_(params) {
  var query = [];
  var add = function (key, value) {
    if (value === undefined || value === null || value === '') return;
    query.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
  };
  Object.keys(params || {}).forEach(function (key) {
    var value = params[key];
    if (Object.prototype.toString.call(value) === '[object Array]') {
      value.forEach(function (one) { add(key, one); });
      return;
    }
    add(key, value);
  });
  return query.length ? '?' + query.join('&') : '';
}

function saAsk_(path, params) {
  var url = SA_URL + path + saQuery_(params);
  if (url.length > 2000) {
    throw new Error('네이버 검색광고 요청 주소가 너무 깁니다 (' + url.length + '자, ' + path + '). '
      + '한 번에 묻는 개수를 줄여야 합니다.');
  }
  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    muteHttpExceptions: true,
    contentType: 'application/json; charset=UTF-8',
    headers: saHeaders_('GET', path)
  });
  return saAnswer_(response, path);
}

// 여러 개를 한꺼번에 부른다 (서명은 경로마다 따로 만든다)
function saMany_(jobs) {
  var out = {};
  for (var at = 0; at < jobs.length; at += 25) {
    var chunk = jobs.slice(at, at + 25);
    var answers = [];
    try {
      answers = UrlFetchApp.fetchAll(chunk.map(function (job) {
        return {
          url: SA_URL + job.path + saQuery_(job.params),   // 목록 조회는 id 하나씩이라 짧다
          method: 'get',
          muteHttpExceptions: true,
          contentType: 'application/json; charset=UTF-8',
          headers: saHeaders_('GET', job.path)
        };
      }));
    } catch (error) {
      answers = [];
    }
    chunk.forEach(function (job, i) {
      var response = answers[i];
      if (!response || response.getResponseCode() >= 400) return;
      try { out[job.key] = JSON.parse(response.getContentText() || 'null'); } catch (ignore) { /* 이 줄만 건너뛴다 */ }
    });
  }
  return out;
}

function saAnswer_(response, where) {
  var text = response.getContentText() || '';
  var code = response.getResponseCode();
  var body = null;
  try { body = JSON.parse(text || 'null'); } catch (error) { body = null; }
  if (code >= 400) {
    var reason = (body && (body.title || body.detail || body.message)) || text.slice(0, 300);
    if (code === 401 || code === 403) {
      reason += ' (액세스 라이선스 · 비밀키 · 고객 ID 를 확인하세요. 세 값이 같은 계정의 것이어야 합니다)';
    }
    if (code === 400 && /ID/i.test(reason)) {
      reason += ' (/stats 는 한 번에 한 종류의 id 만 받습니다 — 캠페인 · 광고그룹 · 소재를 섞으면 막힙니다)';
    }
    throw new Error('네이버 검색광고 (HTTP ' + code + ') ' + where + ': ' + reason);
  }
  return body;
}

/* id 를 주소 길이에 맞춰 나눈다.
   한 묶음의 주소가 SA_URL_LIMIT 을 넘지 않게 하고, 개수도 SA_ID_CHUNK 를 넘기지 않는다.
   id 하나가 혼자서도 길면 그것만 담아 보낸다 (더 쪼갤 수 없다). */
function saStatChunks_(ids, fields, since, until) {
  var tail = saQuery_({
    fields: JSON.stringify(fields),
    timeRange: JSON.stringify({ since: since, until: until })
  });
  var fixed = SA_URL.length + '/stats'.length + tail.length;
  var room = Math.max(SA_URL_LIMIT - fixed, 60);

  var out = [];
  var now = [];
  var used = 0;
  ids.forEach(function (id) {
    var cost = ('&ids=' + encodeURIComponent(id)).length;
    if (now.length && (used + cost > room || now.length >= SA_ID_CHUNK)) {
      out.push(now);
      now = [];
      used = 0;
    }
    now.push(id);
    used += cost;
  });
  if (now.length) out.push(now);
  return out;
}

/* /stats 는 id 목록과 지표 이름을 JSON 글자로 받는다.
   **한 번에 한 종류의 id 만 받는다** — 광고그룹과 소재를 섞으면
   '유효하지 않은 ID 형식입니다' 로 막힌다. 그래서 부르는 쪽에서 종류별로 갈라 부른다.
   want 를 주면 그 지표로 먼저 묻는다 (앞 호출에서 전환이 안 온 것을 알았을 때 쓴다). */
function saStats_(ids, since, until, want) {
  var got = {};
  var fields = want || SA_FIELDS;
  var chunks = saStatChunks_(ids, fields, since, until);
  for (var at = 0; at < chunks.length; at += 1) {
    var chunk = chunks[at];
    var body = null;
    try {
      body = saAsk_('/stats', { ids: chunk, fields: JSON.stringify(fields),
        timeRange: JSON.stringify({ since: since, until: until }) });
    } catch (error) {
      // 전환 지표를 안 주는 계정이면 핵심 지표만 다시 묻는다
      if (fields === SA_FIELDS) {
        // 지표를 줄이면 주소도 짧아지므로 같은 묶음으로 다시 물어도 넘치지 않는다
        fields = SA_FIELDS_PLAIN;
        body = saAsk_('/stats', { ids: chunk, fields: JSON.stringify(fields),
          timeRange: JSON.stringify({ since: since, until: until }) });
      } else {
        throw error;
      }
    }
    var rows = (body && (body.data || body)) || [];
    if (!Array.isArray(rows)) rows = [];
    rows.forEach(function (row) { if (row && row.id) got[String(row.id)] = row; });
  }
  return { stats: got, fields: fields };
}

// 두 덩이를 합친다 (Object.assign 을 쓰지 않는다 — 이 파일은 ES5 로 맞춰 둔다)
function saJoin_(base, more) {
  var out = {};
  Object.keys(base || {}).forEach(function (key) { out[key] = base[key]; });
  Object.keys(more || {}).forEach(function (key) { out[key] = more[key]; });
  return out;
}

function saNums_(stat) {
  var one = stat || {};
  var num = function (value) { return Number(value) || 0; };
  return {
    spend: num(one.salesAmt),          // 광고비 (부가세 별도)
    impressions: num(one.impCnt),
    clicks: num(one.clkCnt),
    conv: num(one.ccnt),
    revenue: num(one.convAmt)
  };
}

// 브랜드검색은 **광고그룹 · 소재** 두 단으로 본다 (매체별 성과의 캠페인 · 광고그룹 자리에 넣는다).
//   캠페인 자리 = 광고그룹   ·   광고그룹 자리 = 소재
// 브랜드검색 캠페인은 계정에 한두 개뿐이라 층을 하나 줄여 보여 주는 게 읽기 좋다.
var SA_AD_LIMIT = 60;             // 광고그룹 하나에서 볼 소재 수 (브랜드검색은 몇 개뿐이다)

// 소재 이름 · 미리보기. 실제 응답을 받아 보고 맞춘 자리다:
//   { nccAdId, name: '미로 맑음 공기청정기', ad: { thumbnail: 'https://ssl.pstatic.net/…' }, adAttr: {} }
// 이름은 맨 위 name, 그림은 ad.thumbnail 에 있다. adAttr 은 비어 오는 계정이 많아 뒤로 둔다.
var SA_NAME_KEYS = ['headline', 'title', 'mainTitle', 'subTitle', 'description', 'name', 'brandName'];
var SA_IMAGE_KEYS = ['imageUrl', 'image', 'mainImageUrl', 'thumbnailUrl', 'logoImageUrl'];

function saAttr_(ad) {
  var raw = (ad && (ad.adAttr || ad.adAttrJson)) || null;
  if (!raw) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) || {}; } catch (error) { return {}; }
  }
  return raw;
}

function saPick_(attr, keys) {
  for (var i = 0; i < keys.length; i += 1) {
    var value = attr[keys[i]];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function saAdName_(ad, at) {
  var plain = String((ad && ad.name) || '').trim();
  if (plain) return plain;
  var found = saPick_(saAttr_(ad), SA_NAME_KEYS);
  if (found) return found;
  return '소재 ' + (at + 1);
}

function saAdImage_(ad) {
  var inside = (ad && ad.ad) || {};
  var found = String(inside.thumbnail || inside.imageUrl || '').trim()
    || saPick_(saAttr_(ad), SA_IMAGE_KEYS);
  return /^https?:\/\//.test(found) ? found : '';
}

/* 표에 올릴 줄인가. 계정에는 몇 해 전에 멈춘 광고그룹 · 소재가 잔뜩 남아 있다
   (광고그룹 130 · 소재 457 중 실제로 도는 것은 열 몇 개뿐이었다).
   숫자가 있거나 지금 돌고 있는 줄만 보여 준다. */
function saAlive_(row) {
  return row.impressions > 0 || row.clicks > 0 || row.results > 0 || row.spend > 0 || row.active;
}

/* 브랜드검색은 정액(CPT) 이라 광고비(salesAmt)가 늘 0 으로 온다 — 파워링크는 제대로 온다.
   광고비로 줄을 세우면 뜻이 없으므로 클릭 · 노출 차례로 세운다. */
function saSort_(rows) {
  return rows.sort(function (a, b) {
    if (b.spend !== a.spend) return b.spend - a.spend;
    if (b.clicks !== a.clicks) return b.clicks - a.clicks;
    if (b.impressions !== a.impressions) return b.impressions - a.impressions;
    return String(a.name).localeCompare(String(b.name));
  });
}

/* 브랜드검색의 짜임새 — 캠페인 · 광고그룹 · 소재. 숫자는 담지 않는다.
   기간과 상관없는 값이라 따로 담아 두고, 기간이 바뀌면 숫자만 다시 묻는다. */
// ── 실사용비 받기 (고정비 + 판매채널로 잡히는 프로모션 줄) ─────────────────
/* 월별 예산의 고정비 줄 중 **검색광고로 나가는 것**을 네이버에서 바로 받아 채운다.
   두 곳에서 받는다:
     · 파워링크 · 쇼핑검색 — 네이버 검색광고 API 를 바로 부른다.
     · 애드부스트   — 검색광고가 아니라 GFA(성과형 디스플레이) 라 공개 API 가 없다.
                      PC 의 get_gfa_report.py 가 쌓아 둔 네이버성과 시트를 읽는다.
   브랜드검색은 넣지 않는다 — 정액(CPT) 이라 salesAmt 가 늘 0 으로 온다. 계약서 보고 손으로 적는다.

   캠페인 이름은 '[미닉스 더 플렌더]naversa_traffic' 꼴이라 대괄호 안이 제품이다.
   대괄호가 없거나 '미닉스' 가 안 붙은 캠페인(경쟁사 · 리퍼제품 같은 것)은 제품을
   못 가리므로 product 를 비워 보낸다 — 화면에서 '못 붙인 것' 으로 따로 보여 준다. */
var BUDGET_FIXED_SEARCH = [
  { item: '파워링크', type: 'WEB_SITE' },
  { item: '쇼핑검색', type: 'SHOPPING' }
];

// '[미닉스 더 플렌더]naversa_traffic' → '더 플렌더'
function budgetFixedProduct_(name) {
  var text = String(name || '');
  var at = text.indexOf('[');
  var to = text.indexOf(']', at + 1);
  if (at !== 0 || to < 0) return '';          // 대괄호로 시작하지 않으면 규칙 밖이다
  var inside = text.slice(at + 1, to).replace(/\s+/g, ' ').trim();
  if (inside.indexOf('미닉스') !== 0) return '';   // [레거시] · [키첸] 같은 것
  return inside.slice('미닉스'.length).trim();
}

/* 판매채널로 실사용비를 받아 오는 규칙.
   프로모션 줄의 **판매채널 이름**이 왼쪽과 같으면, 그 매체 계정에서 광고그룹 이름에
   match 가 들어간 것들의 광고비를 더해 그 줄의 실사용비로 넣는다.

   광고그룹 이름은 '[260901-charlesenter-secret]25-54_none_officialwebsite' 처럼
   앞에 날짜가, 뒤에 타겟팅이 붙는다. 그래서 **들어 있는지**로 견준다 (똑같은지가 아니다).
   같은 조각이 여러 광고그룹에 걸리면 그것들을 다 더한다 (한 행사를 소재별로 쪼갠 경우다).

   새 채널을 붙일 때는 이 표에 한 줄만 더하면 된다. */
var BUDGET_CHANNEL_ADS = [
  { channel: '찰스엔터 비밀특가', media: 'meta',
    account: 'act_370223898721955', match: 'charlesenter-secret' },
  { channel: '고기남자 어필리에잇', media: 'google',
    account: '4112908407', match: 'goginamja' },
  { channel: '아가리어터 비밀특가', media: 'meta',
    account: 'act_370223898721955', match: 'agariutter-260910' }
];

function budgetChannelSpend_(since, until) {
  var out = [];
  var notes = [];

  // 같은 계정을 여러 번 부르지 않는다 (메타 두 채널이 같은 계정이다)
  var seen = {};
  BUDGET_CHANNEL_ADS.forEach(function (rule) {
    var key = rule.media + '|' + rule.account;
    if (!seen[key]) seen[key] = { media: rule.media, account: rule.account, rules: [] };
    seen[key].rules.push(rule);
  });

  Object.keys(seen).forEach(function (key) {
    var group = seen[key];
    var adsets = [];
    try {
      var body = group.media === 'meta'
        ? metaReport_({ account: group.account, since: since, until: until })
        : adsReport_({ account: group.account, since: since, until: until });
      adsets = (body && body.adsets) || [];
    } catch (error) {
      notes.push(group.media + ' ' + group.account + ' — '
        + String((error && error.message) || error));
      return;
    }
    group.rules.forEach(function (rule) {
      var want = rule.match.toLowerCase();
      var spend = 0;
      var names = [];
      adsets.forEach(function (one) {
        var name = String((one && one.name) || '');
        if (name.toLowerCase().indexOf(want) < 0) return;
        spend += Number(one.spend) || 0;
        if (names.indexOf(name) < 0) names.push(name);
      });
      out.push({ channel: rule.channel, media: rule.media, match: rule.match,
        spend: Math.round(spend), adsets: names });
    });
  });

  return { rows: out, notes: notes };
}

function budgetFixedSpend_(payload) {
  var since = String((payload && payload.since) || '').slice(0, 10);
  var until = String((payload && payload.until) || '').slice(0, 10);
  if (!since || !until) throw new Error('기간(since · until)이 없습니다.');

  var rows = [];
  var ids = [];
  var whose = {};        // 캠페인 id → { item, name, product }

  BUDGET_FIXED_SEARCH.forEach(function (kind) {
    var list = saAsk_('/ncc/campaigns', { campaignType: kind.type }) || [];
    if (!Array.isArray(list)) list = [];
    list.forEach(function (one) {
      var id = String(one.nccCampaignId || '');
      if (!id) return;
      whose[id] = { item: kind.item, name: one.name || id, product: budgetFixedProduct_(one.name) };
      ids.push(id);
    });
  });

  // 광고비만 묻는다. 지표를 줄이면 주소가 짧아져 한 번에 묶이는 캠페인 수도 는다.
  var got = ids.length ? saStats_(ids, since, until, ['salesAmt']).stats : {};

  Object.keys(whose).forEach(function (id) {
    var spend = Number((got[id] || {}).salesAmt) || 0;
    if (!spend) return;                        // 안 쓴 캠페인은 보낼 것이 없다
    var one = whose[id];
    rows.push({ item: one.item, campaign: one.name, product: one.product, spend: spend });
  });

  /* 애드부스트 — GFA 라 검색광고 API 에 없다. 스크래퍼가 쌓아 둔 네이버성과 시트를 읽는다.
     naverReport_ 가 이미 부가세를 빼(÷1.1) 공급가로 내려 주므로 위 검색광고와 기준이 같다.
     시트가 아직 안 쌓였으면 그것만 건너뛴다 — 검색광고까지 같이 죽이지 않는다. */
  var gfaNote = '';
  var gfaLoadedAt = '';   // 성과 시트에 마지막으로 쌓인 시각 (스크래퍼가 언제 돌았나)
  try {
    var gfa = naverReport_({ since: since, until: until });
    // naverReport_ 의 fetchedAt 은 그 기간 줄들의 **가장 늦은 적재시각**이다.
    gfaLoadedAt = String(gfa.fetchedAt || '');
    (gfa.campaigns || []).forEach(function (one) {
      if (String(one.objective) !== 'PMAX') return;   // PMAX 가 애드부스트다
      var spend = Math.round(Number(one.spend) || 0);
      if (!spend) return;
      rows.push({ item: '애드부스트', campaign: one.name || '',
        product: budgetFixedProduct_(one.name), spend: spend });
    });
  } catch (error) {
    gfaNote = String((error && error.message) || error);
  }

  rows.sort(function (a, b) { return b.spend - a.spend; });

  // 판매채널로 잡히는 프로모션 줄 (메타 · 구글 광고그룹 이름으로 찾는다)
  var channel = budgetChannelSpend_(since, until);
  // 광고비는 모두 **부가세를 뺀 공급가**다 (검색광고는 salesAmt 가 원래 별도,
  // GFA 는 naverReport_ 가 ÷1.1 해서 준다). 매체별 성과와 같은 기준이다.
  return { ok: true, since: since, until: until, vat: 'exclusive',
    campaigns: ids.length, rows: rows, gfaNote: gfaNote, gfaLoadedAt: gfaLoadedAt,
    channels: channel.rows, channelNotes: channel.notes,
    fetchedAt: new Date().toISOString() };
}

function saTree_(refresh) {
  var cache = CacheService.getScriptCache();
  if (!refresh) {
    var hit = cacheGet_(cache, 'saTree');
    if (hit) {
      try { return JSON.parse(hit); } catch (error) { /* 깨졌으면 다시 읽는다 */ }
    }
  }

  var campaigns = saAsk_('/ncc/campaigns', { campaignType: 'BRAND_SEARCH' }) || [];
  if (!Array.isArray(campaigns)) campaigns = [];

  var campaignOf = {};
  campaigns.forEach(function (one) {
    campaignOf[String(one.nccCampaignId)] = {
      id: String(one.nccCampaignId),
      name: one.name || String(one.nccCampaignId),
      begin: String(one.periodStartDt || '').slice(0, 10),
      end: String(one.periodEndDt || '').slice(0, 10)
    };
  });

  // 광고그룹은 **캠페인마다** 묻는다.
  // 파라미터 없이 /ncc/adgroups 를 부르면 계정의 광고그룹이 전부 온다 — 검색광고 계정에는
  // 그게 수천 개라 그 한 번으로 3분을 넘겼다. 브랜드검색 캠페인은 한두 개뿐이다.
  var groups = [];
  if (campaigns.length) {
    var lists = saMany_(campaigns.map(function (one) {
      return { key: String(one.nccCampaignId), path: '/ncc/adgroups',
        params: { nccCampaignId: one.nccCampaignId } };
    }));
    campaigns.forEach(function (one) {
      var list = lists[String(one.nccCampaignId)];
      if (!Array.isArray(list)) return;
      list.forEach(function (group) {
        // 브랜드검색 캠페인의 것만 담는다 (목록이 다른 캠페인 것을 섞어 주더라도)
        if (!campaignOf[String(group.nccCampaignId)]) return;
        groups.push({
          id: String(group.nccAdgroupId),
          name: group.name || String(group.nccAdgroupId),
          campaignId: String(group.nccCampaignId),
          status: String(group.status || ''),
          type: String(group.adgroupType || '')
        });
      });
    });
  }

  // 소재는 광고그룹마다 부른다 (한꺼번에 묶어 부른다)
  var ads = [];
  if (groups.length) {
    var packs = saMany_(groups.map(function (one) {
      return { key: one.id, path: '/ncc/ads', params: { nccAdgroupId: one.id } };
    }));
    groups.forEach(function (group) {
      var list = packs[group.id];
      if (!Array.isArray(list)) return;
      list.slice(0, SA_AD_LIMIT).forEach(function (ad, at) {
        ads.push({
          id: String(ad.nccAdId),
          groupId: group.id,
          name: saAdName_(ad, at),
          thumbnail: saAdImage_(ad),
          status: String(ad.status || ''),
          inspect: String(ad.inspectStatus || '')
        });
      });
    });
  }

  var tree = { campaignOf: campaignOf, groups: groups, ads: ads };
  cachePut_(cache, 'saTree', JSON.stringify(tree), SA_TREE_CACHE_SECONDS);
  return tree;
}

// 짜임새에 기간별 숫자를 붙여 담아 둔다 (매체별 성과 · 소재별 결과가 같이 쓴다)
function saGather_(since, until, refresh) {
  var cache = CacheService.getScriptCache();
  var key = ['saAll', since, until].join('|');
  if (!refresh) {
    var hit = cacheGet_(cache, key);
    if (hit) {
      try { return JSON.parse(hit); } catch (error) { /* 깨졌으면 다시 읽는다 */ }
    }
  }

  var tree = saTree_(refresh);
  var campaignOf = tree.campaignOf;
  var groups = tree.groups;
  var ads = tree.ads;

  // 광고그룹과 소재는 id 종류가 달라 따로 묻는다 (섞으면 400 이 온다)
  var groupIds = groups.map(function (one) { return one.id; });
  var adIds = ads.map(function (one) { return one.id; });
  var stats = {};
  var fields = SA_FIELDS_PLAIN;
  if (groupIds.length) {
    var gotGroups = saStats_(groupIds, since, until);
    fields = gotGroups.fields;
    Object.keys(gotGroups.stats).forEach(function (id) { stats[id] = gotGroups.stats[id]; });
  }
  if (adIds.length) {
    // 광고그룹에서 쓴 지표를 그대로 쓴다 (전환이 안 오는 계정에서 두 번 헛걸음하지 않게)
    var gotAds = saStats_(adIds, since, until, groupIds.length ? fields : null);
    if (!groupIds.length) fields = gotAds.fields;
    Object.keys(gotAds.stats).forEach(function (id) { stats[id] = gotAds.stats[id]; });
  }
  var got = { stats: stats, fields: fields };

  var result = {
    campaignOf: campaignOf,
    groups: groups,
    ads: ads,
    stats: got.stats,
    fields: got.fields
  };
  cachePut_(cache, key, JSON.stringify(result), SA_CACHE_SECONDS);
  return result;
}

// 매체별 성과가 쓰는 줄 모양으로 맞춘다 (다른 매체와 칸 이름이 같아야 화면이 그린다)
function saRow_(base, stat) {
  var num = saNums_(stat);
  return saJoin_(base, {
    spend: num.spend,
    impressions: num.impressions,
    clicks: num.clicks,
    linkClicks: num.clicks,          // 검색광고는 클릭이 곧 링크 클릭이다
    purchase: num.conv,
    addToCart: 0,
    lead: 0,
    custom: 0,
    results: num.conv,
    revenue: num.revenue,
    budget: 0,
    budgetKind: '',
    goal: ''
  });
}

function naverSaAccounts_() {
  var id = saProp_('NAVER_SA_CUSTOMER_ID');
  return [{ id: id, accountId: id, name: '네이버 검색광고 (' + id + ')', currency: 'KRW', disabled: false }];
}

// ── 브랜드검색 광고비 (사람이 적는다) ──────────────────────────────
// 브랜드검색은 정액(CPT) 이라 검색광고 API 가 광고비를 주지 않는다 — 직접 물어보고 확인했다
// (노출 · 클릭 · 전환은 오는데 salesAmt 만 늘 0 이다. 같은 계정의 파워링크는 제대로 온다).
// 계약 금액이라 사람만 아는 값이다. 그래서 시트에 적어 두고 여기서 붙인다.
//
//   대상    광고그룹명 · 캠페인명 · id 아무거나 적으면 된다.
//           캠페인명을 적으면 그 아래 광고그룹에 클릭 비중으로 나눈다.
//   기간    그 금액을 산 기간. **조회한 기간과 겹친 날수만큼만** 넣는다 —
//           9/1~9/30 에 330만원을 적어 두고 9/1~9/10 을 보면 100만원이 잡힌다
//           (330만 ÷ 1.1 × 10/30 — 부가세를 뺀 뒤 겹친 날수로 나눈다).
//   광고비  **부가세 포함**으로 적는다 (계약서 · 세금계산서에 적힌 그 금액).
//           표에 넣을 때 공급가로 바꾼다 (÷1.1) — 네이버 GFA 와 같은 기준이다.
//           바꾸는 건 읽을 때만 한다. 시트에는 적은 값이 그대로 남아 계약서와 맞춰 볼 수 있다.
var SA_COST_SHEET_NAME = '브랜드검색비용';
var SA_COST_HEADERS = ['대상(광고그룹명 · 캠페인명 · ID)', '시작일', '종료일',
  '광고비(VAT 포함)', '메모', '수정자', '수정시각'];

function saCostSheet_() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  var sheet = book.getSheetByName(SA_COST_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SA_COST_SHEET_NAME, book.getNumSheets());
    sheet.getRange(1, 1, 1, SA_COST_HEADERS.length).setValues([SA_COST_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 300);
    sheet.setColumnWidth(2, 100);
    sheet.setColumnWidth(3, 100);
    sheet.setColumnWidth(4, 140);
    sheet.setColumnWidth(5, 260);
    // 날짜 칸은 글자로 둔다. 시트가 날짜로 바꿔 두어도 naverDay_ 가 다시 펴 주지만,
    // 사람이 2026-09-01 로 적은 그대로 보이는 편이 헷갈리지 않는다.
    sheet.getRange('B:C').setNumberFormat('@');
    return sheet;
  }
  // 머리글이 바뀌었으면 (부가세 별도 → 포함) 그 칸만 고쳐 준다. 적어 둔 줄은 그대로 둔다.
  var head = String(sheet.getRange(1, 4).getValue() || '');
  if (head && head !== SA_COST_HEADERS[3]) sheet.getRange(1, 4).setValue(SA_COST_HEADERS[3]);
  return sheet;
}

function saCostRows_() {
  var sheet = saCostSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var out = [];
  sheet.getRange(2, 1, last - 1, SA_COST_HEADERS.length).getValues().forEach(function (line) {
    var target = String(line[0] || '').trim();
    if (!target) return;
    out.push({
      target: target,
      since: naverDay_(line[1]),
      until: naverDay_(line[2]),
      cost: Number(String(line[3] === null || line[3] === undefined ? '' : line[3])
        .replace(/[,\s\u20a9원]/g, '')) || 0,
      note: String(line[4] || ''),
      updatedBy: String(line[5] || ''),
      updatedAt: line[6] instanceof Date ? line[6].toISOString() : String(line[6] || '')
    });
  });
  return out;
}

// 시트 주소. 못 열어도 조회가 죽지 않게 빈 글자를 준다.
function saCostUrl_() {
  try {
    return 'https://docs.google.com/spreadsheets/d/' + SHEET_ID
      + '/edit#gid=' + saCostSheet_().getSheetId();
  } catch (error) {
    return '';
  }
}

function naverSaCostGet_() {
  return {
    ok: true,
    rows: saCostRows_(),
    url: saCostUrl_(),
    fetchedAt: new Date().toISOString()
  };
}

// 화면이 가진 목록 그대로 시트를 맞춘다. **빈 목록도 받는다** — 다 지우는 것이 정상일 수 있다.
function naverSaCostPut_(payload) {
  var rows = (payload && payload.rows) || [];
  var who = String((payload && payload.by) || '');
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = saCostSheet_();
    var last = sheet.getLastRow();
    if (last > 1) sheet.getRange(2, 1, last - 1, SA_COST_HEADERS.length).clearContent();
    if (rows.length) {
      var now = new Date();
      sheet.getRange(2, 1, rows.length, SA_COST_HEADERS.length).setValues(rows.map(function (one) {
        return [
          String(one.target || ''),
          String(one.since || '').slice(0, 10),
          String(one.until || '').slice(0, 10),
          Number(one.cost) || 0,
          String(one.note || ''),
          who,
          now
        ];
      }));
    }
    return { ok: true, saved: rows.length, savedAt: new Date().toISOString() };
  } finally {
    lock.releaseLock();
  }
}

function saDayCount_(since, until) {
  if (!since || !until || until < since) return 0;
  var a = new Date(since + 'T00:00:00+09:00').getTime();
  var b = new Date(until + 'T00:00:00+09:00').getTime();
  if (!a || !b) return 0;
  return Math.round((b - a) / 86400000) + 1;
}

// 두 기간이 겹친 날수 (글자 날짜는 그대로 견줘도 된다 — YYYY-MM-DD 라서)
function saOverlapDays_(aSince, aUntil, bSince, bUntil) {
  var since = aSince > bSince ? aSince : bSince;
  var until = aUntil < bUntil ? aUntil : bUntil;
  return since > until ? 0 : saDayCount_(since, until);
}

// 대상 이름을 견줄 수 있는 꼴로 (공백 · 대소문자를 무시한다)
function saCostKey_(text) {
  return String(text || '').trim().toLowerCase().replace(/\s+/g, '');
}

// 여러 줄에 금액을 나눠 넣는다. 클릭 비중으로 나누고, 클릭이 하나도 없으면 고르게 나눈다.
function saSpread_(rows, money) {
  if (!rows.length || !money) return;
  var clicks = 0;
  rows.forEach(function (one) { clicks += Number(one.clicks) || 0; });
  rows.forEach(function (one) {
    var part = clicks ? (Number(one.clicks) || 0) / clicks : 1 / rows.length;
    one.spend += money * part;
  });
}

/* 적어 둔 광고비를 줄에 붙인다.
   광고그룹에 붙인 금액은 그 안의 소재에 클릭 비중으로 한 번 더 나눈다.
   adKey 는 소재 줄에서 '어느 광고그룹 것인지' 가 적힌 칸 이름이다
   (매체별 성과는 campaignId, 소재별 결과는 adsetId 에 광고그룹 번호를 담는다). */
function saApplyCost_(groupRows, adRows, adKey, since, until) {
  var out = { rows: 0, used: 0, total: 0 };
  // 시트를 못 읽어도 성과는 그대로 보여 준다 (광고비는 거들기지 본체가 아니다)
  var costs = [];
  try {
    costs = saCostRows_();
  } catch (error) {
    out.error = String(error && error.message ? error.message : error);
    return out;
  }
  out.rows = costs.length;
  if (!costs.length) return out;

  var byKey = {};
  var add = function (key, one) {
    if (!key) return;
    if (!byKey[key]) byKey[key] = [];
    if (byKey[key].indexOf(one) < 0) byKey[key].push(one);
  };
  groupRows.forEach(function (one) {
    add(saCostKey_(one.id), one);
    add(saCostKey_(one.name), one);
    add(saCostKey_(one.campaignId), one);
    add(saCostKey_(one.campaignName), one);
  });

  costs.forEach(function (row) {
    if (!row.cost || !row.since) return;
    // 종료일을 안 적었으면 '아직 도는 중' 으로 보고 조회 끝날까지로 친다
    var end = row.until || until;
    var span = saDayCount_(row.since, end);
    var share = saOverlapDays_(row.since, end, since, until);
    if (!span || !share) return;
    var targets = byKey[saCostKey_(row.target)];
    if (!targets || !targets.length) return;
    // 적은 값은 부가세 포함이다. 표에는 공급가(÷1.1)를 넣는다 (GFA 와 같은 기준).
    var money = netSpend_(row.cost) * (share / span);
    saSpread_(targets, money);
    out.used += 1;
    out.total += money;
  });

  // 광고그룹에 붙은 광고비를 그 안의 소재에 나눈다
  groupRows.forEach(function (group) {
    if (!group.spend) return;
    var mine = adRows.filter(function (one) { return String(one[adKey]) === group.id; });
    saSpread_(mine, group.spend);
  });
  return out;
}

/* 브랜드검색 성과. 캠페인 자리에 **광고그룹**, 광고그룹 자리에 **소재** 를 넣는다.
   광고비는 부가세 별도이고, 브랜드검색은 정액(CPT) 이라 고른 기간에 걸친 금액이다. */
function naverSaReport_(payload) {
  var when = naverDates_(payload);
  var got = saGather_(when.since, when.until, !!payload.refresh);
  var id = saProp_('NAVER_SA_CUSTOMER_ID');

  var groupOf = {};
  got.groups.forEach(function (one) { groupOf[one.id] = one; });

  var groupRows = got.groups.map(function (one) {
    var camp = got.campaignOf[one.campaignId] || {};
    return saRow_({
      id: one.id,
      name: one.name,
      campaignId: one.campaignId,
      campaignName: camp.name || '',
      objective: 'BRAND_SEARCH',
      status: one.status,
      active: one.status === 'ELIGIBLE',
      begin: camp.begin || '',
      end: camp.end || ''
    }, got.stats[one.id]);
  });

  var adRows = got.ads.map(function (one) {
    var group = groupOf[one.groupId] || {};
    var camp = got.campaignOf[group.campaignId] || {};
    return saRow_({
      id: one.id,
      name: one.name,
      // 캠페인 자리에 광고그룹을 넣었으므로, 소재의 '캠페인' 은 광고그룹이다
      campaignId: one.groupId,
      campaignName: group.name || '',
      objective: 'BRAND_SEARCH',
      status: one.status,
      active: one.status === 'ELIGIBLE',
      thumbnail: one.thumbnail,
      inspect: one.inspect,
      begin: camp.begin || '',
      end: camp.end || ''
    }, got.stats[one.id]);
  });

  // 사람이 적어 둔 광고비를 기간에 맞춰 붙인다 (매체는 정액이라 광고비를 안 준다)
  var money = saApplyCost_(groupRows, adRows, 'campaignId', when.since, when.until);

  return {
    ok: true,
    source: 'naverSa',
    account: { id: id, name: '네이버 검색광고 (' + id + ')', currency: 'KRW', timezone: 'Asia/Seoul' },
    range: when,
    fields: got.fields,
    hasConv: got.fields.indexOf('ccnt') >= 0,
    cost: money,
    // 광고비가 어디서 온 값인지 화면이 알 수 있게 함께 보낸다
    notice: money.used
      ? ('광고비는 「' + SA_COST_SHEET_NAME + '」 에 적어 둔 금액을 기간에 맞춰 나눈 값입니다 '
        + '(브랜드검색은 정액이라 매체가 광고비를 주지 않습니다). 적은 값은 부가세 포함이고, '
        + '표에는 공급가(÷1.1)가 들어갑니다.')
      : ('브랜드검색은 정액(CPT) 상품이라 검색광고 API 가 광고비를 주지 않습니다 — '
        + '「' + SA_COST_SHEET_NAME + '」 에 대상 · 기간 · 금액(부가세 포함)을 적어 두면 여기에 넣어 드립니다.'),
    costUrl: saCostUrl_(),
    campaigns: saSort_(groupRows.filter(saAlive_)),
    adsets: saSort_(adRows.filter(saAlive_)),
    fetchedAt: new Date().toISOString()
  };
}

// 소재별 결과. 브랜드검색 소재를 그대로 준다 (미리보기는 소재 속 이미지가 있을 때만).
function naverSaCreatives_(payload) {
  var when = naverDates_(payload);
  var got = saGather_(when.since, when.until, !!payload.refresh);
  var wantGroup = String((payload && payload.adset) || '');
  var wantCampaign = String((payload && payload.campaign) || '');

  var groupOf = {};
  got.groups.forEach(function (one) { groupOf[one.id] = one; });

  // 광고비를 나누려면 광고그룹 줄도 있어야 한다 (숫자는 위에서 받아 둔 것을 쓴다)
  var groupRows = got.groups.map(function (one) {
    return saRow_({
      id: one.id,
      name: one.name,
      campaignId: one.campaignId,
      campaignName: (got.campaignOf[one.campaignId] || {}).name || ''
    }, got.stats[one.id]);
  });

  var rows = got.ads.map(function (one) {
    var group = groupOf[one.groupId] || {};
    var camp = got.campaignOf[group.campaignId] || {};
    return saRow_({
      id: one.id,
      name: one.name,
      campaignId: group.campaignId || '',
      campaignName: camp.name || '',
      adsetId: one.groupId,
      adsetName: group.name || '',
      objective: 'BRAND_SEARCH',
      status: one.status,
      active: one.status === 'ELIGIBLE',
      thumbnail: one.thumbnail,
      copy: one.name,
      altCopy: '',
      kind: 'image',
      begin: camp.begin || '',
      end: camp.end || ''
    }, got.stats[one.id]);
  });

  // 사람이 적어 둔 광고비를 소재까지 나눠 붙인다 (매체별 성과와 같은 값이다)
  var money = saApplyCost_(groupRows, rows, 'adsetId', when.since, when.until);

  rows = saSort_(rows.filter(function (row) {
    if (!saAlive_(row)) return false;   // 몇 해 전에 멈춘 소재는 빼고 본다
    // 매체별 성과에서 넘어올 때는 광고그룹(= 그쪽 화면의 캠페인) 번호로 걸러 준다
    if (wantGroup) return row.adsetId === wantGroup;
    if (wantCampaign) return row.adsetId === wantCampaign || row.campaignId === wantCampaign;
    return true;
  }));

  return {
    ok: true,
    source: 'naverSa',
    scope: wantGroup || wantCampaign || saProp_('NAVER_SA_CUSTOMER_ID'),
    range: when,
    fields: got.fields,
    cost: money,
    creatives: rows,
    fetchedAt: new Date().toISOString()
  };
}

// 확인용으로 부를 수 있는 길. **읽기(GET)만** 하고, 이 앞자리로 시작하는 길만 받는다.
var SA_PEEK_PATHS = ['/ncc/', '/stats', '/master-reports', '/stat-reports'];

function saPeekOne_(one) {
  var path = String((one && one.path) || '');
  var ok = false;
  SA_PEEK_PATHS.forEach(function (head) { if (path.indexOf(head) === 0) ok = true; });
  if (!ok) return { ok: false, path: path, error: '확인용으로 열어 둔 길이 아닙니다.' };
  try {
    return { ok: true, path: path, params: one.params || null, body: saAsk_(path, one.params) };
  } catch (error) {
    return { ok: false, path: path, params: one.params || null,
      error: String(error && error.message ? error.message : error) };
  }
}

/* 맨 처음 붙일 때 쓰는 확인용. 응답을 손대지 않고 그대로 돌려준다 —
   필드 이름이 문서와 다르면 이걸로 바로 안다.
   tries 를 주면 그 길들을 차례로 읽어 본다 (한 번 배포해 두면 모양 확인에 다시 안 고쳐도 된다). */
function saPeek_(payload) {
  var tries = (payload && payload.tries) || null;
  if (tries && tries.length) {
    return { ok: true, source: 'naverSa', tries: tries.map(saPeekOne_) };
  }
  var since = String((payload && payload.since) || '').slice(0, 10);
  var until = String((payload && payload.until) || '').slice(0, 10);
  var out = { ok: true, source: 'naverSa' };
  var campaigns = saAsk_('/ncc/campaigns', { campaignType: 'BRAND_SEARCH' }) || [];
  out.campaignCount = Array.isArray(campaigns) ? campaigns.length : 0;
  out.campaignFirst = Array.isArray(campaigns) ? campaigns[0] : campaigns;
  if (out.campaignCount) {
    var groups = saAsk_('/ncc/adgroups',
      { nccCampaignId: campaigns[0].nccCampaignId }) || [];
    if (!Array.isArray(groups)) groups = [];
    out.groupCount = groups.length;
    out.groupFirst = groups[0] || null;
    if (out.groupCount) {
      var ads = saAsk_('/ncc/ads', { nccAdgroupId: groups[0].nccAdgroupId }) || [];
      out.adCount = Array.isArray(ads) ? ads.length : 0;
      out.adFirst = Array.isArray(ads) ? ads[0] : ads;
    }
    if (since && until) {
      try {
        out.stats = saAsk_('/stats', { ids: [String(campaigns[0].nccCampaignId)],
          fields: JSON.stringify(SA_FIELDS),
          timeRange: JSON.stringify({ since: since, until: until }) });
        out.statFields = SA_FIELDS;
      } catch (error) {
        out.statsError = error.message;
        out.stats = saAsk_('/stats', { ids: [String(campaigns[0].nccCampaignId)],
          fields: JSON.stringify(SA_FIELDS_PLAIN),
          timeRange: JSON.stringify({ since: since, until: until }) });
        out.statFields = SA_FIELDS_PLAIN;
      }
    }
  }
  return out;
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

// ── 시트 표 읽기 (여러 화면이 함께 쓴다) ────────────────────────────
// 사람이 손으로 짠 시트는 달마다 줄이 늘고 준다. 그래서 줄 · 열 번호로 잡지 않고
// 머리글 낱말로 찾아 표 하나를 { columns, groups, rows, total } 로 읽는다.
// 지금은 KOL 라이브 · 프로모션 캘린더가 쓴다.
// (월별 예산도 이 길로 시트를 읽었으나, 화면 안에서 짜는 형태로 바뀌어 떼어 냈다)
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

// ── 월별 예산 (화면 안에서 짠다) ───────────────────────────────────
// 예전에는 사람이 짜 둔 '퍼포먼스 마스터 시트' 를 읽어 그림으로만 보여 줬다. 그래서
// 고칠 일은 늘 시트에서 하고, 시트 모양이 조금만 바뀌어도 화면이 못 읽었다.
// 이제는 **화면에서 짜고 여기에 담는다.** 시트는 담아 두는 곳일 뿐이라 모양을 지킨다.
//
// 한 달이 한 줄이다. 값은 칸 하나에 JSON 으로 둔다 (칸이 늘어도 시트를 안 고치게).
//   총예산   그 달에 받은 퍼포먼스 예산 (사람이 맨 위에 적는다)
//   내용     SKU 배정 · 행사 줄 — 화면이 짜는 것 전부
//   사용액   매체별 성과에서 긁어 온 실제 광고비 (화면이 계정을 차례로 불러 모아 보낸다)
//
// 사용액을 여기에 함께 담는 까닭: 매체를 다 부르면 몇 분이 걸린다. 한 사람이 한 번 받아
// 두면 나머지 사람은 그 값을 그냥 본다. '언제 받은 값' 인지도 같이 적어 둔다.
var MONTH_BUDGET_SHEET_NAME = '월별예산';
var MONTH_BUDGET_HEADERS = ['월', '총예산', '내용(JSON)', '사용액(JSON)', '수정자', '수정시각'];

function monthBudgetSheet_(book) {
  book = book || SpreadsheetApp.openById(SHEET_ID);
  var sheet = book.getSheetByName(MONTH_BUDGET_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(MONTH_BUDGET_SHEET_NAME, book.getNumSheets());
    sheet.getRange(1, 1, 1, MONTH_BUDGET_HEADERS.length)
      .setValues([MONTH_BUDGET_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    // 월 칸은 글자로 둔다. 그냥 두면 시트가 '2026-09' 를 날짜로 바꿔 버려,
    // 시간대가 어긋나는 순간 앞 달로 읽히는 일이 생긴다.
    sheet.getRange('A:A').setNumberFormat('@');
    sheet.setColumnWidth(1, 90);
    sheet.setColumnWidth(2, 120);
    sheet.setColumnWidth(3, 520);
    sheet.setColumnWidth(4, 320);
  }
  return sheet;
}

// 월 칸은 시트가 날짜로 바꿔 둘 수도 있다. 늘 YYYY-MM 으로 읽는다.
function monthBudgetKey_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, 'Asia/Seoul', 'yyyy-MM');
  return String(value || '').trim().slice(0, 7);
}

function monthBudgetParse_(text, fallback) {
  try {
    var found = JSON.parse(String(text || 'null'));
    return found && typeof found === 'object' ? found : fallback;
  } catch (error) {
    return fallback;
  }
}

/* ── 사람이 읽는 거울 (월별 예산 시트) ─────────────────────────────────
   '월별예산' 탭은 앱이 읽는 자리라 한 달이 한 줄이고, 내용은 JSON 한 칸에 들어 있다.
   시트를 열어도 사람은 못 읽는다. 그래서 저장할 때마다 그 판을 **펴서** 옮겨 적는다.

   옮겨 적는 곳은 적재 시트가 아니라 **따로 만든 월별 예산 문서**다.
   앱의 적재 시트를 열지 않아도 되게 갈라 두었다.
   주소가 바뀌면 스크립트 속성 BUDGET_TABLE_SHEET_ID 에 새 주소(또는 ID)만 넣으면 된다.

   **탭 하나에 달을 쌓는다.** 예전에는 달마다 탭을 따로 만들었는데, 그러면 달이 늘수록
   탭이 늘고 여러 달을 한눈에 견주거나 피벗을 돌릴 수가 없다. 년 · 월 칸이 있으니
   한 판에 쌓아 두고 거르는 편이 낫다 — 다음 달이 생기면 아래에 이어 붙고,
   지난달 줄은 그 자리에 그대로 남는다.
   (예전에 만들어 둔 달별 탭은 **건드리지 않는다.** 지우지도 않고 더 만들지도 않는다)

   읽기 전용 거울이다 — 앱은 이 문서를 **절대 읽지 않는다.**
   여기서 고쳐도 앱에는 안 돌아가고, 다음 저장 때 덮인다.
   (두 곳에서 같은 값을 고칠 수 있게 두면 어느 쪽이 맞는지 아무도 모르게 된다.
    시트에서 고친 것을 앱으로 되돌리려면 어느 쪽이 이기는지부터 정해야 한다.)             */
var MONTH_TABLE_BOOK_ID = '1rWiV6YKrfB3MNvM7Kv7Alm3hmCquknpBOBeT-rxi2U8';
/* 탭 이름이 그 달이지만 **년 · 월 칸을 따로 둔다** — 탭을 여럿 모아 놓고 거르거나
   피벗을 돌릴 때 탭 이름은 값이 아니라서 쓸 수가 없다. 숫자로 넣는다 (2026 · 9). */
var MONTH_TABLE_HEADERS = ['년', '월', '구분', '카테고리', '상세 SKU', '판매채널 · 항목',
  '유형', '라이브일정', '광고시작', '광고종료', '목표수량', '목표 CPS',
  '브랜드검색비', '사용예정', '실사용비', '잔여비', '진행광고매체', '수정시각'];
// 돈 · 개수 칸 (위 차례에서 1부터 센다). 이 칸만 천 단위로 끊어 준다.
// 년 · 월은 여기 없다 — 끊어 주면 2026 이 '2,026' 으로 보인다.
var MONTH_TABLE_NUMS = [11, 12, 13, 14, 15, 16];
// 달을 쌓아 두는 탭. 없으면 맨 앞에 만든다 (늘 여는 탭이라 앞에 있어야 찾기 쉽다).
var MONTH_TABLE_TAB = '전체';

function monthTableBookId_() {
  var found = cleanToken_(PropertiesService.getScriptProperties().getProperty('BUDGET_TABLE_SHEET_ID'));
  var picked = found || MONTH_TABLE_BOOK_ID;
  var inside = String(picked).match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  return inside ? inside[1] : picked;
}

function monthTableUrl_() {
  return 'https://docs.google.com/spreadsheets/d/' + monthTableBookId_() + '/edit';
}

/* 쌓아 두는 탭. 없으면 맨 앞에 만든다. */
function budgetTableSheet_(book) {
  var sheet = book.getSheetByName(MONTH_TABLE_TAB);
  if (sheet) return { sheet: sheet, made: false };
  return { sheet: book.insertSheet(MONTH_TABLE_TAB, 0), made: true };
}

// 쌓여 있는 줄에서 그 줄이 어느 달인지 읽는다 (년 · 월 칸이 곧 열쇠다).
function budgetTableMonth_(line) {
  var year = Number(line[0]) || 0;
  var mon = Number(line[1]) || 0;
  if (!year || mon < 1 || mon > 12) return '';
  return year + '-' + ('0' + mon).slice(-2);
}

// 판 하나를 사람이 읽는 줄로 편다. 고정비를 먼저, 프로모션을 뒤에 둔다 (화면 차례와 같다).
function budgetTableRows_(month, plan, stamp) {
  var out = [];
  // '2026-09' → 2026 · 9. 숫자로 넣어야 거르기 · 피벗에서 그대로 쓴다.
  var year = Number(String(month).slice(0, 4)) || '';
  var mon = Number(String(month).slice(5, 7)) || '';
  var catOf = {};
  ((plan && plan.skus) || []).forEach(function (one) {
    catOf[String(one.name || '')] = String(one.category || '');
  });

  ((plan && plan.fixed) || []).forEach(function (one) {
    var want = Number(one.plan) || 0;
    var used = Number(one.used) || 0;
    out.push([year, mon, '고정비', String(one.category || ''),
      String(one.sku || '') || '공통', String(one.item || ''),
      '', '', '', '', '', '', '',
      want, used, want - used, '', stamp]);
  });

  ((plan && plan.rows) || []).forEach(function (one) {
    var goal = Number(one.goal) || 0;
    var cps = Number(one.cps) || 0;
    /* 광고비는 목표수량 × 목표 CPS. 그 줄에 금액을 직접 적어 두었으면 그것이 이긴다
       (정액 상품 · 협찬비처럼 수량으로 안 떨어지는 줄이 있다). 화면과 같은 셈이다.
       브랜드검색비는 더하지 않는다 — 고정비의 '브랜드검색' 에 이미 들어 있다.        */
    var want = (Number(one.cost) || 0) > 0 ? Number(one.cost) : goal * cps;
    var used = Number(one.used) || 0;
    out.push([year, mon, String(one.group || '') || '(구분 없음)',
      catOf[String(one.sku || '')] || '', String(one.sku || ''),
      String(one.channel || ''), String(one.kind || ''), String(one.live || ''),
      String(one.since || ''), String(one.until || ''),
      goal || '', cps || '', Number(one.brand) || '',
      want, used, want - used,
      ((one.media || []).join(' · ')), stamp]);
  });
  return out;
}

/* 쌓아 두는 탭을 그린다. 머리글 그대로 (년 · 월까지) 넣는다.
   **우리가 쓰는 칸만** 지운다 — 오른쪽에 사람이 적어 둔 메모가 있으면 살려 둔다. */
function budgetTableDraw_(sheet, rows) {
  var head = MONTH_TABLE_HEADERS;
  var grid = rows;
  var width = head.length;

  if (sheet.getMaxColumns() < width) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), width - sheet.getMaxColumns());
  }
  var need = grid.length + 1;
  if (sheet.getMaxRows() < need) sheet.insertRowsAfter(sheet.getMaxRows(), need - sheet.getMaxRows());

  /* **쓰던 만큼만 지운다.** getMaxRows() 는 손 안 댄 탭도 1000줄이라, 그만큼을
     지우는 것이 탭마다 한 번씩 그대로 기다리는 시간이 됐다. */
  var used = Math.max(sheet.getLastRow(), grid.length + 1);
  sheet.getRange(1, 1, used, width).clearContent();
  sheet.getRange(1, 1, 1, width).setValues([head]).setFontWeight('bold');
  if (grid.length) sheet.getRange(2, 1, grid.length, width).setValues(grid);
  sheet.setFrozenRows(1);
  /* 돈 · 개수 칸은 붙어 있다. 한 칸씩 여섯 번 부르던 것을 한 번에 건다
     (서식 걸기는 부를 때마다 시트를 한 번 다녀오는 일이다). */
  var from = MONTH_TABLE_NUMS[0];
  var span = MONTH_TABLE_NUMS[MONTH_TABLE_NUMS.length - 1] - from + 1;
  sheet.getRange(2, from, Math.max(grid.length, 1), span).setNumberFormat('#,##0');
  return grid.length;
}

/* 월별예산 탭을 거울 문서의 **탭 하나**에 쌓는다.
   onlyMonth 를 주면 그 달 줄만 새로 펴고, 나머지 달은 **시트에 있던 줄을 그대로** 옮겨 적는다.
   저장은 늘 한 달만 고치므로 나머지 달을 다시 펼 이유가 없다 — 그게 저장이 느린 까닭이었다.
   안 주면 보낸 달을 모두 다시 편다 (아침 자동 올리기 · [지금 한 번 올리기] 가 그 길로 온다).

   줄은 년 · 월 오름차순으로 놓는다. 그래서 다음 달이 생기면 맨 아래에 이어 붙고,
   지난달 줄은 있던 자리에 그대로 남는다.

   앱에서 지운 달은 여기서 지워지지 않는다 — 보낸 목록에 없으면 '이번에 안 고친 달' 로 보고
   시트에 있던 줄을 살려 둔다. 지나간 달을 기록으로 남겨 두는 것이 이 문서의 쓸모라서다. */
function budgetTableSync_(lines, onlyMonth) {
  var want = monthBudgetKey_(onlyMonth || '');
  var book = SpreadsheetApp.openById(monthTableBookId_());
  var found = budgetTableSheet_(book);
  var sheet = found.sheet;
  var width = MONTH_TABLE_HEADERS.length;

  // ① 이번에 새로 펼 달
  var fresh = {};
  lines.forEach(function (line) {
    var month = monthBudgetKey_(line[0]);
    if (!month) return;
    if (want && month !== want) return;
    var plan = monthBudgetParse_(line[2], null);
    if (!plan) return;
    var when = line[5] instanceof Date
      ? Utilities.formatDate(line[5], 'Asia/Seoul', 'yyyy-MM-dd HH:mm') : String(line[5] || '');
    fresh[month] = budgetTableRows_(month, plan, when);
  });

  // ② 시트에 쌓여 있던 줄 — 이번에 새로 펴는 달이 아니면 그대로 살린다
  var kept = {};
  var last = sheet.getLastRow();
  if (last > 1) {
    sheet.getRange(2, 1, last - 1, width).getValues().forEach(function (line) {
      var month = budgetTableMonth_(line);
      if (!month || fresh[month]) return;   // 달을 못 읽는 줄은 버린다 (빈 줄 · 메모 같은 것)
      if (!kept[month]) kept[month] = [];
      kept[month].push(line);
    });
  }

  // ③ 달 오름차순으로 이어 붙인다
  var months = [];
  Object.keys(fresh).forEach(function (month) { months.push(month); });
  Object.keys(kept).forEach(function (month) { if (!fresh[month]) months.push(month); });
  months.sort();

  var grid = [];
  months.forEach(function (month) {
    (fresh[month] || kept[month] || []).forEach(function (line) { grid.push(line); });
  });

  var total = budgetTableDraw_(sheet, grid);
  return { rows: total, tabs: 1, months: months.length,
    made: found.made ? [MONTH_TABLE_TAB] : [], url: monthTableUrl_() };
}

function monthBudgetRow_(line) {
  return {
    month: monthBudgetKey_(line[0]),
    total: Number(line[1] || 0),
    plan: monthBudgetParse_(line[2], { skus: [], rows: [] }),
    spend: monthBudgetParse_(line[3], null),
    updatedBy: String(line[4] || ''),
    updatedAt: line[5] instanceof Date ? line[5].toISOString() : String(line[5] || '')
  };
}

/* ── 추이 판매채널 (사람이 손으로 넣는다) ─────────────────────────────
   월별 예산의 프로모션 줄 이름('찰스엔터 비밀특가' · 'KOL 라이브')은 **행사 이름**이지
   판매채널이 아니다. 그 행사가 어느 채널에서 도는지는 예산에 적는 칸이 없어 사람만 안다.
   그래서 추이 화면에서 손으로 적고, 그 값을 여기에 담는다.

   브라우저에 두지 않는 까닭: 적은 사람 PC 에서만 보이면 팀이 같이 볼 수가 없다.
   달마다 따로 담는다 — 같은 이름으로 다른 채널을 돌린 달이 있을 수 있어서다.
   (화면은 지난달 값을 미리 채워 보여 준다. 그대로 두면 그 달 값으로 굳는다) */
var TREND_CHANNEL_SHEET_NAME = '추이판매채널';
var TREND_CHANNEL_HEADERS = ['달', '프로모션명', '판매채널', '수정자', '수정시각'];

function trendChannelSheet_(book) {
  book = book || SpreadsheetApp.openById(SHEET_ID);
  var sheet = book.getSheetByName(TREND_CHANNEL_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(TREND_CHANNEL_SHEET_NAME, book.getNumSheets());
    sheet.getRange(1, 1, 1, TREND_CHANNEL_HEADERS.length)
      .setValues([TREND_CHANNEL_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    // 달 칸은 글자로 둔다 (시트가 '2026-09' 를 날짜로 바꿔 두면 앞 달로 읽힐 수 있다)
    sheet.getRange('A:A').setNumberFormat('@');
    sheet.setColumnWidth(1, 90);
    sheet.setColumnWidth(2, 280);
    sheet.setColumnWidth(3, 160);
  }
  return sheet;
}

function trendChannelRows_(book) {
  var sheet = trendChannelSheet_(book);
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var out = [];
  sheet.getRange(2, 1, last - 1, TREND_CHANNEL_HEADERS.length).getValues().forEach(function (line) {
    var month = monthBudgetKey_(line[0]);
    var promo = String(line[1] || '').trim();
    if (!month || !promo) return;
    out.push({ month: month, promo: promo, channel: String(line[2] || '').trim() });
  });
  return out;
}

/* 한 칸만 고친다. 빈 값을 보내면 그 줄을 지운다 —
   비워 두는 것과 '지난달 값을 이어받는 것' 은 다르다. 줄이 있으면 '이 달은 비었다' 는 뜻이다.
   (줄을 지우면 화면이 다시 지난달 값을 이어받아 채운다) */
function trendChannelPut_(payload) {
  var month = monthBudgetKey_((payload && payload.month) || '');
  var promo = String((payload && payload.promo) || '').trim();
  if (!month) throw new Error('달이 비어 있습니다.');
  if (!promo) throw new Error('프로모션명이 비어 있습니다.');
  var channel = String((payload && payload.channel) || '').trim();
  var who = String((payload && payload.by) || '');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = trendChannelSheet_();
    var last = sheet.getLastRow();
    var at = 0;
    if (last > 1) {
      var have = sheet.getRange(2, 1, last - 1, 2).getValues();
      for (var i = 0; i < have.length; i++) {
        if (monthBudgetKey_(have[i][0]) !== month) continue;
        if (String(have[i][1]).trim() !== promo) continue;
        at = i + 2;
        break;
      }
    }
    if (!channel) {
      if (at) sheet.deleteRow(at);
      budgetStamp_(true);
      return { ok: true, month: month, promo: promo, removed: !!at };
    }
    if (!at) at = sheet.getLastRow() + 1;
    sheet.getRange(at, 1, 1, TREND_CHANNEL_HEADERS.length)
      .setValues([[month, promo, channel, who, new Date()]]);
    budgetStamp_(true);            // 담아 둔 추이를 버린다 (다음에 열면 새로 읽는다)
    return { ok: true, month: month, promo: promo, channel: channel,
      savedAt: new Date().toISOString() };
  } finally {
    lock.releaseLock();
  }
}

/* 판매채널별 달 추이.
   월별예산 탭을 **한 번만** 훑어 달 × 판매채널로 모아 준다.
   달마다 budgetGet 을 부르면 달이 늘어난 만큼 요청이 늘고, 이 웹앱은 팀 전체가
   실행 줄 하나를 같이 쓰기 때문에 그만큼 남의 화면이 밀린다. 그래서 한 번에 모은다.

   SKU 가 달라도 **판매채널이 같으면 한 줄로 합친다** — 채널 하나가 행사 하나라서다
   (같은 행사에 더 플렌더mini 와 MAX 를 함께 태우면 예산에는 두 줄로 적힌다).
   합칠 때 광고기간은 **가장 이른 시작 ~ 가장 늦은 종료**로 잡고,
   라이브일정은 적힌 것을 모아 둔다 (줄마다 다를 수 있다).

   매출채널 표(설정 탭 K:L)도 함께 준다 — 화면이 전매체 파일의 광고그룹 이름
   ('[행사]_타겟팅_**매출채널**') 을 판매채널에 붙일 때 쓴다. */
/* 담아 두는 시간. 예산을 고치면 아래 budgetStamp_ 가 번호를 올려 곧바로 새로 읽으므로,
   길게 담아 두어도 옛 숫자를 보는 일이 없다. */
var TREND_CACHE_SECONDS = 1800;   // 30분

/* 담아 둔 것을 버리는 **판 번호**. 열쇠에 이 번호를 넣어 두고, 예산 · 판매채널을 고칠 때
   번호를 올린다 — 번호가 바뀌면 옛 열쇠는 아무도 찾지 않으므로 그 자리에서 새로 읽는다.
   (네이버 적재가 쓰는 naverStamp_ 와 같은 방법이다) */
function budgetStamp_(bump) {
  var store = PropertiesService.getScriptProperties();
  var now = Number(store.getProperty('BUDGET_STAMP') || 0);
  if (bump) {
    now += 1;
    store.setProperty('BUDGET_STAMP', String(now));
  }
  return now;
}

function budgetTrend_(payload) {
  var cache = CacheService.getScriptCache();
  var key = 'budgetTrend|' + budgetStamp_(false);
  if (!(payload && payload.refresh)) {
    var hit = cacheGet_(cache, key);
    if (hit) {
      try {
        var kept = JSON.parse(hit);
        kept.cached = true;
        return kept;
      } catch (error) { /* 깨졌으면 다시 읽는다 */ }
    }
  }

  // 시트는 **한 번만 연다.** 달력 · 추이 판매채널 · 설정이 모두 같은 책이라,
  // 따로 열면 그만큼 고스란히 기다리는 시간이 된다.
  var book = SpreadsheetApp.openById(SHEET_ID);
  var sheet = monthBudgetSheet_(book);
  var last = sheet.getLastRow();
  var months = [];
  var cells = {};        // '달|채널' → 모은 값
  var channels = {};

  if (last > 1) {
    /* 앞 세 칸(월 · 총예산 · 내용)만 읽는다. 뒤의 **사용액(JSON)** 은 여기서 안 쓰는데
       달마다 수십~수백 KB라, 같이 읽으면 읽는 양이 곱절이 된다. */
    sheet.getRange(2, 1, last - 1, 3).getValues().forEach(function (line) {
      var month = monthBudgetKey_(line[0]);
      if (!month) return;
      if (months.indexOf(month) < 0) months.push(month);
      var plan = monthBudgetParse_(line[2], null);
      var rows = (plan && plan.rows) || [];
      if (!rows.length) return;

      rows.forEach(function (row) {
        var name = String(row.channel || '').trim() || '(판매채널 없음)';
        var key = month + '|' + name;
        if (!cells[key]) {
          cells[key] = { month: month, channel: name, plan: 0, used: 0, goal: 0, rows: 0,
            skus: [], live: [], since: '', until: '' };
          channels[name] = true;
        }
        var one = cells[key];
        var typed = Number(row.cost) || 0;
        one.plan += typed > 0 ? typed : (Number(row.goal) || 0) * (Number(row.cps) || 0);
        one.used += Number(row.used) || 0;
        one.goal += Number(row.goal) || 0;
        one.rows += 1;

        var sku = String(row.sku || '').trim();
        if (sku && one.skus.indexOf(sku) < 0) one.skus.push(sku);
        var live = String(row.live || '').trim();
        if (live && one.live.indexOf(live) < 0) one.live.push(live);

        // 광고기간은 합친 줄 전체를 감싸는 기간으로 잡는다
        var since = String(row.since || '').slice(0, 10);
        var until = String(row.until || '').slice(0, 10);
        if (since && (!one.since || since < one.since)) one.since = since;
        if (until && (!one.until || until > one.until)) one.until = until;
      });
    });
  }

  months.sort();
  var out = [];
  Object.keys(cells).forEach(function (key) { out.push(cells[key]); });

  // 사람이 손으로 적어 둔 판매채널. 못 읽어도 추이는 그대로 보여 준다.
  var manual = [];
  try { manual = trendChannelRows_(book); } catch (error) { manual = []; }

  // 행사채널 → 매출채널 (광고그룹 이름 마지막 토막). 못 읽어도 추이는 그대로 보여 준다.
  var sales = [];
  try {
    var config = book.getSheetByName(CONFIG_SHEET_NAME);
    if (config) sales = configRead_(config, 11, 2);
  } catch (error) { sales = []; }

  var result = {
    ok: true,
    months: months,
    channels: Object.keys(channels).sort(),
    cells: out,
    sales: sales,
    manual: manual,
    // 제휴처럼 한글 판매채널이 영문 광고그룹으로 도는 것은 규칙으로 못 붙는다.
    // 실사용비를 받을 때 쓰는 그 표를 그대로 준다 (한 군데서만 고치게).
    channelAds: BUDGET_CHANNEL_ADS.map(function (one) {
      return { channel: one.channel, match: one.match };
    }),
    url: 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit',
    fetchedAt: new Date().toISOString()
  };

  cachePut_(cache, key, JSON.stringify(result), TREND_CACHE_SECONDS);
  return result;
}

// 고른 달 하나를 준다. 어떤 달이 있는지도 함께 준다 (화면의 달 고르개가 쓴다).
function budgetGet_(payload) {
  var want = monthBudgetKey_((payload && payload.month) || '')
    || Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM');
  var sheet = monthBudgetSheet_();
  var last = sheet.getLastRow();
  var months = [];
  var found = null;
  if (last > 1) {
    sheet.getRange(2, 1, last - 1, MONTH_BUDGET_HEADERS.length).getValues().forEach(function (line) {
      var month = monthBudgetKey_(line[0]);
      if (!month) return;
      if (months.indexOf(month) < 0) months.push(month);
      if (month === want && !found) found = monthBudgetRow_(line);
    });
  }
  months.sort();
  return {
    ok: true,
    month: want,
    months: months,
    // 그 달을 아직 안 짰으면 빈 판을 준다 (화면이 바로 적기 시작할 수 있게)
    budget: found || { month: want, total: 0, plan: { skus: [], rows: [] }, spend: null,
      updatedBy: '', updatedAt: '' },
    url: 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit',
    // 사람이 보는 월별 예산 문서 (달마다 탭 하나). [시트 열기] 가 이쪽으로 간다.
    tableUrl: monthTableUrl_(),
    // 아침 자동 올리기 — 켜져 있나 · 마지막으로 언제 돌았나
    auto: { on: budgetDailyOn_(), hour: BUDGET_DAILY_HOUR, last: budgetDailyLast_() },
    fetchedAt: new Date().toISOString()
  };
}

// 한 달의 줄만 고친다. 다른 달은 건드리지 않는다 (달마다 짜는 사람이 다르다).
// spend 를 안 보내면 이미 담아 둔 사용액을 그대로 살려 둔다 — 예산을 고칠 때마다
// 몇 분 걸려 받아 둔 사용액이 지워지면 안 된다.
function budgetPut_(payload) {
  var month = monthBudgetKey_((payload && payload.month) || '');
  if (!month) throw new Error('저장할 달이 비어 있습니다.');
  var who = String((payload && payload.by) || '');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = monthBudgetSheet_();
    var last = sheet.getLastRow();
    var at = 0;
    var kept = null;
    /* 자리를 찾을 때는 **월 칸만** 읽는다. 여섯 칸을 다 읽으면 달마다 수십~수백 KB인
       내용 · 사용액 JSON 을 열두 달치 끌어오게 된다 — 찾는 데는 쓰지도 않는 값이다. */
    if (last > 1) {
      var months = sheet.getRange(2, 1, last - 1, 1).getValues();
      for (var i = 0; i < months.length; i++) {
        if (monthBudgetKey_(months[i][0]) !== month) continue;
        at = i + 2;
        kept = monthBudgetRow_(sheet.getRange(at, 1, 1, MONTH_BUDGET_HEADERS.length).getValues()[0]);
        break;
      }
    }

    var plan = (payload && payload.plan) || (kept ? kept.plan : { skus: [], rows: [] });
    var total = payload && payload.total !== undefined && payload.total !== null
      ? Number(payload.total) || 0 : (kept ? kept.total : 0);
    var spend = payload && payload.spend !== undefined ? payload.spend : (kept ? kept.spend : null);

    if (!at) at = sheet.getLastRow() + 1;
    var line = [month, total, JSON.stringify(plan), spend ? JSON.stringify(spend) : '', who, new Date()];
    sheet.getRange(at, 1, 1, MONTH_BUDGET_HEADERS.length).setValues([line]);

    /* 사람이 읽는 거울 탭도 다시 그린다 — **방금 고친 달 하나만.**
       시트를 다시 읽지 않고 방금 쓴 줄을 그대로 넘긴다 (막 쓴 값이라 같은 값이다).
       거울이 안 되더라도 저장은 성공이다 — 앱이 읽는 자리는 위의 '월별예산' 탭이고,
       거울은 시트를 열어 보는 사람을 위한 것이라서다. */
    var tableNote = '';
    var table = { rows: 0, tabs: 0, months: 0, made: [], url: monthTableUrl_() };
    try {
      table = budgetTableSync_([line], month);
    } catch (error) {
      tableNote = String((error && error.message) || error);
    }

    budgetStamp_(true);            // 예산이 바뀌었으니 담아 둔 추이를 버린다
    return { ok: true, month: month, savedAt: new Date().toISOString(),
      tableRows: table.rows, tableTabs: table.tabs, tableMonths: table.months,
      tableMade: table.made, tableUrl: table.url, tableNote: tableNote };
  } finally {
    lock.releaseLock();
  }
}
/* ── 아침마다 저절로 올리기 (시간 트리거) ──────────────────────────────
   사람이 [구글시트 받기] 를 누르는 것과 **같은 일**을 서버가 혼자 한다 —
   이 달 실사용비를 매체에서 받아 채우고, 적재 시트에 담고, 월별 예산 문서를 다시 그린다.

   켜는 법: 시트 메뉴 UTM → '월별 예산 · 아침 자동 올리기 켜기'.
   (트리거는 **켠 사람의 권한**으로 돈다. 그 사람이 월별 예산 문서에 편집 권한이 있어야 한다)

   화면에서 하던 '어느 줄에 넣을지 고르는 규칙' 을 여기로 옮겨 왔다. 같은 규칙이 두 곳에
   있으면 언젠가 갈라지므로, 고칠 때는 app.js 의 fixedPull 과 **함께** 고쳐야 한다.
   화면 쪽을 없애지 않은 까닭: 사람이 아무 때나 눌러 지금 값을 보고 싶어 하기 때문이다.   */
var BUDGET_DAILY_FN = 'budgetDailyRun';
var BUDGET_DAILY_HOUR = 11;                 // 한국 시간 오전 11시
var BUDGET_DAILY_MARK = 'BUDGET_DAILY_LAST';
var BUDGET_DAILY_ON = 'BUDGET_DAILY_ON';

// 화면(app.js) 의 SKU_TREE 와 같아야 한다
var BUDGET_SKU_TREE = [
  ['더 플렌더', ['더 플렌더mini', '더 플렌더MAX', '더 플렌더PRO']],
  ['생활가전', ['더 에어드라이', '더 시프트']]
];

// 제품 이름은 곳마다 조금씩 다르게 적힌다 — '더 플렌더MAX' 와 '더 플렌더(MAX)'.
// 띄어쓰기 · 괄호 · 대소문자를 지워 같은 열쇠로 만든다.
function budgetNameKey_(name) {
  return String(name || '').toLowerCase().replace(/[\s()_·\-.]/g, '');
}

/* 캠페인에서 발라낸 제품 이름이 갈 자리를 정한다.
     상세 SKU 와 같으면 그 줄로, 카테고리와 같으면 그 카테고리의 **공통** 줄로.
   둘 다 아니면 null — 못 붙였다고 남기고 사람이 손으로 옮긴다. */
function budgetSpotOf_(product) {
  var want = budgetNameKey_(product);
  if (!want) return null;
  var found = null;
  BUDGET_SKU_TREE.forEach(function (pair) {
    if (found) return;
    pair[1].forEach(function (sku) {
      if (!found && budgetNameKey_(sku) === want) found = { category: pair[0], sku: sku };
    });
  });
  if (found) return found;
  BUDGET_SKU_TREE.forEach(function (pair) {
    if (!found && budgetNameKey_(pair[0]) === want) found = { category: pair[0], sku: '' };
  });
  return found;
}

function budgetUid_() {
  return 'a' + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

// 받아 온 광고비를 판에 채운다. 화면의 fixedPull 과 같은 규칙이다.
function budgetFillSpend_(plan, body) {
  var note = { filled: 0, made: 0, missed: [], channels: [], many: [], none: [] };
  if (!plan.fixed) plan.fixed = [];
  if (!plan.rows) plan.rows = [];

  // 고정비 — 항목 × 카테고리 × 상세SKU 한 칸에 모아 넣는다
  var found = {};
  (body.rows || []).forEach(function (row) {
    var spot = budgetSpotOf_(row.product);
    if (!spot) { note.missed.push(row.campaign); return; }
    var key = row.item + '|' + spot.category + '|' + spot.sku;
    // salesAmt 는 부가세 별도다 — 그대로 쓴다 (공급가 기준)
    found[key] = (found[key] || 0) + Math.round(row.spend);
  });
  plan.fixedAt = { at: new Date().toISOString(), gfa: body.gfaLoadedAt || '' };

  Object.keys(found).forEach(function (key) {
    var parts = key.split('|');
    var line = null;
    plan.fixed.forEach(function (one) {
      if (line) return;
      if (String(one.item) === parts[0] && String(one.category || '') === parts[1]
        && String(one.sku || '') === parts[2]) line = one;
    });
    if (!line) {
      line = { id: budgetUid_(), category: parts[1], sku: parts[2], item: parts[0], plan: 0, used: 0 };
      plan.fixed.push(line);
      note.made += 1;
    }
    line.used = found[key];
    note.filled += 1;
  });

  /* 판매채널 — 규칙에 걸린 줄의 실사용비를 채운다.
     같은 판매채널 줄이 여럿이면 **건드리지 않는다.** 어느 줄 몫인지 알 수 없어서다
     (사람이 손으로 나눠 적는다). 조용히 한 줄에 몰아 넣으면 나머지가 0 으로 남는다. */
  (body.channels || []).forEach(function (one) {
    var want = String(one.channel || '').trim();
    var mine = plan.rows.filter(function (row) {
      return String(row.channel || '').trim() === want;
    });
    if (!mine.length) { if (one.spend) note.none.push(want); return; }
    if (mine.length > 1) { note.many.push(want); return; }
    mine[0].used = one.spend;
    note.channels.push(want);
  });

  return note;
}

// 그 달의 말일 (2월 · 31일 달을 손으로 세지 않는다)
function budgetLastDay_(month) {
  var year = Number(String(month).slice(0, 4));
  var at = Number(String(month).slice(5, 7));
  return new Date(year, at, 0).getDate();
}

/* 한 달을 받아 채우고 담고 거울까지 그린다.
   매체를 부르는 동안에는 **자물쇠를 잡지 않는다** — 몇 초에서 몇십 초가 걸리는데
   그동안 다른 사람의 저장까지 멈추기 때문이다. 잠그는 것은 읽고 쓰는 순간뿐이다. */
function budgetDaily_(want) {
  var month = monthBudgetKey_(want || '')
    || Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM');
  var sheet = monthBudgetSheet_();

  // ① 아직 짜 두지 않은 달이면 매체를 부르지 않는다.
  //    없는 달을 만들어 두면 달 고르개에 '짜다 만 달' 이 생긴다. 거울만 다시 그린다.
  var last = sheet.getLastRow();
  var planned = false;
  if (last > 1) {
    sheet.getRange(2, 1, last - 1, 1).getValues().forEach(function (line) {
      if (monthBudgetKey_(line[0]) === month) planned = true;
    });
  }
  if (!planned) {
    var only = budgetTableSync_(last > 1
      ? sheet.getRange(2, 1, last - 1, MONTH_BUDGET_HEADERS.length).getValues() : []);
    return { ok: true, month: month, planned: false, ranAt: new Date().toISOString(),
      tabs: only.tabs, rows: only.rows, url: only.url,
      note: month + ' 은 아직 짜 두지 않아 실사용비는 받지 않았습니다 (거울만 다시 그렸습니다).' };
  }

  // ② 매체에서 이 달 실사용비를 받는다 (자물쇠 밖에서)
  var body = budgetFixedSpend_({ since: month + '-01',
    until: month + '-' + ('0' + budgetLastDay_(month)).slice(-2) });

  // ③ 읽고 · 채우고 · 쓰고 · 거울까지 (여기만 잠근다)
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var rows = sheet.getLastRow() > 1
      ? sheet.getRange(2, 1, sheet.getLastRow() - 1, MONTH_BUDGET_HEADERS.length).getValues() : [];
    var at = 0;
    var kept = null;
    for (var i = 0; i < rows.length; i++) {
      if (monthBudgetKey_(rows[i][0]) !== month) continue;
      at = i + 2;
      kept = monthBudgetRow_(rows[i]);
      break;
    }
    if (!at) throw new Error(month + ' 줄이 사라졌습니다 (받는 사이에 지워진 듯합니다).');

    var plan = kept.plan || { skus: [], rows: [] };
    var note = budgetFillSpend_(plan, body);

    sheet.getRange(at, 1, 1, MONTH_BUDGET_HEADERS.length).setValues([[
      month, kept.total, JSON.stringify(plan),
      kept.spend ? JSON.stringify(kept.spend) : '', '자동 올리기', new Date()
    ]]);

    rows[at - 2] = sheet.getRange(at, 1, 1, MONTH_BUDGET_HEADERS.length).getValues()[0];
    var table = budgetTableSync_(rows);

    return { ok: true, month: month, planned: true, ranAt: new Date().toISOString(),
      filled: note.filled, made: note.made, channels: note.channels,
      many: note.many, none: note.none, missed: note.missed.length,
      gfaNote: body.gfaNote || '', channelNotes: body.channelNotes || [],
      tabs: table.tabs, rows: table.rows, made2: table.made, url: table.url };
  } finally {
    lock.releaseLock();
  }
}

// 마지막으로 돈 결과를 적어 둔다. 화면이 '언제 올라갔나' 를 보여 줄 수 있게.
// 스크립트 속성은 9KB 까지라 짧게만 남긴다.
function budgetDailyMark_(found) {
  var slim = {
    at: found.ranAt || new Date().toISOString(),
    ok: found.ok !== false,
    month: found.month || '',
    tabs: found.tabs || 0,
    rows: found.rows || 0,
    note: String(found.note || found.error || '').slice(0, 300)
  };
  slim.how = found.how || '';
  try {
    PropertiesService.getScriptProperties().setProperty(BUDGET_DAILY_MARK, JSON.stringify(slim));
  } catch (error) { /* 적어 두기는 거들기다 */ }
  return slim;
}

function budgetDailyLast_() {
  try {
    var raw = PropertiesService.getScriptProperties().getProperty(BUDGET_DAILY_MARK);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

/* 자동 올리기가 돌 때마다 한 줄씩 적어 둔다.
   이게 없으면 '돌았는데 실패' 인지 '아예 안 돌았는지' 를 가릴 수가 없다 —
   트리거는 조용히 돌고 조용히 죽어서, 시트만 봐서는 둘이 똑같아 보인다.
   Apps Script 의 실행 기록으로도 볼 수 있지만, 시트를 보는 사람은 거기까지 안 간다.
   줄이 끝없이 쌓이지 않게 마지막 몇 백 줄만 남긴다.                                   */
var BUDGET_LOG_SHEET_NAME = '자동올리기기록';
var BUDGET_LOG_HEADERS = ['시각', '결과', '달', '탭', '줄', '어떻게', '메모'];
var BUDGET_LOG_KEEP = 300;

function budgetLogSheet_() {
  var book = SpreadsheetApp.openById(SHEET_ID);
  var sheet = book.getSheetByName(BUDGET_LOG_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(BUDGET_LOG_SHEET_NAME, book.getNumSheets());
    sheet.getRange(1, 1, 1, BUDGET_LOG_HEADERS.length)
      .setValues([BUDGET_LOG_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(7, 520);
  }
  return sheet;
}

// how 는 '자동(트리거)' 또는 '손으로' — 아침에 저절로 돈 것인지 가릴 수 있어야 한다.
function budgetDailyLog_(slim, how) {
  try {
    var sheet = budgetLogSheet_();
    sheet.appendRow([
      new Date(), slim.ok ? '성공' : '실패', slim.month || '',
      slim.tabs || 0, slim.rows || 0, how || '', String(slim.note || '').slice(0, 500)
    ]);
    // 오래된 줄은 지운다 (머리글 한 줄 + 남길 줄)
    var over = sheet.getLastRow() - (BUDGET_LOG_KEEP + 1);
    if (over > 0) sheet.deleteRows(2, over);
  } catch (error) { /* 기록은 거들기다. 여기서 넘어져도 올리기는 이미 끝났다 */ }
}

// 트리거가 부르는 자리. **오류를 밖으로 던지지 않는다** — 던지면 구글이 트리거를 몇 번
// 실패시킨 뒤 통째로 꺼 버린다. 대신 까닭을 적어 두고 다음 날 다시 시도한다.
function budgetDailyRun(event) {
  var found;
  try {
    found = budgetDaily_();
  } catch (error) {
    found = { ok: false, error: String((error && error.message) || error),
      ranAt: new Date().toISOString() };
  }
  // 트리거가 부르면 event 가 들어온다. 메뉴에서 누르면 안 들어온다.
  // 이 한 칸이 '아침에 진짜 돌았나' 를 가리는 유일한 표다.
  found.how = event ? '자동(트리거)' : '손으로';
  var slim = budgetDailyMark_(found);
  budgetDailyLog_(slim, slim.how);
  Logger.log(JSON.stringify(found));
  return slim;
}

// 이 스크립트가 걸어 둔 자동 올리기 트리거들
function budgetDailyTriggers_() {
  return ScriptApp.getProjectTriggers().filter(function (one) {
    return one.getHandlerFunction() === BUDGET_DAILY_FN;
  });
}

function budgetDailyClear_() {
  var gone = 0;
  budgetDailyTriggers_().forEach(function (one) { ScriptApp.deleteTrigger(one); gone += 1; });
  return gone;
}

/* 켜져 있나. **트리거를 직접 세지 않는다** — 트리거를 읽으려면 권한이 하나 더 필요해서,
   승인 전에는 그 한 줄 때문에 월별 예산 화면이 통째로 못 열린다.
   켜고 끌 때 여기 적어 두고, 화면은 이것만 읽는다. */
function budgetDailyOn_(value) {
  var store = PropertiesService.getScriptProperties();
  if (value !== undefined) store.setProperty(BUDGET_DAILY_ON, value ? '1' : '');
  return String(store.getProperty(BUDGET_DAILY_ON) || '') === '1';
}

/* 트리거를 다루려면 권한(scope)이 하나 더 있어야 한다 —
     https://www.googleapis.com/auth/script.scriptapp
   Apps Script 는 보통 쓰는 코드를 보고 권한을 알아서 붙이는데, 이 프로젝트처럼
   appsscript.json 에 oauthScopes 를 **손으로 적어 둔** 경우에는 안 붙는다.
   그때 '지정된 권한으로는 ScriptApp.getProjectTriggers 를 호출할 수 없습니다' 가 뜬다.

   메뉴가 통째로 죽지 않게 붙잡아, 무엇을 하면 되는지 그대로 알려 준다.
   권한을 못 넣는 상황도 있으므로 손으로 트리거를 거는 길도 함께 적어 둔다 —
   그 길은 budgetDailyRun 만 부르므로 이 권한이 아예 필요 없다.                        */
var BR2 = "\n\n";   // 줄바꿈 둘 (알림창 문단 나누기)
var BUDGET_DAILY_SCOPE = 'https://www.googleapis.com/auth/script.scriptapp';

function budgetDailyHelp_(error) {
  return '트리거를 다루려면 권한이 하나 더 필요합니다.\n\n'
    + (error ? String((error && error.message) || error) + '\n\n' : '')
    + '── 둘 중 하나만 하시면 됩니다 ──\n\n'
    + '① 권한 한 줄 넣기 (메뉴로 켜고 끌 수 있게 됩니다)\n'
    + '   Apps Script → 프로젝트 설정(톱니)\n'
    + '   → "appsscript.json 매니페스트 파일을 편집기에 표시" 켜기\n'
    + '   → 편집기에서 appsscript.json 을 열고 oauthScopes 목록에 이 줄을 더합니다\n'
    + '       "' + BUDGET_DAILY_SCOPE + '"\n'
    + '   → 저장하고 이 메뉴를 다시 누르면 권한 창이 한 번 뜹니다 (승인)\n\n'
    + '② 손으로 트리거 걸기 (권한을 안 건드리는 길)\n'
    + '   Apps Script 왼쪽 ⏰ 트리거 → 트리거 추가\n'
    + '     실행할 함수 : budgetDailyRun\n'
    + '     이벤트 소스 : 시간 기반\n'
    + '     트리거 유형 : 일 단위 타이머\n'
    + '     시간       : 오전 11시~정오\n'
    + '   → 저장한 뒤 UTM → 월별 예산 → "손으로 건 트리거 표시하기" 를 한 번 눌러 주세요.\n'
    + '     (화면에 "아침 11시에 저절로 올라갑니다" 가 뜨게 하는 표시일 뿐입니다)\n\n'
    + '   ※ ② 로 걸면 프로젝트 시간대를 따릅니다. 프로젝트 설정에서 시간대가\n'
    + '     (GMT+09:00) 서울 인지 확인해 주세요.';
}

// 손으로 건 트리거를 화면에 알려 주기 위한 표시. 트리거를 만들지는 않는다.
function budgetDailyMarkOn() {
  budgetDailyOn_(true);
  var message = '켜짐으로 표시했습니다.\n\n'
    + '월별 예산 화면에 "아침 ' + BUDGET_DAILY_HOUR + '시에 저절로 올라갑니다" 가 뜹니다.\n'
    + '표시일 뿐이라, Apps Script 트리거 화면에 budgetDailyRun 이 실제로 걸려 있어야 합니다.\n\n'
    + '끄실 때는 트리거를 지우고 "아침 자동 올리기 끄기" 를 눌러 주세요.';
  Logger.log(message);
  try { SpreadsheetApp.getUi().alert(message); } catch (ignore) { /* 로그로만 */ }
  return message;
}

/* 아침 자동 올리기를 켠다 (시트 메뉴에서 부른다).
   두 번 눌러도 트리거가 겹치지 않게 먼저 지우고 하나만 건다.
   구글의 일별 트리거는 '정각' 이 아니라 **그 시각 앞뒤로 조금 흔들린다** —
   nearMinute(0) 을 붙여도 10:45~11:15 사이다. 하루 한 번이면 그 정도로 충분하다. */
function budgetDailyInstall() {
  var message;
  try {
    budgetDailyClear_();
    ScriptApp.newTrigger(BUDGET_DAILY_FN).timeBased()
      .atHour(BUDGET_DAILY_HOUR).nearMinute(0).everyDays(1).inTimezone('Asia/Seoul').create();
  } catch (error) {
    // 권한이 없으면 무엇을 하면 되는지 알려 준다 (날것의 예외를 그대로 보여 주지 않는다)
    message = budgetDailyHelp_(error);
    Logger.log(message);
    try { SpreadsheetApp.getUi().alert(message); } catch (ignore) { /* 로그로만 */ }
    return message;
  }
  budgetDailyOn_(true);
  message = '아침 자동 올리기를 켰습니다.\n\n'
    + '한국 시간 매일 오전 ' + BUDGET_DAILY_HOUR + '시쯤(10:45~11:15) 이 달 실사용비를 매체에서 받아\n'
    + '월별 예산 문서에 올립니다.\n\n' + monthTableUrl_()
    + '\n\n· 트리거는 켠 사람' + (budgetDailyWho_() ? '(' + budgetDailyWho_() + ')' : '') + '의 권한으로 돕니다.\n'
    + '· 그 계정이 월별 예산 문서에 편집 권한이 있어야 합니다.\n'
    + '· 아직 짜 두지 않은 달은 건드리지 않습니다.';
  Logger.log(message);
  try { SpreadsheetApp.getUi().alert(message); } catch (ignore) { /* 로그로만 */ }
  return message;
}

function budgetDailyRemove() {
  var message;
  var gone = 0;
  try {
    gone = budgetDailyClear_();
  } catch (error) {
    // 권한이 없어 못 지운다. 표시만 끄고 손으로 지우는 길을 알려 준다.
    budgetDailyOn_(false);
    message = '표시는 껐습니다. 트리거는 Apps Script 의 ⏰ 트리거 화면에서 '
      + 'budgetDailyRun 을 직접 지워 주세요.' + BR2 + budgetDailyHelp_(error);
    Logger.log(message);
    try { SpreadsheetApp.getUi().alert(message); } catch (ignore) { /* 로그로만 */ }
    return message;
  }
  budgetDailyOn_(false);
  message = gone ? ('아침 자동 올리기를 껐습니다 (트리거 ' + gone + '개).')
    : '켜져 있는 자동 올리기가 없습니다.';
  Logger.log(message);
  try { SpreadsheetApp.getUi().alert(message); } catch (ignore) { /* 로그로만 */ }
  return message;
}

/* 담아 둘 때는 UTC(ISO) 로 둔다 — 화면이 그걸 받아 브라우저 시간으로 그린다.
   알림창은 사람이 바로 읽는 자리라 한국 시간으로 편다.
   ('…T05:56:51Z' 를 아침 11시와 견주려면 머릿속으로 9시간을 더해야 한다) */
/* 이메일을 읽으려면 권한이 또 하나 필요하다 (userinfo.email).
   알림창에 '누구 권한으로 돕니다' 를 적자고 권한을 늘릴 이유가 없다 — 못 읽으면 안 적는다.
   이것 하나 때문에 [켜기] 가 통째로 막혔었다. */
function budgetDailyWho_() {
  try {
    return String(Session.getEffectiveUser().getEmail() || '');
  } catch (error) {
    return '';
  }
}

function budgetDailyWhen_(iso) {
  if (!iso) return '';
  var when = new Date(iso);
  if (!when || isNaN(when.getTime())) return String(iso);
  return Utilities.formatDate(when, 'Asia/Seoul', 'yyyy-MM-dd HH:mm') + ' (한국)';
}

// 지금 켜져 있나 · 마지막으로 언제 돌았나 (메뉴에서 확인용)
function budgetDailyCheck() {
  var on = -1;                     // -1 = 권한이 없어 트리거를 못 읽었다
  try {
    on = budgetDailyTriggers_().length;
    budgetDailyOn_(on > 0);        // 편집기에서 손으로 지웠을 수도 있다 — 여기서 맞춰 둔다
  } catch (error) { on = -1; }
  var last = budgetDailyLast_();
  var message = (on < 0
    ? ('트리거를 읽을 권한이 없습니다. 표시는 ' + (budgetDailyOn_() ? '켜짐' : '꺼짐') + ' 입니다. '
      + '(Apps Script → ⏰ 트리거 에서 budgetDailyRun 이 걸려 있는지 직접 보실 수 있습니다)')
    : on ? '켜져 있습니다 (트리거 ' + on + '개 · 매일 오전 ' + BUDGET_DAILY_HOUR + '시쯤).'
      : '꺼져 있습니다. UTM 메뉴 → 월별 예산 → 아침 자동 올리기 켜기.')
    + '\n\n' + (last
      ? ('마지막 실행 ' + budgetDailyWhen_(last.at)
        + (last.how ? ' · ' + last.how : '') + '\n'
        + last.month + ' · 탭 ' + last.tabs + '개 · ' + last.rows + '줄'
        + (last.ok ? '' : ' · 실패') + (last.note ? '\n' + last.note : ''))
      : '아직 한 번도 돌지 않았습니다.')
    + '\n\n' + monthTableUrl_();
  Logger.log(message);
  try { SpreadsheetApp.getUi().alert(message); } catch (ignore) { /* 로그로만 */ }
  return message;
}

// 한 달을 통째로 지운다. 줄을 없애므로 달 고르개에서도 사라진다.
// (빈 값으로 덮지 않고 줄을 지우는 까닭: 남겨 두면 '짜다 만 달' 처럼 보인다)
function budgetDrop_(payload) {
  var month = monthBudgetKey_((payload && payload.month) || '');
  if (!month) throw new Error('지울 달이 비어 있습니다.');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = monthBudgetSheet_();
    var last = sheet.getLastRow();
    if (last < 2) return { ok: true, month: month, removed: 0 };
    var have = sheet.getRange(2, 1, last - 1, 1).getValues();
    var gone = 0;
    for (var i = have.length - 1; i >= 0; i--) {      // 아래에서부터 (줄 번호가 밀리지 않게)
      if (monthBudgetKey_(have[i][0]) === month) { sheet.deleteRow(i + 2); gone++; }
    }
    if (gone) budgetStamp_(true);
    return { ok: true, month: month, removed: gone };
  } finally {
    lock.releaseLock();
  }
}

// ── 프로모션 (세일즈팀 미닉스 워크스페이스 · 행사 캘린더 시트 미러) ──────────
// 프로모션 등록·수정은 세일즈팀 도구(미닉스)에서 한다. 그쪽이 저장할 때마다
// 이 시트에 월별 탭(YYYY-MM)으로 그대로 복사해 두므로, 여기서는 읽기만 한다.
var PROMO_CAL_SHEET_ID = '1H-UF2HBQD9sv-g81eCQ61lgdfK6TTHuEwsviVYkO1lw';
var PROMO_CAL_CACHE_SECONDS = 300;
var PROMO_CAL_UNDATED = '미정';   // 시작일 없는 행사가 모이는 탭

// 달이 바뀌어 시트를 새로 만들면 스크립트 속성 PROMO_CAL_SHEET_ID 에 새 주소만 넣으면 된다.
function promoCalSheetId_() {
  var found = cleanToken_(PropertiesService.getScriptProperties().getProperty('PROMO_CAL_SHEET_ID'));
  var picked = found || PROMO_CAL_SHEET_ID;
  var inside = String(picked).match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  return inside ? inside[1] : picked;
}

function promoCalendar_(payload) {
  var month = (payload && payload.month) || Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM');
  var cache = CacheService.getScriptCache();
  var key = 'promoCal|' + promoCalSheetId_() + '|' + month;
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

  var book = SpreadsheetApp.openById(promoCalSheetId_());
  var months = book.getSheets()
    .map(function (sheet) { return sheet.getName(); })
    .filter(function (name) { return /^\d{4}-\d{2}$/.test(name) || name === PROMO_CAL_UNDATED; })
    .sort();

  var sheet = book.getSheetByName(month);
  var columns = [];
  var rows = [];
  if (sheet) {
    var grid = sheet.getDataRange().getValues();
    columns = (grid[0] || []).map(budgetText_);
    rows = grid.slice(1)
      .map(function (line) { return line.map(budgetText_); })
      .filter(function (line) { return line.some(function (cell) { return cell !== ''; }); });
  }

  var result = {
    ok: true,
    source: 'promoCalendar',
    month: month,
    months: months,
    bookName: book.getName(),
    url: 'https://docs.google.com/spreadsheets/d/' + promoCalSheetId_() + '/edit',
    columns: columns,
    rows: rows,
    fetchedAt: new Date().toISOString()
  };

  cachePut_(cache, key, JSON.stringify(result), PROMO_CAL_CACHE_SECONDS);
  return result;
}

// ── KOL 라이브 (이 화면에서 직접 적는다) ───────────────────────────────
// 예전에는 '라이브 & 행사 결과' 시트를 읽어다 그렸다. 라이브마다 표 모양이 달라
// 머리글 낱말로 더듬어 찾아야 했고, 시트를 조금만 손대도 읽는 쪽이 비어 버렸다.
// 이제는 앱에서 적는다. 적은 값은 적재 시트의 KOL라이브 탭에 담겨 팀이 같이 본다.
//
//   한 달이 한 줄이다 — 월 | 내용(JSON) | 수정자 | 수정시각
//   내용 JSON = { day: '라이브 일자', promo: '프로모션명',
//                phases: { pre: {…}, day: {…}, post: {…} } }
//   프로모션명은 사람이 적는 이름이라 칸을 따로 두지 않고 내용 JSON 안에 둔다 —
//   칸을 늘리면 이미 쌓인 줄의 수정자 · 수정시각이 밀린다.
//   한 단계에 적는 칸은 다섯이다:
//     spend 광고비 · revenue 매출 · orders 주문수 · alerts 사전알림수 ·
//     sessions 세션수 · clicks 클릭수
//
//   매체별 결과(media)는 사람이 적지 않는다. 매체별 성과에서 받은 .json 을 올리면
//   화면이 Phase × 매체로 더해 보낸다 — 파일을 통째로 담지 않는 까닭은 한 달치가
//   광고그룹 수백 줄이라 시트 한 칸(5만 자)에 들어가지 않아서다.
//
//   CPS · CPA · ROAS · 사전알림구매률 · 사전알림신청률은 **담지 않는다.**
//   이 다섯 칸에서 바로 나오는 값이라, 함께 담아 두면 한 쪽만 고쳐졌을 때 어느 것이
//   맞는지 알 수 없게 된다. 세는 자리는 화면 한 곳뿐이다.
var KOL_SHEET_NAME = 'KOL라이브';
var KOL_HEADERS = ['월', '내용(JSON)', '수정자', '수정시각'];
var KOL_PHASES = ['pre', 'day', 'post'];
var KOL_FIELDS = ['spend', 'revenue', 'orders', 'alerts', 'sessions', 'clicks'];
var KOL_MEDIA_FIELDS = ['spend', 'imp', 'clk', 'conv'];
var KOL_MEDIA_MAX = 300;          // 담아 둘 줄의 끝 (시트 한 칸을 넘지 않게)

function kolSheet_(book) {
  book = book || SpreadsheetApp.openById(SHEET_ID);
  var sheet = book.getSheetByName(KOL_SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(KOL_SHEET_NAME, book.getNumSheets());
    sheet.getRange(1, 1, 1, KOL_HEADERS.length).setValues([KOL_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    // 월 칸은 글자로 둔다. 그냥 두면 시트가 '2026-09' 를 날짜로 바꿔 버려,
    // 시간대가 어긋나는 순간 앞 달로 읽히는 일이 생긴다. (월별예산 탭과 같은 까닭)
    sheet.getRange('A:A').setNumberFormat('@');
    sheet.setColumnWidth(1, 90);
    sheet.setColumnWidth(2, 560);
  }
  return sheet;
}

// 단계 하나. 칸이 늘어도 옛 줄이 그대로 읽히게, 늘 같은 모양으로 편다.
function kolPhase_(found) {
  var one = {};
  KOL_FIELDS.forEach(function (name) {
    var value = found ? Number(found[name]) : 0;
    one[name] = isFinite(value) ? value : 0;
  });
  return one;
}

function kolPhases_(found) {
  var phases = (found && found.phases) || {};
  var out = {};
  KOL_PHASES.forEach(function (name) { out[name] = kolPhase_(phases[name]); });
  return out;
}

// 매체별 결과. 화면이 보낸 것을 그대로 믿지 않고 숫자 · 글자만 남긴다.
function kolMedia_(found) {
  var list = (found && found.media) || [];
  if (Object.prototype.toString.call(list) !== '[object Array]') return [];
  return list.slice(0, KOL_MEDIA_MAX).map(function (one) {
    var out = { phase: String((one && one.phase) || ''), name: String((one && one.name) || '') };
    KOL_MEDIA_FIELDS.forEach(function (name) {
      var value = one ? Number(one[name]) : 0;
      out[name] = isFinite(value) ? value : 0;
    });
    return out;
  });
}

// 어느 파일에서 언제 읽었나 (화면이 그대로 적어 보여 준다)
function kolFrom_(found) {
  var from = found && found.mediaFrom;
  if (!from) return null;
  var files = (from.files || []).slice(0, 20).map(function (one) { return String(one || ''); });
  return { files: files, at: String(from.at || '') };
}

function kolRow_(line) {
  var found = monthBudgetParse_(line[1], null);
  return {
    month: monthBudgetKey_(line[0]),
    day: String((found && found.day) || '').slice(0, 10),
    promo: String((found && found.promo) || ''),
    phases: kolPhases_(found),
    media: kolMedia_(found),
    mediaFrom: kolFrom_(found),
    updatedBy: String(line[2] || ''),
    updatedAt: line[3] ? new Date(line[3]).toISOString() : ''
  };
}

// 적어 둔 달을 모두 준다. 한 달이 숫자 열다섯 개라 다 보내도 가볍다 —
// 목록 화면이 달마다 따로 물어보지 않아도 되게.
function kolGet_() {
  var sheet = kolSheet_();
  var last = sheet.getLastRow();
  var months = [];
  if (last > 1) {
    sheet.getRange(2, 1, last - 1, KOL_HEADERS.length).getValues().forEach(function (line) {
      if (!monthBudgetKey_(line[0])) return;
      months.push(kolRow_(line));
    });
  }
  // 새 달이 위로 온다 (대개 지금 적고 있는 달이다)
  months.sort(function (one, two) {
    return one.month < two.month ? 1 : (one.month > two.month ? -1 : 0);
  });
  return {
    ok: true,
    months: months,
    url: 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/edit',
    fetchedAt: new Date().toISOString()
  };
}

// 한 달만 고친다. 다른 달은 건드리지 않는다.
function kolPut_(payload) {
  var month = monthBudgetKey_((payload && payload.month) || '');
  if (!month) throw new Error('저장할 달이 비어 있습니다.');
  var who = String((payload && payload.by) || '');
  var day = String((payload && payload.day) || '').slice(0, 10);
  var promo = String((payload && payload.promo) || '');
  var phases = kolPhases_({ phases: (payload && payload.phases) || {} });
  var media = kolMedia_(payload);
  var from = kolFrom_(payload);

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = kolSheet_();
    var last = sheet.getLastRow();
    var at = 0;
    // 자리를 찾을 때는 월 칸만 읽는다 (내용 JSON 은 찾는 데 쓰지 않는다)
    if (last > 1) {
      var months = sheet.getRange(2, 1, last - 1, 1).getValues();
      for (var i = 0; i < months.length; i += 1) {
        if (monthBudgetKey_(months[i][0]) !== month) continue;
        at = i + 2;
        break;
      }
    }
    if (!at) at = sheet.getLastRow() + 1;
    sheet.getRange(at, 1, 1, KOL_HEADERS.length)
      .setValues([[month,
        JSON.stringify({ day: day, promo: promo, phases: phases, media: media, mediaFrom: from }),
        who, new Date()]]);
    return { ok: true, month: month, promo: promo, savedAt: new Date().toISOString() };
  } finally {
    lock.releaseLock();
  }
}

// 한 달을 통째로 지운다 (줄을 없앤다 — 목록에서도 사라진다).
function kolDrop_(payload) {
  var month = monthBudgetKey_((payload && payload.month) || '');
  if (!month) throw new Error('지울 달이 비어 있습니다.');

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = kolSheet_();
    var last = sheet.getLastRow();
    if (last > 1) {
      var months = sheet.getRange(2, 1, last - 1, 1).getValues();
      for (var i = months.length - 1; i >= 0; i -= 1) {
        if (monthBudgetKey_(months[i][0]) === month) sheet.deleteRow(i + 2);
      }
    }
    return { ok: true, month: month, droppedAt: new Date().toISOString() };
  } finally {
    lock.releaseLock();
  }
}

// ── 소재문구 탭 (발번한 파일명 · 광고문구) ─────────────────────────────
// 사람이 쓰던 '콘텐츠 T&D' 시트는 한 행사가 [🔴행사명 · 머리글 · 소재 줄들] 한 덩어리이고
// 매체 · 구좌 칸을 병합해 비워 두는 표다. 사람 눈에는 읽기 좋지만 프로그램이 넣기에는 나쁘다 —
// 블록을 찾아야 하고, 없으면 만들어야 하고, 색(🔴🔵)과 머리글(매체/구좌)이 블록마다 다르다.
//
// 그래서 **적재 시트 안에 판판한 탭**을 매체 계열마다 하나씩 둔다. 한 줄이 소재 하나다.
//   소재문구-메타 · 소재문구-GFA · 소재문구-카카오 · 소재문구-구글 · 소재문구-인플루언서 …
//   세팅명 | 행사명 | 매체 | 파일명 | 광고문구 | 글자수 | 적재시각
//
// 계열은 매체 이름의 **첫 토막**이다 (GFA-피드 → GFA · 카카오-비즈보드 → 카카오).
// 표를 손대지 않고도 새 매체가 늘면 그 계열 탭이 저절로 생긴다. 지면(피드 · 쇼핑소식 …)은
// 탭을 더 쪼개지 않고 매체 열에 그대로 남긴다 — T&D 시트가 쓰던 방식과 같다.
//
// 열쇠는 행사명|매체|파일명 세 칸이다. 같은 열쇠가 다시 오면 문구만 채우고(적혀 있으면 그대로),
// 없으면 아래에 붙인다. 그래서 최종완료를 몇 번 눌러도 줄이 겹치지 않는다.
// 글자수는 수식으로 둔다 — 문구를 시트에서 고쳐도 알아서 다시 센다. (피드 65자 · 쇼핑 57자)
var TND_FLAT_PREFIX = '소재문구-';
// 파트 탭과 같은 차례로 세팅명이 맨 앞이다. 아래 쓰기가 칸 번호로 읽고 쓰므로
// 자리를 외워 박지 않고 이 목록에서 찾아 쓴다 (tndCol_).
var TND_FLAT_HEADERS = ['세팅명', '행사명', '매체', '파일명', '광고문구', '글자수', '적재시각'];

// 머리글 이름 → 칸 번호 (1부터). 차례를 바꿔도 아래가 따라온다.
function tndCol_(label) {
  return TND_FLAT_HEADERS.indexOf(label) + 1;
}
var TND_FLAT_ETC = '기타';

// 매체 → 계열 이름. 첫 '-' 앞을 쓴다. 시트 탭 이름에 쓸 수 없는 글자는 뺀다.
function tndFamily_(media) {
  var name = String(media || '').trim();
  var at = name.indexOf('-');
  var head = (at > 0 ? name.slice(0, at) : name).trim();
  head = head.replace(/[:\\\/\?\*\[\]]/g, '').trim();
  return head || TND_FLAT_ETC;
}

/* 이미 있는 탭의 머리글을 맞춘다.
   세팅명은 **맨 앞에 끼워 넣는다** — 오른쪽에 붙이면 파트 탭과 차례가 달라지고,
   무엇보다 아래 쓰기가 칸 번호로 읽고 쓰기 때문에 자리가 정해져 있어야 한다.
   칸을 끼우면 쌓여 있던 값은 열째로 같이 밀리고, 글자수 수식도 시트가 알아서 따라간다.
   이미 있으면 아무 것도 하지 않는다 (두 번 눌러도 칸이 겹치지 않는다). */
function tndFlatFix_(sheet) {
  var width = Math.max(sheet.getLastColumn(), 1);
  var head = sheet.getRange(1, 1, 1, width).getValues()[0].map(function (one) {
    return String(one).trim();
  });

  if (head.indexOf('세팅명') < 0) {
    sheet.insertColumnBefore(1);
    sheet.getRange(1, 1).setValue('세팅명').setFontWeight('bold');
    sheet.setColumnWidth(1, 200);
    head.unshift('세팅명');
  }

  // 뒤에 늘어난 칸(글자수 · 적재시각처럼 나중에 생긴 것)은 이어 붙인다
  TND_FLAT_HEADERS.forEach(function (label) {
    if (head.indexOf(label) >= 0) return;
    sheet.getRange(1, head.length + 1).setValue(label).setFontWeight('bold');
    head.push(label);
  });
  return sheet;
}

function tndFlatSheet_(book, family) {
  var name = TND_FLAT_PREFIX + family;
  var sheet = book.getSheetByName(name);
  if (sheet) return tndFlatFix_(sheet);

  sheet = book.insertSheet(name, book.getNumSheets());
  sheet.getRange(1, 1, 1, TND_FLAT_HEADERS.length).setValues([TND_FLAT_HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(tndCol_('세팅명'), 200);
  sheet.setColumnWidth(tndCol_('행사명'), 260);
  sheet.setColumnWidth(tndCol_('매체'), 130);
  sheet.setColumnWidth(tndCol_('파일명'), 130);
  sheet.setColumnWidth(tndCol_('광고문구'), 520);
  sheet.getRange(1, tndCol_('광고문구'), sheet.getMaxRows(), 1).setWrap(true);
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
  // 행사명 · 매체 · 파일명 · 광고문구 네 칸은 붙어 있다. 그 자리부터 한 번에 읽는다.
  var head = tndCol_('행사명');
  if (lastRow > 1) {
    sheet.getRange(2, head, lastRow - 1, 4).getValues().forEach(function (line, i) {
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
        sheet.getRange(found, tndCol_('광고문구')).setValue(row.copy);
        copies[found] = row.copy;
        filled += 1;
      } else {
        kept += 1;
      }
      return;
    }
    if (fresh.some(function (one) { return one.key === key; })) return;   // 한 요청 안의 중복
    // 세팅명은 비워 둔다 — 사람이 시트에서 적는 칸이다
    fresh.push({ key: key, line: ['', campaign, row.media, row.filename, row.copy, '', stamp] });
    at[key] = -1;
  });

  if (fresh.length) {
    var start = sheet.getLastRow() + 1;
    sheet.getRange(start, 1, fresh.length, TND_FLAT_HEADERS.length)
      .setValues(fresh.map(function (one) { return one.line; }));
    // 글자수는 수식으로 둔다 (시트에서 문구를 고쳐도 알아서 다시 센다)
    var copyAt = colLetter_(tndCol_('광고문구'));
    sheet.getRange(start, tndCol_('글자수'), fresh.length, 1).setFormulas(fresh.map(function (one, i) {
      return ['=IF(' + copyAt + (start + i) + '="","",LEN(' + copyAt + (start + i) + '))'];
    }));
    sheet.getRange(start, tndCol_('광고문구'), fresh.length, 1).setWrap(true);
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
