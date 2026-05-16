# 이미지/애니메이션 출처 로그

이 프로젝트에서 사용된 모든 외부 이미지 및 애니메이션 파일의 출처를 기록합니다.

---

## Lottie 애니메이션 (public/lottie/)

| 파일 | 원본 URL | 용도 | 라이선스 | 추가일 |
|------|----------|------|----------|--------|
| `public/lottie/success.json` | https://assets2.lottiefiles.com/packages/lf20_jbrw3hcz.json | 미션 성공 시 축하 오버레이 | LottieFiles Free License (비상업적 사용 가능) | 2026-05-16 |
| `public/lottie/hint.json` | https://assets3.lottiefiles.com/packages/lf20_fcfjwiyb.json | 힌트 요청 시 전구 팝업 | LottieFiles Free License (비상업적 사용 가능) | 2026-05-16 |

### 파일 크기
- `success.json`: 28KB
- `hint.json`: 108KB

### 사용 위치
- `app/(app)/learn/[unitId]/missions/page.tsx`
  - `success.json`: 미션 정답 통과 시 전체화면 오버레이 (`onPass` 콜백)
  - `hint.json`: AI 힌트 요청 시 채팅 헤더 위 팝업 (2.2초 표시)

---

## 정적 이미지 파일

현재 `public/` 폴더에 정적 이미지 파일(.png, .jpg, .svg, .webp, .ico)은 없습니다.
사이트의 모든 시각적 요소는 이모지(텍스트) 또는 CSS/Tailwind로 구현되어 있습니다.

---

## 파비콘 / OG 이미지

현재 커스텀 파비콘 및 Open Graph 이미지가 설정되어 있지 않습니다.
(`app/layout.tsx`의 `metadata`에 `icons`, `openGraph.images` 미설정 상태)

---

## 외부 스크립트 (이미지 렌더링 관련)

| 출처 | URL | 용도 |
|------|-----|------|
| jsDelivr CDN | https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js | 브라우저 내 Python 실행 엔진 |
| jsDelivr CDN | https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js | Skulpt 표준 라이브러리 |

> Skulpt는 이미지를 직접 렌더링하지 않으나, 코드 실행 결과를 화면에 출력하는 역할을 합니다.

---

## 추가 시 작성 방법

새로운 이미지나 애니메이션을 추가할 때는 아래 항목을 이 파일에 기록해주세요.

```
| 파일 경로 | 원본 URL 또는 직접 제작 | 용도 | 라이선스 | 추가일(YYYY-MM-DD) |
```

---

*마지막 업데이트: 2026-05-16*
