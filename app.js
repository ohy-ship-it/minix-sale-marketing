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
  '광고소재 검수': { section: '#creative-checker', hash: '#creative-check' },
  // hash 는 섹션 id 와 달라야 한다. 같으면 브라우저가 그 요소로 스크롤해 버린다.
  '메타 광고 세팅': { section: '#ad-setup', hash: '#meta-ad-setup' },
  '퍼포먼스일정': { section: '#brand-schedule', hash: '#performance-schedule' },
  'UTM 빌더': { section: '#utm-builder', hash: '#utm' },
  '매체별 성과': { section: '#media-performance', hash: '#media-report' },
  '소재별 결과': { section: '#creative-performance', hash: '#creative-result' },
  '페이지 결과': { section: '#page-performance', hash: '#page-result' },
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

// ── 광고소재 검수 연동 ──────────────────────────────────────────────
// 검수 사이트(ad-creative-checker)와 postMessage 로 주고받는다.
// 규격은 INTEGRATION.md 참고. 검수 쪽 수신 코드가 없어도 화면은 정상 동작한다.
const creativeChecker = document.querySelector('#creative-checker');
if (creativeChecker) {
  const CHECKER_ORIGIN = 'https://ad-creative-checker.onrender.com';
  const FILENAME_KEY = 'minix-filename-tool-v3';

  const frame = creativeChecker.querySelector('iframe');
  const bridge = creativeChecker.querySelector('.checker-bridge');
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  let linked = false;
  let result = null;

  // 파일명 생성기에서 만든 행사 정보를 그대로 물려받는다
  const campaignInfo = () => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(FILENAME_KEY) || 'null'); } catch { saved = null; }
    const state = saved?.state || {};
    const [year, month, day] = (state.date || '').split('-');
    const stamp = year && month && day ? `${year.slice(2)}${month}${day}` : '';
    return {
      campaign: [stamp, state.product, state.channel, (state.event || '').trim()].filter(Boolean).join('_'),
      date: state.date || '',
      product: state.product || '',
      channel: state.channel || '',
      media: state.media || '',
      filename: (saved?.issued || []).find((entry) => !entry.vertical)?.filename || '',
    };
  };

  const send = (message) => {
    if (!frame.contentWindow) return;
    frame.contentWindow.postMessage({ source: 'minix-workspace', ...message }, CHECKER_ORIGIN);
  };

  const renderBridge = () => {
    const info = campaignInfo();
    bridge.innerHTML = `
      <div class="bridge-line">
        <span class="bridge-badge${linked ? ' is-linked' : ''}">${linked ? '연동됨' : '연동 대기 중'}</span>
        ${info.campaign
          ? `<span class="bridge-info"><b>${escapeHtml(info.campaign)}</b>${info.media ? `<small>${escapeHtml(info.media)}</small>` : ''}</span>`
          : '<span class="bridge-empty">광고소재 파일명 화면에서 행사 정보를 먼저 만들면 여기로 넘길 수 있습니다.</span>'}
        <button type="button" class="bridge-send"${info.campaign ? '' : ' disabled'}><i data-lucide="send"></i>검수로 보내기</button>
      </div>
      ${result ? `<div class="bridge-result">
        <div class="bridge-result-head">
          <span><b>${escapeHtml(result.channel)}</b> 검수 결과를 받았습니다<small>${escapeHtml(result.materialName)}</small></span>
          <span class="bridge-result-actions">
            <button type="button" class="bridge-copy"><i data-lucide="copy"></i>표 복사</button>
            <button type="button" class="bridge-dismiss" aria-label="닫기"><i data-lucide="x"></i></button>
          </span>
        </div>
        <pre class="bridge-table">${escapeHtml(result.tableText)}</pre>
      </div>` : ''}`;
    lucide.createIcons();
  };

  const loadFrame = () => {
    if (frame.getAttribute('src')) return;
    frame.src = frame.dataset.src;
    // 프레임이 뜨면 연결을 확인한다 (수신 코드가 없으면 응답이 없다)
    frame.addEventListener('load', () => {
      let tries = 0;
      const timer = window.setInterval(() => {
        tries += 1;
        if (linked || tries > 5) return window.clearInterval(timer);
        send({ type: 'ping' });
      }, 800);
    }, { once: true });
  };

  window.addEventListener('message', (event) => {
    if (event.origin !== CHECKER_ORIGIN) return;
    const data = event.data;
    if (!data || data.source !== 'ad-creative-checker') return;
    if (data.type === 'ready') {
      linked = true;
      renderBridge();
      return;
    }
    if (data.type === 'result' && data.payload) {
      result = {
        channel: data.payload.channel || '',
        materialName: data.payload.materialName || '',
        bgColor: data.payload.bgColor || '',
        tableText: data.payload.tableText || '',
      };
      renderBridge();
    }
  });

  bridge.addEventListener('click', (event) => {
    if (event.target.closest('.bridge-send')) {
      const info = campaignInfo();
      send({ type: 'prefill', payload: info });
      // 연동 전에도 쓸 수 있게 소재명을 클립보드에 함께 넣는다
      if (window.navigator.clipboard?.writeText) window.navigator.clipboard.writeText(info.campaign).catch(() => {});
      const button = event.target.closest('.bridge-send');
      button.classList.add('is-sent');
      window.setTimeout(() => button.classList.remove('is-sent'), 1200);
      return;
    }
    if (event.target.closest('.bridge-copy')) {
      if (window.navigator.clipboard?.writeText) window.navigator.clipboard.writeText(result.tableText).catch(() => {});
      else window.prompt('복사하세요', result.tableText);
      return;
    }
    if (event.target.closest('.bridge-dismiss')) {
      result = null;
      renderBridge();
    }
  });

  new MutationObserver(() => {
    if (creativeChecker.hidden) return;
    loadFrame();
    renderBridge();
  }).observe(creativeChecker, { attributes: true, attributeFilter: ['hidden'] });

  if (!creativeChecker.hidden) { loadFrame(); }
  renderBridge();

  creativeChecker.querySelector('.checker-reload').addEventListener('click', () => {
    linked = false;
    frame.removeAttribute('src');
    loadFrame();
    renderBridge();
  });
  creativeChecker.querySelector('.checker-open').addEventListener('click', () => window.open(frame.dataset.src, '_blank', 'noopener'));
}

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

// 파일명 적재 시트와 그 시트에 배포한 Apps Script 웹 앱. 파일명 · UTM 빌더 두 화면이 함께 쓴다.
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1-IrBGbuQmcQ9Za1LCZKfV6XUaGIV5gtut5npHw0Gu_E/edit';
const SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwWEYRTgiY7g5Hoz1U5Y9HGauaSjuZal5AQmO4vU8lN-SrU2xwc17wszUpPypHBixbV/exec';

// 광고 계정 — 메타 광고 세팅 · 매체별 성과가 함께 쓴다.
// 매체별 성과는 시트 쪽에서 계정 목록을 받아 오고, 못 받으면 이 목록으로 채운다.
const AD_ACCOUNTS = [
  ['미닉스', 'act_370223898721955'], ['컬리', 'act_876846528408565'],
  ['CJ', 'act_1467742828251405'], ['오늘의집', 'act_1194498995371808'],
  ['네이버', 'act_1010891704382690'], ['쿠팡', 'act_1182774429560123'],
  ['무신사', 'act_996624009865646'], ['29cm', 'act_1019016880920556'],
];

// ── 성과 화면들이 함께 쓰는 것 ────────────────────────────────────────
// 매체별 성과 · 소재별 결과 두 화면이 같은 대응표 · 같은 계산을 쓰도록 여기 모아 둔다.
const GOOGLE_ACCOUNTS = [['앳홈_미닉스', '4112908407']];

const PERF_SOURCES = {
  meta: {
    name: 'Meta Ads',
    // CPA 에서 빼는 목적. CPA 계산은 화면에서만 한다 (Apps Script 는 목적 이름을 그대로 넘겨준다)
    skip: ['OUTCOME_TRAFFIC', 'LINK_CLICKS'],
    skipLabel: '트래픽',
    clicks: '링크 클릭',
    note: 'CPC · CTR 은 링크 클릭 기준, 결과는 구매 + 장바구니 + 리드, CPA 는 트래픽 목적을 뺀 값입니다.',
    fallback: AD_ACCOUNTS,
  },
  google: {
    name: 'Google Ads',
    // 구글에는 캠페인 목적이 없다. 전환을 노리지 않는 동영상(브랜딩)을 CPA 에서 뺀다.
    skip: ['VIDEO'],
    skipLabel: '동영상',
    clicks: '클릭',
    note: '결과는 전환 카테고리(구매 + 장바구니 + 리드), CPA 는 동영상(브랜딩) 캠페인을 뺀 값입니다.',
    fallback: GOOGLE_ACCOUNTS,
  },
};

const PERF_OBJECTIVES = {
  // 메타 — 캠페인 목적
  OUTCOME_SALES: '판매', OUTCOME_TRAFFIC: '트래픽', OUTCOME_ENGAGEMENT: '참여',
  OUTCOME_LEADS: '잠재고객', OUTCOME_AWARENESS: '인지도', OUTCOME_APP_PROMOTION: '앱 홍보',
  LINK_CLICKS: '트래픽', CONVERSIONS: '전환', PRODUCT_CATALOG_SALES: '카탈로그 판매',
  POST_ENGAGEMENT: '게시물 참여', REACH: '도달', BRAND_AWARENESS: '브랜드 인지도',
  VIDEO_VIEWS: '동영상 조회', LEAD_GENERATION: '잠재고객', MESSAGES: '메시지',
  // 구글 — 캠페인 유형
  SEARCH: '검색', DISPLAY: '디스플레이', VIDEO: '동영상', DEMAND_GEN: '디맨드젠',
  PERFORMANCE_MAX: 'P맥스', SHOPPING: '쇼핑', MULTI_CHANNEL: '앱', LOCAL: '지역',
  SMART: '스마트', DISCOVERY: '디스커버리', LOCAL_SERVICES: '지역 서비스', TRAVEL: '여행',
};

// 메타 관리자와 같은 기준 — '최근 N일' 은 오늘을 넣지 않는다 (오늘 수치는 계속 움직이므로)
const PERF_PRESETS = [
  ['today', '오늘'], ['yesterday', '어제'], ['7d', '최근 7일'], ['14d', '최근 14일'],
  ['30d', '최근 30일'], ['month', '이번 달'], ['lastMonth', '지난 달'], ['custom', '직접 지정'],
];

const perfEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

// toISOString 은 UTC 라 한국 시간 기준 날짜가 하루 밀린다. 로컬 값으로 만든다.
const perfYmd = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const perfDaysAgo = (days) => { const date = new Date(); date.setDate(date.getDate() - days); return date; };

const perfRange = (preset) => {
  const today = new Date();
  if (preset === 'today') return { since: perfYmd(today), until: perfYmd(today) };
  if (preset === 'yesterday') return { since: perfYmd(perfDaysAgo(1)), until: perfYmd(perfDaysAgo(1)) };
  if (preset === '7d') return { since: perfYmd(perfDaysAgo(7)), until: perfYmd(perfDaysAgo(1)) };
  if (preset === '14d') return { since: perfYmd(perfDaysAgo(14)), until: perfYmd(perfDaysAgo(1)) };
  if (preset === '30d') return { since: perfYmd(perfDaysAgo(30)), until: perfYmd(perfDaysAgo(1)) };
  if (preset === 'month') return { since: perfYmd(new Date(today.getFullYear(), today.getMonth(), 1)), until: perfYmd(today) };
  if (preset === 'lastMonth') {
    return {
      since: perfYmd(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      until: perfYmd(new Date(today.getFullYear(), today.getMonth(), 0)),
    };
  }
  return null;
};

// 시트에 붙은 Apps Script 에 물어본다. 토큰은 그쪽에만 있다.
const askSheet = (payload) => window.fetch(SHEET_ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify(payload),
})
  .then((response) => (response.ok ? response.json() : Promise.reject(new Error('HTTP ' + response.status))))
  .then((body) => {
    if (!body || !body.ok) throw new Error((body && body.error) || '알 수 없는 오류');
    return body;
  });

const perfMoney = (currency) => (value) => new Intl.NumberFormat('ko-KR', {
  style: 'currency', currency: currency || 'KRW',
  maximumFractionDigits: (currency || 'KRW') === 'KRW' ? 0 : 2,
}).format(Number(value) || 0);
const perfCount = (value) => new Intl.NumberFormat('ko-KR').format(Math.round(Number(value) || 0));
const perfPercent = (value) => `${((Number(value) || 0) * 100).toFixed(2)}%`;
const perfRatio = (top, bottom) => (bottom > 0 ? top / bottom : null);


