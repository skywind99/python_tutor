import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

function getAuthClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

    const cookieStore = await cookies()
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

    const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).single()
    if (prof?.role !== 'teacher') return NextResponse.json({ error: '교사만 삭제할 수 있어요' }, { status: 403 })

    const adminSb = getAuthClient()
    const { error } = await adminSb.from('custom_missions').delete().eq('id', id).eq('teacher_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

    const cookieStore = await cookies()
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

    const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).single()
    if (prof?.role !== 'teacher') return NextResponse.json({ error: '교사만 수정할 수 있어요' }, { status: 403 })

    const body = await req.json()
    const adminSb = getAuthClient()

    // unitId만 있으면 단원 이동, 나머지 필드가 있으면 전체 수정
    const updatePayload: Record<string, any> = {}
    if ('unitId' in body) updatePayload.unit_id = body.unitId ?? null
    if ('title' in body) updatePayload.title = body.title
    if ('topic' in body) updatePayload.topic = body.topic
    if ('description' in body) updatePayload.description = body.description
    if ('expectedOutput' in body) updatePayload.expected_output = body.expectedOutput
    if ('level' in body) updatePayload.level = body.level
    if ('hints' in body) updatePayload.hints = body.hints

    const { error } = await adminSb.from('custom_missions')
      .update(updatePayload)
      .eq('id', id)
      .eq('teacher_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
