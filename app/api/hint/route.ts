import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: NextRequest) {
  try {
    const { missionTitle, missionDesc, code, hintLevel, previousHints, errorMsg } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 })

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const levelInstructions = {
      1: `[힌트 1단계 - 방향 암시]
- 핵심 개념이 뭔지만 살짝 암시해줘
- 질문 형식으로 학생이 스스로 생각하게 해
- 예: "반복문을 쓰면 어떨까? 몇 번 반복해야 할지 생각해봐 🤔"
- 절대 코드 보여주지 마`,

      2: `[힌트 2단계 - 구체적 안내]
- 어떤 함수/문법을 써야 하는지 명확히 언급해
- 학생 코드에서 뭐가 문제인지 짚어줘 (있다면)
- 예시 없이 설명만으로 안내해
- 응원 한마디 꼭 넣어줘 💪`,

      3: `[힌트 3단계 - 구조 제시]
- 코드 뼈대를 빈칸(___) 형태로 보여줘
- 학생이 빈칸만 채우면 되도록
- 예:
  for i in range(___):
      if ___ % 2 == 0:
          print(___)
- "거의 다 왔어!" 같은 격려 포함`
    }

    const codeAnalysis = code && code.trim().length > 10
      ? `\n학생이 작성한 코드:\n\`\`\`python\n${code}\n\`\`\``
      : '\n학생이 아직 코드를 작성하지 않았어.'

    const errorContext = errorMsg
      ? `\n실행했더니 이런 오류가 났어: ${errorMsg}\n오류도 함께 설명해줘.`
      : ''

    const prevContext = previousHints && previousHints.length > 0
      ? `\n이미 준 힌트들:\n${previousHints.map((h: string, i: number) => `${i+1}단계: ${h}`).join('\n')}\n이걸 참고해서 더 구체적으로 안내해.`
      : ''

    const prompt = `너는 유능하고 친절한 고등학교 파이썬 튜터야.
절대 완성된 정답 코드를 통째로 주지 마.
한국어로 답하고, 이모지를 2-3개 적절히 써서 친근하게.

문제: ${missionTitle}
${missionDesc}
${codeAnalysis}
${errorContext}
${prevContext}

${levelInstructions[hintLevel as 1|2|3]}

추가 규칙:
- 학생 코드가 있으면 잘 된 부분은 칭찬해줘
- 학생 수준에 맞게 어렵지 않게 설명해
- 5문장 이내로 간결하게
- 마지막엔 "할 수 있어! 도전해봐 💪" 같은 응원으로 끝내`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return NextResponse.json({ hint: text })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: '힌트를 불러오지 못했어요. 잠시 후 다시 시도해주세요.' }, { status: 500 })
  }
}
