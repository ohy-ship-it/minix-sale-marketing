lucide.createIcons();

const creativeBoard = document.querySelector('#creative-board');
if (creativeBoard) {
  creativeBoard.innerHTML = `
    <div class="notion-toolbar"><button class="board-view-button" type="button"><i data-lucide="columns-3"></i>보드 보기</button><div class="board-tools"><i data-lucide="list-filter"></i><i data-lucide="arrow-down-up"></i><i data-lucide="zap"></i><i data-lucide="wand-sparkles"></i><i data-lucide="search"></i><i data-lucide="sliders-horizontal"></i><button class="new-page-button" type="button"><i data-lucide="plus"></i>새로 만들기 <i data-lucide="chevron-down"></i></button></div></div>
    <div class="notion-board"><div class="notion-column request-column"><div class="notion-column-title"><span>● 요청</span><b>1</b></div><article class="notion-card"><h3>[당일/사후] 카카오톡딜워크</h3><p>2026년 9월 10일 → 2026년 9월 13일</p><span class="setting">□ 세팅</span><div class="chips"><span>더클렌딘mini</span><span>오혜영</span><span>이정민</span></div><small>2026년 9월 8일</small></article><button class="new-page" type="button"><i data-lucide="plus"></i>새 페이지</button></div><div class="notion-column progress-column"><div class="notion-column-title"><span>● 진행 중</span><b>3</b></div><article class="notion-card"><h3>[상시/오픈-온라인] 하이마트 미니 런칭기념 행사</h3><p>2026년 9월 6일 → 2026년 9월 8일</p><span class="setting">□ 세팅</span><div class="chips"><span>더클렌딘mini</span><span>김서영</span><span>김진빈</span></div><small>2026년 9월 3일</small></article><article class="notion-card"><h3>[당일/상시] 빕타나는 생활 MLC</h3><p>2026년 9월 2일 → 2026년 9월 4일</p><span class="setting">□ 세팅</span><div class="chips"><span>더클렌딘mini</span><span>더클렌딘max</span><span>이정민</span><span>오혜영</span></div><small>2026년 8월 31일</small></article><article class="notion-card"><h3>[당일] 오늘의집 라이브</h3><p>2026년 9월 9일</p><span class="setting">□ 세팅</span><div class="chips"><span>더클렌딘mini</span><span>오혜영</span><span>김서영</span></div><small>2026년 9월 7일</small></article><button class="new-page" type="button"><i data-lucide="plus"></i>새 페이지</button></div><div class="notion-column delivered-column"><div class="notion-column-title"><span>● 전달 완료</span><b>1</b></div><article class="notion-card"><h3>[당일] 현대홈쇼핑 MLC</h3><p>2026년 8월 31일</p><span class="setting">□ 세팅</span><div class="chips"><span>네어드라이</span><span>김진빈</span><span>이정민</span></div><small>2026년 8월 27일</small></article><button class="new-page" type="button"><i data-lucide="plus"></i>새 페이지</button></div><div class="notion-column final-column"><div class="notion-column-title"><span>● 최종 완료(세팅)</span><b>0</b></div><button class="new-page" type="button"><i data-lucide="plus"></i>새 페이지</button></div><div class="notion-column hold-column"><div class="notion-column-title"><span>● 홀딩/리터치</span><b>0</b></div><button class="new-page" type="button"><i data-lucide="plus"></i>새 페이지</button></div></div>`;
  lucide.createIcons();
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
