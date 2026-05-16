# CHANGELOG

이 프로젝트의 주요 변경사항을 역순으로 기록합니다.

---

## [미출시] - 2026-05-16 (현재 작업)

### Added
- **예제 실행 XP 보상** (`app/(app)/learn/[unitId]/examples/page.tsx`)
  - 예제별 최초 성공 실행 시 +5 XP 지급 (세션 내 1회)
  - 우측 상단에 `💎 +5 XP` 팝업 애니메이션 (float-up, 2초)
  - 헤더에 `💎 획득XP / 최대XP` 실시간 표시
  - 이미 XP를 획득한 예제에 `+5 XP 획득 ✓` 배지 표시
  - 미획득 예제 안내 문구: `성공하면 +5 XP!`

---

## [2026-05-16] - 빈칸 채우기 연습 단계 추가

### Added
- **새 학습 단계 ✏️ 연습** (`app/(app)/learn/[unitId]/guided/`)
  - 개념 → 예제 → **연습** → 미션 4단계 학습 흐름 완성
  - 단원별 빈칸 채우기 2문제씩, 총 16문제 (단원 1~8)
  - 인라인 입력창: 코드 중간에 직접 타이핑, Enter로 정답 확인
  - 힌트 토글 (-5 XP), 정/오답 색상 피드백, 진행도 바
  - 완료 시 `+XP` 요약 및 "미션 도전하러 가기" 화면
- **`data/guided.ts`** — 빈칸 문제 데이터 파일 (16문제)
  - Unit 1: `print` / `school`
  - Unit 2: `input` / `int`
  - Unit 3: `if` / `elif`
  - Unit 4: `for` / `range`
  - Unit 5: `%` / `>`
  - Unit 6: `def` / `return`
  - Unit 7: `append` / `len`
  - Unit 8: `upper` / `split`

### Changed
- **단원 목록 페이지** (`app/(app)/learn/page.tsx`)
  - 버튼 그리드 4열 → 5열 (✏️ 연습 추가)
  - 안내 문구: "개념 → 예제 → 미션" → "개념 → 예제 → 연습 → 미션"
- **개념 페이지 탭** (`app/(app)/learn/[unitId]/concept/page.tsx`)
  - `📖개념 | 💻예제 | 🎯미션` → `📖개념 | 💻예제 | ✏️연습 | 🎯미션`
- **예제 페이지 탭·CTA** (`app/(app)/learn/[unitId]/examples/page.tsx`)
  - 탭에 `✏️ 연습` 추가
  - 하단 CTA: "미션 풀러 가기" → "빈칸 채우기 연습하기"
- **미션 페이지 사이드바** (`app/(app)/learn/[unitId]/missions/page.tsx`)
  - `📖 💻 🎯` 아이콘 → `📖 💻 ✏️ 🎯`

---

## [2026-05-16] - 미션 레이아웃 개편 + Lottie 애니메이션

### Added
- **Lottie 애니메이션** (`public/lottie/`)
  - `success.json` (28KB): 미션 정답 통과 시 전체화면 축하 오버레이
  - `hint.json` (108KB): AI 힌트 요청 시 전구 팝업 (2.2초)
  - `lottie-react` 패키지 추가, SSR 안전하게 `next/dynamic` 로드

### Changed
- **미션 페이지 레이아웃** (`app/(app)/learn/[unitId]/missions/page.tsx`)
  - 상하 3단 → **좌우 분할**: 좌 42% (문제+AI채팅) / 우 58% (코드+결과)
  - AI 채팅창 항상 표시 (탭 전환 제거)
  - 다크 GitHub 스타일 코드 에디터 (`#0d1117` 배경, `#e6edf3` 텍스트)
  - 출력 영역 별도 다크 패널 (`#161b22`)

---

## [2026-05-16] - 텍스트 정확도 개선 및 버그 수정

### Fixed
- **튜토리얼 빈칸 입력 불가 버그** (`app/tutorial/page.tsx`)
  - `onChange` 클로저가 `blankIdx`를 렌더 완료 후 값으로 캡처해 항상 마지막 인덱스를 덮어쓰던 문제
  - `const currentIdx = blankIdx` 패턴으로 수정 (전 퀘스트 해당)

### Changed
- **홈 랜딩** (`app/page.tsx`): "15개 미션" → "20개 미션"
- **프로필** (`app/(app)/profile/page.tsx`): Groq 한도 "14,400회/일" → "1,000회/일 · 100K 토큰/일"
- **학생 대시보드** (`app/(app)/dashboard/page.tsx`): "반 주간 랭킹" → "반 내 랭킹"
- **교사 대시보드** (`app/(app)/teacher/dashboard/page.tsx`)
  - 미션 7개 제한 제거 → 전체 미션 통계 표시
  - "취약 단계" → "힌트 의존도"
  - "힌트 avg Xavg개" → "평균 힌트 X개"

---

## [이전 이력] - git log 참조

| 커밋 | 내용 |
|------|------|
| `0d3b3bb` | AI 문제 생성: Groq 모델 70B 업그레이드 |
| `3f7a96d` | 예제 페이지 input() 지원, 단원 6/7/8 예제 추가 |
| `2082b36` | 미션 19/20 input() 기반 다중 입력 검증 |
| `7334991` | 단원별 추가문제 관리, 교사 삭제/단원이동 기능 |
| `1ca8768` | 단원 1 미션 19/20 추가 |
| `175223b` | 8단원 커리큘럼 개편 및 반응형 레이아웃 |

---

*형식: [Unreleased] → 배포 시 날짜로 확정*
