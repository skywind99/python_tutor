# 개발 로그 (Development Log)

프로젝트: **파이썬 학습실** — AI 힌트 기반 파이썬 자기주도 학습 플랫폼  
스택: Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase · Groq · Gemini  
배포: Vercel (main 브랜치 자동 배포)  
저장소: https://github.com/skywind99/python_tutor

---

## 2026-05-17 (Day 6)

### PART-단원 연결 `d9e9f89`
- **배경**: 튜토리얼과 단원 학습이 서로 분리되어 학습 흐름이 끊김
- **구현**:
  - `TutorialBanner` 컴포넌트: 개념 페이지 진입 시 해당 PART 튜토리얼 추천 배너 표시
  - localStorage로 닫기 상태 저장 (PART별 독립)
  - `learn/page.tsx`: PART별 헤더 + "튜토리얼 보기" 링크로 단원 그룹화
  - `tutorial/page.tsx`: `useSearchParams`로 `?part=X` URL 파라미터 지원, Suspense 경계 추가
- **학습 흐름 설계**: 튜토리얼 PART → 개념/예제/연습 → 미션 → 추가문제 → 다음 PART 튜토리얼

### 튜토리얼 완료 후 학습 창 연결 `d32ef00`
- **변경**: PART 마지막 미션 완료 시 기존 "지도보기"/"다음 미션" 제거
- 대신 "📚 단원 X 학습 시작하기 →" 버튼 → `/learn/{firstUnitId}/concept` 직접 이동
- PART 내 중간 미션 완료는 "다음 미션 시작!" 유지
- **결정 기록**: "지도보기"는 PART 완료 시점에 불필요 — 학습 흐름상 다음 단계로 바로 이동하는 게 자연스럽다고 판단

### 추가문제 미션 화면 통합 `b3949d9` `b2287f5`
- **배경**: 추가문제가 `/custom-mission/[id]` 별도 페이지로 분리되어 화면 전환이 어색함. 미션과 UI가 사실상 동일함
- **구현**:
  - 사이드바 추가문제 항목을 `<Link>` → `<button onClick={selectCustomMission}>` 으로 변경
  - `currentCustom` 상태로 현재 활성 추가문제 추적
  - `runCode`: `currentCustom` 감지 시 `expected_output` 비교 방식으로 분기
  - `onPassCustom`: `custom_mission_logs`에 upsert, 완료 체크 업데이트
  - 좌측 패널: 추가문제 선택 시 제목/토픽/설명/예상 출력 표시로 조건부 렌더링
  - `sendChat`: `currentCustom` 여부에 따라 미션 컨텍스트 전환
  - 정적 힌트 직접 표시 제거 (AI 튜터를 통해서만 힌트 제공)
- **결정 기록**: `/custom-mission/[id]` 페이지는 유지하되 일반 진입 경로에서 제외

### 대시보드 추가문제 섹션 제거 `d32ef00`
- 대시보드의 "선생님 추가 문제" 카드 섹션 제거
- 추가문제는 단원별 학습 페이지 → 미션 탭 사이드바에서 접근
- `customMissions` 상태 및 `/api/custom-missions` fetch 코드도 함께 제거

---

## 2026-05-16 (Day 5)

### 연습 코드 텍스트 색상 버그 수정 `33fb81a`
- **문제**: 빈칸 채우기 연습 페이지의 코드 텍스트가 `bg-gray-950` 배경과 비슷한 어두운 색이라 글자가 안 보임
- **원인**: `parseTemplate()` 내 `<span>` 에 색상 클래스를 지정하지 않아 브라우저 기본 텍스트 색(거의 검정)이 적용됨
- **해결**: `text-green-400` 추가 → 예제 페이지와 동일한 초록 코드 색상 통일

### 예제 실행 XP 보상 `80fd694`
- **배경**: 예제 페이지는 학습 흐름의 핵심인데 아무런 보상이 없어 동기 부여가 약함
- **구현**:
  - 예제 코드를 실행해서 오류 없이 성공하면 **+5 XP** (예제당 세션 내 최초 1회)
  - `xpedSet: Set<number>` 로 이미 XP를 준 예제 추적
  - 우상단 `💎 +5 XP` float-up 팝업 애니메이션 (CSS keyframes, 2초)
  - 헤더에 `💎 획득XP / 최대XP` 실시간 표시
  - 이미 획득한 예제 카드에 `+5 XP 획득 ✓` 배지
  - XP는 세션 한정 (DB 미저장) — 미션 점수와 혼재 방지
- **결정 기록**: Supabase 저장 여부 검토했으나 예제 XP는 학습 독려용 시각 피드백이므로 세션 로컬로 충분하다고 판단

