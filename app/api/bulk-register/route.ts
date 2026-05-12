import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { students, classId } = await req.json()
    // students: [{name, email}]

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceKey || !url) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY가 필요해요. Vercel 환경변수에 추가해주세요.' }, { status: 500 })
    }

    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const results = []
    const defaultPassword = 'python1234'

    for (const student of students) {
      try {
        // 사용자 생성
        const { data, error } = await adminClient.auth.admin.createUser({
          email: student.email,
          password: defaultPassword,
          email_confirm: true,
          user_metadata: { name: student.name, role: 'student' }
        })

        if (error) {
          results.push({ ...student, success: false, error: error.message })
          continue
        }

        // 반 배정
        if (data.user && classId) {
          await adminClient.from('profiles')
            .update({ class_id: classId, name: student.name })
            .eq('id', data.user.id)
        }

        results.push({ ...student, success: true, password: defaultPassword })
      } catch (e: any) {
        results.push({ ...student, success: false, error: e.message })
      }
    }

    return NextResponse.json({ results })
  } catch (err) {
    return NextResponse.json({ error: '오류가 발생했어요.' }, { status: 500 })
  }
}
