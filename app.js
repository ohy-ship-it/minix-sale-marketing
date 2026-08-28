lucide.createIcons();

const creativeBoard = document.querySelector('#creative-board');
if (creativeBoard) {
  creativeBoard.innerHTML = `
    <div class="notion-toolbar"><button class="board-view-button" type="button"><i data-lucide="columns-3"></i>보드 보기</button><div class="board-tools"><i data-lucide="list-filter"></i><i data-lucide="arrow-down-up"></i><i data-lucide="zap"></i><i data-lucide="wand-sparkles"></i><i data-lucide="search"></i><i data-lucide="sliders-horizontal"></i><button class="new-page-button" type="button"><i data-lucide="plus"></i>새로 만들기 <i data-lucide="chevron-down"></i></button></div></div>
    <div class="notion-board"><div class="notion-column request-column"><div class="notion-column-title"><span>● 요청</span><b>1</b></div><article class="notion-card"><h3>[당일/사후] 카카오톡딜워크</h3><p>2026년 9월 10일 → 2026년 9월 13일</p><span class="setting">□ 세팅</span><div class="chips"><span>더클렌딘mini</span><span>오혜영</span><span>이정민</span></div><small>2026년 9월 8일</small></article><button class="new-page" type="button"><i data-lucide="plus"></i>새 페이지</button></div><div class="notion-column progress-column"><div class="notion-column-title"><span>● 진행 중</span><b>3</b></div><article class="notion-card"><h3>[상시/오픈-온라인] 하이마트 미니 런칭기념 행사</h3><p>2026년 9월 6일 → 2026년 9월 8일</p><span class="setting">□ 세팅</span><div class="chips"><span>더클렌딘mini</span><span>김서영</span><span>김진빈</span></div><small>2026년 9월 3일</small></article><article class="notion-card"><h3>[당일/상시] 빕타나는 생활 MLC</h3><p>2026년 9월 2일 → 2026년 9월 4일</p><span class="setting">□ 세팅</span><div class="chips"><span>더클렌딘mini</span><span>더클렌딘max</span><span>이정민</span><span>오혜영</span></div><small>2026년 8월 31일</small></article><article class="notion-card"><h3>[당일] 오늘의집 라이브</h3><p>2026년 9월 9일</p><span class="setting">□ 세팅</span><div class="chips"><span>더클렌딘mini</span><span>오혜영</span><span>김서영</span></div><small>2026년 9월 7일</small></article><button class="new-page" type="button"><i data-lucide="plus"></i>새 페이지</button></div><div class="notion-column delivered-column"><div class="notion-column-title"><span>● 전달 완료</span><b>1</b></div><article class="notion-card"><h3>[당일] 현대홈쇼핑 MLC</h3><p>2026년 8월 31일</p><span class="setting">□ 세팅</span><div class="chips"><span>네어드라이</span><span>김진빈</span><span>이정민</span></div><small>2026년 8월 27일</small></article><button class="new-page" type="button"><i data-lucide="plus"></i>새 페이지</button></div><div class="notion-column final-column"><div class="notion-column-title"><span>● 최종 완료(세팅)</span><b>0</b></div><button class="new-page" type="button"><i data-lucide="plus"></i>새 페이지</button></div><div class="notion-column hold-column"><div class="notion-column-title"><span>● 홀딩/리터치</span><b>0</b></div><button class="new-page" type="button"><i data-lucide="plus"></i>새 페이지</button></div></div>`;
  creativeBoard.innerHTML = creativeBoard.innerHTML
    .replaceAll('카카오톡딜워크', '카카오톡딜위크')
    .replaceAll('더클렌딘mini', '더플렌더mini')
    .replaceAll('더클렌딘max', '더플렌더max')
    .replaceAll('빕타나는 생활 MLC', '브티나는 생활 MLC')
    .replaceAll('네어드라이', '더 에어드라이');
  lucide.createIcons();

  const savedRequests = JSON.parse(localStorage.getItem('minix-creative-requests') || '[]');
  const columns = {
    요청: '.request-column',
    '진행 중': '.progress-column',
    '전달 완료': '.delivered-column',
    '최종 완료(세팅)': '.final-column',
    '홀딩/리터치': '.hold-column',
  };

  const saveRequests = () => {
    const requests = [...creativeBoard.querySelectorAll('.custom-request')].map((card) => ({
      title: card.querySelector('h3').textContent,
      date: card.dataset.date,
      product: card.dataset.product,
      assignee: card.dataset.assignee,
      status: card.closest('.notion-column').querySelector('.notion-column-title span').textContent.replace('● ', ''),
    }));
    localStorage.setItem('minix-creative-requests', JSON.stringify(requests));
  };

  const updateCounts = () => Object.entries(columns).forEach(([status, selector]) => {
    const column = creativeBoard.querySelector(selector);
    const count = column.querySelectorAll('.notion-card').length;
    column.querySelector('.notion-column-title b').textContent = count;
  });

  const addCard = ({ title, date: dueDate, product, assignee, status }) => {
    const column = creativeBoard.querySelector(columns[status] || columns.요청);
    const addButton = column.querySelector('.new-page');
    const card = document.createElement('article');
    card.className = 'notion-card custom-request';
    card.draggable = true;
    card.dataset.date = dueDate;
    card.dataset.product = product;
    card.dataset.assignee = assignee;
    card.innerHTML = `<h3>${title}</h3><p>${dueDate || '일정 미정'}</p><span class="setting">□ 세팅</span><div class="chips"><span>${product || '상품 미정'}</span><span>${assignee || '담당자 미정'}</span></div><small>방금 생성</small>`;
    column.insertBefore(card, addButton);
    card.addEventListener('dragstart', () => card.classList.add('is-dragging'));
    card.addEventListener('dragend', () => { card.classList.remove('is-dragging'); saveRequests(); updateCounts(); });
  };

  const form = document.createElement('form');
  form.className = 'request-modal';
  form.innerHTML = `<div class="modal-backdrop"></div><div class="modal-panel"><div class="modal-heading"><h2>광고소재 요청</h2><button type="button" class="modal-close" aria-label="닫기">×</button></div><label>요청 제목<input name="title" required placeholder="예: 9월 프로모션 배너"></label><label>일정<input name="date" placeholder="예: 2026년 9월 10일"></label><label>상품<input name="product" placeholder="예: 더플렌더mini"></label><label>담당자<input name="assignee" placeholder="예: 홍길동"></label><label>상태<select name="status"><option>요청</option><option>진행 중</option><option>전달 완료</option><option>최종 완료(세팅)</option><option>홀딩/리터치</option></select></label><button class="modal-submit" type="submit">보드에 추가</button></div>`;
  creativeBoard.appendChild(form);
  const openForm = () => { form.classList.add('is-visible'); form.querySelector('input').focus(); };
  const closeForm = () => { form.classList.remove('is-visible'); form.reset(); };
  creativeBoard.querySelectorAll('.new-page, #new-request, .new-page-button').forEach((button) => button.addEventListener('click', openForm));
  const boardTools = creativeBoard.querySelector('.board-tools');
  const toolButtons = [
    ['list-filter', '필터'],
    ['arrow-down-up', '정렬'],
    ['zap', '자동화'],
    ['wand-sparkles', '보기 설정'],
    ['search', '검색'],
    ['sliders-horizontal', '속성'],
  ];
  toolButtons.forEach(([icon, label]) => {
    const iconElement = boardTools.querySelector(`[data-lucide="${icon}"]`);
    const button = iconElement?.closest('button') || iconElement;
    if (!button) return;
    button.classList.add('board-tool-button');
    button.setAttribute('title', label);
    button.setAttribute('aria-label', label);
    button.addEventListener('click', () => {
      if (label === '검색') {
        const keyword = window.prompt('카드 제목 검색');
        if (keyword === null) return;
        creativeBoard.querySelectorAll('.notion-card').forEach((card) => {
          card.hidden = Boolean(keyword.trim()) && !card.textContent.toLowerCase().includes(keyword.trim().toLowerCase());
        });
        return;
      }
      if (label === '정렬') {
        creativeBoard.querySelectorAll('.notion-column').forEach((column) => {
          const cards = [...column.querySelectorAll('.notion-card')].sort((a, b) => a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent, 'ko'));
          cards.forEach((card) => column.insertBefore(card, column.querySelector('.new-page')));
        });
        saveRequests();
        return;
      }
      window.alert(`${label} 기능은 보드 데이터 연결 후 사용할 수 있습니다.`);
    });
  });
  creativeBoard.querySelector('.board-view-button').addEventListener('click', () => {
    creativeBoard.classList.toggle('compact-board');
  });
  form.querySelector('.modal-close').addEventListener('click', closeForm);
  form.querySelector('.modal-backdrop').addEventListener('click', closeForm);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    addCard(Object.fromEntries(new FormData(form)));
    saveRequests();
    updateCounts();
    closeForm();
  });
  creativeBoard.querySelectorAll('.notion-card').forEach((card) => {
    card.draggable = true;
    card.addEventListener('dragstart', () => card.classList.add('is-dragging'));
    card.addEventListener('dragend', () => { card.classList.remove('is-dragging'); saveRequests(); updateCounts(); });
  });
  creativeBoard.querySelectorAll('.notion-column').forEach((column) => {
    column.addEventListener('dragover', (event) => event.preventDefault());
    column.addEventListener('drop', (event) => {
      event.preventDefault();
      const card = creativeBoard.querySelector('.is-dragging');
      if (card) column.insertBefore(card, column.querySelector('.new-page'));
      saveRequests();
      updateCounts();
    });
  });
  savedRequests.forEach(addCard);
  updateCounts();
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
