import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import { createClient } from '@supabase/supabase-js'

type TeacherKeys = { geminiKey: string | null; groqKey: string | null }

async function getTeacherKeys(userId: string): Promise<TeacherKeys> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) return { geminiKey: null, groqKey: null }
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const { data } = await sb.from('profiles').select('gemini_key, groq_key, class_id').eq('id', userId).single()
  if (data?.gemini_key || data?.groq_key) return { geminiKey: data.gemini_key, groqKey: data.groq_key }
  if (data?.class_id) {
    const { data: cls } = await sb.from('classes').select('teacher_id').eq('id', data.class_id).single()
    if (cls?.teacher_id) {
      const { data: teacher } = await sb.from('profiles').select('gemini_key, groq_key').eq('id', cls.teacher_id).single()
      if (teacher) return { geminiKey: teacher.gemini_key, groqKey: teacher.groq_key }
    }
  }
  return { geminiKey: null, groqKey: null }
}

export async function POST(req: NextRequest) {
  try {
    const { missionTitle, missionDesc, code, hintLevel, previousHints, errorMsg, userId } = await req.json()

    const levelInstructions: Record<number, string> = {
      1: '방향만 살짝 암시해줘. 질문 형식으로. 절대 코드 보여주지 마.',
      2: '어떤 함수/문법을 써야 하는지 구체적으로 언급해. 학생 코드 문제점을 짚어줘.',
      3: '코드 뼈대를 ___ 형태로 보여줘. 거의 다 왔다고 격려해.',
    }

    const codeCtx = code?.trim().length > 5
      ? `\n학생 코드:\n\`\`\`python\n${code}\n\`\`\``
      : '\n(학생이 아직 코드를 작성하지 않았음)'

    const errorCtx = errorMsg ? `\n실행 오류: ${errorMsg}` : ''
    const prevCtx = previousHints?.length
      ? `\n이전 힌트:\n${previousHints.map((h: string, i: number) => `${i + 1}단계: ${h}`).join('\n')}`
      : ''

    const prompt = `너는 고등학교 파이썬 튜터야. 절대 완성 코드 주지 마. 한국어로, 이모지 2-3개, 4문장 이내.
학생마다 다른 상황에 맞게 개인화된 힌트를 줘. 학생 코드가 있으면 그 코드를 구체적으로 언급해.

문제: ${missionTitle}
${missionDesc}
${codeCtx}${errorCtx}${prevCtx}

힌트 ${hintLevel}단계: ${levelInstructions[hintLevel] || levelInstructions[1]}

마지막에 응원으로 끝내. 답변을 매번 다양하게 해줘.`

    // 교사 키 조회 (Gemini 우선, 없으면 Groq)
    if (userId) {
      const { geminiKey, groqKey } = await getTeacherKeys(userId)
      if (geminiKey) {
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
        const result = await model.generateContent(prompt)
        return NextResponse.json({ hint: result.response.text(), provider: 'gemini' })
      }
      if (groqKey) {
        const groq = new Groq({ apiKey: groqKey })
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
        })
        return NextResponse.json({ hint: completion.choices[0].message.content || '', provider: 'groq' })
      }
    }

    return NextResponse.json({ error: '담당 선생님이 API 키를 아직 등록하지 않으셨어요.', needsKey: true }, { status: 503 })
  } catch (err: any) {
    if (err?.status === 429) return NextResponse.json({ error: 'AI 힌트 일일 한도 초과. 내일 다시 시도해주세요.' }, { status: 429 })
    return NextResponse.json({ error: '힌트를 불러오지 못했어요.' }, { status: 500 })
  }
}
