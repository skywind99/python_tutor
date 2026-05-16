import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!key) return NextResponse.json({ error: 'DB 연결 오류' }, { status: 500 })

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { userId, mission } = await req.json()
    if (!userId || !mission) return NextResponse.json({ error: '필수 값 누락' }, { status: 400 })

    // 교사 정보 조회
    const { data: prof } = await sb.from('profiles').select('role, class_id').eq('id', userId).single()
    if (prof?.role !== 'teacher') return NextResponse.json({ error: '교사만 문제를 저장할 수 있어요.' }, { status: 403 })

    // class_id는 교사가 소속된 반 (classes 테이블에서 teacher_id로 조회)
    const { data: cls } = await sb.from('classes').select('id').eq('teacher_id', userId).single()

    const { data, error } = await sb.from('custom_missions').insert({
      teacher_id: userId,
      class_id: cls?.id || null,
      title: mission.title,
      topic: mission.topic,
      description: mission.description,
      template: mission.template,
      expected_output: mission.expectedOutput,
      level: mission.level || 2,
      tags: mission.tags || [],
      hints: mission.hints || [],
      needs_input: mission.needsInput || false,
      default_input: mission.defaultInput || '',
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '저장 실패' }, { status: 500 })
  }
}