const filenameTool = document.querySelector('#filename-tool');
if (filenameTool) {
  // ── 구글시트 "[통합] 콘텐츠 T&D" 의 메시지 유형 → 코드 표 ──────────────
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

  // 시트에 이미 발번된 마지막 순번 (여기서부터 이어 붙인다)
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

  // 시트에서 실제로 쓰인 행사채널
  const CHANNELS = ['네이버', '오늘의집', '카카오', 'CJ', 'G마켓', '29CM', '컬리', '이마트', '11번가',
    '하이마트', '전자랜드', '현대홈쇼핑', '롯데홈쇼핑', '롯데', '쿠팡', '자사몰', '공구', '오프라인', '이벤트', 'KOL 라이브'];

  // 시트의 행사명에 쓰인 제품 토큰과 제품 코드표를 합친 목록
  const PRODUCTS = ['더플렌더MAX', '더플렌더mini', '더플렌더', '더플렌더PLUS', '더슬림', '더시프트', '더에어드라이',
    '식기세척기', '건조기', '건조기필터', '건조기시트', '하드필터', '하드락필터', '푸드컨테이너', '식기세제', '악세사리'];

  const MEDIA_OPTIONS = ['메타', 'GFA-피드', 'GFA-쇼핑소식', 'GFA-스마트채널',
    '카카오-비즈보드', '카카오-디스플레이', '구글-디멘드젠', '인플루언서-인스타', '인플루언서-유튜브'];

  const CUSTOM_OPTION = '__custom__';
  const CODE_RULE = /^[A-Za-z0-9]+$/;

  const VERTICAL_SUFFIX = '(세로)';
  const STORAGE_KEY = 'minix-filename-tool-v3';
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const newId = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `f-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const todayIso = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  // 발번 목록에 보이는 정보 그대로 시트에 적재한다
  // 시트는 열 이름을 보고 자리를 찾는다. 합쳐 놓은 최종행사명 대신 원래 값을 그대로 보낸다.
  const SHEET_COLUMNS = [
    { key: 'event', label: '행사명' },
    { key: 'filename', label: '파일명' },
    { key: 'media', label: '매체' },
    { key: 'eventDate', label: '행사일자' },
    { key: 'product', label: '상품명' },
    { key: 'channel', label: '행사채널' },
  ];

  const defaults = { date: todayIso(), channel: CHANNELS[0], product: '', event: '', media: '', type: MESSAGE_TYPES[0][0], vertical: false, customTypes: [] };
  let state = { ...defaults };
  let issued = [];
  // 한 번 나간 번호는 목록에서 지워도 다시 쓰지 않는다
  let watermark = {};
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (stored && typeof stored === 'object') {
      state = { ...defaults, ...(stored.state || {}) };
      state.customTypes = (Array.isArray(state.customTypes) ? state.customTypes : [])
        .map((entry) => (typeof entry === 'string' ? { name: entry, code: entry } : entry))
        .filter((entry) => entry && entry.name && entry.code);
      issued = Array.isArray(stored.issued) ? stored.issued : [];
      watermark = stored.watermark && typeof stored.watermark === 'object' ? { ...stored.watermark } : {};
    }
  } catch {
    state = { ...defaults };
    issued = [];
    watermark = {};
  }
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, issued, watermark }));

  const codeOf = (typeName) => {
    const known = MESSAGE_TYPES.find(([name]) => name === typeName);
    if (known) return known[1];
    return (state.customTypes.find((entry) => entry.name === typeName) || {}).code || '';
  };

  // 최종행사명 = 행사일자(YYMMDD) + 상품명 + 행사채널 + 행사명 (시트 표기 순서)
  const finalName = () => {
    const [year, month, day] = (state.date || '').split('-');
    const stamp = year && month && day ? `${year.slice(2)}${month}${day}` : '';
    return [stamp, state.product, state.channel, state.event.trim()].filter(Boolean).join('_');
  };

  // 파일명 = 메시지코드-순번 (시트의 마지막 번호에서 이어서)
  const nextSequence = (code) => {
    const base = (SEQ_BASE.find(([c]) => c === code) || [, 0])[1];
    const mine = issued.filter((entry) => entry.code === code).map((entry) => entry.seq);
    return Math.max(base, watermark[code] || 0, ...mine, 0) + 1;
  };

  const scrollToList = () => {
    const head = filenameTool.querySelector('.tool-list-head');
    if (!head || typeof head.scrollIntoView !== 'function') return;
    try { head.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch { /* 스크롤 미지원 환경 */ }
  };

  const issueOne = () => {
    const code = codeOf(state.type);
    if (!code) return;
    const seq = nextSequence(code);
    issued = [{
      id: newId(),
      code,
      seq,
      media: state.media,
      type: state.type,
      campaign: finalName(),
      eventDate: state.date,
      product: state.product,
      channel: state.channel,
      event: state.event.trim(),
      filename: `${code}-${seq}`,
      vertical: false,
      createdAt: new Date().toISOString(),
    }, ...issued];
    watermark[code] = Math.max(watermark[code] || 0, seq);
    if (state.vertical) syncVertical();
    save();
    render();
    scrollToList();
  };

  // 세로형 토글: 켜면 가로 파일명마다 (세로) 를 하나씩 붙이고, 끄면 모두 없앤다
  const syncVertical = () => {
    if (!state.vertical) {
      issued = issued.filter((entry) => !entry.vertical);
      return;
    }
    const next = [];
    issued.forEach((entry) => {
      if (entry.vertical) return;
      next.push(entry);
      const twin = issued.find((other) => other.vertical && other.filename === entry.filename + VERTICAL_SUFFIX);
      next.push(twin || { ...entry, id: newId(), filename: entry.filename + VERTICAL_SUFFIX, vertical: true, sent: false });
    });
    issued = next;
  };

  // 건수 · 시트 적재는 (세로) 를 뺀 파일명만 센다
  const baseEntries = () => issued.filter((entry) => !entry.vertical);
  const issuedCount = () => baseEntries().length;
  const pending = () => baseEntries().filter((entry) => !entry.sent);

  const rowsForSheet = (list) => list.map((entry) => Object.fromEntries(
    SHEET_COLUMNS.map((column) => [column.key, entry[column.key] || '']),
  ));

  const markSent = (list) => {
    const ids = new Set(list.map((entry) => entry.id));
    issued = issued.map((entry) => (ids.has(entry.id) ? { ...entry, sent: true } : entry));
    save();
    render();
  };

  const sendToSheet = (button) => {
    const list = pending();
    if (!list.length) return;
    button.disabled = true;
    button.classList.add('is-sending');
    window.fetch(SHEET_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ columns: SHEET_COLUMNS, rows: rowsForSheet(list) }),
    })
      .then((response) => (response.ok ? response.json().catch(() => ({ ok: true })) : Promise.reject(new Error('HTTP ' + response.status))))
      .then(() => { markSent(list); })
      .catch((error) => {
        button.disabled = false;
        button.classList.remove('is-sending');
        window.alert('시트 적재에 실패했습니다.\n' + error.message + '\n\n'
          + '잠시 뒤 다시 시도하고, 계속 실패하면 [파일명만 복사] 로 시트에 붙여넣어 주세요.');
      });
  };

  let modal = { open: false, name: '', code: '', error: '' };

  const openCustomModal = () => {
    modal = { open: true, name: '', code: '', error: '' };
    render();
    filenameTool.querySelector('[data-new="name"]')?.focus();
  };

  const closeCustomModal = () => {
    modal = { open: false, name: '', code: '', error: '' };
    render();
  };

  const registerCustomType = () => {
    const name = modal.name.trim();
    const code = modal.code.trim();
    if (!name) return (modal.error = '메시지 유형명을 적어 주세요.'), render();
    if (!code) return (modal.error = '파일명 코드를 적어 주세요.'), render();
    if (!CODE_RULE.test(code)) {
      modal.error = '파일명 코드는 영문과 숫자만 쓸 수 있습니다. (한글 · 띄어쓰기 · 특수문자 불가)';
      return render();
    }
    const taken = MESSAGE_TYPES.some(([value]) => value === name) || state.customTypes.some((entry) => entry.name === name);
    if (taken) {
      modal.error = '이미 있는 메시지 유형명입니다.';
      return render();
    }
    state.customTypes = [...state.customTypes, { name, code }];
    state.type = name;
    modal = { open: false, name: '', code: '', error: '' };
    save();
    issueOne();
  };

  const customModalMarkup = () => (modal.open ? `
      <div class="tool-modal">
        <div class="tool-modal-backdrop"></div>
        <div class="tool-modal-panel" role="dialog" aria-label="메시지 유형 직접 추가">
          <h3>메시지 유형 직접 추가</h3>
          <label>메시지 유형명<input type="text" data-new="name" value="${escapeHtml(modal.name)}" placeholder="예: 신년 프로모션"></label>
          <label>파일명<input type="text" data-new="code" value="${escapeHtml(modal.code)}" placeholder="예: newyear"></label>
          <p class="tool-modal-hint">파일명은 영문 · 숫자만 됩니다. 한글 · 띄어쓰기 · 특수문자는 넣을 수 없습니다.</p>
          ${modal.error ? `<p class="tool-modal-error">${escapeHtml(modal.error)}</p>` : ''}
          <div class="tool-modal-actions">
            <button type="button" class="tool-modal-cancel">취소</button>
            <button type="button" class="tool-modal-submit">등록</button>
          </div>
        </div>
      </div>` : '');

  let typeOpen = false;
  let typeQuery = '';
  // 이름과 코드 아무 쪽이나 걸리면 보여 준다. 띄어쓰기 · 대소문자는 무시.
  const matchesType = (name, code) => {
    const query = typeQuery.trim().toLowerCase().replace(/\s+/g, '');
    if (!query) return true;
    return `${name}${code}`.toLowerCase().replace(/\s+/g, '').indexOf(query) >= 0;
  };

  const typeControl = () => `
    <div class="tool-select${typeOpen ? ' is-open' : ''}">
      <button type="button" class="tool-select-button" data-toggle="type">${escapeHtml(state.type || '선택 안 함')}<i data-lucide="chevron-down"></i></button>
      ${typeOpen ? (() => {
        const mine = state.customTypes.filter((entry) => matchesType(entry.name, entry.code));
        const basic = MESSAGE_TYPES.filter(([name, code]) => matchesType(name, code));
        return `<div class="tool-select-panel">
        <div class="tool-select-search">
          <i data-lucide="search"></i>
          <input type="text" data-search="type" value="${escapeHtml(typeQuery)}" placeholder="유형 · 코드로 찾기" autocomplete="off" spellcheck="false">
        </div>
        <button type="button" class="tool-select-option is-action" data-pick="${CUSTOM_OPTION}"><i data-lucide="plus"></i>직접 작성하기…</button>
        ${typeQuery ? '' : `<button type="button" class="tool-select-option${state.type ? '' : ' is-on'}" data-pick="">선택 안 함</button>`}
        ${mine.length ? '<div class="tool-select-divider">직접 추가한 유형</div>' : ''}
        ${mine.map((entry) => `<div class="tool-select-row">
          <button type="button" class="tool-select-option${entry.name === state.type ? ' is-on' : ''}" data-pick="${escapeHtml(entry.name)}">${escapeHtml(entry.name)}<small>${escapeHtml(entry.code)}</small></button>
          <button type="button" class="tool-custom-remove" data-name="${escapeHtml(entry.name)}" aria-label="${escapeHtml(entry.name)} 삭제" title="삭제"><i data-lucide="x"></i></button>
        </div>`).join('')}
        ${basic.length ? '<div class="tool-select-divider">기본 유형</div>' : ''}
        ${basic.map(([name, code]) => `<button type="button" class="tool-select-option${name === state.type ? ' is-on' : ''}" data-pick="${escapeHtml(name)}">${escapeHtml(name)}<small>${escapeHtml(code)}</small></button>`).join('')}
        ${mine.length || basic.length ? '' : `<p class="tool-select-empty">${escapeHtml(typeQuery)} 로 찾은 유형이 없습니다. 위에서 직접 추가할 수 있습니다.</p>`}
      </div>`;
      })() : ''}
    </div>`;

  const pickType = (value) => {
    typeOpen = false;
    typeQuery = '';
    if (value === CUSTOM_OPTION) return openCustomModal();
    state.type = value;
    save();
    if (value) issueOne();
    else render();
  };

  const render = () => {
    const code = codeOf(state.type);
    const seq = code ? nextSequence(code) : 0;
    const preview = code ? `${code}-${seq}` : '';
    const name = finalName();
    filenameTool.innerHTML = `
      <div class="tool-head">
        <h2>광고소재 파일명</h2>
        <p>행사 정보를 채우고 메시지 유형을 고르면 파일명이 발번됩니다. <b>${escapeHtml(VERTICAL_SUFFIX)}</b> 는 목록에서 <b>세로형 추가</b>를 누를 때만 붙습니다.</p>
      </div>

      <section class="tool-card">
        <div class="tool-grid">
          <label>행사일자<input type="date" data-field="date" value="${escapeHtml(state.date)}"></label>
          <label>행사채널<select data-field="channel"><option value=""${state.channel ? '' : ' selected'}>선택 안 함</option>${CHANNELS.map((value) => `<option${value === state.channel ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>
          <label>상품명<select data-field="product"><option value=""${state.product ? '' : ' selected'}>선택 안 함</option>${PRODUCTS.map((value) => `<option${value === state.product ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>
          <label class="tool-wide">행사명<input type="text" data-field="event" value="${escapeHtml(state.event)}" placeholder="예: 음쓰해방위크"></label>
        </div>
        <div class="tool-grid tool-grid-second">
          <label>매체<select data-field="media"><option value=""${state.media ? '' : ' selected'}>선택 안 함</option>${MEDIA_OPTIONS.map((value) => `<option${value === state.media ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>
          <div class="tool-field">메시지 유형${typeControl()}</div>
          <div class="tool-final-box">
            <span class="tool-final-label">최종행사명</span>
            <code class="tool-final">${escapeHtml(name) || '<span class="tool-blank">행사 정보를 입력하세요</span>'}</code>
            <button type="button" class="tool-copy" data-copy="${escapeHtml(name)}"><i data-lucide="copy"></i>복사</button>
          </div>
        </div>
        <div class="tool-issue">
          <span>${code
            ? `다음 파일명 <code class="tool-next">${escapeHtml(preview)}</code>`
            : '메시지 유형을 고르면 발번됩니다.'}</span>
          <button type="button" class="tool-add"${code ? '' : ' disabled'}><i data-lucide="plus"></i>같은 유형 하나 더</button>
        </div>
      </section>

      <section class="tool-card">
        <div class="tool-list-head">
          <h3>발번 목록 <small>${issuedCount()}건</small></h3>
          <div class="tool-list-actions">
            <label class="tool-check"><input type="checkbox" data-field="vertical"${state.vertical ? ' checked' : ''}>세로형</label>
            <button type="button" class="tool-copy-all"${issued.length ? '' : ' disabled'} title="목록의 파일명을 한 줄에 하나씩 복사합니다"><i data-lucide="copy"></i>파일명만 복사</button>
            <button type="button" class="tool-clear"${issued.length ? '' : ' disabled'}>전체 비우기</button>
          </div>
        </div>
        ${issued.length ? `<div class="tool-table-wrap"><table class="tool-table">
          <thead><tr><th>파일명</th><th>매체</th><th>메시지 유형</th><th>최종행사명</th><th></th></tr></thead>
          <tbody>${issued.map((entry) => `<tr data-id="${entry.id}"${entry.vertical ? ' class="is-vertical"' : ''}>
            <td><code>${escapeHtml(entry.filename)}</code></td>
            <td>${escapeHtml(entry.media) || '<span class="tool-blank">-</span>'}</td>
            <td>${escapeHtml(entry.type)}</td>
            <td class="tool-campaign">${escapeHtml(entry.campaign) || '<span class="tool-blank">-</span>'}</td>
            <td><div class="tool-row-actions">
              ${entry.sent ? '<span class="tool-sent"><i data-lucide="check"></i>적재됨</span>' : ''}
              <button type="button" class="tool-copy" data-copy="${escapeHtml(entry.filename)}"><i data-lucide="copy"></i>복사</button>
              <button type="button" class="tool-remove" aria-label="삭제"><i data-lucide="x"></i></button>
            </div></td>
          </tr>`).join('')}</tbody>
        </table></div>` : '<p class="tool-empty">아직 발번한 파일명이 없습니다.</p>'}
      </section>

      ${customModalMarkup()}

      <div class="tool-footer">
        <button type="button" class="tool-reset"><i data-lucide="eraser"></i>전체 지우기</button>
        <button type="button" class="tool-submit"${pending().length ? '' : ' disabled'}><i data-lucide="upload"></i>최종완료${pending().length ? ` (${pending().length})` : ''}</button>
        <button type="button" class="tool-open-sheet" title="구글시트 새 탭으로 열기"><i data-lucide="external-link"></i>적재확인</button>
        <small>입력값과 발번 목록을 모두 비웁니다. 이미 나간 번호는 다시 쓰지 않습니다.</small>
      </div>`;
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

  // 텍스트 칸은 여기서만 반영한다. change 에서 다시 그리면 blur 직후의 클릭이 삼켜진다.
  filenameTool.addEventListener('input', (event) => {
    const search = event.target.closest('[data-search]');
    if (search) {
      typeQuery = search.value;
      render();
      const box = filenameTool.querySelector('[data-search]');
      if (box) {
        box.focus();
        box.setSelectionRange(box.value.length, box.value.length);
      }
      return;
    }
    const newField = event.target.closest('[data-new]');
    if (newField) {
      modal[newField.dataset.new] = newField.value;
      return;
    }
    const field = event.target.closest('[data-field]');
    if (!field || field.tagName === 'SELECT' || field.type === 'date') return;
    state[field.dataset.field] = field.value;
    save();
    const name = finalName();
    const box = filenameTool.querySelector('.tool-final');
    if (box) box.textContent = name;
    const copy = filenameTool.querySelector('.tool-final-box .tool-copy');
    if (copy) copy.dataset.copy = name;
  });

  filenameTool.addEventListener('change', (event) => {
    const field = event.target.closest('[data-field]');
    if (!field || (field.tagName !== 'SELECT' && field.type !== 'date' && field.type !== 'checkbox')) return;
    state[field.dataset.field] = field.type === 'checkbox' ? field.checked : field.value;
    if (field.dataset.field === 'vertical') {
      syncVertical();
      save();
      render();
      return;
    }
    save();
    // 메시지 유형을 고르는 순간 발번한다
    if (field.dataset.field === 'type') issueOne();
    else render();
  });

  filenameTool.addEventListener('click', (event) => {
    if (event.target.closest('.tool-modal-submit')) return registerCustomType();
    if (event.target.closest('.tool-modal-cancel') || event.target.closest('.tool-modal-backdrop')) return closeCustomModal();

    if (event.target.closest('[data-toggle="type"]')) {
      typeOpen = !typeOpen;
      typeQuery = '';
      render();
      return;
    }

    const pick = event.target.closest('[data-pick]');
    if (pick) return pickType(pick.dataset.pick);

    const removeCustom = event.target.closest('.tool-custom-remove');
    if (removeCustom) {
      const name = removeCustom.dataset.name;
      state.customTypes = state.customTypes.filter((entry) => entry.name !== name);
      if (state.type === name) state.type = '';
      save();
      render();
      return;
    }

    // 드롭다운 밖을 누르면 닫는다
    if (typeOpen && !event.target.closest('.tool-select')) {
      typeOpen = false;
      render();
    }

    const copy = event.target.closest('.tool-copy');
    if (copy) return copyText(copy.dataset.copy, copy);

    if (event.target.closest('.tool-add')) return issueOne();

    if (event.target.closest('.tool-open-sheet')) {
      window.open(SHEET_URL, '_blank', 'noopener');
      return;
    }

    const submit = event.target.closest('.tool-submit');
    if (submit) return sendToSheet(submit);

    if (event.target.closest('.tool-reset')) {
      if (issued.length && !window.confirm(`입력값과 발번 목록 ${issuedCount()}건을 모두 지울까요?`)) return;
      state = { date: '', channel: '', product: '', event: '', media: '', type: '', vertical: false, customTypes: state.customTypes };
      issued = [];
      save();
      render();
      return;
    }

    // 목록에 보이는 파일명만 한 줄에 하나씩. (세로형도 실제 소재 이름이라 함께 복사한다)
    if (event.target.closest('.tool-copy-all')) {
      const names = issued.map((entry) => entry.filename).join('\n');
      return copyText(names, event.target.closest('.tool-copy-all'));
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

  document.addEventListener('click', (event) => {
    if (!typeOpen) return;
    // 방금 다시 그리면서 떨어져 나온 요소는 "바깥 클릭"이 아니다
    if (!event.target.isConnected || filenameTool.contains(event.target)) return;
    typeOpen = false;
    render();
  });

  filenameTool.addEventListener('keydown', (event) => {
    if (typeOpen && event.key === 'Enter' && event.target.closest('[data-search]')) {
      event.preventDefault();
      const first = [...filenameTool.querySelectorAll('.tool-select-option[data-pick]')]
        .find((option) => option.dataset.pick && option.dataset.pick !== CUSTOM_OPTION);
      if (first) pickType(first.dataset.pick);
      return;
    }
    if (typeOpen && event.key === 'Escape') {
      typeOpen = false;
      render();
      return;
    }
    if (!modal.open) return;
    if (event.key === 'Escape') closeCustomModal();
    if (event.key === 'Enter' && event.target.closest('[data-new]')) {
      event.preventDefault();
      registerCustomType();
    }
  });

  render();
}

// ── 광고자동 세팅 · 메타 광고 세팅 ──────────────────────────────────
// 원본은 사내 배포용 HTA (공유_NAS수정판/meta-ad-setup.hta) 다.
// 브라우저는 NAS 를 마운트하거나 PowerShell 을 돌릴 수 없으므로 역할을 나눈다.
//   · 이 화면      = 폼 · 시트 조회 · 검증 · 실행 스크립트 생성
//   · 내려받은 .ps1 = NAS 접근 · 소재 업로드 · 메타 API 호출 (원본과 같은 코드)
// 토큰과 NAS 비밀번호는 브라우저에 저장하지 않는다. 스크립트가 .env 를 직접 읽는다.
const adSetup = document.querySelector('#ad-setup');
if (adSetup) {
  const STORAGE_KEY = 'minix-ad-setup-v1';
  const HISTORY_KEY = 'minix-ad-setup-history-v1';
  // 프로모션 → 캠페인/그룹/광고명·랜딩 URL 대응표가 들어있는 시트
  const UTM_SHEET_ID = '1K9kGdlfuHCp-VNaKUuGMYi9B_rRbW0rY1lg_NFYMv8s';
  const UTM_SHEET_NAME = 'utm-builder';
  const TND_SHEET_NAME = '[DA] 메타';

  const ACCOUNTS = AD_ACCOUNTS;
  const PURPOSES = ['구매', '트래픽', '참여', '잠재고객'];
  const URL_TYPES = [['url', 'URL'], ['linkGA', 'LINK(GA)'], ['nt', 'NT'], ['shoplive', '쇼핑라이브']];
  const OBJECTIVES = ['구매', '링크클릭', '도달'];
  const CTAS = [['SHOP_NOW', '지금 구매하기'], ['APPLY_NOW', '지금 신청하기'], ['LEARN_MORE', '더 알아보기']];
  const GENDERS = ['전체', '여성', '남성'];
  // 캠페인 목적 → 캠페인 objective / 광고세트 최적화·과금 기준
  const CAMPAIGN_OBJECTIVE = { 구매: 'OUTCOME_SALES', 링크클릭: 'OUTCOME_TRAFFIC', 도달: 'OUTCOME_AWARENESS' };
  const OPTIMIZATION = {
    구매: { opt: 'OFFSITE_CONVERSIONS', bill: 'IMPRESSIONS' },
    링크클릭: { opt: 'LINK_CLICKS', bill: 'LINK_CLICKS' },
    도달: { opt: 'REACH', bill: 'IMPRESSIONS' },
  };

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const tr = (value) => String(value ?? '').trim();

  const todayAtMidnight = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T00:00`;
  };

  const DEFAULT_STATE = {
    acct: '', purpose: '', urlType: 'url',
    promo: '', sheetUrl: '', nasPath: '', localPath: '', envDir: '',
    campaignName: '', adsetName: '',
    budget: '', budgetType: 'daily',
    objective: '구매', cta: 'SHOP_NOW',
    startAt: '', endAt: '',
    gender: '전체', ageMin: '25', ageMax: '54',
  };

  let state = { ...DEFAULT_STATE, startAt: todayAtMidnight() };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved) state = { ...state, ...saved };
  } catch { /* 저장값이 깨졌으면 기본값으로 시작한다 */ }

  let history = [];
  try { history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') || []; } catch { history = []; }

  // 화면에서만 쓰는 값 (새로고침하면 사라진다)
  let rows = [];          // 시트 조회 결과
  let selectedIdx = -1;
  let lookup = { state: 'idle', message: '' };
  let tnd = null;         // { headline, body } 또는 { error }
  let script = null;      // { filename, text, at, ads, stale }
  let attempted = false;  // [실행 스크립트 만들기] 를 한 번이라도 눌렀는가
  let scriptOpen = false;

  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const saveHistory = () => localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

  const acctLabel = () => (ACCOUNTS.find(([, id]) => id === state.acct) || [])[0] || '';

  // ── 숫자 표기 ────────────────────────────────────────────────────
  const digitsOf = (value) => String(value ?? '').replace(/[^0-9]/g, '');
  const commaNum = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const numToKorean = (value) => {
    let n = parseInt(value, 10) || 0;
    if (n === 0) return '';
    const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
    const small = ['', '십', '백', '천'];
    const big = ['', '만', '억', '조'];
    let out = '';
    let gi = 0;
    while (n > 0) {
      const group = n % 10000;
      if (group > 0) {
        let gs = '';
        let g = group;
        let pos = 0;
        while (g > 0) {
          const d = g % 10;
          if (d > 0) gs = (d === 1 && pos > 0 ? '' : digits[d]) + small[pos] + gs;
          g = Math.floor(g / 10);
          pos += 1;
        }
        if (gi === 1 && gs === '일') gs = '';
        out = gs + big[gi] + out;
      }
      n = Math.floor(n / 10000);
      gi += 1;
    }
    return `${out}원`;
  };
  const budgetKorean = () => {
    const raw = digitsOf(state.budget);
    const kor = raw ? numToKorean(raw) : '';
    return kor ? `(${kor})` : '';
  };

  // ── 구글시트 조회 ────────────────────────────────────────────────
  const parseCsv = (text) => {
    const out = [];
    for (const line of text.replace(/\r/g, '').split('\n')) {
      if (!line) continue;
      const cols = [];
      let col = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i += 1) {
        const ch = line.charAt(i);
        if (ch === '"') {
          if (inQuote && line.charAt(i + 1) === '"') { col += '"'; i += 1; }
          else inQuote = !inQuote;
        } else if (ch === ',' && !inQuote) { cols.push(col); col = ''; }
        else col += ch;
      }
      cols.push(col);
      out.push(cols);
    }
    return out;
  };

  const gvizUrl = (sheetId, sheetName, out) =>
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:${out}&headers=0&sheet=${encodeURIComponent(sheetName)}`;

  const urlOf = (row, type) =>
    (type === 'linkGA' ? row.linkGA : type === 'nt' ? row.nt : type === 'shoplive' ? row.shoplive : row.url) || '';

  const urlTypeLabel = () => (URL_TYPES.find(([value]) => value === state.urlType) || [])[1] || 'URL';

  const lookupSheet = async () => {
    const promo = tr(state.promo);
    if (!promo) { lookup = { state: 'error', message: '프로모션을 입력해주세요.' }; return render(); }

    lookup = { state: 'loading', message: '' };
    rows = [];
    selectedIdx = -1;
    tnd = null;
    render();

    let table;
    try {
      const response = await fetch(gvizUrl(UTM_SHEET_ID, UTM_SHEET_NAME, 'csv'));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      table = parseCsv(await response.text());
    } catch (error) {
      lookup = { state: 'error', message: `시트 조회 실패: ${error.message}` };
      return render();
    }

    // 1행은 머리글. 페이스북 · 프로모션(H열) · 목적(F열) 이 맞는 행만 남긴다.
    const found = [];
    for (let i = 1; i < table.length; i += 1) {
      const r = table[i];
      if (r.length < 22) continue;
      const media = tr(r[4]).toLowerCase();
      if (media.indexOf('페이스북') < 0 && media.indexOf('facebook') < 0) continue;
      if (tr(r[7]) !== promo) continue;
      if (state.purpose && tr(r[5]).indexOf(state.purpose) < 0) continue;
      const entry = {
        msgCode: tr(r[12]),
        campaign: tr(r[20]),
        group: tr(r[21]),
        adName: tr(r[22]),
        url: tr(r[15]),
        linkGA: tr(r[16]),
        nt: r.length > 18 ? tr(r[18]) : '',
        shoplive: r.length > 19 ? tr(r[19]) : '',
      };
      if (!entry.msgCode && !entry.adName) continue;
      found.push(entry);
    }

    rows = found;
    lookup = found.length
      ? { state: 'done', message: '' }
      : { state: 'done', message: '일치하는 데이터 없음 — 프로모션 값과 목적 필터를 확인하세요.' };
    if (found.length) selectRow(0, false);
    render();
    if (found.length) loadTnd();
  };

  const selectRow = (idx, redraw = true) => {
    selectedIdx = idx;
    const row = rows[idx];
    if (!row) return;
    state.campaignName = row.campaign;
    state.adsetName = row.group;
    save();
    if (redraw) render();
  };

  // 실행 전에 T&D 시트의 제목/문구를 미리 확인한다 (비어 있으면 광고 문구가 빈 채로 올라간다)
  const loadTnd = async () => {
    const sheetId = (tr(state.sheetUrl).match(/\/d\/([^/]+)/) || [])[1];
    if (!sheetId) { tnd = null; return render(); }
    tnd = { loading: true };
    render();
    try {
      const response = await fetch(gvizUrl(sheetId, TND_SHEET_NAME, 'json'));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = await response.text();
      const json = JSON.parse((raw.match(/\{[\s\S]*\}/) || [''])[0]);
      const key = tr(state.promo).replace(/\s/g, '').toLowerCase();
      let hit = null;
      for (const row of json.table.rows || []) {
        const cells = row.c || [];
        if (cells.length < 5) continue;
        const b = cells[1] && cells[1].v ? String(cells[1].v) : '';
        if (!b) continue;
        const bKey = b.replace(/\s/g, '').toLowerCase();
        if (bKey === key || (key && bKey.includes(key))) {
          hit = {
            headline: cells[3] && cells[3].v ? String(cells[3].v) : '',
            body: cells[4] && cells[4].v ? String(cells[4].v) : '',
          };
          break;
        }
      }
      tnd = hit || { empty: true };
    } catch (error) {
      tnd = { error: error.message };
    }
    render();
  };

  // ── 실행 스크립트 생성 ───────────────────────────────────────────
  const psq = (value) => `'${String(value ?? '').replace(/'/g, "''")}'`;
  // datetime-local(2026-08-29T09:30) → PowerShell 이 ParseExact 하는 'yyyy-MM-dd HH:mm'
  const psDate = (value) => (value ? value.replace('T', ' ').slice(0, 16) : '');

  const psHeader = () => {
    const goal = OPTIMIZATION[state.objective] || OPTIMIZATION['구매'];
    const lines = [
      '# minix 워크스페이스 [광고자동 세팅 > 메타 광고 세팅] 에서 생성',
      `# 생성 시각: ${new Date().toLocaleString('ko-KR')}`,
      '# 광고는 항상 PAUSED 로 만들어집니다. Ads Manager 에서 확인 후 게시하세요.',
      '',
      'Set-StrictMode -Off',
      "$ErrorActionPreference = 'Continue'",
      '$OutputEncoding = [System.Text.Encoding]::UTF8',
      'try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}',
      '',
      '# 토큰과 NAS 비밀번호는 브라우저에 저장하지 않는다. 여기서 .env 를 직접 읽는다.',
      `$envDir = ${psq(state.envDir)}`,
      '$envCandidates = @()',
      'if ($envDir) { $envCandidates += $envDir }',
      'if ($PSScriptRoot) { $d = $PSScriptRoot; for ($i = 0; $i -lt 5 -and $d; $i++) { $envCandidates += $d; $d = Split-Path $d -Parent } }',
      "$envFile = ''",
      'foreach ($c in $envCandidates) {',
      "    foreach ($n in @('.env','env.txt')) {",
      '        $p = Join-Path $c $n',
      '        if (Test-Path -LiteralPath $p) { $envFile = $p; break }',
      '    }',
      '    if ($envFile) { break }',
      '}',
      'if (-not $envFile) {',
      "    Write-Host '[.env 없음] 아래 폴더에서 .env 또는 env.txt 를 찾지 못했습니다:'",
      '    foreach ($c in $envCandidates) { Write-Host "  $c" }',
      "    Write-Host '워크스페이스 [메타 광고 세팅] 화면의 .env 폴더 칸에 공유 폴더 경로를 넣고 스크립트를 다시 만들어 주세요.'",
      '    exit 1',
      '}',
      'Write-Host "환경설정: $envFile"',
      '$envMap = @{}',
      'foreach ($line in (Get-Content -LiteralPath $envFile -Encoding UTF8)) {',
      '    $line = $line.TrimStart([char]0xFEFF)',
      "    if (-not $line -or $line.StartsWith('#')) { continue }",
      "    $x = $line.IndexOf('=')",
      '    if ($x -lt 1) { continue }',
      '    $envMap[$line.Substring(0,$x).Trim()] = $line.Substring($x+1)',
      '}',
      "$token     = $envMap['META_ACCESS_TOKEN']",
      "$pageId    = $envMap['META_PAGE_ID']",
      "$nasH      = $envMap['NAS_HOST']",
      "$nasU      = $envMap['NAS_ID']",
      "$nasP      = $envMap['NAS_PW']",
      'if (-not $token) { Write-Host "[토큰 없음] $envFile 에 META_ACCESS_TOKEN 이 없습니다."; exit 1 }',
      '',
      `$acct      = ${psq(state.acct)}`,
      `$sheetUrl  = ${psq(tr(state.sheetUrl))}`,
      `$evtName   = ${psq(tr(state.promo))}`,
      `$nasSrc    = ${psq(tr(state.nasPath))}`,
      `$localSrc  = ${psq(tr(state.localPath))}`,
      `$landingUrl = ${psq(urlOf(rows[selectedIdx] || {}, state.urlType))}`,
      `$adsetName    = ${psq(tr(state.adsetName))}`,
      `$campaignName = ${psq(tr(state.campaignName))}`,
      `$cta          = ${psq(state.cta || 'LEARN_MORE')}`,
      `$budget     = ${parseInt(digitsOf(state.budget), 10) || 0}`,
      `$budgetType = ${psq(state.budgetType || 'daily')}`,
      `$startDate  = ${psq(psDate(state.startAt))}`,
      `$endDate    = ${psq(psDate(state.endAt))}`,
      `$optGoal    = ${psq(goal.opt)}`,
      `$billEvt    = ${psq(goal.bill)}`,
      `$ageMin     = ${parseInt(state.ageMin, 10) || 0}`,
      `$ageMax     = ${parseInt(state.ageMax, 10) || 0}`,
      '',
    ];

    // 소재 파일명에 든 메시지코드로 광고명·랜딩 URL 을 되찾기 위한 대응표
    if (!rows.length) lines.push('$adMapping = @()');
    else {
      lines.push('$adMapping = @(');
      rows.forEach((row, i) => {
        const fields = [
          `msgCode=${psq(row.msgCode)}`, `adName=${psq(row.adName)}`, `group=${psq(row.group)}`,
          `campaign=${psq(row.campaign)}`, `landingUrl=${psq(urlOf(row, state.urlType))}`,
        ].join(';');
        lines.push(`    @{${fields}}${i < rows.length - 1 ? ',' : ''}`);
      });
      lines.push(')');
    }
    lines.push('');
    return lines;
  };

  const genderLine = () =>
    (state.gender === '여성' ? "$tgt.Add('genders', @(2))"
      : state.gender === '남성' ? "$tgt.Add('genders', @(1))"
        : '# gender=전체');
  const PS_BODY = [
    'Write-Host \'=== Step 1. 구글시트 T&D 추출 ===\'',
    '$sheetId = [regex]::Match($sheetUrl, \'/d/([^/]+)\').Groups[1].Value',
    '$jsonUrl = \'https://docs.google.com/spreadsheets/d/\' + $sheetId + \'/gviz/tq?tqx=out:json&headers=0&sheet=\' + [Uri]::EscapeDataString(\'[DA] 메타\')',
    '$raw     = (Invoke-WebRequest -Uri $jsonUrl -UseBasicParsing).Content',
    '$headline = \'\'; $bodyText = \'\'',
    '$evtKey = ($evtName -replace \'\\s\',\'\').ToLower()',
    'try {',
    '    $jsonStr = [regex]::Match($raw, \'(?s)\\{.*\\}\').Value',
    '    $tbl = ($jsonStr | ConvertFrom-Json).table',
    '    foreach ($row in $tbl.rows) {',
    '        $cells = $row.c',
    '        if (-not $cells -or $cells.Count -lt 5) { continue }',
    '        $bVal = if ($cells[1] -and $cells[1].v) { [string]$cells[1].v } else { \'\' }',
    '        if (-not $bVal) { continue }',
    '        $bKey = ($bVal -replace \'\\s\',\'\').ToLower()',
    '        if ($bKey -eq $evtKey -or ($evtKey -and $bKey.Contains($evtKey))) {',
    '            $headline = if ($cells[3] -and $cells[3].v) { [string]$cells[3].v } else { \'\' }',
    '            $bodyText = if ($cells[4] -and $cells[4].v) { [string]$cells[4].v } else { \'\' }',
    '            break',
    '        }',
    '    }',
    '} catch { Write-Host "[T&D 파싱 오류] $_" }',
    'Write-Host "[T&D] 제목: \'$headline\'"',
    'Write-Host "[T&D] 문구: \'$($bodyText.Substring(0,[Math]::Min(80,$bodyText.Length)))\'"',
    'if (-not $headline) { Write-Host \'[T&D 경고] 제목을 찾지 못했습니다. 시트 이름([DA] 메타)과 프로모션값을 확인하세요.\' }',
    '',
    '$fileSrc = \'\'',
    'if ($localSrc) { $fileSrc = $localSrc }',
    'elseif ($nasSrc) {',
    '    $p = $nasSrc -replace \'/\',\'\\\'',
    '    if ($p.StartsWith(\'\\\\\')) { $fileSrc = $p }',
    '    else { $ip = [regex]::Match($nasH,\'\\d+\\.\\d+\\.\\d+\\.\\d+\').Value; $fileSrc = \'\\\\\' + $ip + \'\\\' + $p.TrimStart(\'\\\') }',
    '}',
    'if ($fileSrc) {',
    '    Write-Host "=== Step 2. 로컬/UNC 소재 사용 (NAS API 건너뜀): $fileSrc ==="',
    '    if ($fileSrc.StartsWith(\'\\\\\')) {',
    '        $srv = $fileSrc.Substring(2).Split(\'\\\')[0]',
    '        $parts = $fileSrc.Substring(2).Split(\'\\\')',
    '        $shareRoot = if ($parts.Count -ge 2) { \'\\\\\' + $parts[0] + \'\\\' + $parts[1] } else { \'\\\\\' + $srv }',
    '        # 활성 세션(Get-SmbConnection)뿐 아니라 영구 매핑(Get-SmbMapping)도 봐야 한다.',
    '        # 사내망 밖이거나 유휴 상태면 세션은 사라져도 Z: 같은 매핑은 남아 있고,',
    '        # 그 상태에서 다시 인증하면 오류 1219 가 난다.',
    '        $existingConn = @(Get-SmbConnection -ErrorAction SilentlyContinue | Where-Object { $_.ServerName -ieq $srv })',
    '        $existingMap = @(Get-SmbMapping -ErrorAction SilentlyContinue | Where-Object { $_.RemotePath -like "\\\\$srv\\*" })',
    '        $sameUser = @($existingConn | Where-Object { $_.UserName -ieq $nasU })',
    '        if ($existingConn.Count -gt 0 -and $sameUser.Count -eq 0) {',
    '            Write-Host "[NAS 인증 중단] $srv 에 다른 계정($($existingConn[0].UserName))으로 이미 연결되어 있습니다."',
    '            Write-Host "  탐색기에서 해당 NAS 창을 닫고 연결된 네트워크 드라이브를 해제한 뒤 다시 실행하세요."',
    '            Write-Host "  (자동화가 다른 계정의 NAS 연결을 임의로 끊지 않습니다.)"',
    '            exit 1',
    '        }',
    '        if ($existingConn.Count -gt 0) {',
    '            Write-Host "기존 NAS 연결 재사용: $shareRoot (계정 $($existingConn[0].UserName))"',
    '        } elseif ($existingMap.Count -gt 0) {',
    '            # 드라이브 문자가 있는 매핑을 우선 보여준다 (IPC$ 는 세션용이라 문자가 없다)',
    '            $lettered = @($existingMap | Where-Object { $_.LocalPath })',
    '            $mapInfo = if ($lettered.Count -gt 0) { "$($lettered[0].LocalPath) -> $($lettered[0].RemotePath)" } else { $existingMap[0].RemotePath }',
    '            Write-Host "기존 네트워크 드라이브 매핑 사용: $mapInfo"',
    '            Write-Host "  (여기서 다시 인증하면 오류 1219 가 나므로 인증을 건너뜁니다.)"',
    '        } else {',
    '            Write-Host "UNC 인증 시도: $shareRoot (계정 $nasU)"',
    '            # net use 대신 New-PSDrive: 비밀번호가 프로세스 명령행에 남지 않고,',
    '            # 이 프로세스에서만 살아 있어 사용자의 기존 네트워크 드라이브를 건드리지 않는다.',
    '            $nasCred = [pscredential]::new($nasU, (ConvertTo-SecureString $nasP -AsPlainText -Force))',
    '            try {',
    '                New-PSDrive -Name NASSETUP -PSProvider FileSystem -Root $shareRoot -Credential $nasCred -Scope Script -ErrorAction Stop | Out-Null',
    '            } catch {',
    '                $detail = $_.Exception.Message',
    '                # 1219 는 숫자로 안 오고 문장으로 오는 경우가 많다 (영문/한글 모두 대비)',
    '                if ($detail -match \'1219|Multiple connections|다중 연결|둘 이상의 사용자\') {',
    '                    Write-Host "[NAS 인증 실패 - 오류 1219] $srv 에 이미 다른 계정의 연결·매핑이 남아 있습니다."',
    '                    Write-Host "  탐색기의 네트워크 드라이브를 해제하고, 저장된 자격증명도 지운 뒤 다시 실행하세요."',
    '                    Write-Host "  확인: net use   /   삭제: net use <드라이브> /delete , cmdkey /delete:$srv"',
    '                    Write-Host "  원본 메시지: $detail"',
    '                } else { Write-Host "[NAS 인증 실패] $detail" }',
    '                exit 1',
    '            }',
    '        }',
    '    }',
    '    $srcResolved = $null',
    '    foreach ($cand in @($fileSrc, $fileSrc.Normalize([Text.NormalizationForm]::FormC), $fileSrc.Normalize([Text.NormalizationForm]::FormD))) { if (Test-Path -LiteralPath $cand) { $srcResolved = $cand; break } }',
    '    if (-not $srcResolved) { Write-Host \'[경로 없음] 탐색기 주소창에 아래 경로가 열리는지 먼저 확인하세요(공유이름/폴더명/네트워크 인증):\'; Write-Host "  $fileSrc"; exit 1 }',
    '    $allFiles = @(Get-ChildItem -LiteralPath $srcResolved -File | Where-Object { $_.Name -match \'\\.(jpg|png)$\' } | Select-Object @{n=\'name\';e={$_.Name}},@{n=\'localFull\';e={$_.FullName}},@{n=\'path\';e={\'\'}})',
    '} else {',
    '    Write-Host \'=== Step 2. NAS 로그인 ===\'',
    '    Write-Host "NAS 주소: $nasH / 계정: $nasU"',
    '    try { $authRaw = Invoke-RestMethod "$nasH/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=login&account=$([Uri]::EscapeDataString($nasU))&passwd=$([Uri]::EscapeDataString($nasP))&session=FileStation&format=sid" }',
    '    catch { Write-Host "NAS 접속 오류(주소/네트워크 확인): $_"; exit 1 }',
    '    $sid = $authRaw.data.sid',
    '    if (-not $sid) { Write-Host "NAS 로그인 실패(계정/비밀번호 확인): $($authRaw | ConvertTo-Json -Compress -Depth 5)"; exit 1 }',
    '    Write-Host "SID: $($sid.Substring(0,[Math]::Min(8,$sid.Length)))..."',
    '    Write-Host \'=== Step 3. 소재 목록 ===\'',
    '    Write-Host "조회 경로: $nasSrc"',
    '    $listResp = Invoke-RestMethod "$nasH/webapi/entry.cgi?api=SYNO.FileStation.List&version=2&method=list&folder_path=$([Uri]::EscapeDataString($nasSrc))&_sid=$sid"',
    '    if (-not $listResp.success) { Write-Host "소재 목록 조회 실패 — 경로가 정확한지 확인하세요(공유폴더명 포함, 대소문자/띄어쓰기 일치): $($listResp | ConvertTo-Json -Compress -Depth 5)"; exit 1 }',
    '    try { $apiInfo = Invoke-RestMethod "$nasH/webapi/query.cgi?api=SYNO.API.Info&version=1&method=query&query=SYNO.FileStation.Download"; $dlPath = $apiInfo.data.\'SYNO.FileStation.Download\'.path; $dlVer = $apiInfo.data.\'SYNO.FileStation.Download\'.maxVersion } catch {}',
    '    if (-not $dlPath) { $dlPath = \'entry.cgi\'; $dlVer = 2 }',
    '    Write-Host "다운로드 API: /webapi/$dlPath (v$dlVer)"',
    '    $allFiles = @($listResp.data.files | Where-Object { $_.name -match \'\\.(jpg|png)$\' } | Select-Object @{n=\'name\';e={$_.name}},@{n=\'localFull\';e={\'\'}},@{n=\'path\';e={$_.path}})',
    '    if ($allFiles.Count -eq 0) { Write-Host "경고: 해당 경로에 jpg/png 소재가 없습니다. 폴더 내 전체 항목:"; foreach ($it in $listResp.data.files) { Write-Host "    $($it.name)" } }',
    '}',
    'function Norm($s) { if ($s) { $s.Normalize([Text.NormalizationForm]::FormC) } else { \'\' } }',
    '$sqFiles = @($allFiles | Where-Object { (Norm $_.name) -notmatch \'세로\' })',
    '$vtMap = @{}',
    'foreach ($vf in @($allFiles | Where-Object { (Norm $_.name) -match \'세로\' })) { $vb = ((Norm $vf.name) -replace \'\\.[^.]+$\',\'\') -replace \'\\s*\\(?세로\\)?\\s*\',\'\'; $vtMap[$vb] = $vf.name }',
    'Write-Host "피드 소재 $($sqFiles.Count)개 / 세로 소재 $($vtMap.Count)개"',
    'foreach ($sf in $sqFiles) { Write-Host "  $($sf.name)" }',
    '',
    'Write-Host \'=== Step 4. 업로드 ===\'',
    'Add-Type -AssemblyName System.Drawing,System.Net.Http',
    '$hc = [System.Net.Http.HttpClient]::new()',
    '$hashes = @{}',
    '$adNameMap = @{}',
    '$urlMap = @{}',
    'foreach ($sf in $allFiles) {',
    '    if ($sf.localFull) {',
    '        $byt = [System.IO.File]::ReadAllBytes($sf.localFull)',
    '    } else {',
    '        $ep   = [Uri]::EscapeDataString(\'["\' + $sf.path + \'"]\')',
    '        $dlUrl = "$nasH/webapi/$dlPath?api=SYNO.FileStation.Download&version=$dlVer&method=download&path=$ep&mode=download&_sid=$sid"',
    '        try { $byt = (Invoke-WebRequest -Uri $dlUrl -UseBasicParsing).Content } catch { Write-Host "    [NAS 다운로드 실패] $($sf.name): $($_.Exception.Message)"; continue }',
    '    }',
    '    if (-not $byt -or $byt.Length -lt 100) { Write-Host "    [다운로드 데이터 없음 - 건너뜀] $($sf.name)"; continue }',
    '    $ms2  = [System.IO.MemoryStream]::new($byt)',
    '    $bmp  = [System.Drawing.Bitmap]::new($ms2)',
    '    $enc2 = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq \'image/jpeg\' }',
    '    $ep2  = [System.Drawing.Imaging.EncoderParameters]::new(1)',
    '    $ep2.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality,[long]85)',
    '    $om   = [System.IO.MemoryStream]::new(); $bmp.Save($om,$enc2,$ep2)',
    '    $jbyt = $om.ToArray()',
    '    $sn   = (($sf.name -replace \'[^\\x00-\\x7F]\',\'\') -replace \'[^\\w\\-.]\',\'\') + \'.jpg\'',
    '    $fm   = [System.Net.Http.MultipartFormDataContent]::new()',
    '    $ic   = [System.Net.Http.ByteArrayContent]::new($jbyt)',
    '    $ic.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::new(\'image/jpeg\')',
    '    $fm.Add($ic,\'filename\',$sn)',
    '    $fm.Add([System.Net.Http.StringContent]::new($token),\'access_token\')',
    '    $ur = $hc.PostAsync("https://graph.facebook.com/v21.0/$acct/adimages",$fm).GetAwaiter().GetResult()',
    '    $uraw = [System.Text.Encoding]::UTF8.GetString($ur.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult())',
    '    $uj = $uraw | ConvertFrom-Json',
    '    $hash = ($uj.images.PSObject.Properties | Select-Object -First 1 -ExpandProperty Value).hash',
    '    if (-not $hash) { Write-Host "    [업로드 실패] $($sf.name): $uraw" }',
    '    $hashes[$sf.name] = $hash',
    '    $mappedAdName = $sf.name -replace \'\\.[^.]+$\',\'\'',
    '    $mappedUrl = $landingUrl',
    '    foreach ($m in $adMapping) {',
    '        if ($m.msgCode -and $sf.name -like "*$($m.msgCode)*") { $mappedAdName = $m.adName; if ($m.landingUrl) { $mappedUrl = $m.landingUrl }; break }',
    '    }',
    '    $adNameMap[$sf.name] = $mappedAdName',
    '    $urlMap[$sf.name] = $mappedUrl',
    '    Write-Host "  $($sf.name) -> hash:$hash / 광고명:$mappedAdName"',
    '}',
    '',
    'Write-Host \'=== Step 5-0. 픽셀/캠페인 조회/생성 ===\'',
    '$campaignId = \'\'',
    '$campObjective = @@CAMPOBJ@@',
    '$pixelId = \'\'',
    'try {',
    '    $pxR = Invoke-RestMethod "https://graph.facebook.com/v21.0/$acct/adspixels?fields=id&limit=1&access_token=$token"',
    '    if ($pxR.data -and $pxR.data.Count -gt 0) { $pixelId = $pxR.data[0].id; Write-Host "픽셀: $pixelId" }',
    '} catch {}',
    '$igId = \'17841446818074113\'',
    'Write-Host "Instagram 게재 계정: $igId (@minix_official)"',
    'if (-not $igId) { Write-Host "경고: Instagram 계정을 못 찾음 — 인스타 게재위치 광고가 실패할 수 있습니다." }',
    'try {',
    '    $cpR = Invoke-RestMethod "https://graph.facebook.com/v21.0/$acct/campaigns?fields=id,name&limit=200&access_token=$token"',
    '    $cpM = $cpR.data | Where-Object { $_.name -eq $campaignName } | Select-Object -First 1',
    '    if ($cpM) { $campaignId = $cpM.id; Write-Host "캠페인 기존 사용: $campaignId" }',
    '} catch { Write-Host "캠페인 조회 오류: $_" }',
    'if (-not $campaignId) {',
    '    Write-Host "캠페인 없음 → 생성 중..."',
    '    try {',
    '        $cpObj = [ordered]@{ name=$campaignName; objective=$campObjective; status=\'PAUSED\'; special_ad_categories=@(); is_adset_budget_sharing_enabled=$false }',
    '        $cpJson = $cpObj | ConvertTo-Json -Compress -Depth 3',
    '        $cpBytes = [System.Text.Encoding]::UTF8.GetBytes($cpJson)',
    '        $cpReq = [System.Net.WebRequest]::Create("https://graph.facebook.com/v21.0/$acct/campaigns?access_token=$token")',
    '        $cpReq.Method = \'POST\'; $cpReq.ContentType = \'application/json; charset=utf-8\'; $cpReq.ContentLength = $cpBytes.Length',
    '        $cpReq.GetRequestStream().Write($cpBytes, 0, $cpBytes.Length)',
    '        try { $cpRaw = [System.IO.StreamReader]::new($cpReq.GetResponse().GetResponseStream()).ReadToEnd() }',
    '        catch [System.Net.WebException] { $cpRaw = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()).ReadToEnd() }',
    '        $newCpJ = $cpRaw | ConvertFrom-Json',
    '        $campaignId = $newCpJ.id',
    '        if (-not $campaignId) { Write-Host "캠페인 생성 오류: $cpRaw"; exit 1 }',
    '        Write-Host "캠페인 생성 완료: $campaignId"',
    '    } catch { Write-Host "캠페인 생성 오류: $_"; exit 1 }',
    '}',
    '',
    'Write-Host \'=== Step 5. 광고세트 조회/생성 ===\'',
    '$adsetId = \'\'',
    'try {',
    '    $asList = Invoke-RestMethod "https://graph.facebook.com/v21.0/$campaignId/adsets?fields=id,name&limit=500&access_token=$token"',
    '    $asM = $asList.data | Where-Object { $_.name -eq $adsetName } | Select-Object -First 1',
    '    if ($asM) { $adsetId = $asM.id; Write-Host "광고세트 기존 사용: $adsetId" }',
    '} catch { Write-Host "광고세트 조회 오류: $_" }',
    'if (-not $adsetId) {',
    '    $inheritPO=\'\'; ',
    '    try {',
    '        $exAS = Invoke-RestMethod "https://graph.facebook.com/v21.0/$campaignId/adsets?fields=promoted_object,optimization_goal,billing_event&limit=1&access_token=$token"',
    '        if ($exAS.data -and $exAS.data.Count -gt 0) {',
    '            if ($exAS.data[0].promoted_object) { $inheritPO = $exAS.data[0].promoted_object | ConvertTo-Json -Compress -Depth 8 }',
    '            if ($exAS.data[0].optimization_goal) { $optGoal = $exAS.data[0].optimization_goal }',
    '            if ($exAS.data[0].billing_event) { $billEvt = $exAS.data[0].billing_event }',
    '            Write-Host "기존 광고세트 설정 상속: 최적화=$optGoal / promoted_object=$(if($inheritPO){\'있음\'}else{\'없음\'})"',
    '        }',
    '    } catch {}',
    '    $sDT = [DateTime]::ParseExact($startDate,\'yyyy-MM-dd HH:mm\',$null)',
    '    $sTs = [DateTimeOffset]::new($sDT, [System.TimeZoneInfo]::Local.GetUtcOffset($sDT)).ToUnixTimeSeconds()',
    '    if ($endDate) { $eDT = [DateTime]::ParseExact($endDate,\'yyyy-MM-dd HH:mm\',$null); $eTs = [DateTimeOffset]::new($eDT, [System.TimeZoneInfo]::Local.GetUtcOffset($eDT)).ToUnixTimeSeconds() }',
    '    $tgt = [ordered]@{ geo_locations=@{countries=@(\'KR\')}; age_min=$ageMin; age_max=$ageMax; targeting_automation=@{advantage_audience=0} }',
    '    @@GENDER@@',
    '    $tgtJson = $tgt | ConvertTo-Json -Compress -Depth 4',
    '    $asParams = @{ name=$adsetName; campaign_id=$campaignId; start_time=$sTs; optimization_goal=$optGoal; billing_event=$billEvt; bid_strategy=\'LOWEST_COST_WITHOUT_CAP\'; targeting=$tgtJson; status=\'PAUSED\' }',
    '    if ($budgetType -eq \'lifetime\') { $asParams[\'lifetime_budget\'] = $budget } else { $asParams[\'daily_budget\'] = $budget }',
    '    if ($endDate) { $asParams[\'end_time\'] = $eTs }',
    '    if ($inheritPO) { $asParams[\'promoted_object\'] = $inheritPO }',
    '    elseif ($pixelId -and $optGoal -eq \'OFFSITE_CONVERSIONS\') { $asParams[\'promoted_object\'] = \'{"pixel_id":"\'+$pixelId+\'","custom_event_type":"PURCHASE"}\' }',
    '    try { $asJ = Invoke-RestMethod -Method Post -Uri "https://graph.facebook.com/v21.0/$acct/adsets?access_token=$token" -Body $asParams }',
    '    catch [System.Net.WebException] { $asErrBody = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()).ReadToEnd(); Write-Host "광고세트 오류: $asErrBody"; exit 1 }',
    '    $adsetId = $asJ.id',
    '    if (-not $adsetId) { Write-Host "오류: $($asJ|ConvertTo-Json)"; exit 1 }',
    '    Write-Host "광고세트 생성 완료: $adsetId"',
    '}',
    '',
    '$existingAdNames = @{}',
    'try {',
    '    $exAdsResp = Invoke-RestMethod "https://graph.facebook.com/v21.0/$adsetId/ads?fields=name&limit=500&access_token=$token"',
    '    foreach ($ea in $exAdsResp.data) { $existingAdNames[$ea.name] = $true }',
    '    if ($existingAdNames.Count -gt 0) { Write-Host "광고세트에 이미 존재하는 광고 $($existingAdNames.Count)건 확인 (중복 생성 방지)" }',
    '} catch { Write-Host "기존 광고 조회 오류(무시하고 진행): $_" }',
    '',
    'Write-Host \'=== Step 6. 크리에이티브 + 광고 생성 ===\'',
    'foreach ($sf in $sqFiles) {',
    '    $fn = $sf.name',
    '    $h  = $hashes[$fn]',
    '    $cn = $adNameMap[$fn]',
    '    if ($existingAdNames.ContainsKey($cn)) { Write-Host "  [건너뜀-이미존재] $cn"; continue }',
    '    $adUrl = if ($urlMap.ContainsKey($fn) -and $urlMap[$fn]) { $urlMap[$fn] } else { $landingUrl }',
    '    $vbKey = (Norm $fn) -replace \'\\.[^.]+$\',\'\'',
    '    $vh = if ($vtMap.ContainsKey($vbKey)) { $hashes[$vtMap[$vbKey]] } else { \'\' }',
    '    $oss = @{page_id=$pageId}',
    '    if ($igId) { $oss[\'instagram_user_id\'] = $igId }',
    '    if ($vh) {',
    '        $afs = @{ ad_formats=@(\'SINGLE_IMAGE\'); images=@(@{hash=$h;adlabels=@(@{name=\'img_feed\'})},@{hash=$vh;adlabels=@(@{name=\'img_story\'})}); bodies=@(@{text=$bodyText}); titles=@(@{text=$headline}); link_urls=@(@{website_url=$adUrl}); call_to_action_types=@($cta); asset_customization_rules=@(@{customization_spec=@{publisher_platforms=@(\'facebook\',\'instagram\');facebook_positions=@(\'feed\');instagram_positions=@(\'stream\')};image_label=@{name=\'img_feed\'}},@{customization_spec=@{publisher_platforms=@(\'facebook\',\'instagram\');facebook_positions=@(\'story\',\'facebook_reels\');instagram_positions=@(\'story\',\'reels\')};image_label=@{name=\'img_story\'}}) }',
    '        $afsJson = $afs | ConvertTo-Json -Compress -Depth 8',
    '        $ossJson = $oss | ConvertTo-Json -Compress -Depth 3',
    '        $crBody = \'name=\'+[Uri]::EscapeDataString($cn)+\'&object_story_spec=\'+[Uri]::EscapeDataString($ossJson)+\'&asset_feed_spec=\'+[Uri]::EscapeDataString($afsJson)+\'&access_token=\'+$token',
    '        Write-Host "  [세로포함] $cn (피드=기본소재 / 스토리·릴스=세로)"',
    '    } else {',
    '        $oss[\'link_data\'] = @{link=$adUrl;message=$bodyText;name=$headline;image_hash=$h;call_to_action=@{type=$cta}}',
    '        $story = $oss | ConvertTo-Json -Compress -Depth 5',
    '        $crBody = \'name=\'+[Uri]::EscapeDataString($cn)+\'&object_story_spec=\'+[Uri]::EscapeDataString($story)+\'&access_token=\'+$token',
    '    }',
    '    $crC = [System.Net.Http.StringContent]::new($crBody,[System.Text.Encoding]::UTF8,\'application/x-www-form-urlencoded\')',
    '    $crR = $hc.PostAsync("https://graph.facebook.com/v21.0/$acct/adcreatives",$crC).GetAwaiter().GetResult()',
    '    $crRaw = [System.Text.Encoding]::UTF8.GetString($crR.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult())',
    '    $crJ = $crRaw | ConvertFrom-Json',
    '    $crId = $crJ.id',
    '    if (-not $crId) { Write-Host "  [크리에이티브 실패] $cn : $crRaw"; continue }',
    '    Write-Host "  크리에이티브 $cn : $crId"',
    '    $adBody = \'name=\'+[Uri]::EscapeDataString($cn)+\'&adset_id=\'+$adsetId+\'&creative=\'+[Uri]::EscapeDataString(\'{"creative_id":"\'+$crId+\'"}\')+\'&status=PAUSED&access_token=\'+$token',
    '    $adC = [System.Net.Http.StringContent]::new($adBody,[System.Text.Encoding]::UTF8,\'application/x-www-form-urlencoded\')',
    '    $adR = $hc.PostAsync("https://graph.facebook.com/v21.0/$acct/ads",$adC).GetAwaiter().GetResult()',
    '    $adRaw = [System.Text.Encoding]::UTF8.GetString($adR.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult())',
    '    $adJ = $adRaw | ConvertFrom-Json',
    '    if (-not $adJ.id) { Write-Host "  [광고 실패] $cn : $adRaw" } else { Write-Host "  광고 $cn : $($adJ.id)" }',
    '}',
    '',
    'Write-Host \'\'',
    'Write-Host \'=== 완료! Ads Manager에서 확인하세요 ===\'',
  ];

  const buildScript = () => {
    const campObj = CAMPAIGN_OBJECTIVE[state.objective] || 'OUTCOME_SALES';
    const body = PS_BODY.map((line) => line.replace('@@CAMPOBJ@@', psq(campObj)).replace('@@GENDER@@', genderLine()));
    return [...psHeader(), ...body].join('\r\n');
  };

  // 실행은 다른 곳에서 일어나므로, 원본이 실행 도중에야 냈던 오류를 여기서 미리 잡는다
  const problems = () => {
    const list = [];
    const min = parseInt(state.ageMin, 10);
    const max = parseInt(state.ageMax, 10);
    if (!state.acct) list.push('광고 계정을 선택하세요.');
    if (!tr(state.promo)) list.push('프로모션을 입력하세요.');
    if (!rows.length) list.push('[시트 조회] 를 눌러 소재 대응표를 먼저 만드세요. 없으면 광고명과 랜딩 URL 이 비어 들어갑니다.');
    if (!tr(state.sheetUrl)) list.push('구글시트 URL(T&D) 을 입력하세요. 없으면 제목·문구가 빈 채로 올라갑니다.');
    if (!tr(state.nasPath) && !tr(state.localPath)) list.push('NAS 소재 경로 또는 로컬 소재 경로 중 하나는 입력해야 합니다.');
    if (!tr(state.campaignName)) list.push('캠페인명을 입력하세요.');
    if (!tr(state.adsetName)) list.push('광고그룹명을 입력하세요.');
    if (!(parseInt(digitsOf(state.budget), 10) > 0)) list.push('예산을 입력하세요. (0원 불가)');
    if (!state.startAt) list.push('시작일시를 지정하세요.');
    if (state.budgetType === 'lifetime' && !state.endAt) list.push('총예산을 쓰려면 종료일시를 반드시 지정해야 합니다.');
    if (state.startAt && state.endAt && state.endAt <= state.startAt) list.push('종료일시가 시작일시보다 빠르거나 같습니다.');
    if (!(min >= 13) || !(max >= min)) list.push('연령은 13세 이상, 최소 연령 ≤ 최대 연령으로 넣어주세요.');
    return list;
  };

  const stampName = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  };

  const addHistory = (name) => {
    if (!name) return;
    const at = new Date().toLocaleString('ko-KR');
    const found = history.find((entry) => entry.name === name);
    if (found) found.at = at;
    else history.unshift({ name, at, acct: acctLabel() });
    history = history.slice(0, 50);
    saveHistory();
  };

  const makeScript = () => {
    attempted = true;
    if (problems().length) { script = null; return render(); }
    script = { filename: `meta-ad-setup_${stampName()}.ps1`, text: buildScript(), at: new Date().toLocaleString('ko-KR'), ads: rows.length };
    addHistory(tr(state.campaignName));
    render();
  };

  const runCommand = () => `powershell -NoProfile -ExecutionPolicy Bypass -File "%USERPROFILE%\\Downloads\\${script.filename}"`;

  const download = () => {
    if (!script) return;
    // PowerShell 5.1 은 BOM 없는 .ps1 을 ANSI 로 읽어 한글이 깨진다
    const url = URL.createObjectURL(new Blob([`\uFEFF${script.text}`], { type: 'application/octet-stream' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = script.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  // 폼이 바뀌면 이미 만든 스크립트는 옛것이 된다 (모르고 내려받지 않도록 표시만 해둔다)
  const markStale = () => {
    if (!script || script.stale) return;
    script.stale = true;
    adSetup.querySelector('.setup-done')?.classList.add('is-stale');
    const warn = adSetup.querySelector('.setup-stale');
    if (warn) warn.hidden = false;
  };

  // ── 화면 ─────────────────────────────────────────────────────────
  const pills = (attr, items, current) => `<div class="setup-pills">${items
    .map(([label, value]) => `<button type="button" class="setup-pill${value === current ? ' is-on' : ''}" data-${attr}="${escapeHtml(value)}">${escapeHtml(label)}</button>`)
    .join('')}</div>`;

  const textField = (field, label, { hint = '', required = false, placeholder = '', wide = false } = {}) => `
    <label${wide ? ' class="tool-wide"' : ''}><span${required ? ' class="setup-req"' : ''}>${escapeHtml(label)}</span>${hint ? `<small class="setup-hint">${escapeHtml(hint)}</small>` : ''}
      <input type="text" data-field="${field}" value="${escapeHtml(state[field])}" placeholder="${escapeHtml(placeholder)}">
    </label>`;

  const sheetTable = () => {
    if (lookup.state === 'loading') return '<p class="tool-empty">시트를 읽는 중…</p>';
    if (lookup.state === 'error') return `<p class="setup-alert">${escapeHtml(lookup.message)}</p>`;
    if (lookup.state === 'idle') return '';
    if (!rows.length) return `<p class="tool-empty">${escapeHtml(lookup.message || '일치하는 데이터 없음')}</p>`;
    return `<div class="tool-table-wrap"><table class="tool-table setup-table">
      <thead><tr><th>메시지코드</th><th>광고소재명</th><th>${escapeHtml(urlTypeLabel())}</th></tr></thead>
      <tbody>${rows.map((row, i) => `<tr data-row="${i}"${i === selectedIdx ? ' class="is-picked"' : ''}>
        <td><span class="setup-code">${i + 1}. ${escapeHtml(row.msgCode)}</span></td>
        <td>${escapeHtml(row.adName) || '<span class="tool-blank">-</span>'}</td>
        <td class="setup-url">${escapeHtml(urlOf(row, state.urlType)) || '<span class="tool-blank">-</span>'}</td>
      </tr>`).join('')}</tbody>
    </table></div>
    <p class="setup-note">행을 누르면 캠페인명 · 광고그룹명 · 랜딩 URL 이 그 행 값으로 채워집니다. 실제 광고명은 소재 파일명에 든 메시지코드로 다시 짝지어집니다.</p>`;
  };

  const tndBox = () => {
    if (!tnd) return '';
    if (tnd.loading) return '<div class="setup-tnd">T&amp;D 확인 중…</div>';
    if (tnd.error) return `<div class="setup-tnd is-warn">T&amp;D 미리보기 실패 (${escapeHtml(tnd.error)}) — 스크립트는 실행할 때 직접 다시 읽으므로 그대로 진행해도 됩니다.</div>`;
    if (tnd.empty) return `<div class="setup-tnd is-warn">시트 <b>${escapeHtml(TND_SHEET_NAME)}</b> 에서 <b>${escapeHtml(tr(state.promo))}</b> 를 찾지 못했습니다. 이대로 실행하면 제목·문구가 빈 채로 올라갑니다.</div>`;
    return `<div class="setup-tnd">
      <div><b>제목</b><span>${escapeHtml(tnd.headline) || '<i>비어 있음</i>'}</span></div>
      <div><b>문구</b><span>${escapeHtml(tnd.body.slice(0, 160)) || '<i>비어 있음</i>'}${tnd.body.length > 160 ? '…' : ''}</span></div>
    </div>`;
  };

  const scriptBox = () => {
    const list = attempted ? problems() : [];
    if (list.length) return `<div class="setup-issues"><b>아래를 먼저 채워주세요</b><ul>${list.map((issue) => `<li>${escapeHtml(issue)}</li>`).join('')}</ul></div>`;
    if (!script) return '';
    return `<div class="setup-done${script.stale ? ' is-stale' : ''}">
      <p class="setup-stale"${script.stale ? '' : ' hidden'}>입력값이 바뀌었습니다. [실행 스크립트 만들기] 를 다시 눌러주세요.</p>
      <div class="setup-done-head">
        <span class="setup-done-name"><b>${escapeHtml(script.filename)}</b><small>${escapeHtml(script.at)} 생성 · 소재 대응 ${script.ads}건</small></span>
        <span class="setup-done-actions">
          <button type="button" class="tool-add setup-download"><i data-lucide="download"></i>내려받기</button>
          <button type="button" class="tool-copy setup-copy-cmd"><i data-lucide="terminal"></i>실행 명령 복사</button>
          <button type="button" class="tool-copy setup-copy-script"><i data-lucide="copy"></i>스크립트 복사</button>
        </span>
      </div>
      <ol class="setup-steps">
        <li>내려받은 <code>${escapeHtml(script.filename)}</code> 를 <b>우클릭 → PowerShell에서 실행</b> 합니다.</li>
        <li>또는 <b>Win+R</b> 실행창에 붙여넣습니다 · <code class="setup-cmd">${escapeHtml(runCommand())}</code></li>
        <li>NAS 소재를 쓴다면 사내망 또는 VPN 에 연결된 상태여야 합니다.</li>
      </ol>
      <button type="button" class="setup-toggle-script">${scriptOpen ? '스크립트 접기' : '스크립트 미리보기'}<i data-lucide="${scriptOpen ? 'chevron-up' : 'chevron-down'}"></i></button>
      ${scriptOpen ? `<pre class="setup-script">${escapeHtml(script.text)}</pre>` : ''}
    </div>`;
  };

  const render = () => {
    adSetup.innerHTML = `
      <div class="tool-head">
        <h2>메타 광고 세팅</h2>
        <p>폼 · 시트 조회 · 검증은 이 화면에서, NAS 접근과 메타 API 호출은 내려받은 PowerShell 스크립트가 합니다.
        토큰과 NAS 비밀번호는 브라우저에 저장하지 않고 스크립트가 <b>.env</b> 를 직접 읽습니다.
        광고는 원본과 똑같이 항상 <b>일시중지(PAUSED)</b> 상태로 만들어집니다.</p>
      </div>

      <section class="tool-card">
        <h3><span class="setup-req">광고 계정</span>${state.acct ? `<small>${escapeHtml(acctLabel())} · ${escapeHtml(state.acct)}</small>` : ''}</h3>
        ${pills('acct', ACCOUNTS, state.acct)}
      </section>

      <section class="tool-card">
        <h3>소재 / T&amp;D</h3>
        <div class="setup-row">
          <div class="setup-field"><span>목적<small class="setup-hint">시트 목적열 필터 · 다시 누르면 해제</small></span>${pills('purpose', PURPOSES.map((value) => [value, value]), state.purpose)}</div>
          <div class="setup-field"><span>URL 유형<small class="setup-hint">랜딩 URL 로 쓸 열</small></span>${pills('urltype', URL_TYPES.map(([value, label]) => [label, value]), state.urlType)}</div>
        </div>
        <div class="setup-field setup-promo">
          <span class="setup-req">프로모션</span>
          <div class="setup-promo-row">
            <input type="text" data-field="promo" value="${escapeHtml(state.promo)}" placeholder="예: always, cjonstyle …">
            <button type="button" class="tool-add setup-lookup"${lookup.state === 'loading' ? ' disabled' : ''}><i data-lucide="search"></i>시트 조회</button>
          </div>
        </div>
        ${sheetTable()}
        ${tndBox()}
        <div class="tool-grid setup-grid">
          ${textField('sheetUrl', '구글시트 URL (T&D)', { required: true, placeholder: 'https://docs.google.com/spreadsheets/d/…', wide: true })}
          ${textField('nasPath', 'NAS 소재 경로', { hint: '/앳홈_공유폴더/… 또는 \\\\192.168.1.100\\… · 슬래시 방향 무관', placeholder: '/앳홈_공유폴더/3. 마케팅팀/미닉스/…', wide: true })}
          ${textField('localPath', '로컬 소재 경로', { hint: '입력하면 NAS 대신 이 폴더를 씁니다', placeholder: 'C:\\Users\\…\\소재폴더', wide: true })}
        </div>
      </section>

      <section class="tool-card">
        <h3>광고세트</h3>
        <div class="tool-grid setup-grid">
          ${textField('campaignName', '캠페인명', { required: true, hint: '시트 조회 시 자동 입력', placeholder: '시트 조회 후 자동 입력 또는 직접 입력', wide: true })}
          ${textField('adsetName', '광고그룹명', { required: true, hint: '시트 조회 시 자동 입력', placeholder: '[always]30-49_interestTarget_officialWebsite_', wide: true })}
        </div>
        <div class="tool-grid setup-grid">
          <div class="setup-field">
            <span class="setup-req">예산</span>
            <div class="setup-budget">
              <select data-field="budgetType"><option value="daily"${state.budgetType === 'daily' ? ' selected' : ''}>일예산</option><option value="lifetime"${state.budgetType === 'lifetime' ? ' selected' : ''}>총예산</option></select>
              <input type="text" data-field="budget" inputmode="numeric" value="${escapeHtml(state.budget)}" placeholder="1,000,000">
              <em>원</em>
            </div>
            <small class="setup-kor">${escapeHtml(budgetKorean())}</small>
          </div>
          <label>목적<small class="setup-hint">캠페인 최적화 기준</small>
            <select data-field="objective">${OBJECTIVES.map((value) => `<option${value === state.objective ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select>
          </label>
          <label>행동 유도 버튼
            <select data-field="cta">${CTAS.map(([value, label]) => `<option value="${value}"${value === state.cta ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select>
          </label>
        </div>
        <div class="tool-grid setup-grid">
          <label><span class="setup-req">시작일시</span><input type="datetime-local" data-field="startAt" value="${escapeHtml(state.startAt)}"></label>
          <label>종료일시<small class="setup-hint">비우면 계속 게재 · 총예산이면 필수</small><input type="datetime-local" data-field="endAt" value="${escapeHtml(state.endAt)}"></label>
        </div>
        <div class="tool-grid setup-grid">
          <label>타겟 성별<select data-field="gender">${GENDERS.map((value) => `<option${value === state.gender ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>
          <label>최소 연령<input type="number" data-field="ageMin" min="13" max="65" value="${escapeHtml(state.ageMin)}"></label>
          <label>최대 연령<input type="number" data-field="ageMax" min="13" max="65" value="${escapeHtml(state.ageMax)}"></label>
        </div>
      </section>

      <section class="tool-card">
        <h3>실행 스크립트</h3>
        <div class="tool-grid setup-grid">
          ${textField('envDir', '.env 폴더', { hint: '토큰·NAS 정보가 든 공유 폴더. 비우면 .ps1 이 있는 폴더부터 위로 찾습니다', placeholder: 'C:\\Users\\…\\공유_NAS수정판', wide: true })}
        </div>
        <div class="setup-run">
          <button type="button" class="tool-add setup-make"><i data-lucide="file-cog"></i>실행 스크립트 만들기</button>
          <small>브라우저는 NAS 와 PowerShell 에 닿지 못해서, 원본과 같은 일을 하는 .ps1 을 만들어 드립니다.</small>
        </div>
        ${scriptBox()}
      </section>

      <section class="tool-card">
        <div class="tool-list-head">
          <h3>만든 캠페인 <small>${history.length}건</small></h3>
          <div class="tool-list-actions"><button type="button" class="tool-clear setup-hist-clear"${history.length ? '' : ' disabled'}>기록 비우기</button></div>
        </div>
        ${history.length
          ? `<ul class="setup-hist">${history.map((entry) => `<li><b>${escapeHtml(entry.name)}</b><small>${escapeHtml(entry.acct || '')}${entry.acct ? ' · ' : ''}${escapeHtml(entry.at)}</small></li>`).join('')}</ul>`
          : '<p class="tool-empty">아직 만든 스크립트가 없습니다.</p>'}
      </section>

      <div class="tool-footer">
        <button type="button" class="tool-reset setup-reset"><i data-lucide="rotate-ccw"></i>입력값 비우기</button>
        <small>시트 URL · 소재 경로 · .env 폴더는 남겨둡니다. 나머지 입력값만 되돌립니다.</small>
      </div>`;
    lucide.createIcons();
  };

  // 텍스트 칸은 다시 그리지 않는다 (입력 중 커서가 튀지 않도록)
  adSetup.addEventListener('input', (event) => {
    const field = event.target.closest('[data-field]');
    if (!field || field.tagName === 'SELECT' || field.type === 'datetime-local') return;
    if (field.dataset.field === 'budget') {
      const raw = digitsOf(field.value);
      field.value = raw ? commaNum(parseInt(raw, 10)) : '';
      state.budget = field.value;
      const kor = adSetup.querySelector('.setup-kor');
      if (kor) kor.textContent = budgetKorean();
    } else {
      state[field.dataset.field] = field.value;
    }
    save();
    markStale();
  });

  adSetup.addEventListener('change', (event) => {
    const field = event.target.closest('[data-field]');
    if (!field || (field.tagName !== 'SELECT' && field.type !== 'datetime-local')) return;
    state[field.dataset.field] = field.value;
    save();
    if (script) script.stale = true;
    render();
  });

  adSetup.addEventListener('click', (event) => {
    const acct = event.target.closest('[data-acct]');
    const purpose = event.target.closest('[data-purpose]');
    const urlType = event.target.closest('[data-urltype]');
    const row = event.target.closest('[data-row]');

    if (acct || purpose || urlType || row) {
      if (acct) state.acct = acct.dataset.acct;
      if (purpose) state.purpose = state.purpose === purpose.dataset.purpose ? '' : purpose.dataset.purpose;
      if (urlType) state.urlType = urlType.dataset.urltype;
      if (row) return selectRow(Number(row.dataset.row));
      save();
      if (script) script.stale = true;
      return render();
    }

    if (event.target.closest('.setup-lookup')) return lookupSheet();
    if (event.target.closest('.setup-make')) return makeScript();
    if (event.target.closest('.setup-download')) return download();
    if (event.target.closest('.setup-copy-cmd')) return copyText(runCommand(), event.target.closest('.setup-copy-cmd'));
    if (event.target.closest('.setup-copy-script')) return copyText(script?.text || '', event.target.closest('.setup-copy-script'));
    if (event.target.closest('.setup-toggle-script')) { scriptOpen = !scriptOpen; return render(); }

    if (event.target.closest('.setup-hist-clear')) {
      if (!window.confirm(`기록 ${history.length}건을 지울까요?`)) return;
      history = [];
      saveHistory();
      return render();
    }

    if (event.target.closest('.setup-reset')) {
      if (!window.confirm('입력값을 비울까요? (시트 URL · 소재 경로 · .env 폴더는 남습니다)')) return;
      const keep = { sheetUrl: state.sheetUrl, nasPath: state.nasPath, localPath: state.localPath, promo: state.promo, envDir: state.envDir };
      state = { ...DEFAULT_STATE, ...keep, startAt: todayAtMidnight() };
      rows = [];
      selectedIdx = -1;
      lookup = { state: 'idle', message: '' };
      tnd = null;
      script = null;
      attempted = false;
      save();
      return render();
    }
  });

  adSetup.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.dataset.field === 'promo') {
      event.preventDefault();
      lookupSheet();
    }
  });

  render();
}

// ── 광고자동 세팅 · UTM 빌더 ────────────────────────────────────────
// 파일명 적재 시트(Code.gs)가 자동으로 붙이는 UTM 을, 시트를 거치지 않고 손으로 만드는 화면.
// 규칙과 대응표는 시트의 `설정` 탭 기본값과 같다. 시트에서 대응표를 고쳤다면 여기도 맞춰야 한다.
const utmBuilder = document.querySelector('#utm-builder');
if (utmBuilder) {
  const STORAGE_KEY = 'minix-utm-builder-v1';
  const FILENAME_KEY = 'minix-filename-tool-v3';

  // 담당자 이니셜. 목록에 없으면 직접 적어도 된다.
  const OWNERS = ['ohy', 'ljm', 'lhj', 'khb', 'cyj'];

  // 적재시트의 파트 탭. 고른 파트의 탭으로 들어간다.
  const PARTS = ['세일즈마케팅', '더플렌더_파트', '생활가전_파트'];

  // 매체 → utm_source · utm_medium (utm_medium 에는 지면을 적는다)
  const MEDIA = [
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
    ['마케팅팀', '', ''],
  ];
  const PURPOSES = [
    ['구매', 'purchase'], ['트래픽', 'traffic'], ['참여', 'participation'], ['잠재고객', 'prospect'],
    ['브랜딩', 'branding'], ['도달', 'reach'], ['가입', 'sign-up'], ['메시지', 'message'],
    ['친구추가', 'friend'], ['재생', 'view'],
  ];
  // 광고그룹명을 만들려면 행사채널이 필요하다. (파일명 화면과 같은 목록)
  const CHANNELS = ['네이버', '오늘의집', '카카오', 'CJ', 'G마켓', '29CM', '컬리', '이마트', '11번가',
    '하이마트', '전자랜드', '현대홈쇼핑', '롯데홈쇼핑', '롯데', '쿠팡', '자사몰', '공구', '오프라인', '이벤트', 'KOL 라이브'];
  const PRODUCTS = [
    ['더플렌더', 'flender'], ['더플렌더mini', 'flender-mini'], ['더플렌더PLUS', 'flender-plus'],
    ['더플렌더MAX', 'flender-max'], ['더슬림', 'theslim'], ['더시프트', 'theshift'],
    ['더에어드라이', 'theairdry'], ['식기세척기', 'dishwasher'], ['건조기', 'dryer'],
    ['건조기필터', 'dryerfilter'], ['건조기시트', 'dryersheets'], ['하드필터', 'hardfilter'],
    ['하드락필터', 'hardfilter-rock'], ['푸드컨테이너', 'foodcontainer'], ['식기세제', 'dishdetergent'],
    ['악세사리', 'accessories'],
  ];

  // 메타 광고 세팅과 같은 4가지. 고른 것이 목록 · 복사에 쓰인다.
  const URL_TYPES = [['url', 'URL'], ['linkGA', 'LINK(자사몰)'], ['nt', 'NT(네이버)'], ['fm', 'FM(라이브)']];

  // 시트가 이 라벨을 보고 자기 열에 넣는다. 열 차례는 시트가 알아서 맞춘다.
  const SHEET_COLUMNS = [
    { key: 'filename', label: '파일명' },
    { key: 'media', label: '매체' },
    { key: 'eventDate', label: '행사일자' },
    { key: 'product', label: '상품명' },
    { key: 'channel', label: '행사채널' },
    { key: 'event', label: '행사명' },
    { key: 'owner', label: '담당자' },
    { key: 'url', label: '랜딩링크' },
    { key: 'purposeCode', label: '목적' },
  ];

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const newId = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `u-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const tr = (value) => String(value ?? '').trim();

  const defaults = { part: PARTS[0], date: '', product: '', channel: '', event: '', owner: '', media: '', purpose: '', filenames: '', url: '', urlType: 'linkGA' };
  let state = { ...defaults };
  let entries = [];
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      state = { ...defaults, ...(saved.state || {}) };
      entries = Array.isArray(saved.entries) ? saved.entries : [];
    }
  } catch { /* 저장값이 깨졌으면 기본값으로 시작한다 */ }
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, entries }));

  // 광고소재 파일명 화면에서 발번한 목록 (세로형은 뺀다)
  const issuedFilenames = () => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(FILENAME_KEY) || 'null'); } catch { saved = null; }
    return (saved?.issued || []).filter((entry) => entry && !entry.vertical && entry.filename);
  };
  const issuedOf = (filename) => issuedFilenames().find((entry) => entry.filename === filename) || null;

  const VERTICAL_MARK = '(세로)';

  // 한 줄에 하나씩. 쉼표로 붙여 넣어도 받아 준다.
  const namesOf = (text) => {
    const seen = [];
    String(text || '').split(/[\n,]/).forEach((line) => {
      const name = tr(line);
      if (!name || name.indexOf(VERTICAL_MARK) >= 0 || seen.indexOf(name) >= 0) return;
      seen.push(name);
    });
    return seen;
  };

  // ── 시트와 같은 규칙 ──────────────────────────────────────────
  const codeOf = (filename) => (/^[A-Za-z0-9]+-\d+/.exec(tr(filename)) || [tr(filename)])[0];
  const stampOf = (date) => tr(date).replace(/-/g, '');
  const productCode = (name) => (PRODUCTS.find(([label]) => label === name) || [, tr(name)])[1];
  const purposeCode = (name) => (PURPOSES.find(([label]) => label === name) || [, tr(name)])[1];
  const mediaRow = (name) => MEDIA.find(([label]) => label === name) || [, '', ''];

  const head = (url) => (url ? url + (url.indexOf('?') >= 0 ? '&' : '?') : '?');
  const query = (pairs) => pairs.filter(([, value]) => value).map(([key, value]) => `${key}=${value}`).join('&');

  const build = (input) => {
    const [, source, medium] = mediaRow(input.media);
    const url = tr(input.url);
    const content = [stampOf(input.date), productCode(input.product), codeOf(input.filename), tr(input.owner)]
      .filter(Boolean).join('_');
    const campaign = purposeCode(input.purpose);
    const term = /sa/.test(medium) ? '{keyword}' : '';
    return {
      source,
      medium,
      campaign,
      content,
      term,
      linkGA: url && source
        ? head(url) + query([['utm_source', source], ['utm_medium', medium], ['utm_campaign', campaign], ['utm_content', content], ['utm_term', term]])
        : '',
      nt: source
        ? head(url) + query([['nt_source', [source, medium].filter(Boolean).join('_')], ['nt_medium', content]])
        : '',
      fm: source
        ? head(url) + query([['fm', source], ['sn', medium], ['ea', content]])
        : '',
    };
  };

  const urlTypeLabel = () => (URL_TYPES.find(([value]) => value === state.urlType) || [])[1] || 'URL';
  const urlOf = (entry, row) => (state.urlType === 'url' ? tr(entry.url) : row[state.urlType]);
  const pills = (attr, items, current) => `<div class="setup-pills">${items
    .map(([value, label]) => `<button type="button" class="setup-pill${value === current ? ' is-on' : ''}" data-${attr}="${escapeHtml(value)}">${escapeHtml(label)}</button>`)
    .join('')}</div>`;

  // 최종행사명 = YYMMDD_상품명_… (발번 때 만든 것이 있으면 그것을 그대로 쓴다)
  const finalNameOf = (filename) => {
    const found = issuedOf(filename);
    if (found?.campaign) return found.campaign;
    const stamp = stampOf(state.date).slice(2);
    return [stamp, state.product].filter(Boolean).join('_');
  };

  // ── 화면 ──────────────────────────────────────────────────────
  // 미리보기에는 실제로 쓰는 링크 3종만 둔다. (utm_* 낱개 값은 엑셀에는 그대로 들어간다)
  const PREVIEW_ROWS = [
    ['LINK(자사몰)', 'linkGA', '랜딩링크를 채우면 만들어집니다'],
    ['NT(네이버)', 'nt', '네이버스토어 링크 뒤에 붙입니다'],
    ['FM(라이브)', 'fm', '쇼핑라이브 링크 뒤에 붙입니다'],
  ];

  const options = (list, picked) => list
    .map(([label]) => `<option${label === picked ? ' selected' : ''}>${escapeHtml(label)}</option>`).join('');

  const picked = () => namesOf(state.filenames);
  const ready = () => Boolean(picked().length && build(state).source);
  const pending = () => entries.filter((entry) => !entry.sent);

  const render = () => {
    const names = picked();
    const built = build({ ...state, filename: names[0] || '' });
    utmBuilder.innerHTML = `
      <div class="tool-head">
        <h2>UTM 빌더</h2>
        <p>파일명 적재 시트가 자동으로 붙이는 것과 <b>같은 규칙</b>으로 UTM 을 만듭니다.
          파일명은 <b>한 번에 여러 개</b> 넣을 수 있고, 만든 것은 엑셀로 받거나 시트에 적재합니다.</p>
      </div>

      <section class="tool-card">
        <div class="tool-grid">
          <label>파트<select data-field="part">${PARTS.map((value) => `<option${value === state.part ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>
          <label>매체<select data-field="media"><option value=""${state.media ? '' : ' selected'}>선택 안 함</option>${options(MEDIA, state.media)}</select></label>
          <label>목적<select data-field="purpose"><option value=""${state.purpose ? '' : ' selected'}>선택 안 함</option>${options(PURPOSES, state.purpose)}</select></label>
          <label>행사일자<input type="date" data-field="date" value="${escapeHtml(state.date)}"></label>
          <label>상품명<select data-field="product"><option value=""${state.product ? '' : ' selected'}>선택 안 함</option>${options(PRODUCTS, state.product)}</select></label>
          <label>행사채널<select data-field="channel"><option value=""${state.channel ? '' : ' selected'}>선택 안 함</option>${CHANNELS.map((value) => `<option${value === state.channel ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>
          <label>행사명<input type="text" data-field="event" value="${escapeHtml(state.event)}" placeholder="예: 음쓰해방위크"></label>
          <label>담당자 <small class="utm-hint">*이니셜 등록</small><input type="text" data-field="owner" list="utm-owner-list" value="${escapeHtml(state.owner)}" placeholder="예: ohy" autocomplete="off">
            <datalist id="utm-owner-list">${OWNERS.map((value) => `<option value="${escapeHtml(value)}"></option>`).join('')}</datalist></label>
          <label class="tool-wide">랜딩링크<input type="text" data-field="url" value="${escapeHtml(state.url)}" placeholder="https://minix.life/… (비우면 ? 로 시작하는 파라미터만 나옵니다)"></label>
          <div class="setup-field tool-wide"><span>URL 유형<small class="setup-hint">목록과 복사에 쓸 값</small></span>${pills('urltype', URL_TYPES, state.urlType)}</div>
          <label class="tool-wide">파일명 <small class="utm-hint">한 줄에 하나씩 · ${names.length}건</small><textarea data-field="filenames" rows="3" placeholder="benefit-537&#10;urgency-449">${escapeHtml(state.filenames)}</textarea></label>
        </div>
        <div class="tool-issue">
          <span>${names.length > 1
            ? `<b>${names.length}건</b>을 한 번에 만듭니다. 아래 미리보기는 <code>${escapeHtml(names[0])}</code> 기준이고 나머지는 파일명만 달라집니다.`
            : '광고소재 파일명 화면의 <b>파일명만 복사</b> 로 여러 개를 한 번에 붙여넣을 수 있습니다.'}</span>
          <button type="button" class="tool-add"${ready() ? '' : ' disabled'}><i data-lucide="plus"></i>목록에 추가${names.length > 1 ? ` (${names.length})` : ''}</button>
        </div>
      </section>

      <section class="tool-card">
        <h3>미리보기</h3>
        <div class="tool-table-wrap"><table class="tool-table">
          <tbody>${PREVIEW_ROWS.map(([label, key, hint]) => {
            const value = built[key];
            return `<tr${key === state.urlType ? ' class="is-picked"' : ''}>
              <td class="utm-key">${escapeHtml(label)}</td>
              <td class="tool-campaign">${value ? `<code>${escapeHtml(value)}</code>` : `<span class="tool-blank">${escapeHtml(hint || '-')}</span>`}</td>
              <td><div class="tool-row-actions">${value ? `<button type="button" class="tool-copy" data-copy="${escapeHtml(value)}"><i data-lucide="copy"></i>복사</button>` : ''}</div></td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      </section>

      <section class="tool-card">
        <div class="tool-list-head">
          <h3>UTM 일괄다운로드 <small>${entries.length}건</small></h3>
          <div class="tool-list-actions">
            <button type="button" class="utm-excel"${entries.length ? '' : ' disabled'}><i data-lucide="download"></i>엑셀 다운로드</button>
            <button type="button" class="tool-copy-all"${entries.length ? '' : ' disabled'}><i data-lucide="clipboard-list"></i>표로 복사</button>
            <button type="button" class="tool-clear"${entries.length ? '' : ' disabled'}>전체 비우기</button>
          </div>
        </div>
        ${entries.length ? `<div class="tool-table-wrap"><table class="tool-table">
          <thead><tr><th>파트</th><th>파일명</th><th>매체</th><th>목적</th><th>${escapeHtml(urlTypeLabel())}</th><th></th></tr></thead>
          <tbody>${entries.map((entry) => {
            const row = build(entry);
            const link = urlOf(entry, row);
            return `<tr data-id="${entry.id}">
              <td>${escapeHtml(entry.part || PARTS[0])}</td>
              <td><code>${escapeHtml(entry.filename)}</code></td>
              <td>${escapeHtml(entry.media) || '<span class="tool-blank">-</span>'}</td>
              <td>${escapeHtml(entry.purpose) || '<span class="tool-blank">-</span>'}</td>
              <td class="tool-campaign">${escapeHtml(link)}</td>
              <td><div class="tool-row-actions">
                ${entry.sent ? '<span class="tool-sent"><i data-lucide="check"></i>적재됨</span>' : ''}
                <button type="button" class="tool-copy" data-copy="${escapeHtml(link)}"><i data-lucide="copy"></i>복사</button>
                <button type="button" class="tool-remove" aria-label="삭제"><i data-lucide="x"></i></button>
              </div></td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>` : '<p class="tool-empty">아직 만든 UTM 이 없습니다.</p>'}
      </section>

      <div class="tool-footer">
        <button type="button" class="tool-reset"><i data-lucide="eraser"></i>전체 지우기</button>
        <button type="button" class="tool-submit"${(ready() || pending().length) ? '' : ' disabled'}><i data-lucide="upload"></i>최종완료${pending().length ? ` (${pending().length})` : ''}</button>
        <button type="button" class="tool-open-sheet" title="구글시트 새 탭으로 열기"><i data-lucide="external-link"></i>적재확인</button>
        <small>입력한 파일명을 목록에 담고, 아직 안 올린 것을 파일명 시트에 적재합니다. UTM 은 시트가 같은 규칙으로 다시 만듭니다.</small>
      </div>`;
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

  // 발번 목록에서 고른 파일명이면 그때 만든 행사 정보를 그대로 가져온다
  const adoptIssued = (filename) => {
    const found = issuedOf(filename);
    if (!found) return false;
    const parts = String(found.campaign || '').split('_');
    const stamp = /^\d{6}$/.test(parts[0] || '') ? parts[0] : '';
    if (stamp) state.date = `20${stamp.slice(0, 2)}-${stamp.slice(2, 4)}-${stamp.slice(4, 6)}`;
    if (parts[1] && PRODUCTS.some(([label]) => label === parts[1])) state.product = parts[1];
    if (found.media && MEDIA.some(([label]) => label === found.media)) state.media = found.media;
    if (found.channel) state.channel = found.channel;
    if (found.event) state.event = found.event;
    return true;
  };

  const addEntries = () => {
    if (!ready()) return 0;
    const made = picked().map((filename) => {
      const found = issuedOf(filename);
      return {
        id: newId(),
        filename,
        part: state.part || PARTS[0],
        media: state.media,
        purpose: state.purpose,
        date: state.date,
        product: state.product,
        channel: state.channel,
        event: state.event,
        owner: state.owner,
        url: state.url,
        campaign: finalNameOf(filename),
        type: found?.type || '',
        createdAt: new Date().toISOString(),
        sent: false,
      };
    });
    entries = [...made, ...entries];
    state.filenames = '';
    save();
    render();
    return made.length;
  };

  // 내려받는 것은 미리보기에 뜬 것 = 고른 URL 유형 하나. 유형을 바꾸면 내용도 바뀐다.
  const excelColumns = () => [
    ['파트', (entry) => entry.part || PARTS[0]],
    ['파일명', (entry) => entry.filename],
    ['매체', (entry) => entry.media],
    ['목적', (entry) => entry.purpose],
    ['행사일자', (entry) => entry.date],
    ['상품명', (entry) => entry.product],
    ['행사채널', (entry) => entry.channel || ''],
    ['행사명', (entry) => entry.event || ''],
    ['담당자', (entry) => entry.owner || ''],
    ['랜딩링크', (entry) => entry.url],
    [urlTypeLabel(), (entry, row) => urlOf(entry, row)],
    ['만든시각', (entry) => (entry.createdAt ? new Date(entry.createdAt).toLocaleString('ko-KR') : '')],
  ];

  // 엑셀이 바로 여는 CSV 로 내려받는다. (BOM 을 붙여야 한글이 깨지지 않는다)
  const downloadExcel = () => {
    if (!entries.length) return;
    const cell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const columns = excelColumns();
    const lines = [columns.map(([label]) => cell(label)).join(',')];
    entries.forEach((entry) => {
      const row = build(entry);
      lines.push(columns.map(([, pick]) => cell(pick(entry, row))).join(','));
    });
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const name = `utm-${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}.csv`;
    const blob = new Blob([`﻿${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  // 시트로 보낸다. UTM 값은 보내지 않는다 — 시트가 같은 규칙으로 다시 만든다.
  const rowFor = (entry) => ({
    filename: entry.filename,
    media: entry.media,
    eventDate: entry.date || '',
    product: entry.product || '',
    channel: entry.channel || '',
    event: entry.event || '',
    owner: entry.owner || '',
    url: entry.url || '',
    purposeCode: purposeCode(entry.purpose),
  });

  // 파트마다 탭이 달라 파트별로 나눠 보낸다. UTM 값은 시트가 다시 만든다.
  const sendToSheet = (button) => {
    const list = pending();
    if (!list.length) return;
    button.disabled = true;
    const groups = new Map();
    list.forEach((entry) => {
      const part = entry.part || PARTS[0];
      if (!groups.has(part)) groups.set(part, []);
      groups.get(part).push(entry);
    });
    const post = ([part, group]) => window.fetch(SHEET_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ sheet: part, columns: SHEET_COLUMNS, rows: group.map(rowFor) }),
    }).then((response) => (response.ok
      ? response.json().catch(() => ({ ok: true }))
      : Promise.reject(new Error('HTTP ' + response.status))));

    Promise.all([...groups.entries()].map(post))
      .then(() => {
        const ids = new Set(list.map((entry) => entry.id));
        entries = entries.map((entry) => (ids.has(entry.id) ? { ...entry, sent: true } : entry));
        save();
        render();
      })
      .catch((error) => {
        button.disabled = false;
        window.alert(['시트 적재에 실패했습니다.', error.message, '',
          '잠시 뒤 다시 시도하고, 계속 실패하면 [엑셀 다운로드] 로 받아 붙여넣어 주세요.'].join('\n'));
      });
  };

  // 텍스트 칸은 input 에서만 반영한다. change 로 다시 그리면 blur 직후의 클릭이 삼켜진다.
  utmBuilder.addEventListener('input', (event) => {
    const field = event.target.closest('[data-field]');
    if (!field || field.tagName === 'SELECT' || field.type === 'date') return;
    state[field.dataset.field] = field.value;
    save();
    // 처음 적은 파일명이 발번 목록에 있고 매체가 비어 있으면 그때 정보를 가져온다
    if (field.dataset.field === 'filenames' && !state.media && adoptIssued(picked()[0] || '')) {
      save();
      render();
      return;
    }
    // 미리보기와 버튼만 갱신해 입력 중 포커스를 잃지 않게 한다
    const names = picked();
    const built = build({ ...state, filename: names[0] || '' });
    utmBuilder.querySelectorAll('.tool-table .utm-key').forEach((keyCell) => {
      const row = PREVIEW_ROWS.find(([label]) => label === keyCell.textContent);
      if (!row) return;
      const value = built[row[1]];
      const target = keyCell.nextElementSibling;
      const action = target.nextElementSibling.querySelector('.tool-row-actions');
      target.innerHTML = value ? `<code>${escapeHtml(value)}</code>` : `<span class="tool-blank">${escapeHtml(row[2] || '-')}</span>`;
      action.innerHTML = value ? `<button type="button" class="tool-copy" data-copy="${escapeHtml(value)}"><i data-lucide="copy"></i>복사</button>` : '';
    });
    const add = utmBuilder.querySelector('.tool-add');
    if (add) add.disabled = !ready();
    const hint = utmBuilder.querySelector('.utm-hint');
    if (hint) hint.textContent = `한 줄에 하나씩 · ${names.length}건`;
    lucide.createIcons();
  });

  utmBuilder.addEventListener('change', (event) => {
    const field = event.target.closest('[data-field]');
    if (!field || (field.tagName !== 'SELECT' && field.type !== 'date')) return;
    state[field.dataset.field] = field.value;
    save();
    render();
  });

  utmBuilder.addEventListener('click', (event) => {
    const copy = event.target.closest('.tool-copy');
    if (copy) return copyText(copy.dataset.copy, copy);

    const urlType = event.target.closest('[data-urltype]');
    if (urlType) {
      state.urlType = urlType.dataset.urltype;
      save();
      return render();
    }

    if (event.target.closest('.tool-add')) return addEntries();
    if (event.target.closest('.utm-excel')) return downloadExcel();

    if (event.target.closest('.tool-open-sheet')) {
      window.open(SHEET_URL, '_blank', 'noopener');
      return;
    }

    const submit = event.target.closest('.tool-submit');
    if (submit) {
      addEntries();
      const button = utmBuilder.querySelector('.tool-submit');
      if (pending().length) sendToSheet(button);
      return;
    }

    if (event.target.closest('.tool-copy-all')) {
      const header = excelColumns().map(([label]) => label).join('\t');
      const body = entries.map((entry) => {
        const row = build(entry);
        return excelColumns().map(([, pick]) => pick(entry, row)).join('\t');
      });
      return copyText([header, ...body].join('\n'), event.target.closest('.tool-copy-all'));
    }

    if (event.target.closest('.tool-reset')) {
      if (entries.length && !window.confirm(`입력값과 만든 UTM ${entries.length}건을 모두 지울까요?`)) return;
      state = { ...defaults };
      entries = [];
      save();
      return render();
    }

    if (event.target.closest('.tool-clear')) {
      if (!window.confirm(`만든 UTM ${entries.length}건을 모두 지울까요?`)) return;
      entries = [];
      save();
      return render();
    }

    const remove = event.target.closest('.tool-remove');
    if (remove) {
      const id = remove.closest('tr').dataset.id;
      entries = entries.filter((entry) => entry.id !== id);
      save();
      render();
    }
  });

  render();
}

// ── 마케팅팀 · 퍼포먼스일정 ─────────────────────────────────────────
// 노션 "[전 SKU] 퍼포 스케줄표" 의 캘린더 보기를 그대로 옮겼다.
// 속성 · 옵션 · 색상은 공개 링크의 내부 API 로 읽은 스키마 그대로이고,
// 카드 편집은 광고소재 기획 보드와 같은 사이드 피크를 쓴다.
const brandSchedule = document.querySelector('#brand-schedule');
if (brandSchedule) {
  const STORAGE_KEY = 'minix-brand-schedule-v1';

  const SKU_OPTIONS = [
    ['더플렌더 mini', 'yellow'], ['더플렌더 MAX', 'orange'], ['더플렌더 PRO', 'blue'],
    ['에어드라이', 'purple'], ['더시프트', 'green'],
  ];
  const CHANNEL_OPTIONS = [
    ['오늘의집', 'blue'], ['CJ', 'purple'], ['네이버', 'green'], ['자사몰', 'gray'], ['오프라인', 'orange'],
    ['마켓컬리', 'pink'], ['카톡딜', 'yellow'], ['11번가', 'red'], ['29cm', 'default'], ['쿠팡', 'brown'],
    ['지마켓', 'green'], ['상시', 'blue'], ['토스', 'blue'], ['롯데홈쇼핑', 'orange'], ['현대 홈쇼핑', 'purple'],
    ['컬리', 'red'], ['공구', 'default'], ['하이마트', 'default'],
  ];
  const MEDIA_OPTIONS = [['브검', 'orange'], ['페이드', 'purple'], ['CRM', 'blue']];

  const SCHEMA = [
    { key: 'name', name: '이름', type: 'title', icon: 'type' },
    { key: 'sku', name: 'SKU', type: 'multi_select', icon: 'tag', options: SKU_OPTIONS },
    { key: 'date', name: '날짜', type: 'date', icon: 'calendar' },
    { key: 'media', name: '매체', type: 'multi_select', icon: 'list', options: MEDIA_OPTIONS },
    { key: 'channel', name: '판매채널', type: 'multi_select', icon: 'store', options: CHANNEL_OPTIONS },
    { key: 'done', name: '세팅완료', type: 'checkbox', icon: 'square-check-big' },
  ];
  const propByKey = Object.fromEntries(SCHEMA.map((prop) => [prop.key, prop]));
  const colorOf = (prop, value) => (prop.options || []).find(([option]) => option === value)?.[1] || 'default';

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const newId = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `c-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const listOf = (value) => (Array.isArray(value) ? value : String(value || '').split(',')).map((item) => String(item).trim()).filter(Boolean);

  const normalize = (row = {}) => ({
    id: row.id || newId(),
    name: row.name || '',
    sku: listOf(row.sku),
    channel: listOf(row.channel),
    media: listOf(row.media),
    done: Boolean(row.done),
    date: row.date?.start ? { start: row.date.start, end: row.date.end || '' } : null,
  });

  // 노션에서 옮겨 온 26년 9월 일정. [이름, 시작, 종료, SKU, 판매채널, 매체, 세팅완료]
  const SEED = [
    ['[당일/사후] CJ온스타일 - 브티나는생활 MLC', '2026-09-02', '2026-09-04', '더플렌더 MAX,더플렌더 mini', 'CJ', '브검,페이드', 0],
    ['[상시] 하이마트 런칭', '2026-09-06', '2026-09-08', '더플렌더 mini', '하이마트', '페이드', 0],
    ['[당일] 오늘의집 라이브', '2026-09-09', '', '더플렌더 mini,더시프트', '', '브검,페이드', 0],
    ['[당일/상시] 카카오 - 톡딜위크', '2026-09-10', '2026-09-11', '더플렌더 mini,더시프트,에어드라이', '카톡딜', '브검,페이드', 0],
    ['[사전] 찰스엔터 KOL 라이브', '2026-09-12', '2026-09-15', '더플렌더 mini', '네이버', '브검,페이드', 0],
    ['[당일] 찰스엔터 KOL 라이브', '2026-09-16', '', '더플렌더 mini', '', '브검,페이드,CRM', 0],
    ['[사후] 찰스엔터 KOL 라이브', '2026-09-17', '2026-09-18', '더플렌더 mini', '네이버', '브검,페이드', 0],
    ['[당일] G마켓 - 한가위 빅세일 라이브', '2026-09-19', '2026-09-21', '더플렌더 mini,에어드라이', '지마켓', '브검,페이드', 0],
    ['[당일] 네이버 - 브랜드데이', '2026-09-27', '', '더플렌더 mini,에어드라이,더시프트', '', '브검,페이드,CRM', 0],
  ];
  const fromSeed = ([name, start, end, sku, channel, media, done]) => normalize({
    name, sku, channel, media, done, date: { start, end },
  });

  let rows;
  let seeded = false;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(saved)) rows = saved.map(normalize);
    else { rows = SEED.map(fromSeed); seeded = true; }
  } catch {
    rows = SEED.map(fromSeed);
    seeded = true;
  }
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  // 처음 한 번만 넣는다. 지운 일정이 새로고침 때 되살아나지 않게.
  if (seeded) save();

  // ── 날짜 ──────────────────────────────────────────────────────
  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const dayOf = (value) => new Date(`${value}T00:00:00`);
  const addDays = (date, count) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
  const formatDay = (value) => {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return `${year}년 ${Number(month)}월 ${Number(day)}일 (${WEEKDAYS[dayOf(value).getDay()]})`;
  };
  const formatDate = (date) => {
    if (!date?.start) return '';
    return date.end ? `${formatDay(date.start)} → ${formatDay(date.end)}` : formatDay(date.start);
  };
  const endOf = (row) => row.date?.end || row.date?.start || '';

  const today = iso(new Date());
  // 이번 달에 일정이 없으면 가장 가까운 달로 연다
  const firstMonth = () => {
    const now = today.slice(0, 7);
    const months = rows.filter((row) => row.date?.start).map((row) => row.date.start.slice(0, 7)).sort();
    if (!months.length || months.includes(now)) return now;
    return months.find((month) => month >= now) || months[months.length - 1];
  };
  let cursor = firstMonth();                // 보고 있는 달 (YYYY-MM)
  let openId = null;

  const FACETS = [
    { key: 'media', label: '매체', icon: 'list', options: MEDIA_OPTIONS },
    { key: 'sku', label: 'SKU', icon: 'tag', options: SKU_OPTIONS },
  ];
  const active = { media: [], sku: [] };
  const anyFilter = () => FACETS.some((facet) => active[facet.key].length > 0);
  // 같은 줄은 OR, 줄 사이는 AND (광고소재 기획과 같은 규칙)
  const visibleRows = () => (anyFilter()
    ? rows.filter((row) => FACETS.every((facet) => !active[facet.key].length
      || row[facet.key].some((value) => active[facet.key].includes(value))))
    : rows);

  const chip = (prop, value) => `<span class="chip chip-${colorOf(prop, value)}">${escapeHtml(value)}</span>`;

  const renderFilters = () => `<div class="board-filters">
    ${FACETS.map((facet) => `<div class="filter-row${active[facet.key].length ? ' is-active' : ''}">
      <span class="filter-label"><i data-lucide="${facet.icon}"></i>${escapeHtml(facet.label)}</span>
      <span class="filter-options">${facet.options.map(([name, color]) => `<button type="button" class="filter-chip chip chip-${color}${active[facet.key].includes(name) ? ' is-on' : ''}" data-facet="${facet.key}" data-value="${escapeHtml(name)}" aria-pressed="${active[facet.key].includes(name)}">${escapeHtml(name)}</button>`).join('')}</span>
    </div>`).join('')}
    ${anyFilter() ? `<div class="filter-summary"><button type="button" class="filter-clear">전체 보기</button><span class="filter-count">${visibleRows().length}개 표시</span></div>` : ''}
  </div>`;
  const barColor = (row) => (row.media.length ? colorOf(propByKey.media, row.media[0]) : 'gray');

  // ── 달력 ──────────────────────────────────────────────────────
  // 한 주 안에서 겹치지 않게 줄(lane)을 나눠 막대를 놓는다.
  const weekSegments = (weekStart, list) => {
    const weekEnd = addDays(weekStart, 6);
    const segments = list
      .filter((row) => row.date?.start)
      .map((row) => ({ row, from: dayOf(row.date.start), to: dayOf(endOf(row)) }))
      .filter((item) => item.to >= weekStart && item.from <= weekEnd)
      .map((item) => ({
        row: item.row,
        start: Math.max(0, Math.round((item.from - weekStart) / 86400000)),
        end: Math.min(6, Math.round((item.to - weekStart) / 86400000)),
        opens: item.from >= weekStart,
        closes: item.to <= weekEnd,
      }))
      .sort((a, b) => (a.start - b.start) || ((b.end - b.start) - (a.end - a.start)));

    const lanes = [];
    segments.forEach((segment) => {
      let lane = lanes.findIndex((taken) => taken <= segment.start);
      if (lane < 0) { lanes.push(0); lane = lanes.length - 1; }
      lanes[lane] = segment.end + 1;
      segment.lane = lane;
    });
    return { segments, lanes: Math.max(lanes.length, 1) };
  };

  const monthLabel = () => {
    const [year, month] = cursor.split('-');
    return `${year}년 ${Number(month)}월`;
  };

  // 일정이 있는 해 · 지금 보는 해를 넉넉히 감싸는 범위
  const yearOptions = () => {
    const years = rows.filter((row) => row.date?.start).map((row) => Number(row.date.start.slice(0, 4)));
    years.push(Number(today.slice(0, 4)), Number(cursor.slice(0, 4)));
    const list = [];
    for (let year = Math.min(...years) - 1; year <= Math.max(...years) + 1; year += 1) list.push(year);
    return list;
  };

  // 노션 캘린더 보기와 같은 모양으로 그린다. (실제 화면 대조)
  //   · 날짜 숫자는 칸 오른쪽 위, 1일에는 "9월 1일", 오늘은 빨간 원
  //   · 일정은 흰 카드 + 얇은 테두리, 안에 보이는 속성(SKU · 날짜 · 매체 · 세팅완료)을 그대로
  //   · 칸 배경은 아래 층(cal-cells), 숫자와 카드는 위 층(cal-content)
  const longDay = (value) => {
    const [year, month, day] = value.split('-');
    return `${year}년 ${Number(month)}월 ${Number(day)}일`;
  };
  const cardDate = (row) => (row.date?.end
    ? `${longDay(row.date.start)} → ${longDay(row.date.end)}`
    : longDay(row.date.start));

  const renderCalendar = () => {
    const list = visibleRows();
    const [year, month] = cursor.split('-').map(Number);
    const first = new Date(year, month - 1, 1);
    const gridStart = addDays(first, -first.getDay());
    const last = new Date(year, month, 0);
    const weekCount = Math.ceil((last.getDate() + first.getDay()) / 7);

    const weeks = [];
    for (let w = 0; w < weekCount; w += 1) {
      const weekStart = addDays(gridStart, w * 7);
      const { segments } = weekSegments(weekStart, list);
      const cells = [];
      const heads = [];
      for (let d = 0; d < 7; d += 1) {
        const date = addDays(weekStart, d);
        const value = iso(date);
        const outside = date.getMonth() !== month - 1;
        cells.push(`<div class="cal-cell" data-day="${value}"></div>`);
        // 1일에는 노션처럼 "9월 1일" 로 적는다
        const label = date.getDate() === 1 ? `${date.getMonth() + 1}월 1일` : String(date.getDate());
        heads.push(`<span class="cal-head-cell" data-day="${value}" style="grid-column:${d + 1};grid-row:1">
          <button type="button" class="cal-add" data-day="${value}" aria-label="일정 추가"><i data-lucide="plus"></i></button>
          <span class="cal-num${outside ? ' is-out' : ''}${value === today ? ' is-today' : ''}">${escapeHtml(label)}</span>
        </span>`);
      }
      weeks.push(`<div class="cal-week" data-start="${iso(weekStart)}">
        <div class="cal-cells">${cells.join('')}</div>
        <div class="cal-content">
          ${heads.join('')}
          ${segments.map((segment) => {
            const row = segment.row;
            return `<button type="button" class="cal-card${segment.opens ? ' is-start' : ''}${segment.closes ? ' is-end' : ''}${row.done ? ' is-done' : ''}"
              style="grid-column:${segment.start + 1}/span ${segment.end - segment.start + 1};grid-row:${segment.lane + 2}"
              data-id="${row.id}">
              <span class="cal-card-title">${escapeHtml(row.name) || '제목 없음'}</span>
              ${row.sku.length ? `<span class="cal-card-line">${row.sku.map((name) => chip(propByKey.sku, name)).join('')}</span>` : ''}
              <span class="cal-card-line cal-card-date">${escapeHtml(cardDate(row))}</span>
              ${row.media.length ? `<span class="cal-card-line">${row.media.map((name) => chip(propByKey.media, name)).join('')}</span>` : ''}
              <span class="cal-card-line cal-card-check"><i class="cal-box"></i>세팅완료</span>
              ${segment.opens ? '<span class="cal-grab cal-grab-start" data-grab="start"></span>' : ''}
              ${segment.closes ? '<span class="cal-grab cal-grab-end" data-grab="end"></span>' : ''}
            </button>`;
          }).join('')}
        </div>
      </div>`);
    }

    return `
      <div class="cal-head">
        <div class="cal-pick">
          <select class="cal-year" data-jump="year" aria-label="년도">
            ${yearOptions().map((value) => `<option value="${value}"${String(value) === cursor.slice(0, 4) ? ' selected' : ''}>${value}년</option>`).join('')}
          </select>
          <select class="cal-month" data-jump="month" aria-label="월">
            ${Array.from({ length: 12 }, (unused, i) => i + 1).map((value) => `<option value="${value}"${value === Number(cursor.slice(5, 7)) ? ' selected' : ''}>${value}월</option>`).join('')}
          </select>
        </div>
      </div>
      ${renderFilters()}
      <div class="cal-grid">
        <div class="cal-weekdays">${WEEKDAYS.map((day) => `<span>${day}</span>`).join('')}</div>
        ${weeks.join('')}
      </div>`;
  };

  // ── 사이드 피크 (광고소재 기획과 같은 방식) ────────────────────
  const propertyControl = (row, prop) => {
    const value = row[prop.key];
    if (prop.type === 'title' || prop.type === 'text') {
      return `<input class="peek-input" data-edit="${prop.key}" value="${escapeHtml(value)}" placeholder="비어 있음">`;
    }
    if (prop.type === 'checkbox') {
      return `<button type="button" class="peek-check${value ? ' is-on' : ''}" data-check="${prop.key}">
        <i data-lucide="${value ? 'square-check-big' : 'square'}"></i>${value ? '완료' : '아직'}
      </button>`;
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

  const closePeek = () => { openId = null; peek.innerHTML = ''; peek.classList.remove('is-open'); };

  const renderPeek = () => {
    const row = rows.find((entry) => entry.id === openId);
    if (!row) return closePeek();
    peek.innerHTML = `
      <div class="peek-backdrop"></div>
      <aside class="peek-panel" role="dialog" aria-label="일정 상세">
        <header class="peek-head">
          <button type="button" class="peek-close" aria-label="닫기"><i data-lucide="x"></i></button>
          <button type="button" class="peek-delete"><i data-lucide="trash-2"></i>삭제</button>
        </header>
        <textarea class="peek-title" rows="1" data-edit="name" placeholder="제목 없음">${escapeHtml(row.name)}</textarea>
        <div class="peek-props">
          ${SCHEMA.filter((prop) => prop.key !== 'name').map((prop) => `
            <div class="peek-row">
              <span class="peek-label"><i data-lucide="${prop.icon}"></i>${escapeHtml(prop.name)}</span>
              <div class="peek-value">${propertyControl(row, prop)}</div>
            </div>`).join('')}
        </div>
        <footer class="peek-footer">
          <p class="peek-warning" hidden>제목을 입력해 주세요.</p>
          <button type="button" class="peek-done">완료</button>
        </footer>
      </aside>`;
    peek.classList.add('is-open');
    lucide.createIcons();
  };

  const openPeek = (id) => { openId = id; renderPeek(); peek.querySelector('.peek-title')?.focus(); };

  // ── 그리기 ────────────────────────────────────────────────────
  brandSchedule.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'board-header';
  head.innerHTML = `<div>
      <div class="eyebrow">마케팅팀</div>
      <h2>퍼포먼스일정</h2>
    </div>`;
  const view = document.createElement('div');
  view.className = 'cal-view';
  const peek = document.createElement('div');
  peek.className = 'peek';
  brandSchedule.appendChild(head);
  brandSchedule.appendChild(view);
  brandSchedule.appendChild(peek);

  const renderView = () => {
    view.innerHTML = renderCalendar();
    lucide.createIcons();
  };
  const commit = ({ redrawPeek = true } = {}) => {
    save();
    renderView();
    if (redrawPeek && openId) renderPeek();
  };

  const addRow = (start) => {
    const row = normalize({ date: { start: start || today } });
    rows.push(row);
    save();
    renderView();
    openPeek(row.id);
  };

  view.addEventListener('click', (event) => {
    const move = event.target.closest('[data-move]');
    if (move) {
      const [year, month] = cursor.split('-').map(Number);
      const next = new Date(year, month - 1 + Number(move.dataset.move), 1);
      cursor = `${next.getFullYear()}-${pad(next.getMonth() + 1)}`;
      return renderView();
    }
    if (event.target.closest('.cal-today')) {
      cursor = today.slice(0, 7);
      return renderView();
    }
    const chipButton = event.target.closest('.filter-chip');
    if (chipButton) {
      const key = chipButton.dataset.facet;
      const value = chipButton.dataset.value;
      active[key] = active[key].includes(value) ? active[key].filter((item) => item !== value) : [...active[key], value];
      return renderView();
    }
    if (event.target.closest('.filter-clear')) {
      FACETS.forEach((facet) => { active[facet.key] = []; });
      return renderView();
    }

    const add = event.target.closest('.cal-add');
    if (add) return addRow(add.dataset.day);
    const card = event.target.closest('.cal-card');
    if (card) return dragged ? undefined : openPeek(card.dataset.id);
    const cell = event.target.closest('.cal-cell') || event.target.closest('.cal-head-cell');
    if (cell) return addRow(cell.dataset.day);
  });

  // 카드를 끌어 옮기거나 끝을 잡아 늘려 일정을 조절한다. (노션 캘린더와 같은 조작)
  let drag = null;
  let dragged = false;

  const dayFromPoint = (x, y) => {
    const weeks = [...view.querySelectorAll('.cal-week')];
    if (!weeks.length) return null;
    let week = weeks.find((element) => {
      const box = element.getBoundingClientRect();
      return y >= box.top && y <= box.bottom;
    });
    if (!week) week = y < weeks[0].getBoundingClientRect().top ? weeks[0] : weeks[weeks.length - 1];
    const box = week.getBoundingClientRect();
    const column = Math.max(0, Math.min(6, Math.floor(((x - box.left) / box.width) * 7)));
    return iso(addDays(dayOf(week.dataset.start), column));
  };

  view.addEventListener('change', (event) => {
    const jump = event.target.closest('[data-jump]');
    if (!jump) return;
    const year = jump.dataset.jump === 'year' ? jump.value : cursor.slice(0, 4);
    const month = jump.dataset.jump === 'month' ? jump.value : cursor.slice(5, 7);
    cursor = `${year}-${pad(Number(month))}`;
    renderView();
  });

  view.addEventListener('mousedown', (event) => {
    // 새 누름이 시작되면 앞선 드래그 표시를 지운다. (타이머로 지우면 click 보다 먼저 지워질 수 있다)
    dragged = false;
    if (event.button !== 0) return;
    const card = event.target.closest('.cal-card');
    if (!card) return;
    const row = rows.find((entry) => entry.id === card.dataset.id);
    if (!row?.date?.start) return;
    const handle = event.target.closest('.cal-grab');
    drag = {
      id: row.id,
      mode: handle ? handle.dataset.grab : 'move',
      from: dayFromPoint(event.clientX, event.clientY),
      start: row.date.start,
      end: endOf(row),
    };
    dragged = false;
    document.body.classList.add(handle ? 'is-resizing' : 'is-dragging-card');
    event.preventDefault();
  });

  window.addEventListener('mousemove', (event) => {
    if (!drag) return;
    const row = rows.find((entry) => entry.id === drag.id);
    if (!row) { drag = null; return; }
    const at = dayFromPoint(event.clientX, event.clientY);
    if (!at) return;
    const shift = Math.round((dayOf(at) - dayOf(drag.from)) / 86400000);
    let start = drag.start;
    let end = drag.end;
    if (drag.mode === 'move') {
      start = iso(addDays(dayOf(drag.start), shift));
      end = iso(addDays(dayOf(drag.end), shift));
    } else if (drag.mode === 'start') {
      start = at > drag.end ? drag.end : at;
    } else {
      end = at < drag.start ? drag.start : at;
    }
    if (row.date.start === start && endOf(row) === end) return;
    row.date = { start, end: end > start ? end : '' };
    dragged = true;
    renderView();
  });

  window.addEventListener('mouseup', () => {
    document.body.classList.remove('is-dragging-card', 'is-resizing');
    if (!drag) return;
    drag = null;
    if (!dragged) return;
    save();
    renderView();
    if (openId) renderPeek();
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
      return renderView();
    }
    if (event.target.closest('.peek-done')) {
      if (!row.name.trim()) {
        peek.querySelector('.peek-warning').hidden = false;
        peek.querySelector('.peek-title').focus();
        return;
      }
      return closePeek();
    }
    const check = event.target.closest('[data-check]');
    if (check) {
      row[check.dataset.check] = !row[check.dataset.check];
      return commit();
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
      const picked = option.dataset.option;
      row[key] = row[key].includes(picked) ? row[key].filter((item) => item !== picked) : [...row[key], picked];
      commit();
      peek.querySelector(`[data-options="${key}"]`).hidden = false;
      return;
    }
    const range = event.target.closest('.peek-range');
    if (range) {
      const current = row.date || { start: today, end: '' };
      row.date = current.end ? { start: current.start, end: '' } : { start: current.start || today, end: current.start || today };
      return commit();
    }
    if (!event.target.closest('.peek-options')) peek.querySelectorAll('.peek-options').forEach((list) => { list.hidden = true; });
  });

  peek.addEventListener('input', (event) => {
    const field = event.target.closest('[data-edit]');
    if (!field || field.type === 'date') return;
    const row = rows.find((entry) => entry.id === openId);
    if (!row) return;
    row[field.dataset.edit] = field.value;
    commit({ redrawPeek: false });
  });

  peek.addEventListener('change', (event) => {
    const field = event.target.closest('[data-edit]');
    if (!field || field.type !== 'date') return;
    const row = rows.find((entry) => entry.id === openId);
    if (!row) return;
    const current = row.date || { start: '', end: '' };
    const next = { ...current, [field.dataset.part]: field.value };
    row.date = next.start ? { start: next.start, end: next.end && next.end >= next.start ? next.end : '' } : null;
    commit();
  });

  peek.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePeek();
  });

  renderView();
}

// ── 매체별 성과 (메타 광고 API) ──────────────────────────────────────
// 액세스 토큰은 Apps Script 쪽 스크립트 속성에 있다. 이 화면은 SHEET_ENDPOINT 에 물어보기만 한다.
// 숫자 정의: CPC · CTR 은 링크 클릭 기준, 결과는 구매 + 장바구니 + 리드, CPA 는 트래픽 목적을 뺀다.
const mediaPerformance = document.querySelector('#media-performance');
if (mediaPerformance) {
  const STORAGE_KEY = 'minix-media-performance-v1';

  // 매체마다 다른 것 · 기간 목록은 소재별 결과 화면과 함께 쓴다 (위쪽 PERF_* 참고)
  const SOURCES = PERF_SOURCES;
  const OBJECTIVES = PERF_OBJECTIVES;
  const PRESETS = PERF_PRESETS;

  const escapeHtml = perfEscape;
  const ymd = perfYmd;
  const daysAgo = perfDaysAgo;
  const rangeOf = perfRange;

  // 고른 계정은 매체마다 따로 기억한다. 탭을 오가도 각자 보던 계정으로 돌아온다.
  const defaults = { source: 'meta', accounts: {}, preset: '7d', since: '', until: '' };
  let state = { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      state = { ...defaults, ...saved, accounts: { ...(saved.accounts || {}) } };
      // 매체 탭이 없던 때의 저장값
      if (saved.account && !state.accounts.meta) state.accounts.meta = saved.account;
    }
  } catch { /* 저장값이 깨졌으면 기본값으로 시작한다 */ }
  if (!SOURCES[state.source]) state.source = 'meta';
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  const source = () => SOURCES[state.source];
  const account = () => state.accounts[state.source] || '';
  const setAccount = (id) => { state.accounts[state.source] = id; };

  let accounts = [];
  let report = null;
  let status = 'idle';   // idle · loading · ready · error
  let error = '';
  let opened = [];       // 펼쳐 둔 캠페인 id
  let listNote = '';    // 계정 목록을 못 받았을 때의 사유
  let query = '';        // 캠페인 · 광고그룹 이름 검색
  let picked = [];       // 고른 목적 · 유형 (여럿이면 OR)
  let withPaused = false; // 꺼진 캠페인도 표에 보이기
  let caret = null;      // 다시 그린 뒤 검색창에 커서를 돌려놓을 자리
  let loadedOnce = false;

  const currentRange = () => rangeOf(state.preset) || {
    since: state.since || ymd(daysAgo(7)),
    until: state.until || ymd(daysAgo(1)),
  };

  const ask = askSheet;

  // ── 숫자 ────────────────────────────────────────────────────────
  const currency = () => (report?.account?.currency) || 'KRW';
  const money = (value) => perfMoney(currency())(value);
  const count = perfCount;
  const percent = perfPercent;
  const ratio = perfRatio;
  const blank = (value, format) => (value === null ? '<span class="tool-blank">—</span>' : format(value));

  // CPA 에서 뺄 캠페인인가 (메타 = 트래픽 목적, 구글 = 동영상)
  const isTraffic = (row) => source().skip.indexOf(row.objective) >= 0;

  const totalsOf = (rows) => rows.reduce((sum, row) => ({
    spend: sum.spend + row.spend,
    impressions: sum.impressions + row.impressions,
    linkClicks: sum.linkClicks + row.linkClicks,
    clicks: sum.clicks + row.clicks,
    results: sum.results + row.results,
    purchase: sum.purchase + row.purchase,
    addToCart: sum.addToCart + row.addToCart,
    lead: sum.lead + row.lead,
  }), { spend: 0, impressions: 0, linkClicks: 0, clicks: 0, results: 0, purchase: 0, addToCart: 0, lead: 0 });

  // ── 화면 ────────────────────────────────────────────────────────
  const accountOptions = () => {
    if (!accounts.length) return `<option value="">${account() ? escapeHtml(account()) : '계정을 불러오는 중…'}</option>`;
    return accounts.map((item) => `<option value="${escapeHtml(item.id)}"${item.id === account() ? ' selected' : ''}>`
      + `${escapeHtml(item.name)} (${escapeHtml(item.accountId)})${item.disabled ? ' · 중지됨' : ''}</option>`).join('');
  };

  const controls = () => {
    const range = currentRange();
    const custom = state.preset === 'custom';
    return `<div class="perf-tabs">
      ${Object.keys(SOURCES).map((key) => `<button type="button" class="perf-tab${state.source === key ? ' is-on' : ''}"
        data-perf="source" data-source="${key}">${SOURCES[key].name}</button>`).join('')}
    </div>
    <div class="tool-card perf-controls">
      <div class="perf-fields">
        <label class="perf-account">광고 계정
          <select data-perf="account"${accounts.length ? '' : ' disabled'}>${accountOptions()}</select>
        </label>
        <label>기간
          <select data-perf="preset">${PRESETS.map(([key, name]) => `<option value="${key}"${state.preset === key ? ' selected' : ''}>${name}</option>`).join('')}</select>
        </label>
        ${custom ? `<label>시작<input type="date" data-perf="since" value="${escapeHtml(range.since)}"></label>
        <label>종료<input type="date" data-perf="until" value="${escapeHtml(range.until)}"></label>` : ''}
        <button type="button" class="tool-add" data-perf="reload"${status === 'loading' ? ' disabled' : ''}>
          <i data-lucide="refresh-cw"></i>${status === 'loading' ? '불러오는 중…' : source().name + ' 에서 새로 받기'}</button>
      </div>
      <p class="perf-note">
        <b>${escapeHtml(range.since)} ~ ${escapeHtml(range.until)}</b>
        ${report ? ` · ${escapeHtml(report.account.name)}${report.account.timezone ? ` · ${escapeHtml(report.account.timezone)}` : ''}` : ''}
        ${report?.fetchedAt ? ` · 갱신 ${new Date(report.fetchedAt).toLocaleString('ko-KR')}${report.cached ? ' (담아 둔 값)' : ''}` : ''}
      </p>
      ${listNote ? `<p class="perf-warn">계정 목록을 받지 못해 <b>기본 계정 ${source().fallback.length}개</b>로 채웠습니다. 성과 숫자는 그대로입니다.<small>${escapeHtml(listNote)}</small></p>` : ''}
    </div>`;
  };

  const statCard = (label, value, note) => `<div class="perf-stat">
    <small>${label}</small><strong>${value}</strong><em>${note}</em></div>`;

  const stats = () => {
    const rows = report.campaigns;
    const all = totalsOf(rows);
    const paid = totalsOf(rows.filter((row) => !isTraffic(row)));
    const trafficSpend = all.spend - paid.spend;
    return `<div class="perf-stats">
      ${statCard('총광고비', money(all.spend), `캠페인 ${count(rows.length)}개`)}
      ${statCard('총결과', count(all.results), `구매 ${count(all.purchase)} · 장바구니 ${count(all.addToCart)} · 리드 ${count(all.lead)}`)}
      ${statCard('CPC', blank(ratio(all.spend, all.linkClicks), money), `${source().clicks} ${count(all.linkClicks)}회`)}
      ${statCard('CTR', blank(ratio(all.linkClicks, all.impressions), percent), `${source().clicks} ÷ 노출`)}
      ${statCard('CPM', blank(ratio(all.spend * 1000, all.impressions), money), `노출 ${count(all.impressions)}회`)}
      ${statCard('CPA', blank(ratio(paid.spend, paid.results), money), trafficSpend > 0
        ? `${source().skipLabel} ${money(trafficSpend)} 제외`
        : `${source().skipLabel} 제외`)}
    </div>`;
  };

  const budgetText = (row) => {
    if (!row.budget) return '<span class="tool-blank">—</span>';
    return `${money(row.budget)}<small>${row.budgetKind === 'daily' ? '일' : '총'}</small>`;
  };

  const metricCells = (row) => `<td class="perf-num">${money(row.spend)}</td>
    <td class="perf-num">${count(row.impressions)}</td>
    <td class="perf-num">${count(row.linkClicks)}</td>
    <td class="perf-num">${blank(ratio(row.linkClicks, row.impressions), percent)}</td>
    <td class="perf-num">${blank(ratio(row.spend, row.linkClicks), money)}</td>
    <td class="perf-num">${blank(ratio(row.spend * 1000, row.impressions), money)}</td>
    <td class="perf-num">${count(row.results)}</td>
    <td class="perf-num">${isTraffic(row) ? `<span class="tool-blank">${source().skipLabel}</span>` : blank(ratio(row.spend, row.results), money)}</td>`;

  const hit = (name) => !query || String(name).toLowerCase().indexOf(query.toLowerCase()) >= 0;

  // 고를 수 있는 목적 · 유형 (표에 올라온 캠페인에서 뽑는다)
  const objectives = (rows) => {
    const seen = [];
    rows.forEach((row) => { if (row.objective && seen.indexOf(row.objective) < 0) seen.push(row.objective); });
    return seen.sort();
  };

  const filters = (rows, shown, all) => {
    const list = objectives(rows);
    return `<div class="perf-filter">
      <div class="perf-search">
        <i data-lucide="search"></i>
        <input type="search" data-perf="search" value="${escapeHtml(query)}"
          placeholder="캠페인 · 광고그룹 이름으로 검색" autocomplete="off">
        ${query ? '<button type="button" class="perf-clear" data-perf="clear" aria-label="지우기">×</button>' : ''}
      </div>
      ${list.length > 1 ? `<div class="perf-chips">
        ${list.map((key) => `<button type="button" class="perf-chip${picked.indexOf(key) >= 0 ? ' is-on' : ''}"
          data-perf="objective" data-objective="${escapeHtml(key)}">${OBJECTIVES[key] || escapeHtml(key)}</button>`).join('')}
      </div>` : ''}
      <label class="perf-check"><input type="checkbox" data-perf="paused"${withPaused ? ' checked' : ''}>꺼진 것도 보기</label>
      ${shown !== all ? `<span class="perf-count">${count(shown)} / ${count(all)}</span>` : ''}
    </div>`;
  };

  const delivery = () => {
    const liveAdsets = report.adsets.filter((row) => row.active || withPaused);
    const listed = report.campaigns.filter((row) => row.active || (withPaused && row.spend > 0));
    const resting = report.campaigns.filter((row) => !row.active && row.spend > 0);
    const restingSpend = totalsOf(resting).spend;

    // 이름은 캠페인 · 광고그룹 어느 쪽이 걸려도 그 캠페인을 남긴다
    const groupsOf = (campaign) => liveAdsets.filter((adset) => adset.campaignId === campaign.id);
    const live = listed.filter((campaign) => {
      if (picked.length && picked.indexOf(campaign.objective) < 0) return false;
      return hit(campaign.name) || groupsOf(campaign).some((adset) => hit(adset.name));
    });

    const rows = live.map((campaign) => {
      const all = groupsOf(campaign);
      // 캠페인 이름이 걸렸으면 광고그룹은 다 보여주고, 아니면 걸린 광고그룹만 보여준다
      const children = hit(campaign.name) ? all : all.filter((adset) => hit(adset.name));
      const isOpen = opened.indexOf(campaign.id) >= 0 || (Boolean(query) && !hit(campaign.name) && children.length > 0);
      const head = `<tr class="perf-row${isOpen ? ' is-open' : ''}" data-campaign="${escapeHtml(campaign.id)}">
        <td class="perf-name">
          <button type="button" class="perf-toggle"${children.length ? '' : ' disabled'}>
            <i data-lucide="${isOpen ? 'chevron-down' : 'chevron-right'}"></i></button>
          <span><b>${escapeHtml(campaign.name)}</b><small>${OBJECTIVES[campaign.objective] || escapeHtml(campaign.objective || '—')}
            · 광고그룹 ${count(all.length)}</small></span>
        </td>
        <td class="perf-num">${campaign.active ? budgetText(campaign) : '<span class="tool-blank">꺼짐</span>'}</td>
        ${metricCells(campaign)}
      </tr>`;
      if (!isOpen || !children.length) return head;
      return head + children.map((adset) => `<tr class="perf-child">
        <td class="perf-name"><span class="perf-branch"></span><span>${escapeHtml(adset.name)}</span></td>
        <td class="perf-num">${budgetText(adset)}</td>
        ${metricCells({ ...adset, objective: adset.objective || campaign.objective })}
      </tr>`).join('');
    }).join('');

    return `<div class="tool-card">
      <div class="tool-list-head">
        <h3>게재 <small>지금 켜져 있는 캠페인 ${count(listed.filter((row) => row.active).length)}개 · 광고그룹 ${count(report.adsets.filter((row) => row.active).length)}개</small></h3>
        <div class="tool-list-actions">
          <button type="button" class="tool-copy-all" data-perf="copy"${live.length ? '' : ' disabled'}>
            <i data-lucide="copy"></i>표 복사</button>
        </div>
      </div>
      ${filters(listed, live.length, listed.length)}
      ${live.length ? `<div class="tool-table-wrap"><table class="tool-table perf-table">
        <thead><tr><th>캠페인 · 광고그룹</th><th>예산</th><th>광고비</th><th>노출</th><th>${source().clicks}</th>
          <th>CTR</th><th>CPC</th><th>CPM</th><th>결과</th><th>CPA</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>` : `<p class="tool-empty">${query || picked.length ? '찾는 캠페인이 없습니다.' : '지금 켜져 있는 캠페인이 없습니다.'}</p>`}
      ${resting.length ? `<p class="perf-resting">이 기간에 돌았지만 지금 꺼져 있는 캠페인 ${count(resting.length)}개
        (${money(restingSpend)})도 위 요약에는 들어 있습니다.</p>` : ''}
    </div>`;
  };

  const guide = () => `<div class="tool-card perf-guide">
    <h3>메타 액세스 토큰을 넣어 주세요</h3>
    <p>토큰은 브라우저가 아니라 시트에 붙은 Apps Script 안에 둡니다. 화면에는 내려오지 않습니다.</p>
    <ol>
      <li><a href="${SHEET_URL}" target="_blank" rel="noopener">적재 시트</a> → 확장 프로그램 → Apps Script</li>
      <li>왼쪽 <b>프로젝트 설정</b> → 스크립트 속성 → 속성 추가</li>
      <li>이름 <code>META_ACCESS_TOKEN</code>, 값에 토큰을 넣고 저장</li>
      <li>배포 → <b>배포 관리</b> → 연필 → 버전 <b>새 버전</b> → 배포 (주소는 그대로입니다)</li>
    </ol>
  </div>`;

  const render = () => {
    const body = () => {
      if (status === 'loading' && !report) return '<div class="tool-card perf-loading">메타에서 불러오는 중…</div>';
      if (status === 'error') {
        return `<div class="tool-card perf-error"><b>불러오지 못했습니다.</b><p>${escapeHtml(error)}</p></div>`
          + (/META_ACCESS_TOKEN|토큰/.test(error) ? guide() : '');
      }
      if (!report) return '<div class="tool-card perf-loading">광고 계정을 고르면 성과를 불러옵니다.</div>';
      return stats() + delivery();
    };
    mediaPerformance.innerHTML = `<div class="tool-head">
        <h2>매체별 성과 <small>${source().name}</small></h2>
        <p>광고 계정을 고르면 메타 API 로 성과를 불러옵니다.
          ${source().note}</p>
      </div>${controls()}${body()}`;
    lucide.createIcons();
    if (caret !== null) {
      const search = mediaPerformance.querySelector('[data-perf="search"]');
      if (search) {
        search.focus();
        search.setSelectionRange(caret, caret);
      }
      caret = null;
    }
  };

  // ── 불러오기 ────────────────────────────────────────────────────
  const loadReport = (refresh) => {
    if (!account()) return;
    const range = currentRange();
    status = 'loading';
    render();
    ask({ action: `${state.source}Report`, account: account(), since: range.since, until: range.until, refresh: Boolean(refresh) })
      .then((body) => {
        report = body;
        status = 'ready';
        error = '';
        render();
      })
      .catch((reason) => {
        status = 'error';
        error = reason.message;
        render();
      });
  };

  const useAccounts = () => {
    if (!accounts.some((item) => item.id === account())) setAccount(accounts[0].id);
    save();
    loadReport(false);
  };

  const loadAccounts = () => {
    status = 'loading';
    render();
    ask({ action: `${state.source}Accounts` })
      .then((body) => {
        accounts = body.accounts || [];
        if (!accounts.length) throw new Error('토큰으로 볼 수 있는 광고 계정이 없습니다.');
        listNote = '';
        useAccounts();
      })
      .catch((reason) => {
        // 목록을 못 받아도 성과는 볼 수 있어야 한다. 아는 계정으로 채우고 그대로 이어 간다.
        accounts = source().fallback.map(([name, id]) => ({
          id, accountId: id.replace('act_', ''), name, currency: 'KRW', disabled: false,
        }));
        listNote = reason.message;
        useAccounts();
      });
  };

  // 검색은 input 에서 받는다 (change 를 기다리면 한 박자 늦다)
  mediaPerformance.addEventListener('input', (event) => {
    if (event.target.dataset.perf !== 'search') return;
    query = event.target.value;
    caret = event.target.selectionStart;
    render();
  });

  mediaPerformance.addEventListener('change', (event) => {
    const field = event.target.dataset.perf;
    if (!field) return;
    if (field === 'paused') { withPaused = event.target.checked; render(); return; }
    if (field === 'account') { setAccount(event.target.value); save(); loadReport(false); return; }
    if (field === 'preset') {
      state.preset = event.target.value;
      if (state.preset === 'custom') {
        const range = currentRange();
        state.since = state.since || range.since;
        state.until = state.until || range.until;
        save();
        render();
        return;
      }
      save();
      loadReport(false);
      return;
    }
    if (field === 'since' || field === 'until') {
      state[field] = event.target.value;
      save();
      if (state.since && state.until) loadReport(false);
    }
  });

  mediaPerformance.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-perf="source"]');
    if (tab) {
      if (tab.dataset.source === state.source) return;
      state.source = tab.dataset.source;
      save();
      accounts = [];
      report = null;
      opened = [];
      listNote = '';
      query = '';
      picked = [];
      loadAccounts();
      return;
    }
    if (event.target.closest('[data-perf="clear"]')) { query = ''; caret = 0; render(); return; }
    const chip = event.target.closest('[data-perf="objective"]');
    if (chip) {
      const key = chip.dataset.objective;
      picked = picked.indexOf(key) >= 0 ? picked.filter((entry) => entry !== key) : picked.concat(key);
      render();
      return;
    }
    if (event.target.closest('[data-perf="reload"]')) { loadReport(true); return; }
    if (event.target.closest('[data-perf="copy"]')) {
      const text = copyText();
      if (window.navigator.clipboard?.writeText) window.navigator.clipboard.writeText(text).catch(() => {});
      else window.prompt('복사하세요', text);
      const button = event.target.closest('[data-perf="copy"]');
      button.classList.add('is-copied');
      window.setTimeout(() => button.classList.remove('is-copied'), 1200);
      return;
    }
    const row = event.target.closest('[data-campaign]');
    if (!row) return;
    const id = row.dataset.campaign;
    opened = opened.indexOf(id) >= 0 ? opened.filter((entry) => entry !== id) : opened.concat(id);
    render();
  });

  // 엑셀 · 시트에 그대로 붙일 수 있게 탭으로 나눈다
  const copyText = () => {
    const head = ['캠페인', '광고그룹', '목적', '예산', '광고비', '노출', source().clicks, 'CTR', 'CPC', 'CPM', '결과', 'CPA'];
    const line = (campaign, adset) => {
      const row = adset || campaign;
      const cpa = isTraffic(row) ? '' : ratio(row.spend, row.results);
      return [
        campaign.name, adset ? adset.name : '', OBJECTIVES[campaign.objective] || campaign.objective || '',
        row.budget || '', Math.round(row.spend), row.impressions, row.linkClicks,
        ratio(row.linkClicks, row.impressions) === null ? '' : percent(ratio(row.linkClicks, row.impressions)),
        ratio(row.spend, row.linkClicks) === null ? '' : Math.round(ratio(row.spend, row.linkClicks)),
        ratio(row.spend * 1000, row.impressions) === null ? '' : Math.round(ratio(row.spend * 1000, row.impressions)),
        row.results, cpa === null || cpa === '' ? '' : Math.round(cpa),
      ].join('\t');
    };
    const lines = [head.join('\t')];
    report.campaigns.filter((row) => row.active).forEach((campaign) => {
      lines.push(line(campaign, null));
      report.adsets.filter((adset) => adset.active && adset.campaignId === campaign.id)
        .forEach((adset) => lines.push(line(campaign, adset)));
    });
    return lines.join('\n');
  };

  // 화면을 처음 열 때 한 번만 부른다 (메뉴에 들어오지 않으면 메타를 부르지 않는다)
  const openOnce = () => {
    if (loadedOnce || mediaPerformance.hidden) return;
    loadedOnce = true;
    loadAccounts();
  };
  new MutationObserver(openOnce).observe(mediaPerformance, { attributes: true, attributeFilter: ['hidden'] });
  render();
  openOnce();
}

// ── 소재별 결과 ────────────────────────────────────────────────────
// 캠페인 · 광고그룹을 고르면 그 안의 소재를 미리보기와 함께 광고비 순으로 보여 준다.
const creativePerformance = document.querySelector('#creative-performance');
if (creativePerformance) {
  const STORAGE_KEY = 'minix-creative-performance-v1';

  const defaults = { source: 'meta', accounts: {}, campaign: '', adset: '', preset: '7d', since: '', until: '' };
  let state = { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') state = { ...defaults, ...saved, accounts: { ...(saved.accounts || {}) } };
  } catch { /* 저장값이 깨졌으면 기본값으로 시작한다 */ }
  if (!PERF_SOURCES[state.source]) state.source = 'meta';
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  const source = () => PERF_SOURCES[state.source];
  const account = () => state.accounts[state.source] || '';
  const setAccount = (id) => { state.accounts[state.source] = id; };

  let accounts = [];
  let report = null;      // 캠페인 · 광고그룹 고르개를 채우는 데 쓴다
  let creatives = [];
  let currency = 'KRW';
  let status = 'idle';    // idle · loading · ready · error
  let error = '';
  let query = '';
  let caret = null;
  let fetchedAt = '';
  let cached = false;
  let loadedOnce = false;

  const money = (value) => perfMoney(currency)(value);
  const blank = (value, format) => (value === null ? '<span class="tool-blank">—</span>' : format(value));
  const currentRange = () => perfRange(state.preset) || {
    since: state.since || perfYmd(perfDaysAgo(7)),
    until: state.until || perfYmd(perfDaysAgo(1)),
  };

  const campaignsOf = () => (report ? report.campaigns.filter((row) => row.spend > 0 || row.active) : []);
  const adsetsOf = () => {
    if (!report) return [];
    return report.adsets.filter((row) => (!state.campaign || row.campaignId === state.campaign)
      && (row.spend > 0 || row.active));
  };

  const shown = () => creatives.filter((row) => !query
    || String(row.name).toLowerCase().indexOf(query.toLowerCase()) >= 0);

  // ── 화면 ────────────────────────────────────────────────────────
  const options = (rows, chosen, allLabel) => `<option value="">${allLabel}</option>`
    + rows.map((row) => `<option value="${perfEscape(row.id)}"${row.id === chosen ? ' selected' : ''}>`
      + `${perfEscape(row.name)}${row.spend ? ` (${money(row.spend)})` : ''}</option>`).join('');

  const controls = () => {
    const range = currentRange();
    const custom = state.preset === 'custom';
    return `<div class="perf-tabs">
      ${Object.keys(PERF_SOURCES).map((key) => `<button type="button" class="perf-tab${state.source === key ? ' is-on' : ''}"
        data-creative="source" data-source="${key}">${PERF_SOURCES[key].name}</button>`).join('')}
    </div>
    <div class="tool-card perf-controls">
      <div class="perf-fields">
        <label class="perf-account">광고 계정
          <select data-creative="account"${accounts.length ? '' : ' disabled'}>
            ${accounts.length
    ? accounts.map((item) => `<option value="${perfEscape(item.id)}"${item.id === account() ? ' selected' : ''}>`
      + `${perfEscape(item.name)} (${perfEscape(item.accountId)})</option>`).join('')
    : '<option>계정을 불러오는 중…</option>'}
          </select>
        </label>
        <label>기간
          <select data-creative="preset">${PERF_PRESETS.map(([key, name]) => `<option value="${key}"${state.preset === key ? ' selected' : ''}>${name}</option>`).join('')}</select>
        </label>
        ${custom ? `<label>시작<input type="date" data-creative="since" value="${perfEscape(range.since)}"></label>
        <label>종료<input type="date" data-creative="until" value="${perfEscape(range.until)}"></label>` : ''}
        <button type="button" class="tool-add" data-creative="reload"${status === 'loading' ? ' disabled' : ''}>
          <i data-lucide="refresh-cw"></i>${status === 'loading' ? '불러오는 중…' : '새로 받기'}</button>
      </div>
      <div class="perf-fields perf-scope">
        <label class="perf-account">캠페인
          <select data-creative="campaign"${report ? '' : ' disabled'}>${options(campaignsOf(), state.campaign, '전체 캠페인')}</select>
        </label>
        <label class="perf-account">광고그룹
          <select data-creative="adset"${report ? '' : ' disabled'}>${options(adsetsOf(), state.adset, '전체 광고그룹')}</select>
        </label>
      </div>
      <p class="perf-note">
        <b>${perfEscape(range.since)} ~ ${perfEscape(range.until)}</b>
        ${fetchedAt ? ` · 갱신 ${new Date(fetchedAt).toLocaleString('ko-KR')}${cached ? ' (담아 둔 값)' : ''}` : ''}
      </p>
    </div>`;
  };

  const metricRow = (label, value) => `<div><small>${label}</small><b>${value}</b></div>`;

  const card = (row) => {
    const ctr = perfRatio(row.linkClicks, row.impressions);
    const cpc = perfRatio(row.spend, row.linkClicks);
    const cpm = perfRatio(row.spend * 1000, row.impressions);
    const cpa = perfRatio(row.spend, row.results);
    return `<article class="creative-card">
      <div class="creative-shot">
        ${row.thumbnail
    ? `<a href="${perfEscape(row.thumbnail)}" target="_blank" rel="noopener" title="원본 크게 보기"><img
        src="${perfEscape(row.thumbnail)}" alt="${perfEscape(row.name)}" loading="lazy" referrerpolicy="no-referrer"></a>`
    : '<span class="creative-none"><i data-lucide="image-off"></i>미리보기 없음</span>'}
        ${row.active ? '<span class="creative-live">게재중</span>' : ''}
      </div>
      <div class="creative-body">
        <h4>${perfEscape(row.name)}</h4>
        <p>${perfEscape(row.campaignName || '')}${row.adsetName ? ` · ${perfEscape(row.adsetName)}` : ''}</p>
        <div class="creative-metrics">
          ${metricRow('광고비', money(row.spend))}
          ${metricRow('결과', perfCount(row.results))}
          ${metricRow('노출', perfCount(row.impressions))}
          ${metricRow(source().clicks, perfCount(row.linkClicks))}
          ${metricRow('CTR', blank(ctr, perfPercent))}
          ${metricRow('CPC', blank(cpc, money))}
          ${metricRow('CPM', blank(cpm, money))}
          ${metricRow('CPA', blank(cpa, money))}
        </div>
      </div>
    </article>`;
  };

  // 고른 캠페인 · 광고그룹의 합계. 검색으로 걸러 두면 걸러진 것만 더한다.
  const summary = () => {
    const rows = shown();
    const total = rows.reduce((sum, row) => ({
      spend: sum.spend + row.spend,
      impressions: sum.impressions + row.impressions,
      linkClicks: sum.linkClicks + row.linkClicks,
      results: sum.results + row.results,
      purchase: sum.purchase + row.purchase,
      addToCart: sum.addToCart + row.addToCart,
      lead: sum.lead + row.lead,
    }), { spend: 0, impressions: 0, linkClicks: 0, results: 0, purchase: 0, addToCart: 0, lead: 0 });

    const where = state.adset
      ? (report.adsets.find((row) => row.id === state.adset) || {}).name
      : (state.campaign ? (report.campaigns.find((row) => row.id === state.campaign) || {}).name : '');
    const scope = where || '전체 캠페인';
    const card = (label, value, note) => `<div class="perf-stat"><small>${label}</small><strong>${value}</strong><em>${note}</em></div>`;

    return `<p class="creative-scope">${perfEscape(scope)}
        <small>소재 ${perfCount(rows.length)}개${rows.length !== creatives.length ? ' (검색한 것만)' : ''}</small></p>
      <div class="perf-stats">
        ${card('총광고비', money(total.spend), `소재 ${perfCount(rows.length)}개`)}
        ${card('총결과', perfCount(total.results), `구매 ${perfCount(total.purchase)} · 장바구니 ${perfCount(total.addToCart)} · 리드 ${perfCount(total.lead)}`)}
        ${card('CPC', blank(perfRatio(total.spend, total.linkClicks), money), `${source().clicks} ${perfCount(total.linkClicks)}회`)}
        ${card('CTR', blank(perfRatio(total.linkClicks, total.impressions), perfPercent), `${source().clicks} ÷ 노출`)}
        ${card('CPM', blank(perfRatio(total.spend * 1000, total.impressions), money), `노출 ${perfCount(total.impressions)}회`)}
        ${card('CPA', blank(perfRatio(total.spend, total.results), money), '광고비 ÷ 결과')}
      </div>`;
  };

  const list = () => {
    const rows = shown();
    return `${summary()}<div class="tool-card">
      <div class="tool-list-head">
        <h3>소재 <small>광고비가 큰 차례 · ${perfCount(creatives.length)}개</small></h3>
        <div class="tool-list-actions">
          <button type="button" class="tool-copy-all" data-creative="copy"${rows.length ? '' : ' disabled'}>
            <i data-lucide="copy"></i>표 복사</button>
        </div>
      </div>
      <div class="perf-filter">
        <div class="perf-search">
          <i data-lucide="search"></i>
          <input type="search" data-creative="search" value="${perfEscape(query)}" placeholder="소재 이름으로 검색" autocomplete="off">
          ${query ? '<button type="button" class="perf-clear" data-creative="clear" aria-label="지우기">×</button>' : ''}
        </div>
        ${rows.length !== creatives.length ? `<span class="perf-count">${perfCount(rows.length)} / ${perfCount(creatives.length)}</span>` : ''}
      </div>
      ${rows.length
    ? `<div class="creative-grid">${rows.map(card).join('')}</div>`
    : `<p class="tool-empty">${query ? '찾는 소재가 없습니다.' : '이 기간에 집행된 소재가 없습니다.'}</p>`}
    </div>`;
  };

  const render = () => {
    const body = () => {
      if (status === 'error') return `<div class="tool-card perf-error"><b>불러오지 못했습니다.</b><p>${perfEscape(error)}</p></div>`;
      if (status === 'loading' && !creatives.length) return '<div class="tool-card perf-loading">불러오는 중…</div>';
      if (!report) return '<div class="tool-card perf-loading">광고 계정을 고르면 소재를 불러옵니다.</div>';
      return list();
    };
    creativePerformance.innerHTML = `<div class="tool-head">
        <h2>소재별 결과 <small>${source().name}</small></h2>
        <p>캠페인 · 광고그룹을 고르면 그 안의 소재를 미리보기와 함께 광고비가 큰 차례로 보여 줍니다.</p>
      </div>${controls()}${body()}`;
    lucide.createIcons();
    if (caret !== null) {
      const search = creativePerformance.querySelector('[data-creative="search"]');
      if (search) {
        search.focus();
        search.setSelectionRange(caret, caret);
      }
      caret = null;
    }
  };

  // ── 불러오기 ────────────────────────────────────────────────────
  const loadCreatives = (refresh) => {
    if (!account()) return;
    const range = currentRange();
    status = 'loading';
    render();
    askSheet({
      action: `${state.source}Creatives`,
      account: account(),
      campaign: state.campaign,
      adset: state.adset,
      since: range.since,
      until: range.until,
      refresh: Boolean(refresh),
    })
      .then((body) => {
        creatives = body.creatives || [];
        fetchedAt = body.fetchedAt || '';
        cached = Boolean(body.cached);
        status = 'ready';
        error = '';
        render();
      })
      .catch((reason) => {
        status = 'error';
        error = reason.message;
        render();
      });
  };

  // 캠페인 · 광고그룹 고르개를 채우려고 성과를 먼저 받는다 (매체별 성과와 같은 요청이라 캐시를 함께 쓴다)
  const loadReport = (refresh) => {
    if (!account()) return;
    const range = currentRange();
    status = 'loading';
    render();
    askSheet({
      action: `${state.source}Report`,
      account: account(),
      since: range.since,
      until: range.until,
      refresh: Boolean(refresh),
    })
      .then((body) => {
        report = body;
        currency = (body.account && body.account.currency) || 'KRW';
        if (state.campaign && !report.campaigns.some((row) => row.id === state.campaign)) state.campaign = '';
        if (state.adset && !report.adsets.some((row) => row.id === state.adset)) state.adset = '';
        save();
        loadCreatives(refresh);
      })
      .catch((reason) => {
        status = 'error';
        error = reason.message;
        render();
      });
  };

  const loadAccounts = () => {
    status = 'loading';
    render();
    askSheet({ action: `${state.source}Accounts` })
      .then((body) => {
        accounts = body.accounts || [];
        if (!accounts.length) throw new Error('볼 수 있는 광고 계정이 없습니다.');
      })
      .catch(() => {
        // 목록을 못 받아도 아는 계정으로 이어 간다 (매체별 성과와 같은 방식)
        accounts = source().fallback.map(([name, id]) => ({ id, accountId: id.replace('act_', ''), name }));
      })
      .then(() => {
        if (!accounts.some((item) => item.id === account())) setAccount(accounts[0].id);
        save();
        loadReport(false);
      });
  };

  creativePerformance.addEventListener('input', (event) => {
    if (event.target.dataset.creative !== 'search') return;
    query = event.target.value;
    caret = event.target.selectionStart;
    render();
  });

  creativePerformance.addEventListener('change', (event) => {
    const field = event.target.dataset.creative;
    if (!field) return;
    if (field === 'account') {
      setAccount(event.target.value);
      state.campaign = '';
      state.adset = '';
      save();
      loadReport(false);
      return;
    }
    if (field === 'campaign') {
      state.campaign = event.target.value;
      state.adset = '';   // 캠페인이 바뀌면 광고그룹은 다시 고른다
      save();
      loadCreatives(false);
      return;
    }
    if (field === 'adset') {
      state.adset = event.target.value;
      save();
      loadCreatives(false);
      return;
    }
    if (field === 'preset') {
      state.preset = event.target.value;
      save();
      if (state.preset === 'custom') { render(); return; }
      loadReport(false);
      return;
    }
    if (field === 'since' || field === 'until') {
      state[field] = event.target.value;
      save();
      if (state.since && state.until) loadReport(false);
    }
  });

  creativePerformance.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-creative="source"]');
    if (tab) {
      if (tab.dataset.source === state.source) return;
      state.source = tab.dataset.source;
      state.campaign = '';
      state.adset = '';
      query = '';
      accounts = [];
      report = null;
      creatives = [];
      save();
      loadAccounts();
      return;
    }
    if (event.target.closest('[data-creative="clear"]')) { query = ''; caret = 0; render(); return; }
    if (event.target.closest('[data-creative="reload"]')) { loadReport(true); return; }
    const copy = event.target.closest('[data-creative="copy"]');
    if (copy) {
      const text = copyText();
      if (window.navigator.clipboard?.writeText) window.navigator.clipboard.writeText(text).catch(() => {});
      else window.prompt('복사하세요', text);
      copy.classList.add('is-copied');
      window.setTimeout(() => copy.classList.remove('is-copied'), 1200);
    }
  });

  // 엑셀 · 시트에 그대로 붙일 수 있게 탭으로 나눈다
  const copyText = () => {
    const head = ['소재', '캠페인', '광고그룹', '광고비', '노출', source().clicks, 'CTR', 'CPC', 'CPM', '결과', 'CPA'];
    const lines = [head.join('\t')];
    shown().forEach((row) => {
      const ctr = perfRatio(row.linkClicks, row.impressions);
      const cpc = perfRatio(row.spend, row.linkClicks);
      const cpm = perfRatio(row.spend * 1000, row.impressions);
      const cpa = perfRatio(row.spend, row.results);
      lines.push([
        row.name, row.campaignName || '', row.adsetName || '',
        Math.round(row.spend), row.impressions, row.linkClicks,
        ctr === null ? '' : perfPercent(ctr),
        cpc === null ? '' : Math.round(cpc),
        cpm === null ? '' : Math.round(cpm),
        row.results,
        cpa === null ? '' : Math.round(cpa),
      ].join('\t'));
    });
    return lines.join('\n');
  };

  // 메뉴에 들어올 때 한 번만 부른다
  const openOnce = () => {
    if (loadedOnce || creativePerformance.hidden) return;
    loadedOnce = true;
    loadAccounts();
  };
  new MutationObserver(openOnce).observe(creativePerformance, { attributes: true, attributeFilter: ['hidden'] });
  render();
  openOnce();
}

// ── 페이지 결과 (Clarity 연동 예정) ──────────────────────────────────
// 아직 연동 전이라 무엇이 들어올지와 무엇이 필요한지만 적어 둔다.
// 붙일 때는 매체별 성과처럼 Apps Script 에 토큰을 두고 그쪽에서 부르면 된다.
const pagePerformance = document.querySelector('#page-performance');
if (pagePerformance) {
  pagePerformance.innerHTML = `<div class="tool-head">
      <h2>페이지 결과 <small>Microsoft Clarity</small></h2>
      <p>상세페이지에서 사람들이 어디까지 보고 어디를 누르는지 봅니다. 아직 연동 전입니다.</p>
    </div>
    <div class="tool-card page-todo">
      <span class="page-badge">연동 예정</span>
      <h3>Clarity 를 붙이면 여기에 들어올 것</h3>
      <ul>
        <li>페이지별 <b>세션 · 스크롤 깊이</b> — 어디서 사람들이 내려가다 멈추는지</li>
        <li><b>클릭 히트맵</b>과 <b>죽은 클릭</b>(눌러도 아무 일 없는 자리)</li>
        <li><b>분노 클릭 · 되돌아가기</b> 같은 막힘 신호</li>
        <li>광고에서 들어온 세션만 골라 보기 (UTM 기준)</li>
      </ul>
      <h3>붙일 때 필요한 것</h3>
      <ul>
        <li>Clarity <b>프로젝트 ID</b> 와 <b>API 토큰</b> — Apps Script 스크립트 속성에 둡니다(브라우저로 내려보내지 않습니다)</li>
        <li>상세페이지에 Clarity 스크립트가 심겨 있어야 합니다</li>
      </ul>
      <p class="page-note">Clarity 대시보드는 iframe 을 막아 두어 화면 안에 그대로 띄울 수 없습니다.
        데이터 내보내기 API 로 숫자를 받아 매체별 성과와 같은 모양으로 그리는 쪽이 낫습니다.</p>
    </div>`;
  lucide.createIcons();
}
