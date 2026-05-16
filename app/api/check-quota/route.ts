import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function getTeacherKeys(userId: string) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) return { geminiKey: null, groqKey: null }
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const { data } = await sb.from('profiles').select('gemini_key, groq_key').eq('id', userId).single()
  return { geminiKey: data?.gemini_key || null, groqKey: data?.groq_key || null }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

    const { groqKey } = await getTeacherKeys(userId)
    if (!groqKey) return NextResponse.json({ error: 'Groq 키가 등록되지 않았어요.' }, { status: 404 })

    // 최소 completion 요청으로 rate limit 헤더 읽기
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: '.' }],
        max_tokens: 1,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err?.error?.message || 'Groq 키를 확인할 수 없어요.' }, { status: res.status })
    }

    return NextResponse.json({
      groq: {
        remainingRequests: Number(res.headers.get('x-ratelimit-remaining-requests') ?? -1),
        limitRequests: Number(res.headers.get('x-ratelimit-limit-requests') ?? -1),
        remainingTokens: Number(res.headers.get('x-ratelimit-remaining-tokens') ?? -1),
        limitTokens: Number(res.headers.get('x-ratelimit-limit-tokens') ?? -1),
        resetRequests: res.headers.get('x-ratelimit-reset-requests'),
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: '확인 중 오류가 발생했어요.' }, { status: 500 })
  }
}
