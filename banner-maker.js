// ── 광고자동 세팅 · 소재 제작 (카카오 비즈보드 · GFA 스마트채널) ─────────────
// T&D 시트의 카피와 올린 누끼 · 썸네일 이미지를 매체 제작가이드 규격대로 합성해 PNG 로 내려받는다.
// 그림은 전부 브라우저(canvas)에서 그린다 — 서버도 외부 API 도 부르지 않는다.
const bannerMaker = (() => {
  const FONT_FILES = [
    ['BM Spoqa', 'fonts/SpoqaHanSans-Bold.woff2', '700'],
    ['BM Spoqa', 'fonts/SpoqaHanSans-Regular.woff2', '400'],
    ['BM Nanum Barun', 'fonts/NanumBarunGothic-Bold.woff2', '700'],
    ['BM Nanum Barun', 'fonts/NanumBarunGothic-Regular.woff2', '400'],
  ];

  /* 숫자는 각 매체 제작가이드에서 옮겼다.
     카카오 centers 는 한글 글자 몸통의 세로 중심(y) — 가이드 그림에서 잰 값이고,
     카카오 '배너 이미지 만들기' 결과와 1px 안에서 같다는 것을 확인했다.
     GFA 는 글자 몸통 사이를 gaps 만큼 띄워 쌓고 위아래 가운데에 놓는다 (가이드의 '줄간격').
     280 은 가이드를 못 읽어 네이버 GFA 소재 만들기 화면에서 잰 값이다 —
     메인 32 · 메인 두 줄 · 썸네일 200×200 · 누끼 최대 260×280. 줄간격과 면적 70% 는 어림값.
     썸네일 모서리(radius)는 가이드에 숫자가 없어 그림에서 어림한 값이다. */
  const GFA = {
    family: 'BM Nanum Barun', probe: 'BM Spoqa', maxKB: 150, w: 750,
    sub: { size: 26, color: '#2E2E2E' }, margin: 40, gap: 30, chevronGap: 40, preview: '#f2f3f5',
  };
  const SPECS = {
    kakao: {
      label: '1029×258', w: 1029, h: 258, maxKB: 300,
      family: 'BM Spoqa', probe: 'BM Nanum Barun',
      main: { size: 48, color: '#4C4C4C' }, sub: { size: 39, color: '#777777' },
      textX: 48, textMax: 585, textMin: 290,
      centers: { two: [100, 162], one: [129] },
      object: { x: 666, y: 0, w: 315, h: 258, minInk: 219 },
      thumb: { x: 666, y: 36, w: 315, h: 186, radius: 8, logo: { x: 854, y: 44, w: 120, h: 46 } },
      preview: '#f3f3f3',
    },
    gfa280: {
      ...GFA, label: '750×280', h: 280,
      main: { size: 32, color: '#1C1C1C' }, main2: true, gaps: { main2: 14, sub: 22 },
      object: { w: 260, h: 280, maxArea: 50960 },
      thumb: { w: 200, h: 200, radius: 14 },
    },
    gfa200: {
      ...GFA, label: '750×200', h: 200,
      main: { size: 30, color: '#1C1C1C' }, gaps: { sub: 16 },
      object: { w: 260, h: 200, maxArea: 36400 },
      thumb: { w: 210, h: 140, radius: 14 },
    },
    gfa160: {
      ...GFA, label: '750×160', h: 160,
      main: { size: 30, color: '#1C1C1C' }, gaps: { sub: 14 },
      object: { w: 260, h: 160, maxArea: 29120 },
      thumb: { w: 195, h: 130, radius: 12 },
      // 네이버가 오른쪽 위에 그리는 AD 음소거 배지 자리 (84×32, 위 2 · 오른쪽 12)
      mute: { x: 654, y: 2, w: 84, h: 32 },
    },
  };

  // 화면에서 고르는 매체. 한 매체가 여러 사이즈를 한 번에 만든다 (GFA 는 네이버 도구처럼 세 장).
  const MEDIA = {
    kakao: {
      label: '카카오 비즈보드', short: '비즈보드', specs: ['kakao'], slot: ['비즈보드'],
      note: '1029×258 · 투명 PNG · 300KB 이하 · 스포카 한 산스 (메인 48 Bold #4C4C4C / 서브 39 Regular #777777)',
    },
    gfa: {
      label: 'GFA 스마트채널', short: '스채', specs: ['gfa280', 'gfa200', 'gfa160'], slot: ['스마트채널', '스채'],
      note: '750×280 · 200 · 160 · 투명 PNG · 150KB 이하 · 나눔바른고딕 (메인 30(280은 32) Bold #1C1C1C / 서브 26 Regular #2E2E2E) · 메인 2행은 280 에만 들어갑니다',
    },
  };

  let fontsReady = null;
  const loadFonts = () => {
    if (!fontsReady) {
      fontsReady = Promise.all(FONT_FILES.map(([family, url, weight]) => new FontFace(family, `url(${url})`, { weight })
        .load().then((face) => { document.fonts.add(face); })));
      fontsReady.catch(() => { fontsReady = null; });
    }
    return fontsReady;
  };

  const makeCanvas = (w, h) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
  };

  const roundRectPath = (g, x, y, w, h, r) => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };

  // 그려진 것의 테두리와 면적. 면적은 반투명을 비율로 센다 (포토샵 히스토그램의 Pixels 와 같은 셈).
  const inkOf = (g, w, h) => {
    const data = g.getImageData(0, 0, w, h).data;
    let x0 = w; let y0 = h; let x1 = -1; let y1 = -1; let area = 0;
    for (let i = 3, p = 0; i < data.length; i += 4, p += 1) {
      const a = data[i];
      if (!a) continue;
      area += a / 255;
      if (a < 16) continue;
      const x = p % w;
      const y = (p - x) / w;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    return x1 < 0 ? null : { x0, y0, x1: x1 + 1, y1: y1 + 1, area: Math.round(area) };
  };

  const alphaShare = (image) => {
    const g = makeCanvas(64, 64).getContext('2d', { willReadFrequently: true });
    g.drawImage(image, 0, 0, 64, 64);
    const data = g.getImageData(0, 0, 64, 64).data;
    let clear = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 250) clear += 1;
    return clear / (64 * 64);
  };

  /* 글꼴에 없는 글자 찾기. 이 글꼴을 앞에 두고 다른 번들 글꼴(probe)을 뒤에 둔 그림과
     probe 만으로 그린 그림이 똑같으면 — 앞 글꼴에 그 글자가 없어 probe 로 넘어간 것이다.
     기준선은 alphabetic 이어야 한다. middle · top 은 첫 글꼴의 높이로 정해져 같은 글자도 어긋난다. */
  const glyphSeen = new Map();
  const drawsSame = (ch, fontA, fontB) => {
    const draw = (font) => {
      const g = makeCanvas(56, 56).getContext('2d', { willReadFrequently: true });
      g.font = font;
      g.textBaseline = 'alphabetic';
      g.fillText(ch, 4, 44);
      return g.getImageData(0, 0, 56, 56).data;
    };
    const a = draw(fontA);
    const b = draw(fontB);
    for (let i = 3; i < a.length; i += 4) if (a[i] !== b[i]) return false;
    return true;
  };
  const missingChars = (text, spec, weight) => {
    const out = [];
    new Set(Array.from(text)).forEach((ch) => {
      if (ch.charCodeAt(0) < 128 || /\s/.test(ch)) return;
      const key = `${spec.family}|${weight}|${ch}`;
      if (!glyphSeen.has(key)) {
        glyphSeen.set(key, drawsSame(ch, `${weight} 40px "${spec.family}", "${spec.probe}"`, `${weight} 40px "${spec.probe}"`));
      }
      if (glyphSeen.get(key)) out.push(ch);
    });
    return out;
  };

  const EMOJI = /\p{Emoji_Presentation}|️/u;
  const KEYBOARD = /[ -~가-힣ㄱ-ㆎ→]/;

  const artBox = (spec, kind, side) => {
    const box = kind === 'thumb' ? spec.thumb : spec.object;
    if (spec.textX !== undefined) return box;   // 카카오는 우측형 자리가 정해져 있다
    return {
      ...box,
      x: side === 'right' ? spec.w - spec.margin - box.w : spec.margin,
      y: Math.round((spec.h - box.h) / 2),
    };
  };

  const drawArt = (spec, kind, image, side) => {
    const box = artBox(spec, kind, side);
    const layer = makeCanvas(spec.w, spec.h);
    const g = layer.getContext('2d', { willReadFrequently: true });
    g.imageSmoothingQuality = 'high';
    const iw = image.width;
    const ih = image.height;
    if (kind === 'thumb') {
      const s = Math.max(box.w / iw, box.h / ih);
      g.save();
      roundRectPath(g, box.x, box.y, box.w, box.h, box.radius);
      g.clip();
      g.drawImage(image, box.x + (box.w - iw * s) / 2, box.y + (box.h - ih * s) / 2, iw * s, ih * s);
      g.restore();
      const whole = { x0: box.x, y0: box.y, x1: box.x + box.w, y1: box.y + box.h, area: box.w * box.h };
      return { layer, box, scale: s, ink: whole, drawn: whole };
    }
    const s = Math.min(box.w / iw, box.h / ih);
    let x = box.x + (box.w - iw * s) / 2;
    if (spec.textX === undefined) x = side === 'right' ? box.x + box.w - iw * s : box.x;
    g.drawImage(image, x, box.y + (box.h - ih * s) / 2, iw * s, ih * s);
    return { layer, box, scale: s, ink: inkOf(g, spec.w, spec.h), drawn: { x0: Math.floor(x), x1: Math.ceil(x + iw * s) } };
  };

  const drawChevron = (g, x, cy) => {
    g.save();
    g.strokeStyle = '#505050';
    g.lineWidth = 2;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(x, cy - 13);
    g.lineTo(x + 13, cy);
    g.lineTo(x, cy + 13);
    g.stroke();
    g.restore();
  };

  const nearGray = (g, box) => {
    const data = g.getImageData(box.x, box.y, box.w, box.h).data;
    let r = 0; let gr = 0; let b = 0; let n = 0;
    for (let i = 0; i < data.length; i += 4 * 7) {
      if (data[i + 3] < 200) continue;
      r += data[i]; gr += data[i + 1]; b += data[i + 2]; n += 1;
    }
    if (!n) return false;
    return [r / n, gr / n, b / n].every((v) => Math.abs(v - 243) < 14);
  };

  /* 한 장을 그린다. 돌려주는 issues 의 level — bad: 가이드 위반(심사 반려 가능), warn: 확인 필요.
     image 는 ImageBitmap · HTMLImageElement · canvas 무엇이든 된다 (width · height 만 쓴다). */
  const compose = (spec, { kind, image, hasAlpha, logo, main, main2 = '', sub, side = 'left', chevron = false }) => {
    const issues = [];
    const bad = (text) => issues.push({ level: 'bad', text });
    const warn = (text) => issues.push({ level: 'warn', text });
    const isKakao = spec.textX !== undefined;
    const canvas = makeCanvas(spec.w, spec.h);
    const g = canvas.getContext('2d', { willReadFrequently: true });

    const art = drawArt(spec, kind, image, side);
    g.drawImage(art.layer, 0, 0);
    const ink = art.ink || { x0: art.box.x, x1: art.box.x + art.box.w, area: 0 };

    if (art.scale > 1.05) warn(`원본 ${image.width}×${image.height} 을 ${Math.round(art.scale * 100)}% 로 키웠습니다 — 흐릿할 수 있습니다.`);
    if (kind === 'object') {
      if (!hasAlpha) bad(`${isKakao ? '오브젝트형' : '누끼형'}은 배경이 투명한 PNG 여야 합니다.`);
      if (isKakao && art.ink && ink.x1 - ink.x0 < spec.object.minInk) {
        warn(`오브젝트 너비 ${ink.x1 - ink.x0}px — ${spec.object.minInk}px 이상을 권장합니다.`);
      }
      if (spec.object.maxArea && ink.area > spec.object.maxArea) {
        bad(`오브젝트 면적 ${ink.area.toLocaleString()}px — 최대 ${spec.object.maxArea.toLocaleString()}px(70%) 를 넘습니다.`);
      }
      if (spec.mute && side === 'right' && art.ink) {
        const m = spec.mute;
        if (ink.x1 > m.x && ink.x0 < m.x + m.w && ink.y0 < m.y + m.h && ink.y1 > m.y) {
          warn('오른쪽 위 AD 음소거 배지(84×32) 자리와 겹칩니다 — 로고가 가려질 수 있습니다.');
        }
      }
    } else {
      if (hasAlpha) (isKakao ? bad : warn)('썸네일형은 배경이 있는(투명하지 않은) 이미지여야 합니다.');
      if (isKakao && nearGray(g, art.box)) warn('썸네일 배경이 비즈보드 회색(#f3f3f3)과 비슷합니다 — 가시성이 떨어질 수 있습니다.');
    }
    if (isKakao && kind === 'thumb') {
      if (logo) {
        const L = spec.thumb.logo;
        const s = Math.min(L.w / logo.width, L.h / logo.height);
        g.drawImage(logo, L.x + L.w - logo.width * s, L.y, logo.width * s, logo.height * s);
      } else {
        warn('광고주체 표기(로고)가 없습니다 — 로고 PNG 를 넣으면 오른쪽 위 120×46 자리에 들어갑니다.');
      }
    }

    /* 글자 칸 [left, right]. 카카오는 왼쪽 48 에 붙이고, GFA 는 네이버 소재 만들기처럼
       (그린 이미지 + 30) ~ (오른쪽 여백) 사이의 가운데에 글자 덩어리를 놓는다. */
    const drawn = art.drawn;
    let left;
    let right;
    let chevronAt = null;
    if (isKakao) {
      left = spec.textX;
      right = spec.textX + spec.textMax;
    } else if (side === 'right') {
      left = spec.margin;
      right = drawn.x0 - spec.gap;
    } else {
      left = drawn.x1 + spec.gap;
      right = spec.w - spec.margin;
      if (chevron) {
        chevronAt = spec.w - spec.margin - 14;
        right = chevronAt - spec.chevronGap;
      }
    }
    if (chevron && !isKakao && side === 'right') warn('꺾쇠는 오브젝트가 왼쪽일 때만 쓸 수 있어 넣지 않았습니다.');
    if (isKakao && main2) warn('카카오는 메인 2행을 쓰지 않습니다 — 메인 1행 · 서브만 넣었습니다.');

    const LABEL = { main: '메인카피', main2: '메인카피 2행', sub: '서브카피' };
    const lines = [['main', main, 700], ['main2', spec.main2 ? main2 : '', 700], ['sub', sub, 400]]
      .filter(([, text]) => text)
      .map(([which, text, weight]) => {
        const style = which === 'sub' ? spec.sub : spec.main;
        g.font = `${weight} ${style.size}px "${spec.family}"`;
        const ref = g.measureText('한글가나다');
        return { which, text, weight, style, font: g.font, width: Math.ceil(g.measureText(text).width),
          asc: ref.actualBoundingBoxAscent, desc: ref.actualBoundingBoxDescent };
      });
    if (!main) bad('메인카피가 비어 있습니다.');
    if (isKakao) {
      const centers = lines.length > 1 ? spec.centers.two : spec.centers.one;
      lines.forEach((line, at) => { line.baseline = centers[at] + (line.asc - line.desc) / 2; });
    } else {
      const total = lines.reduce((sum, line, at) => sum + line.asc + line.desc + (at ? spec.gaps[line.which] : 0), 0);
      let top = (spec.h - total) / 2;
      lines.forEach((line, at) => {
        if (at) top += spec.gaps[line.which];
        line.baseline = top + line.asc;
        top += line.asc + line.desc;
      });
    }
    const blockWidth = Math.max(0, ...lines.map((line) => line.width));
    const x = isKakao ? left : left + Math.max(0, Math.floor((right - left - blockWidth) / 2));
    const widths = {};
    lines.forEach(({ which, text, weight, style, font, width, baseline }) => {
      g.font = font;
      g.fillStyle = style.color;
      g.textBaseline = 'alphabetic';
      g.fillText(text, x, Math.round(baseline));
      widths[which] = width;
      const label = LABEL[which];
      if (width > right - left) {
        bad(isKakao
          ? `${label} 길이 ${width}px — 최대 ${spec.textMax}px 를 ${width - spec.textMax}px 넘습니다.`
          : `${label}가 글자 영역(${Math.max(0, right - left)}px)을 ${width - Math.max(0, right - left)}px 넘습니다.`);
      }
      const missing = missingChars(text, spec, weight);
      if (missing.length) bad(`${label}의 '${missing.join(' ')}' 는 가이드 글꼴에 없는 글자라 다른 글꼴로 그려집니다.`);
      if (EMOJI.test(text)) (isKakao ? bad : warn)(`${label}에 이모지가 있습니다.`);
      if (isKakao) {
        const odd = [...new Set(Array.from(text).filter((ch) => !KEYBOARD.test(ch) && !EMOJI.test(ch)))];
        if (odd.length) warn(`${label}의 자판 외 특수기호 ${odd.join(' ')} — 카카오 심사에서 반려될 수 있습니다 (→ 만 허용).`);
      }
    });
    if (isKakao && lines.length) {
      const longest = Math.max(...Object.values(widths));
      if (longest < spec.textMin) bad(`카피 길이 ${longest}px — 메인 · 서브 중 하나는 ${spec.textMin}px 이상이어야 합니다.`);
      if (sub && main && main.replace(/\s/g, '') === sub.replace(/\s/g, '')) bad('메인카피와 서브카피가 같습니다.');
    }
    if (chevronAt !== null) {
      drawChevron(g, chevronAt, spec.h / 2);
      warn('꺾쇠는 가이드 PSD 아이콘을 본떠 그린 것입니다 — 심사 전에 한 번 확인하세요.');
    }
    return { canvas, issues, widths };
  };

  const toBlob = (canvas) => new Promise((done) => canvas.toBlob(done, 'image/png'));

  // 칸 안의 줄바꿈 · 따옴표까지 다루는 CSV 읽기
  const parseCsv = (text) => {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (ch === '"') quoted = false;
        else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else if (ch !== '\r') cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows;
  };

  /* T&D 탭은 사람이 보기 좋은 덩어리 표다 — [행사명 한 줄 · 머리글 · 소재 줄들] 이 되풀이된다.
     칸은 머리글 이름으로 찾고, 행사명 · 구좌는 덩어리 첫 줄에만 적혀 있어 아래로 이어 쓴다.
     메인 · 서브 칸이 없는 탭(GFA 처럼 광고문구 한 칸)은 그 칸을 줄로 나눈다 —
     두 줄이면 메인 · 서브, 세 줄이면 메인 1행 · 메인 2행 · 서브 (네이버 소재 만들기와 같은 차례). */
  const HEAD = {
    key: ['소재명', '파일명'],
    main2: ['메인카피2', '메인2', '메인카피(2행)', '메인2행'],
    main: ['메인카피', '메인'],
    sub: ['서브카피', '서브'],
    body: ['광고문구', '문구', '카피'],
    event: ['행사명'],
    slot: ['구좌'],
    note: ['워싱'],
  };
  const flat = (value) => String(value ?? '').replace(/\s/g, '');
  // 머리글 뒤에 설명이 붙는 탭이 있어('광고문구 (피드65) (쇼핑57)') 앞머리로 견준다
  const findCol = (cells, names, not = []) => cells.findIndex((cell) => names.some((name) => flat(cell).startsWith(name))
    && !not.some((name) => flat(cell).startsWith(name)));
  const oneLine = (value) => String(value ?? '').replace(/\s*\n\s*/g, ' ').trim();

  const parseTnd = (rows) => {
    const blocks = [];
    let title = '';
    let cols = null;
    let block = null;
    rows.forEach((cells) => {
      const keyAt = findCol(cells, HEAD.key);
      const mainAt = findCol(cells, HEAD.main, HEAD.main2);
      const bodyAt = findCol(cells, HEAD.body);
      if (keyAt >= 0 && (mainAt >= 0 || bodyAt >= 0)) {
        cols = { key: keyAt, main: mainAt, body: bodyAt };
        ['main2', 'sub', 'event', 'slot', 'note'].forEach((name) => { cols[name] = findCol(cells, HEAD[name]); });
        block = { title, event: '', rows: [] };
        blocks.push(block);
        return;
      }
      const cell = (at) => (at >= 0 ? String(cells[at] ?? '').trim() : '');
      if (block && cell(cols.key)) {
        if (cell(cols.event)) block.event = block.event || cell(cols.event);
        const slot = cell(cols.slot) || (block.rows.length ? block.rows[block.rows.length - 1].slot : '');
        const row = { key: cell(cols.key), slot, note: cell(cols.note), main: '', main2: '', sub: '', copyError: '' };
        if (cols.main >= 0) {
          row.main = oneLine(cell(cols.main));
          row.main2 = oneLine(cell(cols.main2));
          row.sub = oneLine(cell(cols.sub));
        } else {
          const parts = cell(cols.body).split('\n').map((one) => one.trim()).filter(Boolean);
          if (parts.length === 3) [row.main, row.main2, row.sub] = parts;
          else [row.main = '', row.sub = ''] = parts;
          if (parts.length > 3) row.copyError = `광고문구가 ${parts.length}줄입니다 — 메인 1행 · 메인 2행 · 서브까지 3줄만 쓸 수 있습니다.`;
        }
        block.rows.push(row);
        return;
      }
      // 소재명만 빈 줄(작성 중)은 건너뛰고, 카피 칸까지 빈 줄만 다음 덩어리의 행사명 줄로 본다
      if (block && [cols.main, cols.sub, cols.body].some((at) => cell(at))) return;
      const filled = cells.map((one) => String(one ?? '').trim()).filter(Boolean);
      if (filled.length) {
        title = filled[0];
        block = null;
      }
    });
    return blocks.filter((one) => one.rows.length);
  };

  return { SPECS, MEDIA, loadFonts, compose, toBlob, parseCsv, parseTnd, alphaShare };
})();