### 이미지 출처 로그 `16272ae` `5e35f6b`
- `IMAGE_SOURCES.md` 생성
- 사용 중인 Lottie 파일 2개 출처 기록 (JSON nm 필드로 애니메이션명 확인)
  - `success.json` ← `https://assets2.lottiefiles.com/packages/lf20_jbrw3hcz.json` (nm: "Successful")
  - `hint.json` ← `https://assets3.lottiefiles.com/packages/lf20_fcfjwiyb.json` (nm: "Designer boy ready")
- LottieFiles 웹사이트가 봇 접근 차단(403)으로 작가명 자동 수집 불가 → 직접 확인 안내 작성
- 서식5 기준 비고란 템플릿 제공: `LottieFiles - [작가명], [애니메이션명], [URL], License: Free`

### ✏️ 연습 단계 (빈칸 채우기) 추가 `895372f`
- **배경**: 외부 피드백 — "예제 보고 바로 미션은 너무 점프가 크다. 중간 단계가 필요하다"
- **설계**:
  - `data/guided.ts`: 단원별 2문제 × 8단원 = 16문제 데이터 파일
  - `[___]` 패턴으로 빈칸 표시 (튜토리얼과 동일 방식)
  - **클로저 버그 방지**: `const currentIdx = blankIdx` 를 클로저 생성 전에 캡처 (튜토리얼 버그 재발 방지)
- **UX**:
  - 한 문제씩 표시, 진행도 바, 도트 인디케이터
  - Enter 키로 정답 확인
  - 힌트 토글 (사용 시 -5 XP 페널티 안내)
  - 정답: 초록 테두리 / 오답: 빨간 테두리
  - 완료 시 획득 XP 요약 + "미션 도전하러 가기"
- **내비게이션 통합**: 개념/예제/미션 페이지 탭, 단원 목록 그리드(4→5열) 전부 업데이트

### 미션 레이아웃 + Lottie 애니메이션 `5834044`
- **레이아웃**: 상하 3단 → 좌우 분할 (좌 42%: 문제+AI채팅 / 우 58%: 코드+결과)
  - AI 채팅창 항상 표시 (기존 탭 전환 제거)
  - 다크 GitHub 스타일 에디터 (`#0d1117` / `#e6edf3`)
- **Lottie**: `lottie-react` 패키지 추가, SSR 안전을 위해 `next/dynamic` 사용
  - 성공 애니메이션: `onPass` 시 전체화면 오버레이, `loop: false`
  - 힌트 애니메이션: 최초 요청 시 lazy-load, 2.2초 팝업
- **텍스트 오류 수정 묶음**:
  - 홈: "15개 미션" → "20개 미션"
  - 프로필: Groq 한도 "14,400회/일" → "1,000회/일 · 100K 토큰/일"
  - 학생 대시보드: "반 주간 랭킹" → "반 내 랭킹"
  - 교사 대시보드: 미션 7개 제한 해제, "취약 단계" → "힌트 의존도"

---

## 2026-05-16 (Day 4 — 집중 개발일)

### AI 모델 스택 확정 `0d3b3bb` `90b663c` `b1388f0`
- AI 튜터: Groq `llama-3.3-70b-versatile` (system/user 프롬프트 분리로 품질 개선)
- AI 문제 생성: Groq 70B 업그레이드
- **결정 기록**: 처음엔 `llama-3.1-8b-instant` (빠르고 RPD 14,400)를 썼으나 품질이 낮아 70B로 전환. 무료 한도는 1,000 RPD이지만 학교 사용량에선 충분하다고 판단.

### 예제 페이지 input() 지원 `3f7a96d`
- Skulpt의 `inputfun` / `inputfunTakesPrompt: true` 옵션으로 `input()` 호출 처리
- 테스트 입력값 UI 추가 (순서대로 배열에 저장, 실행 시 순서대로 소비)
- 단원 6(함수), 7(리스트), 8(문자열) 예제 코드 추가

### 미션 testCases 다중 입력 검증 `2082b36`
- 미션 19, 20이 `input()` 을 사용하는 문제라 단일 실행으로 검증 불가
- `testCases` 배열 구조로 변경: 입력값 배열마다 기대 출력값 매핑
- Skulpt 실행을 testCase 수만큼 반복, 전부 통과해야 accepted

