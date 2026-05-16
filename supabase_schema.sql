-- 실행 순서대로 Supabase SQL Editor에 붙여넣기

-- 1. profiles (자동으로 auth.users와 연동)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  role text not null default 'student' check (role in ('student','teacher')),
  class_id uuid references classes(id),
  streak_days int default 0,
  last_active date,
  created_at timestamptz default now()
);

-- 2. classes (반)
create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references profiles(id) on delete cascade,
  invite_code text unique default substring(md5(random()::text),1,6),
  created_at timestamptz default now()
);

-- 3. mission_logs (미션 수행 기록)
create table mission_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  mission_id int not null,
  passed boolean default false,
  hints_used int default 0,
  score int default 0,
  attempts int default 1,
  code text,
  created_at timestamptz default now(),
  unique(student_id, mission_id)
);

-- 4. 자동으로 profile 생성 트리거
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 5. RLS 정책
alter table profiles enable row level security;
alter table classes enable row level security;
alter table mission_logs enable row level security;

-- profiles: 본인만 읽기/쓰기, 교사는 같은 반 학생 읽기
create policy "본인 프로필 접근" on profiles for all using (auth.uid() = id);
create policy "교사가 학생 읽기" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'teacher')
);

-- classes: 교사만 생성, 모두 읽기
create policy "classes 읽기" on classes for select using (true);
create policy "교사 classes 관리" on classes for all using (teacher_id = auth.uid());

-- mission_logs: 본인 것만, 교사는 반 학생 것 읽기
create policy "본인 로그 접근" on mission_logs for all using (student_id = auth.uid());
create policy "교사 로그 읽기" on mission_logs for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'teacher')
);

-- 6. xp_logs (예제/연습 XP 기록)
create table xp_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  source_id text not null,  -- 'ex-{unitId}-{index}' 또는 'guided-{unitId}-{index}'
  xp int not null default 0,
  created_at timestamptz default now(),
  unique(student_id, source_id)
);

alter table xp_logs enable row level security;
create policy "본인 xp_logs 접근" on xp_logs for all using (student_id = auth.uid());
create policy "교사 xp_logs 읽기" on xp_logs for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'teacher')
);

-- ※ 기존 DB에 추가할 경우 아래 SQL만 실행:
-- CREATE TABLE IF NOT EXISTS xp_logs ( ... ) -- 위 정의 참고
-- profiles에 school 컬럼 추가:
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS school text;

-- 7. 주간 랭킹 뷰
create or replace view weekly_ranking as
select
  p.id as student_id,
  p.name,
  p.class_id,
  coalesce(sum(ml.score), 0) as total_score,
  count(ml.id) filter (where ml.passed) as missions_passed,
  coalesce(avg(ml.hints_used), 0) as avg_hints,
  rank() over (partition by p.class_id order by sum(ml.score) desc) as rank
from profiles p
left join mission_logs ml on ml.student_id = p.id
  and ml.created_at >= date_trunc('week', now())
where p.role = 'student'
group by p.id, p.name, p.class_id;
