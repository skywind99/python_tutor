import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getTeacherApiKey(studentId: string): Promise<string | null> {
  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  // 학생의 반 조회
  const { data: profile } = await sb
    .from('profiles')
    .select('class_id')
    .eq('id', studentId)
    .single()

  if (!profile?.class_id) return null

  // 반의 담당 교사 조회
  const { data: cls } = await sb
    .from('classes')
    .select('teacher_id')
    .eq('id', profile.class_id)
    .single()

  if (!cls?.teacher_id) return null

  // 교사의 Gemini API 키 조회
  const { data: teacher } = await sb
    .from('profiles')
    .select('gemini_key')
    .eq('id', cls.teacher_id)
    .single()

  return teacher?.gemini_key || null
}

export async function POST(req: NextRequest) {
  try {
    const { missionTitle, missionDesc, code, hintLevel, previousHints, errorMsg, userId } = await req.json()

    // API 키 우선순위: 1) 교사 키 2) 환경변수 키
    let apiKey = process.env.GEMINI_API_KEY || null

    if (userId) {
      const teacherKey = await getTeacherApiKey(userId)
      if (teacherKey) apiKey = teacherKey
    }

    if (!apiKey) {
      return NextResponse.json({
        error: '담당 선생님이 Gemini API 키를 아직 등록하지 않으셨어요. 선생님께 문의해주세요.',
        needsKey: true,
      }, { status: 503 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const levelInstructions: Record<number, string> = {
      1: `[힌트 1단계 - 방향 암시]\n- 핵심 개념이 뭔지만 살짝 암시해줘\n- 질문 형식으로 학생이 스스로 생각하게 해\n- 절대 코드 보여주지 마`,
      2: `[힌트 2단계 - 구체적 안내]\n- 어떤 함수/문법을 써야 하는지 명확히 언급해\n- 학생 코드에서 뭐가 문제인지 짚어줘\n- 응원 한마디 꼭 넣어줘 💪`,
      3: `[힌트 3단계 - 구조 제시]\n- 코드 뼈대를 빈칸(___) 형태로 보여줘\n- "거의 다 왔어!" 같은 격려 포함`,
    }

    const codeAnalysis = code?.trim().length > 10
      ? `\n학생 코드:\n\`\`\`python\n${code}\n\`\`\``
      : '\n학생이 아직 코드를 작성하지 않았어.'

    const errorContext = errorMsg ? `\n실행 오류: ${errorMsg}` : ''
    const prevContext = previousHints?.length
      ? `\n이미 준 힌트:\n${previousHints.map((h: string, i: number) => `${i+1}단계: ${h}`).join('\n')}\n더 구체적으로 안내해.`
      : ''

    const prompt = `너는 유능하고 친절한 고등학교 파이썬 튜터야.
절대 완성된 정답 코드를 주지 마. 한국어로, 이모지 2-3개, 5문장 이내.

문제: ${missionTitle}
${missionDesc}
${codeAnalysis}${errorContext}${prevContext}

${levelInstructions[hintLevel] || levelInstructions[1]}

마지막에 짧은 응원으로 끝내줘.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return NextResponse.json({ hint: text })
  } catch (err: any) {
    console.error(err)
    if (err?.status === 429) {
      return NextResponse.json({ error: '오늘 AI 힌트 한도에 도달했어요. 내일 다시 시도해주세요! (일일 한도 초과)' }, { status: 429 })
    }
    return NextResponse.json({ error: '힌트를 불러오지 못했어요. 잠시 후 다시 시도해주세요.' }, { status: 500 })
  }
}
