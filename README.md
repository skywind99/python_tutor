# 파이썬 학습실 🐍💎

AI 힌트 기반 파이썬 자기주도 학습 플랫폼

## 시작하기

### 1. 의존성 설치
```bash
npm install
# 또는
yarn install
```

### 2. Supabase 설정
1. https://app.supabase.com 에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 전체 실행
3. Project Settings → API 에서 URL과 anon key 복사

### 3. 환경변수 설정
`.env.local.example` 을 `.env.local` 로 복사 후 값 채우기:
```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. 개발 서버 실행
```bash
npm run dev
```

http://localhost:3000 에서 확인

### 5. Vercel 배포
```bash
npm install -g vercel
vercel
```
환경변수는 Vercel 대시보드 → Settings → Environment Variables 에서 추가

---

## 주요 파일 구조

```
app/
  (auth)/login/       로그인/회원가입
  (student)/home/     학생 홈 (미션 목록)
  (student)/learn/    단원별 학습 + 미션
  (teacher)/dashboard 교사 대시보드
  api/hint/           Claude AI 힌트 API
components/
  GemVault.tsx        보석 금고 컴포넌트
lib/
  supabase.ts         DB 클라이언트 + 타입
  missions.ts         미션 데이터 (15개)
supabase/
  schema.sql          DB 스키마 (Supabase에서 실행)
```

## 미션 구성 (15개)

| 미션 | 제목 | 레벨 | 단원 |
|------|------|------|------|
| 1 | 안녕, 파이썬! | 기초 | 1 |
| 2 | 사칙연산 | 기초 | 1 |
| 3 | 홀짝 판별기 | 응용 | 2 |
| 4 | 구구단 3단 | 응용 | 3 |
| 5 | 369 게임 | 심화 | 3 |
| 6 | 별 삼각형 | 기초 | 3 |
| 7 | 가위바위보 | 응용 | 2 |
| 8 | 로또 번호 | 응용 | 3 |
| 9 | 소수 탐정 | 응용 | 3 |
| 10 | BMI 계산기 | 응용 | 2 |
| 11 | 피보나치 | 심화 | 4 |
| 12 | 시저 암호 | 심화 | 4 |
| 13 | 구구단 전체표 | 심화 | 3 |
| 14 | 숫자 맞추기 | 응용 | 3 |
| 15 | 콜라츠 추측 | 심화 | 4 |
