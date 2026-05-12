-- =============================================
-- 파이썬 학습 플랫폼 DB 스키마
-- Supabase SQL Editor에 붙여넣기
-- =============================================

-- 교사 테이블
create table teachers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  school text,
  created_at timestamptz default now()
);

-- 반(클래스) 테이블
create table classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references teachers(id) on delete cascade,
  name text not null,       -- 예: "1학년 3반"
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);

-- 학생 테이블
create table students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete set null,
  email text unique not null,
  name text not null,
  score integer default 0,
  xp integer default 0,
  level integer default 1,
  streak integer default 0,
  last_login date,
  gem_count integer default 0,
  created_at timestamptz default now()
);

-- 미션 로그 테이블
create table mission_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  mission_id integer not null,
  mission_title text not null,
  hints_used integer default 0,
  attempts integer default 1,
  score integer not null,
  gems_earned integer default 0,
  passed boolean default false,
  time_spent_sec integer,
  created_at timestamptz default now()
);

-- 힌트 로그 테이블 (힌트 내용 저장)
create table hint_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  mission_id integer not null,
  hint_level integer not null,  -- 1, 2, 3
  hint_text text not null,
  created_at timestamptz default now()
);

-- 뱃지 테이블
create table badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  badge_type text not null,  -- 'no_hint', 'speed', 'streak_7', 'master', ...
  mission_id integer,
  earned_at timestamptz default now()
);

-- 일별 출석 테이블
create table attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  date date not null default current_date,
  unique(student_id, date)
);

-- =============================================
-- RLS (Row Level Security) 설정
-- =============================================
alter table teachers enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table mission_logs enable row level security;
alter table hint_logs enable row level security;
alter table badges enable row level security;
alter table attendance enable row level security;

-- 학생은 본인 데이터만 읽기/쓰기
create policy "students_own" on students
  for all using (auth.uid() = id);

-- 교사는 본인 반 학생 데이터 읽기
create policy "teacher_read_students" on students
  for select using (
    class_id in (
      select id from classes where teacher_id = auth.uid()
    )
  );

-- mission_logs: 본인 것만
create policy "own_mission_logs" on mission_logs
  for all using (student_id = auth.uid());

-- 교사는 반 학생 미션 로그 읽기
create policy "teacher_read_mission_logs" on mission_logs
  for select using (
    student_id in (
      select s.id from students s
      join classes c on s.class_id = c.id
      where c.teacher_id = auth.uid()
    )
  );

-- =============================================
-- 점수 계산 함수
-- =============================================
create or replace function calc_score(
  hints integer,
  level integer  -- 1=기초, 2=응용, 3=심화
) returns integer as $$
declare
  base integer := 100;
  hint_penalty integer;
  level_multi float;
begin
  hint_penalty := case hints
    when 0 then 50   -- 보너스 +50
    when 1 then 0
    when 2 then -20
    else -40
  end;

  level_multi := case level
    when 1 then 1.0
    when 2 then 1.2
    else 1.5
  end;

  return round((base + hint_penalty) * level_multi);
end;
$$ language plpgsql;

-- =============================================
-- 랭킹 뷰
-- =============================================
create or replace view class_ranking as
  select
    s.id,
    s.name,
    s.class_id,
    s.score,
    s.level,
    s.streak,
    s.gem_count,
    rank() over (partition by s.class_id order by s.score desc) as rank,
    count(ml.id) filter (where ml.passed) as missions_passed,
    avg(ml.hints_used) filter (where ml.passed) as avg_hints
  from students s
  left join mission_logs ml on ml.student_id = s.id
  group by s.id, s.name, s.class_id, s.score, s.level, s.streak, s.gem_count;
