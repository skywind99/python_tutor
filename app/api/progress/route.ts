import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { missionId, passed, hintsUsed, score, code, attempts } = await req.json()

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cs: {name:string;value:string;options?:any}[]) { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 기존 기록 확인
    const { data: existing } = await supabase
      .from('mission_logs')
      .select('id, score, attempts')
      .eq('student_id', user.id)
      .eq('mission_id', missionId)
      .single()

    if (existing) {
      // 기존 기록보다 점수 높으면 업데이트
      const updateData: any = { attempts: attempts != null ? Math.max(attempts, existing.attempts || 0) : (existing.attempts || 0) + 1 }
      if (score > existing.score) {
        updateData.score = score
        updateData.hints_used = hintsUsed
        updateData.code = code
        updateData.passed = passed
      }
      const { error } = await supabase
        .from('mission_logs')
        .update(updateData)
        .eq('id', existing.id)
      if (error) throw error
    } else {
      // 새 기록 생성
      const { error } = await supabase
        .from('mission_logs')
        .insert({
          student_id: user.id,
          mission_id: missionId,
          passed, hints_used: hintsUsed, score, code, attempts: 1
        })
      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Progress save error:', err)
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cs: {name:string;value:string;options?:any}[]) { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: logs } = await supabase
      .from('mission_logs')
      .select('mission_id, passed, hints_used, score, attempts')
      .eq('student_id', user.id)

    return NextResponse.json({ logs: logs || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
