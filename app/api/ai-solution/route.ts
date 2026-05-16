import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

async function getTeacherKeys(userId: string) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) return { geminiKey: null, groqKey: null }
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const { data } = await sb.from('profiles').select('gemini_key, groq_key, class_id, role').eq('id', userId).single()
  if (data?.gemini_key || data?.groq_key) {
    return { geminiKey: data.gemini_key as string | null, groqKey: data.groq_key as string | null }
  }
  if (data?.class_id) {
    const { data: cls } = await sb.from('classes').select('teacher_id').eq('id', data.class_id).single()
    if (cls?.teacher_id) {
      const { data: teacher } = await sb.from('profiles').select('gemini_key, groq_key').eq('id', cls.teacher_id).single()
      if (teacher) return { geminiKey: teacher.gemini_key as string | null, groqKey: teacher.groq_key as string | null }
    }
  }
  return { geminiKey: null, groqKey: null }
}

const buildPrompt = (title: string, description: string, expectedOutput: string, tags?: string[]) =>
  `다음 파이썬 문제의 모범 풀이 코드를 작성해줘. 코드만 작성하고, 각 줄에 간단한 한국어 주석을 달아줘.

문제: ${title}
${description}

예상 출력:
${expectedOutput}

사용 개념: ${tags?.join(', ') || ''}

조건:
- 깔끔하고 이해하기 쉬운 코드로 작성
- 모든 줄에 한국어 주석 달기
- 파이썬 기초 문법만 사용 (고급 기법 X)
- 코드 블록 없이 순수 코드만 출력`

function clean(text: string) {
  return text.replace(/```python/g, '').replace(/```/g, '').trim()
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, expectedOutput, tags, userId } = await req.json()
    const prompt = buildPrompt(title, description, expectedOutput, tags)

    // 환경변수 fallback 키
    const envGemini = process.env.GEMINI_API_KEY || null
    const envGroq = process.env.GROQ_API_KEY || null

    let geminiKey = envGemini
    let groqKey = envGroq

    if (userId) {
      const keys = await getTeacherKeys(userId)
      if (keys.geminiKey) geminiKey = keys.geminiKey
      if (keys.groqKey) groqKey = keys.groqKey
    }

    // 1. Gemini 시도
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        const result = await model.generateContent(prompt)
        return NextResponse.json({ solution: clean(result.response.text()), provider: 'gemini' })
      } catch (e: any) {
        console.warn('[ai-solution] Gemini 실패, Groq으로 폴백:', e?.message)
      }
    }

    // 2. Groq 폴백
    if (groqKey) {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0.3,
        }),
      })
      if (groqRes.status === 429) return NextResponse.json({ error: 'AI 요청 한도 초과. 잠시 후 다시 시도해주세요.' }, { status: 429 })
      if (!groqRes.ok) return NextResponse.json({ error: `Groq 오류: ${groqRes.status}` }, { status: 500 })
      const data = await groqRes.json()
      const solution = clean(data.choices?.[0]?.message?.content || '')
      return NextResponse.json({ solution, provider: 'groq' })
    }

    return NextResponse.json({ error: 'API 키를 먼저 등록해주세요. (내 정보 → Gemini 또는 Groq 키)' }, { status: 503 })
  } catch (err: any) {
    console.error('[ai-solution]', err)
    return NextResponse.json({ error: err?.message || '풀이 생성에 실패했어요.' }, { status: 500 })
  }
}