(() => {
  const section = document.querySelector('#banner-maker');
  if (!section) return;
  const { SPECS, MEDIA } = bannerMaker;
  const STORE = 'minix-banner-maker-v1';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const kb = (size) => `${Math.round(size / 1024)}KB`;
  const safeName = (value) => String(value).replace(/[\\/:*?"<>|]+/g, '_').trim() || 'banner';
  const norm = (value) => String(value ?? '').trim().toLowerCase();
  const escapeRe = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const state = { media: 'kakao', urls: {}, blocks: {}, side: 'left', chevron: false, sizes: MEDIA.gfa.specs.slice() };
  try { Object.assign(state, JSON.parse(localStorage.getItem(STORE) || '{}')); } catch { /* 깨진 저장값은 버린다 */ }
  if (!MEDIA[state.media]) state.media = 'kakao';
  if (!Array.isArray(state.sizes)) state.sizes = MEDIA.gfa.specs.slice();
  const save = () => {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* 저장이 막힌 브라우저 */ }
  };

  const sheets = new Map();      // 시트 주소 → { state, blocks, message }
  let picks = [];                // { name, base, size, bitmap, hasAlpha, kind }
  let logo = null;
  let pickNote = '';
  let results = [];              // { row, pick, kind, issues, outputs: [{ key, name, url, blob, issues }] }
  let generating = false;
  let genToken = 0;
  let zipping = false;

  const media = () => MEDIA[state.media];
  // 만들 사이즈. GFA 는 고른 것만, 차례는 네이버 화면처럼 큰 것부터.
  const specKeys = () => media().specs.filter((key) => state.media === 'kakao' || state.sizes.includes(key));
  const urlNow = () => String(state.urls[state.media] || '').trim();

  const csvUrl = (url) => {
    const id = (url.match(/\/d\/([^/]+)/) || [])[1];
    if (!id) return '';
    const gid = (url.match(/[#?&]gid=(\d+)/) || [])[1] || '0';
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=0&gid=${gid}`;
  };

  // 지금 매체의 구좌 줄만 남긴다. 구좌가 하나도 안 적힌 덩어리는 그대로 둔다.
  const blocksNow = () => {
    const sheet = sheets.get(urlNow());
    if (!sheet || !sheet.blocks) return [];
    const seen = new Map();
    return sheet.blocks.map((block) => {
      const hasSlot = block.rows.some((row) => row.slot);
      const rows = hasSlot ? block.rows.filter((row) => media().slot.some((word) => row.slot.includes(word))) : block.rows;
      const name = block.title || block.event || '(이름 없는 덩어리)';
      const count = (seen.get(name) || 0) + 1;
      seen.set(name, count);
      return { ...block, rows, id: count > 1 ? `${name} #${count}` : name };
    }).filter((block) => block.rows.length);
  };
  const blockNow = () => {
    const list = blocksNow();
    return list.find((block) => block.id === state.blocks[state.media]) || list[0] || null;
  };

  const matchPick = (key) => {
    const k = norm(key);
    if (!k) return null;
    const near = new RegExp(`(^|[^0-9a-z])${escapeRe(k)}($|[^0-9a-z])`);
    return picks.find((pick) => pick.base === k) || picks.find((pick) => near.test(pick.base)) || null;
  };

  const loadSheet = async () => {
    const url = urlNow();
    const csv = csvUrl(url);
    if (!csv) {
      sheets.set(url, { state: 'error', message: '구글시트 주소가 아닙니다 — 탭을 연 채 주소창의 링크를 그대로 붙여 넣으세요.' });
      render();
      return;
    }
    sheets.set(url, { state: 'loading' });
    render();
    try {
      const response = await fetch(csv);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blocks = bannerMaker.parseTnd(bannerMaker.parseCsv(await response.text()));
      sheets.set(url, { state: 'done', blocks });
    } catch (error) {
      sheets.set(url, { state: 'error', message: `시트를 읽지 못했습니다 (${error.message}) — 공유가 '링크가 있는 모든 사용자' 인지 확인하세요.` });
    }
    if (url === urlNow()) regenerate();
  };

  const addFiles = async (list, fromFolder) => {
    const files = Array.from(list || []).filter((file) => /\.(png|jpe?g|webp)$/i.test(file.name));
    let added = 0;
    for (const file of files) {
      if (picks.some((pick) => pick.name === file.name && pick.size === file.size)) continue;
      try {
        const bitmap = await createImageBitmap(file);
        picks.push({ name: file.name, base: norm(file.name.replace(/\.[^.]+$/, '')), size: file.size,
          bitmap, hasAlpha: bannerMaker.alphaShare(bitmap) > 0.02, kind: '' });
        added += 1;
      } catch { /* 그림이 아닌 파일은 건너뛴다 */ }
    }
    if (fromFolder) {
      pickNote = `폴더에서 이미지 ${added}개를 넣었습니다 (파일 ${Array.from(list || []).length}개 중 png · jpg · webp 만).`;
    }
    regenerate();
  };

  const setLogo = async (file) => {
    if (!file) return;
    try { logo = { name: file.name, bitmap: await createImageBitmap(file) }; } catch { logo = null; }
    regenerate();
  };

  const revoke = (list) => list.forEach((item) => (item.outputs || []).forEach((one) => URL.revokeObjectURL(one.url)));

  const regenerate = async () => {
    const token = genToken + 1;
    genToken = token;
    const block = blockNow();
    if (!block || !picks.length || !specKeys().length) {
      revoke(results);
      results = [];
      generating = false;
      render();
      return;
    }
    generating = true;
    render();
    try { await bannerMaker.loadFonts(); } catch { /* 아래 글자 검사가 '글꼴에 없는 글자' 로 잡아 준다 */ }
    const out = [];
    const used = new Map();
    const keys = specKeys();
    for (const row of block.rows) {
      const pick = matchPick(row.key);
      const item = { row, pick, outputs: [], issues: row.copyError ? [{ level: 'bad', text: row.copyError }] : [] };
      if (pick) {
        item.kind = pick.kind || (pick.hasAlpha ? 'object' : 'thumb');
        const base = safeName(row.key);
        const n = (used.get(base) || 0) + 1;
        used.set(base, n);
        const stem = n > 1 ? `${base}-${n}` : base;
        for (const key of keys) {
          const spec = SPECS[key];
          const made = bannerMaker.compose(spec, { kind: item.kind, image: pick.bitmap, hasAlpha: pick.hasAlpha,
            logo: logo && logo.bitmap, main: row.main, main2: row.main2, sub: row.sub, side: state.side, chevron: state.chevron });
          const blob = await bannerMaker.toBlob(made.canvas);
          const issues = made.issues;
          if (blob.size > spec.maxKB * 1024) issues.push({ level: 'bad', text: `파일 ${kb(blob.size)} — ${spec.maxKB}KB 를 넘습니다.` });
          item.outputs.push({ key, spec, blob, issues, url: URL.createObjectURL(blob),
            name: keys.length > 1 || state.media !== 'kakao' ? `${stem}_${spec.label.replace('×', 'x')}.png` : `${stem}.png` });
        }
      }
      out.push(item);
      if (token !== genToken) { revoke(out); return; }
    }
    revoke(results);
    results = out;
    generating = false;
    render();
  };

  const levelIn = (issues) => {
    if (issues.some((one) => one.level === 'bad')) return 'bad';
    return issues.length ? 'warn' : 'ok';
  };
  const levelOf = (item) => (item.pick
    ? levelIn([...item.issues, ...item.outputs.flatMap((one) => one.issues)]) : 'none');
  // ZIP 에 넣을 낱장 — 시트 줄 자체에 문제가 있거나 그 사이즈가 가이드 위반이면 뺀다
  const zipReady = () => results.flatMap((item) => (levelIn(item.issues) === 'bad' ? []
    : item.outputs.filter((one) => levelIn(one.issues) !== 'bad')));

  const loadZipLib = () => (window.JSZip ? Promise.resolve(window.JSZip) : new Promise((done, fail) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
    script.onload = () => done(window.JSZip);
    script.onerror = () => fail(new Error('ZIP 도구를 불러오지 못했습니다'));
    document.head.appendChild(script);
  }));

  const zipAll = async () => {
    const ready = zipReady();
    if (!ready.length || zipping) return;
    zipping = true;
    render();
    try {
      const JSZip = await loadZipLib();
      const zip = new JSZip();
      ready.forEach((item) => zip.file(item.name, item.blob));
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${safeName((blockNow() || {}).id || 'banner')}_${media().short}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 10000);
    } catch (error) {
      pickNote = error.message;
    }
    zipping = false;
    render();
  };

  // ── 화면 ───────────────────────────────────────────────────────────
  const pills = (attr, items, current) => `<div class="setup-pills">${items
    .map(([label, value]) => `<button type="button" class="setup-pill${value === current ? ' is-on' : ''}" data-${attr}="${escapeHtml(value)}">${escapeHtml(label)}</button>`)
    .join('')}</div>`;

  const sheetBox = () => {
    const sheet = sheets.get(urlNow());
    if (!urlNow()) return '<p class="setup-note">T&amp;D 시트에서 이 매체 탭을 연 채 주소창의 링크를 붙여 넣고 [불러오기] 를 누르세요.</p>';
    if (!sheet) return '<p class="setup-note">[불러오기] 를 누르면 시트를 읽습니다.</p>';
    if (sheet.state === 'loading') return '<p class="tool-empty">시트를 읽는 중…</p>';
    if (sheet.state === 'error') return `<p class="setup-alert">${escapeHtml(sheet.message)}</p>`;
    const list = blocksNow();
    if (!list.length) {
      return `<p class="setup-alert">이 탭에서 ${escapeHtml(media().slot[0])} 줄을 찾지 못했습니다 — 머리글에 소재명(또는 파일명) · 메인카피(또는 광고문구) 칸이 있는지 확인하세요.</p>`;
    }
    const block = blockNow();
    return `<div class="setup-field">
        <span>행사<small class="setup-hint">시트의 덩어리(행사명 줄) 단위 · ${list.length}개</small></span>
        <select class="bm-block">${list.map((one) => `<option value="${escapeHtml(one.id)}"${one.id === block.id ? ' selected' : ''}>${escapeHtml(one.id)} (${one.rows.length}줄)</option>`).join('')}</select>
      </div>`;
  };

  const pickBox = () => `<div class="setup-drop${picks.length ? ' has-file' : ''}">
      <input type="file" id="bm-files" accept="image/png,image/jpeg,image/webp" multiple hidden>
      <label for="bm-files" class="tool-add"><i data-lucide="image-plus"></i>이미지 넣기</label>
      <input type="file" id="bm-folder" webkitdirectory directory multiple hidden>
      <label for="bm-folder" class="tool-copy"><i data-lucide="folder-open"></i>폴더 통째로 넣기</label>
      <span>이 칸에 <b>끌어다 놓아도</b> 됩니다 · 파일 이름에 <b>소재명</b>이 들어 있으면 그 줄과 짝지어집니다</span>
    </div>
    ${pickNote ? `<p class="setup-note">${escapeHtml(pickNote)}</p>` : ''}
    ${state.media === 'kakao' ? `<div class="bm-logo">
      <input type="file" id="bm-logo" accept="image/png" hidden>
      <label for="bm-logo" class="tool-copy"><i data-lucide="badge-check"></i>${logo ? '로고 바꾸기' : '로고 PNG 넣기'}</label>
      <small>${logo ? `${escapeHtml(logo.name)} — 썸네일형의 광고주체 표기 자리(오른쪽 위 120×46)에 들어갑니다`
        : '썸네일형에만 씁니다 (오브젝트형은 오브젝트 이미지 안의 로고를 그대로 씁니다)'}</small>
    </div>` : ''}
    ${picks.length ? `<ul class="setup-picks">${picks.map((pick, i) => `<li>
      <b>${escapeHtml(pick.name)}</b>
      <small>${pick.bitmap.width}×${pick.bitmap.height} · ${pick.hasAlpha ? '투명 배경' : '배경 있음'}</small>
      <em>${kb(pick.size)}</em>
      <button type="button" class="setup-pick-drop" data-drop="${i}" title="빼기">×</button>
    </li>`).join('')}</ul>
    <button type="button" class="tool-clear bm-clear"><i data-lucide="x"></i>이미지 모두 빼기</button>` : ''}`;

  const KIND_LABEL = {
    kakao: { object: '오브젝트형', thumb: '썸네일-박스형' },
    gfa: { object: '누끼형', thumb: '썸네일형' },
  };
  const kindLabel = (kind) => KIND_LABEL[state.media === 'kakao' ? 'kakao' : 'gfa'][kind];

  const issueList = (issues) => (issues.length
    ? `<ul class="bm-issues">${issues.map((one) => `<li class="is-${one.level}">${escapeHtml(one.text)}</li>`).join('')}</ul>` : '');

  const cardOf = (item) => {
    const { row } = item;
    const copy = `<p class="bm-copy"><b>${escapeHtml(row.main) || '<i>메인 없음</i>'}</b>${row.main2 ? `<b>${escapeHtml(row.main2)}</b>` : ''}${row.sub ? `<span>${escapeHtml(row.sub)}</span>` : ''}</p>`;
    const note = row.note ? `<p class="bm-tnd-note">T&amp;D 메모: ${escapeHtml(row.note)}</p>` : '';
    if (!item.pick) {
      return `<article class="bm-card is-none">
        <div class="bm-card-head"><b>${escapeHtml(row.key)}</b><em>이미지 없음</em></div>
        ${copy}${note}${issueList(item.issues)}
        <p class="setup-note">파일 이름에 <b>${escapeHtml(row.key)}</b> 가 들어간 이미지를 넣으면 만들어집니다.</p>
      </article>`;
    }
    const pickAt = picks.indexOf(item.pick);
    const many = item.outputs.length > 1;
    return `<article class="bm-card is-${levelOf(item)}">
      <div class="bm-card-head">
        <b>${escapeHtml(row.key)}</b>
        <button type="button" class="bm-kind" data-kind="${pickAt}" title="눌러서 유형 바꾸기">${kindLabel(item.kind)} <i data-lucide="repeat"></i></button>
        <em>${escapeHtml(item.pick.name)}</em>
      </div>
      ${copy}${note}${issueList(item.issues)}
      ${item.outputs.map((one) => `<div class="bm-output">
        ${many ? `<div class="bm-output-head"><b>${escapeHtml(one.spec.label)}</b><em>${kb(one.blob.size)}</em></div>` : ''}
        <div class="bm-preview" style="background:${one.spec.preview}"><img src="${one.url}" alt="${escapeHtml(one.name)}" width="${one.spec.w}" height="${one.spec.h}"></div>
        ${issueList(one.issues) || '<p class="bm-pass"><i data-lucide="circle-check"></i>가이드 검사 통과</p>'}
        <a class="tool-copy" href="${one.url}" download="${escapeHtml(one.name)}"><i data-lucide="download"></i>${escapeHtml(one.name)}${many ? '' : ` · ${kb(one.blob.size)}`}</a>
      </div>`).join('')}
    </article>`;
  };

  const resultBox = () => {
    const block = blockNow();
    if (!block) return '<p class="tool-empty">시트를 불러오면 여기에 결과가 나옵니다.</p>';
    if (!picks.length) return '<p class="tool-empty">이미지를 넣으면 행사의 소재명과 짝지어 바로 만듭니다.</p>';
    if (generating && !results.length) return '<p class="tool-empty">만드는 중…</p>';
    const count = { ok: 0, warn: 0, bad: 0, none: 0 };
    results.forEach((item) => { count[levelOf(item)] += 1; });
    const ready = zipReady().length;
    const used = new Set(results.map((item) => item.pick).filter(Boolean));
    const spare = picks.filter((pick) => !used.has(pick));
    return `<div class="bm-summary">
        <span class="is-ok">통과 ${count.ok}</span><span class="is-warn">확인 필요 ${count.warn}</span>
        <span class="is-bad">가이드 위반 ${count.bad}</span><span>이미지 없음 ${count.none}</span>
        <button type="button" class="tool-add bm-zip"${ready && !zipping ? '' : ' disabled'}><i data-lucide="file-archive"></i>${zipping ? '묶는 중…' : `PNG ${ready}장 ZIP 받기`}</button>
      </div>
      ${spare.length ? `<p class="setup-note">이 행사에 없는 이미지: ${spare.map((pick) => escapeHtml(pick.name)).join(', ')}</p>` : ''}
      <p class="setup-note">가이드 위반은 ZIP 에서 뺍니다 — 낱장으로는 받을 수 있습니다. 유형(오브젝트 · 썸네일)은 배경이 투명한지로 정했고, 카드의 유형 단추로 바꿀 수 있습니다.</p>
      <div class="bm-results">${results.map(cardOf).join('')}</div>`;
  };

  const render = () => {
    const now = media();
    const sheet = sheets.get(urlNow());
    const block = blockNow();
    const isGfa = state.media !== 'kakao';
    const sizePills = `<div class="setup-pills">${now.specs.map((key) => `<button type="button" class="setup-pill${state.sizes.includes(key) ? ' is-on' : ''}" data-size="${key}">${SPECS[key].label}</button>`).join('')}</div>`;
    section.innerHTML = `
      <div class="tool-head">
        <h2>소재 제작</h2>
        <p>T&amp;D 시트의 메인 · 서브카피와 누끼(투명 PNG) 또는 썸네일 이미지를 넣으면 매체 제작가이드 규격대로 배너를 만들어 줍니다.
        그림은 이 브라우저 안에서만 그립니다 — 이미지가 어디로도 올라가지 않습니다.</p>
      </div>

      <section class="tool-card">
        <h3>매체<small>${escapeHtml(now.note)}</small></h3>
        ${pills('media', Object.keys(MEDIA).map((key) => [MEDIA[key].label, key]), state.media)}
        ${isGfa ? `<div class="setup-row bm-options">
          <div class="setup-field"><span>만들 사이즈<small class="setup-hint">눌러서 빼기 · 넣기</small></span>${sizePills}</div>
          <div class="setup-field"><span>오브젝트 위치</span>${pills('side', [['왼쪽', 'left'], ['오른쪽', 'right']], state.side)}</div>
          <div class="setup-field"><span>꺾쇠(랜딩 아이콘)<small class="setup-hint">오브젝트가 왼쪽일 때만</small></span>${pills('chevron', [['없음', 'off'], ['넣기', 'on']], state.chevron ? 'on' : 'off')}</div>
        </div>` : ''}
      </section>

      <section class="tool-card">
        <h3><span class="setup-req">T&amp;D 시트</span>${block ? `<small>${escapeHtml(block.id)} · ${block.rows.length}줄</small>` : ''}</h3>
        <div class="bm-url">
          <input type="text" data-field="url" value="${escapeHtml(urlNow())}" placeholder="https://docs.google.com/spreadsheets/d/…#gid=… (${escapeHtml(now.label)} 탭)">
          <button type="button" class="tool-add bm-load"${sheet && sheet.state === 'loading' ? ' disabled' : ''}><i data-lucide="refresh-cw"></i>불러오기</button>
        </div>
        ${sheetBox()}
      </section>

      <section class="tool-card">
        <h3><span class="setup-req">이미지</span>${picks.length ? `<small>${picks.length}개</small>` : ''}</h3>
        ${pickBox()}
      </section>

      <section class="tool-card">
        <h3>결과${generating ? '<small>만드는 중…</small>' : ''}</h3>
        ${resultBox()}
      </section>`;
    if (window.lucide) window.lucide.createIcons();
  };

  section.addEventListener('click', (event) => {
    const hit = (selector) => event.target.closest(selector);
    let el;
    if ((el = hit('[data-media]'))) {
      state.media = el.dataset.media;
      save();
      if (urlNow() && !sheets.has(urlNow())) loadSheet();
      else regenerate();
    } else if ((el = hit('[data-size]'))) {
      const key = el.dataset.size;
      state.sizes = state.sizes.includes(key) ? state.sizes.filter((one) => one !== key) : [...state.sizes, key];
      save();
      regenerate();
    } else if ((el = hit('[data-side]'))) {
      state.side = el.dataset.side;
      save();
      regenerate();
    } else if ((el = hit('[data-chevron]'))) {
      state.chevron = el.dataset.chevron === 'on';
      save();
      regenerate();
    } else if (hit('.bm-load')) {
      loadSheet();
    } else if ((el = hit('[data-drop]'))) {
      picks.splice(Number(el.dataset.drop), 1);
      regenerate();
    } else if (hit('.bm-clear')) {
      picks = [];
      pickNote = '';
      regenerate();
    } else if ((el = hit('[data-kind]'))) {
      const pick = picks[Number(el.dataset.kind)];
      if (pick) {
        const now = pick.kind || (pick.hasAlpha ? 'object' : 'thumb');
        pick.kind = now === 'object' ? 'thumb' : 'object';
        regenerate();
      }
    } else if (hit('.bm-zip')) {
      zipAll();
    }
  });

  section.addEventListener('change', (event) => {
    const { target } = event;
    if (target.id === 'bm-files' || target.id === 'bm-folder') {
      addFiles(target.files, target.id === 'bm-folder');
      target.value = '';
    } else if (target.id === 'bm-logo') {
      setLogo(target.files && target.files[0]);
      target.value = '';
    } else if (target.classList.contains('bm-block')) {
      state.blocks[state.media] = target.value;
      save();
      regenerate();
    }
  });

  section.addEventListener('input', (event) => {
    if (event.target.dataset.field !== 'url') return;
    state.urls[state.media] = event.target.value.trim();
    save();
  });
  section.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.dataset.field === 'url') loadSheet();
  });

  section.addEventListener('dragover', (event) => {
    const box = event.target.closest('.setup-drop');
    if (!box) return;
    event.preventDefault();
    box.classList.add('is-over');
  });
  section.addEventListener('dragleave', (event) => {
    const box = event.target.closest('.setup-drop');
    if (box) box.classList.remove('is-over');
  });
  section.addEventListener('drop', (event) => {
    if (!event.target.closest('.setup-drop')) return;
    event.preventDefault();
    addFiles(event.dataTransfer && event.dataTransfer.files);
  });

  // 화면을 처음 열 때 글꼴을 받고, 적어 둔 시트가 있으면 읽어 둔다
  let opened = false;
  const onOpen = () => {
    if (section.hidden || opened) return;
    opened = true;
    bannerMaker.loadFonts().catch(() => {});
    if (urlNow() && !sheets.has(urlNow())) loadSheet();
  };
  new MutationObserver(onOpen).observe(section, { attributes: true, attributeFilter: ['hidden'] });

  render();
  onOpen();
})();
