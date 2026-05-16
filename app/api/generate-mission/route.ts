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

const DIFFICULTY_GUIDE: Record<string, string> = {
  '1': '기초: 개념 1개만 사용, 5줄 이내 정답, input() 없음',
  '2': '응용: 개념 2-3개 조합, 10줄 이내 정답, 조건/반복 포함 가능',
  '3': '심화: 알고리즘 사고 필요, 중첩 구조 허용, 창의적 문제',
}

const MISSION_PROMPT = (concept: string, difficulty: string, context: string | undefined) =>
  `너는 고등학교 파이썬 교육 전문가야. 아래 규칙을 반드시 지켜서 JSON만 출력해.

## 요청
- 개념: ${concept}
- 난이도: ${difficulty}단계 (${DIFFICULTY_GUIDE[difficulty] || DIFFICULTY_GUIDE['2']})
- 테마/맥락: ${context || '자유'}

## 필수 규칙
1. expectedOutput은 파이썬으로 실제 실행했을 때 나오는 정확한 출력이어야 함 (공백/줄바꿈 포함)
2. template는 학생이 채울 빈 코드. 리스트/변수는 이미 선언해서 넣어줌. # TODO 주석으로 작성 위치 표시
3. description 작성 규칙:
   - needsInput이 false인 경우: "입력:" 표현 절대 쓰지 마. 대신 "주어진 코드:", "아래 리스트를 활용해" 식으로 작성
   - needsInput이 true인 경우에만 "입력 예시:" 사용 가능
   - 줄바꿈은 \\n으로
4. hints[0]은 방향만, hints[1]은 문법 언급, hints[2]는 코드 구조 일부
5. needsInput이 true면 defaultInput에 테스트용 입력값 작성 (단순값, 리스트 아님)
6. 절대 한국어 변수명 사용 금지
7. 리스트/딕셔너리 문제는 반드시 needsInput: false로, 데이터를 template에 하드코딩

## 출력 형식 (JSON만, 다른 말 없이)
{
  "title": "짧고 흥미로운 제목",
  "topic": "${concept}",
  "description": "문제 설명\\n\\n예시:\\n입력: xxx\\n출력: yyy",
  "template": "# TODO: 여기에 코드를 작성하세요\\n",
  "expectedOutput": "정확한 출력 (공백/줄바꿈 그대로)",
  "tags": ["${concept}"],
  "needsInput": false,
  "defaultInput": "",
  "hints": ["방향 암시 질문", "사용할 문법/함수 언급", "코드 뼈대 일부"]
}`

function parseJson(text: string) {
  // 마크다운 코드블록 제거
  const cleaned = text.replace(/```(?:json)?\n?/g, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
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
          response_format: { type: 'json_object' },
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