### 튜토리얼 빈칸 입력 버그 수정 `5834044` 포함
- **버그**: 퀘스트 1-2 이후 모든 빈칸 입력이 동작 안 함
- **원인**: `renderCode()` 의 map 루프 내 `onChange` 화살표 함수가 `blankIdx` 변수를 lazy capture → 이벤트 발생 시점에 루프가 끝나 있어 항상 마지막 인덱스를 참조
- **해결**: `const currentIdx = blankIdx` 를 입력 엘리먼트 생성 직전에 선언, 클로저 내부에서 `currentIdx` 사용

---

## 2026-05-16 (Day 3)

### 단원별 추가문제 관리 `7334991`
- 선생님이 AI로 생성한 문제를 단원에 연결
- 교사: 문제 삭제 / 단원 이동 기능
- 학생 대시보드에 "선생님이 추가한 문제" 섹션 노출
- 학습 페이지에서 단원별 추가문제 개수 배지 표시

### AI 채팅 힌트 UI `2f87d30`
- 기존 버튼 클릭 → 힌트 텍스트 표시 방식에서 **소크라테스식 대화 UI** 로 전환
- 채팅 말풍선, 사용자/AI 구분, 스크롤 자동 이동
- 힌트 횟수에 따라 점수 차감: 힌트 0개=100점, 1개=80점, 2개=60점, 3개=40점

### Gemini → Groq Fallback `33ae063`
- Gemini 429 (할당량 초과) 시 Groq로 자동 전환
- 교사 Gemini 키 → 환경변수 Groq → 환경변수 Gemini 순서로 우선순위 적용

---

## 2026-05-15 (Day 2)

### AI 문제 생성기 `8011c1a`
- 교사가 주제/레벨 선택 → Gemini/Groq가 Python 문제 자동 생성
- JSON mode로 파싱 안정화, 마크다운 코드블록 제거 후처리
- 생성된 문제 프리뷰 후 Supabase 저장

### 교사 API 키 관리 `dba0734`
- 교사 프로필에 개인 Gemini API 키 등록
- 키가 있으면 교사 키 우선 사용, 없으면 환경변수 Groq로 fallback
- 프로필 페이지에 할당량 실시간 확인 버튼

### 내비게이션 개편 `70c998f`
- 공통 Nav 바 (학생/교사 역할에 따라 메뉴 분기)
- 우클릭 방지 (코드 복사 방지 정책)
- 1920px 최적화 레이아웃

---

## 2026-05-13 (Day 1)

### 게임형 튜토리얼 `706a3e4`
- 스토리: "슬기로운 방송부 생활" — 이야기 맥락 속에서 Python 입문
- 퀘스트 구조: 스토리 설명 → 빈칸 채우기 → 코드 실행 → 다음 퀘스트
- 4개 챕터, 1,450 XP 설계

---

## 2026-05-12 (Day 0 — 초기 구축)

### 초기 커밋 `d675562`
- **기술 스택 결정**:
  - Next.js 14 App Router (서버/클라이언트 컴포넌트 분리)
  - Supabase (Auth + PostgreSQL + RLS)
  - Skulpt.js (브라우저 내 Python 실행, 서버리스 환경에서 subprocess 불가)
  - Tailwind CSS (빠른 프로토타이핑)
  - Vercel (Next.js 최적화 배포)

### 핵심 DB 스키마
```sql
profiles      -- id, name, role(student/teacher), class_id
classes       -- id, name, teacher_id, invite_code
mission_logs  -- student_id, mission_id, score, passed, hints_used
custom_missions -- teacher_id, unit_id, title, code_template, answer, level
```

### 주요 설계 결정
| 결정 | 이유 |
|------|------|
| Skulpt.js로 Python 실행 | Vercel 서버리스에서 subprocess/docker 불가 |
| Groq 무료 tier 사용 | Gemini 무료 tier 대비 더 안정적인 할당량 |
| 점수 = 100 - 20×힌트수 | 힌트 안 쓰는 자기주도 학습 유도 |
| RLS 적용 | 학생이 다른 학생 데이터 접근 방지 |

---

## 알려진 이슈 / 기술 부채

| 항목 | 내용 | 우선순위 |
|------|------|----------|
| 예제/연습 XP DB 미저장 | 세션 새로고침 시 초기화 | 낮음 |
| Lottie 작가명 미확인 | IMAGE_SOURCES.md 참조, 직접 확인 필요 | 낮음 |
| 파비콘/OG 이미지 미설정 | 공유 시 미리보기 없음 | 중간 |
| 교사 추가문제 수정 불가 | 삭제만 가능, 수정 UI 없음 | 중간 |
| 학생별 상세 페이지 없음 | 교사 대시보드에서 학생 클릭 시 상세 없음 | 중간 |

---

*마지막 업데이트: 2026-05-16*
