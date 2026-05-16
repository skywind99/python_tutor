import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ missions: [] })

    const { data: prof } = await sb.from('profiles').select('class_id, role').eq('id', user.id).single()

    let classId = prof?.class_id

    // 교사인 경우 자신의 반 ID 조회
    if (prof?.role === 'teacher') {
      const { data: cls } = await sb.from('classes').select('id').eq('teacher_id', user.id).single()
      classId = cls?.id
    }

    if (!classId) return NextResponse.json({ missions: [] })

    const { data: missions } = await sb.from('custom_missions')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false })

    return NextResponse.json({ missions: missions || [] })
  } catch {
    return NextResponse.json({ missions: [] })
  }
}
