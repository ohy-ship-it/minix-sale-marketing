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
    { key: 'status', name: '상태', type: 'status', icon: 'loader', options: STATUS_OPTIONS },
    { key: 'sku', name: 'SKU', type: 'multi_select', icon: 'tag', options: SKU_OPTIONS },
    { key: 'channel', name: '행사채널', type: 'select', icon: 'circle-chevron-down', options: CHANNEL_OPTIONS },
    { key: 'event', name: '행사명', type: 'text', icon: 'align-left' },
    { key: 'owners', name: '담당자', type: 'multi_select', icon: 'users', options: OWNER_OPTIONS },
    { key: 'eventDate', name: '행사일정', type: 'date', icon: 'calendar' },
    { key: 'dueDate', name: '전달희망일정', type: 'date', icon: 'calendar' },
    { key: 'media', name: '매체', type: 'multi_select', icon: 'list', options: MEDIA_OPTIONS },
  ];
  // 보드 카드에 노출할 속성 (요청받은 순서)
  const CARD_PROPS = ['status', 'sku', 'channel', 'event', 'owners', 'eventDate', 'dueDate'];
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

  const STORAGE_KEY = 'minix-creative-requests-v2';
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
  });

  let rows;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    rows = Array.isArray(stored) ? stored.map(normalize) : SEED.map(normalize);
  } catch {
    rows = SEED.map(normalize);
  }
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const formatDay = (value) => {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return `${year}년 ${Number(month)}월 ${Number(day)}일`;
  };
  const formatDate = (date) => {
    if (!date?.start) return '';
    return date.end ? `${formatDay(date.start)} → ${formatDay(date.end)}` : formatDay(date.start);
  };
  const chip = (prop, value) => `<span class="chip chip-${colorOf(prop, value)}">${escapeHtml(value)}</span>`;
  const ownerChip = (value) => `<span class="chip chip-${colorOf(propByKey.owners, value)} chip-owner" data-owner="${escapeHtml(value)}" role="button" tabindex="0" title="${escapeHtml(value)} 담당 카드만 보기">${escapeHtml(value)}</span>`;

  const board = document.createElement('div');
  board.className = 'notion-board';
  const peek = document.createElement('div');
  peek.className = 'peek';
  creativeBoard.innerHTML = `
    <div class="notion-toolbar"><button class="new-page-button" type="button"><i data-lucide="plus"></i>요청하기</button></div>`;
  const filters = document.createElement('div');
  filters.className = 'owner-filter';
  creativeBoard.appendChild(filters);
  creativeBoard.appendChild(board);
  creativeBoard.appendChild(peek);

  let ownerFilter = [];
  let openId = null;

  const visibleRows = () => (ownerFilter.length
    ? rows.filter((row) => row.owners.some((owner) => ownerFilter.includes(owner)))
    : rows);

  const renderFilters = () => {
    const shown = visibleRows().length;
    filters.classList.toggle('is-active', ownerFilter.length > 0);
    filters.innerHTML = `<span class="owner-filter-label"><i data-lucide="users"></i>담당자</span>`
      + OWNER_OPTIONS.map(([name, color]) => `<button type="button" class="owner-chip chip chip-${color}${ownerFilter.includes(name) ? ' is-on' : ''}" data-filter="${escapeHtml(name)}" aria-pressed="${ownerFilter.includes(name)}">${escapeHtml(name)}</button>`).join('')
      + (ownerFilter.length
        ? `<button type="button" class="owner-clear">전체 보기</button><span class="owner-count">${shown}개 표시</span>`
        : '');
    lucide.createIcons();
  };

  const toggleOwner = (name) => {
    ownerFilter = ownerFilter.includes(name) ? ownerFilter.filter((entry) => entry !== name) : [...ownerFilter, name];
    renderBoard();
  };

  const DATE_LABEL = { eventDate: '행사', dueDate: '전달 희망' };
  const cardLine = (row, key) => {
    const prop = propByKey[key];
    const value = row[key];
    if (prop.type === 'multi_select') {
      if (!value.length) return '';
      const marks = key === 'owners' ? value.map(ownerChip) : value.map((item) => chip(prop, item));
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
          ${SCHEMA.filter((prop) => prop.key !== 'name').map((prop) => `
            <div class="peek-row">
              <span class="peek-label"><i data-lucide="${prop.icon}"></i>${escapeHtml(prop.name)}</span>
              <div class="peek-value">${propertyControl(row, prop)}</div>
            </div>`).join('')}
        </div>
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
      const row = normalize({ status, owners: [...ownerFilter] });
      rows.push(row);
      save();
      renderBoard();
      openPeek(row.id);
      return;
    }
    const ownerTag = event.target.closest('[data-owner]');
    if (ownerTag) return toggleOwner(ownerTag.dataset.owner);
    const card = event.target.closest('.notion-card');
    if (card) openPeek(card.dataset.id);
  });

  filters.addEventListener('click', (event) => {
    const chipButton = event.target.closest('.owner-chip');
    if (chipButton) return toggleOwner(chipButton.dataset.filter);
    if (event.target.closest('.owner-clear')) {
      ownerFilter = [];
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
      rows = rows.filter((entry) => entry.id !== row.id);
      closePeek();
      save();
      renderBoard();
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
    const field = event.target.closest('[data-edit]');
    if (!field || field.type === 'date') return;
    const row = rows.find((entry) => entry.id === openId);
    if (!row) return;
    row[field.dataset.edit] = field.value;
    commit({ redrawPeek: false });
  });

  peek.addEventListener('change', (event) => {
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

  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && openId) closePeek(); });

  creativeBoard.querySelector('.new-page-button').addEventListener('click', () => {
    const row = normalize({ status: '요청', owners: [...ownerFilter] });
    rows.push(row);
    save();
    renderBoard();
    openPeek(row.id);
  });

  renderBoard();
}

document.querySelectorAll('.tree-group').forEach((group) => {
  group.addEventListener('click', () => {
    group.classList.toggle('is-open');
    const children = group.nextElementSibling;
    children.hidden = !group.classList.contains('is-open');
    group.querySelector('svg')?.style.setProperty('transform', group.classList.contains('is-open') ? 'rotate(0deg)' : 'rotate(-90deg)');
  });
});

document.querySelectorAll('[data-view]').forEach((item) => {
  item.addEventListener('click', () => {
    const isCreativePlanning = item.dataset.view === '광고소재 기획';
    document.querySelectorAll('[data-view]').forEach((entry) => entry.classList.remove('is-active'));
    item.classList.add('is-active');
    document.querySelector('#page-heading').textContent = item.dataset.view;
    document.querySelector('.content-tabs').hidden = isCreativePlanning;
    document.querySelector('.target-section').hidden = isCreativePlanning;
    document.querySelector('.channel-section').hidden = isCreativePlanning;
    document.querySelector('.notes-section').hidden = isCreativePlanning;
    document.querySelector('#creative-board').hidden = !isCreativePlanning;
    history.replaceState(null, '', isCreativePlanning ? '#creative-planning' : '#dashboard');
  });
});

if (window.location.hash === '#creative-planning') {
  document.querySelector("button[data-view='광고소재 기획']")?.click();
}

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
