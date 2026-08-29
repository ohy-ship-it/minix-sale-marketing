# 광고소재 검수 ↔ 워크스페이스 연동 규격

`ad-creative-checker` 와 minix 워크스페이스를 잇기 위한 규격입니다.
검수 사이트에 **아래 수신 코드만 넣으면** 연동이 완성됩니다. 워크스페이스 쪽은 이미 구현돼 있습니다.

- 워크스페이스: 검수 사이트를 iframe 으로 임베드 (`광고소재 검수` 메뉴)
- 통신 방식: `window.postMessage` (같은 창 안이라 서버·CORS 불필요)

## 지금 흐름과 바뀌는 것

| | 지금 | 연동 후 |
|---|---|---|
| 소재명 입력 | 파일명 생성기에서 만든 이름을 검수 사이트에 다시 타이핑 | 자동으로 채워짐 |
| 검수 후 | "복사" → 구글시트 해당 탭 찾아 붙여넣기 | 워크스페이스가 받아 시트에 적재 |
| 이력 | 남지 않음 | 누가 언제 통과시켰는지 함께 기록 |

---

## 1. 워크스페이스 → 검수 사이트

### 1-1. 연결 확인 (ping / ready)

워크스페이스는 iframe 이 뜨면 `ping` 을 보냅니다. 검수 사이트가 `ready` 로 답하면
워크스페이스 화면에 **연동됨** 으로 표시되고, 답이 없으면 **연동 대기 중** 으로 남습니다.

```js
// 워크스페이스가 보내는 것
{ source: 'minix-workspace', type: 'ping' }

// 검수 사이트가 답해야 하는 것
{ source: 'ad-creative-checker', type: 'ready' }
```

### 1-2. 행사 정보 채우기 (prefill)

사용자가 **[검수로 보내기]** 를 누르면 전달됩니다.

```js
{
  source: 'minix-workspace',
  type: 'prefill',
  payload: {
    campaign: '260827_더플렌더mini_네이버_음쓰해방위크',  // 최종행사명 = 소재명
    date:     '2026-08-27',
    product:  '더플렌더mini',
    channel:  '네이버',        // 행사채널
    media:    'GFA-피드',      // 매체 → 검수 사이트의 채널 선택과 대응
    filename: 'new-11'         // 발번된 파일명 (없을 수 있음)
  }
}
```

**받는 쪽이 할 일**
- `payload.campaign` → `소재 정보 > 행사명` 입력칸에 채우기
- `payload.media` → 좌측 채널 선택 (아래 대응표 참고). 값이 없거나 모르면 무시하고 현재 선택 유지
- 나머지 필드는 필요할 때 쓰면 됩니다. 없는 값은 빈 문자열로 옵니다

**매체 → 검수 채널 대응**

| 워크스페이스 `media` | 검수 사이트 채널 |
|---|---|
| `메타` | (해당 없음 — 무시) |
| `GFA-피드` | GFA 피드 |
| `GFA-스마트채널` | GFA 스마트채널 |
| `GFA-쇼핑소식` | GFA 쇼핑소식 |
| `카카오-비즈보드` | 카카오 비즈보드 |
| `카카오-디스플레이` | (해당 없음 — 무시) |
| `구글-디멘드젠` | 구글 디맨드젠 |
| `마케팅팀` | (해당 없음 — 무시) |

> 브랜드검색(영상형 / 이미지형)은 워크스페이스의 매체 목록에 아직 없습니다.
> 필요하면 매체 목록에 추가하겠습니다.

---

## 2. 검수 사이트 → 워크스페이스

검수를 마치고 **복사** 버튼을 누를 때, 클립보드 복사와 **함께** 아래를 보내주세요.
(복사 동작은 그대로 두시면 됩니다. 연동이 안 될 때의 대비책으로 남겨둡니다)

```js
{
  source: 'ad-creative-checker',
  type: 'result',
  payload: {
    channel: '브랜드검색(영상형)',   // 화면에서 선택된 채널 이름
    materialName: '260827_더플렌더mini_네이버_음쓰해방위크',
    bgColor: 'R:255 G:89 B:0',      // 없으면 ''
    tableText: '...'                // 기존 "복사 (PC/MO 표 형식)" 이 만드는 문자열 그대로
  }
}
```

