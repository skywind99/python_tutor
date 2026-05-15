# 2026-05-16 — 초기 프로젝트 현황 정리

## 개요
파이썬 자기주도 학습 플랫폼. 학생이 미션을 풀고 AI 힌트를 받으며 학습하는 구조.

## 기술 스택
- **프레임워크**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **인증/DB**: Supabase (PostgreSQL + RLS)
- **AI**: Google Gemini 1.5 Flash (힌트 생성)
- **배포**: Vercel

---

## 구현된 기능

### 학생 기능
| 경로 | 기능 |
|------|------|
| `/dashboard` | 총점 · 미션 완료수 · 반 순위 통계, 단원별 진행도 카드 |
| `/learn` | 단원 목록 (개념 → 예제 → 미션 3단계 흐름) |
| `/learn/[unitId]/concept` | 단원별 개념 설명 |
| `/learn/[unitId]/examples` | 예제 코드 실행 |
| `/learn/[unitId]/missions` | 미션 풀기 |
| `/ranking` | 반 내 주간 랭킹 |
| `/profile` | 프로필 페이지 |
| `/tutorial` | "슬기로운 방송부 생활" 게임형 튜토리얼 (4미션, 1450 XP) |

### 교사 기능
| 경로 | 기능 |
|------|------|
| `/teacher/dashboard` | 학생 현황 |
| `/teacher/students` | 학생 관리 |
| `/teacher/problems` | 문제 관리 |
| `/teacher/create-mission` | 미션 직접 생성 |

- 교사가 Gemini API 키 등록 → 반 학생 전원이 공유 사용
- 초대 코드(`invite_code`)로 학생이 반 합류

### 관리자
- `/admin` — 관리자 전용 페이지

### API 라우트
| 경로 | 역할 |
|------|------|
| `/api/hint` | Gemini AI 3단계 힌트 (학생 코드 분석 + 개인화) |
| `/api/progress` | 미션 진행도 저장 |
| `/api/bulk-register` | 학생 일괄 등록 |
| `/api/generate-mission` | AI 미션 자동 생성 |
| `/api/ai-solution` | AI 솔루션 제공 |

---

## 미션 데이터 (15개)

| 단원 | 주제 | 미션 수 |
|------|------|---------|
| 단원 1 | 출력 · 변수 · 연산자 | 2개 |
| 단원 2 | 조건문 (if/elif/else) | 3개 |
| 단원 3 | 반복문 · 리스트 · 랜덤 | 7개 |
| 단원 4 | 문자열 · 고급 알고리즘 | 3개 |

- 레벨 1 (기초) / 2 (응용) / 3 (심화)
- 미션마다 3단계 힌트 내장 + Gemini 동적 힌트 병행
- 힌트 없이 풀면 보석(점수) 더 획득

---

## DB 스키마

```
profiles        — 사용자 (student/teacher, class_id, streak_days, gemini_key)
classes         — 반 (teacher_id, invite_code)
mission_logs    — 풀이 기록 (passed, hints_used, score, attempts, code)
weekly_ranking  — 주간 랭킹 뷰 (class별 rank)
```

---

## 보상 시스템
- 미션 통과 시 보석(💎) 획득
- 힌트 사용 횟수에 따라 점수 감소
- 주간 랭킹으로 반 친구들과 경쟁

---

## 현재 상태
- Vercel 배포 완료: https://python-tutor-blue.vercel.app
- Supabase 연결 완료 (RLS 적용)
- Gemini API 연동 완료
