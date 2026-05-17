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

const SYSTEM_PROMPT = `너는 한국 고등학생을 위한 파이썬 AI 튜터야.

[언어 규칙 - 절대 최우선]
- 반드시 한국어만 써. 한자·중국어·일본어는 단 한 글자도 쓰지 마. (这, 的, は, が 절대 금지)
- 변수명·함수명 같은 코드 식별자만 영어 가능.

[말투]
- 친근한 구어체 반말. 이모지 1~2개.
- 4~5문장 이내로 짧게.

[★ 오류 발생 시 - 다른 무엇보다 먼저 처리]
[오류 메시지] 항목이 있으면 반드시 이 순서로 답해:
1. 오류 종류를 한국어로 설명해 (예: SyntaxError → "문법 오류", NameError → "변수 이름 오류", IndentationError → "들여쓰기 오류", TypeError → "타입 오류", ZeroDivisionError → "0으로 나누기 오류")
2. 코드에서 오류가 난 줄을 직접 짚어줘 (예: "3번째 줄 `for i in range` 부분이 문제야")
3. 왜 오류가 났는지 한 문장으로 설명해
4. 어떻게 고치면 되는지 방향만 알려줘 (정답 코드 전체는 주지 마)

[단계적 힌트 - 오류 없을 때]
- 1번 막힌 경우: 방향만 알려주고 질문으로 끝내.
- 2번 막힌 경우: 코드 구조를 구체적으로 알려줘. 핵심 부분은 ___ 로 빈칸 힌트 줘도 돼.
- 3번 이상 막힌 경우: 거의 다 알려줘. 마지막 한 줄만 직접 채우게 해.

[항상 지킬 것]
- 이전 대화에서 한 말 그대로 반복 금지. 매번 더 구체적으로.
- 완성된 정답 코드 전체 제공 금지.`

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
  if (errorMsg) {
    // 오류 종류 자동 분류
    const errType =
      errorMsg.includes('SyntaxError') ? '문법 오류(SyntaxError)' :
      errorMsg.includes('IndentationError') ? '들여쓰기 오류(IndentationError)' :
      errorMsg.includes('NameError') ? '변수 이름 오류(NameError)' :
      errorMsg.includes('TypeError') ? '타입 오류(TypeError)' :
      errorMsg.includes('ZeroDivisionError') ? '0으로 나누기 오류(ZeroDivisionError)' :
      errorMsg.includes('IndexError') ? '인덱스 오류(IndexError)' :
      errorMsg.includes('KeyError') ? '키 오류(KeyError)' :
      errorMsg.includes('ValueError') ? '값 오류(ValueError)' :
      errorMsg.includes('AttributeError') ? '속성 오류(AttributeError)' : '실행 오류'
    parts.push(`[오류 발생 - 반드시 이것부터 설명해]\n오류 종류: ${errType}\n오류 내용: ${errorMsg}`)
  }
  if (chatHistory.length > 0) {
    const hist = chatHistory.slice(-8).map(m => `${m.role === 'ai' ? 'AI튜터' : '학생'}: ${m.content}`).join('\n')
    parts.push(`[이전 대화]\n${hist}`)

    // 학생이 막힌 횟수 감지
    const stuckKeywords = ['모르겠', '틀린거', '분석해줘', '어떻게', '뭐가']
    const stuckCount = chatHistory
      .filter(m => m.role === 'student')
      .filter(m => stuckKeywords.some(k => m.content.includes(k))).length
    if (stuckCount >= 3) {
      parts.push(`[상황] 이 학생은 ${stuckCount}번 막혀 있어. 이번엔 거의 다 알려줘도 돼. 마지막 한 줄만 직접 채우게 해.`)
    } else if (stuckCount >= 2) {
      parts.push(`[상황] 이 학생이 ${stuckCount}번 막혔어. 코드 구조를 더 구체적으로 알려줘.`)
    }
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
