export interface Profile {
  id: string
  email: string
  name: string
  role: 'student' | 'teacher'
  class_id: string | null
  created_at: string
}

export interface Class {
  id: string
  name: string
  teacher_id: string
  invite_code: string
  created_at: string
}

export interface MissionLog {
  id: string
  student_id: string
  mission_id: number
  passed: boolean
  hints_used: number
  score: number
  attempts: number
  code: string
  created_at: string
}

export interface WeeklyRanking {
  student_id: string
  name: string
  total_score: number
  missions_passed: number
  avg_hints: number
  rank: number
}

export interface StudentProgress {
  mission_id: number
  passed: boolean
  hints_used: number
  score: number
  attempts: number
}
