import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key!, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

    const sb = getAdminClient()
    const { data: prof } = await sb.from('profiles')
      .select('groq_key, groq_remaining_requests, groq_limit_requests, groq_remaining_tokens, groq_limit_tokens, groq_quota_updated_at, gemini_key, gemini_requests_today, gemini_tokens_today, gemini_usage_date, gemini_quota_updated_at')
      .eq('id', userId)
      .single()

    if (!prof?.groq_key && !prof?.gemini_key) {
      return NextResponse.json({ error: 'API 키가 등록되지 않았어요.' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]
    const geminiData = prof.gemini_key ? {
      requestsToday: prof.gemini_usage_date === today ? (prof.gemini_requests_today || 0) : 0,
      tokensToday: prof.gemini_usage_date === today ? (prof.gemini_tokens_today || 0) : 0,
      limitRequests: 1500,
      updatedAt: prof.gemini_quota_updated_at,
    } : null

    // Groq 저장된 quota가 있으면 바로 반환 (API 소모 없음)
    if (prof.groq_remaining_requests !== null && prof.groq_remaining_requests !== undefined) {
      return NextResponse.json({
        groq: {
          remainingRequests: prof.groq_remaining_requests,
          limitRequests: prof.groq_limit_requests ?? -1,
          remainingTokens: prof.groq_remaining_tokens ?? -1,
          limitTokens: prof.groq_limit_tokens ?? -1,
          updatedAt: prof.groq_quota_updated_at,
        },
        gemini: geminiData,
        fromCache: true,
      })
    }

    // Gemini만 있는 경우 (Groq 없음) 바로 반환
    if (!prof.groq_key && geminiData) {
      return NextResponse.json({ gemini: geminiData, fromCache: true })
    }

    // 저장된 값 없을 때만 실제 API 호출로 초기화
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${prof.groq_key}`, 'Content-Type': 'application/json' },
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

    const remReq = Number(res.headers.get('x-ratelimit-remaining-requests') ?? -1)
    const limReq = Number(res.headers.get('x-ratelimit-limit-requests') ?? -1)
    const remTok = Number(res.headers.get('x-ratelimit-remaining-tokens') ?? -1)
    const limTok = Number(res.headers.get('x-ratelimit-limit-tokens') ?? -1)
    const now = new Date().toISOString()

    // 초기값 저장
    await sb.from('profiles').update({
      groq_remaining_requests: remReq,
      groq_limit_requests: limReq,
      groq_remaining_tokens: remTok,
      groq_limit_tokens: limTok,
      groq_quota_updated_at: now,
    }).eq('id', userId)

    return NextResponse.json({
      groq: {
        remainingRequests: remReq,
        limitRequests: limReq,
        remainingTokens: remTok,
        limitTokens: limTok,
        updatedAt: now,
      },
      gemini: geminiData,
      fromCache: false,
    })
  } catch (err: any) {
    return NextResponse.json({ error: '확인 중 오류가 발생했어요.' }, { status: 500 })
  }
}
