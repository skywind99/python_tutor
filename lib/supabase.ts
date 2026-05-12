import { createBrowserClient } from '@supabase/ssr'

// 브라우저용 Supabase 클라이언트
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 타입 정의
export type Teacher = {
  id: string
  email: string
  name: string
  school: string | null
  created_at: string
}

export type Student = {
  id: string
  class_id: string | null
  email: string
  name: string
  score: number
  xp: number
  level: number
  streak: number
  gem_count: number
  last_login: string | null
  created_at: string
}

export type Class = {
  id: string
  teacher_id: string
  name: string
  invite_code: string
  created_at: string
}

export type MissionLog = {
  id: string
  student_id: string
  mission_id: number
  mission_title: string
  hints_used: number
  attempts: number
  score: number
  gems_earned: number
  passed: boolean
  time_spent_sec: number | null
  created_at: string
}

export type ClassRanking = {
  id: string
  name: string
  class_id: string
  score: number
  level: number
  streak: number
  gem_count: number
  rank: number
  missions_passed: number
  avg_hints: number
}
