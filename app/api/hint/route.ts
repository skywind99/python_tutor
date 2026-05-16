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

function buildPrompt(
  missionTitle: string,
  missionDesc: string,
  code: string,
  studentMessage: string,
  chatHistory: { role: string; content: string }[],
  errorMsg?: string,
) {
  const codeCtx = code?.trim().length > 5
    ? `\n학생 코드:\n\`\`\`python\n${code}\n\`\`\``
    : '\n(학생이 아직 코드를 작성하지 않았음)'
  const errorCtx = errorMsg ? `\n실행 오류: ${errorMsg}` : ''
  const historyCtx = chatHistory.length > 0
    ? '\n\n이전 대화:\n' + chatHistory.map(m => `${m.role === 'ai' ? 'AI' : '학생'}: ${m.content}`).join('\n')
    : ''
  const msgCtx = studentMessage?.trim()
    ? `\n\n학생 메시지: "${studentMessage}"`
    : '\n\n학생이 도움을 요청함 (특별한 질문 없음)'

  return `너는 친근한 고등학교 파이썬 튜터야. 소크라테스식으로 가르쳐 — 절대 완성 코드 주지 마.
한국어로, 이모지 1-2개, 3-4문장 이내. 학생 코드가 있으면 구체적으로 언급해.
대화처럼 자연스럽게, 학생이 스스로 생각하도록 질문으로 유도해.

문제: ${missionTitle}
${missionDesc}
${codeCtx}${errorCtx}${historyCtx}${msgCtx}

지금 학생 상황에 딱 맞는 개인화된 피드백을 줘. 힌트 번호 붙이지 마. 마지막엔 생각을 유도하는 질문으로 끝내.`
}

export async function POST(req: NextRequest) {
  try {
    const { missionTitle, missionDesc, code, studentMessage, chatHistory = [], errorMsg, userId } = await req.json()

    const prompt = buildPrompt(missionTitle, missionDesc, code, studentMessage, chatHistory, errorMsg)

    if (userId) {
      const { geminiKey, groqKey } = await getTeacherKeys(userId)
      if (geminiKey) {
        try {
          const genAI = new GoogleGenerativeAI(geminiKey)
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
          const result = await model.generateContent(prompt)
          return NextResponse.json({ hint: result.response.text(), provider: 'gemini' })
        } catch {
          // Gemini 실패 시 Groq로 fallback
        }
      }
      if (groqKey) {
        const groq = new Groq({ apiKey: groqKey })
        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
        })
        return NextResponse.json({ hint: completion.choices[0].message.content || '', provider: 'groq' })
      }
    }

    return NextResponse.json({ error: '담당 선생님이 API 키를 아직 등록하지 않으셨어요.', needsKey: true }, { status: 503 })
  } catch (err: any) {
    if (err?.status === 429) return NextResponse.json({ error: 'AI 요청 한도 초과. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    return NextResponse.json({ error: '힌트를 불러오지 못했어요.' }, { status: 500 })
  }
}
