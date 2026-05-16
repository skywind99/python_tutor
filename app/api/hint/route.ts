import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

type TeacherKeys = { geminiKey: string | null; groqKey: string | null; teacherId: string | null }

async function getTeacherKeys(userId: string): Promise<TeacherKeys> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) return { geminiKey: null, groqKey: null, teacherId: null }
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const { data } = await sb.from('profiles').select('gemini_key, groq_key, class_id').eq('id', userId).single()
  if (data?.gemini_key || data?.groq_key) {
    return { geminiKey: data.gemini_key, groqKey: data.groq_key, teacherId: userId }
  }
  if (data?.class_id) {
    const { data: cls } = await sb.from('classes').select('teacher_id').eq('id', data.class_id).single()
    if (cls?.teacher_id) {
      const { data: teacher } = await sb.from('profiles').select('gemini_key, groq_key').eq('id', cls.teacher_id).single()
      if (teacher) return { geminiKey: teacher.gemini_key, groqKey: teacher.groq_key, teacherId: cls.teacher_id }
    }
  }
  return { geminiKey: null, groqKey: null, teacherId: null }
}

async function saveGroqQuota(teacherId: string, headers: Headers) {
  const remReq = headers.get('x-ratelimit-remaining-requests')
  const limReq = headers.get('x-ratelimit-limit-requests')
  const remTok = headers.get('x-ratelimit-remaining-tokens')
  const limTok = headers.get('x-ratelimit-limit-tokens')
  if (remReq === null && remTok === null) return
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) return
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  await sb.from('profiles').update({
    groq_remaining_requests: remReq !== null ? Number(remReq) : undefined,
    groq_limit_requests: limReq !== null ? Number(limReq) : undefined,
    groq_remaining_tokens: remTok !== null ? Number(remTok) : undefined,
    groq_limit_tokens: limTok !== null ? Number(limTok) : undefined,
    groq_quota_updated_at: new Date().toISOString(),
  }).eq('id', teacherId)
}

const SYSTEM_PROMPT = `너는 한국 고등학생을 위한 친근한 파이썬 AI 튜터야.

[반드시 지켜야 할 규칙]
- 오직 한국어만 사용해. 한자, 영어, 일본어 절대 금지. 변수명·함수명만 영어 가능.
- 완성된 코드를 절대 알려주지 마. 스스로 생각하게 유도해.
- 짧고 명확하게: 3~4문장 이내.
- 이모지 1~2개만 자연스럽게.
- 반말로 친근하게 (해요체 아닌 구어체).
- 마지막엔 생각을 유도하는 질문 하나로 끝내.
- 코드가 있으면 구체적으로 언급해.
- 힌트 번호 매기지 마.`

function buildUserMessage(
  missionTitle: string,
  missionDesc: string,
  code: string,
  studentMessage: string,
  chatHistory: { role: string; content: string }[],
  errorMsg?: string,
): string {
  const parts: string[] = []
  parts.push(`[문제] ${missionTitle}`)
  parts.push(missionDesc.trim())
  if (code?.trim().length > 5) {
    parts.push(`[학생 코드]\n\`\`\`python\n${code.trim()}\n\`\`\``)
  } else {
    parts.push('[학생 코드] 아직 작성 안 함')
  }
  if (errorMsg) parts.push(`[오류 메시지] ${errorMsg}`)
  if (chatHistory.length > 0) {
    const hist = chatHistory.slice(-6).map(m => `${m.role === 'ai' ? 'AI튜터' : '학생'}: ${m.content}`).join('\n')
    parts.push(`[이전 대화]\n${hist}`)
  }
  parts.push(`[학생 질문] ${studentMessage?.trim() || '코드 분석해줘'}`)
  return parts.join('\n\n')
}

export async function POST(req: NextRequest) {
  try {
    const { missionTitle, missionDesc, code, studentMessage, chatHistory = [], errorMsg, userId } = await req.json()
    const userMessage = buildUserMessage(missionTitle, missionDesc, code, studentMessage, chatHistory, errorMsg)

    if (userId) {
      const { geminiKey, groqKey, teacherId } = await getTeacherKeys(userId)

      // Gemini 우선
      if (geminiKey) {
        try {
          const genAI = new GoogleGenerativeAI(geminiKey)
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite', systemInstruction: SYSTEM_PROMPT })
          const result = await model.generateContent(userMessage)
          const text = result.response.text().trim()
          return NextResponse.json({ hint: text, provider: 'gemini' })
        } catch {
          // Gemini 실패 시 Groq로 fallback
        }
      }

      // Groq — raw fetch로 rate limit 헤더 캡처
      if (groqKey) {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userMessage },
            ],
            max_tokens: 400,
            temperature: 0.7,
          }),
        })

        if (groqRes.status === 429) {
          return NextResponse.json({ error: 'AI 요청 한도 초과. 잠시 후 다시 시도해주세요.' }, { status: 429 })
        }
        if (!groqRes.ok) {
          return NextResponse.json({ error: '힌트를 불러오지 못했어요.' }, { status: 500 })
        }

        const groqData = await groqRes.json()
        const text = (groqData.choices?.[0]?.message?.content || '').trim()

        // 비동기로 quota 저장 (응답 지연 없음)
        if (teacherId) saveGroqQuota(teacherId, groqRes.headers)

        return NextResponse.json({ hint: text, provider: 'groq' })
      }
    }

    return NextResponse.json({ error: '담당 선생님이 API 키를 아직 등록하지 않으셨어요.', needsKey: true }, { status: 503 })
  } catch (err: any) {
    if (err?.status === 429) return NextResponse.json({ error: 'AI 요청 한도 초과. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    return NextResponse.json({ error: '힌트를 불러오지 못했어요.' }, { status: 500 })
  }
}
