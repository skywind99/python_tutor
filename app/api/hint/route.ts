import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  try {
    const { missionTitle, missionDesc, code, hintLevel } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const levelGuide = [
      '개념과 방향만 살짝 암시해줘. 매우 짧게.',
      '관련 문법이나 함수를 구체적으로 언급해줘.',
      '코드 구조 일부를 빈칸 형태로 보여줘.',
    ]

    const prompt = `너는 친절한 파이썬 학습 튜터야. 고등학생이 파이썬을 배우고 있어.
절대 완성된 정답 코드를 주지 마.
이모지 1-2개 사용해서 친근하게 답해줘.
한국어로, 3-4문장 이내로 짧게 답해줘.
힌트 단계 ${hintLevel}/3: ${levelGuide[hintLevel - 1]}

문제: ${missionTitle}
${missionDesc}

학생 코드:
\`\`\`python
${code || '(아직 코드 없음)'}
\`\`\`

힌트 ${hintLevel}단계 주세요.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return NextResponse.json({ hint: text })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '힌트를 불러오지 못했어요.' }, { status: 500 })
  }
}