`tableText` 는 **지금 만들고 있는 문자열을 그대로** 넣으면 됩니다.
워크스페이스가 그 형식대로 파싱해서 구글시트의 채널 탭에 적재합니다.

```
260827_더플렌더mini_네이버_음쓰해방위크\tR:255 G:89 B:0
PC\t\t\t\tMO
새소식 (36)\t최대 43% 할인, 음쓰 해방 타임딜!\t21\t\t새소식 (18)\t최대 43% 할인,타임딜 이벤트!\t18
...
```

---

## 3. 넣어야 할 코드

검수 사이트 스크립트 아무 곳에나 아래를 추가하면 됩니다.

```js
/* ── minix 워크스페이스 연동 ─────────────────────────────── */
var MINIX_ORIGIN = 'https://minix-salemarketing.web.app'; // 로컬 테스트: 'http://127.0.0.1:8765'

window.addEventListener('message', function (event) {
  var data = event.data;
  if (!data || data.source !== 'minix-workspace') return;

  if (data.type === 'ping') {
    event.source.postMessage({ source: 'ad-creative-checker', type: 'ready' }, event.origin);
    return;
  }

  if (data.type === 'prefill') {
    var p = data.payload || {};

    // 1) 채널 선택 — 사이트의 채널 전환 함수에 연결해 주세요
    if (p.media && MEDIA_TO_CHANNEL[p.media]) {
      selectChannel(MEDIA_TO_CHANNEL[p.media]);   // ← 실제 함수명으로 교체
    }

    // 2) 소재명 채우기 — '행사명' 입력칸에 연결해 주세요
    if (p.campaign) {
      var input = document.querySelector('.field-input[data-group="0"][data-idx="0"]');
      if (input) {
        input.value = p.campaign;
        input.dispatchEvent(new Event('input', { bubbles: true }));  // 글자수 갱신
      }
    }
  }
});

var MEDIA_TO_CHANNEL = {
  'GFA-피드': 'GFA 피드',
  'GFA-스마트채널': 'GFA 스마트채널',
  'GFA-쇼핑소식': 'GFA 쇼핑소식',
  '카카오-비즈보드': '카카오 비즈보드',
  '구글-디멘드젠': '구글 디맨드젠'
};

// 복사 버튼을 누를 때 함께 호출해 주세요
function notifyMinix(channelName, materialName, bgColor, tableText) {
  if (window.parent === window) return;   // 임베드 상태가 아니면 아무것도 안 함
  window.parent.postMessage({
    source: 'ad-creative-checker',
    type: 'result',
    payload: {
      channel: channelName,
      materialName: materialName,
      bgColor: bgColor || '',
      tableText: tableText
    }
  }, MINIX_ORIGIN);
}
/* ────────────────────────────────────────────────────────── */
```

`selectChannel` 과 소재명 입력칸 선택자는 실제 코드에 맞게 바꿔 주세요.
**소스를 주시면 그 부분까지 맞춰서 정리해 드리겠습니다.**

---

## 4. 확인 방법

1. 워크스페이스 `광고소재 검수` 메뉴를 연다
2. 상단 배지가 **연동 대기 중** → **연동됨** 으로 바뀌면 ping/ready 성공
3. **[검수로 보내기]** 를 눌러 소재명이 채워지는지 확인
4. 검수 후 **복사** → 워크스페이스 하단에 표가 나타나면 result 성공

연동이 안 된 상태에서도 기존처럼 **복사 → 시트 붙여넣기** 로 쓸 수 있습니다.
연동은 단계를 줄이는 것이지, 기존 흐름을 막지 않습니다.

---

## 5. 보안

- `postMessage` 는 **origin 을 지정해서** 보냅니다 (`MINIX_ORIGIN`)
- 받을 때도 `data.source` 를 확인합니다
- 페이지 안에서만 오가므로 서버·CORS·인증이 필요 없습니다
