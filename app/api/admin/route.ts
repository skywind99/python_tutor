import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234'

export async function GET(req: NextRequest) {
  const pw = req.nextUrl.searchParams.get('pw')
  if (pw !== ADMIN_PASSWORD) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const admin = getAdmin()
  const [{ data: profiles }, { data: classes }] = await Promise.all([
    admin.from('profiles').select('*, classes(name)').order('created_at', { ascending: false }),
    admin.from('classes').select('*, profiles(count)').order('created_at', { ascending: false })
  ])

  return NextResponse.json({ profiles, classes })
}

export async function PATCH(req: NextRequest) {
  const pw = req.nextUrl.searchParams.get('pw')
  if (pw !== ADMIN_PASSWORD) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { type, id, data } = await req.json()
  const admin = getAdmin()

  if (type === 'profile') {
    await admin.from('profiles').update(data).eq('id', id)
  } else if (type === 'delete_user') {
    await admin.auth.admin.deleteUser(id)
  } else if (type === 'reset_password') {
    await admin.auth.admin.updateUserById(id, { password: data.password })
  } else if (type === 'class') {
    await admin.from('classes').update(data).eq('id', id)
  } else if (type === 'delete_class') {
    // 반 소속 학생들 초기화
    await admin.from('profiles').update({ class_id: null }).eq('class_id', id)
    await admin.from('classes').delete().eq('id', id)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const pw = req.nextUrl.searchParams.get('pw')
  if (pw !== ADMIN_PASSWORD) return NextResponse.json({ error: '권한 없음' }, { status: 401 })
  const { userId } = await req.json()
  const admin = getAdmin()
  await admin.auth.admin.deleteUser(userId)
  return NextResponse.json({ ok: true })
}
