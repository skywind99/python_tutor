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

const MISSION_PROMPT = (concept: string, difficulty: string, context: string | undefined) =>
  `너는 고등학교 파이썬 교육 전문가야. 다음 JSON 형식으로만 답해줘. 다른 말 하지 마.

요청: 개념=${concept}, 난이도=${difficulty}(1기초2응용3심화), 테마=${context || '없음'}

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

function parseJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 응답 파싱 실패. 다시 시도해주세요.')
  return JSON.parse(match[0])
}

export async function POST(req: NextRequest) {
  try {
    const { concept, difficulty, context, unitId, userId } = await req.json()
    const prompt = MISSION_PROMPT(concept, difficulty, context)

    // 교사 키 조회 (Gemini 우선, 실패하면 Groq로 자동 전환)
    if (userId) {
      const { geminiKey, groqKey } = await getTeacherKeys(userId)
      if (geminiKey) {
        try {
          const genAI = new GoogleGenerativeAI(geminiKey)
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
          const result = await model.generateContent(prompt)
          const mission = parseJson(result.response.text())
          mission.id = Date.now(); mission.unitId = unitId || 6; mission.level = Number(difficulty)
          return NextResponse.json({ mission, provider: 'gemini' })
        } catch {
          // Gemini 실패 시 Groq로 fallback
        }
      }
      if (groqKey) {
        const groq = new Groq({ apiKey: groqKey })
        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
        })
        const mission = parseJson(completion.choices[0].message.content || '')
        mission.id = Date.now(); mission.unitId = unitId || 6; mission.level = Number(difficulty)
        return NextResponse.json({ mission, provider: 'groq' })
      }
    }

    return NextResponse.json({ error: 'AI 키가 없어요. 내 정보 페이지에서 Gemini 또는 Groq 키를 등록해주세요.' }, { status: 503 })
  } catch (err: any) {
    console.error('generate-mission error:', err)
    if (err?.status === 429) return NextResponse.json({ error: 'AI 요청 한도 초과. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    return NextResponse.json({ error: err?.message || '오류가 발생했어요. 다시 시도해주세요.' }, { status: 500 })
  }
}
