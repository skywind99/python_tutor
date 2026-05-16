# 이미지/애니메이션 출처 로그

이 프로젝트에서 사용된 모든 외부 이미지 및 애니메이션 파일의 출처를 기록합니다.

---

## Lottie 애니메이션 (public/lottie/)

### 서식 기준 (서식5)
> 비고(출처): LottieFiles - 작가명, 애니메이션명, https://lottiefiles.com/animations/xxx, License: Free

---

### 1. success.json — 미션 성공 축하 애니메이션

| 항목 | 내용 |
|------|------|
| **로컬 경로** | `public/lottie/success.json` |
| **파일 크기** | 28KB |
| **애니메이션명** | Successful (JSON nm 필드 기준) |
| **다운로드 CDN URL** | https://assets2.lottiefiles.com/packages/lf20_jbrw3hcz.json |
| **LottieFiles 페이지** | https://lottiefiles.com/animations/successful-jbrw3hcz |
| **작가명** | ⚠️ 직접 확인 필요 → 위 페이지 방문 후 기재 |
| **라이선스** | ⚠️ 직접 확인 필요 (Free 또는 Lottie Simple License) |
| **사용 위치** | `app/(app)/learn/[unitId]/missions/page.tsx` — 미션 정답 통과 시 전체화면 오버레이 |
| **추가일** | 2026-05-16 |

**서식5 비고란 (작가명 확인 후 채워주세요):**
```
LottieFiles - [작가명], Successful, https://lottiefiles.com/animations/successful-jbrw3hcz, License: Free
```

---

### 2. hint.json — 힌트 요청 전구 애니메이션

| 항목 | 내용 |
|------|------|
| **로컬 경로** | `public/lottie/hint.json` |
| **파일 크기** | 108KB |
| **애니메이션명** | Designer boy ready (JSON nm 필드 기준) |
| **다운로드 CDN URL** | https://assets3.lottiefiles.com/packages/lf20_fcfjwiyb.json |
| **LottieFiles 페이지** | https://lottiefiles.com/animations/designer-boy-ready-fcfjwiyb |
| **작가명** | ⚠️ 직접 확인 필요 → 위 페이지 방문 후 기재 |
| **라이선스** | ⚠️ 직접 확인 필요 (Free 또는 Lottie Simple License) |
| **사용 위치** | `app/(app)/learn/[unitId]/missions/page.tsx` — AI 힌트 요청 시 채팅 헤더 위 팝업 (2.2초 표시) |
| **추가일** | 2026-05-16 |

**서식5 비고란 (작가명 확인 후 채워주세요):**
```
LottieFiles - [작가명], Designer boy ready, https://lottiefiles.com/animations/designer-boy-ready-fcfjwiyb, License: Free
```

---

## ⚠️ 작가명 확인 방법

1. 위 LottieFiles 페이지 URL을 브라우저에서 직접 열기
2. 페이지 상단 애니메이션 제목 아래 **작가 프로필명** 확인
3. 라이선스 섹션에서 **"Free" / "Lottie Simple License"** 확인
4. 해당 페이지를 스크린샷 저장 → 라이선스 표시 화면이 증빙자료가 됨
5. 이 파일의 [작가명] 부분을 실제 이름으로 교체

> **실무 팁**: 다운로드 시점의 라이선스 화면이 증빙이 됩니다.  
> 페이지를 PDF 저장하거나 스크린샷을 `docs/license-screenshots/` 폴더에 보관하세요.

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
| jsDelivr CDN | https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulkt-stdlib.js | Skulpt 표준 라이브러리 |

---

## 향후 이미지 추가 시 작성 템플릿

```
| 파일 경로 | [로컬 경로] |
| 다운로드 URL | [원본 URL] |
| LottieFiles 페이지 | [페이지 URL] |
| 작가명 | [작가명] |
| 라이선스 | [Free / CC0 / 기타] |
| 사용 위치 | [컴포넌트 경로 및 용도] |
| 추가일 | [YYYY-MM-DD] |

서식5: LottieFiles - [작가명], [애니메이션명], [페이지 URL], License: [라이선스]
```

---

*마지막 업데이트: 2026-05-16*
