import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { missionId, passed, hintsUsed, score, code } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Upsert mission log (최고 점수 유지)
    const { data: existing } = await supabase
      .from('mission_logs')
      .select('score, attempts')
      .eq('student_id', user.id)
      .eq('mission_id', missionId)
      .single()

    if (existing) {
      await supabase.from('mission_logs').update({
        passed: existing.score < score ? passed : undefined,
        score: Math.max(existing.score, score),
        hints_used: existing.score < score ? hintsUsed : undefined,
        code: existing.score < score ? code : undefined,
        attempts: existing.attempts + 1,
      }).eq('student_id', user.id).eq('mission_id', missionId)
    } else {
      await supabase.from('mission_logs').insert({
        student_id: user.id,
        mission_id: missionId,
        passed, hints_used: hintsUsed, score, code, attempts: 1,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
