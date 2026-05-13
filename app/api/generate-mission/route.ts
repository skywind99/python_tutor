import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { concept, difficulty, context, unitId, userId } = await req.json()

    // 교사 본인의 키 조회
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

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API 키를 먼저 등록해주세요.' }, { status: 503 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const prompt = `너는 고등학교 파이썬 교육 전문가야. 다음 JSON 형식으로만 답해줘. 다른 말 하지 마.

요청: 개념=${concept}, 난이도=${difficulty}(1기초2응용3심화), 테마=${context||'없음'}

{
  "title": "재미있는 미션 제목",
  "topic": "핵심 개념",
  "description": "학생에게 친근한 문제 설명 (줄바꿈은 \\n)",
  "template": "# 주석 포함 코드 템플릿 (줄바꿈은 \\n)",
  "expectedOutput": "정확한 예상 출력",
  "tags": ["태그1", "태그2"],
  "needsInput": false,
  "defaultInput": "",
  "hints": ["1단계: 개념 암시", "2단계: 문법 언급", "3단계: 구조 일부"]
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: '생성 실패' }, { status: 500 })
    const mission = JSON.parse(jsonMatch[0])
    mission.id = Date.now(); mission.unitId = unitId || 6; mission.level = Number(difficulty)
    return NextResponse.json({ mission })
  } catch (err) {
    return NextResponse.json({ error: '오류 발생' }, { status: 500 })
  }
}
