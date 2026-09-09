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

  /* 처음 여는 브라우저는 **빈 목록**으로 시작한다 — 시트가 원본이다.
     예전에 만들어 두던 보기용 주차를 여기서 만들면, 새 브라우저마다 그 주차가 생겨
     시트로 올라간다 (지운 사람은 되살아난 것으로 본다).
     예전 구조(minix-creative-requests-v2)가 남아 있으면 그것만 한 주차로 옮겨 준다. */
  const firstWeek = () => {
    let legacy = null;
    try { legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null'); } catch { legacy = null; }
    if (!Array.isArray(legacy) || !legacy.length) return [];
    return [normalizeWeek({ year: '2026년', month: '8월', week: '4주차', rows: legacy })];
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
  /* 시트가 원본이다. localStorage 는 사본 — 화면을 바로 띄우고, 시트를 못 읽을 때 버틴다.
     저장은 한 박자 모아 한 번만 보낸다 (칸마다 두드릴 때마다 보내면 느리다). */
  let weekSaveWait = null;
  let weekNote = '';                 // 화면 위에 적어 주는 상태 (불러오는 중 · 저장됨 · 실패)
  /* 시트가 한 번이라도 갖고 있던 주차 ID. 이 목록에 있던 주차가 시트에서 사라졌으면
     **남이 지운 것**이라 되살리지 않는다. */
  const KNOWN_KEY = 'minix-creative-weeks-known';
  const knownRead = () => {
    try {
      const kept = JSON.parse(localStorage.getItem(KNOWN_KEY) || '[]');
      return Array.isArray(kept) ? kept : [];
    } catch { return []; }
  };
  const knownWrite = (ids) => { try { localStorage.setItem(KNOWN_KEY, JSON.stringify(ids)); } catch { /* 거들기다 */ } };
  const weekCache = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(weeks)); } catch { /* 거들기다 */ } };

  const save = () => {
    weekCache();
    if (weekSaveWait) window.clearTimeout(weekSaveWait);
    weekNote = '저장 중…';
    if (weekList && !weekList.hidden) renderWeekList();
    weekSaveWait = window.setTimeout(() => {
      weekSaveWait = null;
      // base = 이 화면이 아는 주차 ID. 시트에만 있고 여기에도 없는 주차는 서버가 살려 둔다.
      askSheet({ action: 'weeksPut', weeks: weeks, base: knownRead(), by: '' })
        .then(() => {
          knownWrite(weeks.map((one) => one.id));   // 시트가 이제 이 주차들을 안다
          weekNote = `저장됨 ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
        })
        .catch((reason) => { weekNote = `시트에 저장 못 함 — ${reason.message} (이 브라우저에는 남아 있습니다)`; })
        .then(() => { if (weekList && !weekList.hidden) renderWeekList(); });
    }, 700);
  };

  /* 시트에서 받아 온다.
     처음 받을 때는 이 브라우저에만 있던 주차를 **버리지 않고 합친다** — 시트에 담기 전에
     만들어 둔 주차(다른 PC 에서 안 보이던 그것)를 잃지 않게, 그리고 시트로 올려 준다.
     사람이 새로고침을 누른 때는 시트를 그대로 따른다 — 남이 지운 주차가 되살아나면 안 된다. */
  let weekPulled = false;
  const pullWeeks = (mine) => askSheet({ action: 'weeksGet' })
    .then((body) => {
      const got = (body.weeks || []).map(normalizeWeek);
      const first = !weekPulled;
      weekPulled = true;
      let push = false;
      if (first && !mine) {
        const sameWeek = (a, b) => a.year === b.year && a.month === b.month && a.week === b.week;
        const known = knownRead();
        const onlyHere = weeks.filter((one) => !known.includes(one.id)
          && !got.some((there) => there.id === one.id || sameWeek(there, one)));
        weeks = got.concat(onlyHere);
        push = onlyHere.length > 0;
        if (push) weekNote = `이 브라우저에만 있던 ${onlyHere.length}개를 시트에 올립니다`;
      } else {
        weeks = got;
      }
      weekCache();
      knownWrite(got.map((one) => one.id));
      if (!push) weekNote = weeks.length ? '' : '시트에 주차가 없습니다';
      if (push) save();               // 올려 준다 (save 가 알림도 갈아 준다)
      if (weekList && !weekList.hidden) renderWeekList();
      if (currentWeekId) {
        const still = weeks.find((one) => one.id === currentWeekId);
        if (still) { rows = still.rows; renderBoard(); }
        else backToList();
      }
    })
    .catch((reason) => {
      weekNote = `시트를 못 읽었습니다 — ${reason.message} (이 브라우저에 있던 것으로 보여 줍니다)`;
      if (weekList && !weekList.hidden) renderWeekList();
    });

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
        <span class="week-note">${escapeHtml(weekNote)}</span>
        <button type="button" class="week-pull" title="시트에서 다시 불러옵니다"><i data-lucide="refresh-cw"></i>새로고침</button>
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
        <thead><tr><th class="week-grip-head"></th><th>년도</th><th>월</th><th>주차</th><th>건수</th><th class="week-spacer"></th><th>수정</th><th>공유</th><th>삭제</th></tr></thead>
        <tbody>${filteredWeeks().map((week) => (week.id === editingWeekId ? `
          <tr class="week-row is-editing" data-week="${week.id}">
            <td class="week-grip"></td>
            <td><input class="week-input" data-field="year" value="${escapeHtml(week.year)}" placeholder="2026년"></td>
            <td><select class="week-input" data-field="month">${MONTH_CHOICES.map((name) => `<option${name === week.month ? ' selected' : ''}>${name}</option>`).join('')}</select></td>
            <td><select class="week-input" data-field="week">${WEEK_CHOICES.map((name) => `<option${name === week.week ? ' selected' : ''}>${name}</option>`).join('')}</select></td>
            <td class="week-count">${skuCount(week)}건</td>
            <td class="week-spacer"></td>
            <td colspan="3"><div class="week-edit-actions"><button type="button" class="week-save">저장</button><button type="button" class="week-cancel">취소</button></div></td>
          </tr>` : `
          <tr class="week-row" data-week="${week.id}">
            <td class="week-grip"><button type="button" class="week-drag"
              aria-label="순서 변경" title="끌어서 순서 변경"><i data-lucide="grip-vertical"></i></button></td>
            <td class="week-year">${escapeHtml(week.year)}</td>
            <td class="week-month">${escapeHtml(week.month)}</td>
            <td><span class="chip chip-orange">${escapeHtml(week.week)}</span></td>
            <td class="week-count">${skuCount(week)}건</td>
            <td class="week-spacer"></td>
            <td><button type="button" class="week-edit" aria-label="수정"><i data-lucide="pencil"></i></button></td>
            <td><button type="button" class="week-share" data-link="${escapeHtml(shareLink(week))}"><i data-lucide="link"></i>복사</button></td>
            <td><button type="button" class="week-delete">삭제</button></td>
          </tr>`)).join('') || '<tr class="week-empty"><td colspan="9">해당하는 주차가 없습니다.</td></tr>'}</tbody>
      </table></div>`;
    lucide.createIcons();
  };

  // 끌어서 순서 바꾸기. 걸러 보는 중이라도 실제 배열에서 옮긴다 (놓은 줄의 옆자리로).
  let dragWeekId = null;
  let dragMoved = false;

  const clearWeekMarks = () => weekList.querySelectorAll('.week-row').forEach((one) => {
    one.classList.remove('is-over-top', 'is-over-bottom');
  });

  const moveWeek = (fromId, toId, after) => {
    const from = weeks.findIndex((week) => week.id === fromId);
    if (from < 0) return;
    const [moved] = weeks.splice(from, 1);
    let to = weeks.findIndex((week) => week.id === toId);
    if (to < 0) to = weeks.length;
    else if (after) to += 1;
    weeks.splice(to, 0, moved);
    save();
  };

  const dropAfter = (row, event) => {
    const box = row.getBoundingClientRect();
    return event.clientY > box.top + (box.height / 2);
  };

  // 손잡이를 누른 채 옮긴다. 마우스를 놓을 때까지는 다시 그리지 않는다 (그리면 잡고 있던 것이 사라진다).
  const weekUnder = (x, y) => document.elementFromPoint(x, y)?.closest?.('.week-row') || null;

  weekList.addEventListener('pointerdown', (event) => {
    const handle = event.target.closest('.week-drag');
    if (!handle || event.button !== 0) return;
    const row = handle.closest('.week-row');
    if (!row) return;
    event.preventDefault();
    dragWeekId = row.dataset.week;
    dragMoved = false;
    row.classList.add('is-dragging');
    try { handle.setPointerCapture(event.pointerId); } catch { /* 거들기다 */ }
  });

  weekList.addEventListener('pointermove', (event) => {
    if (!dragWeekId) return;
    dragMoved = true;
    const row = weekUnder(event.clientX, event.clientY);
    clearWeekMarks();
    if (!row || row.dataset.week === dragWeekId) return;
    row.classList.add(dropAfter(row, event) ? 'is-over-bottom' : 'is-over-top');
  });

  const endWeekDrag = (event) => {
    if (!dragWeekId) return;
    const row = dragMoved ? weekUnder(event.clientX, event.clientY) : null;
    if (row && row.dataset.week !== dragWeekId) moveWeek(dragWeekId, row.dataset.week, dropAfter(row, event));
    dragWeekId = null;
    renderWeekList();
  };

  weekList.addEventListener('pointerup', endWeekDrag);
  weekList.addEventListener('pointercancel', endWeekDrag);

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
    if (event.target.closest('.week-pull')) {
      weekNote = '시트에서 불러오는 중…';
      renderWeekList();
      pullWeeks(true);      // 누른 것은 '시트 그대로' 다 (합치지 않는다)
      return;
    }
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
    if (event.target.closest('.week-drag')) return;
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

  // 사본으로 먼저 그려 두고, 시트에서 받아 오면 그것으로 바꿔 그린다.
  // 부르는 것은 스크립트가 다 읽힌 뒤에 — askSheet 가 이 아래에 선언돼 있다.
  weekNote = '시트에서 불러오는 중…';
  renderWeekList();
  window.setTimeout(pullWeeks, 0);

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
  '행사별 성과': { section: '#event-result', hash: '#event' },
  '콘텐츠 일정': { section: '#content-schedule', hash: '#content-cal' },
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
  '월별 예산': { section: '#budget-plan', hash: '#budget' },
  'KOL라이브': { section: '#kol-live', hash: '#kol' },
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


// ── 행사별 성과 ────────────────────────────────────────────────────
// 미닉스 워크스페이스(my-pages)의 '행사별 결과' 화면을 그대로 끌어다 붙인다.
// 그쪽 껍데기까지 들어오지 않게 **그 화면 파일만** 부른다.
//
// 로그인은 그쪽 쿠키를 쓴다. 그 쿠키가 sameSite=lax 라 **iframe 에는 안 실려 간다** —
// 그래서 로그인 안 된 것처럼 보일 수 있다. 그때는 [새 탭에서 열기] 로 열어 보면 된다.
// (고치려면 my-pages 의 세션 쿠키를 sameSite=none 으로 바꿔야 한다)
const eventResult = document.querySelector('#event-result');
if (eventResult) {
  const frame = eventResult.querySelector('iframe');
  const load = () => {
    if (frame.getAttribute('src')) return;
    frame.src = frame.dataset.src;
  };
  new MutationObserver(() => {
    if (eventResult.hidden) return;
    load();
  }).observe(eventResult, { attributes: true, attributeFilter: ['hidden'] });
  if (!eventResult.hidden) load();

  eventResult.addEventListener('click', (event) => {
    if (event.target.closest('.event-reload')) {
      frame.removeAttribute('src');
      load();
      return;
    }
    if (event.target.closest('.event-open')) window.open(frame.dataset.src, '_blank', 'noopener');
  });
}

// ── 광고소재 검수 ──────────────────────────────────────────────────
// 검수 사이트(ad-creative-checker)를 이 화면 안에 띄운다. 행사명 · 문구는 그 사이트에서
// 직접 적는다 — 워크스페이스에서 값을 넘겨 주지 않는다 (넘기는 다리를 걷어냈다).
const creativeChecker = document.querySelector('#creative-checker');
if (creativeChecker) {
  const frame = creativeChecker.querySelector('iframe');

  const loadFrame = () => {
    if (frame.getAttribute('src')) return;
    frame.src = frame.dataset.src;
  };

  new MutationObserver(() => {
    if (creativeChecker.hidden) return;
    loadFrame();
  }).observe(creativeChecker, { attributes: true, attributeFilter: ['hidden'] });

  if (!creativeChecker.hidden) loadFrame();

  creativeChecker.querySelector('.checker-reload').addEventListener('click', () => {
    frame.removeAttribute('src');
    loadFrame();
  });
  creativeChecker.querySelector('.checker-open').addEventListener('click', () => window.open(frame.dataset.src, '_blank', 'noopener'));
}

const openedView = Object.entries(VIEWS).find(([, entry]) => window.location.hash.startsWith(entry.hash));
if (openedView) document.querySelector(`button[data-view='${openedView[0]}']`)?.click();

// 다른 워크스페이스가 이 화면을 틀(iframe)로 끌어다 쓸 때는, 부모가 주소의 해시만 바꿔
// 화면을 옮긴다 (같은 문서라 다시 읽히지 않는다). 그래서 해시가 바뀌면 그 화면으로 옮겨 준다.
// 메뉴를 눌러 바뀌는 해시는 replaceState 라 이 일이 안 일어나므로 서로 부딪히지 않는다.
window.addEventListener('hashchange', () => {
  const want = Object.entries(VIEWS).find(([, entry]) => window.location.hash.startsWith(entry.hash));
  if (!want) return;
  const button = document.querySelector(`button[data-view='${want[0]}']`);
  if (button && !button.classList.contains('is-active')) button.click();
});

document.querySelectorAll('.week-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.week-button').forEach((entry) => entry.classList.remove('active'));
    button.classList.add('active');
  });
});

document.querySelectorAll('.segmented button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.segmented button').forEach((entry) => entry.classList.remove('selected'));
    button.classList.add('selected');
  });
});

/* 팀 메모. 이름이 '팀 메모' 인데 그 브라우저에만 있으면 팀이 못 본다 — 시트가 원본이고
   localStorage 는 사본이다 (시트를 못 읽을 때 화면을 바로 띄우려고 남겨 둔다).
   여러 사람이 같은 순간에 고치면 뒤에 저장한 것이 이긴다. 남이 고친 것은 새로고침으로 받는다. */
const teamNote = document.querySelector('#team-note');
const autosaveStatus = document.querySelector('#autosave-status');
const notePull = document.querySelector('#note-pull');
const NOTE_KEY = 'minix-team-note';
let noteTyped = false;          // 이 사람이 이 화면에서 글을 건드렸는가
let noteSaveWait = null;

const noteTell = (icon, words) => {
  autosaveStatus.innerHTML = `<i data-lucide="${icon}"></i>${words}`;
  lucide.createIcons();
};
const noteClock = (value) => {
  const at = value ? new Date(value) : null;
  if (!at || Number.isNaN(at.getTime())) return '';
  return at.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
};

try {
  const kept = localStorage.getItem(NOTE_KEY);
  if (kept) teamNote.value = kept;
} catch { /* 거들기다 */ }

const noteLoad = (mine) => {
  noteTell('cloud-download', '불러오는 중…');
  return askSheet({ action: 'noteGet' })
    .then((body) => {
      const there = String(body.text || '');
      // 이 사람이 방금 적고 있는 글은 덮지 않는다. 사람이 새로고침을 누른 때는 시트를 따른다.
      if (!mine && noteTyped) return;
      // 시트가 비어 있는데 이 브라우저에만 글이 있으면 그 글을 올려 준다 (잃지 않게)
      if (!there.trim() && teamNote.value.trim() && !mine) {
        noteTell('cloud-upload', '이 브라우저에만 있던 메모를 시트에 올립니다');
        noteSave();
        return;
      }
      teamNote.value = there;
      try { localStorage.setItem(NOTE_KEY, there); } catch { /* 거들기다 */ }
      const when = noteClock(body.updatedAt);
      noteTell('cloud-check', there.trim() ? `시트에서 불러옴${when ? ` · ${when}` : ''}` : '시트에 메모가 없습니다');
    })
    .catch((reason) => {
      noteTell('cloud-off', `시트에서 못 읽었습니다 — 이 브라우저 값만 보입니다 (${reason.message})`);
    });
};

const noteSave = () => {
  try { localStorage.setItem(NOTE_KEY, teamNote.value); } catch { /* 거들기다 */ }
  if (noteSaveWait) window.clearTimeout(noteSaveWait);
  noteTell('cloud-upload', '저장 중…');
  noteSaveWait = window.setTimeout(() => {
    noteSaveWait = null;
    askSheet({ action: 'notePut', text: teamNote.value, by: '' })
      .then((body) => { noteTell('cloud-check', `저장됨${noteClock(body.savedAt) ? ` · ${noteClock(body.savedAt)}` : ''}`); })
      .catch((reason) => { noteTell('cloud-off', `시트에 저장 못 함 — ${reason.message} (이 브라우저에는 남아 있습니다)`); });
  }, 900);
};

teamNote.addEventListener('input', () => {
  noteTyped = true;
  noteSave();
});
if (notePull) notePull.addEventListener('click', () => noteLoad(true));
// askSheet 는 이 아래에 선언돼 있다. 스크립트를 다 읽은 뒤에 부른다.
window.setTimeout(() => noteLoad(false), 0);

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

// 카카오 광고계정. 목록은 비즈니스 토큰으로 받아 오고, 못 받으면 이 목록으로 채운다.
// (카카오모먼트 화면 왼쪽 위 계정 이름 옆의 숫자가 광고계정 번호다)
const KAKAO_ACCOUNTS = [];

const PERF_SOURCES = {
  meta: {
    name: 'Meta Ads',
    // CPA 에서 빼는 목적. CPA 계산은 화면에서만 한다 (Apps Script 는 목적 이름을 그대로 넘겨준다)
    skip: ['OUTCOME_TRAFFIC', 'LINK_CLICKS'],
    skipLabel: '트래픽',
    clicks: '링크 클릭',
    note: 'CPC · CTR 은 링크 클릭 기준입니다. 구매와 장바구니를 갈라서 보여 주고 '
      + 'CPS(광고비÷구매) · CPB(광고비÷장바구니) 로 봅니다. 어트리뷰션 칸도 구매만 센 값입니다.',
    fallback: AD_ACCOUNTS,
    // 못 불러왔을 때 보여 줄 안내 — Apps Script 스크립트 속성에 넣을 이름
    token: '메타 액세스 토큰',
    properties: ['META_ACCESS_TOKEN'],
    // 구매 옆에 붙여 볼 수 있는 어트리뷰션 기간. 기본값은 계정 설정 그대로다.
    windows: [['1d_click', '1일 클릭'], ['7d_click', '7일 클릭']],
    breakdowns: ['placement', 'age', 'gender', 'ageGender', 'region'],
    // 처음 열 때 걸리는 시간(초). 직접 재 본 값이다 (두 번째부터는 1~2초).
    wait: 10,
    waitNote: '광고 계정 목록과 캠페인 · 광고세트 성과를 따로 받습니다. '
      + '지금 꺼진 광고세트의 집행 기간도 id 로 되짚습니다.',
    // 소재별 결과에서 처음 열 때 걸리는 시간(초). 이것도 직접 재 본 값이다.
    adWait: 6,
    adWaitNote: '광고마다 미리보기 이미지를 따로 물어봅니다 — 인스타 미디어 · 동영상 표지 · '
      + '게시물 이미지를 차례로 찾습니다.',
    // 구매를 따로 떼어 본다. 구매전환광고를 장바구니까지 섞인 '결과' 로 재면
    // 장바구니가 구매보다 몇 배 많아 성과가 실제보다 좋아 보인다.
    splitResults: true,
  },
  google: {
    name: 'Google Ads',
    // 구글에는 캠페인 목적이 없다. 전환을 노리지 않는 동영상(브랜딩)을 CPA 에서 뺀다.
    skip: ['VIDEO'],
    skipLabel: '동영상',
    clicks: '클릭',
    note: '결과는 전환 카테고리(구매 + 장바구니 + 리드), CPA 는 동영상(브랜딩) 캠페인을 뺀 값입니다. '
      + '구글만 결과 · CPA 로 봅니다 — 전환 카테고리를 광고그룹 단위로는 주지 않아 '
      + '구매 · 장바구니를 가를 수 없습니다.',
    fallback: GOOGLE_ACCOUNTS,
    token: '구글 광고 자격 증명',
    properties: ['GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET',
      'GOOGLE_ADS_REFRESH_TOKEN', 'GOOGLE_ADS_LOGIN_CUSTOMER_ID'],
    // 구글은 어트리뷰션을 기간별로 나눠 주지 않는다. 위치는 지역 번호만 와서 아직 뺐다.
    breakdowns: ['placement', 'age', 'gender'],
    wait: 7,
    waitNote: '캠페인 · 광고그룹 · 전환 카테고리를 각각 질의합니다.',
    adWait: 6,
    adWaitNote: '광고 · 전환 카테고리 · 애셋(이미지 · 유튜브)을 각각 질의합니다. '
      + '반응형 광고는 로고를 빼고 소재 이미지만 고릅니다.',
  },
  kakao: {
    name: '카카오모먼트',
    // 카카오는 캠페인 유형이 목적 자리다. 전환을 노리지 않는 도달 · 동영상을 CPA 에서 뺀다.
    skip: ['TALKCHANNELREACH', 'VIDEO'],
    skipLabel: '도달 · 동영상',
    clicks: '클릭',
    note: '구매와 장바구니를 갈라서 보여 주고 CPS(광고비÷구매) · CPB(광고비÷장바구니) 로 봅니다. '
      + '픽셀&SDK 전환 기준이고, 어트리뷰션 칸도 구매만 센 값입니다. '
      + '카카오는 한 번에 31일까지만 봅니다. '
      + '카카오톡 채널 메시지(CRM) 캠페인은 노출 개념이 없어, 노출 자리에 열람 · 클릭 자리에 메시지 클릭을 넣습니다. '
      + '메시지는 광고비에는 들어가지만 소재별 결과에서는 빼고 보여 줍니다.',
    fallback: KAKAO_ACCOUNTS,
    token: '카카오 비즈니스 토큰',
    properties: ['KAKAO_BUSINESS_TOKEN'],
    // 카카오는 전환을 어트리뷰션 기간별로 따로 준다 (conv_purchase_1d · conv_purchase_7d …)
    windows: [['1d', '1일 클릭'], ['7d', '7일 클릭']],
    breakdowns: ['placement', 'age', 'gender', 'ageGender', 'region'],
    splitResults: true,
    wait: 14,
    waitNote: '카카오가 보고서만 5초에 한 번씩 줍니다 (그 외 조회는 한꺼번에 부릅니다). '
      + '캠페인이 260개가 넘어 유형 · 예산 · 집행 기간을 광고비 큰 쪽부터 따로 물어봅니다.',
    adWait: 9,
    adWaitNote: '매체별 성과를 먼저 받은 뒤 소재 보고서를 한 번 더 부릅니다 — '
      + '보고서 사이의 5초 간격이 이 시간의 대부분입니다. '
      + '미리보기 · 문구는 한꺼번에 받아 6시간 담아 둡니다.',
  },
  naver: {
    name: '네이버 GFA',
    // GFA 의 캠페인 목적. 전환을 노리지 않는 트래픽을 CPA 에서 뺀다.
    skip: ['WEB_SITE_TRAFFIC'],
    skipLabel: '트래픽',
    clicks: '클릭',
    // GFA 만 결과를 구매 · 장바구니로 갈라 본다. GFA 는 두 전환의 수와 매출을 따로 주는데,
    // 합쳐 놓으면 장바구니가 구매를 덮어 CPA 도 ROAS 도 실제보다 좋아 보인다.
    // 그래서 CPA 대신 CPS(광고비÷구매) · CPB(광고비÷장바구니) 를 쓴다.
    splitResults: true,
    // 이 매체만 실시간이 아니다. GFA 에는 공개 API 가 없어서 PC 에서 적재한 값을 읽는다.
    note: '네이버 GFA 는 공개 API 가 없어, 누군가의 PC 가 관리 화면에서 받아 적재한 값을 봅니다. '
      + '실시간이 아니라 마지막 적재 시점 기준입니다 (하루 세 번 · 09시 14시 19시). '
      + 'GFA 로그인이 되는 사람은 누구나 gfa_load.bat 으로 직접 적재할 수 있습니다. '
      + '구매와 장바구니를 갈라서 보여 주고 CPS(광고비÷구매) · CPB(광고비÷장바구니) 로 봅니다. '
      + '구매매출은 장바구니 매출을 뺀 구매만의 매출입니다. '
      + '애드부스트 캠페인은 광고그룹 대신 애셋그룹으로 나옵니다.',
    fallback: [],
    wait: 6,
    waitNote: '적재해 둔 시트를 통째로 훑어 고른 기간만큼 더합니다. 줄이 많으면 그만큼 걸립니다.',
    adWait: 11,
    adWaitNote: '미리보기 · 문구까지 적재해 둔 값이라 시트만 읽습니다.',
    token: '네이버 성과 적재',
    properties: [],
    // 지면 · 연령 · 성별은 적재 쪽에 아직 넣지 않았다. 넣으면 여기에 더한다.
  },
};

// 네이버 GFA 는 보고서 광고비가 부가세를 포함한 금액이라 Code.gs 가 10% 를 뺀 값을
// 내려 준다. 화면에도 그 사실을 적어 둔다 — 매체 화면 숫자와 다르게 보일 때 왜 그런지
// 알 수 있어야 한다. (메타 · 구글 · 카카오모먼트는 매체가 준 값 그대로다)
const PERF_NET_SOURCES = ['naver'];
const PERF_NET_TEXT = '광고비는 부가세 10%를 뺀 금액입니다';

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
  // 카카오모먼트 — 캠페인 유형 (DISPLAY · VIDEO 는 위 구글 것과 이름이 같아 함께 쓴다)
  // 계정에서 실제로 확인한 이름만 둔다: TALK_BIZ_BOARD · DISPLAY · TALK_CHANNEL
  // TALK_CHANNEL 이 카카오톡 채널 메시지(CRM)다. 소재별 결과에서는 이 캠페인을 빼고 본다.
  TALK_BIZ_BOARD: '비즈보드', TALK_CHANNEL: '채널 메시지',
  DAUM_SHOPPING: '쇼핑', SPONSORED_BOARD: '스폰서드보드', PC_TALK_BOTTOM: '톡 하단',
  // GFA 는 단수 CONVERSION 으로 온다 (메타는 복수 CONVERSIONS)
  CONVERSION: '전환',
  // 네이버 GFA — 캠페인 목적. 적재된 값에서 확인한 이름만 둔다.
  // (SHOPPING · CONVERSION 은 위 구글 · 메타 것과 이름이 같아 함께 쓴다)
  // PMAX 는 애드부스트다. 이 캠페인은 광고그룹이 없고 애셋그룹으로 내려온다.
  WEB_SITE_TRAFFIC: '트래픽', PMAX: '애드부스트',
};

// 상세 보기에서 쪼갤 수 있는 항목. 매체마다 부르는 이름이 달라 여기서 한 낱말로 맞춘다.
const PERF_BREAKDOWNS = {
  placement: '게재지면', age: '연령대', gender: '성별', ageGender: '연령 × 성별', region: '위치',
};

// 상세에서 볼 수 있는 지표. 한 번에 하나만 그린다 (축이 다른 둘을 한 그림에 겹치지 않는다)
const PERF_METRICS = [['spend', '광고비'], ['impressions', '노출'], ['linkClicks', '클릭'],
  ['results', '결과'], ['revenue', '구매전환값']];

// 매체가 코드로 주는 값에 한글 이름을 붙인다. 없는 값은 온 그대로 보여 준다.
const PERF_LABELS = {
  male: '남성', female: '여성', unknown: '알 수 없음', MALE: '남성', FEMALE: '여성',
  facebook: 'Facebook', instagram: 'Instagram', messenger: 'Messenger',
  audience_network: 'Audience Network', threads: 'Threads',
  feed: '피드', story: '스토리', reels: '릴스', instream_video: '인스트림',
  SEARCH: '검색', CONTENT: '디스플레이', YOUTUBE_WATCH: '유튜브', YOUTUBE_SEARCH: '유튜브 검색',
  MIXED: '혼합', UNKNOWN: '알 수 없음', UNDETERMINED: '알 수 없음',
};
const perfLabel = (value) => PERF_LABELS[value] || String(value ?? '') || '(알 수 없음)';

// 메타 관리자와 같은 기준 — '최근 N일' 은 오늘을 넣지 않는다 (오늘 수치는 계속 움직이므로)
const PERF_PRESETS = [
  ['today', '오늘'], ['yesterday', '어제'], ['7d', '최근 7일'], ['14d', '최근 14일'],
  ['30d', '최근 30일'], ['month', '이번 달'], ['lastMonth', '지난 달'], ['custom', '직접 지정'],
];

// 광고그룹 이름은 [행사]타겟팅_매출채널 꼴이다 ([cj-260901]_none_cj).
// 매출채널에도 같은 낱말이 들어가서 이름 전체로 찾으면 엉뚱한 것이 걸린다.
//   'naver' → [naver-260831]… (맞음) · [cj-260901]_none_naver (매출채널만 naver)
// 그래서 대괄호 안만 보는 것을 기본으로 둔다. 대괄호가 없는 이름은 그때 걸리지 않는다.
const perfBracket = (name) => {
  const found = String(name || '').match(/\[([^\]]*)\]/);
  return found ? found[1] : '';
};

// wanted 는 소문자로 넣는다. bracketOnly 면 대괄호 안만 본다.
const perfNameHit = (name, wanted, bracketOnly) => {
  if (!wanted) return true;
  const text = String(bracketOnly ? perfBracket(name) : (name || '')).toLowerCase();
  return Boolean(text) && text.indexOf(wanted) >= 0;
};

