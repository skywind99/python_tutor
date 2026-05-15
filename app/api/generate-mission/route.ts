import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

async function getApiKey(userId: string): Promise<string | null> {
  // 서비스 키 사용 (RLS 우회, anon키도 RLS 꺼져있으면 됨)
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) return null
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const { data } = await sb.from('profiles').select('gemini_key, class_id').eq('id', userId).single()
  if (data?.gemini_key) return data.gemini_key

  // 학생이면 담당 교사 키 조회
  if (data?.class_id) {
    const { data: cls } = await sb.from('classes').select('teacher_id').eq('id', data.class_id).single()
    if (cls?.teacher_id) {
      const { data: teacher } = await sb.from('profiles').select('gemini_key').eq('id', cls.teacher_id).single()
      if (teacher?.gemini_key) return teacher.gemini_key
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { concept, difficulty, context, unitId, userId } = await req.json()

    let apiKey = process.env.GEMINI_API_KEY || null
    if (userId) {
      const teacherKey = await getApiKey(userId)
      if (teacherKey) apiKey = teacherKey
    }

    if (!apiKey) {
      return NextResponse.json({
        error: 'Gemini API 키가 없어요. 내 정보 페이지에서 키를 먼저 등록해주세요.'
      }, { status: 503 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

    const prompt = `너는 고등학교 파이썬 교육 전문가야. 다음 JSON 형식으로만 답해줘. 다른 말 하지 마.

요청: 개념=${concept}, 난이도=${difficulty}(1기초2응용3심화), 테마=${context||'없음'}

{
  "title": "재미있는 미션 제목",
  "topic": "핵심 개념",
  "description": "학생에게 친근한 문제 설명 (줄바꿈은\\n)",
  "template": "# 주석 포함 코드 템플릿 (줄바꿈은\\n)",
  "expectedOutput": "정확한 예상 출력",
  "tags": ["태그1", "태그2"],
  "needsInput": false,
  "defaultInput": "",
  "hints": ["1단계: 개념 암시", "2단계: 문법 언급", "3단계: 구조 일부"]
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'AI 응답 파싱 실패. 다시 시도해주세요.' }, { status: 500 })
    const mission = JSON.parse(jsonMatch[0])
    mission.id = Date.now(); mission.unitId = unitId || 6; mission.level = Number(difficulty)
    return NextResponse.json({ mission })
  } catch (err: any) {
    console.error('generate-mission error:', err)
    if (err?.status === 429) return NextResponse.json({ error: 'AI 일일 한도 초과. 내일 다시 시도하거나 API 키를 확인해주세요.' }, { status: 429 })
    return NextResponse.json({ error: err?.message || '오류가 발생했어요. 다시 시도해주세요.' }, { status: 500 })
  }
}
