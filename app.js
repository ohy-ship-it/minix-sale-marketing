lucide.createIcons();

const creativeBoard = document.querySelector('#creative-board');
if (creativeBoard) {
  const STATUS_OPTIONS = [
    ['요청', 'green'],
    ['진행 중', 'blue'],
    ['전달 완료', 'yellow'],
    ['최종 완료(세팅)', 'default'],
    ['홀딩/리터치', 'brown'],
  ];
  const MEDIA_OPTIONS = [
    ['브랜드검색', 'yellow'], ['메타', 'green'], ['GFA-피드', 'pink'], ['GFA-스마트채널', 'gray'],
    ['GFA-쇼핑소식', 'blue'], ['구글-디맨드젠', 'red'], ['카카오-비즈보드', 'brown'], ['카카오-디스플레이', 'purple'],
    ['자사몰-페이지(썸네일+행사배너)', 'orange'], ['카카오-친구채널(프로필+홈소식)', 'default'], ['토스-쇼핑라이브', 'yellow'],
    ['토스-머니알림', 'yellow'], ['카카오-CRM', 'orange'], ['네이버톡톡-CRM', 'blue'], ['당근-이미지', 'yellow'],
    ['웹푸시-CRM', 'green'], ['신제품', 'purple'],
  ];
  const CHANNEL_OPTIONS = [
    ['네이버', 'green'], ['오늘의집', 'blue'], ['컬리', 'purple'], ['이마트', 'yellow'], ['CJ', 'purple'],
    ['하이마트', 'red'], ['G마켓', 'green'], ['CJ홈쇼핑', 'purple'], ['현대홈쇼핑', 'green'], ['토스', 'blue'],
    ['29CM', 'gray'], ['롯데홈쇼핑', 'default'], ['자사몰', 'orange'], ['카카오', 'pink'], ['쿠팡', 'brown'],
    ['11번가', 'default'],
  ];
  const OWNER_OPTIONS = [['오해영', 'orange'], ['이정민', 'blue'], ['김진빈', 'yellow'], ['김서영', 'purple']];
  const SKU_OPTIONS = [
    ['더플렌더mini', 'orange'], ['더플렌더max', 'orange'], ['더 에어드라이', 'green'],
    ['더 시프트', 'blue'], ['하드필터', 'pink'], ['하드락필터', 'brown'],
  ];

  const SCHEMA = [
    { key: 'name', name: '이름', type: 'title', icon: 'type' },
    { key: 'sku', name: 'SKU', type: 'multi_select', icon: 'tag', options: SKU_OPTIONS },
    { key: 'status', name: '상태', type: 'status', icon: 'loader', options: STATUS_OPTIONS },
    // 행사채널은 값은 보관하되 화면에는 내보내지 않는다
    { key: 'channel', name: '행사채널', type: 'select', icon: 'circle-chevron-down', options: CHANNEL_OPTIONS, hidden: true },
    { key: 'event', name: '행사명', type: 'text', icon: 'align-left' },
    { key: 'owners', name: '담당자', type: 'multi_select', icon: 'users', options: OWNER_OPTIONS },
    { key: 'eventDate', name: '행사일정', type: 'date', icon: 'calendar' },
    { key: 'dueDate', name: '전달희망일정', type: 'date', icon: 'calendar' },
    { key: 'media', name: '매체', type: 'multi_select', icon: 'list', options: MEDIA_OPTIONS },
    { key: 'creativeCount', name: '소재 갯수', type: 'computed', icon: 'hash' },
  ];
  // 보드 카드에 노출할 속성 (요청받은 순서)
  const CARD_PROPS = ['sku', 'owners', 'dueDate', 'creativeCount'];
  const propByKey = Object.fromEntries(SCHEMA.map((prop) => [prop.key, prop]));
  const colorOf = (prop, value) => (prop.options || []).find(([option]) => option === value)?.[1] || 'default';

  const COLUMN_CLASS = {
    '요청': 'request-column',
    '진행 중': 'progress-column',
    '전달 완료': 'delivered-column',
    '최종 완료(세팅)': 'final-column',
    '홀딩/리터치': 'hold-column',
  };

  const SEED = [
    { name: '[당일/사후] 카카오톡딜위크', event: '카카오톡딜위크', status: '요청', media: ['브랜드검색', '메타', '카카오-비즈보드'], channel: '카카오', owners: ['오해영', '이정민'], eventDate: { start: '2026-09-10', end: '2026-09-13' }, dueDate: { start: '2026-09-08' }, sku: ['더플렌더mini'] },
    { name: '[상시/오프-온라인] 하이마트 미니 런칭기념 행사', event: '하이마트 미니 런칭기념 행사', status: '진행 중', media: ['메타'], channel: '하이마트', owners: ['김서영', '김진빈'], eventDate: { start: '2026-09-06', end: '2026-09-08' }, dueDate: { start: '2026-09-03' }, sku: ['더플렌더mini'] },
    { name: '[당일/상시] 브티나는 생활 MLC', event: '브티나는 생활 MLC', status: '진행 중', media: ['브랜드검색', '메타', 'GFA-스마트채널', 'GFA-피드'], channel: 'CJ', owners: ['이정민', '오해영'], eventDate: { start: '2026-09-02', end: '2026-09-04' }, dueDate: { start: '2026-08-31' }, sku: ['더플렌더mini', '더플렌더max'] },
    { name: '[당일] 오늘의집 라이브', event: '오늘의집 라이브', status: '진행 중', media: ['브랜드검색', '메타'], channel: '오늘의집', owners: ['오해영', '김서영'], eventDate: { start: '2026-09-09' }, dueDate: { start: '2026-09-07' }, sku: ['더플렌더mini'] },
    { name: '[당일] 현대홈쇼핑 MLC', event: '현대홈쇼핑 MLC', status: '전달 완료', media: ['메타', '브랜드검색'], channel: '현대홈쇼핑', owners: ['김진빈', '이정민'], eventDate: { start: '2026-08-31' }, dueDate: { start: '2026-08-27' }, sku: ['더 에어드라이'] },
  ];

  const NOTE_TEMPLATE = '소재 소구 : ';
  const STORAGE_KEY = 'minix-creative-weeks-v1';
  const LEGACY_KEY = 'minix-creative-requests-v2';
  const newId = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

  const normalize = (row) => ({
    id: row.id || newId(),
    name: row.name || '',
    event: row.event || '',
    status: STATUS_OPTIONS.some(([option]) => option === row.status) ? row.status : '요청',
    media: Array.isArray(row.media) ? row.media : [],
    channel: row.channel || '',
    owners: Array.isArray(row.owners) ? row.owners : [],
    eventDate: row.eventDate?.start ? { start: row.eventDate.start, end: row.eventDate.end || '' } : null,
    dueDate: row.dueDate?.start ? { start: row.dueDate.start, end: row.dueDate.end || '' } : null,
    sku: Array.isArray(row.sku) ? row.sku : [],
    note: typeof row.note === 'string' ? row.note : '',
    mediaNotes: row.mediaNotes && typeof row.mediaNotes === 'object' ? { ...row.mediaNotes } : {},
    mediaCounts: row.mediaCounts && typeof row.mediaCounts === 'object' ? { ...row.mediaCounts } : {},
    mediaDue: row.mediaDue && typeof row.mediaDue === 'object' ? { ...row.mediaDue } : {},
  });

  const MONTH_CHOICES = Array.from({ length: 12 }, (unused, index) => `${index + 1}월`);
  const WEEK_CHOICES = ['1주차', '2주차', '3주차', '4주차', '5주차'];

  const yearFor = (date) => `${date.getFullYear()}년`;
  const monthFor = (date) => `${date.getMonth() + 1}월`;
  const weekNoFor = (date) => WEEK_CHOICES[Math.min(Math.ceil(date.getDate() / 7), WEEK_CHOICES.length) - 1];

  const normalizeWeek = (week) => {
    // 예전 구조("8월 4주차" 한 덩어리)를 월/주차로 나눠 받는다
    const [, oldMonth, oldWeek] = /^\s*(\d+월)\s*(.*)$/.exec(week.label || '') || [];
    return {
      id: week.id || newId(),
      year: week.year || yearFor(new Date()),
      month: week.month || oldMonth || monthFor(new Date()),
      week: week.week || oldWeek || weekNoFor(new Date()),
      rows: Array.isArray(week.rows) ? week.rows.map(normalize) : [],
    };
  };

  const weekName = (week) => `${week.year} ${week.month} ${week.week}`;
  // 요청 건수는 SKU 단위로 센다 (카드 하나에 SKU 2개면 2건, SKU 미지정 카드는 1건)
  const skuCount = (week) => week.rows.reduce((sum, row) => sum + Math.max(row.sku.length, 1), 0);
  const shareLink = (week) => `${window.location.origin}${window.location.pathname}#creative-planning/${week.id}`;

  const firstWeek = () => {
    let legacy = null;
    try { legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null'); } catch { legacy = null; }
    const seedRows = Array.isArray(legacy) && legacy.length ? legacy : SEED;
    return [normalizeWeek({ year: '2026년', month: '8월', week: '4주차', rows: seedRows })];
  };

  let weeks;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    weeks = Array.isArray(stored) && stored.length ? stored.map(normalizeWeek) : firstWeek();
  } catch {
    weeks = firstWeek();
  }

  let currentWeekId = null;
  let rows = [];
  const currentWeek = () => weeks.find((week) => week.id === currentWeekId) || null;
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(weeks));

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const isIsoDay = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');
  const weekdayOf = (value) => {
    if (!isIsoDay(value)) return '';
    const at = new Date(`${value}T00:00:00`);
    return Number.isNaN(at.getTime()) ? '' : WEEKDAYS[at.getDay()];
  };
  const formatDay = (value) => {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    const weekday = weekdayOf(value);
    return `${year}년 ${Number(month)}월 ${Number(day)}일${weekday ? ` (${weekday})` : ''}`;
  };
  const formatDate = (date) => {
    if (!date?.start) return '';
    return date.end ? `${formatDay(date.start)} → ${formatDay(date.end)}` : formatDay(date.start);
  };
  const sumOfDigits = (text) => (String(text ?? '').match(/\d+/g) || []).reduce((sum, part) => sum + Number(part), 0);
  const creativeTotal = (row) => row.media.reduce((sum, name) => sum + sumOfDigits(row.mediaCounts[name]), 0);

  const chip = (prop, value) => `<span class="chip chip-${colorOf(prop, value)}">${escapeHtml(value)}</span>`;
  const filterChip = (key, value) => `<span class="chip chip-${colorOf(propByKey[key], value)} chip-filter" data-facet="${key}" data-value="${escapeHtml(value)}" role="button" tabindex="0" title="${escapeHtml(value)} 카드만 보기">${escapeHtml(value)}</span>`;

  const board = document.createElement('div');
  board.className = 'notion-board';
  const peek = document.createElement('div');
  peek.className = 'peek';
  creativeBoard.innerHTML = '';
  const weekList = document.createElement('div');
  weekList.className = 'week-list';
  const boardView = document.createElement('div');
  boardView.className = 'board-view';
  boardView.hidden = true;
  boardView.innerHTML = `
    <div class="board-head">
      <button class="back-to-list" type="button"><i data-lucide="chevron-left"></i>주간 목록</button>
      <h2 class="board-title"></h2>
    </div>
    <div class="notion-toolbar"><button class="new-page-button" type="button"><i data-lucide="plus"></i>요청하기</button></div>`;
  const filters = document.createElement('div');
  filters.className = 'board-filters';
  boardView.appendChild(filters);
  boardView.appendChild(board);
  boardView.appendChild(peek);
  creativeBoard.appendChild(weekList);
  creativeBoard.appendChild(boardView);

  const FACETS = [
    { key: 'owners', label: '담당자', icon: 'users', options: OWNER_OPTIONS },
    { key: 'sku', label: 'SKU', icon: 'tag', options: SKU_OPTIONS },
  ];
  const active = { owners: [], sku: [] };
  let openId = null;

  const anyFilter = () => FACETS.some((facet) => active[facet.key].length > 0);
  const visibleRows = () => (anyFilter()
    ? rows.filter((row) => FACETS.every((facet) => !active[facet.key].length
      || row[facet.key].some((value) => active[facet.key].includes(value))))
    : rows);

  const renderTally = (label, icon, tally, colorFor, emptyText = '요청 없음') => {
    const entries = [...tally.entries()];
    if (!entries.length) return `<div class="sku-summary"><span class="sku-summary-label"><i data-lucide="${icon}"></i>${escapeHtml(label)}</span><span class="sku-summary-empty">${escapeHtml(emptyText)}</span></div>`;
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    return `<div class="sku-summary">
      <span class="sku-summary-label"><i data-lucide="${icon}"></i>${escapeHtml(label)}</span>
      ${entries.map(([name, count]) => `<span class="sku-tally"><span class="chip chip-${colorFor(name)}">${escapeHtml(name)}</span><b>${count}건</b></span>`).join('')}
      <span class="sku-summary-total">합계 ${total}건</span>
    </div>`;
  };

  const renderSkuSummary = () => {
    const counts = new Map();
    visibleRows().forEach((row) => {
      const names = row.sku.length ? row.sku : ['미지정'];
      names.forEach((name) => counts.set(name, (counts.get(name) || 0) + 1));
    });
    const ordered = new Map([...SKU_OPTIONS.map(([name]) => name), '미지정']
      .filter((name) => counts.has(name))
      .map((name) => [name, counts.get(name)]));
    return renderTally('SKU 건수', 'layers', ordered, (name) => (name === '미지정' ? 'gray' : colorOf(propByKey.sku, name)));
  };

  // 담당자별 소재 갯수 (매체별 입력 합계를 담당자에게 붙인다)
  const renderOwnerSummary = () => {
    const counts = new Map();
    visibleRows().forEach((row) => {
      const total = creativeTotal(row);
      if (!total) return;
      const names = row.owners.length ? row.owners : ['미지정'];
      names.forEach((name) => counts.set(name, (counts.get(name) || 0) + total));
    });
    const order = [...OWNER_OPTIONS.map(([name]) => name), '미지정'];
    const ordered = new Map(order.filter((name) => counts.has(name)).map((name) => [name, counts.get(name)]));
    return renderTally('담당자별 소재 갯수', 'users', ordered, (name) => (name === '미지정' ? 'gray' : colorOf(propByKey.owners, name)), '소재 갯수 입력 없음');
  };

  const renderFilters = () => {
    filters.innerHTML = `<div class="board-summaries">${renderSkuSummary()}${renderOwnerSummary()}</div>` + FACETS.map((facet) => `<div class="filter-row${active[facet.key].length ? ' is-active' : ''}">
        <span class="filter-label"><i data-lucide="${facet.icon}"></i>${escapeHtml(facet.label)}</span>
        <span class="filter-options">${facet.options.map(([name, color]) => `<button type="button" class="filter-chip chip chip-${color}${active[facet.key].includes(name) ? ' is-on' : ''}" data-facet="${facet.key}" data-value="${escapeHtml(name)}" aria-pressed="${active[facet.key].includes(name)}">${escapeHtml(name)}</button>`).join('')}</span>
      </div>`).join('')
      + (anyFilter()
        ? `<div class="filter-summary"><button type="button" class="filter-clear">전체 보기</button><span class="filter-count">${visibleRows().length}개 표시</span></div>`
        : '');
    lucide.createIcons();
  };

  const toggleFilter = (key, value) => {
    active[key] = active[key].includes(value) ? active[key].filter((entry) => entry !== value) : [...active[key], value];
    renderBoard();
  };

  const DATE_LABEL = { eventDate: '행사', dueDate: '전달 희망' };
  const cardLine = (row, key) => {
    const prop = propByKey[key];
    if (prop.type === 'computed') {
      const total = creativeTotal(row);
      return total ? `<p><span class="card-key">${escapeHtml(prop.name)}</span>${total}개</p>` : '';
    }
    const value = row[key];
    if (prop.type === 'multi_select') {
      if (!value.length) return '';
      const marks = value.map((item) => (FACETS.some((facet) => facet.key === key) ? filterChip(key, item) : chip(prop, item)));
      return `<div class="chips">${marks.join('')}</div>`;
    }
    if (prop.type === 'status' || prop.type === 'select') {
      return value ? `<div class="chips">${chip(prop, value)}</div>` : '';
    }
    if (prop.type === 'date') {
      return value ? `<p><span class="card-key">${DATE_LABEL[key]}</span>${escapeHtml(formatDate(value))}</p>` : '';
    }
    return value ? `<p>${escapeHtml(value)}</p>` : '';
  };

  const filterDefaults = () => Object.fromEntries(FACETS.map((facet) => [facet.key, [...active[facet.key]]]));

  const renderBoard = () => {
    const shown = visibleRows();
    board.innerHTML = STATUS_OPTIONS.map(([status]) => {
      const group = shown.filter((row) => row.status === status);
      const cards = group.map((row) => `
        <article class="notion-card" draggable="true" data-id="${row.id}">
          <h3>${escapeHtml(row.name || '제목 없음')}</h3>
          ${CARD_PROPS.map((key) => cardLine(row, key)).join('')}
        </article>`).join('');
      return `<div class="notion-column ${COLUMN_CLASS[status]}" data-status="${escapeHtml(status)}">
        <div class="notion-column-title"><span>● ${escapeHtml(status)}</span><b>${group.length}</b></div>
        ${cards}
        <button class="new-page" type="button"><i data-lucide="plus"></i>새 페이지</button>
      </div>`;
    }).join('');
    lucide.createIcons();
    renderFilters();
  };

  const closePeek = () => { openId = null; peek.innerHTML = ''; peek.classList.remove('is-open'); };

  const propertyControl = (row, prop) => {
    if (prop.type === 'computed') {
      const total = creativeTotal(row);
      return `<span class="peek-computed" data-computed="${prop.key}">${total ? `${total}개` : '비어 있음'}<small>매체별 입력 합계</small></span>`;
    }
    const value = row[prop.key];
    if (prop.type === 'title' || prop.type === 'text') {
      return `<input class="peek-input" data-edit="${prop.key}" value="${escapeHtml(value)}" placeholder="비어 있음">`;
    }
    if (prop.type === 'date') {
      return `<span class="peek-date">
        <input type="date" data-edit="${prop.key}" data-part="start" value="${escapeHtml(value?.start || '')}">
        <span class="peek-arrow"${value?.end ? '' : ' hidden'}>→</span>
        <input type="date" data-edit="${prop.key}" data-part="end" value="${escapeHtml(value?.end || '')}"${value?.end ? '' : ' hidden'}>
        <button type="button" class="peek-range" data-edit="${prop.key}">${value?.end ? '종료일 제거' : '종료일 추가'}</button>
        ${value?.start ? `<span class="peek-date-text">${escapeHtml(formatDate(value))}</span>` : ''}
      </span>`;
    }
    const selected = prop.type === 'multi_select' ? value : (value ? [value] : []);
    return `<button type="button" class="peek-picker" data-picker="${prop.key}">
        ${selected.length ? selected.map((item) => chip(prop, item)).join('') : '<span class="peek-empty">비어 있음</span>'}
      </button>
      <div class="peek-options" data-options="${prop.key}" hidden>
        ${prop.options.map(([option]) => `<button type="button" class="peek-option${selected.includes(option) ? ' is-selected' : ''}" data-option="${escapeHtml(option)}">${chip(prop, option)}</button>`).join('')}
      </div>`;
  };

  const renderMediaNotes = (row) => {
    if (!row.media.length) return '';
    return `<div class="media-notes">
      ${row.media.map((name) => `<section class="media-note note-${colorOf(propByKey.media, name)}" data-media="${escapeHtml(name)}">
        <div class="media-note-head">
          <span class="media-note-name">
            <button type="button" class="media-drag" aria-label="순서 변경" title="끌어서 순서 변경"><i data-lucide="grip-vertical"></i></button>
            <span class="chip chip-${colorOf(propByKey.media, name)}">${escapeHtml(name)}</span>
            <button type="button" class="media-remove" aria-label="칸 삭제" title="이 칸 삭제"><i data-lucide="x"></i></button>
          </span>
          <span class="media-note-fields">
            <label class="media-count">전달 희망일정<input type="date" data-due="${escapeHtml(name)}" value="${isIsoDay(row.mediaDue[name]) ? escapeHtml(row.mediaDue[name]) : ''}"></label>
            ${row.mediaDue[name] ? `<span class="media-due-text">${escapeHtml(isIsoDay(row.mediaDue[name]) ? formatDay(row.mediaDue[name]) : row.mediaDue[name])}</span>` : ''}
            <label class="media-count">소재 갯수<input type="text" data-count="${escapeHtml(name)}" value="${escapeHtml(row.mediaCounts[name] ?? '')}" placeholder="예: 3종"></label>
          </span>
        </div>
        <textarea class="media-note-input" data-note="${escapeHtml(name)}" rows="6" spellcheck="false" placeholder="요청 내용을 자유롭게 적어 주세요.">${escapeHtml(row.mediaNotes[name] ?? NOTE_TEMPLATE)}</textarea>
      </section>`).join('')}
    </div>`;
  };

  const renderPeek = () => {
    const row = rows.find((entry) => entry.id === openId);
    if (!row) return closePeek();
    peek.innerHTML = `
      <div class="peek-backdrop"></div>
      <aside class="peek-panel" role="dialog" aria-label="요청 상세">
        <header class="peek-head">
          <button type="button" class="peek-close" aria-label="닫기"><i data-lucide="x"></i></button>
          <button type="button" class="peek-delete"><i data-lucide="trash-2"></i>삭제</button>
        </header>
        <textarea class="peek-title" rows="1" data-edit="name" placeholder="제목 없음">${escapeHtml(row.name)}</textarea>
        <div class="peek-props">
          ${SCHEMA.filter((prop) => prop.key !== 'name' && !prop.hidden).map((prop) => `
            <div class="peek-row">
              <span class="peek-label"><i data-lucide="${prop.icon}"></i>${escapeHtml(prop.name)}</span>
              <div class="peek-value">${propertyControl(row, prop)}</div>
            </div>`).join('')}
        </div>
        <textarea class="peek-body" data-edit="note" rows="5" spellcheck="false" placeholder="매체를 고르지 않아도 여기에 자유롭게 적을 수 있습니다.">${escapeHtml(row.note)}</textarea>
        ${renderMediaNotes(row)}
        <footer class="peek-footer">
          <p class="peek-warning" hidden>제목을 입력해 주세요.</p>
          <button type="button" class="peek-done">요청 완료하기</button>
        </footer>
      </aside>`;
    peek.classList.add('is-open');
    lucide.createIcons();
  };

  const openPeek = (id) => { openId = id; renderPeek(); peek.querySelector('.peek-title')?.focus(); };

  const commit = ({ redrawPeek = true } = {}) => {
    save();
    renderBoard();
    if (redrawPeek && openId) renderPeek();
  };

  board.addEventListener('click', (event) => {
    const addButton = event.target.closest('.new-page');
    if (addButton) {
      const status = addButton.closest('.notion-column').dataset.status;
      const row = normalize({ status, ...filterDefaults() });
      rows.push(row);
      save();
      renderBoard();
      openPeek(row.id);
      return;
    }
    const tag = event.target.closest('.chip-filter');
    if (tag) return toggleFilter(tag.dataset.facet, tag.dataset.value);
    const card = event.target.closest('.notion-card');
    if (card) openPeek(card.dataset.id);
  });

  filters.addEventListener('click', (event) => {
    const chipButton = event.target.closest('.filter-chip');
    if (chipButton) return toggleFilter(chipButton.dataset.facet, chipButton.dataset.value);
    if (event.target.closest('.filter-clear')) {
      FACETS.forEach((facet) => { active[facet.key] = []; });
      renderBoard();
    }
  });

  let draggingId = null;
  board.addEventListener('dragstart', (event) => {
    const card = event.target.closest('.notion-card');
    if (!card) return;
    draggingId = card.dataset.id;
    card.classList.add('is-dragging');
  });
  board.addEventListener('dragend', (event) => event.target.closest('.notion-card')?.classList.remove('is-dragging'));
  board.addEventListener('dragover', (event) => { if (event.target.closest('.notion-column')) event.preventDefault(); });
  board.addEventListener('drop', (event) => {
    const column = event.target.closest('.notion-column');
    if (!column || !draggingId) return;
    event.preventDefault();
    const row = rows.find((entry) => entry.id === draggingId);
    draggingId = null;
    if (!row || row.status === column.dataset.status) return;
    row.status = column.dataset.status;
    commit();
  });

  peek.addEventListener('click', (event) => {
    if (event.target.closest('.peek-backdrop') || event.target.closest('.peek-close')) return closePeek();
    const row = rows.find((entry) => entry.id === openId);
    if (!row) return;
    if (event.target.closest('.peek-delete')) {
      const index = rows.findIndex((entry) => entry.id === row.id);
      if (index >= 0) rows.splice(index, 1);
      closePeek();
      save();
      renderBoard();
      return;
    }
    const removeMedia = event.target.closest('.media-remove');
    if (removeMedia) {
      const name = removeMedia.closest('.media-note').dataset.media;
      row.media = row.media.filter((entry) => entry !== name);
      delete row.mediaNotes[name];
      delete row.mediaCounts[name];
      delete row.mediaDue[name];
      commit();
      return;
    }
    if (event.target.closest('.peek-done')) {
      if (!row.name.trim()) {
        peek.querySelector('.peek-warning').hidden = false;
        peek.querySelector('.peek-title').focus();
        return;
      }
      return closePeek();
    }
    const picker = event.target.closest('.peek-picker');
    if (picker) {
      const list = peek.querySelector(`[data-options="${picker.dataset.picker}"]`);
      peek.querySelectorAll('.peek-options').forEach((other) => { if (other !== list) other.hidden = true; });
      list.hidden = !list.hidden;
      return;
    }
    const option = event.target.closest('.peek-option');
    if (option) {
      const key = option.closest('.peek-options').dataset.options;
      const prop = propByKey[key];
      const picked = option.dataset.option;
      if (prop.type === 'multi_select') {
        row[key] = row[key].includes(picked) ? row[key].filter((item) => item !== picked) : [...row[key], picked];
        if (key === 'media' && row.media.includes(picked) && row.mediaNotes[picked] === undefined) row.mediaNotes[picked] = NOTE_TEMPLATE;
      } else {
        row[key] = row[key] === picked ? '' : picked;
      }
      commit();
      if (prop.type === 'multi_select') peek.querySelector(`[data-options="${key}"]`).hidden = false;
      return;
    }
    const range = event.target.closest('.peek-range');
    if (range) {
      const key = range.dataset.edit;
      const current = row[key] || { start: '' };
      row[key] = current.end ? { start: current.start, end: '' } : { start: current.start || new Date().toISOString().slice(0, 10), end: current.start || new Date().toISOString().slice(0, 10) };
      if (!row[key].start) row[key] = null;
      commit();
      return;
    }
    if (!event.target.closest('.peek-options')) peek.querySelectorAll('.peek-options').forEach((list) => { list.hidden = true; });
  });

  peek.addEventListener('input', (event) => {
    const count = event.target.closest('[data-count]');
    if (count) {
      const row = rows.find((entry) => entry.id === openId);
      if (!row) return;
      if (count.value === '') delete row.mediaCounts[count.dataset.count];
      else row.mediaCounts[count.dataset.count] = count.value;
      save();
      renderBoard();
      const totalField = peek.querySelector('[data-computed="creativeCount"]');
      if (totalField) {
        const total = creativeTotal(row);
        totalField.firstChild.textContent = total ? `${total}개` : '비어 있음';
      }
      return;
    }
    const note = event.target.closest('[data-note]');
    if (note) {
      const row = rows.find((entry) => entry.id === openId);
      if (!row) return;
      row.mediaNotes[note.dataset.note] = note.value;
      save();
      return;
    }
    const field = event.target.closest('[data-edit]');
    if (!field || field.type === 'date') return;
    const row = rows.find((entry) => entry.id === openId);
    if (!row) return;
    row[field.dataset.edit] = field.value;
    commit({ redrawPeek: false });
  });

  peek.addEventListener('change', (event) => {
    const due = event.target.closest('[data-due]');
    if (due) {
      const row = rows.find((entry) => entry.id === openId);
      if (!row) return;
      if (due.value === '') delete row.mediaDue[due.dataset.due];
      else row.mediaDue[due.dataset.due] = due.value;
      commit();
      return;
    }
    const field = event.target.closest('[data-edit]');
    if (!field) return;
    const row = rows.find((entry) => entry.id === openId);
    if (!row) return;
    const key = field.dataset.edit;
    if (field.type === 'date') {
      const current = row[key] || { start: '', end: '' };
      const next = { ...current, [field.dataset.part]: field.value };
      row[key] = next.start ? next : null;
    } else return;
    commit();
  });

  let draggingMedia = null;
  const clearMediaDrag = () => {
    peek.querySelectorAll('.media-note').forEach((section) => {
      section.draggable = false;
      section.classList.remove('is-dragging', 'is-drop-target');
    });
  };
  peek.addEventListener('mousedown', (event) => {
    const handle = event.target.closest('.media-drag');
    if (handle) handle.closest('.media-note').draggable = true;
  });
  document.addEventListener('mouseup', () => { if (!draggingMedia) clearMediaDrag(); });
  peek.addEventListener('dragstart', (event) => {
    const section = event.target.closest('.media-note');
    if (!section || !section.draggable) return;
    draggingMedia = section.dataset.media;
    section.classList.add('is-dragging');
    event.dataTransfer?.setData('text/plain', draggingMedia);
  });
  peek.addEventListener('dragover', (event) => {
    if (!draggingMedia) return;
    const section = event.target.closest('.media-note');
    if (!section) return;
    event.preventDefault();
    peek.querySelectorAll('.media-note').forEach((entry) => entry.classList.toggle('is-drop-target', entry === section && entry.dataset.media !== draggingMedia));
  });
  peek.addEventListener('drop', (event) => {
    const section = event.target.closest('.media-note');
    if (!section || !draggingMedia) return;
    event.preventDefault();
    const row = rows.find((entry) => entry.id === openId);
    const moved = draggingMedia;
    draggingMedia = null;
    clearMediaDrag();
    if (!row) return;
    const from = row.media.indexOf(moved);
    const to = row.media.indexOf(section.dataset.media);
    if (from < 0 || to < 0 || from === to) return;
    row.media.splice(from, 1);
    row.media.splice(to, 0, moved);
    commit();
  });
  peek.addEventListener('dragend', () => { draggingMedia = null; clearMediaDrag(); });

  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && openId) closePeek(); });

  creativeBoard.querySelector('.new-page-button').addEventListener('click', () => {
    const row = normalize({ status: '요청', ...filterDefaults() });
    rows.push(row);
    save();
    renderBoard();
    openPeek(row.id);
  });

  let editingWeekId = null;
  const WEEK_FACETS = [
    { key: 'year', label: '년도', icon: 'calendar-range', color: 'blue' },
    { key: 'month', label: '월', icon: 'calendar', color: 'default' },
    { key: 'week', label: '주차', icon: 'calendar-days', color: 'orange', fixed: WEEK_CHOICES },
  ];
  const weekFilter = Object.fromEntries(WEEK_FACETS.map((facet) => [facet.key, []]));
  const byNumber = (a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0);
  const weekOptions = (facet) => facet.fixed
    || [...new Set(weeks.map((week) => week[facet.key]).filter(Boolean))].sort(byNumber);
  const anyWeekFilter = () => WEEK_FACETS.some((facet) => weekFilter[facet.key].length > 0);
  const filteredWeeks = () => (anyWeekFilter()
    ? weeks.filter((week) => WEEK_FACETS.every((facet) => !weekFilter[facet.key].length || weekFilter[facet.key].includes(week[facet.key])))
    : weeks);

  const renderWeekList = () => {
    weekList.innerHTML = `
      <div class="week-head">
        <h2>주간 소재요청</h2>
        <button type="button" class="week-add"><i data-lucide="plus"></i>주간 소재요청 추가</button>
      </div>
      <div class="week-filters">
        ${WEEK_FACETS.map((facet) => `<div class="week-filter-row${weekFilter[facet.key].length ? ' is-active' : ''}">
          <span class="filter-label"><i data-lucide="${facet.icon}"></i>${escapeHtml(facet.label)}</span>
          <span class="filter-options">${weekOptions(facet).map((value) => `<button type="button" class="week-filter-chip chip chip-${facet.color}${weekFilter[facet.key].includes(value) ? ' is-on' : ''}" data-facet="${facet.key}" data-value="${escapeHtml(value)}" aria-pressed="${weekFilter[facet.key].includes(value)}">${escapeHtml(value)}</button>`).join('')}</span>
        </div>`).join('')}
        ${anyWeekFilter() ? `<div class="filter-summary"><button type="button" class="week-filter-clear">전체 보기</button><span class="filter-count">${filteredWeeks().length}건 표시</span></div>` : ''}
      </div>
      <div class="week-table-wrap"><table class="week-table">
        <thead><tr><th>년도</th><th>월</th><th>주차</th><th>건수</th><th class="week-spacer"></th><th>수정</th><th>공유</th><th>삭제</th></tr></thead>
        <tbody>${filteredWeeks().map((week) => (week.id === editingWeekId ? `
          <tr class="week-row is-editing" data-week="${week.id}">
            <td><input class="week-input" data-field="year" value="${escapeHtml(week.year)}" placeholder="2026년"></td>
            <td><select class="week-input" data-field="month">${MONTH_CHOICES.map((name) => `<option${name === week.month ? ' selected' : ''}>${name}</option>`).join('')}</select></td>
            <td><select class="week-input" data-field="week">${WEEK_CHOICES.map((name) => `<option${name === week.week ? ' selected' : ''}>${name}</option>`).join('')}</select></td>
            <td class="week-count">${skuCount(week)}건</td>
            <td class="week-spacer"></td>
            <td colspan="3"><div class="week-edit-actions"><button type="button" class="week-save">저장</button><button type="button" class="week-cancel">취소</button></div></td>
          </tr>` : `
          <tr class="week-row" data-week="${week.id}">
            <td class="week-year">${escapeHtml(week.year)}</td>
            <td class="week-month">${escapeHtml(week.month)}</td>
            <td><span class="chip chip-orange">${escapeHtml(week.week)}</span></td>
            <td class="week-count">${skuCount(week)}건</td>
            <td class="week-spacer"></td>
            <td><button type="button" class="week-edit" aria-label="수정"><i data-lucide="pencil"></i></button></td>
            <td><button type="button" class="week-share" data-link="${escapeHtml(shareLink(week))}"><i data-lucide="link"></i>복사</button></td>
            <td><button type="button" class="week-delete">삭제</button></td>
          </tr>`)).join('') || '<tr class="week-empty"><td colspan="8">해당하는 주차가 없습니다.</td></tr>'}</tbody>
      </table></div>`;
    lucide.createIcons();
  };

  const openWeek = (id) => {
    const week = weeks.find((entry) => entry.id === id);
    if (!week) return;
    currentWeekId = id;
    rows = week.rows;
    FACETS.forEach((facet) => { active[facet.key] = []; });
    boardView.querySelector('.board-title').textContent = weekName(week);
    weekList.hidden = true;
    boardView.hidden = false;
    window.history.replaceState(null, '', `#creative-planning/${week.id}`);
    renderBoard();
  };

  const backToList = () => {
    closePeek();
    currentWeekId = null;
    rows = [];
    boardView.hidden = true;
    weekList.hidden = false;
    window.history.replaceState(null, '', '#creative-planning');
    renderWeekList();
  };

  weekList.addEventListener('click', (event) => {
    if (event.target.closest('.week-add')) {
      const week = normalizeWeek({ year: yearFor(new Date()), month: monthFor(new Date()), week: weekNoFor(new Date()) });
      weeks.unshift(week);
      editingWeekId = week.id;
      // 필터가 켜져 있으면 새 행이 걸러져 보이지 않으므로 해제한다
      WEEK_FACETS.forEach((facet) => { weekFilter[facet.key] = []; });
      save();
      renderWeekList();
      weekList.querySelector('.week-input')?.focus();
      return;
    }
    const copyButton = event.target.closest('.week-share');
    if (copyButton) {
      const link = copyButton.dataset.link;
      const done = () => { copyButton.classList.add('is-copied'); copyButton.lastChild.textContent = '복사됨'; };
      if (window.navigator.clipboard?.writeText) window.navigator.clipboard.writeText(link).then(done, () => window.prompt('링크를 복사하세요', link));
      else window.prompt('링크를 복사하세요', link);
      done();
      return;
    }
    const facetButton = event.target.closest('.week-filter-chip');
    if (facetButton) {
      const { facet, value } = facetButton.dataset;
      weekFilter[facet] = weekFilter[facet].includes(value)
        ? weekFilter[facet].filter((entry) => entry !== value)
        : [...weekFilter[facet], value];
      renderWeekList();
      return;
    }
    if (event.target.closest('.week-filter-clear')) {
      WEEK_FACETS.forEach((facet) => { weekFilter[facet.key] = []; });
      renderWeekList();
      return;
    }
    const rowElement = event.target.closest('.week-row');
    if (!rowElement) return;
    const week = weeks.find((entry) => entry.id === rowElement.dataset.week);
    if (!week) return;
    if (event.target.closest('.week-edit')) {
      editingWeekId = week.id;
      renderWeekList();
      weekList.querySelector('.week-input')?.focus();
      return;
    }
    if (event.target.closest('.week-save')) {
      rowElement.querySelectorAll('.week-input').forEach((field) => { week[field.dataset.field] = field.value.trim() || week[field.dataset.field]; });
      editingWeekId = null;
      save();
      renderWeekList();
      return;
    }
    if (event.target.closest('.week-cancel')) {
      editingWeekId = null;
      renderWeekList();
      return;
    }
    if (event.target.closest('.week-delete')) {
      if (!window.confirm(`'${weekName(week)}'을(를) 삭제할까요? 카드 ${week.rows.length}건이 함께 사라집니다.`)) return;
      weeks = weeks.filter((entry) => entry.id !== week.id);
      editingWeekId = null;
      save();
      renderWeekList();
      return;
    }
    if (editingWeekId === week.id) return;
    openWeek(week.id);
  });

  boardView.querySelector('.back-to-list').addEventListener('click', backToList);

  renderWeekList();

  const linkedId = window.location.hash.startsWith('#creative-planning/') ? window.location.hash.slice('#creative-planning/'.length) : '';
  if (linkedId && weeks.some((week) => week.id === linkedId)) openWeek(linkedId);
}

