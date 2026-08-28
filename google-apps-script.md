# 광고소재 파일명 → 구글시트 적재 설정

`광고소재 파일명` 화면의 **최종완료** 버튼이 구글시트에 바로 적재하도록 연결하는 방법입니다.
브라우저에서 시트에 직접 쓰려면 인증이 필요해서, 시트 쪽에 받아주는 창구(Apps Script 웹 앱)를 한 번만 만들어 두면 됩니다.

대상 시트:
https://docs.google.com/spreadsheets/d/1-IrBGbuQmcQ9Za1LCZKfV6XUaGIV5gtut5npHw0Gu_E/edit

## 1. Apps Script 만들기

1. 위 시트를 연다
2. 상단 메뉴 **확장 프로그램 → Apps Script**

   > 따로 설치할 게 없습니다. 시트 제목 아래 메뉴 줄에 이미 있습니다.
   > `파일  수정  보기  삽입  서식  데이터  도구  **확장 프로그램**  도움말`
   >
   > - 메뉴가 안 보이면 시트가 **보기 전용**으로 열린 경우입니다. 편집 권한이 필요합니다.
   > - 계정 언어가 영어면 **Extensions → Apps Script** 입니다.
3. 기본 코드를 지우고 아래를 붙여넣는다

```javascript
var SHEET_ID = '1-IrBGbuQmcQ9Za1LCZKfV6XUaGIV5gtut5npHw0Gu_E';
var HEADER = ['파일명', '메시지 유형', '최종행사명', '발번시각'];

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADER);

    var rows = JSON.parse(e.postData.contents).rows || [];
    rows.forEach(function (row) {
      sheet.appendRow([
        row.filename || '',
        row.type || '',
        row.campaign || '',
        row.createdAt ? new Date(row.createdAt) : new Date(),
      ]);
    });

    return json({ ok: true, added: rows.length });
  } catch (error) {
    return json({ ok: false, error: String(error) });
  }
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. 저장(디스크 아이콘)

## 2. 웹 앱으로 배포

1. 우측 상단 **배포 → 새 배포**
2. 톱니바퀴 → **웹 앱** 선택
3. 설정
   - 설명: 아무거나 (예: 파일명 적재)
   - **다음 사용자로 실행: 나**
   - **액세스 권한이 있는 사용자: 모든 사용자**
4. **배포** → 권한 승인(본인 계정)
5. 나오는 **웹 앱 URL**을 복사 (`https://script.google.com/macros/s/AKfy.../exec` 형태)

## 3. 화면에 URL 넣기

1. `광고소재 파일명` 화면 아래쪽 **톱니바퀴 버튼**(전체 지우기 · 최종완료 옆) 클릭
2. 복사한 웹 앱 URL을 붙여넣고 확인

이후 **최종완료**를 누르면 아직 안 보낸 발번 건이 시트에 자동으로 쌓이고,
목록의 해당 행에 **적재됨** 표시가 붙습니다.

## 참고

- URL을 넣기 전에도 **최종완료**를 누르면 표 형태로 클립보드에 복사되고 시트가 새 탭으로 열립니다. 붙여넣기만 하면 됩니다.
- URL은 브라우저에 저장되므로 **사용하는 사람마다 한 번씩** 넣어야 합니다.
- 연동을 끄려면 톱니바퀴에서 URL을 비우고 확인하세요.
- 코드를 고친 뒤에는 **배포 → 배포 관리 → 편집(연필) → 버전: 새 버전 → 배포**를 해야 반영됩니다.