// 표를 엑셀에서 열 수 있는 파일로 내려 준다. 화면의 '표 복사' 와 같은 내용이다.
// CSV 로 만드는 이유: xlsx 를 만들려면 외부 라이브러리를 받아야 하는데,
// CSV 는 엑셀이 그냥 두 번 눌러 열어 준다. 대신 두 가지를 지켜야 한다.
//   · 맨 앞에 BOM(U+FEFF) — 없으면 엑셀이 UTF-8 을 못 알아보고 한글이 깨진다
//   · 쉼표 · 따옴표 · 줄바꿈이 든 칸은 따옴표로 감싼다 (캠페인 이름에 쉼표가 들어간다)
const perfDownload = (filename, tsv) => {
  const csv = tsv.split('\n').map((line) => line.split('\t').map((cell) => {
    const text = String(cell === undefined || cell === null ? '' : cell);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }).join(',')).join('\r\n');

  const blob = new Blob([String.fromCharCode(0xFEFF) + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

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
//
// Apps Script 의 /exec 는 이따금 요청을 흘린다. 40초쯤 끌다가 JSON 대신 구글의
// 404 안내 페이지(<!DOCTYPE html…)를 돌려준다 — 다섯 번에 한 번쯤이다.
// 그러면 화면에는 "Unexpected token '<'" 만 뜨고 무엇이 잘못됐는지 알 수 없다.
// 그래서 그런 답은 한 번 더 물어본다.
//
// **읽기 요청에만 다시 묻는다.** 적재(쓰기)는 이 함수를 쓰지 않는다 —
// 이미 들어간 요청을 다시 보내면 같은 줄이 두 번 쌓인다.
const SHEET_TRIES = 3;

// 지금 몇 번째로 묻고 있는지. 화면이 '다시 물어보는 중' 을 띄우는 데 쓴다.
// 되묻기가 화면에 안 보이면 흐르는 시간만 계속 늘어나 멈춘 것처럼 보인다.
const askState = { tries: 1 };

// fetch 에는 시간 제한이 없다. 구글이 답을 아예 안 주면 화면이 영원히 '불러오는 중' 에
// 멈춘다 (흐르는 시간만 계속 늘어난다). 그래서 여기서 끊고, 흘린 요청과 같이 다뤄 다시 묻는다.
// 제대로 도는 조회는 가장 느린 것도 15초 안쪽이라 60초면 넉넉하다.
const SHEET_TIMEOUT = 60000;

const askSheetOnce = (payload) => {
  const stop = new AbortController();
  const timer = window.setTimeout(() => stop.abort(), SHEET_TIMEOUT);
  return window.fetch(SHEET_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    signal: stop.signal,
  }).then((response) => response.text().then((text) => {
  if (!response.ok) throw new Error('HTTP ' + response.status);
  var body = null;
  try {
    body = JSON.parse(text);
  } catch (error) {
    // 본문은 구글의 안내 페이지라 사람에게 보여 줄 것이 없다. 흘렸다고만 알린다.
    throw new Error('구글이 응답을 흘렸습니다');
  }
  // POST 가 GET 으로 바뀌어 doGet 의 답이 오는 경우가 있다.
  //   Apps Script 의 /exec 는 302 로 googleusercontent 로 넘기는데,
  //   그 되넘김이 어긋나면 우리가 보낸 action 은 실행되지 않고 doGet 의 인사말이 온다.
  // ok:true 라서 그냥 두면 화면이 '값이 없다' 고 잘못 말한다 ('최근 undefined일 …').
  // 이건 흘린 요청이므로 다시 물어야 한다.
  if (body && body.message === 'minix filename endpoint') {
    throw new Error('구글이 응답을 흘렸습니다 (doGet 이 답했습니다)');
  }
  return body;
}))
    .then((body) => { window.clearTimeout(timer); return body; })
    .catch((reason) => {
      window.clearTimeout(timer);
      throw new Error(reason && reason.name === 'AbortError'
        ? '구글이 시간 안에 답하지 않았습니다'
        : ((reason && reason.message) || '알 수 없는 오류'));
    });
};

// 서버가 제대로 답한 오류(토큰 없음 같은 것)는 다시 물어도 같은 답이다. 그건 그대로 올린다.
const askFlaky = (message) => /응답을 흘렸|시간 안에 답하지|HTTP [45]|Failed to fetch|NetworkError|Load failed/.test(message || '');

const askSheet = (payload, left) => {
  const tries = left === undefined ? SHEET_TRIES : left;
  if (left === undefined) askState.tries = 1;
  return askSheetOnce(payload)
    .then((body) => {
      if (!body || !body.ok) throw new Error((body && body.error) || '알 수 없는 오류');
      return body;
    })
    .catch((reason) => {
      if (tries <= 1 || !askFlaky(reason && reason.message)) throw reason;
      askState.tries = SHEET_TRIES - tries + 2;
      return new Promise((done) => window.setTimeout(done, 1200 * (SHEET_TRIES - tries + 1)))
        .then(() => askSheet(payload, tries - 1));
    });
};

const perfMoney = (currency) => (value) => new Intl.NumberFormat('ko-KR', {
  style: 'currency', currency: currency || 'KRW',
  maximumFractionDigits: (currency || 'KRW') === 'KRW' ? 0 : 2,
}).format(Number(value) || 0);
const perfCount = (value) => new Intl.NumberFormat('ko-KR').format(Math.round(Number(value) || 0));
const perfPercent = (value) => `${((Number(value) || 0) * 100).toFixed(2)}%`;
// ROAS = 구매전환값 ÷ 광고비. 3.5% 와 1,240% 가 같은 표에 섞이므로 소수 한 자리로 둔다.
const perfRoas = (value) => `${((Number(value) || 0) * 100).toFixed(1)}%`;
const perfRatio = (top, bottom) => (bottom > 0 ? top / bottom : null);

// ── 상세 보기 차트 ──────────────────────────────────────────────────
// 표만으로는 연령 · 성별 쏠림이 안 보여서 막대로도 그린다. 라이브러리 없이 SVG 로 그린다.
// 색은 한 벌만 쓴다 — 한 계열이면 파랑 하나, 여러 계열이면 아래 차례대로.
// (검증 통과: 인접쌍 CVD ΔE 9.2 · 일반 시야 ΔE 27.6. 초록은 배경 대비가 낮아
//  반드시 눈에 보이는 값 라벨이나 표를 함께 둔다)
const VIZ_SERIES = ['#2a78d6', '#eb6834', '#1baf7a'];
const VIZ_INK = '#3d3d39';
const VIZ_MUTED = '#8c8c85';
const VIZ_SURFACE = '#fafaf8';
const VIZ_GRID = '#e8e7e2';

// 막대 끝만 둥글게. 바닥 쪽은 각지게 둔다 (기준선에 붙어 있다는 뜻)
const vizCapPath = (x, y, w, h, side) => {
  const r = Math.min(4, w / 2, h);
  if (h <= 0) return '';
  if (side === 'flat') return `M${x},${y} H${x + w} V${y + h} H${x} Z`;
  if (side === 'right') {
    return `M${x},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r}`
      + ` V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x} Z`;
  }
  return `M${x},${y + r} A${r},${r} 0 0 1 ${x + r},${y} H${x + w - r}`
    + ` A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h} H${x} Z`;
};

// 칸을 넘칠 이름은 잘라서 그린다. 잘려 보이느니 줄여 두고 전체는 툴팁에 남긴다.
// 한글은 글자 하나가 영문 두 배쯤 넓다.
const vizFit = (text, room, size) => {
  const wide = (letter) => (/[ㄱ-힝가-힣]/.test(letter) ? 1 : 0.56);
  const budget = room / size;
  let used = 0;
  let out = '';
  for (const letter of String(text)) {
    used += wide(letter);
    if (used > budget - 1) return out + '…';
    out += letter;
  }
  return out;
};

const vizText = (x, y, value, options = {}) => `<text x="${x}" y="${y}"
  text-anchor="${options.anchor || 'middle'}" fill="${options.fill || VIZ_MUTED}"
  font-size="${options.size || 10}" font-weight="${options.weight || 600}">${perfEscape(value)}</text>`;

// 세로 막대 — 연령대처럼 차례가 있고 이름이 짧은 것
const vizColumns = (rows, format, label) => {
  if (!rows.length) return '';
  const band = 64;
  const bar = 24;
  const top = 28;
  const plot = 128;
  const foot = 30;
  const width = rows.length * band + 16;
  const height = top + plot + foot;
  const peak = Math.max(...rows.map((row) => row.value), 0) || 1;

  const marks = rows.map((row, i) => {
    const x = 8 + i * band + (band - bar) / 2;
    const size = Math.max(row.value <= 0 ? 0 : 2, Math.round((row.value / peak) * plot));
    const y = top + plot - size;
    return `<g><title>${perfEscape(row.name)} · ${perfEscape(format(row.value))}</title>
      <path d="${vizCapPath(x, y, bar, size)}" fill="${VIZ_SERIES[0]}"></path>
      ${vizText(x + bar / 2, y - 7, format(row.value), { fill: VIZ_INK })}
      ${vizText(x + bar / 2, top + plot + 15, vizFit(row.name, band - 4, 10))}</g>`;
  }).join('');

  return `<svg class="viz" viewBox="0 0 ${width} ${height}" style="max-width:${width}px"
    role="img" aria-label="${perfEscape(label)}">
    <line x1="8" y1="${top + plot + 0.5}" x2="${width - 8}" y2="${top + plot + 0.5}"
      stroke="${VIZ_GRID}" stroke-width="1"></line>${marks}</svg>`;
};

// 가로 막대 — 게재지면 · 위치처럼 이름이 길고 개수가 많은 것
const vizBars = (rows, format, label) => {
  if (!rows.length) return '';
  const shown = rows.slice(0, 12);
  const name = 132;
  const gap = 10;
  const bar = 16;
  const plot = 300;
  const value = 78;
  const width = name + plot + value + 16;
  const height = shown.length * (bar + gap) + 8;
  const peak = Math.max(...shown.map((row) => row.value), 0) || 1;

  const marks = shown.map((row, i) => {
    const y = 4 + i * (bar + gap);
    const size = Math.max(row.value <= 0 ? 0 : 2, Math.round((row.value / peak) * plot));
    return `<g><title>${perfEscape(row.name)} · ${perfEscape(format(row.value))}</title>
      ${vizText(name - 8, y + bar - 4, vizFit(row.name, name - 8, 10), { anchor: 'end' })}
      <path d="${vizCapPath(name, y, size, bar, 'right')}" fill="${VIZ_SERIES[0]}"></path>
      ${vizText(name + size + 7, y + bar - 4, format(row.value), { anchor: 'start', fill: VIZ_INK })}</g>`;
  }).join('');

  return `<svg class="viz" viewBox="0 0 ${width} ${height}" style="max-width:${width}px"
    role="img" aria-label="${perfEscape(label)}">${marks}</svg>`;
};

// 가로 100% 막대 한 줄 — 성별처럼 나눠 갖는 것
const vizShare = (parts, format, label) => {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  if (!total) return '';
  const width = 520;
  const bar = 26;
  let at = 0;
  const marks = parts.map((part, i) => {
    const size = (part.value / total) * width;
    const x = at;
    at += size;
    const share = Math.round((part.value / total) * 100);
    // 칸이 좁으면 안에 글자를 넣지 않는다 (잘려 보이느니 없는 편이 낫다)
    const inside = size > 42
      ? `<text x="${x + size / 2}" y="${bar / 2 + 4}" text-anchor="middle" fill="#fff"
          font-size="10" font-weight="700">${share}%</text>` : '';
    return `<g><title>${perfEscape(part.name)} · ${perfEscape(format(part.value))} (${share}%)</title>
      <rect x="${x}" y="0" width="${Math.max(size - 2, 0)}" height="${bar}" rx="3"
        fill="${VIZ_SERIES[i % VIZ_SERIES.length]}"></rect>${inside}</g>`;
  }).join('');

  return `<svg class="viz" viewBox="0 0 ${width} ${bar}" style="max-width:${width}px"
    role="img" aria-label="${perfEscape(label)}">${marks}</svg>`;
};

// 쌓은 세로 막대 — 연령 × 성별
const vizStacks = (groups, series, format, label) => {
  if (!groups.length) return '';
  const band = 74;
  const bar = 34;
  const top = 28;
  const plot = 132;
  const foot = 30;
  const width = groups.length * band + 16;
  const height = top + plot + foot;
  const peak = Math.max(...groups.map((group) => group.total), 0) || 1;

  const marks = groups.map((group, i) => {
    const x = 8 + i * band + (band - bar) / 2;
    const size = Math.max(group.total <= 0 ? 0 : 2, Math.round((group.total / peak) * plot));
    // 아래에서 위로 쌓는다. 맨 위 칸만 끝을 둥글게 한다.
    const topPiece = series.reduce((found, name, k) => (group.values[name] ? k : found), -1);
    let at = top + plot;
    const pieces = series.map((name, k) => {
      const value = group.values[name] || 0;
      if (!value) return '';
      const part = Math.round((value / group.total) * size);
      at -= part;
      const share = Math.round((value / group.total) * 100);
      const isTop = k === topPiece;
      // 2px 는 칸 사이를 띄우는 자리다. 테두리를 그리지 않고 바탕색으로 가른다.
      const path = vizCapPath(x, at, bar, Math.max(part - 2, 1), isTop ? 'top' : 'flat');
      const inside = part > 15
        ? `<text x="${x + bar / 2}" y="${at + part / 2 + 3}" text-anchor="middle" fill="#fff"
            font-size="9" font-weight="700">${share}%</text>` : '';
      return `<g><title>${perfEscape(group.name)} · ${perfEscape(name)} · ${perfEscape(format(value))} (${share}%)</title>
        <path d="${path}" fill="${VIZ_SERIES[k % VIZ_SERIES.length]}"></path>${inside}</g>`;
    }).join('');
    return `${pieces}${vizText(x + bar / 2, top + plot - size - 7, format(group.total), { fill: VIZ_INK })}
      ${vizText(x + bar / 2, top + plot + 15, group.name)}`;
  }).join('');

  return `<svg class="viz" viewBox="0 0 ${width} ${height}" style="max-width:${width}px"
    role="img" aria-label="${perfEscape(label)}">
    <line x1="8" y1="${top + plot + 0.5}" x2="${width - 8}" y2="${top + plot + 0.5}"
      stroke="${VIZ_GRID}" stroke-width="1"></line>${marks}</svg>`;
};

// 계열이 둘 이상이면 범례를 반드시 둔다. 색만으로 구분하게 두지 않는다.
const vizLegend = (names) => names.length < 2 ? '' : `<div class="viz-legend">${names.map((name, i) =>
  `<span><i style="background:${VIZ_SERIES[i % VIZ_SERIES.length]}"></i>${perfEscape(name)}</span>`).join('')}</div>`;



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

  // 시트에서 실제로 쓰인 행사채널 → 매출채널(영문). 설정 탭 K:L 과 같은 표다.
  const SALES = [
    ['네이버', 'naver'], ['오늘의집', 'ohouse'], ['카카오', 'kakao'], ['CJ', 'cj'],
    ['G마켓', 'gmarket'], ['29CM', '29cm'], ['컬리', 'kurly'], ['이마트', 'emart'],
    ['11번가', '11st'], ['하이마트', 'himart'], ['전자랜드', 'etland'], ['현대홈쇼핑', 'hyundai'],
    ['롯데홈쇼핑', 'lotte'], ['롯데', 'lotte'], ['쿠팡', 'coupang'], ['자사몰', 'officialWebsite'],
    ['공구', 'groupbuy'], ['오프라인', 'offline'], ['이벤트', 'event'], ['KOL 라이브', 'kolLive'],
  ];
  const CHANNELS = SALES.map(([label]) => label);

  // 상품명 → 제품코드(영문). 설정 탭 H:I 와 같은 표다.
  const PRODUCT_CODES = [
    ['더플렌더MAX', 'flender-max'], ['더플렌더mini', 'flender-mini'], ['더플렌더', 'flender'],
    ['더플렌더PLUS', 'flender-plus'], ['더슬림', 'theslim'], ['더시프트', 'theshift'],
    ['더에어드라이', 'theairdry'], ['식기세척기', 'dishwasher'], ['건조기', 'dryer'],
    ['건조기필터', 'dryerfilter'], ['건조기시트', 'dryersheets'], ['하드필터', 'hardfilter'],
    ['하드락필터', 'hardfilter-rock'], ['푸드컨테이너', 'foodcontainer'], ['식기세제', 'dishdetergent'],
    ['악세사리', 'accessories'],
  ];
  const PRODUCTS = PRODUCT_CODES.map(([label]) => label);

  // 시트 칸에 넣을 영어값. 짝이 없으면 적은 그대로 둔다.
  const codeFor = (table, name) => (table.find(([label]) => label === name) || [, name])[1] || '';

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

  const defaults = { date: todayIso(), channel: CHANNELS[0], product: '', event: '', media: '', type: MESSAGE_TYPES[0][0], vertical: false, customTypes: [], customMedia: [], autoEvent: '' };
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
      // 매체는 코드가 없어 이름만 담는다 (예전 저장값에는 이 항목이 없다)
      state.customMedia = (Array.isArray(state.customMedia) ? state.customMedia : [])
        .filter((entry) => typeof entry === 'string' && entry.trim());
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

  // 행사명 = 행사일자(YYMMDD) + '-' + 행사채널(영문). 예) 260909-ohouse
  const eventName = () => {
    const [year, month, day] = (state.date || '').split('-');
    const stamp = year && month && day ? `${year.slice(2)}${month}${day}` : '';
    const code = codeFor(SALES, state.channel);
    return stamp && code ? `${stamp}-${code}` : '';
  };

  // 날짜 · 채널이 바뀌면 행사명을 다시 만든다.
  // 손으로 고쳐 둔 이름은 건드리지 않는다 — 우리가 채워 둔 값과 같을 때만 바꾼다.
  const syncEvent = () => {
    const wanted = eventName();
    if (!wanted) return false;
    const now = (state.event || '').trim();
    if (now && now !== (state.autoEvent || '')) return false;
    state.autoEvent = wanted;
    if (now === wanted) return false;
    state.event = wanted;
    return true;
  };

  // 최종행사명 = 행사일자(YYMMDD) + 상품명 + 행사채널 + 행사명 (시트 표기 순서)
  const finalName = () => {
    const [year, month, day] = (state.date || '').split('-');
    const stamp = year && month && day ? `${year.slice(2)}${month}${day}` : '';
    return [stamp, state.product, state.channel, state.event.trim()].filter(Boolean).join('_');
  };

  /* 시트에 이미 나간 마지막 번호. 이 브라우저 기록만 세면 다른 PC 에서 발번한 번호와
     겹친다 — 적재 시트가 원본이다. 받아 두고 그 위에서 이어 쓴다. */
  let sheetTop = {};          // 코드 → 시트에 있는 가장 큰 번호
  let seqState = 'idle';      // idle · loading · done · fail
  let seqNote = '';
  let seqWait = null;         // 받아 오는 중인 약속 (발번을 여기에 매단다)

  const pullSeq = () => {
    if (seqWait) return seqWait;
    seqState = 'loading';
    seqWait = window.fetch(SHEET_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'filenameSeq' }),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((data) => {
        if (!data || !data.ok) throw new Error((data && data.error) || '순번을 읽지 못했습니다');
        sheetTop = data.top || {};
        seqState = 'done';
        seqNote = '';
      })
      .catch((error) => {
        // 못 읽어도 발번은 막지 않는다. 대신 번호가 이 브라우저 기준이라고 알린다.
        seqState = 'fail';
        seqNote = `시트에서 마지막 번호를 못 읽었습니다 — 이 브라우저 기록으로 번호를 붙입니다 (${error.message})`;
      })
      .then(() => {
        seqWait = null;
        if (!filenameTool.hidden && !modal.open && !typeOpen) render();
      });
    return seqWait;
  };

  // 파일명 = 메시지코드-순번 (시트의 마지막 번호에서 이어서)
  const nextSequence = (code) => {
    const base = (SEQ_BASE.find(([c]) => c === code) || [, 0])[1];
    const mine = issued.filter((entry) => entry.code === code).map((entry) => entry.seq);
    return Math.max(base, sheetTop[code] || 0, watermark[code] || 0, ...mine, 0) + 1;
  };

  const scrollToList = () => {
    const head = filenameTool.querySelector('.tool-list-head');
    if (!head || typeof head.scrollIntoView !== 'function') return;
    try { head.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch { /* 스크롤 미지원 환경 */ }
  };

  /* 시트를 아직 못 읽었으면 기다린 뒤에 붙인다. 겹친 번호를 내주지 않게.
     못 읽는 것으로 끝난 때(fail)는 막지 않고 이 브라우저 기록으로 붙인다. */
  const issueOne = () => {
    const code = codeOf(state.type);
    if (!code) return;
    if (seqState === 'idle' || seqState === 'loading') {
      seqNote = '시트에서 마지막 번호를 확인하는 중…';
      render();
      pullSeq().then(() => issueNumber(code));
      return;
    }
    issueNumber(code);
  };

  const issueNumber = (code) => {
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

  // 시트 칸에는 상품명 · 행사채널을 **설정 탭의 영어값**으로 넣는다.
  // (화면에서는 한글로 고르고, 시트에는 flender-max · naver 로 들어간다)
  const rowsForSheet = (list) => list.map((entry) => Object.fromEntries(
    SHEET_COLUMNS.map((column) => {
      const value = entry[column.key] || '';
      if (column.key === 'product') return [column.key, codeFor(PRODUCT_CODES, value)];
      if (column.key === 'channel') return [column.key, codeFor(SALES, value)];
      return [column.key, value];
    }),
  ));

  const markSent = (list) => {
    const ids = new Set(list.map((entry) => entry.id));
    issued = issued.map((entry) => (ids.has(entry.id) ? { ...entry, sent: true } : entry));
    save();
    render();
  };

  // 콘텐츠 T&D 시트에도 파일명을 넣는다. 문구는 비워 둔다 — 그건 T&D 화면에서 채운다.
  // 행사명이 곧 그 시트의 블록 이름이라 행사명별로 나눠 보낸다.
  const sendToTnd = (list) => {
    const groups = new Map();
    list.forEach((entry) => {
      const campaign = String(entry.event || '').trim();
      if (!campaign || !entry.media || !entry.filename) return;
      if (!groups.has(campaign)) groups.set(campaign, []);
      groups.get(campaign).push({ media: entry.media, filename: entry.filename });
    });
    if (!groups.size) return Promise.resolve([]);
    return Promise.all([...groups].map(([campaign, rows]) => window.fetch(SHEET_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'tndFilenames', campaign, rows }),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((body) => {
        if (!body.ok) throw new Error(body.error || 'T&D 시트에 넣지 못했습니다');
        return body;
      })));
  };

  const sendToSheet = (button) => {
    const list = pending();
    if (!list.length) return;
    button.disabled = true;
    button.classList.add('is-sending');
    tndNote = '';
    window.fetch(SHEET_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ columns: SHEET_COLUMNS, rows: rowsForSheet(list) }),
    })
      .then((response) => (response.ok ? response.json().catch(() => ({ ok: true })) : Promise.reject(new Error('HTTP ' + response.status))))
      .then(() => {
        // UTM 시트는 끝났다. T&D 쪽이 실패해도 발번은 이미 적재된 것이라 되돌리지 않는다.
        markSent(list);
        pullSeq();          // 방금 넣은 줄까지 시트 기준으로 다시 받아 둔다
        return sendToTnd(list)
          .then((answers) => {
            // 매체 계열마다 탭이 하나씩이라 여러 탭에 나뉘어 들어간다
            const added = answers.reduce((into, one) => into.concat(one.added || []), []);
            const kept = answers.reduce((sum, one) => sum + (one.kept || 0), 0);
            const parts = [];
            if (added.length) parts.push(`소재문구 탭에 넣었습니다 · ${added.join(' · ')}`);
            if (kept) parts.push(`이미 있던 ${kept}줄은 그대로 뒀습니다`);
            tndNote = parts.join('  |  ') || '소재문구 탭에 넣을 것이 없었습니다';
            render();
          })
          .catch((error) => {
            tndNote = `UTM 시트는 적재됐지만 소재문구 탭에 못 넣었습니다 — ${error.message}`;
            render();
          });
      })
      .catch((error) => {
        button.disabled = false;
        button.classList.remove('is-sending');
        window.alert('시트 적재에 실패했습니다.\n' + error.message + '\n\n'
          + '잠시 뒤 다시 시도하고, 계속 실패하면 [파일명만 복사] 로 시트에 붙여넣어 주세요.');
      });
  };

  // 기본 목록 뒤에 직접 추가한 매체를 잇는다 (매체는 코드가 없어 이름뿐이다)
  const allMediaOptions = () => [...MEDIA_OPTIONS, ...state.customMedia];

  let modal = { open: false, kind: 'type', name: '', code: '', error: '' };

  const openCustomModal = (kind = 'type') => {
    modal = { open: true, kind, name: '', code: '', error: '' };
    render();
    filenameTool.querySelector('[data-new="name"]')?.focus();
  };

  const closeCustomModal = () => {
    modal = { open: false, kind: 'type', name: '', code: '', error: '' };
    render();
  };

  const registerCustomMedia = () => {
    const name = modal.name.trim();
    if (!name) return (modal.error = '매체명을 적어 주세요.'), render();
    if (allMediaOptions().some((value) => value === name)) return (modal.error = '이미 있는 매체명입니다.'), render();
    state.customMedia = [...state.customMedia, name];
    state.media = name;
    modal = { open: false, kind: 'type', name: '', code: '', error: '' };
    save();
    render();
  };

  const removeCustomMedia = (name) => {
    state.customMedia = state.customMedia.filter((value) => value !== name);
    if (state.media === name) state.media = '';
    save();
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
    modal = { open: false, kind: 'type', name: '', code: '', error: '' };
    save();
    issueOne();
  };

  const submitModal = () => (modal.kind === 'media' ? registerCustomMedia() : registerCustomType());

  const customModalMarkup = () => {
    if (!modal.open) return '';
    const isMedia = modal.kind === 'media';
    return `
      <div class="tool-modal">
        <div class="tool-modal-backdrop"></div>
        <div class="tool-modal-panel" role="dialog" aria-label="${isMedia ? '매체 직접 추가' : '메시지 유형 직접 추가'}">
          <h3>${isMedia ? '매체 직접 추가' : '메시지 유형 직접 추가'}</h3>
          ${isMedia
            ? `<label><span class="setup-req">매체(국문)</span><input type="text" data-new="name" value="${escapeHtml(modal.name)}" placeholder="예: 네이버-파워링크"></label>
               <p class="tool-modal-hint">이 화면의 매체는 파일명 · 시트 기록에만 쓰여서 영문 코드가 없습니다.<br>이 브라우저에만 저장됩니다.</p>`
            : `<label>메시지 유형명<input type="text" data-new="name" value="${escapeHtml(modal.name)}" placeholder="예: 신년 프로모션"></label>
               <label>파일명<input type="text" data-new="code" value="${escapeHtml(modal.code)}" placeholder="예: newyear"></label>
               <p class="tool-modal-hint">파일명은 영문 · 숫자만 됩니다. 한글 · 띄어쓰기 · 특수문자는 넣을 수 없습니다.</p>`}
          ${modal.error ? `<p class="tool-modal-error">${escapeHtml(modal.error)}</p>` : ''}
          <div class="tool-modal-actions">
            <button type="button" class="tool-modal-cancel">취소</button>
            <button type="button" class="tool-modal-submit">등록</button>
          </div>
        </div>
      </div>`;
  };

  // 직접 추가한 매체는 select 에서 지울 수 없어 칩으로 따로 보여준다
  const customMediaChips = () => (state.customMedia.length ? `
    <div class="utm-custom-list">
      <span>직접 추가한 매체</span>
      ${state.customMedia.map((value) => `<span class="utm-custom-chip is-media">
        <b>${escapeHtml(value)}</b>
        <button type="button" class="tool-media-remove" data-name="${escapeHtml(value)}" aria-label="${escapeHtml(value)} 삭제" title="삭제"><i data-lucide="x"></i></button>
      </span>`).join('')}
    </div>` : '');

  let typeOpen = false;
  let typeQuery = '';
  // 최종완료 뒤에 소재문구 탭 적재 결과를 한 줄로 알려 준다
  let tndNote = '';

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
    // 시트를 아직 안 읽었으면 번호를 미리 못 보여 준다 (옛 번호를 띄우면 오해한다)
    const preview = code ? (seqState === 'idle' || seqState === 'loading' ? `${code}-…` : `${code}-${seq}`) : '';
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
          <label class="tool-wide">행사명
            <span class="tool-with-copy">
              <input type="text" data-field="event" value="${escapeHtml(state.event)}" placeholder="예: 260901-naver">
              <button type="button" class="tool-copy tool-copy-inline" data-copy-field="event"
                title="행사명 복사"><i data-lucide="copy"></i>복사</button>
            </span>
          </label>
        </div>
        <div class="tool-grid tool-grid-second">
          <label>매체<select data-field="media"><option value=""${state.media ? '' : ' selected'}>선택 안 함</option>${allMediaOptions().map((value) => `<option${value === state.media ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('')}<option value="${CUSTOM_OPTION}">+ 직접 추가…</option></select></label>
          <div class="tool-field">메시지 유형${typeControl()}</div>
        </div>
        ${customMediaChips()}
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
          <thead><tr><th>파일명</th><th>매체</th><th>메시지 유형</th><th></th></tr></thead>
          <tbody>${issued.map((entry) => `<tr data-id="${entry.id}"${entry.vertical ? ' class="is-vertical"' : ''}>
            <td><code>${escapeHtml(entry.filename)}</code></td>
            <td>${escapeHtml(entry.media) || '<span class="tool-blank">-</span>'}</td>
            <td>${escapeHtml(entry.type)}</td>
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
        <button type="button" class="tool-open-sheet" data-open="utm" title="UTM 적재 시트를 새 탭으로 엽니다">
          <i data-lucide="external-link"></i>적재확인(utm)</button>
        <button type="button" class="tool-open-sheet" data-open="tnd" title="적재 시트를 새 탭으로 엽니다 (소재문구-매체 탭들이 그 안에 있습니다)">
          <i data-lucide="external-link"></i>적재확인(T&amp;D)</button>
        <small>입력값과 발번 목록을 모두 비웁니다. 이미 나간 번호는 다시 쓰지 않습니다.</small>
      </div>
      ${seqNote ? `<p class="tool-seq-note${seqState === 'fail' ? ' is-warn' : ''}">${escapeHtml(seqNote)}</p>` : ''}
      ${tndNote ? `<p class="tool-tnd-note">${escapeHtml(tndNote)}</p>` : ''}`;
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
  // 찾기 칸을 다시 그리고 커서를 끝으로 돌려놓는다
  const redrawSearch = () => {
    render();
    const box = filenameTool.querySelector('[data-search]');
    if (box) {
      box.focus();
      box.setSelectionRange(box.value.length, box.value.length);
    }
  };

  // 한글 조합이 끝나면 그때 그린다 ('사이즈' 를 한 낱말로 받는다)
  filenameTool.addEventListener('compositionend', (event) => {
    const search = event.target.closest('[data-search]');
    if (!search) return;
    typeQuery = search.value;
    redrawSearch();
  });

  filenameTool.addEventListener('input', (event) => {
    const search = event.target.closest('[data-search]');
    if (search) {
      typeQuery = search.value;
      // 조합 중(한글을 만들고 있는 중)에는 그리지 않는다. compositionend 가 받아 그린다.
      if (event.isComposing) return;
      redrawSearch();
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
    // 손으로 고친 행사명은 그대로 둔다 (자동으로 다시 만들지 않는다)
    if (field.dataset.field === 'event') state.autoEvent = '';
    save();
  });

  filenameTool.addEventListener('change', (event) => {
    const field = event.target.closest('[data-field]');
    if (!field || (field.tagName !== 'SELECT' && field.type !== 'date' && field.type !== 'checkbox')) return;
    // "직접 추가…" 를 고르면 값은 그대로 두고 입력창을 띄운다
    if (field.dataset.field === 'media' && field.value === CUSTOM_OPTION) {
      field.value = state.media || '';
      return openCustomModal('media');
    }
    state[field.dataset.field] = field.type === 'checkbox' ? field.checked : field.value;
    if (field.dataset.field === 'date' || field.dataset.field === 'channel') syncEvent();
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
    if (event.target.closest('.tool-modal-submit')) return submitModal();
    if (event.target.closest('.tool-modal-cancel') || event.target.closest('.tool-modal-backdrop')) return closeCustomModal();

    const mediaRemove = event.target.closest('.tool-media-remove');
    if (mediaRemove) return removeCustomMedia(mediaRemove.dataset.name);

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
    if (copy) {
      // 입력 칸 옆의 복사 단추는 **지금 칸에 적힌 값**을 복사한다.
      // data-copy 는 그린 순간의 값이라, 손으로 고친 뒤에는 옛 값이 담겨 있다.
      const from = copy.dataset.copyField
        ? (filenameTool.querySelector(`[data-field="${copy.dataset.copyField}"]`)?.value || '')
        : copy.dataset.copy;
      return copyText(from, copy);
    }

    if (event.target.closest('.tool-add')) return issueOne();

    const openSheet = event.target.closest('.tool-open-sheet');
    if (openSheet) {
      window.open(SHEET_URL, '_blank', 'noopener');
      return;
    }

    const submit = event.target.closest('.tool-submit');
    if (submit) return sendToSheet(submit);

    if (event.target.closest('.tool-reset')) {
      if (issued.length && !window.confirm(`입력값과 발번 목록 ${issuedCount()}건을 모두 지울까요?`)) return;
      state = { date: '', channel: '', product: '', event: '', media: '', type: '', vertical: false, customTypes: state.customTypes, customMedia: state.customMedia };
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
      submitModal();
    }
  });

  // 처음 열 때도 행사명을 채워 둔다 (날짜는 오늘, 채널은 목록 첫 값이 들어가 있다)
  if (syncEvent()) save();
  render();
  pullSeq();          // 시트의 마지막 번호를 미리 받아 둔다 (발번을 기다리지 않게)
}


// ── 콘텐츠 일정 · [콘마] 소재 수급 일정 ─────────────────────────────────
// 노션 '[콘마] 소재 수급 일정' 페이지를 그대로 옮긴 화면이다.
//   https://cherry-geometry-59b.notion.site/39c6f442e191806c9d21f146f1e99703
// 칸 이름도 노션과 같다: 이름 · SKU · 전달 일자 · 수급 일자 · 광고 매체 · 참고사항 · 담당자
//   달력은 **전달 일자**에 놓고, 카드에는 수급 일자를 적는다 (노션 보기와 같은 규칙).
//   보기는 둘이다 — 캘린더 보기(읽기) · 표(고치기). 값은 시트 '소재수급일정' 에 있다.
// ── 카드 오른쪽 단추 메뉴 (복제 · 링크 복사 · 삭제) ────────────────
// 퍼포먼스일정 달력과 콘텐츠 일정 달력이 같은 것을 쓴다.
// 부르는 쪽은 무엇을 골랐는지만 받아 제 일을 한다.
const cardMenu = (() => {
  const box = document.createElement('div');
  box.className = 'card-menu';
  document.body.appendChild(box);
  let pick = null;                              // 고르면 부를 함수

  const close = () => { box.classList.remove('is-open'); pick = null; };

  box.addEventListener('mousedown', (event) => event.stopPropagation());
  box.addEventListener('click', (event) => {
    const item = event.target.closest('[data-menu]');
    if (!item) return;
    const run = pick;
    const key = item.dataset.menu;
    close();
    if (run) run(key);
  });
  window.addEventListener('mousedown', (event) => {
    if (box.classList.contains('is-open') && !box.contains(event.target)) close();
  });
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape') close(); });
  window.addEventListener('resize', close);
  window.addEventListener('scroll', close, true);

  return (event, items, run) => {
    event.preventDefault();
    pick = run;
    box.innerHTML = items.map((one) => `<button type="button" class="card-menu-item${one.warn ? ' is-warn' : ''}"
      data-menu="${one.key}"><i data-lucide="${one.icon}"></i>${one.label}</button>`).join('');
    box.classList.add('is-open');
    // 화면 밖으로 나가지 않게 살짝 밀어 준다
    const pad = 8;
    const left = Math.max(pad, Math.min(event.clientX, window.innerWidth - box.offsetWidth - pad));
    const top = Math.max(pad, Math.min(event.clientY, window.innerHeight - box.offsetHeight - pad));
    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    lucide.createIcons();
  };
})();

// 한 일을 짧게 알려 준다 (2초 뒤 사라진다)
const flashNote = (() => {
  const box = document.createElement('div');
  box.className = 'flash-note';
  document.body.appendChild(box);
  let timer = null;
  return (text) => {
    box.textContent = text;
    box.classList.add('is-open');
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => box.classList.remove('is-open'), 2000);
  };
})();

// 클립보드. 브라우저가 막으면(예: 권한 없음) 옛 방법으로 한 번 더 해 본다.
const copyText = (text) => {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => copyOldWay(text));
  }
  return copyOldWay(text);
};
const copyOldWay = (text) => new Promise((done, fail) => {
  const box = document.createElement('textarea');
  box.value = text;
  box.setAttribute('readonly', '');
  box.style.cssText = 'position:fixed;top:-1000px;opacity:0';
  document.body.appendChild(box);
  box.select();
  const ok = document.execCommand('copy');
  box.remove();
  if (ok) done(); else fail(new Error('복사 못 함'));
});

const contentSchedule = document.querySelector('#content-schedule');
if (contentSchedule) {
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const dayOf = (value) => new Date(`${value}T00:00:00`);
  const addDays = (date, count) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
  const today = iso(new Date());
  const newId = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const listOf = (value) => (Array.isArray(value) ? value : String(value || '').split(','))
    .map((one) => String(one).trim()).filter(Boolean);

  // 노션에서 쓰던 칩 색. SKU · 담당자는 정해진 색이 있고, 나머지는 회색이다.
  const SKU_COLOR = [['MAX', 'red'], ['mini', 'brown'], ['에어드라이', 'purple'],
    ['시프트', 'green'], ['슬림', 'blue']];
  const OWNER_COLOR = [['이정민', 'blue'], ['김서영', 'purple'], ['오해영', 'orange'], ['김진빈', 'green']];
  const colorOf = (table, name) => (table.find(([mark]) => String(name).indexOf(mark) >= 0) || [, 'gray'])[1];
  const chip = (name, tone) => `<span class="sup-chip is-${tone}">${escapeHtml(name)}</span>`;

  const KEY = 'minix-supply-v1';               // 사본 (시트를 못 읽을 때 화면을 띄운다)
  const KNOWN_KEY = 'minix-supply-known';
  const knownRead = () => {
    try {
      const kept = JSON.parse(localStorage.getItem(KNOWN_KEY) || '[]');
      return Array.isArray(kept) ? kept : [];
    } catch { return []; }
  };
  const knownWrite = (ids) => { try { localStorage.setItem(KNOWN_KEY, JSON.stringify(ids)); } catch { /* 거들기다 */ } };

  const normalize = (row = {}) => ({
    id: row.id || newId(),
    icon: row.icon || '',
    name: row.name || '',
    sku: listOf(row.sku),
    hand: /^\d{4}-\d{2}-\d{2}$/.test(row.hand || '') ? row.hand : '',
    take: /^\d{4}-\d{2}-\d{2}$/.test(row.take || '') ? row.take : '',
    media: listOf(row.media),
    note: row.note || '',
    owners: listOf(row.owners),
    color: row.color || '',
  });

  let rows = [];
  try {
    const kept = JSON.parse(localStorage.getItem(KEY) || 'null');
    rows = Array.isArray(kept) ? kept.map(normalize) : [];
  } catch { rows = []; }

  let view = 'cal';                            // cal | table
  let cursor = today.slice(0, 7);
  const chosen = { sku: [], owners: [] };      // 걸러 보기 (이 브라우저에서만, 새로 열면 풀린다)
  let note = '';
  let pulled = false;
  let saveWait = null;

  const cache = () => { try { localStorage.setItem(KEY, JSON.stringify(rows)); } catch { /* 거들기다 */ } };

  const save = () => {
    cache();
    if (saveWait) window.clearTimeout(saveWait);
    note = '저장 중…';
    tell();
    saveWait = window.setTimeout(() => {
      saveWait = null;
      askSheet({ action: 'supplyPut', rows: rows, base: knownRead(), by: '' })
        .then(() => {
          knownWrite(rows.map((one) => one.id));
          note = `저장됨 ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
        })
        .catch((reason) => { note = `시트에 저장 못 함 — ${reason.message} (이 브라우저에는 남아 있습니다)`; })
        .then(tell);
    }, 700);
  };

  const tell = () => {
    const box = contentSchedule.querySelector('.week-note');
    if (box) box.textContent = note;
  };

  const pull = (mine) => askSheet({ action: 'supplyGet' })
    .then((body) => {
      const got = (body.rows || []).map(normalize);
      const first = !pulled;
      pulled = true;
      let push = false;
      if (first && !mine) {
        const known = knownRead();
        const onlyHere = rows.filter((one) => !known.includes(one.id) && !got.some((there) => there.id === one.id));
        rows = got.concat(onlyHere);
        push = onlyHere.length > 0;
      } else {
        rows = got;
      }
      cache();
      knownWrite(got.map((one) => one.id));
      if (!push) note = rows.length ? '' : '시트에 일정이 없습니다';
      render();
      if (push) save();
    })
    .catch((reason) => {
      note = `시트에서 못 읽었습니다 — ${reason.message} (이 브라우저 값만 보입니다)`;
      render();
    });

  // ── 걸러 보기 (SKU · 담당자) ──────────────────────────────────
  // 퍼포먼스일정 필터와 같은 조작이다 — 칩을 누르면 켜지고, 여러 개는 '또는' 으로 걸린다.
  // 고를 거리는 지금 담긴 줄에서 뽑는다 (많이 나온 것이 앞).
  const FACETS = [
    { key: 'sku', label: 'SKU', icon: 'tag', colors: SKU_COLOR },
    { key: 'owners', label: '담당자', icon: 'users', colors: OWNER_COLOR },
  ];

  const facetOptions = (key) => {
    const tally = new Map();
    rows.forEach((row) => (row[key] || []).forEach((name) => tally.set(name, (tally.get(name) || 0) + 1)));
    return [...tally.entries()]
      .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0], 'ko'))
      .map(([name]) => name);
  };

  const anyFilter = () => FACETS.some((facet) => chosen[facet.key].length > 0);
  const visibleRows = () => (anyFilter()
    ? rows.filter((row) => FACETS.every((facet) => !chosen[facet.key].length
      || (row[facet.key] || []).some((name) => chosen[facet.key].includes(name))))
    : rows);

  const filters = () => {
    const lines = FACETS.map((facet) => {
      const options = facetOptions(facet.key);
      if (!options.length) return '';
      return `<div class="filter-row${chosen[facet.key].length ? ' is-active' : ''}">
        <span class="filter-label"><i data-lucide="${facet.icon}"></i>${escapeHtml(facet.label)}</span>
        <span class="filter-options">${options.map((name) => {
    const on = chosen[facet.key].includes(name);
    return `<button type="button" class="filter-chip sup-chip is-${colorOf(facet.colors, name)}${on ? ' is-on' : ''}"
            data-facet="${facet.key}" data-value="${escapeHtml(name)}" aria-pressed="${on}">${escapeHtml(name)}</button>`;
  }).join('')}</span>
      </div>`;
    }).join('');
    if (!lines) return '';
    return `<div class="sup-filters">${lines}
      ${anyFilter() ? `<div class="filter-summary">
        <button type="button" class="filter-clear">전체 보기</button>
        <span class="filter-count">${visibleRows().length}개 / ${rows.length}개</span>
      </div>` : ''}</div>`;
  };

  // ── 달력 ──────────────────────────────────────────────────────
  const dayText = (value) => (value
    ? `${Number(value.slice(0, 4))}년 ${Number(value.slice(5, 7))}월 ${Number(value.slice(8, 10))}일`
    : '');

  // 카드 하나가 덮는 기간. 전달 일자와 수급 일자 사이를 덮는다.
  // 어느 쪽이 앞인지는 줄마다 다르다 (사후 소재는 수급이 먼저다) — 그래서 이른 쪽 · 늦은 쪽으로 잡는다.
  const spanOf = (row) => {
    const both = [row.hand, row.take].filter(Boolean).sort();
    if (!both.length) return null;
    const from = both[0];
    const to = both[both.length - 1];
    // 두 날짜가 같은 날이면 왼쪽 끝은 전달, 오른쪽 끝은 수급을 잡는다 (표 칸 차례와 같게)
    if (from === to && row.hand && row.take) return { from: from, to: to, firstKey: 'hand', lastKey: 'take' };
    return { from: from, to: to, firstKey: row.hand === from ? 'hand' : 'take',
      lastKey: row.hand === to ? 'hand' : 'take' };
  };

  const KEY_NAME = { hand: '전달', take: '수급' };
  const shortDay = (value) => `${Number(value.slice(5, 7))}/${Number(value.slice(8, 10))}`;
  // 막대가 덮는 기간을 그대로 적는다 (이른 쪽 → 늦은 쪽). 같은 날이면 한 번만 적는다.
  const spanText = (row, span) => (span.from === span.to
    ? `${row.hand && row.take ? '전달·수급' : KEY_NAME[span.firstKey]} ${dayText(span.from)}`
    : `${KEY_NAME[span.firstKey]} ${shortDay(span.from)} → ${KEY_NAME[span.lastKey]} ${shortDay(span.to)}`);

  const cardHtml = (row, seg) => `<button type="button" class="sup-card${row.color === '주황' ? ' is-warm' : ''}${seg.opens ? ' is-start' : ''}${seg.closes ? ' is-end' : ''}"
    style="grid-column:${seg.start + 1}/span ${seg.end - seg.start + 1};grid-row:${seg.lane + 2}" data-open="${escapeHtml(row.id)}">
    <span class="sup-card-name">${row.icon ? `<em class="sup-icon">${escapeHtml(row.icon)}</em>` : ''}${escapeHtml(row.name) || '제목 없음'}</span>
    ${row.sku.length ? `<span class="sup-line">${row.sku.map((one) => chip(one, colorOf(SKU_COLOR, one))).join('')}</span>` : ''}
    <span class="sup-date">${escapeHtml(spanText(row, seg.span))}</span>
    ${row.note ? `<span class="sup-note">${escapeHtml(row.note)}</span>` : ''}
    ${row.owners.length ? `<span class="sup-line">${row.owners.map((one) => chip(one, colorOf(OWNER_COLOR, one))).join('')}</span>` : ''}
    ${seg.opens ? '<span class="cal-grab cal-grab-start" data-grab="start" title="시작일을 끌어 늘립니다"></span>' : ''}
    ${seg.closes ? '<span class="cal-grab cal-grab-end" data-grab="end" title="종료일을 끌어 늘립니다"></span>' : ''}
  </button>`;

  // 한 주 안에서 겹치지 않게 줄(lane)을 나눠 막대를 놓는다. (퍼포먼스일정 달력과 같은 방법)
  const weekSegments = (weekStart) => {
    const weekEnd = addDays(weekStart, 6);
    const segments = visibleRows()
      .map((row) => ({ row: row, span: spanOf(row) }))
      .filter((one) => one.span)
      .map((one) => ({ row: one.row, span: one.span, from: dayOf(one.span.from), to: dayOf(one.span.to) }))
      .filter((one) => one.to >= weekStart && one.from <= weekEnd)
      .map((one) => ({
        row: one.row,
        span: one.span,
        start: Math.max(0, Math.round((one.from - weekStart) / 86400000)),
        end: Math.min(6, Math.round((one.to - weekStart) / 86400000)),
        opens: one.from >= weekStart,
        closes: one.to <= weekEnd,
      }))
      .sort((a, b) => (a.start - b.start) || ((b.end - b.start) - (a.end - a.start)));

    const lanes = [];
    segments.forEach((seg) => {
      let lane = lanes.findIndex((taken) => taken <= seg.start);
      if (lane < 0) { lanes.push(0); lane = lanes.length - 1; }
      lanes[lane] = seg.end + 1;
      seg.lane = lane;
    });
    return segments;
  };

  const calendar = () => {
    const [year, month] = cursor.split('-').map(Number);
    const first = new Date(year, month - 1, 1);
    const gridStart = addDays(first, -first.getDay());
    const last = new Date(year, month, 0);
    const weekCount = Math.ceil((last.getDate() + first.getDay()) / 7);

    const weeks = [];
    for (let w = 0; w < weekCount; w += 1) {
      const weekStart = addDays(gridStart, w * 7);
      const cells = [];
      const heads = [];
      for (let d = 0; d < 7; d += 1) {
        const date = addDays(weekStart, d);
        const value = iso(date);
        const outside = date.getMonth() !== month - 1;
        const weekend = d === 0 || d === 6;
        const label = date.getDate() === 1 ? `${date.getMonth() + 1}월 1일` : String(date.getDate());
        cells.push(`<div class="cal-cell${outside ? ' is-out' : ''}${weekend ? ' is-weekend' : ''}" data-day="${value}"></div>`);
        heads.push(`<span class="cal-head-cell" data-day="${value}" style="grid-column:${d + 1};grid-row:1">
          <button type="button" class="cal-add" data-day="${value}" aria-label="일정 추가"><i data-lucide="plus"></i></button>
          <span class="cal-num${outside ? ' is-out' : ''}${value === today ? ' is-today' : ''}">${escapeHtml(label)}</span>
        </span>`);
      }
      // 끌고 있는 동안에는 붙잡아 둔 높이를 그대로 쓴다 (칸이 위아래로 밀리지 않게)
      const held = frozen && frozen[iso(weekStart)];
      weeks.push(`<div class="cal-week" data-start="${iso(weekStart)}">
        <div class="cal-cells">${cells.join('')}</div>
        <div class="cal-content"${held ? ` style="min-height:${held}px"` : ''}>
          ${heads.join('')}
          ${weekSegments(weekStart).map((seg) => cardHtml(seg.row, seg)).join('')}
        </div>
      </div>`);
    }

    return `<div class="sup-cal-head">
        <b>${year}년 ${month}월</b>
        <span class="sup-nav">
          <button type="button" class="sup-arrow" data-move="-1" aria-label="지난 달"><i data-lucide="chevron-left"></i></button>
          <button type="button" class="sup-today" data-move="0">오늘</button>
          <button type="button" class="sup-arrow" data-move="1" aria-label="다음 달"><i data-lucide="chevron-right"></i></button>
        </span>
      </div>
      <div class="cal-grid">
        <div class="cal-weekdays">${WEEKDAYS.map((one) => `<span>${one}</span>`).join('')}</div>
        ${weeks.join('')}
      </div>
      <p class="sup-hint">막대는 <b>전달 일자 ~ 수급 일자</b>를 덮습니다.
        몸통을 끌면 두 날짜가 <b>함께</b> 옮겨지고, 막대 <b>끝을 잡아 끌면</b> 그 쪽 날짜만 늘어납니다.
        빈 칸을 누르면 그 날짜로 새 일정을 적습니다.</p>`;
  };

  // ── 표 ────────────────────────────────────────────────────────
  const COLUMNS = [
    ['icon', '아이콘', 'text'],
    ['name', '이름', 'text'],
    ['sku', 'SKU', 'list'],
    ['hand', '전달 일자', 'date'],
    ['take', '수급 일자', 'date'],
    ['media', '광고 매체', 'list'],
    ['note', '참고사항', 'text'],
    ['owners', '담당자', 'list'],
  ];

  const table = () => `<div class="tool-table-wrap">
      <table class="tool-table sup-table">
        <thead><tr>${COLUMNS.map(([, label]) => `<th>${label}</th>`).join('')}<th>색</th><th></th></tr></thead>
        <tbody>${visibleRows().map((row) => `<tr data-id="${escapeHtml(row.id)}">
          ${COLUMNS.map(([key, , kind]) => `<td>${kind === 'date'
            ? `<input type="date" data-cell="${key}" value="${escapeHtml(row[key])}">`
            : `<input type="text" data-cell="${key}" value="${escapeHtml(kind === 'list' ? row[key].join(', ') : row[key])}"${kind === 'list' ? ' placeholder="쉼표로 여러 개"' : ''}>`}</td>`).join('')}
          <td><select data-cell="color"><option value=""${row.color ? '' : ' selected'}>기본</option><option value="주황"${row.color === '주황' ? ' selected' : ''}>주황</option></select></td>
          <td><button type="button" class="tool-row-drop" data-drop="${escapeHtml(row.id)}" title="줄 지우기"><i data-lucide="trash-2"></i></button></td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
    <div class="sup-table-foot">
      <button type="button" class="tool-add" data-add="row"><i data-lucide="plus"></i>새 일정</button>
      <small>달력은 <b>전달 일자</b>에 놓입니다. 카드에는 수급 일자가 적힙니다.</small>
    </div>`;

  const render = () => {
    contentSchedule.innerHTML = `
      <div class="sup-page">
        <div class="sup-title"><span class="sup-title-icon">⏰</span><h1>[콘마] 소재 수급 일정</h1></div>
        <p class="sup-sub">T&amp;D 검수 링크</p>
        <p class="sup-link"><i data-lucide="link"></i><a href="https://ad-creative-checker.onrender.com/" target="_blank" rel="noopener">Ad Review</a></p>

        <div class="sup-db-head">
          <h2>행사 광고 일정</h2>
          <span class="week-note">${escapeHtml(note)}</span>
          <button type="button" class="week-pull" title="시트에서 다시 불러옵니다"><i data-lucide="refresh-cw"></i>새로고침</button>
        </div>
        <div class="sup-tabs">
          <button type="button" class="sup-tab${view === 'cal' ? ' is-on' : ''}" data-view="cal"><i data-lucide="calendar"></i>캘린더 보기</button>
          <button type="button" class="sup-tab${view === 'table' ? ' is-on' : ''}" data-view="table"><i data-lucide="table"></i>표</button>
        </div>
        ${filters()}
        ${view === 'cal' ? calendar() : table()}
      </div>`;
    lucide.createIcons();
  };

  // ── 손대기 ────────────────────────────────────────────────────
  contentSchedule.addEventListener('click', (event) => {
    if (event.target.closest('.week-pull')) { note = '시트에서 불러오는 중…'; render(); pull(true); return; }

    const tab = event.target.closest('[data-view]');
    if (tab) { view = tab.dataset.view; render(); return; }

    const facet = event.target.closest('[data-facet]');
    if (facet) {
      const key = facet.dataset.facet;
      const value = facet.dataset.value;
      chosen[key] = chosen[key].includes(value)
        ? chosen[key].filter((one) => one !== value)
        : [...chosen[key], value];
      render();
      return;
    }
    if (event.target.closest('.filter-clear')) {
      FACETS.forEach((one) => { chosen[one.key] = []; });
      render();
      return;
    }

    const move = event.target.closest('[data-move]');
    if (move) {
      const step = Number(move.dataset.move);
      if (!step) cursor = today.slice(0, 7);
      else {
        const [year, month] = cursor.split('-').map(Number);
        const at = new Date(year, month - 1 + step, 1);
        cursor = `${at.getFullYear()}-${pad(at.getMonth() + 1)}`;
      }
      render();
      return;
    }

    if (event.target.closest('[data-add]')) return addRow(today);

    const drop = event.target.closest('[data-drop]');
    if (drop) {
      rows = rows.filter((row) => row.id !== drop.dataset.drop);
      save();
      render();
      return;
    }

    // 달력에서 카드를 누르면 옆칸에서 바로 고친다. 빈 칸을 누르면 그 날짜로 새로 적는다.
    const open = event.target.closest('[data-open]');
    if (open) return dragged ? undefined : openPeek(open.dataset.open);
    const plus = event.target.closest('.cal-add');
    if (plus) return addRow(plus.dataset.day);
    const cell = event.target.closest('.cal-cell') || event.target.closest('.cal-head-cell');
    if (cell) return addRow(cell.dataset.day);
  });

  // 표에서 고친 값을 담는다. 글자 칸은 input, 날짜 · 색은 change 로 온다.
  const takeCell = (target) => {
    const cell = target.closest('[data-cell]');
    const line = target.closest('tr[data-id]');
    if (!cell || !line) return false;
    const row = rows.find((one) => one.id === line.dataset.id);
    if (!row) return false;
    const key = cell.dataset.cell;
    const kind = (COLUMNS.find(([name]) => name === key) || [, , 'text'])[2];
    row[key] = kind === 'list' ? listOf(cell.value) : cell.value;
    save();
    return true;
  };

  contentSchedule.addEventListener('input', (event) => {
    if (event.target.type === 'date') return;    // 날짜는 change 에서 받는다
    takeCell(event.target);
  });
  contentSchedule.addEventListener('change', (event) => {
    if (takeCell(event.target) && event.target.dataset.cell === 'color') render();
  });

  // ── 옆칸 · 일정 적기 ──────────────────────────────────────────
  // 달력 빈 칸을 누르면 그 날짜로 줄을 하나 만들고 여기서 바로 적는다.
  // 아무것도 적지 않고 닫으면 만들었던 줄을 되돌린다 (빈 줄이 쌓이지 않게).
  const peek = document.createElement('div');
  peek.className = 'peek sup-peek';            // 퍼포먼스일정 옆칸과 구별한다
  document.body.appendChild(peek);

  let openId = null;
  let freshId = null;                          // 방금 만든 줄
  let pushed = false;                           // 그 줄을 시트로 이미 보냈는가

  const blank = (row) => !row.name.trim() && !row.icon.trim() && !row.note.trim()
    && !row.sku.length && !row.media.length && !row.owners.length;

  const FIELDS = [
    ['icon', '아이콘', 'smile', 'text'],
    ['sku', 'SKU', 'package', 'list'],
    ['hand', '전달 일자', 'calendar', 'date'],
    ['take', '수급 일자', 'calendar-check', 'date'],
    ['media', '광고 매체', 'megaphone', 'list'],
    ['owners', '담당자', 'user', 'list'],
    ['color', '색', 'palette', 'color'],
  ];

  const fieldBox = (row, field) => {
    const [key, , , kind] = field;
    if (kind === 'date') return `<span class="peek-date"><input type="date" data-edit="${key}" value="${escapeHtml(row[key])}"></span>`;
    if (kind === 'color') {
      return `<span class="peek-date"><select data-edit="color">
        <option value=""${row.color ? '' : ' selected'}>기본</option>
        <option value="주황"${row.color === '주황' ? ' selected' : ''}>주황</option>
      </select></span>`;
    }
    return `<input class="peek-input" data-edit="${key}" value="${escapeHtml(kind === 'list' ? row[key].join(', ') : row[key])}" placeholder="${kind === 'list' ? '쉼표로 여러 개' : '비어 있음'}">`;
  };

  const renderPeek = () => {
    const row = rows.find((one) => one.id === openId);
    if (!row) return closePeek();
    peek.innerHTML = `
      <div class="peek-backdrop"></div>
      <aside class="peek-panel" role="dialog" aria-label="일정 적기">
        <header class="peek-head">
          <button type="button" class="peek-close" aria-label="닫기"><i data-lucide="x"></i></button>
          <button type="button" class="peek-delete"><i data-lucide="trash-2"></i>삭제</button>
        </header>
        <textarea class="peek-title" rows="1" data-edit="name" placeholder="제목 없음">${escapeHtml(row.name)}</textarea>
        <div class="peek-props">
          ${FIELDS.map((field) => `<div class="peek-row">
            <span class="peek-label"><i data-lucide="${field[2]}"></i>${field[1]}</span>
            <div class="peek-value">${fieldBox(row, field)}</div>
          </div>`).join('')}
        </div>
        <textarea class="peek-body" data-edit="note" rows="4" spellcheck="false" placeholder="참고사항을 적습니다. (예: D-3 검수 필요)">${escapeHtml(row.note)}</textarea>
        <footer class="peek-footer">
          <p class="peek-warning" hidden>이름을 적어 주세요.</p>
          <button type="button" class="peek-done">다 적었습니다</button>
        </footer>
      </aside>`;
    peek.classList.add('is-open');
    lucide.createIcons();
  };

  const shutPeek = () => {
    openId = null;
    freshId = null;
    pushed = false;
    peek.innerHTML = '';
    peek.classList.remove('is-open');
  };

  const closePeek = () => {
    const row = rows.find((one) => one.id === openId);
    if (row && row.id === freshId && blank(row)) {
      rows = rows.filter((one) => one.id !== row.id);
      const send = pushed;
      shutPeek();
      if (send) save();
      render();
      return;
    }
    shutPeek();
  };

  const openPeek = (id) => {
    openId = id;
    renderPeek();
    peek.querySelector('.peek-title')?.focus();
  };

  const addRow = (day) => {
    const value = /^\d{4}-\d{2}-\d{2}$/.test(day || '') ? day : today;
    const row = normalize({ hand: value, take: value });
    // 새 줄은 SKU · 담당자가 비어 있어 걸러 보기에 걸린다. 안 보이면 놀라니 필터를 푼다.
    if (anyFilter()) FACETS.forEach((one) => { chosen[one.key] = []; });
    rows = [...rows, row];
    freshId = row.id;
    pushed = false;
    render();
    openPeek(row.id);
  };

  const takePeek = (target) => {
    const field = target.closest('[data-edit]');
    const row = rows.find((one) => one.id === openId);
    if (!field || !row) return false;
    const key = field.dataset.edit;
    const kind = (FIELDS.find((one) => one[0] === key) || [, , , 'text'])[3];
    row[key] = kind === 'list' ? listOf(field.value) : field.value;
    pushed = true;
    save();
    render();                                   // 달력·표도 같이 새로 그린다 (옆칸은 그대로 둔다)
    return true;
  };

  peek.addEventListener('input', (event) => { takePeek(event.target); });
  peek.addEventListener('change', (event) => { takePeek(event.target); });

  peek.addEventListener('click', (event) => {
    if (event.target.closest('.peek-backdrop') || event.target.closest('.peek-close')) return closePeek();
    if (event.target.closest('.peek-delete')) {
      const id = openId;
      shutPeek();
      rows = rows.filter((one) => one.id !== id);
      save();
      render();
      return;
    }
    if (event.target.closest('.peek-done')) {
      const row = rows.find((one) => one.id === openId);
      if (row && !row.name.trim()) {
        peek.querySelector('.peek-warning').hidden = false;
        peek.querySelector('.peek-title').focus();
        return;
      }
      freshId = null;                           // 적었으니 되돌리지 않는다
      closePeek();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && openId) closePeek();
  });

  // ── 카드 끌어 옮기기 · 늘리기 ─────────────────────────────────
  // 몸통을 끌면 전달·수급 일자가 같은 날수만큼 함께 움직인다.
  // 막대 끝을 잡아 끌면 그 쪽 날짜만 움직인다 (반대쪽 날짜를 넘지 않는다).
  let drag = null;
  let dragged = false;
  let frozen = null;                            // 끌 동안 붙잡아 둔 주 높이 (주 시작 → px)

  // 막대가 옮겨지면 그 주의 줄 수가 바뀌어 높이가 달라진다. 그러면 끌던 자리가
  // 다른 주로 읽혀 엉뚱한 날에 놓이므로, 끌기 시작할 때의 높이를 붙잡아 둔다.
  const freeze = () => {
    frozen = {};
    contentSchedule.querySelectorAll('.cal-week').forEach((week) => {
      const body = week.querySelector('.cal-content');
      if (body) frozen[week.dataset.start] = Math.round(body.getBoundingClientRect().height);
    });
  };

  const dayFromPoint = (x, y) => {
    const weeks = [...contentSchedule.querySelectorAll('.cal-week')];
    if (!weeks.length) return null;
    let week = weeks.find((one) => {
      const box = one.getBoundingClientRect();
      return y >= box.top && y <= box.bottom;
    });
    if (!week) week = y < weeks[0].getBoundingClientRect().top ? weeks[0] : weeks[weeks.length - 1];
    const box = week.getBoundingClientRect();
    const column = Math.max(0, Math.min(6, Math.floor(((x - box.left) / box.width) * 7)));
    return iso(addDays(dayOf(week.dataset.start), column));
  };

  contentSchedule.addEventListener('mousedown', (event) => {
    dragged = false;                            // 새로 누르면 앞선 끌기 표시를 지운다
    if (event.button !== 0) return;
    const card = event.target.closest('.sup-card');
    if (!card) return;
    const row = rows.find((one) => one.id === card.dataset.open);
    const span = row && spanOf(row);
    if (!span) return;
    const handle = event.target.closest('.cal-grab');
    drag = { id: row.id, mode: handle ? handle.dataset.grab : 'move',
      from: dayFromPoint(event.clientX, event.clientY),
      hand: row.hand, take: row.take, span: span };
    freeze();                                   // 끌 동안 칸이 밀리지 않게 높이를 붙잡는다
    document.body.classList.add(handle ? 'is-resizing' : 'is-dragging-card');
    event.preventDefault();
  });

  window.addEventListener('mousemove', (event) => {
    if (!drag) return;
    const row = rows.find((one) => one.id === drag.id);
    if (!row) { drag = null; return; }
    const at = dayFromPoint(event.clientX, event.clientY);
    if (!at) return;
    let hand = drag.hand;
    let take = drag.take;
    if (drag.mode === 'move') {
      // 몸통 끌기 — 두 날짜가 같은 날수만큼 함께 움직인다
      const shift = Math.round((dayOf(at) - dayOf(drag.from)) / 86400000);
      hand = drag.hand ? iso(addDays(dayOf(drag.hand), shift)) : '';
      take = drag.take ? iso(addDays(dayOf(drag.take), shift)) : '';
    } else if (drag.mode === 'start') {
      // 왼쪽 끝 — 이른 쪽 날짜만 움직인다 (늦은 쪽을 넘지 않는다)
      const value = at > drag.span.to ? drag.span.to : at;
      if (drag.span.firstKey === 'hand') hand = value; else take = value;
    } else {
      // 오른쪽 끝 — 늦은 쪽 날짜만 움직인다 (이른 쪽보다 앞서지 않는다)
      const value = at < drag.span.from ? drag.span.from : at;
      if (drag.span.lastKey === 'hand') hand = value; else take = value;
    }
    if (row.hand === hand && row.take === take) return;
    row.hand = hand;
    row.take = take;
    dragged = true;
    render();
  });

  window.addEventListener('mouseup', () => {
    document.body.classList.remove('is-dragging-card', 'is-resizing');
    if (!drag) return;
    drag = null;
    frozen = null;                              // 붙잡아 둔 높이를 풀어 준다
    if (!dragged) return;
    save();
    render();
    if (openId) renderPeek();
  });

  // ── 오른쪽 단추 메뉴 ─────────────────────────────────────────
  contentSchedule.addEventListener('contextmenu', (event) => {
    const card = event.target.closest('.sup-card');
    if (!card) return;
    const row = rows.find((one) => one.id === card.dataset.open);
    if (!row) return;
    cardMenu(event, [
      { key: 'twin', label: '복제', icon: 'copy' },
      { key: 'link', label: '링크 복사', icon: 'link' },
      { key: 'drop', label: '삭제', icon: 'trash-2', warn: true },
    ], (what) => {
      if (what === 'twin') {
        const twin = normalize({ ...row, id: '' });   // 같은 값 · 새 ID
        rows = [...rows, twin];
        save();
        render();
        flashNote('복제했습니다');
        return;
      }
      if (what === 'link') {
        copyText(`${location.origin}${location.pathname}#content-cal/${row.id}`)
          .then(() => flashNote('링크를 복사했습니다'))
          .catch(() => flashNote('복사를 못 했습니다 — 주소창의 주소를 그대로 쓰세요'));
        return;
      }
      if (openId === row.id) shutPeek();
      rows = rows.filter((one) => one.id !== row.id);
      save();
      render();
      flashNote('삭제했습니다');
    });
  });

  // 링크로 들어왔으면 (#content-cal/<ID>) 그 일정을 찾아 열어 준다
  const openLinked = () => {
    const mark = '#content-cal/';
    if (!location.hash.startsWith(mark)) return;
    const id = decodeURIComponent(location.hash.slice(mark.length));
    const row = rows.find((one) => one.id === id);
    if (!row) return;
    const day = row.hand || row.take;
    if (day) cursor = day.slice(0, 7);
    render();
    openPeek(id);
  };

  // 같은 탭에 링크를 붙여 넣으면 문서를 다시 읽지 않고 해시만 바뀐다 — 그때도 열어 준다
  window.addEventListener('hashchange', () => { if (pulled) openLinked(); });

  // 화면을 열 때 한 번만 받아 온다
  new MutationObserver(() => {
    if (contentSchedule.hidden) { closePeek(); return; }
    if (pulled) return;
    note = '시트에서 불러오는 중…';
    render();
    pull(false).then(openLinked);
  }).observe(contentSchedule, { attributes: true, attributeFilter: ['hidden'] });
  render();
  if (!contentSchedule.hidden) pull(false).then(openLinked);
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
    '        # 연결 상태를 추측하지 말고, 실제로 열리는지 먼저 본다.',
    '        # Get-SmbConnection 은 유휴·오프라인이면 비어 있고, Get-SmbMapping 에 남은 매핑은',
    '        # 쓸 수 있을 때도 못 쓸 때도 있다. 열리면 인증이 아예 필요 없고, 안 열릴 때만 인증한다.',
    '        if (Test-Path -LiteralPath $shareRoot) {',
    '            $usedMap = @(Get-SmbMapping -ErrorAction SilentlyContinue | Where-Object { $_.RemotePath -like "\\\\$srv\\*" -and $_.LocalPath })',
    '            $via = if ($usedMap.Count -gt 0) { " ($($usedMap[0].LocalPath) 매핑)" } else { "" }',
    '            Write-Host "NAS 이미 접근 가능$via - 인증 생략: $shareRoot"',
    '        } else {',
    '            $existingConn = @(Get-SmbConnection -ErrorAction SilentlyContinue | Where-Object { $_.ServerName -ieq $srv })',
    '            $sameUser = @($existingConn | Where-Object { $_.UserName -ieq $nasU })',
    '            if ($existingConn.Count -gt 0 -and $sameUser.Count -eq 0) {',
    '                Write-Host "[NAS 인증 중단] $srv 에 다른 계정($($existingConn[0].UserName))으로 이미 연결되어 있습니다."',
    '                Write-Host "  탐색기에서 해당 NAS 창을 닫고 연결된 네트워크 드라이브를 해제한 뒤 다시 실행하세요."',
    '                Write-Host "  (자동화가 다른 계정의 NAS 연결을 임의로 끊지 않습니다.)"',
    '                exit 1',
    '            }',
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
  ];
  const PURPOSES = [
    ['구매', 'purchase'], ['트래픽', 'traffic'], ['참여', 'participation'], ['잠재고객', 'prospect'],
    ['브랜딩', 'branding'], ['도달', 'reach'], ['가입', 'sign-up'], ['메시지', 'message'],
    ['친구추가', 'friend'], ['재생', 'view'],
  ];
  // 광고그룹명을 만들려면 행사채널이 필요하다. (파일명 화면과 같은 목록)
  // 영어값(매출채널)은 설정 탭 K:L 과 같은 표다. 시트에서 고친 값이 오면 그것을 먼저 쓴다.
  const SALES = [
    ['네이버', 'naver'], ['오늘의집', 'ohouse'], ['카카오', 'kakao'], ['CJ', 'cj'],
    ['G마켓', 'gmarket'], ['29CM', '29cm'], ['컬리', 'kurly'], ['이마트', 'emart'],
    ['11번가', '11st'], ['하이마트', 'himart'], ['전자랜드', 'etland'], ['현대홈쇼핑', 'hyundai'],
    ['롯데홈쇼핑', 'lotte'], ['롯데', 'lotte'], ['쿠팡', 'coupang'], ['자사몰', 'officialWebsite'],
    ['공구', 'groupbuy'], ['오프라인', 'offline'], ['이벤트', 'event'], ['KOL 라이브', 'kolLive'],
  ];
  const PRODUCTS = [
    ['더플렌더', 'flender'], ['더플렌더mini', 'flender-mini'], ['더플렌더PLUS', 'flender-plus'],
    ['더플렌더MAX', 'flender-max'], ['더슬림', 'theslim'], ['더시프트', 'theshift'],
    ['더에어드라이', 'theairdry'], ['식기세척기', 'dishwasher'], ['건조기', 'dryer'],
    ['건조기필터', 'dryerfilter'], ['건조기시트', 'dryersheets'], ['하드필터', 'hardfilter'],
    ['하드락필터', 'hardfilter-rock'], ['푸드컨테이너', 'foodcontainer'], ['식기세제', 'dishdetergent'],
    ['악세사리', 'accessories'],
  ];

  // 메타 광고 세팅과 같은 4가지. 고른 것이 목록 · 복사에 쓰인다.
  const URL_TYPES = [['url', 'URL'], ['linkGA', 'LINK(GA)'], ['nt', 'NT(네이버)'], ['fm', 'FM(라이브)']];

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

  // 목록에 없는 상품 · 매체는 여기에 직접 넣는다 (브라우저에만 남는다)
  const CUSTOM_OPTION = '__custom__';
  const CODE_RULE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

  const defaults = { part: PARTS[0], date: '', product: '', channel: '', event: '', owner: '', media: '', purpose: '', filenames: '', url: '', urlType: 'linkGA', customProducts: [], customMedia: [] };
  let state = { ...defaults };
  let entries = [];
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      state = { ...defaults, ...(saved.state || {}) };
      entries = Array.isArray(saved.entries) ? saved.entries : [];
    }
  } catch { /* 저장값이 깨졌으면 기본값으로 시작한다 */ }
  // 예전 저장값에는 직접 추가 목록이 없다
  state.customProducts = (Array.isArray(state.customProducts) ? state.customProducts : [])
    .filter((entry) => entry && entry.name && entry.code);
  state.customMedia = (Array.isArray(state.customMedia) ? state.customMedia : [])
    .filter((entry) => entry && entry.name && entry.source);
  /* 아직 적재하지 않은 줄은 시트에 함께 담는다. 그 PC 를 안 켜면 아무도 모르고,
     브라우저를 비우면 잃는다. **적재된 줄은 올리지 않는다** — 이미 파트 탭에 있다.
     그 줄은 이 브라우저에만 영수증처럼 남는다. localStorage 는 사본이다. */
  const KNOWN_KEY = 'minix-utm-wait-known';
  const knownRead = () => {
    try {
      const kept = JSON.parse(localStorage.getItem(KNOWN_KEY) || '[]');
      return Array.isArray(kept) ? kept : [];
    } catch { return []; }
  };
  const knownWrite = (ids) => { try { localStorage.setItem(KNOWN_KEY, JSON.stringify(ids)); } catch { /* 거들기다 */ } };

  let waitNote = '';
  let waitSaveWait = null;
  let waitSent = '';        // 시트에 마지막으로 올린 대기 목록 (그대로면 다시 안 보낸다)
  const waitTell = () => {
    const box = utmBuilder.querySelector('.week-note');
    if (box) box.textContent = waitNote;
  };
  const utmCache = () => localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, entries }));

  const save = () => {
    utmCache();
    // 폼 칸을 고칠 때도 save 가 불린다. 대기 줄이 그대로면 시트를 두드리지 않는다.
    if (JSON.stringify(entries.filter((entry) => !entry.sent)) === waitSent) return;
    if (waitSaveWait) window.clearTimeout(waitSaveWait);
    waitNote = '대기 줄 저장 중…';
    waitTell();
    waitSaveWait = window.setTimeout(() => {
      waitSaveWait = null;
      const mine = entries.filter((entry) => !entry.sent);
      const text = JSON.stringify(mine);
      // base = 이 화면이 아는 대기 줄 ID (설명은 주간소재요청 쪽과 같다)
      askSheet({ action: 'utmWaitPut', rows: mine, base: knownRead(), by: '' })
        .then(() => {
          waitSent = text;
          knownWrite(mine.map((one) => one.id));
          waitNote = mine.length
            ? `대기 ${mine.length}건 저장됨 ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`
            : '대기 줄 없음';
        })
        .catch((reason) => { waitNote = `시트에 저장 못 함 — ${reason.message} (이 브라우저에는 남아 있습니다)`; })
        .then(waitTell);
    }, 700);
  };

  /* 시트에서 받아 온다. 적재된 줄(영수증)은 이 브라우저 것을 그대로 두고, 대기 줄만 갈아 준다.
     처음 받을 때는 이 브라우저에만 있던 대기 줄을 버리지 않고 합쳐 올린다.
     시트가 한 번이라도 갖고 있던 ID 가 사라졌으면 남이 적재하거나 지운 것이라 되살리지 않는다. */
  let waitPulled = false;
  const pullWait = (mine) => askSheet({ action: 'utmWaitGet' })
    .then((body) => {
      const got = (body.rows || []).filter((one) => one && one.id);
      const sent = entries.filter((entry) => entry.sent);
      const first = !waitPulled;
      waitPulled = true;
      let push = false;
      if (first && !mine) {
        const known = knownRead();
        const onlyHere = entries.filter((one) => !one.sent && !known.includes(one.id)
          && !got.some((there) => there.id === one.id));
        entries = got.concat(onlyHere, sent);
        push = onlyHere.length > 0;
        if (push) waitNote = `이 브라우저에만 있던 대기 ${onlyHere.length}건을 시트에 올립니다`;
      } else {
        entries = got.concat(sent);
      }
      utmCache();
      knownWrite(got.map((one) => one.id));
      if (!push) waitSent = JSON.stringify(entries.filter((entry) => !entry.sent));
      if (!push) waitNote = got.length ? `시트의 대기 ${got.length}건` : '대기 줄 없음';
      render();
      if (push) save();
      else waitTell();
    })
    .catch((reason) => {
      waitNote = `시트에서 못 읽었습니다 — ${reason.message} (이 브라우저 값만 보입니다)`;
      waitTell();
    });

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
  // 시트 `설정` 탭에서 읽어 온 대응표. 시트가 수식의 기준표라 이쪽이 우선이다.
  // 못 읽어도(오프라인 · 배포 전) 아래 기본 목록으로 그대로 굴러간다.
  let sheetConfig = { media: [], product: [], sales: [] };
  let configState = 'idle'; // idle | loading | done | error
  let syncState = null;     // { at, state: saving|saved|failed, message }

  // 기본 목록 → 시트에서 읽은 것 → 이 브라우저에만 있는 것 순으로 잇는다 (이름 중복은 앞의 것을 남긴다)
  const merge = (base, extra) => {
    const out = [...base];
    extra.forEach((row) => { if (row[0] && !out.some(([label]) => label === row[0])) out.push(row); });
    return out;
  };
  const allProducts = () => merge(merge(PRODUCTS, sheetConfig.product), state.customProducts.map((entry) => [entry.name, entry.code]));
  const allMedia = () => merge(merge(MEDIA, sheetConfig.media), state.customMedia.map((entry) => [entry.name, entry.source, entry.medium]));
  // 행사채널 → 매출채널(영문). 시트에서 읽은 것이 있으면 그것을 먼저 쓴다.
  const allSales = () => merge(SALES, sheetConfig.sales || []);

  // 시트에 이미 있는 이름은 브라우저 전용 목록에서 지운다 (칩이 중복으로 남지 않게)
  const dropSynced = () => {
    const inSheet = (list, name) => list.some(([label]) => label === name);
    const before = state.customProducts.length + state.customMedia.length;
    state.customProducts = state.customProducts.filter((entry) => !inSheet(sheetConfig.product, entry.name));
    state.customMedia = state.customMedia.filter((entry) => !inSheet(sheetConfig.media, entry.name));
    if (before !== state.customProducts.length + state.customMedia.length) save();
  };

  const loadConfig = () => {
    if (configState === 'loading' || configState === 'done') return;
    configState = 'loading';
    window.fetch(SHEET_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'configList' }),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((data) => {
        if (!data || !data.ok) throw new Error((data && data.error) || '설정을 읽지 못했습니다');
        sheetConfig = {
          media: (data.media || []).filter((row) => row[0] && row[1]),
          product: (data.product || []).filter((row) => row[0] && row[1]),
          sales: (data.sales || []).filter((row) => row[0] && row[1]),
        };
        configState = 'done';
        dropSynced();
        render();
      })
      .catch(() => { configState = 'error'; render(); });
  };

  const productCode = (name) => (allProducts().find(([label]) => label === name) || [, tr(name)])[1];
  const salesCode = (name) => (allSales().find(([label]) => label === name) || [, ''])[1];
  // 고르는 칸에는 '한글 · 영문' 을 같이 적는다. 어떤 영어값으로 들어가는지 고를 때 보이게.
  // (고른 값 자체는 한글 그대로다 — 시트 수식이 한글을 열쇠로 찾기 때문이다)
  const withCode = (label, code) => (code ? `${label} · ${code}` : label);
  const purposeCode = (name) => (PURPOSES.find(([label]) => label === name) || [, tr(name)])[1];
  const mediaRow = (name) => allMedia().find(([label]) => label === name) || [, '', ''];

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
    ['LINK(GA)', 'linkGA', '랜딩링크를 채우면 만들어집니다'],
    ['NT(네이버)', 'nt', '네이버스토어 링크 뒤에 붙입니다'],
    ['FM(라이브)', 'fm', '쇼핑라이브 링크 뒤에 붙입니다'],
  ];

  const options = (list, picked, showCode) => list
    .map(([label, code]) => `<option value="${escapeHtml(label)}"${label === picked ? ' selected' : ''}>`
      + `${escapeHtml(showCode ? withCode(label, code) : label)}</option>`).join('');

  // 목록 맨 뒤에 "직접 추가…" 를 붙인 select 용 마크업
  const optionsWithCustom = (list, picked, showCode) =>
    `${options(list, picked, showCode)}<option value="${CUSTOM_OPTION}">+ 직접 추가…</option>`;

  // ── 상품 · 매체 직접 추가 ─────────────────────────────────────
  // 상품은 [이름, 코드], 매체는 [이름, utm_source, utm_medium] 이라 이름만으로는 부족하다.
  let modal = { open: false, kind: '', name: '', code: '', source: '', medium: '', error: '' };

  const openModal = (kind) => {
    modal = { open: true, kind, name: '', code: '', source: '', medium: '', error: '' };
    render();
    utmBuilder.querySelector('[data-new="name"]')?.focus();
  };
  const closeModal = () => {
    modal = { open: false, kind: '', name: '', code: '', source: '', medium: '', error: '' };
    render();
  };

  const registerCustom = () => {
    const name = tr(modal.name);
    if (!name) return (modal.error = modal.kind === 'product' ? '상품명(국문) 을 적어 주세요.' : '매체(국문) 을 적어 주세요.'), render();

    const codeError = (label) => `${label} 은 영문 · 숫자와 - _ 만 쓸 수 있습니다. (한글 · 띄어쓰기 불가)`;

    if (modal.kind === 'product') {
      const code = tr(modal.code);
      if (!code) return (modal.error = '상품명(영어) 를 적어 주세요.'), render();
      if (!CODE_RULE.test(code)) return (modal.error = codeError('상품명(영어)')), render();
      if (allProducts().some(([label]) => label === name)) return (modal.error = '이미 있는 상품명입니다.'), render();
      state.customProducts = [...state.customProducts, { name, code }];
      state.product = name;
    } else {
      const source = tr(modal.source);
      const medium = tr(modal.medium);
      if (!source) return (modal.error = 'source(매체영어) 를 적어 주세요.'), render();
      if (!CODE_RULE.test(source)) return (modal.error = codeError('source(매체영어)')), render();
      if (!medium) return (modal.error = 'medium(구좌) 를 적어 주세요.'), render();
      if (!CODE_RULE.test(medium)) return (modal.error = codeError('medium(구좌)')), render();
      if (allMedia().some(([label]) => label === name)) return (modal.error = '이미 있는 매체명입니다.'), render();
      state.customMedia = [...state.customMedia, { name, source, medium }];
      state.media = name;
    }

    const sent = modal.kind === 'product'
      ? { action: 'configAdd', kind: 'product', name, code: tr(modal.code) }
      : { action: 'configAdd', kind: 'media', name, source: tr(modal.source), medium: tr(modal.medium) };

    modal = { open: false, kind: '', name: '', code: '', source: '', medium: '', error: '' };
    save();
    render();

    // 시트 `설정` 탭에도 넣는다. 여기 없으면 적재된 줄의 UTM 수식이 값을 못 찾는다.
    // 실패해도 이 브라우저에서는 계속 쓸 수 있으므로 막지 않고 알리기만 한다.
    syncState = { at: sent.name, state: 'saving' };
    render();
    window.fetch(SHEET_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(sent),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((data) => {
        if (!data || !data.ok) throw new Error((data && data.error) || '시트가 거절했습니다');
        syncState = { at: sent.name, state: 'saved' };
        configState = 'idle';
        loadConfig();
        render();
      })
      .catch((error) => { syncState = { at: sent.name, state: 'failed', message: error.message }; render(); });
  };

  const removeCustom = (kind, name) => {
    if (kind === 'product') {
      state.customProducts = state.customProducts.filter((entry) => entry.name !== name);
      if (state.product === name) state.product = '';
    } else {
      state.customMedia = state.customMedia.filter((entry) => entry.name !== name);
      if (state.media === name) state.media = '';
    }
    save();
    render();
  };

  // 입력하는 대로 어떤 값이 들어갈지 보여준다
  const modalPreview = () => (modal.kind === 'product'
    ? `utm_content 에 <code>${escapeHtml(tr(modal.code) || 'code')}</code> 로 들어갑니다`
    : `utm_source=<code>${escapeHtml(tr(modal.source) || 'source')}</code> · utm_medium=<code>${escapeHtml(tr(modal.medium) || '(없음)')}</code>`);

  const customModal = () => {
    if (!modal.open) return '';
    const isProduct = modal.kind === 'product';
    return `
      <div class="tool-modal">
        <div class="tool-modal-backdrop"></div>
        <div class="tool-modal-panel" role="dialog" aria-label="${isProduct ? '상품명 직접 추가' : '매체 직접 추가'}">
          <h3>${isProduct ? '상품명 직접 추가' : '매체 직접 추가'}</h3>
          ${isProduct
            ? `<label><span class="setup-req">상품명(국문)</span><input type="text" data-new="name" value="${escapeHtml(modal.name)}" placeholder="예: 더플렌더AIR"></label>
               <label><span class="setup-req">상품명(영어)</span><input type="text" data-new="code" value="${escapeHtml(modal.code)}" placeholder="예: flender-air"></label>`
            : `<label><span class="setup-req">매체(국문)</span><input type="text" data-new="name" value="${escapeHtml(modal.name)}" placeholder="예: 네이버-파워링크"></label>
               <label><span class="setup-req">source(매체영어)</span><input type="text" data-new="source" value="${escapeHtml(modal.source)}" placeholder="예: naver"></label>
               <label><span class="setup-req">medium(구좌)</span><input type="text" data-new="medium" value="${escapeHtml(modal.medium)}" placeholder="예: powerlink"></label>`}
          <p class="tool-modal-hint">영어 칸은 영문 · 숫자와 <code>-</code> <code>_</code> 만 됩니다. 한글 · 띄어쓰기는 넣을 수 없습니다.<br><span class="utm-modal-preview">${modalPreview()}</span> · 이 브라우저에만 저장됩니다.</p>
          ${modal.error ? `<p class="tool-modal-error">${escapeHtml(modal.error)}</p>` : ''}
          <div class="tool-modal-actions">
            <button type="button" class="tool-modal-cancel">취소</button>
            <button type="button" class="tool-modal-submit">등록</button>
          </div>
        </div>
      </div>`;
  };

  // 시트에 아직 못 올라간 항목만 칩으로 보여준다 (올라가면 드롭다운에 그냥 남는다)
  const customChips = () => {
    const rows = [
      ...state.customProducts.map((entry) => ['product', entry.name, entry.code]),
      ...state.customMedia.map((entry) => ['media', entry.name, [entry.source, entry.medium].filter(Boolean).join(' / ')]),
    ];
    const note = syncState
      ? (syncState.state === 'saving' ? `<span class="utm-sync">시트에 올리는 중…</span>`
        : syncState.state === 'saved' ? `<span class="utm-sync is-ok"><b>${escapeHtml(syncState.at)}</b> 시트 설정 탭에 올렸습니다 · 팀 전체가 씁니다</span>`
          : `<span class="utm-sync is-bad"><b>${escapeHtml(syncState.at)}</b> 시트에 못 올렸습니다 (${escapeHtml(syncState.message || '')}) · 이 브라우저에서만 쓰입니다</span>`)
      : '';
    if (!rows.length && !note) return '';
    return `<div class="utm-custom-list">
      ${rows.length ? `<span>이 브라우저에만 있음</span>
      ${rows.map(([kind, name, code]) => `<span class="utm-custom-chip${kind === 'media' ? ' is-media' : ''}">
        <b>${escapeHtml(name)}</b><small>${escapeHtml(code)}</small>
        <button type="button" class="utm-custom-remove" data-kind="${kind}" data-name="${escapeHtml(name)}" aria-label="${escapeHtml(name)} 삭제" title="삭제"><i data-lucide="x"></i></button>
      </span>`).join('')}` : ''}
      ${note}
    </div>`;
  };

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
          <label>매체<select data-field="media"><option value=""${state.media ? '' : ' selected'}>선택 안 함</option>${optionsWithCustom(allMedia(), state.media)}</select></label>
          <label>목적<select data-field="purpose"><option value=""${state.purpose ? '' : ' selected'}>선택 안 함</option>${options(PURPOSES, state.purpose)}</select></label>
          <label>행사일자<input type="date" data-field="date" value="${escapeHtml(state.date)}"></label>
          <label>상품명<select data-field="product"><option value=""${state.product ? '' : ' selected'}>선택 안 함</option>${optionsWithCustom(allProducts(), state.product, true)}</select></label>
          <label>행사채널<select data-field="channel"><option value=""${state.channel ? '' : ' selected'}>선택 안 함</option>${options(allSales(), state.channel, true)}</select></label>
          <label>행사명<input type="text" data-field="event" value="${escapeHtml(state.event)}" placeholder="예: 음쓰해방위크"></label>
          <label>담당자 <small class="utm-hint">*이니셜 등록</small><input type="text" data-field="owner" list="utm-owner-list" value="${escapeHtml(state.owner)}" placeholder="예: ohy" autocomplete="off">
            <datalist id="utm-owner-list">${OWNERS.map((value) => `<option value="${escapeHtml(value)}"></option>`).join('')}</datalist></label>
          <label class="tool-wide">랜딩링크<input type="text" data-field="url" value="${escapeHtml(state.url)}" placeholder="https://minix.life/… (비우면 ? 로 시작하는 파라미터만 나옵니다)"></label>
          <div class="setup-field tool-wide"><span>URL 유형<small class="setup-hint">목록과 복사에 쓸 값</small></span>${pills('urltype', URL_TYPES, state.urlType)}</div>
          <label class="tool-wide">파일명 <small class="utm-hint">한 줄에 하나씩 · ${names.length}건</small><textarea data-field="filenames" rows="3" placeholder="benefit-537&#10;urgency-449">${escapeHtml(state.filenames)}</textarea></label>
        </div>
        ${customChips()}
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
          <span class="week-note">${escapeHtml(waitNote)}</span>
          <button type="button" class="week-pull" title="시트에서 대기 줄을 다시 불러옵니다"><i data-lucide="refresh-cw"></i>새로고침</button>
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
      </div>
      ${customModal()}`;
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
    if (parts[1] && allProducts().some(([label]) => label === parts[1])) state.product = parts[1];
    if (found.media && allMedia().some(([label]) => label === found.media)) state.media = found.media;
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
    ['제품코드', (entry) => productCode(entry.product) || ''],
    ['행사채널', (entry) => entry.channel || ''],
    ['매출채널', (entry) => salesCode(entry.channel) || ''],
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
    product: productCode(entry.product) || entry.product || '',
    channel: salesCode(entry.channel) || entry.channel || '',
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
  utmBuilder.addEventListener('click', (event) => {
    if (!event.target.closest('.week-pull')) return;
    waitNote = '시트에서 불러오는 중…';
    waitTell();
    pullWait(true);      // 누른 것은 '시트 그대로' 다 (합치지 않는다)
  });

  // askSheet 는 이 화면보다 위에 있다. 그려 둔 다음에 받아 온다.
  window.setTimeout(() => { waitNote = '시트에서 불러오는 중…'; waitTell(); pullWait(false); }, 0);

  utmBuilder.addEventListener('input', (event) => {
    const newField = event.target.closest('[data-new]');
    if (newField) {
      modal[newField.dataset.new] = newField.value;
      // 안내 문구의 미리보기만 갱신한다 (다시 그리면 입력 중 포커스를 잃는다)
      const preview = utmBuilder.querySelector('.utm-modal-preview');
      if (preview) preview.innerHTML = modalPreview();
      return;
    }
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
    // "직접 추가…" 를 고르면 값은 그대로 두고 입력창을 띄운다
    if (field.value === CUSTOM_OPTION) {
      field.value = state[field.dataset.field] || '';
      return openModal(field.dataset.field);
    }
    state[field.dataset.field] = field.value;
    save();
    render();
  });

  utmBuilder.addEventListener('click', (event) => {
    if (event.target.closest('.tool-modal-submit')) return registerCustom();
    if (event.target.closest('.tool-modal-cancel') || event.target.closest('.tool-modal-backdrop')) return closeModal();

    const removeChip = event.target.closest('.utm-custom-remove');
    if (removeChip) return removeCustom(removeChip.dataset.kind, removeChip.dataset.name);

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
      // 직접 추가한 상품 · 매체는 남긴다 (파일명 화면이 사용자 정의 유형을 남기는 것과 같다)
      state = { ...defaults, customProducts: state.customProducts, customMedia: state.customMedia };
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

  utmBuilder.addEventListener('keydown', (event) => {
    if (!modal.open) return;
    if (event.key === 'Escape') return closeModal();
    if (event.key === 'Enter' && event.target.closest('[data-new]')) {
      event.preventDefault();
      registerCustom();
    }
  });

  // 화면을 처음 열 때 시트 대응표를 읽는다 (숨어 있는 동안은 부르지 않는다)
  new MutationObserver(() => { if (!utmBuilder.hidden) loadConfig(); })
    .observe(utmBuilder, { attributes: true, attributeFilter: ['hidden'] });
  if (!utmBuilder.hidden) loadConfig();

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

  /* 시트가 원본이다. localStorage 는 사본 — 화면을 바로 띄우고, 시트를 못 읽을 때 버틴다.
     (주간소재요청과 같은 방식이다) */
  let rows;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    rows = Array.isArray(saved) ? saved.map(normalize) : [];
  } catch {
    rows = [];
  }

  /* 시트가 한 번이라도 갖고 있던 ID. 이 목록에 있던 일정이 시트에서 사라졌으면
     **남이 지운 것**이라 되살리지 않는다. 목록에 없던 것만 아직 못 올린 일정으로 본다. */
  const KNOWN_KEY = 'minix-brand-schedule-known';
  const knownRead = () => {
    try {
      const kept = JSON.parse(localStorage.getItem(KNOWN_KEY) || '[]');
      return Array.isArray(kept) ? kept : [];
    } catch { return []; }
  };
  const knownWrite = (ids) => { try { localStorage.setItem(KNOWN_KEY, JSON.stringify(ids)); } catch { /* 거들기다 */ } };

  let schedNote = '';                // 화면 위에 적어 주는 상태 (불러오는 중 · 저장됨 · 실패)
  let schedSaveWait = null;
  const schedCache = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows)); } catch { /* 거들기다 */ } };
  const schedTell = () => { const box = brandSchedule.querySelector('.week-note'); if (box) box.textContent = schedNote; };

  // 저장은 한 박자 모아 한 번만 보낸다 (칸마다 두드릴 때마다 보내면 느리다)
  const save = () => {
    schedCache();
    if (schedSaveWait) window.clearTimeout(schedSaveWait);
    schedNote = '저장 중…';
    schedTell();
    schedSaveWait = window.setTimeout(() => {
      schedSaveWait = null;
      // base = 이 화면이 아는 일정 ID (설명은 주간소재요청 쪽과 같다)
      askSheet({ action: 'schedulePut', rows: rows, base: knownRead(), by: '' })
        .then(() => {
          knownWrite(rows.map((one) => one.id));   // 시트가 이제 이 일정들을 안다
          schedNote = `저장됨 ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
        })
        .catch((reason) => { schedNote = `시트에 저장 못 함 — ${reason.message} (이 브라우저에는 남아 있습니다)`; })
        .then(schedTell);
    }, 700);
  };

  /* 시트에서 받아 온다.
     처음 받을 때는 이 브라우저에만 있던 일정을 **버리지 않고 합친다** — 시트에 담기 전에
     짜 둔 일정(다른 PC 에서 안 보이던 그것)을 잃지 않게, 그리고 시트로 올려 준다.
     사람이 새로고침을 누른 때는 시트를 그대로 따른다 — 남이 지운 일정이 되살아나면 안 된다. */
  let schedPulled = false;
  const pullSchedule = (mine) => askSheet({ action: 'scheduleGet' })
    .then((body) => {
      const got = (body.rows || []).map(normalize);
      const first = !schedPulled;
      schedPulled = true;
      let push = false;
      if (first && !mine) {
        const same = (a, b) => a.name === b.name && (a.date?.start || '') === (b.date?.start || '');
        const known = knownRead();
        const onlyHere = rows.filter((one) => !known.includes(one.id)
          && !got.some((there) => there.id === one.id || same(there, one)));
        rows = got.concat(onlyHere);
        push = onlyHere.length > 0;
        if (push) schedNote = `이 브라우저에만 있던 ${onlyHere.length}개를 시트에 올립니다`;
      } else {
        rows = got;
      }
      schedCache();
      knownWrite(got.map((one) => one.id));
      if (!push) schedNote = rows.length ? '' : '시트에 일정이 없습니다';
      renderView();
      if (openId) renderPeek();
      if (push) save();               // 올려 준다 (save 가 알림도 갈아 준다)
      else schedTell();
    })
    .catch((reason) => {
      schedNote = `시트에서 불러오지 못했습니다 — ${reason.message} (이 브라우저에 있던 것만 보여 줍니다)`;
      schedTell();
    });

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
    </div>
    <span class="week-note"></span>
    <button type="button" class="week-pull" title="시트에서 다시 불러옵니다"><i data-lucide="refresh-cw"></i>새로고침</button>`;
  head.addEventListener('click', (event) => {
    if (!event.target.closest('.week-pull')) return;
    schedNote = '시트에서 불러오는 중…';
    schedTell();
    pullSchedule(true);      // 누른 것은 '시트 그대로' 다 (합치지 않는다)
  });
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

  schedNote = '시트에서 불러오는 중…';
  window.setTimeout(() => { schedTell(); pullSchedule().then(() => openLinked()); }, 0);
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

  // ── 오른쪽 단추 메뉴 (콘텐츠 일정 달력과 같은 것을 쓴다) ──────
  view.addEventListener('contextmenu', (event) => {
    const card = event.target.closest('.cal-card');
    if (!card) return;
    const row = rows.find((one) => one.id === card.dataset.id);
    if (!row) return;
    cardMenu(event, [
      { key: 'twin', label: '복제', icon: 'copy' },
      { key: 'link', label: '링크 복사', icon: 'link' },
      { key: 'drop', label: '삭제', icon: 'trash-2', warn: true },
    ], (what) => {
      if (what === 'twin') {
        rows.push(normalize({ ...row, id: '' }));     // 같은 값 · 새 ID
        save();
        renderView();
        flashNote('복제했습니다');
        return;
      }
      if (what === 'link') {
        copyText(`${location.origin}${location.pathname}#performance-schedule/${row.id}`)
          .then(() => flashNote('링크를 복사했습니다'))
          .catch(() => flashNote('복사를 못 했습니다 — 주소창의 주소를 그대로 쓰세요'));
        return;
      }
      if (openId === row.id) closePeek();
      rows = rows.filter((one) => one.id !== row.id);
      save();
      renderView();
      flashNote('삭제했습니다');
    });
  });

  // 같은 탭에 링크를 붙여 넣으면 문서를 다시 읽지 않고 해시만 바뀐다 — 그때도 열어 준다
  window.addEventListener('hashchange', () => { if (schedPulled) openLinked(); });

  // 링크로 들어왔으면 (#performance-schedule/<ID>) 그 일정을 찾아 열어 준다
  const openLinked = () => {
    const mark = '#performance-schedule/';
    if (!location.hash.startsWith(mark)) return;
    const id = decodeURIComponent(location.hash.slice(mark.length));
    const row = rows.find((one) => one.id === id);
    if (!row) return;
    if (row.date?.start) cursor = row.date.start.slice(0, 7);
    renderView();
    openPeek(id);
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
  // 어트리뷰션은 '칸을 더 보여 주기' 가 아니라 **기준 고르기** 다.
  // 구매 · 장바구니 · CPS · CPB · 구매매출 · ROAS 가 모두 고른 기준 하나에서 나온다.
  // 개수만 1일 클릭이고 매출은 계정 기본이면 ROAS 가 실제보다 후하게 잡힌다.
  const defaults = {
    source: 'meta', accounts: {}, ranges: {}, preset: '7d', since: '', until: '', attribution: '',
  };
  let state = { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      state = {
        ...defaults, ...saved,
        accounts: { ...(saved.accounts || {}) },
        ranges: { ...(saved.ranges || {}) },
        // 옛 저장값(windows 배열)은 버린다. 여러 칸을 켜던 때의 값이라 기준 하나로 못 옮긴다.
        attribution: typeof saved.attribution === 'string' ? saved.attribution : '',
      };
      delete state.windows;
      // 매체 탭이 없던 때의 저장값
      if (saved.account && !state.accounts.meta) state.accounts.meta = saved.account;
    }
  } catch { /* 저장값이 깨졌으면 기본값으로 시작한다 */ }
  if (!SOURCES[state.source] && state.source !== 'all') state.source = 'meta';
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  // '전매체' 탭. 매체가 아니라 검색 화면이라 SOURCES 에 넣지 않는다.
  // (넣으면 소재별 결과에도 탭이 생기고 allReport 같은 없는 요청을 부르게 된다)
  const ALL = 'all';
  // 매체 하나를 그리는 코드가 읽는 칸을 다 채워 둔다 (빈 값이라도 있어야 터지지 않는다)
  const ALL_SOURCE = {
    name: '전매체', clicks: '클릭', fallback: [], properties: [], token: '',
    breakdowns: [], windows: [], skip: [], skipLabel: '',
    note: '광고그룹 이름으로 네 매체를 한 번에 찾습니다. 계정은 각 매체 탭에서 고른 것을 씁니다.',
  };
  const isAll = () => state.source === ALL;
  const source = () => SOURCES[state.source] || ALL_SOURCE;
  const account = () => state.accounts[state.source] || '';
  const setAccount = (id) => { state.accounts[state.source] = id; };

  // 기간도 매체마다 따로 기억한다. 매체별로 보고 싶은 기간이 다르고,
  // 카카오는 한 번에 31일까지만 되므로 한 탭의 기간이 다른 탭을 막으면 안 된다.
  // 처음 그 탭을 열면 예전에 쓰던 공용 값(또는 최근 7일)에서 시작한다.
  const rangeState = () => {
    if (!state.ranges[state.source]) {
      state.ranges[state.source] = {
        preset: state.preset || '7d', since: state.since || '', until: state.until || '',
        // '최근 N일' 은 메타 관리자와 같이 오늘을 넣지 않는다 (당일 수치는 계속 움직인다).
        // 전매체는 돌고 있는 행사를 모아 보는 화면이라 오늘까지 보는 게 쓸모 있어 켜 둔다.
        today: state.source === ALL,
      };
    }
    return state.ranges[state.source];
  };

  let accounts = [];
  let report = null;
  let status = 'idle';   // idle · loading · ready · error
  let error = '';
  let opened = [];       // 펼쳐 둔 캠페인 id
  // 상세 보기 — 한 번에 캠페인 하나만 연다. picked 는 고른 쪼개기(게재지면 · 연령대 …)
  // 상세는 캠페인으로도 광고그룹으로도 열 수 있다. adset 이 있으면 그 광고그룹으로 좁혀 묻는다.
  const noDetail = () => ({ campaign: '', adset: '', picked: [], data: {}, status: {}, error: {}, metric: 'linkClicks', table: false });
  let detail = noDetail();
  let listNote = '';    // 계정 목록을 못 받았을 때의 사유
  let query = '';        // 캠페인 · 광고그룹 이름 검색
  let picked = [];       // 고른 목적 · 유형 (여럿이면 OR)

  // 전매체 검색 — 광고그룹 이름으로 네 매체를 한 번에 훑는다.
  // 이름 규칙이 매체마다 같아서([cj-260901]_none_cj) 이름만으로 같은 행사를 모을 수 있다.
  let crossText = '';     // 입력 중인 검색어
  let crossFor = '';      // 실제로 찾은 검색어 (결과가 어느 말로 나온 것인지)
  let cross = {};         // 매체 → { status, error, rows, account, accountName }
  let crossOpen = [];     // 펼친 매체

  // 단계 나누기 — 날짜로 가른다.
  // 한 캠페인이 사전에도 당일에도 걸쳐 있어 광고그룹 단위로는 가를 수 없다. 그래서 단계마다
  // 그 기간만 매체에 따로 물어 온다 (매체가 그 날짜 범위만 합쳐서 준다). 하루가 한 단계에만
  // 들어가므로 사전 + 당일 + 사후가 조회 합계와 그대로 맞는다.
  const PHASES = ['사전', '당일', '사후'];
  const isDay = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');
  const blankSpans = () => {
    const out = {};
    PHASES.forEach((name) => { out[name] = { since: '', until: '' }; });
    return out;
  };
  const cleanSpans = (kept) => {
    const out = blankSpans();
    PHASES.forEach((name) => {
      const one = (kept || {})[name] || {};
      out[name] = { since: isDay(one.since) ? one.since : '', until: isDay(one.until) ? one.until : '' };
    });
    return out;
  };

  /* 시트가 원본이다. 이 날짜로 광고비 · 결과가 갈리므로, 브라우저마다 따로 두면
     같은 행사인데 사람마다 숫자가 달라진다. **검색어(행사)를 열쇠로** 담는다 —
     날짜는 그 행사의 것이라 하나로 뭉치면 다른 행사를 보는 사람과 서로 덮어쓴다.
     localStorage 는 사본이다 (시트를 못 읽을 때 버틴다). */
  const PHASE_KEY = 'minix-cross-phase-book';
  let phaseBook = {};        // 검색어(소문자) → 단계별 { since, until }
  let phaseSpanFor = '';     // 지금 화면의 날짜가 어느 검색어 것인가
  let phaseTouched = false;  // 이 검색어에서 사람이 날짜를 건드렸는가
  let phaseSaveWait = null;
  let phaseNote = '';
  try {
    const kept = JSON.parse(window.localStorage.getItem(PHASE_KEY) || '{}') || {};
    Object.keys(kept).forEach((word) => { phaseBook[word] = cleanSpans(kept[word]); });
  } catch (ignore) { /* 거들기다 */ }
  const phaseCache = () => {
    try { window.localStorage.setItem(PHASE_KEY, JSON.stringify(phaseBook)); } catch (ignore) { /* 거들기다 */ }
  };
  const phaseWord = () => String(crossFor || crossText || '').trim();
  let phaseSpan = blankSpans();     // 지금 보고 있는 검색어의 날짜

  const phasePull = () => askSheet({ action: 'phaseGet' })
    .then((body) => {
      phaseBook = {};        // 시트가 원본이다 — 지워진 줄은 여기서도 없앤다
      (body.rows || []).forEach((row) => {
        phaseBook[String(row.word || '').trim().toLowerCase()] = cleanSpans(row.spans);
      });
      phaseCache();
    })
    .catch((reason) => { phaseNote = `단계 날짜를 시트에서 못 읽었습니다 — ${reason.message}`; });

  /* 지금 검색어의 날짜를 담긴 값으로 맞춘다. 없으면 빈 칸으로 시작한다 —
     앞서 본 행사의 날짜를 물려주면 엉뚱한 기간으로 숫자가 갈린다.
     fromSheet 는 늦게 도착한 시트 응답이다. 그 사이에 사람이 날짜를 적었으면 덮지 않는다. */
  const phaseAdopt = (fromSheet) => {
    const word = phaseWord();
    if (fromSheet && phaseSpanFor === word && phaseTouched) return;
    const kept = phaseBook[word.toLowerCase()];
    const before = JSON.stringify(phaseSpan);
    phaseSpan = kept ? cleanSpans(kept) : blankSpans();
    phaseSpanFor = word;
    if (!fromSheet) phaseTouched = false;
    if (JSON.stringify(phaseSpan) === before) return;
    phaseData = {};
    render();
    PHASES.forEach((name) => { if (spanReady(name)) phaseLoad(name); });
  };
  let phaseData = {};     // 단계 → { status, error, rows: [{ key, row }] }
  let phaseFor = '';      // 단계 값을 받아 둔 검색어 (검색어가 바뀌면 다시 받는다)

  const savePhases = () => {
    const word = phaseWord();
    if (!word) return;                    // 찾기 전에는 담을 자리가 없다
    phaseTouched = true;
    phaseSpanFor = word;
    phaseBook[word.toLowerCase()] = cleanSpans(phaseSpan);
    phaseCache();
    if (phaseSaveWait) window.clearTimeout(phaseSaveWait);
    phaseNote = '단계 날짜 저장 중…';
    phaseSaveWait = window.setTimeout(() => {
      phaseSaveWait = null;
      askSheet({ action: 'phasePut', word: word, spans: phaseSpan, by: '' })
        .then(() => { phaseNote = ''; })
        .catch((reason) => { phaseNote = `단계 날짜를 시트에 저장 못 함 — ${reason.message} (이 브라우저에는 남아 있습니다)`; })
        .then(() => render());
    }, 700);
  };
  const spanReady = (name) => Boolean(phaseSpan[name].since && phaseSpan[name].until
    && phaseSpan[name].since <= phaseSpan[name].until);
  const phaseRows = (name) => ((phaseData[name] || {}).rows) || [];
  const phaseBusy = () => PHASES.some((name) => (phaseData[name] || {}).status === 'loading');
  const phaseDone = () => PHASES.filter((name) => (phaseData[name] || {}).status === 'ready' && phaseRows(name).length);
  const spanText2 = (name) => `${phaseSpan[name].since.slice(5)} ~ ${phaseSpan[name].until.slice(5)}`.replace(/-/g, '/');

  // 날짜가 겹치면 같은 하루가 두 단계에 들어가 합계가 부푼다. 미리 알려 준다.
  const spanClash = () => {
    const ready = PHASES.filter(spanReady);
    const bad = [];
    ready.forEach((one, at) => ready.slice(at + 1).forEach((other) => {
      if (phaseSpan[one].since <= phaseSpan[other].until
        && phaseSpan[other].since <= phaseSpan[one].until) bad.push(`${one} · ${other}`);
    }));
    return bad;
  };

  // 매체 · 광고그룹을 한 줄짜리 목록으로 편다
  const crossFlat = () => Object.keys(SOURCES).reduce((into, key) => into.concat(
    (((cross[key] || {}).rows) || []).map((row) => ({ key: key, row: row })),
  ), []);
  let crossBracket = true;   // 전매체 검색: 대괄호 안(행사 이름)만 볼지
  let loadStart = 0;         // 매체 성과를 부르기 시작한 시각
  let loadTick = null;       // 흐른 시간을 고쳐 쓰는 타이머
  let loadWaitOff = false;   // 불러오는 중 알림을 사람이 닫았는지
  let crossWaitOff = false;  // 찾는 중 알림을 사람이 닫았는지
  let queryBracket = true;   // 탭 안 검색: 대괄호 안만 볼지
  // 꺼진 캠페인도 표에 보이기. 매체와 무관하게 기본은 꺼 둔다 (다른 매체와 같은 기준).
  // 네이버는 적재된 값을 읽으므로 상태가 비어 있는 날(적재에 상태가 안 담긴 옛 줄)에는
  // 게재 표가 비어 보인다. 그때는 이 칸을 켜면 광고비가 있는 줄이 다 나온다.
  let withPaused = false;
  let caret = null;      // 다시 그린 뒤 검색창에 커서를 돌려놓을 자리
  let loadedOnce = false;

  // 오늘까지 늘려도 뜻이 통하는 기간만 늘린다.
  // (어제 · 지난 달 · 직접 지정 을 늘리면 고른 기간과 달라져 버린다)
  const ROLLING = ['7d', '14d', '30d', 'month'];

  const withToday = (range, preset) => {
    if (!range || !rangeState().today || ROLLING.indexOf(preset) < 0) return range;
    const now = ymd(new Date());
    return range.until < now ? { since: range.since, until: now } : range;
  };

  const currentRange = () => withToday(rangeOf(rangeState().preset), rangeState().preset) || {
    since: rangeState().since || ymd(daysAgo(7)),
    until: rangeState().until || ymd(daysAgo(1)),
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
    revenue: sum.revenue + (Number(row.revenue) || 0),
    purchase: sum.purchase + row.purchase,
    addToCart: sum.addToCart + row.addToCart,
    lead: sum.lead + row.lead,
  }), { spend: 0, impressions: 0, linkClicks: 0, clicks: 0, results: 0, revenue: 0,
    purchase: 0, addToCart: 0, lead: 0 });

  // ── 화면 ────────────────────────────────────────────────────────
  const accountOptions = () => {
    if (!accounts.length) return `<option value="">${account() ? escapeHtml(account()) : '계정을 불러오는 중…'}</option>`;
    return accounts.map((item) => `<option value="${escapeHtml(item.id)}"${item.id === account() ? ' selected' : ''}>`
      + `${escapeHtml(item.name)} (${escapeHtml(item.accountId)})${item.disabled ? ' · 중지됨' : ''}</option>`).join('');
  };

  const controls = () => {
    const range = currentRange();
    const custom = rangeState().preset === 'custom';
    return `<div class="perf-tabs">
      <button type="button" class="perf-tab perf-tab-all${isAll() ? ' is-on' : ''}"
        data-perf="source" data-source="${ALL}">전매체</button>
      ${Object.keys(SOURCES).map((key) => `<button type="button" class="perf-tab${state.source === key ? ' is-on' : ''}"
        data-perf="source" data-source="${key}">${SOURCES[key].name}</button>`).join('')}
    </div>
    <div class="tool-card perf-controls">
      <div class="perf-fields">
        ${isAll() ? '' : `<label class="perf-account">광고 계정
          <select data-perf="account"${accounts.length ? '' : ' disabled'}>${accountOptions()}</select>
        </label>`}
        <label>기간
          <select data-perf="preset">${PRESETS.map(([key, name]) => `<option value="${key}"${rangeState().preset === key ? ' selected' : ''}>${name}</option>`).join('')}</select>
        </label>
        ${custom ? `<label>시작<input type="date" data-perf="since" value="${escapeHtml(range.since)}"></label>
        <label>종료<input type="date" data-perf="until" value="${escapeHtml(range.until)}"></label>` : ''}
        ${ROLLING.indexOf(rangeState().preset) >= 0 ? `<label class="perf-check"
          title="'최근 N일' 은 기본으로 어제까지 봅니다. 당일 수치는 아직 집계 중이라 늘어납니다.">
          <input type="checkbox" data-perf="today"${rangeState().today ? ' checked' : ''}>오늘 포함</label>` : ''}
        ${isAll() ? '' : `<button type="button" class="tool-add" data-perf="reload"${status === 'loading' ? ' disabled' : ''}>
          <i data-lucide="refresh-cw"></i>${status === 'loading' ? '불러오는 중…' : '새로고침'}</button>`}
      </div>
      <p class="perf-note">
        <b>${escapeHtml(range.since)} ~ ${escapeHtml(range.until)}</b>
        ${report ? ` · ${escapeHtml(report.account.name)}${report.account.timezone ? ` · ${escapeHtml(report.account.timezone)}` : ''}` : ''}
        ${report?.fetchedAt ? ` · 갱신 ${new Date(report.fetchedAt).toLocaleString('ko-KR')}${report.cached ? ' (담아 둔 값)' : ''}` : ''}
        ${PERF_NET_SOURCES.indexOf(state.source) >= 0 ? `<em class="perf-net">${PERF_NET_TEXT}</em>` : ''}
      </p>
      ${listNote ? `<p class="perf-warn">계정 목록을 받지 못해 <b>기본 계정 ${source().fallback.length}개</b>로 채웠습니다. 성과 숫자는 그대로입니다.<small>${escapeHtml(listNote)}</small></p>` : ''}
      ${coverageNote()}
      ${report?.notice ? `<p class="perf-warn">${escapeHtml(report.notice)}</p>` : ''}
    </div>`;
  };

  // 네이버는 실시간 조회가 아니라 적재된 값을 읽는다. 아직 적재되지 않은 날이 기간에 섞여 있으면
  // 표가 빈칸으로 보인다. 값이 없는 것인지 광고를 안 돈 것인지 헷갈리지 않게 그대로 알려 준다.
  const coverageNote = () => {
    const missing = report?.coverage?.missing || [];
    if (!missing.length) return '';
    const loaded = report.coverage.loaded || 0;
    const shown = missing.slice(0, 5).join(' · ') + (missing.length > 5 ? ` 외 ${missing.length - 5}일` : '');
    return `<p class="perf-warn">${loaded
      ? `이 기간에서 <b>${missing.length}일이 아직 적재되지 않았습니다</b> (적재된 날 ${loaded}일).`
      : '<b>이 기간은 아직 적재되지 않았습니다.</b>'}
      표의 숫자에 그 날은 빠져 있습니다.<small>빠진 날: ${escapeHtml(shown)}
      · GFA 로그인이 되는 아무 PC 에서 <b>gfa_load.bat</b> 을 돌리면 채워집니다 (누구나 할 수 있습니다)</small></p>`;
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
      ${source().splitResults
    ? statCard('총구매', count(all.purchase), `장바구니 ${count(all.addToCart)} · 리드 ${count(all.lead)}`)
    : statCard('총결과', count(all.results), `구매 ${count(all.purchase)} · 장바구니 ${count(all.addToCart)} · 리드 ${count(all.lead)}`)}
      ${statCard('CPC', blank(ratio(all.spend, all.linkClicks), money), `${source().clicks} ${count(all.linkClicks)}회`)}
      ${statCard('CTR', blank(ratio(all.linkClicks, all.impressions), percent), `${source().clicks} ÷ 노출`)}
      ${statCard('CPM', blank(ratio(all.spend * 1000, all.impressions), money), `노출 ${count(all.impressions)}회`)}
      ${statCard('CVR', blank(ratio(all.purchase, all.linkClicks), percent),
    `구매 ${count(all.purchase)}건 ÷ ${source().clicks}`)}
      ${source().splitResults
    ? `${statCard('CPS', blank(ratio(all.spend, all.purchase), money), `구매 ${count(all.purchase)}건`)}
       ${statCard('CPB', blank(ratio(all.spend, all.addToCart), money), `장바구니 ${count(all.addToCart)}건`)}`
    : statCard('CPA', blank(ratio(paid.spend, paid.results), money), trafficSpend > 0
      ? `${source().skipLabel} ${money(trafficSpend)} 제외`
      : `${source().skipLabel} 제외`)}
      ${statCard('ROAS', blank(ratio(all.revenue, all.spend), perfRoas),
    `${source().splitResults ? '구매매출' : '구매전환값'} ${money(all.revenue)}`)}
    </div>`;
  };

  const budgetText = (row) => {
    if (!row.budget) return '<span class="tool-blank">—</span>';
    return `${money(row.budget)}<small>${row.budgetKind === 'daily' ? '일' : '총'}</small>`;
  };

  // 불러오는 중 알림은 **초를 세지 않는다.** 숫자가 계속 늘어나면 멈춘 것처럼 보이고,
  // 구글 지연 때문에 예상 시간이 자꾸 어긋나 오히려 헷갈린다. 도는 동그라미만 둔다.
  // source().wait 는 이제 화면에 안 적고, '오래 걸린다' 는 말을 언제 띄울지 재는 데만 쓴다.

  // 지금 고른 어트리뷰션의 이름 (표 머리글에 작게 적는다)
  const windowName = () => {
    const found = (source().windows || []).find(([key]) => key === state.attribution);
    return found ? found[1] : (source().windows || []).length ? '계정 기본' : '';
  };

  // 결과 자리는 매체에 따라 다르다.
  //   기본  결과 · CVR · CPA
  //   GFA   구매 · 장바구니 · CVR · CPS · CPB
  const resultCount = () => (source().splitResults ? 5 : 3);

  // CVR 은 **구매 기준**이다 — 클릭이 실제 구매로 이어진 비율. 네 매체가 같은 방법으로 센다.
  // 결과(구매+장바구니+리드)로 세면 장바구니가 많은 계정은 CVR 이 부풀어 견줄 수 없다.
  const cvrOf = (row) => ratio(row.purchase, row.linkClicks);

  const resultHeads = () => (source().splitResults
    ? `<th>구매${windowName() ? `<small>${escapeHtml(windowName())}</small>` : ''}</th>
       <th>장바구니</th><th>CVR<small>구매</small></th><th>CPS</th><th>CPB</th>`
    : '<th>결과</th><th>CVR<small>구매</small></th><th>CPA</th>');

  const resultCells = (row) => (source().splitResults
    ? `<td class="perf-num">${count(row.purchase)}</td>
       <td class="perf-num">${count(row.addToCart)}</td>
       <td class="perf-num">${blank(cvrOf(row), percent)}</td>
       <td class="perf-num">${blank(ratio(row.spend, row.purchase), money)}</td>
       <td class="perf-num">${blank(ratio(row.spend, row.addToCart), money)}</td>`
    : `<td class="perf-num">${count(row.results)}</td>
       <td class="perf-num">${blank(cvrOf(row), percent)}</td>
       <td class="perf-num">${isTraffic(row) ? `<span class="tool-blank">${source().skipLabel}</span>`
      : blank(ratio(row.spend, row.results), money)}</td>`);

  const metricCells = (row) => `<td class="perf-num">${money(row.spend)}</td>
    <td class="perf-num">${count(row.impressions)}</td>
    <td class="perf-num">${count(row.linkClicks)}</td>
    <td class="perf-num">${blank(ratio(row.linkClicks, row.impressions), percent)}</td>
    <td class="perf-num">${blank(ratio(row.spend, row.linkClicks), money)}</td>
    <td class="perf-num">${blank(ratio(row.spend * 1000, row.impressions), money)}</td>
    ${resultCells(row)}
    <td class="perf-num">${row.revenue ? money(row.revenue) : '<span class="tool-blank">—</span>'}</td>
    <td class="perf-num">${blank(ratio(row.revenue, row.spend), perfRoas)}</td>`;

  // 표 머리글도 한 군데서 만든다 (매체별 성과 표 · 상세 표가 같은 칸을 쓴다)
  const metricHeads = () => `<th>광고비</th><th>노출</th><th>${source().clicks}</th>
    <th>CTR</th><th>CPC</th><th>CPM</th>${resultHeads()}
    <th>${source().splitResults ? '구매매출' : '전환값'}${windowName() && source().splitResults
    ? `<small>${escapeHtml(windowName())}</small>` : ''}</th><th>ROAS</th>`;

  // ── 상세 보기 ───────────────────────────────────────────────────

  // 지금 그리는 지표 하나. 축이 다른 둘을 한 그림에 겹치지 않으려고 하나만 고르게 한다.
  const metricName = () => (detail.metric === 'linkClicks'
    ? source().clicks
    : (PERF_METRICS.find(([key]) => key === detail.metric) || ['', ''])[1]);
  const metricOf = (row) => Number(row[detail.metric] || 0);
  // 광고비 · 구매전환값은 돈이고 나머지는 횟수다
  const metricText = (value) => (detail.metric === 'spend' || detail.metric === 'revenue'
    ? money(value) : count(value));

  // 연령대는 광고비 순이 아니라 나이 순으로 봐야 읽힌다
  const orderRows = (key, rows) => (key === 'age' || key === 'ageGender'
    ? rows.slice().sort((a, b) => String(a.name).localeCompare(String(b.name)))
    : rows);

  const detailChart = (key, rows) => {
    const title = `${PERF_BREAKDOWNS[key]}별 ${metricName()}`;
    if (key === 'ageGender') {
      // 색은 이름을 따라간다. 값이 바뀌어 차례가 뒤집혀도 여성 · 남성 색이 서로 바뀌지 않게 이름순으로 고정한다.
      const names = [];
      rows.forEach((row) => { const one = perfLabel(row.series); if (names.indexOf(one) < 0) names.push(one); });
      names.sort((a, b) => a.localeCompare(b));
      const groups = [];
      rows.forEach((row) => {
        let group = groups.find((one) => one.name === row.name);
        if (!group) { group = { name: perfLabel(row.name), values: {}, total: 0 }; groups.push(group); }
        const value = metricOf(row);
        group.values[perfLabel(row.series)] = (group.values[perfLabel(row.series)] || 0) + value;
        group.total += value;
      });
      return vizLegend(names) + vizStacks(groups.filter((group) => group.total > 0), names, metricText, title);
    }

    const parts = rows.map((row) => ({ name: perfLabel(row.name), value: metricOf(row) }))
      .filter((row) => row.value > 0);
    if (!parts.length) return '';
    if (key === 'gender') {
      const fixed = parts.slice().sort((a, b) => a.name.localeCompare(b.name));
      return vizLegend(fixed.map((part) => part.name)) + vizShare(fixed, metricText, title);
    }
    if (key === 'age') return vizColumns(parts, metricText, title);
    return vizBars(parts, metricText, title);
  };

  const detailTable = (key, rows) => `<div class="tool-table-wrap"><table class="tool-table perf-table perf-sub">
    <thead><tr><th>${PERF_BREAKDOWNS[key]}</th>${metricHeads()}</tr></thead>
    <tbody>${rows.map((row) => `<tr>
      <td class="perf-name"><span>${escapeHtml(perfLabel(row.name))}${row.series
        ? ` · ${escapeHtml(perfLabel(row.series))}` : ''}</span></td>${metricCells(row)}
    </tr>`).join('')}</tbody>
  </table></div>`;

  const detailCard = (key) => {
    if (detail.status[key] === 'loading') return `<p class="perf-detail-note">${PERF_BREAKDOWNS[key]} 불러오는 중…</p>`;
    if (detail.status[key] === 'error') {
      return `<p class="perf-detail-note is-error">${PERF_BREAKDOWNS[key]} — ${escapeHtml(detail.error[key] || '')}</p>`;
    }
    const rows = orderRows(key, detail.data[key] || []);
    if (!rows.length) return `<p class="perf-detail-note">${PERF_BREAKDOWNS[key]} — 나온 값이 없습니다.</p>`;
    return `<div class="viz-card">
      <h4>${PERF_BREAKDOWNS[key]}<small>${escapeHtml(metricName())}</small></h4>
      ${detail.table ? detailTable(key, rows) : detailChart(key, rows)}
    </div>`;
  };

  const detailPanel = (campaign) => {
    const keys = source().breakdowns || [];
    // 이름 · 예산 + 광고비 노출 클릭 CTR CPC CPM + 결과 자리 + 전환값 ROAS + 상세 칸
    const span = 2 + 6 + resultCount() + 2 + 1;
    return `<tr class="perf-detail-row"><td colspan="${span}">
      <div class="perf-detail">
        <div class="perf-detail-picks">
          ${keys.map((key) => `<label class="perf-check"><input type="checkbox" data-perf="breakdown"
            data-breakdown="${key}"${detail.picked.indexOf(key) >= 0 ? ' checked' : ''}>${PERF_BREAKDOWNS[key]}</label>`).join('')}
          <small>${escapeHtml(campaign.name)} 안을 쪼개서 봅니다.</small>
        </div>
        ${detail.picked.length ? `<div class="perf-detail-picks">
          <span class="perf-chips">${PERF_METRICS.map(([key, name]) => `<button type="button"
            class="perf-chip${detail.metric === key ? ' is-on' : ''}" data-perf="metric"
            data-metric="${key}">${key === 'linkClicks' ? source().clicks : name}</button>`).join('')}</span>
          <label class="perf-check"><input type="checkbox" data-perf="detail-table"${detail.table ? ' checked' : ''}>표로 보기</label>
        </div>` : ''}
        ${detail.picked.map((key) => detailCard(key)).join('')}
      </div>
    </td></tr>`;
  };

  const hit = (name) => perfNameHit(name, query.trim().toLowerCase(), queryBracket);

  // 목적 코드는 여럿인데 한글 이름이 같은 것들이 있다 (OUTCOME_TRAFFIC · LINK_CLICKS = 트래픽).
  // 칩이 두 개로 갈라지지 않게 코드가 아니라 이름으로 묶는다.
  const objectiveName = (key) => OBJECTIVES[key] || String(key || '');

  // 고를 수 있는 목적 · 유형.
  // 켜져 있는 캠페인만 보면, 지금 꺼졌지만 그 기간에 돈을 쓴 목적이 목록에서 빠져 버린다.
  // (그러면 매체별로 버튼이 하나뿐이거나 아예 안 뜨는 일이 생긴다) 그래서 기간 안에
  // 광고비가 있는 캠페인까지 함께 본다.
  const objectives = () => {
    const seen = [];
    (report ? report.campaigns : []).forEach((row) => {
      if (!row.active && !(row.spend > 0)) return;
      const name = objectiveName(row.objective);
      if (name && seen.indexOf(name) < 0) seen.push(name);
    });
    return seen.sort();
  };

  const filters = (rows, shown, all) => {
    const list = objectives();
    return `<div class="perf-filter">
      <div class="perf-search">
        <i data-lucide="search"></i>
        <input type="search" data-perf="search" value="${escapeHtml(query)}"
          placeholder="캠페인 · 광고그룹 이름으로 검색" autocomplete="off">
        ${query ? '<button type="button" class="perf-clear" data-perf="clear" aria-label="지우기">×</button>' : ''}
      </div>
      <label class="perf-check" title="[cj-260901]_none_cj 에서 대괄호 안의 cj-260901 만 봅니다">
        <input type="checkbox" data-perf="query-bracket"${queryBracket ? ' checked' : ''}>대괄호 안만</label>
      ${list.length > 1 ? `<div class="perf-chips">
        ${list.map((name) => `<button type="button" class="perf-chip${picked.indexOf(name) >= 0 ? ' is-on' : ''}"
          data-perf="objective" data-objective="${escapeHtml(name)}">${escapeHtml(name)}</button>`).join('')}
      </div>` : ''}
      <label class="perf-check"><input type="checkbox" data-perf="paused"${withPaused ? ' checked' : ''}>꺼진 것도 보기</label>
      ${(source().windows || []).length ? `<span class="perf-windows" title="구매 · 구매매출 · CPS · ROAS 를 모두 이 기준으로 셉니다">어트리뷰션
        ${[['', '계정 기본']].concat(source().windows).map(([key, name]) => `<button type="button"
          class="perf-window-pick${state.attribution === key ? ' is-on' : ''}"
          data-perf="window" data-window="${key}">${name}</button>`).join('')}
      </span>` : ''}
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
      if (picked.length && picked.indexOf(objectiveName(campaign.objective)) < 0) return false;
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
          <span><b>${escapeHtml(campaign.name)}</b><small>${escapeHtml(objectiveName(campaign.objective) || '—')}
            · 광고그룹 ${count(all.length)}</small></span>
        </td>
        <td class="perf-num">${campaign.active ? budgetText(campaign) : '<span class="tool-blank">꺼짐</span>'}</td>
        ${metricCells(campaign)}
        <td class="perf-more">${(source().breakdowns || []).length
    ? `<button type="button" class="perf-detail-btn${detail.campaign === campaign.id && !detail.adset ? ' is-on' : ''}"
        data-perf="detail" data-campaign="${escapeHtml(campaign.id)}">상세</button>`
    : ''}</td>
      </tr>`;
      const panel = detail.campaign === campaign.id && !detail.adset ? detailPanel(campaign) : '';
      if (!isOpen || !children.length) return head + panel;

      // 캠페인 광고비에는 지금 꺼졌거나 지워진 광고그룹이 쓴 돈도 들어 있다.
      // 목록에 없는 만큼을 한 줄로 드러내야 합이 맞아 보인다.
      const shownSpend = children.reduce((sum, adset) => sum + adset.spend, 0);
      const rest = campaign.spend - shownSpend;
      const restRow = rest > 1 ? `<tr class="perf-child perf-rest">
        <td class="perf-name"><span class="perf-branch"></span>
          <span title="이 기간에는 돌았지만 지금 목록에 없는 광고그룹입니다">그 밖 (꺼진 · 지워진 광고그룹)</span></td>
        <td></td><td class="perf-num">${money(rest)}</td>
        ${new Array(7 + resultCount()).fill('<td></td>').join('')}<td></td>
      </tr>` : '';

      return head + panel + children.map((adset) => `<tr class="perf-child">
        <td class="perf-name"><span class="perf-branch"></span><span>${escapeHtml(adset.name)}</span></td>
        <td class="perf-num">${budgetText(adset)}</td>
        ${metricCells({ ...adset, objective: adset.objective || campaign.objective })}
        <td class="perf-more">${(source().breakdowns || []).length
    ? `<button type="button" class="perf-detail-btn${detail.adset === adset.id ? ' is-on' : ''}"
        data-perf="detail" data-campaign="${escapeHtml(campaign.id)}" data-adset="${escapeHtml(adset.id)}">상세</button>`
    : ''}</td>
      </tr>` + (detail.adset === adset.id ? detailPanel(adset) : '')).join('') + restRow;
    }).join('');

    return `<div class="tool-card">
      <div class="tool-list-head">
        <h3>게재 <small>지금 켜져 있는 캠페인 ${count(listed.filter((row) => row.active).length)}개 · 광고그룹 ${count(report.adsets.filter((row) => row.active).length)}개</small></h3>
        <div class="tool-list-actions">
          <button type="button" class="tool-copy-all" data-perf="copy"${live.length ? '' : ' disabled'}>
            <i data-lucide="copy"></i>표 복사</button>
          <button type="button" class="tool-copy-all" data-perf="excel"${live.length ? '' : ' disabled'}>
            <i data-lucide="sheet"></i>엑셀 받기</button>
        </div>
      </div>
      ${filters(listed, live.length, listed.length)}
      ${live.length ? `<div class="tool-table-wrap"><table class="tool-table perf-table">
        <thead><tr><th>캠페인 · 광고그룹</th><th>예산</th>${metricHeads()}<th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>` : `<p class="tool-empty">${query || picked.length ? '찾는 캠페인이 없습니다.' : '지금 켜져 있는 캠페인이 없습니다.'}</p>`}
      ${resting.length ? `<p class="perf-resting">이 기간에 돌았지만 지금 꺼져 있는 캠페인 ${count(resting.length)}개
        (${money(restingSpend)})도 위 요약에는 들어 있습니다.</p>` : ''}
    </div>`;
  };

  // ── 불러오는 중 알림 ─────────────────────────────────────────────
  // 매체마다 처음 열 때 9~35초가 걸린다. 그동안 빈 화면만 보이면 멈춘 줄 알고 다시 누르게 되고,
  // 그러면 조회가 겹쳐 더 느려진다. 그래서 얼마나 걸리는지 · 왜 걸리는지를 적어 둔다.
  // 흐르는 시간만 DOM 을 직접 고친다 (1초에 한 번 다시 그리면 검색창 글자가 튄다).
  const loadWait = () => `<div class="perf-wait-back" data-perf="wait-close"></div>
      <div class="perf-wait" role="status" aria-live="polite">
        <div class="perf-wait-head">
          <i data-lucide="loader-circle"></i>
          <span><b>${escapeHtml(source().name)} 성과를 불러오는 중</b>
            <small>잠시 기다려 주세요</small></span>
        </div>
        <p class="perf-wait-note">${escapeHtml(source().waitNote || '')}</p>
        <p class="perf-wait-note">한 번 받아 두면 <b>5분 동안</b>은 곧바로 열립니다.
          기간이나 계정을 바꾸면 그 기간만큼 다시 받습니다.</p>
        <p class="perf-wait-slow" data-perf-slow hidden></p>
        <button type="button" class="perf-wait-hide" data-perf="wait-close">닫고 기다리기</button>
      </div>`;

  const loadTickOff = () => {
    if (!loadTick) return;
    window.clearInterval(loadTick);
    loadTick = null;
  };

  const loadTickOn = () => {
    if (loadTick) return;
    loadTick = window.setInterval(() => {
      if (status !== 'loading') { loadTickOff(); return; }
      const spent = (Date.now() - loadStart) / 1000;
      const slow = document.querySelector('[data-perf-slow]');
      if (slow) {
        // 예상보다 두 배 넘게 끌면 왜 그런지 적어 준다. 안 적으면 멈춘 줄 안다.
        const text = askState.tries > 1
          ? `구글이 응답을 흘려 다시 물어보는 중입니다 (${askState.tries}/${SHEET_TRIES}번째). 조금 더 걸립니다.`
          : (spent > (source().wait || 10) * 2
            ? '생각보다 오래 걸리고 있습니다. 구글이 응답을 늦게 주는 때가 있어 최대 3번까지 다시 물어봅니다.'
            : '');
        slow.textContent = text;
        slow.hidden = !text;
      }
    }, 100);
  };

  // 한 번의 '불러오기' 는 계정 목록 → 성과, 두 단계다. 두 곳에서 다 부르되
  // 시간은 **처음 시작한 때**부터 잰다. 성과 단계에서 다시 0 으로 돌리면
  // 계정 목록을 받던 3초가 사라지고, 앞 단계에서는 0.0초에 멈춰 있게 된다.
  const beginLoad = () => {
    if (!loadTick) {
      loadStart = Date.now();
      loadWaitOff = false;
    }
    loadTickOn();
  };

  // ── 전매체 검색 ──────────────────────────────────────────────────
  // 매체마다 이미 있는 *Report 를 그대로 부른다 (서버가 5분 담아 두므로 다시 눌러도 가볍다).
  // 계정은 그 탭에서 고른 것을 쓰고, 한 번도 안 열어 본 매체는 목록의 첫 계정을 쓴다.
  // ── 찾는 중 알림 ────────────────────────────────────────────────
  // 카카오가 20~40초 걸린다 (매체가 보고서를 5초에 한 번만 준다). 그동안 화면이 멈춘 것처럼
  // 보이지 않게, 어느 매체가 끝났는지 하나씩 채워 보여 준다.
  // 1초에 한 번 화면을 다시 그리면 검색창의 글자와 커서가 튄다. 그래서 흐르는 시간만
  // DOM 을 직접 고친다.
  const crossBusy = () => Object.keys(cross).some((key) => cross[key].status === 'loading');
  const crossWait = () => {
    const keys = Object.keys(SOURCES);
    const done = keys.filter((key) => cross[key] && cross[key].status !== 'loading').length;
    return `<div class="perf-wait-back" data-cross="wait-close"></div>
      <div class="perf-wait" role="status" aria-live="polite">
        <div class="perf-wait-head">
          <i data-lucide="loader-circle"></i>
          <span><b>'${escapeHtml(crossFor)}' 찾는 중</b>
            <small>${done}/${keys.length} 매체</small></span>
        </div>
        <ul class="perf-wait-list">
          ${keys.map((key) => {
    const one = cross[key] || {};
    const rows = one.rows || [];
    const line = one.status === 'ready'
      ? (rows.length ? `광고그룹 ${count(rows.length)}개 · ${money(totalsOf(rows).spend)}` : '걸린 것 없음')
      : (one.status === 'error' ? '못 받았습니다' : '찾는 중…');
    const mark = one.status === 'ready' ? (rows.length ? 'check' : 'minus')
      : (one.status === 'error' ? 'x' : 'loader-circle');
    const tone = one.status === 'ready' ? ' is-done' : (one.status === 'error' ? ' is-bad' : '');
    return `<li class="perf-wait-one${tone}"><i data-lucide="${mark}"></i>
      <b>${escapeHtml(SOURCES[key].name)}</b><span>${line}</span></li>`;
  }).join('')}
        </ul>
        <p class="perf-wait-note">카카오모먼트가 가장 오래 걸립니다 — 매체가 보고서를 5초에 한 번만 주기 때문입니다.
          기간을 좁히면 빨라집니다.</p>
        <button type="button" class="perf-wait-hide" data-cross="wait-close">먼저 나온 것부터 보기</button>
      </div>`;
  };

  // 매체마다의 계정 목록. 한 번 받아 두고 다시 쓴다.
  const crossAccounts = {};
  // 검색에서 실제로 걸린 계정만 기억해 둔다 — 단계별로 볼 때 이 계정만 다시 물으면 된다.
  let crossHits = {};

  const askAccounts = (key) => {
    if (crossAccounts[key]) return Promise.resolve(crossAccounts[key]);
    return ask({ action: `${key}Accounts` }).then((body) => {
      crossAccounts[key] = (body.accounts || []).filter((one) => one && one.accountId);
      return crossAccounts[key];
    });
  };

  // 그 매체에서 볼 수 있는 계정을 다 훑어 그 기간의 광고그룹을 모으고, 검색어로 걸러 돌려준다.
  // 계정을 골라 두지 않아도 되게 전부 본다 (행사를 어느 계정에 올렸는지 몰라도 잡힌다).
  // 광고그룹 줄에는 캠페인 id 만 실려 온다 (네이버만 이름까지 온다). 같은 응답의 campaigns 로
  // 이름을 되짚는다 — 이름이 똑같은 광고그룹이 여러 매체 · 여러 캠페인에 걸쳐 있어서다.
  // only 를 주면 그 계정만 본다 (검색에서 걸린 계정. 빈 목록이면 아예 묻지 않는다).
  const crossAsk = (key, since, until, wanted, only) => {
    if (only && !only.length) return Promise.resolve({ rows: [], note: '', hits: [], accountName: '', tried: 0 });
    return askAccounts(key).then((list) => {
      const use = only && only.length ? list.filter((one) => only.indexOf(one.accountId) >= 0) : list;
      if (!use.length) throw new Error('볼 수 있는 광고 계정이 없습니다.');
      const trouble = [];
      return Promise.all(use.map((one) => ask({
        action: `${key}Report`, account: one.accountId, since: since, until: until,
      })
        .then((body) => {
          const named = {};
          (body.campaigns || []).forEach((each) => { named[each.id] = each.name; });
          const rows = (body.adsets || []).filter((row) => perfNameHit(row.name, wanted.toLowerCase(), crossBracket))
            .map((row) => ({
              ...row,
              campaignName: row.campaignName || named[row.campaignId] || '',
              accountId: one.accountId,
              accountName: (body.account || {}).name || one.name || one.accountId,
            }));
          // 네이버 GFA 만 적재한 값을 읽는다. 빠진 날이 있으면 그만큼 광고비가 적게 나온다.
          rows.coverage = body.coverage || null;
          return rows;
        })
        .catch((reason) => {
          trouble.push(`${one.name || one.accountId} — ${reason.message}`);
          return [];
        }))).then((packs) => {
        const rows = packs.reduce((into, each) => into.concat(each), []);
        let coverage = null;
        packs.forEach((each) => {
          if (each.coverage && (each.coverage.missing || []).length) coverage = each.coverage;
        });
        // 계정을 다 물어봤는데 다 실패했으면 그건 오류다 (한 곳만 실패한 것은 알려만 준다)
        if (!rows.length && trouble.length === use.length) throw new Error(trouble.join(' · '));
        const names = [];
        rows.forEach((row) => { if (names.indexOf(row.accountName) < 0) names.push(row.accountName); });
        const hits = [];
        rows.forEach((row) => { if (hits.indexOf(row.accountId) < 0) hits.push(row.accountId); });
        return { rows: rows, note: trouble.join(' · '), hits: hits, tried: use.length,
          coverage: coverage, accountName: names.join(' · ') };
      });
    });
  };

  const crossSearch = () => {
    const wanted = crossText.trim();
    if (!wanted) return;
    const period = currentRange();
    // 단계 값은 단계 날짜에만 매여 있다. 조회 기간을 바꿔도 그대로 두고,
    // 찾는 말이 바뀔 때만 버린다.
    if (wanted !== phaseFor) { phaseData = {}; phaseFor = ''; }
    crossFor = wanted;
    /* 이 행사의 단계 날짜는 시트에 있다. 사본으로 먼저 맞춰 두고, 찾을 때마다 시트를
       다시 읽어 남이 고친 값을 따라간다 (그동안 내가 적은 것은 덮지 않는다). */
    phaseAdopt(false);
    phasePull().then(() => phaseAdopt(true));
    crossOpen = [];
    cross = {};
    crossWaitOff = false;
    Object.keys(SOURCES).forEach((key) => { cross[key] = { status: 'loading', rows: [] }; });
    render();

    crossHits = {};
    Promise.all(Object.keys(SOURCES).map((key) => crossAsk(key, period.since, period.until, wanted)
      .then((got) => {
        crossHits[key] = got.hits;
        cross[key] = {
          status: 'ready',
          accountName: got.accountName,
          tried: got.tried,
          note: got.note,
          coverage: got.coverage,
          rows: got.rows,
        };
        render();
      })
      .catch((reason) => {
        cross[key] = { status: 'error', error: reason.message, rows: [] };
        render();
      })))
      // 네 매체를 다 훑은 다음에 단계를 받는다 — 어느 계정에 있는지 알고 나서 물어야
      // 안 걸린 계정을 헛되게 부르지 않는다.
      .then(() => phaseLoad());
  };

  // 단계마다 그 기간만 네 매체에 다시 묻는다.
  // only 를 주면 그 단계만 (날짜를 고쳤을 때). 안 주면 아직 안 받은 단계를 다 받는다.
  const phaseLoad = (only) => {
    const wanted = (crossFor || crossText).trim();
    const want = (only ? [only] : PHASES).filter((name) => spanReady(name)
      && (only || !phaseData[name]));
    if (!wanted || !want.length) return;
    phaseFor = wanted;
    want.forEach((name) => { phaseData[name] = { status: 'loading', rows: [] }; });
    render();

    want.forEach((name) => {
      const span = phaseSpan[name];
      const trouble = [];
      const gaps = [];
      Promise.all(Object.keys(SOURCES).map((key) => crossAsk(key, span.since, span.until, wanted, crossHits[key])
        .then((got) => {
          if (got.coverage && (got.coverage.missing || []).length) {
            gaps.push(`${SOURCES[key].name} ${gapText(got.coverage)}`);
          }
          return got.rows.map((row) => ({ key: key, row: row }));
        })
        .catch((reason) => {
          trouble.push(`${SOURCES[key].name} — ${reason.message}`);
          return [];
        })))
        .then((packs) => {
          phaseData[name] = {
            status: 'ready',
            error: trouble.join(' · '),
            gap: gaps.join(' · '),
            rows: packs.reduce((into, one) => into.concat(one), []),
          };
          render();
        });
    });
  };

  // 광고그룹에 설정해 둔 집행 기간을 '8/29 ~ 9/4' 로 줄여 적는다.
  // 끝 날짜가 없으면 (종료일을 안 잡은 광고그룹) 물결만 남긴다.
  const spanText = (row) => {
    const short = (day) => (day ? String(day).slice(5).replace('-', '/') : '');
    if (!row.begin && !row.end) return '';
    if (row.begin && row.end) {
      return row.begin === row.end ? short(row.begin) : `${short(row.begin)} ~ ${short(row.end)}`;
    }
    return row.begin ? `${short(row.begin)} ~` : `~ ${short(row.end)}`;
  };

  // 매체 줄 · 광고그룹 줄 · 합계 줄이 같은 숫자 칸을 쓴다. 한 군데서 만든다.
  // 비율은 더한 값에서 다시 계산한다 — 줄마다의 CTR 을 평균 내면 틀린 값이 된다.
  const CROSS_CELLS = 11;
  // 차례는 crossHead 와 짝이다: 광고비 · 전환값 · ROAS · CPA · 노출 · 클릭 · 결과 · CPM · CPC · CTR · CVR(구매)
  const crossCells = (row, strong) => {
    const spend = strong ? `<b>${money(row.spend)}</b>` : money(row.spend);
    return `<td class="perf-num">${spend}</td>
      <td class="perf-num">${row.revenue ? money(row.revenue) : '<span class="tool-blank">—</span>'}</td>
      <td class="perf-num">${blank(ratio(row.revenue, row.spend), perfRoas)}</td>
      <td class="perf-num">${blank(ratio(row.spend, row.results), money)}</td>
      <td class="perf-num">${count(row.impressions)}</td>
      <td class="perf-num">${count(row.linkClicks)}</td>
      <td class="perf-num">${count(row.results)}</td>
      <td class="perf-num">${blank(ratio(row.spend * 1000, row.impressions), money)}</td>
      <td class="perf-num">${blank(ratio(row.spend, row.linkClicks), money)}</td>
      <td class="perf-num">${blank(ratio(row.linkClicks, row.impressions), percent)}</td>
      <td class="perf-num">${blank(ratio(row.purchase, row.linkClicks), percent)}</td>`;
  };

  const crossTotals = () => {
    const all = Object.keys(cross).reduce((list, key) => list.concat(cross[key].rows || []), []);
    return totalsOf(all);
  };

  const crossTable = () => {
    const head = ['구분', '매체', '광고그룹', '캠페인', '집행시작', '집행종료',
      '광고비', '노출', '클릭', 'CTR', 'CPC', 'CPM', '결과', 'CVR(구매)', 'CPA', '구매전환값', 'ROAS'];
    const lines = [head.join('\t')];
    const cells = (row) => {
      const ctr = ratio(row.linkClicks, row.impressions);
      const cpc = ratio(row.spend, row.linkClicks);
      const cpm = ratio(row.spend * 1000, row.impressions);
      const cvr = ratio(row.purchase, row.linkClicks);
      const cpa = ratio(row.spend, row.results);
      const roas = ratio(row.revenue, row.spend);
      return [
        Math.round(row.spend), row.impressions, row.linkClicks,
        ctr === null ? '' : percent(ctr),
        cpc === null ? '' : Math.round(cpc),
        cpm === null ? '' : Math.round(cpm),
        row.results,
        cvr === null ? '' : percent(cvr),
        cpa === null ? '' : Math.round(cpa),
        Math.round(row.revenue || 0),
        roas === null ? '' : perfRoas(roas),
      ];
    };
    Object.keys(SOURCES).forEach((key) => {
      (((cross[key] || {}).rows) || []).forEach((row) => {
        lines.push(['조회 기간', SOURCES[key].name, row.name, row.campaignName || '',
          row.begin || '', row.end || ''].concat(cells(row)).join('\t'));
      });
    });

    // 단계별로 받아 둔 것이 있으면 그 합을 뒤에 붙인다 (기간이 다르니 위 줄과는 따로 둔다)
    const done = phaseDone();
    if (done.length) {
      lines.push('');
      lines.push(['구분', '기간', '광고그룹 수', '', '', ''].concat(head.slice(6)).join('\t'));
      done.forEach((name) => {
        const mine = phaseRows(name);
        lines.push([name, spanText2(name), mine.length, '', '', '']
          .concat(cells(totalsOf(mine.map((one) => one.row)))).join('\t'));
        // 그 단계 안의 캠페인별 합도 함께 적는다 (화면과 같은 묶음)
        byCampaign(mine).forEach((pack) => {
          lines.push([`  ${name} · ${SOURCES[pack.key].name}`, pack.name, pack.count,
            pack.row.begin || '', pack.row.end || '', ''].concat(cells(pack.row)).join('\t'));
        });
      });
      const total = totalsOf(done.reduce((into, name) => into.concat(phaseRows(name).map((one) => one.row)), []));
      lines.push(['총합', done.join(' + '), '', '', '', ''].concat(cells(total)).join('\t'));
    }
    return lines.join('\n');
  };

  // 프로모션 MIX 의 매체 이름. MIX 쪽 MIX_MEDIA_LIST 에 있는 말로 맞춰 둔다.
  const MIX_MEDIA = { meta: '메타', google: '구글', kakao: '카카오모먼트', naver: 'GFA' };
  const MIX_HEAD = ['소재', '노출', '클릭', '광고비', '전환', '매출'];

  // 단계 × 매체로 묶는다 (묶음 하나가 파일 하나). 단계마다 그 기간만 받아 온 값이라
  // 같은 광고그룹이 사전 · 당일에 다 나와도 광고비는 각 기간의 값으로 갈라져 있다.
  const mixFiles = () => {
    const out = [];
    PHASES.forEach((phase) => Object.keys(SOURCES).forEach((key) => {
      const mine = phaseRows(phase).filter((one) => one.key === key);
      if (mine.length) out.push({ key: key, phase: phase, rows: mine.map((one) => one.row) });
    }));
    return out;
  };

  // 전환은 구매로 넣는다 — 매출(구매전환값)과 짝이 맞아야 MIX 의 CVR · CPS · ROAS 가 맞는다
  const mixCsv = (rows) => [MIX_HEAD.join('\t')].concat(rows.map((row) => [
    row.name,
    row.impressions,
    row.linkClicks,
    Math.round(row.spend),
    row.purchase,
    Math.round(row.revenue || 0),
  ].join('\t'))).join('\n');

  const mixName = (one) => `MIX_${(crossFor || '검색').replace(/[\\/:*?"<>|]/g, '')}`
    + `_${MIX_MEDIA[one.key]}_${one.phase}.csv`;

  // 세일즈 워크스페이스(행사별 결과 → 매체결과)가 우리 화면과 똑같이 그릴 수 있게,
  // 화면이 쓰는 값을 그대로 담는다. 비율(CTR · CPC · ROAS …)은 담지 않는다 —
  // 받는 쪽에서 더한 값으로 다시 계산해야 합계가 맞는다.
  const salesRow = (key, row) => ({
    source: key,
    sourceName: SOURCES[key].name,
    adset: row.name,
    campaign: row.campaignName || '',
    begin: row.begin || '',
    end: row.end || '',
    spend: Math.round(row.spend),
    imp: row.impressions,
    clk: row.linkClicks,
    conv: row.purchase,
    results: row.results,
    rev: Math.round(row.revenue || 0),
  });

  const salesPayload = () => {
    const period = currentRange();
    return {
      kind: 'minix-cross-result',
      version: 1,
      word: crossFor,
      bracketOnly: crossBracket,
      range: { since: period.since, until: period.until },
      madeAt: new Date().toISOString(),
      note: '카카오모먼트 · 메타 · 구글은 매체가 준 값 그대로, 네이버 GFA 는 부가세 10% 를 뺀 값입니다.',
      // 조회 기간 전체 (매체 · 광고그룹 단위)
      searched: crossFlat().map((one) => salesRow(one.key, one.row)),
      accounts: Object.keys(SOURCES).map((key) => ({
        source: key, name: SOURCES[key].name,
        found: (((cross[key] || {}).rows) || []).length,
        account: (cross[key] || {}).accountName || '',
        tried: (cross[key] || {}).tried || 0,
        gap: gapText((cross[key] || {}).coverage) || '',
      })),
      // 단계마다 그 기간만 따로 받아 온 값 (매체 · 광고그룹 단위)
      phases: phaseDone().map((name) => ({
        name: name,
        since: phaseSpan[name].since,
        until: phaseSpan[name].until,
        rows: phaseRows(name).map((one) => salesRow(one.key, one.row)),
      })),
    };
  };

  const salesDownload = () => {
    const body = JSON.stringify(salesPayload(), null, 1);
    const blob = new Blob([body], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `세일즈용_${(crossFor || '검색').replace(/[\\/:*?"<>|]/g, '')}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const mixCard = () => {
    const files = mixFiles();
    if (!files.length) return '';
    const late = files.some((one) => one.phase === '사후');
    return `<div class="perf-mix">
      <div class="perf-mix-head"><b>프로모션 MIX 로 보내기</b>
        <small>매체 × 단계마다 파일 하나입니다. MIX 의 업로드 칸에서 <b>매체</b>와 <b>Phase</b> 를
          고르고 그 파일을 올리면 컬럼 매핑은 저절로 채워집니다.</small></div>
      <div class="perf-mix-list">
        ${files.map((one) => `<button type="button" class="perf-mix-btn" data-cross="mix"
          data-key="${escapeHtml(one.key)}" data-phase="${escapeHtml(one.phase)}">
          <i data-lucide="download"></i>
          <span><b>${escapeHtml(MIX_MEDIA[one.key])} · ${escapeHtml(one.phase)}</b>
          <small>${count(one.rows.length)}줄 · ${money(totalsOf(one.rows).spend)}</small></span>
        </button>`).join('')}
      </div>
      <p class="perf-mix-note">MIX 의 <b>부가세 설정</b>에서 <b>GFA 는 체크하지 마세요</b> (여기 광고비가
        이미 부가세를 뺀 금액입니다). 메타 · 구글 · 카카오모먼트는 매체가 준 값 그대로라, MIX 쪽 설정을 따르세요.${late
      ? ' 그리고 MIX 에는 <b>사후</b> 칸이 없습니다 — 사후 파일은 <b>상시</b> 나 <b>Phase 미지정</b> 으로 올리세요.'
      : ''}</p>
    </div>`;
  };

  // 적재가 빠진 날을 짧게 적는다 (네이버 GFA 전용 — 다른 매체는 실시간이라 이런 일이 없다)
  const gapText = (coverage) => {
    const missing = (coverage && coverage.missing) || [];
    if (!missing.length) return '';
    const shown = missing.slice(0, 4).join(' · ') + (missing.length > 4 ? ` 외 ${missing.length - 4}일` : '');
    return `${missing.length}일 안 들어옴 (${shown})`;
  };

  const crossGap = () => {
    const lines = Object.keys(SOURCES).map((key) => {
      const text = gapText((cross[key] || {}).coverage);
      return text ? `${SOURCES[key].name} — ${text}` : '';
    }).filter(Boolean);
    if (!lines.length) return '';
    return `<p class="perf-warn"><b>적재가 안 된 날이 있어 광고비가 그만큼 적게 나옵니다.</b>
      ${escapeHtml(lines.join(' · '))}<small>GFA 로그인이 되는 PC 에서 <b>gfa_load.bat</b> 을 돌리면 채워집니다.
      로그인이 풀렸으면 <b>gfa_login.bat</b> 으로 한 번 로그인해 주세요 ('로그인 상태 유지' 체크)</small></p>`;
  };

  // 지표 차례는 행사별 성과(미닉스 워크스페이스 · 행사별 결과) 와 같게 둔다 —
  // 돈 · 성과(광고비 · 전환값 · ROAS · CPA)가 앞, 규모 · 효율이 뒤다. 두 화면을 나란히 읽으려고.
  const crossHead = (first) => `<thead><tr><th>${first}</th><th class="perf-span-head">집행일자</th>
    <th>광고비</th><th>전환값</th><th>ROAS</th><th>CPA</th><th>노출</th><th>클릭</th><th>결과</th>
    <th>CPM</th><th>CPC</th><th>CTR</th><th>CVR<small>구매</small></th></tr></thead>`;

  // 단계마다의 합을 맨 위에 한 표로 모은다.
  // 단계마다 그 기간만 따로 받아 왔으니 하루가 한 단계에만 들어간다 — 그래서 세 줄을 더한
  // 값이 곧 총합이고, 단계 날짜가 조회 기간을 다 덮으면 조회 합계와도 맞는다.
  const phaseSum = () => {
    const done = phaseDone();
    if (!done.length) return '';
    const lines = done.map((name) => ({
      name: name, i: PHASES.indexOf(name), rows: phaseRows(name),
    }));
    const total = totalsOf(lines.reduce((into, one) => into.concat(one.rows.map((each) => each.row)), []));
    const searched = crossFlat();
    const whole = searched.length ? totalsOf(searched.map((one) => one.row)) : null;
    const gap = whole ? Math.round(whole.spend) - Math.round(total.spend) : 0;
    return `<div class="perf-phase-box perf-phase-sum">
      <div class="perf-phase-head"><b>단계별 합계</b>
        <small>${done.map((name) => `${name} ${spanText2(name)}`).join(' · ')}</small></div>
      <div class="tool-table-wrap"><table class="tool-table perf-table">
        ${crossHead('단계')}
        <tbody>${lines.map((one) => `<tr class="perf-row">
          <td class="perf-name"><span><em class="perf-phase is-${one.i}">${escapeHtml(one.name)}</em>
            <small>캠페인 ${count(byCampaign(one.rows).length)} · 광고그룹 ${count(one.rows.length)}</small></span></td>
          <td class="perf-span">${escapeHtml(spanText2(one.name))}</td>
          ${crossCells(totalsOf(one.rows.map((each) => each.row)), true)}
        </tr>`).join('')}
          <tr class="perf-row perf-cross-sum"><td class="perf-name"><span><b>총합</b>
            <small>${done.join(' + ')}</small></span></td><td></td>
            ${crossCells(total, true)}</tr>
        </tbody>
      </table></div>
      ${whole ? `<p class="perf-note${gap ? ' is-warn' : ''}">조회 기간 합계는 ${money(whole.spend)} 입니다${gap > 0
      ? ` — 단계에 안 들어간 광고비가 ${money(gap)} 있습니다 (단계 날짜가 조회 기간을 다 덮지 않습니다)`
      : gap < 0
        ? ` — 단계 합이 ${money(-gap)} 더 큽니다 (단계 날짜가 조회 기간을 넘어섭니다)`
        : ' — 단계 날짜가 조회 기간을 그대로 덮습니다'}.</p>` : ''}
      ${done.map((name) => ((phaseData[name] || {}).error
      ? `<p class="perf-note is-warn">${escapeHtml(name)} — ${escapeHtml(phaseData[name].error)}</p>` : '')).join('')}
      ${done.map((name) => ((phaseData[name] || {}).gap
      ? `<p class="perf-note is-warn">${escapeHtml(name)} 기간에 적재가 안 된 날이 있습니다 —
        ${escapeHtml(phaseData[name].gap)}. 그만큼 광고비가 적게 나옵니다.</p>` : '')).join('')}
    </div>`;
  };

  // 단계 안에서는 캠페인명으로 묶어 한 줄씩 보여 준다.
  // 광고비가 큰 캠페인이 위로 온다. 집행일자는 그 캠페인에 든 광고그룹들의 처음~끝이다.
  const byCampaign = (mine) => {
    const order = [];
    const box = {};
    mine.forEach((one) => {
      const name = one.row.campaignName || '(캠페인 이름 없음)';
      const at = `${one.key}|${name}`;
      if (!box[at]) {
        box[at] = { key: one.key, name: name, rows: [] };
        order.push(at);
      }
      box[at].rows.push(one.row);
    });
    return order.map((at) => {
      const pack = box[at];
      const row = totalsOf(pack.rows);
      const begins = pack.rows.map((one) => one.begin).filter(Boolean).sort();
      const ends = pack.rows.map((one) => one.end).filter(Boolean).sort();
      row.begin = begins[0] || '';
      row.end = ends[ends.length - 1] || '';
      return { key: pack.key, name: pack.name, count: pack.rows.length, row: row };
    }).sort((a, b) => b.row.spend - a.row.spend);
  };

  // 단계마다 한 덩어리. 그 기간의 광고그룹과 그 기간의 값만 들어 있다.
  // 합계는 더한 값에서 비율을 다시 계산한다 (줄마다의 CTR 을 평균 내면 틀린다).
  const phaseBlocks = () => {
    const done = phaseDone();
    const busy = PHASES.filter((name) => (phaseData[name] || {}).status === 'loading');
    const empty = PHASES.filter((name) => (phaseData[name] || {}).status === 'ready' && !phaseRows(name).length);
    if (!done.length && !busy.length && !empty.length) return '';

      const block = (name, i, mine) => {
      const packs = byCampaign(mine);
      const sum = totalsOf(mine.map((one) => one.row));
      return `<div class="perf-phase-box is-${i}">
      <div class="perf-phase-head"><b>${escapeHtml(name)}</b>
        <small>${escapeHtml(spanText2(name))} · 캠페인 ${count(packs.length)}
          (광고그룹 ${count(mine.length)}) · 광고비 ${money(sum.spend)}</small></div>
      <div class="tool-table-wrap"><table class="tool-table perf-table">
        ${crossHead('매체 · 캠페인')}
        <tbody>${packs.map((pack) => `<tr class="perf-child">
          <td class="perf-name"><span>${escapeHtml(SOURCES[pack.key].name)}
            <small>${escapeHtml(pack.name)} · 광고그룹 ${count(pack.count)}</small></span></td>
          <td class="perf-span">${spanText(pack.row) ? escapeHtml(spanText(pack.row)) : '<span class="tool-blank">-</span>'}</td>
          ${crossCells(pack.row)}
        </tr>`).join('')}
          <tr class="perf-row perf-cross-sum"><td class="perf-name"><span><b>${escapeHtml(name)} 합계</b>
            <small>캠페인 ${count(packs.length)} · 광고그룹 ${count(mine.length)}</small></span></td><td></td>
            ${crossCells(sum, true)}</tr>
        </tbody>
      </table></div>
    </div>`;
    };

    const waiting = busy.map((name) => `<div class="perf-phase-box is-${PHASES.indexOf(name)}">
      <div class="perf-phase-head"><b>${escapeHtml(name)}</b>
        <small>${escapeHtml(spanText2(name))} · 불러오는 중…</small></div></div>`).join('');
    const none = empty.map((name) => `<div class="perf-phase-box is-${PHASES.indexOf(name)}">
      <div class="perf-phase-head"><b>${escapeHtml(name)}</b>
        <small>${escapeHtml(spanText2(name))} · 이 기간에 나온 광고그룹이 없습니다</small></div></div>`).join('');

    return `<div class="perf-phases">${phaseSum()}${
      done.map((name) => block(name, PHASES.indexOf(name), phaseRows(name))).join('')}${waiting}${none}</div>${mixCard()}`;
  };

  const crossCard = () => {
    const searched = Object.keys(cross).length > 0;
    const busy = Object.keys(cross).some((key) => cross[key].status === 'loading');
    const sum = searched ? crossTotals() : null;
    const found = searched ? Object.keys(cross).reduce((n, key) => n + (cross[key].rows || []).length, 0) : 0;

    const lines = Object.keys(SOURCES).map((key) => {
      const one = cross[key];
      if (!one) return '';
      const rows = one.rows || [];
      const open = crossOpen.indexOf(key) >= 0;
      const totals = totalsOf(rows);
      const head = `<tr class="perf-row${open ? ' is-open' : ''}" data-cross-row="${key}">
        <td class="perf-name">
          <button type="button" class="perf-toggle"${rows.length ? '' : ' disabled'} data-cross="toggle" data-source="${key}">
            <i data-lucide="${open ? 'chevron-down' : 'chevron-right'}"></i></button>
          <span><b>${escapeHtml(SOURCES[key].name)}</b><small>${one.status === 'loading' ? '찾는 중…'
        : one.status === 'error' ? escapeHtml(one.error || '오류')
          : `광고그룹 ${count(rows.length)}${one.accountName ? ` · ${escapeHtml(one.accountName)}` : ''}${
        one.tried ? ` · 계정 ${count(one.tried)}곳 훑음` : ''}${
        one.note ? ` · 못 읽은 계정: ${escapeHtml(one.note)}` : ''}`}</small></span>
        </td>
        <td></td>
        ${one.status === 'ready' ? crossCells(totals) : '<td></td>'.repeat(CROSS_CELLS)}
      </tr>`;
      if (!open || !rows.length) return head;
      return head + rows.map((row) => `<tr class="perf-child">
        <td class="perf-name"><span class="perf-branch"></span>
          <span>${escapeHtml(row.name)}
          ${row.campaignName ? `<small>${escapeHtml(row.campaignName)}</small>` : ''}</span></td>
        <td class="perf-span"${row.begin || row.end ? ` title="${escapeHtml(`${row.begin || '?'} ~ ${row.end || '종료일 없음'}`)}"` : ''}>${spanText(row) ? escapeHtml(spanText(row)) : '<span class="tool-blank">-</span>'}</td>
        ${crossCells(row)}
      </tr>`).join('');
    }).join('');

    return `<div class="tool-card">
      <div class="tool-list-head">
        <h3>전매체 검색 <small>광고그룹 이름으로 네 매체를 한 번에</small></h3>
        <div class="tool-list-actions">
          <button type="button" class="tool-copy-all" data-perf="cross-excel"${found ? '' : ' disabled'}>
            <i data-lucide="sheet"></i>엑셀 받기</button>
          <button type="button" class="tool-copy-all" data-perf="cross-sales"${found ? '' : ' disabled'}
            title="세일즈 워크스페이스 '행사별 결과 → 매체결과' 에 올리는 파일입니다 (우리 화면과 똑같이 보입니다)">
            <i data-lucide="share-2"></i>세일즈용 파일</button>
        </div>
      </div>
      <div class="perf-filter">
        <div class="perf-search">
          <i data-lucide="search"></i>
          <input type="search" data-perf="cross-text" value="${escapeHtml(crossText)}"
            placeholder="광고그룹 이름 (예: 260902_cj)" autocomplete="off">
        </div>
        <label class="perf-check" title="[cj-260901]_none_cj 에서 대괄호 안의 cj-260901 만 봅니다">
          <input type="checkbox" data-perf="cross-bracket"${crossBracket ? ' checked' : ''}>대괄호 안만</label>
        <button type="button" class="tool-add" data-perf="cross-go"${busy ? ' disabled' : ''}>
          <i data-lucide="search"></i>${busy ? '찾는 중…' : '찾기'}</button>
      </div>
      ${found ? `<div class="perf-filter perf-phase-pick">
        <span class="perf-phase-label">단계 날짜 →</span>
        ${PHASES.map((name, i) => `<span class="perf-phase-span">
          <em class="perf-phase is-${i}">${escapeHtml(name)}</em>
          <input type="date" data-cross="span" data-phase="${escapeHtml(name)}" data-part="since"
            value="${escapeHtml(phaseSpan[name].since)}" title="${escapeHtml(name)} 시작일">
          <span class="perf-phase-tilde">~</span>
          <input type="date" data-cross="span" data-phase="${escapeHtml(name)}" data-part="until"
            value="${escapeHtml(phaseSpan[name].until)}" title="${escapeHtml(name)} 종료일">
        </span>`).join('')}
        <span class="perf-phase-state">${phaseNote ? escapeHtml(phaseNote) : (phaseBusy()
      ? '불러오는 중…'
      : phaseDone().length
        ? `${phaseDone().join(' · ')} 받았습니다`
        : '날짜를 적으면 그 기간만 따로 불러옵니다 · 시트에 함께 담깁니다')}</span>
        ${PHASES.some((name) => phaseSpan[name].since || phaseSpan[name].until) || phaseDone().length
      ? `<button type="button" class="tool-copy-all" data-cross="phase-clear"
          title="세 단계의 날짜와 받아 둔 값을 한 번에 지웁니다">
          <i data-lucide="eraser"></i>단계 날짜 지우기</button>` : ''}
      </div>
      ${spanClash().length ? `<p class="perf-note is-warn">단계 날짜가 겹칩니다 (${escapeHtml(spanClash().join(' / '))}) —
        같은 하루가 두 단계에 들어가서 합계가 그만큼 부풉니다.</p>` : ''}` : ''}
      ${searched ? crossGap() : ''}
      ${searched ? `<div class="tool-table-wrap"><table class="tool-table perf-table">
        <thead><tr><th>매체 · 광고그룹</th><th class="perf-span-head">집행일자</th><th>광고비</th><th>노출</th><th>클릭</th>
          <th>CTR</th><th>CPC</th><th>CPM</th><th>결과</th><th>CVR<small>구매</small></th><th>CPA</th>
          <th>전환값</th><th>ROAS</th></tr></thead>
        <tbody>${lines}
          <tr class="perf-row perf-cross-sum"><td class="perf-name"><span><b>합계</b><small>${escapeHtml(crossFor)}${crossBracket ? ' (대괄호 안)' : ' (이름 전체)'}
            · ${escapeHtml(currentRange().since)} ~ ${escapeHtml(currentRange().until)} · 광고그룹 ${count(found)}</small></span></td>
            <td></td>
            ${crossCells(sum, true)}</tr>
        </tbody>
      </table></div>
      ${phaseBlocks()}
      <p class="perf-note"><em class="perf-net">네이버 GFA ${PERF_NET_TEXT}
        (메타 · 구글 · 카카오모먼트는 매체가 준 값 그대로입니다)</em></p>
      ${found ? '' : `<p class="tool-empty">${busy ? '' : `'${escapeHtml(crossFor)}' 가 들어간 광고그룹을 찾지 못했습니다.`}</p>`}`
      : '<p class="tool-empty">검색어를 넣고 찾기를 누르면 메타 · 구글 · 카카오 · 네이버를 한 번에 훑습니다. 기간과 계정은 각 탭에서 고른 것을 씁니다.</p>'}
      ${busy && !crossWaitOff ? crossWait() : ''}
    </div>`;
  };

  // 고른 매체에 맞는 안내를 보여 준다. (메타 것을 카카오 오류에 띄우면 엉뚱한 이름을 넣게 된다)
  const guide = () => `<div class="tool-card perf-guide">
    <h3>${escapeHtml(source().token)}을 넣어 주세요</h3>
    <p>토큰은 브라우저가 아니라 시트에 붙은 Apps Script 안에 둡니다. 화면에는 내려오지 않습니다.</p>
    <ol>
      <li><a href="${SHEET_URL}" target="_blank" rel="noopener">적재 시트</a> → 확장 프로그램 → Apps Script</li>
      <li>왼쪽 <b>프로젝트 설정</b> → 스크립트 속성 → 속성 추가</li>
      <li>이름 ${source().properties.map((name) => `<code>${name}</code>`).join(' · ')} 을 넣고 저장</li>
      <li>배포 → <b>배포 관리</b> → 연필 → 버전 <b>새 버전</b> → 배포 (주소는 그대로입니다)</li>
    </ol>
  </div>`;

  const render = () => {
    const body = () => {
      if (isAll()) return crossCard();
      if (status === 'loading' && !report) {
        return `<div class="tool-card perf-loading">불러오는 중…</div>${loadWaitOff ? '' : loadWait()}`;
      }
      if (status === 'error') {
        // 자격 증명 때문에 막힌 것으로 보일 때만 안내를 함께 보여 준다
        const missing = source().properties.some((name) => error.indexOf(name) >= 0) || /토큰|스크립트 속성/.test(error);
        return `<div class="tool-card perf-error"><b>불러오지 못했습니다.</b><p>${escapeHtml(error)}</p></div>`
          + (missing ? guide() : '');
      }
      if (!report) return '<div class="tool-card perf-loading">광고 계정을 고르면 성과를 불러옵니다.</div>';
      return stats() + delivery();
    };
    mediaPerformance.innerHTML = `<div class="tool-head">
        <h2>매체별 성과 <small>${source().name}</small></h2>
        <p>광고 계정을 고르면 ${escapeHtml(source().name)} API 로 성과를 불러옵니다.
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
    beginLoad();
    render();
    ask({
      action: `${state.source}Report`, account: account(),
      since: range.since, until: range.until, refresh: Boolean(refresh),
      attribution: state.attribution,
    })
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

  // 상세 보기 한 칸을 받아 온다. 매체마다 쪼개는 이름이 달라도 답은 같은 모양이다.
  const loadBreakdown = (key) => {
    const range = currentRange();
    detail.status[key] = 'loading';
    render();
    ask({
      action: `${state.source}Breakdown`, account: account(),
      campaign: detail.campaign, adset: detail.adset,
      since: range.since, until: range.until, breakdown: key,
      attribution: state.attribution,
    })
      .then((body) => {
        detail.data[key] = body.rows || [];
        detail.status[key] = 'ready';
        render();
      })
      .catch((reason) => {
        detail.status[key] = 'error';
        detail.error[key] = reason.message;
        render();
      });
  };

  const useAccounts = () => {
    // 목록도 못 받고 아는 계정도 없으면 (아직 계정 번호를 적어 두지 않은 매체) 여기서 멈춘다.
    if (!accounts.length) {
      status = 'error';
      error = listNote || '볼 수 있는 광고 계정이 없습니다.';
      render();
      return;
    }
    if (!accounts.some((item) => item.id === account())) setAccount(accounts[0].id);
    save();
    loadReport(false);
  };

  const loadAccounts = () => {
    status = 'loading';
    beginLoad();
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
  // 한글 조합 중에는 그리지 않는다 — 다시 그리면 조합이 끊겨 낱자로 흩어진다.
  const takeSearch = (target) => {
    query = target.value;
    caret = target.selectionStart;
    render();
  };
  mediaPerformance.addEventListener('input', (event) => {
    if (event.target.dataset.perf !== 'search') return;
    if (event.isComposing) { query = event.target.value; return; }
    takeSearch(event.target);
  });
  mediaPerformance.addEventListener('compositionend', (event) => {
    if (event.target.dataset.perf !== 'search') return;
    takeSearch(event.target);
  });

  mediaPerformance.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    if (!event.target.closest('[data-perf="cross-text"]')) return;
    event.preventDefault();
    // change 는 포커스를 잃을 때 오므로 엔터로 찾을 때는 아직 값이 안 들어와 있다. 직접 읽는다.
    crossText = event.target.value;
    crossSearch();
  });

  mediaPerformance.addEventListener('change', (event) => {
    const span = event.target.closest('[data-cross="span"]');
    if (span) {
      const name = span.dataset.phase;
      phaseSpan[name][span.dataset.part] = event.target.value;
      savePhases();
      // 날짜를 다 적었으면 그 단계를 바로 받아 온다. 덜 적었으면 받아 둔 값을 치운다.
      if (spanReady(name)) phaseLoad(name);
      else { delete phaseData[name]; render(); }
      return;
    }
    const field = event.target.dataset.perf;
    if (!field) return;
    if (field === 'paused') { withPaused = event.target.checked; render(); return; }
    if (field === 'today') {
      rangeState().today = event.target.checked;
      save();
      if (isAll()) render();
      else loadReport(false);
      return;
    }
    if (field === 'query-bracket') { queryBracket = event.target.checked; render(); return; }
    if (field === 'cross-bracket') {
      crossBracket = event.target.checked;
      // 이미 받아 둔 값이 있으면 다시 부르지 않고 기준만 바꿔 다시 걸러 준다
      if (crossFor) crossSearch();
      else render();
      return;
    }

    if (field === 'detail-table') { detail.table = event.target.checked; render(); return; }
    if (field === 'breakdown') {
      const key = event.target.dataset.breakdown;
      const at = detail.picked.indexOf(key);
      if (at >= 0) detail.picked.splice(at, 1);
      else {
        detail.picked.push(key);
        if (!detail.data[key]) { loadBreakdown(key); return; }
      }
      render();
      return;
    }
    if (field === 'account') { setAccount(event.target.value); save(); loadReport(false); return; }
    if (field === 'preset') {
      rangeState().preset = event.target.value;
      if (rangeState().preset === 'custom') {
        const now = currentRange();
        rangeState().since = rangeState().since || now.since;
        rangeState().until = rangeState().until || now.until;
        save();
        render();
        return;
      }
      save();
      loadReport(false);
      return;
    }
    // 여기서 다시 그리면 글자마다 커서를 잃는다. 값만 담아 두고 찾을 때 읽는다.
    if (field === 'cross-text') { crossText = event.target.value; return; }
    if (field === 'since' || field === 'until') {
      rangeState()[field] = event.target.value;
      save();
      if (rangeState().since && rangeState().until) loadReport(false);
    }
  });

  mediaPerformance.addEventListener('click', (event) => {
    const basis = event.target.closest('[data-perf="window"]');
    if (basis) {
      const key = basis.dataset.window || '';
      if (key === state.attribution) return;
      state.attribution = key;
      save();
      // 칸만 숨기는 게 아니다. 서버가 그 어트리뷰션 칸을 읽어 구매 · 매출을 다시 세므로
      // 반드시 다시 받아야 한다.
      detail = noDetail();
      loadReport(false);
      return;
    }
    const tab = event.target.closest('[data-perf="source"]');
    if (tab) {
      if (tab.dataset.source === state.source) return;
      state.source = tab.dataset.source;
      // 매체마다 주는 어트리뷰션이 달라 (구글 · GFA 는 아예 없다) 못 쓰는 것은 떨군다
      if (!(source().windows || []).some(([key]) => key === state.attribution)) state.attribution = '';
      save();
      accounts = [];
      report = null;
      opened = [];
      detail = noDetail();
      listNote = '';
      query = '';
      picked = [];
      // 전매체 탭은 계정을 고르지 않는다. 찾기를 누를 때 매체별로 알아서 부른다.
      if (isAll()) render();
      else loadAccounts();
      return;
    }
    if (event.target.closest('[data-perf="cross-sales"]')) { salesDownload(); return; }
    if (event.target.closest('[data-perf="cross-excel"]')) {
      const period = currentRange();
      perfDownload(`전매체검색_${crossFor}_${period.since}_${period.until}.csv`, crossTable());
      return;
    }
    if (event.target.closest('[data-perf="cross-go"]')) { crossSearch(); return; }
    if (event.target.closest('[data-cross="wait-close"]')) { crossWaitOff = true; render(); return; }
    if (event.target.closest('[data-perf="wait-close"]')) { loadWaitOff = true; render(); return; }
    const mixBtn = event.target.closest('[data-cross="mix"]');
    if (mixBtn) {
      const one = mixFiles().find((x) => x.key === mixBtn.dataset.key
        && x.phase === mixBtn.dataset.phase);
      if (one) perfDownload(mixName(one), mixCsv(one.rows));
      return;
    }

    // 세 단계의 날짜와 받아 둔 값을 한 번에 지운다
    if (event.target.closest('[data-cross="phase-clear"]')) {
      PHASES.forEach((name) => { phaseSpan[name] = { since: '', until: '' }; });
      phaseData = {};
      phaseFor = '';
      savePhases();
      render();
      return;
    }

    const crossToggle = event.target.closest('[data-cross="toggle"]');
    if (crossToggle) {
      const key = crossToggle.dataset.source;
      crossOpen = crossOpen.indexOf(key) >= 0 ? crossOpen.filter((one) => one !== key) : crossOpen.concat(key);
      render();
      return;
    }
    const more = event.target.closest('[data-perf="detail"]');
    if (more) {
      // 한 번에 하나만 연다. 다른 줄을 열면 앞서 받아 둔 상세는 버린다.
      const keep = { metric: detail.metric, table: detail.table };
      const wanted = { campaign: more.dataset.campaign, adset: more.dataset.adset || '' };
      const same = detail.campaign === wanted.campaign && detail.adset === wanted.adset;
      detail = same ? { ...noDetail(), ...keep } : { ...noDetail(), ...keep, ...wanted };
      render();
      return;
    }
    const metricChip = event.target.closest('[data-perf="metric"]');
    if (metricChip) { detail.metric = metricChip.dataset.metric; render(); return; }
    if (event.target.closest('[data-perf="clear"]')) { query = ''; caret = 0; render(); return; }
    const chip = event.target.closest('[data-perf="objective"]');
    if (chip) {
      const key = chip.dataset.objective;
      picked = picked.indexOf(key) >= 0 ? picked.filter((entry) => entry !== key) : picked.concat(key);
      render();
      return;
    }
    if (event.target.closest('[data-perf="reload"]')) { loadReport(true); return; }
    if (event.target.closest('[data-perf="excel"]')) {
      const period = currentRange();
      perfDownload(`매체별성과_${source().name}_${period.since}_${period.until}.csv`, copyText());
      return;
    }
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
    const split = Boolean(source().splitResults);
    const head = ['캠페인', '광고그룹', '목적', '예산', '광고비', '노출', source().clicks, 'CTR', 'CPC', 'CPM']
      .concat(split ? ['구매', '장바구니', 'CVR(구매)', 'CPS', 'CPB', '구매매출'] : ['결과', 'CVR(구매)', 'CPA', '구매전환값'])
      .concat(['ROAS']);
    const line = (campaign, adset) => {
      const row = adset || campaign;
      const cpa = isTraffic(row) ? '' : ratio(row.spend, row.results);
      return [
        campaign.name, adset ? adset.name : '', OBJECTIVES[campaign.objective] || campaign.objective || '',
        row.budget || '', Math.round(row.spend), row.impressions, row.linkClicks,
        ratio(row.linkClicks, row.impressions) === null ? '' : percent(ratio(row.linkClicks, row.impressions)),
        ratio(row.spend, row.linkClicks) === null ? '' : Math.round(ratio(row.spend, row.linkClicks)),
        ratio(row.spend * 1000, row.impressions) === null ? '' : Math.round(ratio(row.spend * 1000, row.impressions)),
      ].concat(split
        ? [row.purchase, row.addToCart,
          cvrOf(row) === null ? '' : percent(cvrOf(row)),
          ratio(row.spend, row.purchase) === null ? '' : Math.round(ratio(row.spend, row.purchase)),
          ratio(row.spend, row.addToCart) === null ? '' : Math.round(ratio(row.spend, row.addToCart))]
        : [row.results, cvrOf(row) === null ? '' : percent(cvrOf(row)),
          cpa === null || cpa === '' ? '' : Math.round(cpa)])
        .concat([Math.round(row.revenue || 0),
          ratio(row.revenue, row.spend) === null ? '' : perfRoas(ratio(row.revenue, row.spend))])
        .join('\t');
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
    // 전매체 탭을 보던 사람은 계정을 부를 일이 없다 (찾기를 누를 때 매체별로 부른다)
    if (!isAll()) loadAccounts();
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
  let kind = '';        // '' 전체 · image · video
  let picked = [];      // 고른 목적 (여럿이면 OR)
  let groupQuery = '';  // 광고그룹 이름으로 검색
  let groupBracket = true;   // 광고그룹 검색은 대괄호 안(행사 이름)만 본다

  // 정렬 차례. [값, 이름, 뽑는 함수, 큰 것이 먼저인가]
  const SORTS = [
    ['spend', '광고비 높은 순', (row) => row.spend, true],
    ['impressions', '노출 높은 순', (row) => row.impressions, true],
    ['roas', 'ROAS 높은 순', (row) => perfRatio(row.revenue, row.spend), true],
    // 광고비 0 인 줄은 CPS · CPC 를 '0원' 으로 셀 수 있다 (지난 기간 전환이 남은 소재).
    // 그대로 두면 돈을 한 푼도 안 쓴 소재가 '가장 싼 소재' 로 맨 앞에 선다.
    // 값이 없는 것으로 보아 뒤로 보낸다.
    ['cps', 'CPS 낮은 순', (row) => (row.spend > 0 ? perfRatio(row.spend, row.purchase) : null), false],
    ['cpc', 'CPC 낮은 순', (row) => (row.spend > 0 ? perfRatio(row.spend, row.linkClicks) : null), false],
    ['ctr', 'CTR 높은 순', (row) => perfRatio(row.linkClicks, row.impressions), true],
  ];
  let sortBy = 'spend';
  try { sortBy = window.localStorage.getItem('minix-creative-sort') || 'spend'; } catch (ignore) { sortBy = 'spend'; }
  if (!SORTS.some(([key]) => key === sortBy)) sortBy = 'spend';
  let caret = null;
  let caretAt = 'search';   // 커서를 돌려놓을 검색창 (소재 이름 · 광고그룹)
  let fetchedAt = '';
  let notice = '';       // 매체가 알려 준 사정 (미리보기를 못 받은 이유 등)
  let loadStart = 0;     // 소재를 부르기 시작한 시각
  let loadTick = null;   // 흐른 시간을 고쳐 쓰는 타이머
  let loadWaitOff = false;
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

  // 소재 유형 — 메타는 동영상 id 가 있으면 동영상, 구글은 광고 유형에 VIDEO 가 들어 있으면 동영상.
  const kindOf = (row) => {
    if (row.video) return 'video';
    if (/VIDEO/.test(String(row.objective || ''))) return 'video';
    return 'image';
  };
  const KINDS = [['image', '이미지'], ['video', '동영상']];

  // 소재에는 목적이 안 실려 오는 매체가 있다 (메타는 빈 값). 그 소재가 속한 캠페인의
  // 목적을 보고서에서 찾아 쓴다. 매체별 성과 화면과 같은 기준이 된다.
  const objectiveOf = (row) => {
    if (row.objective) return PERF_OBJECTIVES[row.objective] || row.objective;
    const owner = (report ? report.campaigns : []).find((one) => one.id === row.campaignId);
    const code = owner ? owner.objective : '';
    return code ? (PERF_OBJECTIVES[code] || code) : '';
  };

  // 고를 수 있는 목적 (불러온 소재에서 뽑는다). 종류가 하나뿐이면 버튼을 두지 않는다.
  const objectives = () => {
    const seen = [];
    creatives.forEach((row) => {
      const name = objectiveOf(row);
      if (name && seen.indexOf(name) < 0) seen.push(name);
    });
    return seen.sort();
  };

  const shown = () => {
    const rows = creatives.filter((row) => {
      if (kind && kindOf(row) !== kind) return false;
      if (picked.length && picked.indexOf(objectiveOf(row)) < 0) return false;
      // 소재 이름에는 대괄호가 없다 (6108_20260827_flender-mini_price-66_image_ljm).
      // 그래서 대괄호 조건은 광고그룹 이름에만 쓴다.
      if (!perfNameHit(row.adsetName, groupQuery.trim().toLowerCase(), groupBracket)) return false;
      return !query || String(row.name).toLowerCase().indexOf(query.toLowerCase()) >= 0;
    });

    const [, , pick, big] = SORTS.find(([key]) => key === sortBy) || SORTS[0];
    // 값이 없는 줄(클릭 0 의 CPC, 구매 0 의 CPS …)은 늘 뒤로 보낸다.
    // 0 으로 치면 '가장 싼 소재' 로 맨 앞에 서서 표를 못 믿게 된다.
    return rows.slice().sort((a, b) => {
      const one = pick(a);
      const two = pick(b);
      const noOne = one === null || !Number.isFinite(one);
      const noTwo = two === null || !Number.isFinite(two);
      if (noOne && noTwo) return b.spend - a.spend;   // 둘 다 없으면 광고비 순
      if (noOne) return 1;
      if (noTwo) return -1;
      if (one === two) return b.spend - a.spend;
      return big ? two - one : one - two;
    });
  };

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
          <i data-lucide="refresh-cw"></i>${status === 'loading' ? '불러오는 중…' : '새로고침'}</button>
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
        ${PERF_NET_SOURCES.indexOf(state.source) >= 0 ? `<em class="perf-net">${PERF_NET_TEXT}</em>` : ''}
      </p>
    </div>`;
  };

  const metricRow = (label, value) => `<div><small>${label}</small><b>${value}</b></div>`;

  const card = (row) => {
    const ctr = perfRatio(row.linkClicks, row.impressions);
    const cpc = perfRatio(row.spend, row.linkClicks);
    const cpm = perfRatio(row.spend * 1000, row.impressions);
    const cpa = perfRatio(row.spend, row.results);
    const roas = perfRatio(row.revenue, row.spend);
    // CVR 은 매체별 성과와 같이 **구매 기준**이다 (구매 ÷ 클릭)
    const cvr = perfRatio(row.purchase, row.linkClicks);
    // GFA 는 구매 · 장바구니를 갈라 본다 (합치면 장바구니가 구매를 덮는다)
    const split = Boolean(source().splitResults);
    return `<article class="creative-card">
      <div class="creative-shot">
        ${row.thumbnail
    ? `<a href="${perfEscape(row.thumbnail)}" target="_blank" rel="noopener" title="원본 크게 보기"><img
        src="${perfEscape(row.thumbnail)}" alt="${perfEscape(row.name)}" loading="lazy" referrerpolicy="no-referrer"></a>`
    : '<span class="creative-none"><i data-lucide="image-off"></i>미리보기 없음</span>'}
        ${row.active ? '<span class="creative-live">게재중</span>' : ''}
        <span class="creative-kind">${kindOf(row) === 'video' ? '동영상' : '이미지'}</span>
      </div>
      <div class="creative-body">
        <h4>${perfEscape(row.name)}</h4>
        <p>${perfEscape(row.campaignName || '')}${row.adsetName ? ` · ${perfEscape(row.adsetName)}` : ''}</p>
        ${row.copy ? `<div class="creative-copy">
          <p>${state.source === 'naver' ? '<b class="creative-copy-tag">광고문구</b>' : ''}${perfEscape(row.copy)}</p>
          <button type="button" class="creative-copy-btn" data-creative="copy-text"
            data-text="${perfEscape(row.copy)}" title="문구 복사"><i data-lucide="copy"></i></button>
        </div>` : ''}
        <div class="creative-metrics">
          ${metricRow('광고비', money(row.spend))}
          ${split ? `${metricRow('구매', perfCount(row.purchase))}${metricRow('장바구니', perfCount(row.addToCart))}`
    : metricRow('결과', perfCount(row.results))}
          ${metricRow('노출', perfCount(row.impressions))}
          ${metricRow(source().clicks, perfCount(row.linkClicks))}
          ${metricRow('CTR', blank(ctr, perfPercent))}
          ${metricRow('CPC', blank(cpc, money))}
          ${metricRow('CPM', blank(cpm, money))}
          ${metricRow('CVR', blank(cvr, perfPercent))}
          ${split
    ? `${metricRow('CPS', blank(perfRatio(row.spend, row.purchase), money))}${metricRow('CPB', blank(perfRatio(row.spend, row.addToCart), money))}`
    : metricRow('CPA', blank(cpa, money))}
          ${metricRow(split ? '구매매출' : '전환값', row.revenue ? money(row.revenue) : '<span class="tool-blank">—</span>')}
          ${metricRow('ROAS', blank(roas, perfRoas))}
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
      revenue: sum.revenue + (Number(row.revenue) || 0),
      purchase: sum.purchase + row.purchase,
      addToCart: sum.addToCart + row.addToCart,
      lead: sum.lead + row.lead,
    }), { spend: 0, impressions: 0, linkClicks: 0, results: 0, revenue: 0,
      purchase: 0, addToCart: 0, lead: 0 });

    const where = state.adset
      ? (report.adsets.find((row) => row.id === state.adset) || {}).name
      : (state.campaign ? (report.campaigns.find((row) => row.id === state.campaign) || {}).name : '');
    const scope = where || '전체 캠페인';
    const card = (label, value, note) => `<div class="perf-stat"><small>${label}</small><strong>${value}</strong><em>${note}</em></div>`;

    return `${notice ? `<p class="perf-warn">${perfEscape(notice)}</p>` : ''}
      <p class="creative-scope">${perfEscape(scope)}
        <small>소재 ${perfCount(rows.length)}개${rows.length !== creatives.length
    ? ` (${[kind ? (kind === 'video' ? '동영상' : '이미지') : '', picked.length ? picked.join(' · ') : '',
      query ? '소재 검색' : '', groupQuery ? '광고그룹 검색' : ''].filter(Boolean).join(' · ')}만)`
    : ''}</small></p>
      <div class="perf-stats">
        ${card('총광고비', money(total.spend), `소재 ${perfCount(rows.length)}개`)}
        ${card('총결과', perfCount(total.results), `구매 ${perfCount(total.purchase)} · 장바구니 ${perfCount(total.addToCart)} · 리드 ${perfCount(total.lead)}`)}
        ${card('CPC', blank(perfRatio(total.spend, total.linkClicks), money), `${source().clicks} ${perfCount(total.linkClicks)}회`)}
        ${card('CTR', blank(perfRatio(total.linkClicks, total.impressions), perfPercent), `${source().clicks} ÷ 노출`)}
        ${card('CPM', blank(perfRatio(total.spend * 1000, total.impressions), money), `노출 ${perfCount(total.impressions)}회`)}
        ${card('CVR', blank(perfRatio(total.purchase, total.linkClicks), perfPercent),
    `구매 ${perfCount(total.purchase)}건 ÷ ${source().clicks}`)}
        ${source().splitResults
    ? `${card('CPS', blank(perfRatio(total.spend, total.purchase), money), `구매 ${perfCount(total.purchase)}건`)}
       ${card('CPB', blank(perfRatio(total.spend, total.addToCart), money), `장바구니 ${perfCount(total.addToCart)}건`)}`
    : card('CPA', blank(perfRatio(total.spend, total.results), money), '광고비 ÷ 결과')}
        ${card('ROAS', blank(perfRatio(total.revenue, total.spend), perfRoas),
    `${source().splitResults ? '구매매출' : '구매전환값'} ${money(total.revenue)}`)}
      </div>`;
  };

  const list = () => {
    const rows = shown();
    return `${summary()}<div class="tool-card">
      <div class="tool-list-head">
        <h3>소재 <small>${perfEscape((SORTS.find(([key]) => key === sortBy) || SORTS[0])[1])} · ${perfCount(creatives.length)}개</small></h3>
        <div class="tool-list-actions">
          <!-- 소재를 보다가 다시 받고 싶을 때 위 필터까지 올라가지 않아도 되게 여기에도 둔다 -->
          <button type="button" class="tool-copy-all" data-creative="reload"${status === 'loading' ? ' disabled' : ''}>
            <i data-lucide="refresh-cw"></i>${status === 'loading' ? '받는 중…' : '새로고침'}</button>
          <button type="button" class="tool-copy-all" data-creative="copy"${rows.length ? '' : ' disabled'}>
            <i data-lucide="copy"></i>표 복사</button>
          <button type="button" class="tool-copy-all" data-creative="excel"${rows.length ? '' : ' disabled'}>
            <i data-lucide="sheet"></i>엑셀 받기</button>
        </div>
      </div>
      <div class="perf-filter">
        <div class="perf-search">
          <i data-lucide="search"></i>
          <input type="search" data-creative="search" value="${perfEscape(query)}" placeholder="소재 이름으로 검색" autocomplete="off">
          ${query ? '<button type="button" class="perf-clear" data-creative="clear" aria-label="지우기">×</button>' : ''}
        </div>
        <div class="perf-search">
          <i data-lucide="layers"></i>
          <input type="search" data-creative="group" value="${perfEscape(groupQuery)}" placeholder="광고그룹 이름으로 검색" autocomplete="off">
          ${groupQuery ? '<button type="button" class="perf-clear" data-creative="group-clear" aria-label="지우기">×</button>' : ''}
        </div>
        <label class="perf-check" title="[cj-260901]_none_cj 에서 대괄호 안의 cj-260901 만 봅니다">
          <input type="checkbox" data-creative="group-bracket"${groupBracket ? ' checked' : ''}>대괄호 안만</label>
        <div class="perf-chips">
          ${KINDS.map(([key, name]) => {
    const many = creatives.filter((row) => kindOf(row) === key).length;
    if (!many) return '';
    return `<button type="button" class="perf-chip${kind === key ? ' is-on' : ''}"
      data-creative="kind" data-kind="${key}">${name} ${perfCount(many)}</button>`;
  }).join('')}
        </div>
        ${objectives().length > 1 ? `<div class="perf-chips">
          ${objectives().map((name) => `<button type="button" class="perf-chip${picked.indexOf(name) >= 0 ? ' is-on' : ''}"
            data-creative="objective" data-objective="${perfEscape(name)}">${perfEscape(name)}</button>`).join('')}
        </div>` : ''}
        ${rows.length !== creatives.length ? `<span class="perf-count">${perfCount(rows.length)} / ${perfCount(creatives.length)}</span>` : ''}
        <label class="perf-sort">정렬
          <select data-creative="sort">${SORTS.map(([key, name]) => `<option value="${key}"${key === sortBy ? ' selected' : ''}>${name}</option>`).join('')}</select>
        </label>
      </div>
      ${rows.length
    ? `<div class="creative-grid">${rows.map(card).join('')}</div>`
    : `<p class="tool-empty">${query ? '찾는 소재가 없습니다.' : '이 기간에 집행된 소재가 없습니다.'}</p>`}
    </div>`;
  };

  // 매체별 성과와 같은 알림. 카카오는 여기가 40초로 가장 길다.
  const loadWait = () => `<div class="perf-wait-back" data-creative="wait-close"></div>
      <div class="perf-wait" role="status" aria-live="polite">
        <div class="perf-wait-head">
          <i data-lucide="loader-circle"></i>
          <span><b>${perfEscape(source().name)} 소재를 불러오는 중</b>
            <small>잠시 기다려 주세요</small></span>
        </div>
        <p class="perf-wait-note">${perfEscape(source().adWaitNote || '')}</p>
        <p class="perf-wait-note">한 번 받아 두면 <b>5분 동안</b>은 곧바로 열립니다.</p>
        <p class="perf-wait-slow" data-creative-slow hidden></p>
        <button type="button" class="perf-wait-hide" data-creative="wait-close">닫고 기다리기</button>
      </div>`;

  const loadTickOff = () => {
    if (!loadTick) return;
    window.clearInterval(loadTick);
    loadTick = null;
  };

  const loadTickOn = () => {
    if (loadTick) return;
    loadTick = window.setInterval(() => {
      if (status !== 'loading') { loadTickOff(); return; }
      const spent = (Date.now() - loadStart) / 1000;
      const slow = document.querySelector('[data-creative-slow]');
      if (slow) {
        const text = askState.tries > 1
          ? `구글이 응답을 흘려 다시 물어보는 중입니다 (${askState.tries}/${SHEET_TRIES}번째). 조금 더 걸립니다.`
          : (spent > (source().adWait || 10) * 2
            ? '생각보다 오래 걸리고 있습니다. 구글이 응답을 늦게 주는 때가 있어 최대 3번까지 다시 물어봅니다.'
            : '');
        slow.textContent = text;
        slow.hidden = !text;
      }
    }, 100);
  };

  // 여기는 계정 목록 → 성과 → 소재, 세 단계다. 시간은 처음 시작한 때부터 잰다.
  const beginLoad = () => {
    if (!loadTick) {
      loadStart = Date.now();
      loadWaitOff = false;
    }
    loadTickOn();
  };

  const render = () => {
    const body = () => {
      if (status === 'error') return `<div class="tool-card perf-error"><b>불러오지 못했습니다.</b><p>${perfEscape(error)}</p></div>`;
      if (status === 'loading' && !creatives.length) {
        return `<div class="tool-card perf-loading">불러오는 중…</div>${loadWaitOff ? '' : loadWait()}`;
      }
      if (!report) return '<div class="tool-card perf-loading">광고 계정을 고르면 소재를 불러옵니다.</div>';
      return list();
    };
    creativePerformance.innerHTML = `<div class="tool-head">
        <h2>소재별 결과 <small>${source().name}</small></h2>
        <p>캠페인 · 광고그룹을 고르면 그 안의 소재를 미리보기와 함께 광고비가 큰 차례로 보여 줍니다.</p>
      </div>${controls()}${body()}`;
    lucide.createIcons();
    if (caret !== null) {
      const search = creativePerformance.querySelector(`[data-creative="${caretAt}"]`);
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
    beginLoad();
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
        notice = body.notice || '';
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

  // 캠페인 · 광고그룹 고르개를 채우려고 성과도 받는다 (매체별 성과와 같은 요청이라 캐시를 함께 쓴다)
  // **소재와 함께 부른다.** 소재는 성과를 기다릴 이유가 없다 — 성과는 고르개를 채우는 데만 쓴다.
  // 잇달아 부르면 두 번의 왕복(각 5~12초)이 그대로 더해져 화면이 그만큼 늦게 뜬다.
  const loadReport = (refresh) => {
    if (!account()) return;
    const range = currentRange();
    status = 'loading';
    beginLoad();
    render();

    const asked = { campaign: state.campaign, adset: state.adset };
    loadCreatives(refresh);   // 기다리지 않고 같이 출발한다

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
        // 고른 캠페인 · 광고그룹이 이 계정에 없어 지워졌으면 소재를 다시 받아야 한다.
        // 그대로면 이미 받아 둔 소재가 맞으니 고르개만 다시 그린다.
        if (state.campaign !== asked.campaign || state.adset !== asked.adset) loadCreatives(refresh);
        else render();
      })
      .catch((reason) => {
        // 소재가 이미 왔으면 그것을 지우지 않는다. 고르개만 못 채운 것이다.
        if (status !== 'ready') {
          status = 'error';
          error = reason.message;
        }
        render();
      });
  };

  const loadAccounts = () => {
    status = 'loading';
    beginLoad();
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
        // 목록도 못 받고 아는 계정도 없으면 (아직 계정 번호를 적어 두지 않은 매체) 여기서 멈춘다.
        if (!accounts.length) {
          status = 'error';
          error = '볼 수 있는 광고 계정이 없습니다.';
          render();
          return;
        }
        if (!accounts.some((item) => item.id === account())) setAccount(accounts[0].id);
        save();
        loadReport(false);
      });
  };

  // 한글 조합 중에는 그리지 않는다 (조합이 끊기면 '사이즈' 가 'ㅅㅏㅇㅣㅈㅡ' 가 된다)
  const takeCreativeSearch = (target, field, draw) => {
    if (field === 'search') query = target.value;
    else groupQuery = target.value;
    if (!draw) return;
    caretAt = field;
    caret = target.selectionStart;
    render();
  };
  creativePerformance.addEventListener('input', (event) => {
    const field = event.target.dataset.creative;
    if (field !== 'search' && field !== 'group') return;
    takeCreativeSearch(event.target, field, !event.isComposing);
  });
  creativePerformance.addEventListener('compositionend', (event) => {
    const field = event.target.dataset.creative;
    if (field !== 'search' && field !== 'group') return;
    takeCreativeSearch(event.target, field, true);
  });

  creativePerformance.addEventListener('change', (event) => {
    if (event.target.dataset.creative === 'sort') {
      sortBy = event.target.value;
      try { window.localStorage.setItem('minix-creative-sort', sortBy); } catch (ignore) { /* 거들기다 */ }
      render();
      return;
    }
    if (event.target.dataset.creative === 'group-bracket') {
      groupBracket = event.target.checked;
      render();
      return;
    }
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
    if (event.target.closest('[data-creative="wait-close"]')) { loadWaitOff = true; render(); return; }
    const tab = event.target.closest('[data-creative="source"]');
    if (tab) {
      if (tab.dataset.source === state.source) return;
      state.source = tab.dataset.source;
      state.campaign = '';
      state.adset = '';
      query = '';
      kind = '';
      accounts = [];
      report = null;
      creatives = [];
      save();
      loadAccounts();
      return;
    }
    if (event.target.closest('[data-creative="clear"]')) { query = ''; caretAt = 'search'; caret = 0; render(); return; }
    if (event.target.closest('[data-creative="group-clear"]')) { groupQuery = ''; caretAt = 'group'; caret = 0; render(); return; }
    const chip = event.target.closest('[data-creative="kind"]');
    if (chip) {
      kind = kind === chip.dataset.kind ? '' : chip.dataset.kind;
      render();
      return;
    }
    const objectiveChip = event.target.closest('[data-creative="objective"]');
    if (objectiveChip) {
      const name = objectiveChip.dataset.objective;
      picked = picked.indexOf(name) >= 0 ? picked.filter((one) => one !== name) : [...picked, name];
      render();
      return;
    }
    if (event.target.closest('[data-creative="reload"]')) { loadReport(true); return; }
    const copyOne = event.target.closest('[data-creative="copy-text"]');
    if (copyOne) {
      const text = copyOne.dataset.text || '';
      if (window.navigator.clipboard?.writeText) window.navigator.clipboard.writeText(text).catch(() => {});
      else window.prompt('복사하세요', text);
      copyOne.classList.add('is-copied');
      window.setTimeout(() => copyOne.classList.remove('is-copied'), 1200);
      return;
    }
    if (event.target.closest('[data-creative="excel"]')) {
      const period = currentRange();
      perfDownload(`소재별결과_${source().name}_${period.since}_${period.until}.csv`, copyText());
      return;
    }
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
    const head = ['소재', '유형', '캠페인', '광고그룹', '문구', '짧은문구',
      '광고비', '노출', source().clicks, 'CTR', 'CPC', 'CPM']
      .concat(source().splitResults
        ? ['구매', '장바구니', 'CVR(구매)', 'CPS', 'CPB', '구매매출']
        : ['결과', 'CVR(구매)', 'CPA', '구매전환값'])
      .concat(['ROAS']);
    const lines = [head.join('\t')];
    shown().forEach((row) => {
      const ctr = perfRatio(row.linkClicks, row.impressions);
      const cpc = perfRatio(row.spend, row.linkClicks);
      const cpm = perfRatio(row.spend * 1000, row.impressions);
      const cpa = perfRatio(row.spend, row.results);
      const cvr = perfRatio(row.purchase, row.linkClicks);
      lines.push([
        row.name, kindOf(row) === 'video' ? '동영상' : '이미지', row.campaignName || '', row.adsetName || '',
        row.copy || '', row.altCopy || '',
        Math.round(row.spend), row.impressions, row.linkClicks,
        ctr === null ? '' : perfPercent(ctr),
        cpc === null ? '' : Math.round(cpc),
        cpm === null ? '' : Math.round(cpm),
      ].concat(source().splitResults
        ? [row.purchase, row.addToCart,
          cvr === null ? '' : perfPercent(cvr),
          perfRatio(row.spend, row.purchase) === null ? '' : Math.round(perfRatio(row.spend, row.purchase)),
          perfRatio(row.spend, row.addToCart) === null ? '' : Math.round(perfRatio(row.spend, row.addToCart))]
        : [row.results, cvr === null ? '' : perfPercent(cvr),
          cpa === null ? '' : Math.round(cpa)])
        .concat([Math.round(row.revenue || 0),
          perfRatio(row.revenue, row.spend) === null ? '' : perfRoas(perfRatio(row.revenue, row.spend))])
        .join('\t'));
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

// ── 페이지 결과 (Microsoft Clarity) ──────────────────────────────────
// 링크를 넣으면 그 페이지의 스크롤 깊이를 보여 주고, 히트맵은 Clarity 로 넘긴다.
//
// **히트맵 그림은 API 로 못 받는다.** Clarity 의 데이터 내보내기 API 는 숫자만 주고
// 클릭 좌표는 주지 않는다. 대시보드는 iframe 을 막아 두어 화면 안에 띄울 수도 없다.
// 그래서 그 페이지의 히트맵 화면으로 바로 가는 링크를 만들어 준다.
//
// API 에 두 가지 굵은 제약이 있다 (Code.gs 쪽에도 적어 두었다).
//   1. 프로젝트마다 하루 10번. 그래서 받은 목록을 6시간 담아 두고 링크 찾기는 그 안에서 한다.
//   2. 최대 3일치. 그래서 기간 고르개도 1 · 2 · 3일까지만 있다. 시작일 · 종료일 파라미터가
//      없어서 '지난 N일' 로만 물을 수 있다 — 지나간 기간(지난주 …)은 이 API 로 볼 수 없다.
const pagePerformance = document.querySelector('#page-performance');
if (pagePerformance) {
  const CLARITY_HOME = 'https://clarity.microsoft.com/projects/view';
  // 시트가 프로젝트 번호를 못 줄 때 쓰는 값 (주소에 그대로 드러나는 값이라 비밀이 아니다)
  const CLARITY_PROJECT = 'qx7hp66pv0';
  // 화면마다 자기 것을 따로 두는 함수다. 여기서도 하나 끌어다 쓴다.
  const escapeHtml = perfEscape;

  // 볼 수 있는 기간. Clarity 가 3일까지만 주므로 이게 전부다.
  const PAGE_DAYS = [[1, '지난 1일'], [2, '지난 2일'], [3, '지난 3일']];
  let days = Number(window.localStorage.getItem('minix-clarity-days') || 3);
  if (PAGE_DAYS.every(([value]) => value !== days)) days = 3;

  let list = null;         // { projectId, days, calls, total, pages, fetchedAt }
  let listState = 'idle';  // idle · loading · ready · error
  let listError = '';
  let query = '';          // 입력 중인 링크
  let found = null;        // 찾은 결과
  let findState = 'idle';
  let findError = '';
  let caretAt = null;
  // 미리보기를 띄운 페이지 주소. **누를 때만** 띄운다 —
  // 그 페이지에 Clarity 스크립트가 심겨 있어서, 띄우는 순간 우리 방문이 한 건 기록된다.
  // 화면을 열 때마다 자동으로 띄우면 우리가 보는 통계를 우리가 흐려 놓는 셈이 된다.
  let preview = '';
  // 상위 페이지 표를 펴 둘지. 한 번 접으면 그대로 기억한다.
  let showTop = window.localStorage.getItem('minix-clarity-top') !== 'off';

  const askPage = askSheet;

  const num = (value) => new Intl.NumberFormat('ko-KR').format(Math.round(Number(value) || 0));
  const pretty = (url) => {
    try { return decodeURIComponent(url); } catch (error) { return url; }
  };

  // 표에는 주소를 짧게 적는다. 줄마다 'https://minix.life' 를 되풀이하면 정작 봐야 할
  // 뒷부분이 밀려 잘린다. 우리 도메인일 때만 떼고, 다른 도메인은 그대로 보여 준다.
  // (전체 주소는 칸의 title 로 남겨 둔다)
  const MAIN_HOST = 'minix.life';
  const shortUrl = (url) => {
    const text = pretty(url);
    const found = text.match(/^https?:\/\/([^/]+)(.*)$/);
    if (!found) return text;
    const host = found[1].replace(/^www\./, '');
    const rest = found[2] || '/';
    return host === MAIN_HOST ? rest : `${host}${rest}`;
  };
  const heatmapLink = (url) => {
    const project = projectId();
    if (!project) return '';
    return `${CLARITY_HOME}/${encodeURIComponent(project)}/heatmaps?url=${encodeURIComponent(url)}`;
  };

  // 프로젝트 번호는 시트(스크립트 속성 CLARITY_PROJECT_ID)에서 온다.
  // 아직 못 받았을 때도 단추가 살아 있게 아는 값을 뒤에 둔다. (비밀값이 아니라 주소의 일부다)
  const projectId = () => (list && list.projectId) || CLARITY_PROJECT;

  // Clarity 대시보드. 이 API 로는 못 보는 것들(히트맵 클릭 점 · 세션 녹화 · 지나간 기간)을
  // 보려면 결국 Clarity 화면으로 가야 한다. 기간은 우리 화면에서 고른 것과 맞춰 보낸다.
  //   date=Last 3 days · Last 2 days · Last 1 days  ← Clarity 대시보드가 주소로 받는 값
  const dashLink = () => `${CLARITY_HOME}/${encodeURIComponent(projectId())}`
    + `/dashboard?date=${encodeURIComponent(`Last ${days} days`)}`;

  const loadList = (refresh) => {
    listState = 'loading';
    render();
    askPage({ action: 'clarityPages', days: days, refresh: Boolean(refresh) })
      .then((body) => { list = body; listState = 'ready'; listError = ''; render(); })
      .catch((reason) => { listState = 'error'; listError = reason.message; render(); });
  };

  const lookUp = (url) => {
    const wanted = String(url || '').trim();
    if (!wanted) return;
    query = wanted;
    findState = 'loading';
    found = null;
    preview = '';
    render();
    askPage({ action: 'clarityPage', url: wanted, days: days })
      .then((body) => { found = body; findState = 'ready'; findError = ''; render(); })
      .catch((reason) => { findState = 'error'; findError = reason.message; render(); });
  };

  // 스크롤 깊이를 페이지 모양으로 보여 준다. 숫자만 있으면 '30%' 가 어디까지인지 안 와닿는다.
  const depthBox = (value) => {
    if (value === null || value === undefined) {
      return '<div class="page-depth is-none"><span>스크롤 기록 없음</span></div>';
    }
    const depth = Math.max(0, Math.min(100, Number(value)));
    return `<div class="page-depth">
      <div class="page-depth-fill" style="height:${depth}%"></div>
      <div class="page-depth-line" style="top:${depth}%"><b>${depth.toFixed(1)}%</b></div>
    </div>`;
  };

  const pageCard = () => {
    if (findState === 'loading') return '<div class="tool-card page-loading">찾는 중…</div>';
    if (findState === 'error') return `<p class="perf-warn">${escapeHtml(findError)}</p>`;
    if (findState !== 'ready' || !found) return '';

    const hits = found.hits || [];
    // 넣은 말이 들어간 페이지 목록. 주소를 통째로 붙여넣어 딱 맞을 때는 카드로 보여 주니 표는 뺀다.
    const hitTable = found.matched === 'some'
      ? pageTable(`'${escapeHtml(query)}' 가 들어간 페이지 <small>${num(found.hitCount)}개${
        found.hitCount > hits.length ? ` · 세션 많은 ${num(hits.length)}개만` : ''}</small>`, hits)
      : '';

    if (!found.page) {
      if (hits.length) return hitTable;
      return `<div class="tool-card page-miss">
        <b>'${escapeHtml(query)}' 가 들어간 페이지가 없습니다.</b>
        <p>Clarity 가 최근 ${found.days}일 동안 본 페이지 <b>${num(found.total || 0)}개</b> 안에서 찾았습니다.
          그 안에 없는 까닭은 셋 중 하나입니다 — 그 기간에 방문이 없었거나, 방문이 너무 적어
          Clarity 목록에 안 들어갔거나, 그 페이지에 Clarity 스크립트가 안 심겨 있습니다.</p>
        <p>주소 전체 대신 <b>한 토막만</b> 넣어 보세요 (예: <code>28606</code> · <code>flender-max</code>).
          한글은 그대로 넣으셔도 됩니다.</p>
      </div>`;
    }

    const row = found.page;
    const link = heatmapLink(row.url);
    return `<div class="tool-card page-found">
      <div class="page-found-head">
        <b>${escapeHtml(pretty(row.url))}</b>
        <small>최근 ${found.days}일 · 세션 ${num(row.sessions)}${found.matched === 'path'
    ? ' · 파라미터가 붙은 주소까지 합쳤습니다' : ''}</small>
      </div>
      <div class="page-found-body">
        ${depthBox(row.scroll)}
        <div class="page-found-side">
          <div class="page-stat"><small>평균 스크롤 깊이</small>
            <strong>${row.scroll === null ? '—' : `${Number(row.scroll).toFixed(1)}%`}</strong>
            <em>${row.scroll === null
    ? 'Clarity 가 이 페이지의 스크롤을 아직 못 모았습니다'
    : '사람들이 평균 이 지점까지 내려갔습니다'}</em></div>
          <div class="page-stat"><small>세션</small><strong>${num(row.sessions)}</strong>
            <em>최근 ${found.days}일</em></div>
          ${link ? `<a class="page-heat" href="${escapeHtml(link)}" target="_blank" rel="noopener">
            <i data-lucide="flame"></i>이 페이지 히트맵 열기</a>`
    : '<p class="page-note">히트맵 링크를 만들려면 스크립트 속성 <code>CLARITY_PROJECT_ID</code> 가 필요합니다.</p>'}
          <button type="button" class="page-copy" data-page="copy" data-url="${escapeHtml(row.url)}">
            <i data-lucide="copy"></i>주소 복사</button>
        </div>
      </div>
      ${preview === row.url ? `<div class="page-frame">
        <div class="page-frame-head"><b>실제 페이지</b>
          <small>스크롤 · 클릭이 되는 진짜 페이지입니다. 열어 둔 동안 Clarity 에 방문 한 건이 기록됩니다.</small>
          <button type="button" class="page-copy" data-page="preview-off">닫기</button></div>
        <iframe src="${escapeHtml(row.url)}" title="페이지 미리보기" loading="lazy"
          referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
      </div>` : `<button type="button" class="page-copy page-preview-btn" data-page="preview"
        data-url="${escapeHtml(row.url)}"><i data-lucide="monitor"></i>페이지 미리보기</button>`}
      <p class="page-note">히트맵의 <b>클릭 점</b>은 Clarity 안에서만 볼 수 있습니다 — API 는 숫자만 주고
        클릭 좌표는 주지 않습니다. 페이지 그림은 위 미리보기로 볼 수 있지만, 그 위에 깊이 선을 그리지는
        않았습니다. 다른 도메인의 화면이라 전체 길이를 읽을 수 없어, 선을 그으면 엉뚱한 자리에 찍힙니다.</p>
    </div>${hitTable}`;
  };

  const pageTable = (title, rows, actions) => `<div class="tool-card">
      <div class="tool-list-head"><h3>${title}</h3>${actions || ''}</div>
      <div class="tool-table-wrap"><table class="tool-table page-table">
        <thead><tr><th>페이지</th><th>세션</th><th>스크롤 깊이</th><th></th></tr></thead>
        <tbody>${rows.map((row) => `<tr>
          <td><button type="button" class="page-link" data-page="pick"
            data-url="${escapeHtml(row.url)}"
            title="${escapeHtml(pretty(row.url))}">${escapeHtml(shortUrl(row.url))}</button></td>
          <td class="perf-num">${num(row.sessions)}</td>
          <td class="perf-num">${row.scroll === null
    ? '<span class="tool-blank">—</span>' : `${Number(row.scroll).toFixed(1)}%`}</td>
          <td class="perf-more">${heatmapLink(row.url)
    ? `<a class="page-heat-mini" href="${escapeHtml(heatmapLink(row.url))}" target="_blank"
        rel="noopener" title="히트맵 열기"><i data-lucide="flame"></i></a>` : ''}</td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;

  const setup = () => `<div class="tool-card page-todo">
      <span class="page-badge">연결 전</span>
      <h3>Clarity 를 붙여 주세요</h3>
      <p class="page-note">${escapeHtml(listError)}</p>
      <ul>
        <li><a href="${SHEET_URL}" target="_blank" rel="noopener">적재 시트</a> → 확장 프로그램 → Apps Script</li>
        <li>프로젝트 설정(톱니) → 스크립트 속성 → <code>CLARITY_API_TOKEN</code> · <code>CLARITY_PROJECT_ID</code></li>
        <li>토큰은 Clarity → Settings → <b>Data export</b> → Generate new API token</li>
        <li>넣은 뒤 <b>배포 → 배포 관리 → 새 버전</b> 으로 다시 배포</li>
      </ul>
    </div>`;

  // 세션이 많은 페이지 목록. 눌러서 그 페이지의 스크롤 깊이로 넘어갈 수 있다.
  // 찾기 결과 아래에 둔다 — 찾으러 온 사람의 답을 이 표가 밀어내면 안 된다.
  const topPages = () => {
    const rows = (list && list.pages) || [];
    if (!rows.length) return '';
    const title = `상위 페이지 <small>세션 많은 ${num(rows.length)}개${list.total > rows.length
      ? ` · 전체 ${num(list.total)}개 중` : ''} · 지난 ${list.days}일</small>`;
    const fold = `<div class="tool-list-actions"><button type="button" class="tool-copy-all" data-page="fold">
      <i data-lucide="${showTop ? 'chevron-up' : 'chevron-down'}"></i>${showTop ? '접기' : '펼치기'}</button></div>`;
    if (!showTop) {
      return `<div class="tool-card"><div class="tool-list-head"><h3>${title}</h3>${fold}</div></div>`;
    }
    return pageTable(title, rows, fold);
  };

  const render = () => {
    const calls = list && list.calls ? list.calls : null;
    pagePerformance.innerHTML = `<div class="tool-head">
        <h2>페이지 결과 <small>Microsoft Clarity</small></h2>
        <p>페이지 링크를 넣으면 사람들이 어디까지 내려갔는지(스크롤 깊이) 보여 주고,
          히트맵은 Clarity 화면으로 바로 넘겨 줍니다.</p>
      </div>

      <div class="tool-card">
        <div class="perf-filter">
          <div class="perf-search page-search">
            <i data-lucide="link"></i>
            <input type="search" data-page="url" value="${escapeHtml(query)}"
              placeholder="페이지 주소 또는 주소에 들어간 단어" autocomplete="off">
          </div>
          <button type="button" class="tool-add" data-page="go"${findState === 'loading' ? ' disabled' : ''}>
            <i data-lucide="search"></i>${findState === 'loading' ? '찾는 중…' : '보기'}</button>
          <button type="button" class="tool-copy-all" data-page="refresh"${listState === 'loading' ? ' disabled' : ''}>
            <i data-lucide="refresh-cw"></i>다시 받기</button>
          <a class="tool-copy-all page-dash" href="${escapeHtml(dashLink())}" target="_blank" rel="noopener">
            <i data-lucide="external-link"></i>Clarity 에서 자세히 보기</a>
        </div>
        <div class="perf-filter page-days">
          <span class="perf-chips">${PAGE_DAYS.map(([value, name]) => `<button type="button"
            class="perf-chip${days === value ? ' is-on' : ''}" data-page="days"
            data-days="${value}"${listState === 'loading' ? ' disabled' : ''}>${escapeHtml(name)}</button>`).join('')}</span>
          <small>Clarity 가 <b>3일까지만</b> 줍니다. 시작일 · 종료일을 고르는 칸은 이 API 에 아예 없어
            '지난 N일' 로만 물을 수 있습니다 (지난주처럼 지나간 기간은 Clarity 화면에서 보셔야 합니다).</small>
        </div>
        <p class="perf-note">
          ${listState === 'loading' ? '<b>Clarity 에서 페이지 목록을 받는 중…</b>' : ''}
          ${list ? `<b>최근 ${list.days}일</b> · 페이지 ${num(list.total)}개${list.fetchedAt
    ? ` · 갱신 ${new Date(list.fetchedAt).toLocaleString('ko-KR')}` : ''}${list.cached ? ' (담아 둔 값)' : ''}` : ''}
          ${calls ? `<em class="perf-net">오늘 조회 ${calls.used}/${calls.limit}회</em>` : ''}
        </p>
        <p class="page-note">주소를 통째로 넣으면 그 페이지 하나를, <b>단어만</b> 넣으면 그 말이 들어간 페이지를 모두 찾습니다
          (utm 이 붙은 광고 링크도 그대로 넣으면 됩니다).<br>
          Clarity 는 하루 <b>10번</b>까지만, 한 번에 <b>3일치</b>까지만 줍니다.
          기간마다 따로 6시간 담아 두므로, <b>같은 기간에서는 몇 번을 찾아도 조회 횟수가 늘지 않습니다.</b>
          기간을 바꾸면 그 기간을 처음 볼 때 한 번 늘어납니다.</p>
      </div>

      ${listState === 'error' ? setup() : ''}
      ${pageCard()}
      ${topPages()}`;
    lucide.createIcons();
    if (caretAt !== null) {
      const box = pagePerformance.querySelector('[data-page="url"]');
      if (box) { box.focus(); box.setSelectionRange(caretAt, caretAt); }
      caretAt = null;
    }
  };

  pagePerformance.addEventListener('input', (event) => {
    if (event.target.matches('[data-page="url"]')) {
      query = event.target.value;
      caretAt = event.target.selectionStart;
    }
  });

  pagePerformance.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.matches('[data-page="url"]')) lookUp(query);
  });

  pagePerformance.addEventListener('click', (event) => {
    if (event.target.closest('[data-page="go"]')) { lookUp(query); return; }
    if (event.target.closest('[data-page="refresh"]')) { loadList(true); return; }
    if (event.target.closest('[data-page="fold"]')) {
      showTop = !showTop;
      try { window.localStorage.setItem('minix-clarity-top', showTop ? 'on' : 'off'); } catch (ignore) { /* 거들기다 */ }
      render();
      return;
    }
    const pickDays = event.target.closest('[data-page="days"]');
    if (pickDays) {
      const wanted = Number(pickDays.dataset.days);
      if (wanted === days) return;
      days = wanted;
      try { window.localStorage.setItem('minix-clarity-days', String(days)); } catch (ignore) { /* 거들기다 */ }
      loadList(false);
      if (query && findState === 'ready') lookUp(query);   // 찾아 둔 결과도 새 기간으로
      return;
    }
    const pick = event.target.closest('[data-page="pick"]');
    if (pick) { preview = ''; lookUp(pick.dataset.url); return; }
    const show = event.target.closest('[data-page="preview"]');
    if (show) { preview = show.dataset.url; render(); return; }
    if (event.target.closest('[data-page="preview-off"]')) { preview = ''; render(); return; }
    const copy = event.target.closest('[data-page="copy"]');
    if (copy) {
      navigator.clipboard.writeText(copy.dataset.url).then(() => {
        copy.classList.add('is-copied');
        window.setTimeout(() => copy.classList.remove('is-copied'), 1200);
      });
    }
  });

  loadList(false);
}

// ── 월별 예산 (퍼포먼스 마스터 시트) ─────────────────────────────────
// 예산은 사람이 시트에 손으로 짠다. 이 화면은 그 시트를 **그림으로 다시 그린다** —
// 숫자를 여기서 고치지 않는다. 고칠 일은 시트에서 하고, 여기서는 다시 받기만 누른다.
// 값은 열 이름으로 찾는다. 달마다 줄이 늘고 줄어도 그대로 그려지게 하려는 것이다.
const budgetPlanView = document.querySelector('#budget-plan');
if (budgetPlanView) {
  const escape = perfEscape;
  const won = perfMoney('KRW');
  const num = perfCount;

  let plan = null;
  let status = 'idle';
  let error = '';
  let folded = [];   // 접어 둔 프로모션 묶음 (처음에는 다 펴져 있다)

  // 억 · 만으로 줄여 적는다. '345,000,000' 만 두면 볼 때마다 자리 수를 세게 되고,
  // 반대로 억으로만 쓰면 45만원이 '0.00억' 이 되어 없는 돈처럼 보인다.
  const eok = (value) => {
    const number = Number(value) || 0;
    if (!number) return '0';
    const size = Math.abs(number);
    if (size >= 100000000) {
      const unit = number / 100000000;
      return `${unit.toFixed(Math.abs(unit) >= 100 ? 0 : Math.abs(unit) >= 10 ? 1 : 2)}억`;
    }
    if (size >= 10000) return `${num(number / 10000)}만`;
    return num(number);
  };

  // 돈이 아닌 칸. 여기에 억 · 만을 붙이면 'CPS 7만' 처럼 되어 견줄 수 없다.
  const PLAIN_COLUMNS = ['목표수량', 'CPS', '가중치', '비고', '실 판매수량', 'ROAS', 'CVR', 'CPC', 'CPA'];
  const isPlain = (name) => PLAIN_COLUMNS.some((one) => String(name || '').indexOf(one) >= 0);

  // 값이 없는 칸('-' · 빈 칸)과 0 을 가른다. 0 은 '안 쓴다'고 적어 둔 것이라 그대로 보여 준다.
  const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);
  const columnAt = (table, ...names) => {
    for (const name of names) {
      const at = table.columns.findIndex((one) => one === name);
      if (at >= 0) return at;
    }
    for (const name of names) {
      const at = table.columns.findIndex((one) => one.indexOf(name) >= 0);
      if (at >= 0) return at;
    }
    return -1;
  };
  const cellOf = (table, row, ...names) => {
    const at = columnAt(table, ...names);
    return at < 0 ? undefined : row[at];
  };
  const numberOf = (table, row, ...names) => {
    const found = cellOf(table, row, ...names);
    return isNumber(found) ? found : null;
  };
  const textOf = (table, row, ...names) => {
    const found = cellOf(table, row, ...names);
    return found === undefined || found === null ? '' : String(found);
  };

  // 막대 한 줄. 마이너스(예산을 넘긴 예비비)는 빨강으로 그린다 —
  // 크기로만 그리면 '-6,450만' 이 '+6,450만' 과 똑같이 보인다.
  const barRow = (label, value, peak, note) => {
    const number = Number(value) || 0;
    const size = peak > 0 ? Math.min(100, (Math.abs(number) / peak) * 100) : 0;
    return `<div class="budget-bar${number < 0 ? ' is-minus' : ''}">
      <span class="budget-bar-name">${escape(label)}</span>
      <span class="budget-bar-track"><i style="width:${size.toFixed(1)}%"></i></span>
      <b class="budget-bar-value" title="${escape(isNumber(value) ? won(value) : '')}">${isNumber(value) ? eok(number) : '—'}</b>
      <small>${escape(note || '')}</small>
    </div>`;
  };

  // 한 줄을 항목별 막대로 그린다 (고정비 · 세일즈 · 마케팅팀 · 기타 · 퍼포 프로젝트 · 예비비)
  const PART_NAMES = ['고정비', '세일즈', '행사', '마케팅팀', '기타', '퍼포 프로젝트', '퍼포프로젝트', '예비비'];
  const partBars = (table, row) => {
    const parts = [];
    table.columns.forEach((name, at) => {
      if (PART_NAMES.indexOf(name) < 0) return;
      if (!isNumber(row[at])) return;
      parts.push({ name, value: row[at] });
    });
    if (!parts.length) return '';
    const peak = Math.max(...parts.map((part) => Math.abs(part.value)), 0);
    const total = parts.reduce((sum, part) => sum + (part.value > 0 ? part.value : 0), 0);
    return `<div class="budget-bars">${parts.map((part) => barRow(part.name, part.value, peak,
      part.value > 0 && total ? `${Math.round((part.value / total) * 100)}%`
        : (part.value < 0 ? '예산 초과' : ''))).join('')}</div>`;
  };

  // ── 종합 ────────────────────────────────────────────────────────
  const hero = () => {
    const table = plan.category;
    if (!table || !table.total) return '';
    const row = table.total;
    const budget = numberOf(table, row, '총 퍼포먼스 예산', '예산');
    const goal = numberOf(table, row, '총 목표수량', '목표수량');
    const cps = numberOf(table, row, 'CPS');
    return `<div class="tool-card budget-hero">
      <div class="budget-hero-main">
        <div class="budget-hero-big">
          <small>총 퍼포먼스 예산</small>
          <strong>${eok(budget)}</strong>
          <em>${budget === null ? '—' : won(budget)}</em>
        </div>
        <div class="budget-hero-side">
          <span><small>총 목표수량</small><b>${goal === null ? '—' : `${num(goal)}대`}</b></span>
          <span><small>CPS</small><b>${cps === null ? '—' : won(cps)}</b></span>
        </div>
      </div>
      ${partBars(table, row)}
    </div>`;
  };

  // ── 카테고리 (더 플렌더 · 생활가전) ───────────────────────────────
  const categories = () => {
    const table = plan.category;
    if (!table || !table.rows.length) return '';
    return `<div class="budget-grid">${table.rows.map((row) => {
      const budget = numberOf(table, row, '총 퍼포먼스 예산', '예산');
      const goal = numberOf(table, row, '총 목표수량', '목표수량');
      const cps = numberOf(table, row, 'CPS');
      return `<div class="tool-card budget-card">
        <div class="budget-card-head">
          <h3>${escape(String(row[0] || ''))}</h3>
          <span><b>${eok(budget)}</b><small>${budget === null ? '' : won(budget)}</small></span>
        </div>
        <div class="budget-chips">
          <span><small>목표수량</small><b>${goal === null ? '—' : `${num(goal)}대`}</b></span>
          <span><small>CPS</small><b>${cps === null ? '—' : won(cps)}</b></span>
        </div>
        ${partBars(table, row)}
      </div>`;
    }).join('')}</div>`;
  };

  // ── 표 (SKU별 · 고정비) ─────────────────────────────────────────
  // 첫 숫자 칸에는 막대를 겹쳐 둔다. 어디에 몰려 있는지 숫자만으로는 안 보인다.
  const matrix = (table, title, note) => {
    if (!table || !table.rows.length) return '';
    // 통째로 빈 열은 뺀다 (그 달에 안 쓴 칸). 점만 찍힌 열이 표를 넓히기만 한다.
    const filled = (value) => value !== '' && value !== undefined && value !== null;
    // 종합 줄만 0 인 열(그 달에 안 쓴 CPS · 비고)도 뺀다. 0 만 적힌 열은 읽을 것이 없다.
    const keep = table.columns.map((name, at) => at === 0
      || table.rows.some((row) => filled(row[at]))
      || Boolean(table.total && filled(table.total[at]) && table.total[at] !== 0));
    const columns = table.columns.filter((name, at) => keep[at]);
    const groups = table.groups ? table.groups.filter((name, at) => keep[at]) : null;
    const pick = (row) => row.filter((value, at) => keep[at]);

    const barAt = columns.findIndex((name, at) => at > 0 && !isPlain(name)
      && table.rows.some((row) => isNumber(pick(row)[at]) && pick(row)[at] > 0));
    const peak = barAt < 0 ? 0
      : Math.max(...table.rows.map((row) => (isNumber(pick(row)[barAt]) ? pick(row)[barAt] : 0)), 0);

    const cell = (value, at) => {
      if (!isNumber(value)) {
        return `<td class="perf-num"><span class="tool-blank">${value === '' ? '·' : escape(String(value))}</span></td>`;
      }
      const size = at === barAt && peak > 0 ? Math.min(100, (Math.abs(value) / peak) * 100) : 0;
      const text = isPlain(columns[at]) ? num(value) : eok(value);
      return `<td class="perf-num${value < 0 ? ' is-minus' : ''}">${size
        ? `<span class="budget-cell-bar" style="width:${size.toFixed(1)}%"></span>` : ''
      }<span title="${escape(won(value))}">${escape(text)}</span></td>`;
    };
    const line = (row, klass) => `<tr class="${klass || ''}">
      <td class="perf-name"><span>${escape(String(row[0] || '')) || '·'}</span></td>
      ${pick(row).slice(1).map((value, at) => cell(value, at + 1)).join('')}</tr>`;

    // 묶음 머리글(세일즈팀 · 마케팅팀 FU)은 이어지는 칸만큼 넓혀 얹는다
    const groupRow = () => {
      if (!groups) return '';
      const cells = [];
      let at = 0;
      while (at < groups.length) {
        const name = groups[at];
        let span = 1;
        while (at + span < groups.length && groups[at + span] === name) span += 1;
        cells.push(`<th colspan="${span}">${escape(name || '')}</th>`);
        at += span;
      }
      return `<tr class="budget-group-row">${cells.join('')}</tr>`;
    };

    return `<div class="tool-card">
      <div class="tool-list-head"><h3>${escape(title)}${note ? ` <small>${escape(note)}</small>` : ''}</h3></div>
      <div class="tool-table-wrap"><table class="tool-table budget-table">
        <thead>${groupRow()}
          <tr>${columns.map((name, at) => `<th${at ? ' class="perf-num"' : ''}>${escape(name)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${table.rows.map((row) => line(row)).join('')}
          ${table.total ? line(table.total, 'budget-total') : ''}
        </tbody>
      </table></div>
    </div>`;
  };

  // 고정비는 '어느 항목에 얼마' 가 먼저 궁금하다. 종합 줄을 큰 것부터 막대로 그린다.
  const fixedBars = () => {
    const table = plan.fixed;
    if (!table || !table.total) return '';
    const parts = [];
    table.columns.forEach((name, at) => {
      if (!at || !isNumber(table.total[at]) || table.total[at] <= 0) return;
      parts.push({ name, value: table.total[at] });
    });
    if (!parts.length) return '';
    parts.sort((a, b) => b.value - a.value);
    const total = parts.reduce((sum, part) => sum + part.value, 0);
    return `<div class="budget-bars budget-bars-wide">${parts.map((part) => barRow(part.name, part.value,
      parts[0].value, `${Math.round((part.value / total) * 100)}%`)).join('')}</div>`;
  };

  // ── 프로모션 ────────────────────────────────────────────────────
  // 시트에서 병합해 둔 칸은 빈 값으로 온다. 같은 프로모션의 둘째 SKU 줄이라
  // 위 줄의 이름을 물려받아 한 장의 카드로 묶는다 (카카오톡딜 위크 = max + mini).
  const promoCards = (table) => {
    const groups = [];
    let last = null;
    table.rows.forEach((row) => {
      const own = textOf(table, row, '프로모션명');
      const name = own || (last ? last.name : '');
      const keep = (label, fallback) => textOf(table, row, label) || (own ? '' : fallback);
      const kind = keep('구분', last ? last.kind : '');
      const when = keep('라이브/행사일정', last ? last.when : '');
      const span = keep('광고 기간', last ? last.span : '');
      if (!last || last.name !== name || last.when !== when) {
        last = { name, kind, when, span, lines: [] };
        groups.push(last);
      }
      last.lines.push({
        sku: textOf(table, row, 'SKU'),
        goal: numberOf(table, row, '실 목표수량', '목표수량'),
        cps: numberOf(table, row, 'CPS(브검포함기준)', 'CPS'),
        weight: numberOf(table, row, '가중치'),
        budget: numberOf(table, row, '예산 (브검포함)') ?? numberOf(table, row, '예산 (미포함)', '예산'),
        spent: numberOf(table, row, '실 사용비(브검포함)') ?? numberOf(table, row, '실 사용비(브검미포함)'),
      });
    });

    return `<div class="budget-promos">${groups.map((group) => {
      const sum = (key) => group.lines.reduce((total, line) => total + (line[key] || 0), 0);
      const budget = sum('budget');
      const goal = sum('goal');
      const weight = sum('weight');
      const spent = sum('spent');
      return `<article class="budget-promo">
        <div class="budget-promo-head">
          <span class="budget-tag${group.kind.indexOf('오프') === 0 ? ' is-off' : ''}">${escape(group.kind || '구분 없음')}</span>
          <small>${escape(group.when || group.span || '')}</small>
        </div>
        <h4>${escape(group.name || '(이름 없음)')}</h4>
        <div class="budget-promo-sum">
          <span><small>예산</small><b>${budget ? eok(budget) : '—'}</b></span>
          <span><small>목표</small><b>${goal ? `${num(goal)}대` : '—'}</b></span>
          <span><small>비중</small><b>${weight ? `${Math.round(weight * 100)}%` : '—'}</b></span>
        </div>
        <span class="budget-weight"><i style="width:${Math.min(100, (weight || 0) * 100).toFixed(1)}%"></i></span>
        <ul class="budget-promo-lines">${group.lines.map((line) => `<li>
          <b>${escape(line.sku || '·')}</b>
          <span>${line.goal === null ? '—' : `${num(line.goal)}대`}</span>
          <span>${line.cps === null ? '—' : won(line.cps)}</span>
          <span>${line.budget === null ? '—' : eok(line.budget)}</span>
        </li>`).join('')}</ul>
        ${spent ? `<p class="budget-promo-real">실 사용 ${eok(spent)}</p>` : ''}
        ${group.span && group.span !== group.when ? `<p class="budget-promo-span">광고 기간 ${escape(group.span)}</p>` : ''}
      </article>`;
    }).join('')}</div>`;
  };

  const promos = () => (plan.promos || []).map((table) => {
    const budget = table.total
      ? (numberOf(table, table.total, '예산 (브검포함)') || 0) + (numberOf(table, table.total, '예산 (미포함)') || 0)
      : 0;
    const goal = table.total ? numberOf(table, table.total, '실 목표수량', '목표수량') : null;
    const open = folded.indexOf(table.name) < 0;
    return `<div class="tool-card">
      <div class="tool-list-head budget-promo-title">
        <h3>${escape(table.name)}
          <small>예산 ${eok(budget)}${goal ? ` · 목표 ${num(goal)}대` : ''} · ${num(table.rows.length)}줄</small></h3>
        <button type="button" class="tool-copy-all" data-budget="fold" data-name="${escape(table.name)}">
          <i data-lucide="${open ? 'chevron-up' : 'chevron-down'}"></i>${open ? '접기' : '펼치기'}</button>
      </div>
      ${open ? promoCards(table) : ''}
    </div>`;
  }).join('');

  const render = () => {
    if (!plan) {
      budgetPlanView.innerHTML = `<div class="tool-head"><h2>월별 예산</h2></div>
        ${status === 'error' ? `<p class="perf-warn">${escape(error)}</p>
          <div class="tool-card page-todo"><h3>시트를 읽지 못했습니다</h3>
            <ul><li>Apps Script 를 <b>새 버전으로 다시 배포</b>했는지 확인해 주세요</li>
              <li>시트 접근 권한이 있어야 합니다 (링크가 있는 사람 보기 이상)</li></ul></div>`
    : '<div class="tool-card page-loading">시트를 읽는 중…</div>'}`;
      lucide.createIcons();
      return;
    }

    budgetPlanView.innerHTML = `<div class="tool-head">
        <h2>월별 예산 <small>${escape(plan.title || plan.bookName || '')}</small></h2>
        <p>세일즈 퍼포먼스 예산 시트를 그림으로 그립니다. 숫자를 고칠 일은 시트에서 하시고,
          여기서는 <b>다시 받기</b>를 누르면 됩니다.</p>
      </div>
      <div class="tool-card">
        <div class="perf-filter">
          <a class="tool-add" href="${escape(plan.url)}" target="_blank" rel="noopener">
            <i data-lucide="external-link"></i>시트 열기</a>
          <button type="button" class="tool-copy-all" data-budget="refresh"${status === 'loading' ? ' disabled' : ''}>
            <i data-lucide="refresh-cw"></i>${status === 'loading' ? '받는 중…' : '다시 받기'}</button>
        </div>
        <p class="perf-note">${escape(plan.bookName || '')}${plan.sheetName ? ` · ${escape(plan.sheetName)} 탭` : ''}${plan.fetchedAt
    ? ` · 갱신 ${new Date(plan.fetchedAt).toLocaleString('ko-KR')}` : ''}${plan.cached ? ' (담아 둔 값)' : ''}</p>
      </div>
      ${hero()}
      ${categories()}
      ${matrix(plan.sku, 'SKU별 퍼포먼스 비용', '막대는 총 예산 기준')}
      ${plan.fixed ? `<div class="tool-card">
        <div class="tool-list-head"><h3>고정비 <small>항목별 합계</small></h3></div>
        ${fixedBars()}
      </div>` : ''}
      ${matrix(plan.fixed, '고정비 상세', 'SKU × 항목')}
      ${promos()}`;
    lucide.createIcons();
  };

  const load = (refresh) => {
    status = 'loading';
    error = '';
    render();
    window.fetch(SHEET_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ action: 'budgetPlan', refresh: Boolean(refresh) }),
    }).then((response) => response.json()).then((body) => {
      if (!body.ok) throw new Error(body.error || '시트를 읽지 못했습니다.');
      plan = body;
      status = 'ready';
      render();
    }).catch((reason) => {
      status = 'error';
      error = reason.message;
      render();
    });
  };

  budgetPlanView.addEventListener('click', (event) => {
    if (event.target.closest('[data-budget="refresh"]')) { load(true); return; }
    const fold = event.target.closest('[data-budget="fold"]');
    if (fold) {
      const name = fold.dataset.name;
      folded = folded.indexOf(name) >= 0 ? folded.filter((one) => one !== name) : folded.concat(name);
      render();
    }
  });

  // 메뉴에 들어올 때 한 번만 부른다
  let budgetLoaded = false;
  const openBudgetOnce = () => {
    if (budgetLoaded || budgetPlanView.hidden) return;
    budgetLoaded = true;
    load(false);
  };
  new MutationObserver(openBudgetOnce).observe(budgetPlanView, { attributes: true, attributeFilter: ['hidden'] });
  openBudgetOnce();
}

// ── 프로모션 (세일즈팀 미닉스 워크스페이스 · 행사 캘린더 시트 미러) ────────────
// 프로모션 등록 · 수정은 세일즈팀 도구(미닉스)에서 한다. 그쪽이 저장할 때마다 이 시트에
// 월별 탭으로 그대로 복사해 두므로, 여기서는 그 시트를 우리 디자인으로 다시 그리기만 한다.
const promotionView = document.querySelector('#promotion');
if (promotionView) {
  const escape = perfEscape;

  let plan = null;
  let status = 'idle';
  let error = '';
  let month = '';
  let filterStatus = '전체';
  let query = '';

  const STATUS_TONE = { '진행중': 'green', '예정': 'blue', '종료': 'gray' };

  const summary = () => {
    const statusAt = plan.columns.indexOf('진행상태');
    const counts = { '진행중': 0, '예정': 0, '종료': 0 };
    plan.rows.forEach((row) => { if (counts[row[statusAt]] !== undefined) counts[row[statusAt]] += 1; });
    return `<span class="promo-count">총 <b>${plan.rows.length}</b>건 · 진행중 <b>${counts['진행중']}</b>
      · 예정 <b>${counts['예정']}</b> · 종료 <b>${counts['종료']}</b></span>`;
  };

  const toolbar = () => `<div class="promo-toolbar">
    <select data-promo="month">${plan.months.map((one) =>
      `<option value="${escape(one)}"${one === month ? ' selected' : ''}>${escape(one)}</option>`).join('')}</select>
    <div class="segmented">${['전체', '진행중', '예정', '종료'].map((one) =>
      `<button type="button" class="${one === filterStatus ? 'selected' : ''}" data-promo="status" data-value="${escape(one)}">${escape(one)}</button>`).join('')}</div>
    <input type="text" data-promo="search" placeholder="채널 · 행사명으로 찾기" value="${escape(query)}">
    ${summary()}
  </div>`;

  // ID 열은 시트 안에서만 쓰는 내부 값이라 화면에는 뺀다. 나머지는 시트에 있는 그대로 보여준다.
  const table = () => {
    const visible = plan.columns.map((name, at) => (name === 'ID' ? -1 : at)).filter((at) => at >= 0);
    const statusAt = plan.columns.indexOf('진행상태');
    const needle = query.trim().toLowerCase();
    const rows = plan.rows.filter((row) => {
      if (filterStatus !== '전체' && row[statusAt] !== filterStatus) return false;
      if (!needle) return true;
      return row.join(' ').toLowerCase().indexOf(needle) >= 0;
    });

    if (!rows.length) {
      return '<div class="tool-card page-todo"><h3>표시할 프로모션이 없습니다</h3><p class="perf-note">달이나 필터를 바꿔 보세요.</p></div>';
    }

    return `<div class="table-wrap"><table>
      <thead><tr>${visible.map((at) => `<th>${escape(plan.columns[at])}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${visible.map((at) => {
        const value = row[at] || '';
        if (at === statusAt) {
          return `<td><span class="tag ${STATUS_TONE[value] || 'gray'}">${escape(value || '-')}</span></td>`;
        }
        return `<td>${escape(value || '-')}</td>`;
      }).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
  };

  const render = () => {
    if (!plan) {
      promotionView.innerHTML = `<div class="tool-head"><h2>프로모션</h2></div>
        ${status === 'error' ? `<p class="perf-warn">${escape(error)}</p>
          <div class="tool-card page-todo"><h3>시트를 읽지 못했습니다</h3>
            <ul><li>Apps Script 를 <b>새 버전으로 다시 배포</b>했는지 확인해 주세요</li>
              <li>시트 접근 권한이 있어야 합니다 (뷰어 이상)</li></ul></div>`
      : '<div class="tool-card page-loading">시트를 읽는 중…</div>'}`;
      lucide.createIcons();
      return;
    }

    promotionView.innerHTML = `<div class="tool-head">
        <h2>프로모션</h2>
        <p>세일즈팀 미닉스 워크스페이스의 행사 캘린더 시트를 그대로 읽어 옵니다. 등록 · 수정은 그쪽 도구에서 하고,
          여기서는 <b>다시 받기</b>를 누르면 됩니다.</p>
      </div>
      <div class="tool-card">
        <div class="perf-filter">
          <a class="tool-add" href="${escape(plan.url)}" target="_blank" rel="noopener">
            <i data-lucide="external-link"></i>시트 열기</a>
          <button type="button" class="tool-copy-all" data-promo="refresh"${status === 'loading' ? ' disabled' : ''}>
            <i data-lucide="refresh-cw"></i>${status === 'loading' ? '받는 중…' : '다시 받기'}</button>
        </div>
        <p class="perf-note">${escape(plan.bookName || '')}${plan.fetchedAt
      ? ` · 갱신 ${new Date(plan.fetchedAt).toLocaleString('ko-KR')}` : ''}${plan.cached ? ' (담아 둔 값)' : ''}</p>
      </div>
      <div class="tool-card">${toolbar()}${table()}</div>`;
    lucide.createIcons();
  };

  const load = (refresh) => {
    status = 'loading';
    error = '';
    render();
    window.fetch(SHEET_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ action: 'promoCalendar', month: month || undefined, refresh: Boolean(refresh) }),
    }).then((response) => response.json()).then((body) => {
      if (!body.ok) throw new Error(body.error || '시트를 읽지 못했습니다.');
      plan = body;
      month = body.month;
      status = 'ready';
      render();
    }).catch((reason) => {
      status = 'error';
      error = reason.message;
      render();
    });
  };

  promotionView.addEventListener('click', (event) => {
    if (event.target.closest('[data-promo="refresh"]')) { load(true); return; }
    const statusButton = event.target.closest('[data-promo="status"]');
    if (statusButton) { filterStatus = statusButton.dataset.value; render(); }
  });

  promotionView.addEventListener('change', (event) => {
    if (event.target.closest('[data-promo="month"]')) { month = event.target.value; load(false); }
  });

  promotionView.addEventListener('input', (event) => {
    if (event.target.closest('[data-promo="search"]')) { query = event.target.value; render(); }
  });

  let promoLoaded = false;
  const openPromoOnce = () => {
    if (promoLoaded || promotionView.hidden) return;
    promoLoaded = true;
    load(false);
  };
  new MutationObserver(openPromoOnce).observe(promotionView, { attributes: true, attributeFilter: ['hidden'] });
  openPromoOnce();
}

// ── KOL 라이브 (라이브 & 행사 결과 시트) ────────────────────────────────
// 라이브 하나가 시트 탭 하나다. 탭마다 표 모양이 조금씩 달라서, 값은 **열 이름으로** 찾고
// 숫자 말투(돈 · % · 개수)도 열 이름으로 가른다. 새 라이브 탭이 늘어도 그대로 그려진다.
const kolLiveView = document.querySelector('#kol-live');
if (kolLiveView) {
  const escape = perfEscape;
  const won = perfMoney('KRW');
  const num = perfCount;

  let book = null;
  let status = 'idle';
  let error = '';
  let opened = '';   // 펼쳐 둔 라이브 (탭 이름)

  // 시트는 ROAS 를 3730% 가 아니라 37.3 으로 담고 있다 (칸 서식이 %다).
  // CVR · CTR · 비중도 같다. 그래서 % 로 보여 줄 열은 이름으로 가른다.
  const RATE_WORDS = ['ROAS', 'ROI', 'CVR', 'CTR', '비중', '률', '구매율'];
  const MONEY_WORDS = ['광고비', '매출', '전환값', '예산', 'CPS', 'CPA', 'CPM', 'CPC', 'AOV',
    '결제가', '객단가', '유치비'];
  const hasWord = (name, words) => words.some((one) => String(name || '').indexOf(one) >= 0);

  const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);
  const cellText = (name, value) => {
    if (!isNumber(value)) return String(value ?? '') || '·';
    if (hasWord(name, RATE_WORDS)) return perfRoas(value);
    if (hasWord(name, MONEY_WORDS)) return won(value);
    return num(value);
  };

  // 열 이름으로 값을 집는다. 탭마다 이름이 조금씩 달라 여러 후보를 받는다.
  const pick = (table, row, ...names) => {
    if (!table || !row) return null;
    for (const name of names) {
      const at = table.columns.findIndex((one) => one === name);
      if (at >= 0) return row[at];
    }
    for (const name of names) {
      const at = table.columns.findIndex((one) => one.indexOf(name) >= 0);
      if (at >= 0) return row[at];
    }
    return null;
  };
  const numberOf = (table, row, ...names) => {
    const found = pick(table, row, ...names);
    return isNumber(found) ? found : null;
  };

  // 라이브 한 줄로 줄인 값. 목록 표와 합계가 이걸 쓴다.
  const oneLine = (live) => {
    const table = live.summary;
    const row = table && table.rows.length ? table.rows[0] : null;
    return {
      name: live.name,
      caption: live.caption || '',
      spend: numberOf(table, row, '광고비'),
      revenue: numberOf(table, row, '매출', '전환값'),
      orders: numberOf(table, row, '주문수', '구매수'),
      roas: numberOf(table, row, 'ROAS'),
      cps: numberOf(table, row, 'CPS'),
      aov: numberOf(table, row, 'AOV', '객단가', '결제가'),
      lead: numberOf(table, row, '사전알림신청', '리드고객'),
      goal: numberOf(table, row, '실 목표수량', '목표수량'),
      live: live,
    };
  };

  const blank = '<span class="tool-blank">—</span>';
  const money = (value) => (isNumber(value) ? won(value) : blank);
  const rate = (value) => (isNumber(value) ? perfRoas(value) : blank);
  const count = (value) => (isNumber(value) ? num(value) : blank);

  // ── 라이브별 결과 (이 화면의 본체) ────────────────────────────────
  const listTable = () => {
    const rows = book.lives.map(oneLine);
    const sum = rows.reduce((into, one) => ({
      spend: into.spend + (one.spend || 0),
      revenue: into.revenue + (one.revenue || 0),
      orders: into.orders + (one.orders || 0),
      lead: into.lead + (one.lead || 0),
    }), { spend: 0, revenue: 0, orders: 0, lead: 0 });
    const peak = Math.max(...rows.map((one) => one.roas || 0), 0);

    const line = (one) => {
      const open = opened === one.name;
      const size = peak > 0 && one.roas ? Math.min(100, (one.roas / peak) * 100) : 0;
      return `<tr class="perf-row${open ? ' is-open' : ''}" data-kol-row="${escape(one.name)}">
        <td class="perf-name">
          <button type="button" class="perf-toggle" data-kol="toggle" data-name="${escape(one.name)}">
            <i data-lucide="${open ? 'chevron-down' : 'chevron-right'}"></i></button>
          <span><b>${escape(one.name)}</b>${one.caption
        ? `<small>${escape(one.caption)}</small>` : ''}</span>
        </td>
        <td class="perf-num">${money(one.spend)}</td>
        <td class="perf-num">${money(one.revenue)}</td>
        <td class="perf-num">${count(one.orders)}</td>
        <td class="perf-num kol-roas">${size ? `<span class="budget-cell-bar" style="width:${size.toFixed(1)}%"></span>` : ''
      }<span>${rate(one.roas)}</span></td>
        <td class="perf-num">${money(one.cps)}</td>
        <td class="perf-num">${money(one.aov)}</td>
        <td class="perf-num">${count(one.lead)}</td>
      </tr>${open ? detailRow(one.live) : ''}`;
    };

    return `<div class="tool-card">
      <div class="tool-list-head">
        <h3>라이브별 결과 <small>라이브 ${num(rows.length)}건 · 줄을 누르면 단계별 · 매체별로 펼칩니다</small></h3>
        <div class="tool-list-actions">
          <button type="button" class="tool-copy-all" data-kol="excel">
            <i data-lucide="sheet"></i>엑셀 받기</button>
        </div>
      </div>
      <div class="tool-table-wrap"><table class="tool-table perf-table kol-table">
        <thead><tr><th>라이브</th><th>광고비</th><th>매출</th><th>주문수</th><th>ROAS</th>
          <th>CPS</th><th>AOV</th><th>사전알림</th></tr></thead>
        <tbody>${rows.map(line).join('')}
          <tr class="perf-row kol-sum"><td class="perf-name"><span><b>합계</b>
            <small>라이브 ${num(rows.length)}건</small></span></td>
            <td class="perf-num"><b>${money(sum.spend)}</b></td>
            <td class="perf-num"><b>${money(sum.revenue)}</b></td>
            <td class="perf-num">${count(sum.orders)}</td>
            <td class="perf-num">${rate(perfRatio(sum.revenue, sum.spend))}</td>
            <td class="perf-num">${money(perfRatio(sum.spend, sum.orders))}</td>
            <td class="perf-num">${money(perfRatio(sum.revenue, sum.orders))}</td>
            <td class="perf-num">${count(sum.lead)}</td></tr>
        </tbody>
      </table></div>
      <p class="perf-note">합계의 ROAS · CPS · AOV 는 더한 값에서 다시 계산합니다 —
        라이브마다의 비율을 평균 내면 큰 라이브와 작은 라이브가 같은 무게가 됩니다.</p>
    </div>`;
  };

  // ── 펼친 상세 ──────────────────────────────────────────────────
  // 시트의 표를 그대로 옮기되, 열 이름으로 말투만 맞춘다.
  const plainTable = (table, title, note) => {
    if (!table || !table.rows.length) return '';
    // 글자 칸(매체 이름 · 소재구분)은 값이 **있는** 것이다. 빈 칸과 같은 회색으로 두면
    // '브랜드검색' 이 '값 없음' 처럼 보인다. 없는 칸('' · '-')만 흐리게 둔다.
    const cell = (value, at) => {
      if (isNumber(value)) return `<td class="perf-num">${escape(cellText(table.columns[at], value))}</td>`;
      const text = String(value ?? '').trim();
      return text && text !== '-'
        ? `<td class="perf-num kol-text">${escape(text)}</td>`
        : '<td class="perf-num"><span class="tool-blank">·</span></td>';
    };
    // Phase 는 그 묶음의 첫 줄에만 적는다. 줄마다 '사전 (8/9~8/11)' 을 되풀이하면
    // 정작 봐야 할 매체 이름이 뒤로 밀린다. (시트에서도 병합해 둔 칸이다)
    let last = null;
    const line = (row, klass) => {
      const name = String(row[0] ?? '');
      const fresh = name !== last;
      last = name;
      return `<tr class="${klass || ''}${fresh && klass !== 'budget-total' ? ' kol-fresh' : ''}">
        <td class="perf-name"><span>${fresh ? escape(name) || '·' : ''}</span></td>
        ${row.slice(1).map((value, at) => cell(value, at + 1)).join('')}</tr>`;
    };
    // 시트가 표 위에 얹어 둔 묶음 이름(*광고대시 · *GA4). 전환 · CPA · CVR 이 두 번 나오는
    // 표에서는 이게 없으면 어느 쪽이 GA4 값인지 알 수 없다.
    const groupRow = () => {
      if (!table.groups) return '';
      // 표 제목이 그 자리에 적혀 있기도 하다 ('단계별 결과'). 위 h5 와 겹치므로 지운다.
      const groups = table.groups.map((name) => (String(name).trim() === title.trim() ? '' : name));
      if (!groups.some(Boolean)) return '';
      const cells = [];
      let at = 0;
      while (at < groups.length) {
        const name = groups[at];
        let span = 1;
        while (at + span < groups.length && groups[at + span] === name) span += 1;
        cells.push(`<th colspan="${span}">${escape(name || '')}</th>`);
        at += span;
      }
      return `<tr class="budget-group-row">${cells.join('')}</tr>`;
    };
    return `<div class="kol-block">
      <h5>${escape(title)}${note ? ` <small>${escape(note)}</small>` : ''}</h5>
      <div class="tool-table-wrap"><table class="tool-table kol-sub">
        <thead>${groupRow()}
          <tr>${table.columns.map((name, at) => `<th${at ? ' class="perf-num"' : ''}>${escape(name)}</th>`).join('')}</tr></thead>
        <tbody>${table.rows.map((row) => line(row, /종합|total|합계/i.test(String(row[1] ?? '')) ? 'kol-part' : ''))
    .join('')}${table.total ? line(table.total, 'budget-total') : ''}</tbody>
      </table></div>
    </div>`;
  };

  // 사전 행동지표는 네 칸뿐이라 표보다 카드가 읽기 쉽다.
  const preCards = (table) => {
    if (!table || !table.rows.length) return '';
    const row = table.rows[0];
    return `<div class="kol-block"><h5>사전 신청유저 구매율</h5>
      <div class="budget-chips kol-chips">${table.columns.map((name, at) => `<span>
        <small>${escape(name)}</small><b>${escape(cellText(name, row[at]))}</b></span>`).join('')}</div>
    </div>`;
  };

  const detailRow = (live) => {
    const inside = [
      plainTable(live.phases, '단계별 결과', '사전 · 당일 · 사후'),
      preCards(live.pre),
      plainTable(live.media, '매체별 결과', 'Phase × 매체'),
    ].filter(Boolean).join('');
    return `<tr class="perf-detail-row"><td colspan="8">
      <div class="kol-detail">${inside
    || '<p class="tool-empty">이 탭에서는 단계별 · 매체별 표를 찾지 못했습니다. 시트에서 확인해 주세요.</p>'}</div>
    </td></tr>`;
  };

  const excelText = () => {
    const head = ['라이브', '날짜/이름', '광고비', '매출', '주문수', 'ROAS', 'CPS', 'AOV', '사전알림'];
    const lines = [head.join('\t')];
    book.lives.map(oneLine).forEach((one) => {
      lines.push([one.name, one.caption,
        one.spend === null ? '' : Math.round(one.spend),
        one.revenue === null ? '' : Math.round(one.revenue),
        one.orders === null ? '' : one.orders,
        one.roas === null ? '' : perfRoas(one.roas),
        one.cps === null ? '' : Math.round(one.cps),
        one.aov === null ? '' : Math.round(one.aov),
        one.lead === null ? '' : one.lead].join('\t'));
    });
    return lines.join('\n');
  };

  const render = () => {
    if (!book) {
      kolLiveView.innerHTML = `<div class="tool-head"><h2>KOL 라이브</h2></div>
        ${status === 'error' ? `<p class="perf-warn">${escape(error)}</p>
          <div class="tool-card page-todo"><h3>시트를 읽지 못했습니다</h3>
            <ul><li>Apps Script 를 <b>새 버전으로 다시 배포</b>했는지 확인해 주세요</li>
              <li>시트 접근 권한이 있어야 합니다 (링크가 있는 사람 보기 이상)</li></ul></div>`
    : '<div class="tool-card page-loading">시트를 읽는 중…</div>'}`;
      lucide.createIcons();
      return;
    }

    kolLiveView.innerHTML = `<div class="tool-head">
        <h2>KOL 라이브 <small>${escape(book.bookName || '')}</small></h2>
        <p>라이브마다 따로 쓰던 결과 시트를 한 표로 모았습니다. 줄을 누르면
          그 라이브의 <b>단계별(사전 · 당일 · 사후)</b> 과 <b>매체별</b> 결과가 펼쳐집니다.</p>
      </div>
      <div class="tool-card">
        <div class="perf-filter">
          <a class="tool-add" href="${escape(book.url)}" target="_blank" rel="noopener">
            <i data-lucide="external-link"></i>시트 열기</a>
          <button type="button" class="tool-copy-all" data-kol="refresh"${status === 'loading' ? ' disabled' : ''}>
            <i data-lucide="refresh-cw"></i>${status === 'loading' ? '받는 중…' : '다시 받기'}</button>
        </div>
        <p class="perf-note">${escape(book.bookName || '')} · 탭 ${num((book.lives || []).length)}개${book.fetchedAt
    ? ` · 갱신 ${new Date(book.fetchedAt).toLocaleString('ko-KR')}` : ''}${book.cached ? ' (담아 둔 값)' : ''}</p>
      </div>
      ${listTable()}`;
    lucide.createIcons();
  };

  const load = (refresh) => {
    status = 'loading';
    error = '';
    render();
    window.fetch(SHEET_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ action: 'kolLive', refresh: Boolean(refresh) }),
    }).then((response) => response.json()).then((body) => {
      if (!body.ok) throw new Error(body.error || '시트를 읽지 못했습니다.');
      book = body;
      status = 'ready';
      render();
    }).catch((reason) => {
      status = 'error';
      error = reason.message;
      render();
    });
  };

  kolLiveView.addEventListener('click', (event) => {
    if (event.target.closest('[data-kol="refresh"]')) { load(true); return; }
    if (event.target.closest('[data-kol="excel"]')) {
      perfDownload(`KOL라이브_결과_${perfYmd(new Date())}.csv`, excelText());
      return;
    }
    const row = event.target.closest('[data-kol-row]');
    if (row) {
      const name = row.dataset.kolRow;
      opened = opened === name ? '' : name;
      render();
    }
  });

  // 메뉴에 들어올 때 한 번만 부른다
  let kolLoaded = false;
  const openKolOnce = () => {
    if (kolLoaded || kolLiveView.hidden) return;
    kolLoaded = true;
    load(false);
  };
  new MutationObserver(openKolOnce).observe(kolLiveView, { attributes: true, attributeFilter: ['hidden'] });
  openKolOnce();
}