document.querySelectorAll('.tree-group').forEach((group) => {
  group.addEventListener('click', () => {
    group.classList.toggle('is-open');
    const children = group.nextElementSibling;
    children.hidden = !group.classList.contains('is-open');
    group.querySelector('svg')?.style.setProperty('transform', group.classList.contains('is-open') ? 'rotate(0deg)' : 'rotate(-90deg)');
  });
});

// 전용 화면을 가진 메뉴 (그 외에는 대시보드를 보여준다)
const VIEWS = {
  '광고소재 기획': { section: '#creative-board', hash: '#creative-planning' },
  '광고소재 파일명': { section: '#filename-tool', hash: '#filename' },
};
const DASHBOARD_PARTS = ['.content-tabs', '.target-section', '.channel-section', '.notes-section'];

document.querySelectorAll('[data-view]').forEach((item) => {
  item.addEventListener('click', () => {
    const view = VIEWS[item.dataset.view];
    document.querySelectorAll('[data-view]').forEach((entry) => entry.classList.remove('is-active'));
    item.classList.add('is-active');
    document.querySelector('#page-heading').textContent = item.dataset.view;
    DASHBOARD_PARTS.forEach((selector) => { document.querySelector(selector).hidden = Boolean(view); });
    Object.values(VIEWS).forEach((entry) => {
      document.querySelector(entry.section).hidden = !view || entry.section !== view.section;
    });
    const keepDetail = view && location.hash.startsWith(`${view.hash}/`);
    history.replaceState(null, '', view ? (keepDetail ? location.hash : view.hash) : '#dashboard');
  });
});

