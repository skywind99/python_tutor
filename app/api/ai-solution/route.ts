import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { title, description, expectedOutput, tags, userId } = await req.json()

    let apiKey = process.env.GEMINI_API_KEY || null

    if (userId) {
      const cookieStore = await cookies()
      const sb = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
      )
      const { data: teacher } = await sb.from('profiles').select('gemini_key').eq('id', userId).single()
      if (teacher?.gemini_key) apiKey = teacher.gemini_key
    }

    if (!apiKey) return NextResponse.json({ error: 'API 키를 먼저 등록해주세요.' }, { status: 503 })

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `다음 파이썬 문제의 모범 풀이 코드를 작성해줘. 코드만 작성하고, 각 줄에 간단한 한국어 주석을 달아줘.

문제: ${title}
${description}

예상 출력:
${expectedOutput}

사용 개념: ${tags?.join(', ')}

조건:
- 깔끔하고 이해하기 쉬운 코드로 작성
- 모든 줄에 한국어 주석 달기
- 파이썬 기초 문법만 사용 (고급 기법 X)
- 코드 블록 없이 순수 코드만 출력`

    const result = await model.generateContent(prompt)
    const solution = result.response.text()
      .replace(/```python/g, '').replace(/```/g, '').trim()

    return NextResponse.json({ solution })
  } catch (err) {
    return NextResponse.json({ error: '풀이 생성에 실패했어요.' }, { status: 500 })
  }
}