const openedView = Object.entries(VIEWS).find(([, entry]) => window.location.hash.startsWith(entry.hash));
if (openedView) document.querySelector(`button[data-view='${openedView[0]}']`)?.click();

document.querySelectorAll('.week-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.week-button').forEach((entry) => entry.classList.remove('active'));
    button.classList.add('active');
  });
});

document.querySelector('#refresh-button').addEventListener('click', (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  button.innerHTML = '<i data-lucide="loader-circle"></i>갱신 중';
  lucide.createIcons();
  setTimeout(() => {
    button.disabled = false;
    button.innerHTML = '<i data-lucide="check"></i>갱신 완료';
    lucide.createIcons();
    setTimeout(() => {
      button.innerHTML = '<i data-lucide="refresh-cw"></i>새로고침';
      lucide.createIcons();
    }, 1400);
  }, 800);
});

document.querySelectorAll('.segmented button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.segmented button').forEach((entry) => entry.classList.remove('selected'));
    button.classList.add('selected');
  });
});

const teamNote = document.querySelector('#team-note');
const autosaveStatus = document.querySelector('#autosave-status');
const savedNote = localStorage.getItem('minix-team-note');
if (savedNote) teamNote.value = savedNote;

teamNote.addEventListener('input', () => {
  autosaveStatus.innerHTML = '<i data-lucide="cloud-upload"></i>저장 중';
  lucide.createIcons();
  clearTimeout(teamNote.saveTimer);
  teamNote.saveTimer = setTimeout(() => {
    localStorage.setItem('minix-team-note', teamNote.value);
    autosaveStatus.innerHTML = '<i data-lucide="cloud-check"></i>자동 저장됨';
    lucide.createIcons();
  }, 500);
});

const filenameTool = document.querySelector('#filename-tool');
if (filenameTool) {
  // ── 구글시트 "[통합] 콘텐츠 T&D" 에서 옮겨온 표 ──────────────────────────
  const MESSAGE_TYPES = [
    ['페인포인트', 'painpoint'], ['베네핏', 'benefit'], ['소셜프루프', 'social'],
    ['한정성/긴급성', 'urgency'], ['브랜딩', 'branding'], ['가격', 'price'],
    ['음쓰usp', 'usp'], ['1분미만', '1miniute'], ['1분미만(2차가공)', '1miniute-secondaryUse'],
    ['라이브', 'live'], ['오프라인이벤트', 'cjthemaisonoff'], ['프로모션', 'promotion'],
    ['피맥스', 'pmax'], ['쇼핑검색', 'ss'], ['자사몰 메시지', 'message'],
    ['플친 메시지', 'crm'], ['시즌', 'seasonal'], ['프로모션딥', 'promotion-2'],
    ['바이럴', 'viral'], ['카카오메시지', 'kaako-message'], ['리뷰', 'review'],
    ['대응', 'defence'], ['오늘의집', 'ozip'], ['관계 중심 소구', 'relationship'],
    ['이마트/트레이더스', 'traders'], ['사회적증거', 'social'], ['세일즈행사', 'sales'],
    ['신뢰성부여', 'trrust'], ['디자인', 'design'], ['사이즈', 'size'],
    ['자동화CMR', 'acrm'], ['신혼부부', 'newlyweds'], ['무게', 'weight'],
    ['자동', 'automatic'], ['전기세', 'electric'], ['신제품', 'new'],
    ['명절', 'holiday'], ['유명인', 'celebrity'], ['사은품', 'gift'],
    ['보관', 'keep'], ['김냉usp', 'usp'], ['더슬림usp', 'usp'],
    ['소음', 'noise'], ['비교', 'comparison'], ['품절', 'comparison'],
    ['분쇄', 'crush'], ['냄새', 'smell'], ['용량', 'volume'],
    ['채널', 'channel'], ['주방', 'kitchen'], ['이유식', 'baby'],
    ['에어드라이usp', 'usp'], ['미니usp', 'usp'], ['1인가구', '1person'],
    ['윤경호', 'muse'], ['슬로건', 'slogan'], ['1등', '1st'],
    ['인기', 'trend'],
  ];

  // 시트에 이미 발번된 마지막 순번 (여기부터 이어서 발번한다)
  const SEQ_BASE = [
    ['painpoint', 287], ['benefit', 535], ['social', 107], ['urgency', 448], ['branding', 38], ['price', 100],
    ['usp', 216], ['1miniute', 1], ['1miniute-secondaryUse', 1], ['live', 64], ['cjthemaisonoff', 1], ['promotion', 50],
    ['pmax', 1], ['ss', 1], ['seasonal', 96], ['promotion-2', 3], ['viral', 48], ['review', 18],
    ['defence', 4], ['ozip', 2], ['relationship', 8], ['traders', 1], ['sales', 30], ['trrust', 5],
    ['design', 14], ['size', 29], ['newlyweds', 13], ['weight', 2], ['automatic', 1], ['electric', 1],
    ['new', 10], ['holiday', 4], ['celebrity', 77], ['gift', 15], ['keep', 1], ['noise', 2],
    ['comparison', 26], ['crush', 4], ['smell', 4], ['volume', 4], ['channel', 6], ['kitchen', 1],
    ['baby', 1], ['1person', 6], ['muse', 2], ['slogan', 1], ['1st', 1], ['trend', 1],
  ];

  const PRODUCTS = [
    { token: '더플렌더MAX', folder: '더 플렌더 MAX' },
    { token: '더플렌더mini', folder: '더 플렌더 mini' },
    { token: '더플렌더', folder: '더 플렌더' },
    { token: '더플렌더PLUS', folder: '더 플렌더 PLUS' },
    { token: '더슬림', folder: '더 슬림' },
    { token: '더시프트', folder: '더 시프트' },
    { token: '더에어드라이', folder: '더 에어드라이' },
  ];

  const CHANNELS = ['네이버', '오늘의집', '카카오', 'CJ', 'G마켓', '29CM', '컬리', '이마트', '11번가',
    '하이마트', '전자랜드', '현대홈쇼핑', '롯데', '자사몰', '공구', '오프라인', '이벤트', 'KOL 라이브'];
  const PHASES = ['', '당일', '사전', '사후', '상시', '라이브'];
  const SLOTS = ['피드', '스마트채널', '쇼핑소식', '비즈보드', '비즈보드-썸네일', '비즈보드-오브젝트(누끼)',
    '디스플레이', '쇼핑', '커뮤니케이션', '소재 전체'];
  const ROOT = '/앳홈_공유폴더/3. 마케팅팀/미닉스/☆페이드 광고';

  const STORAGE_KEY = 'minix-filename-tool-v1';
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const newId = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `f-${Date.now()}-${Math.random().toString(16).slice(2)}`);

  const today = new Date();
  const iso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const defaults = {
    date: iso(today),
    product: '더플렌더MAX',
    channel: '네이버',
    event: '',
    phase: '',
    slot: '피드',
    type: MESSAGE_TYPES[0][0],
    message: '',
  };

  let state = { ...defaults };
  let issued = [];
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (stored && typeof stored === 'object') {
      state = { ...defaults, ...(stored.state || {}) };
      issued = Array.isArray(stored.issued) ? stored.issued : [];
    }
  } catch {
    state = { ...defaults };
    issued = [];
  }
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, issued }));

  const codeOf = (typeName) => (MESSAGE_TYPES.find(([name]) => name === typeName) || [, ''])[1];
  const folderOf = (token) => (PRODUCTS.find((p) => p.token === token) || {}).folder || token;

  // 행사명 = YYMMDD_제품_채널_행사명(구분)
  const campaignName = () => {
    const [year, month, day] = state.date.split('-');
    const stamp = `${year.slice(2)}${month}${day}`;
    const parts = [stamp, state.product, state.channel, state.event.trim()].filter(Boolean);
    return parts.join('_') + (state.phase ? `(${state.phase})` : '');
  };

  // 파일위치 = /앳홈_공유폴더/3. 마케팅팀/미닉스/☆페이드 광고 (YY년)/제품/M월/행사명
  const folderPath = () => {
    const [year, month] = state.date.split('-');
    return `${ROOT} (${year.slice(2)}년)/${folderOf(state.product)}/${Number(month)}월/${campaignName()}`;
  };

  // 파일명 = 메시지코드-순번 (시트의 마지막 번호에서 이어서)
  const nextSequence = (code) => {
    const base = (SEQ_BASE.find(([c]) => c === code) || [, 0])[1];
    const mine = issued.filter((entry) => entry.code === code).map((entry) => entry.seq);
    return Math.max(base, ...mine, 0) + 1;
  };

  const optionTags = (values, selected) => values
    .map((value) => `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(value || '없음')}</option>`)
    .join('');

  const render = () => {
    const name = campaignName();
    const path = folderPath();
    const code = codeOf(state.type);
    const preview = `${code}-${nextSequence(code)}`;
    filenameTool.innerHTML = `
      <div class="tool-head">
        <div>
          <h2>광고소재 파일명</h2>
          <p>행사 정보를 넣으면 행사명 · 파일위치가 만들어지고, 메시지마다 고유 파일명을 이어서 발번합니다.</p>
        </div>
      </div>

      <section class="tool-card">
        <h3>1. 행사 정보</h3>
        <div class="tool-grid">
          <label>날짜<input type="date" data-field="date" value="${escapeHtml(state.date)}"></label>
          <label>제품<select data-field="product">${optionTags(PRODUCTS.map((p) => p.token), state.product)}</select></label>
          <label>채널<select data-field="channel">${optionTags(CHANNELS, state.channel)}</select></label>
          <label>구분<select data-field="phase">${optionTags(PHASES, state.phase)}</select></label>
          <label class="tool-wide">행사명<input type="text" data-field="event" value="${escapeHtml(state.event)}" placeholder="예: 음쓰해방위크"></label>
        </div>
        <div class="tool-output">
          <div class="tool-result">
            <span class="tool-result-label">행사명</span>
            <code data-copy-text="${escapeHtml(name)}">${escapeHtml(name)}</code>
            <button type="button" class="tool-copy" data-copy="${escapeHtml(name)}"><i data-lucide="copy"></i>복사</button>
          </div>
          <div class="tool-result">
            <span class="tool-result-label">파일위치</span>
            <code data-copy-text="${escapeHtml(path)}">${escapeHtml(path)}</code>
            <button type="button" class="tool-copy" data-copy="${escapeHtml(path)}"><i data-lucide="copy"></i>복사</button>
          </div>
        </div>
      </section>

      <section class="tool-card">
        <h3>2. 소재 파일명 발번</h3>
        <div class="tool-grid">
          <label>구좌<select data-field="slot">${optionTags(SLOTS, state.slot)}</select></label>
          <label>메시지 유형<select data-field="type">${optionTags(MESSAGE_TYPES.map(([n]) => n), state.type)}</select></label>
          <label class="tool-wide">메시지<input type="text" data-field="message" value="${escapeHtml(state.message)}" placeholder="예: 최대 43% 할인 타임딜"></label>
        </div>
        <div class="tool-issue">
          <span>다음 파일명 <code class="tool-next">${escapeHtml(preview)}</code></span>
          <button type="button" class="tool-add"><i data-lucide="plus"></i>발번하기</button>
        </div>
      </section>

      <section class="tool-card">
        <div class="tool-list-head">
          <h3>3. 발번 목록 <small>${issued.length}건</small></h3>
          <div class="tool-list-actions">
            <button type="button" class="tool-copy-all"${issued.length ? '' : ' disabled'}><i data-lucide="clipboard-list"></i>표로 복사</button>
            <button type="button" class="tool-clear"${issued.length ? '' : ' disabled'}>전체 비우기</button>
          </div>
        </div>
        ${issued.length ? `<div class="tool-table-wrap"><table class="tool-table">
          <thead><tr><th>파일명</th><th>구좌</th><th>메시지 유형</th><th>메시지</th><th>행사명</th><th></th></tr></thead>
          <tbody>${issued.map((entry) => `<tr data-id="${entry.id}">
            <td><code>${escapeHtml(entry.filename)}</code></td>
            <td>${escapeHtml(entry.slot)}</td>
            <td>${escapeHtml(entry.type)}</td>
            <td class="tool-message">${escapeHtml(entry.message)}</td>
            <td class="tool-campaign">${escapeHtml(entry.campaign)}</td>
            <td><button type="button" class="tool-remove" aria-label="삭제"><i data-lucide="x"></i></button></td>
          </tr>`).join('')}</tbody>
        </table></div>` : '<p class="tool-empty">아직 발번한 파일명이 없습니다.</p>'}
      </section>`;
    lucide.createIcons();
  };

  const copyText = (text, button) => {
    const done = () => {
      if (!button) return;
      button.classList.add('is-copied');
      window.setTimeout(() => button.classList.remove('is-copied'), 1200);
    };
    if (window.navigator.clipboard?.writeText) window.navigator.clipboard.writeText(text).then(done, () => window.prompt('복사하세요', text));
    else window.prompt('복사하세요', text);
    done();
  };

  filenameTool.addEventListener('input', (event) => {
    const field = event.target.closest('[data-field]');
    if (!field || field.tagName === 'SELECT' || field.type === 'date') return;
    state[field.dataset.field] = field.value;
    save();
    const name = campaignName();
    const path = folderPath();
    filenameTool.querySelectorAll('[data-copy-text]').forEach((node, index) => {
      const value = index === 0 ? name : path;
      node.textContent = value;
      node.dataset.copyText = value;
      node.nextElementSibling.dataset.copy = value;
    });
  });

  filenameTool.addEventListener('change', (event) => {
    const field = event.target.closest('[data-field]');
    // 텍스트 칸은 input 에서 이미 반영한다. 여기서 다시 그리면 blur 직후의 클릭이 삼켜진다.
    if (!field || (field.tagName !== 'SELECT' && field.type !== 'date')) return;
    state[field.dataset.field] = field.value;
    save();
    render();
  });

  filenameTool.addEventListener('click', (event) => {
    const copy = event.target.closest('.tool-copy');
    if (copy) return copyText(copy.dataset.copy, copy);

    if (event.target.closest('.tool-add')) {
      const code = codeOf(state.type);
      const seq = nextSequence(code);
      issued.unshift({
        id: newId(),
        filename: `${code}-${seq}`,
        code,
        seq,
        slot: state.slot,
        type: state.type,
        message: state.message.trim(),
        campaign: campaignName(),
        path: folderPath(),
      });
      state.message = '';
      save();
      render();
      return;
    }

    if (event.target.closest('.tool-copy-all')) {
      const header = ['파일명', '구좌', '메시지 유형', '메시지', '행사명', '파일위치'].join('\t');
      const body = issued.map((entry) => [entry.filename, entry.slot, entry.type, entry.message, entry.campaign, entry.path].join('\t'));
      return copyText([header, ...body].join('\n'), event.target.closest('.tool-copy-all'));
    }

    if (event.target.closest('.tool-clear')) {
      if (!window.confirm(`발번 목록 ${issued.length}건을 모두 지울까요?`)) return;
      issued = [];
      save();
      render();
      return;
    }

    const remove = event.target.closest('.tool-remove');
    if (remove) {
      const id = remove.closest('tr').dataset.id;
      issued = issued.filter((entry) => entry.id !== id);
      save();
      render();
    }
  });

  render();
}
