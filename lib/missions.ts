// 미션 데이터 정의
export type Mission = {
  id: number
  title: string
  level: 1 | 2 | 3      // 기초 / 응용 / 심화
  unit: number           // 단원 번호
  topic: string
  icon: string           // Tabler icon name
  description: string
  template: string
  expectedOutput: string
  tags: string[]
  needsInput: boolean
  defaultInput?: string
  hints: [string, string, string]  // 3단계 힌트
}

export const MISSIONS: Mission[] = [
  {
    id: 1,
    title: '안녕, 파이썬!',
    level: 1,
    unit: 1,
    topic: '출력 (print)',
    icon: 'ti-terminal-2',
    description: `print() 함수를 사용해서 다음 두 줄을 정확히 출력하세요.

Hello, Python!
파이썬 학습 시작!`,
    template: `# print() 함수를 사용해보세요\n\n`,
    expectedOutput: 'Hello, Python!\n파이썬 학습 시작!',
    tags: ['print'],
    needsInput: false,
    hints: [
      '💡 print() 안에 따옴표로 감싼 내용을 넣으면 출력돼요. 두 줄을 출력하려면 몇 번 써야 할까요?',
      '🔍 print("Hello, Python!") 처럼 작성해요. 두 번째 줄도 같은 방식으로요.',
      '✏️ 두 번 쓰기:\nprint("Hello, Python!")\nprint("파이썬 학습 시작!")',
    ],
  },
  {
    id: 2,
    title: '사칙연산',
    level: 1,
    unit: 1,
    topic: '변수 · 연산자',
    icon: 'ti-calculator',
    description: `a = 10, b = 3 을 선언하고 연산 결과를 출력하세요.

합: 13
차: 7
곱: 30
몫: 3
나머지: 1`,
    template: `a = 10\nb = 3\n\n# 연산 결과를 출력하세요\n`,
    expectedOutput: '합: 13\n차: 7\n곱: 30\n몫: 3\n나머지: 1',
    tags: ['변수', '+', '-', '*', '//', '%'],
    needsInput: false,
    hints: [
      '💡 덧셈 +, 뺄셈 -, 곱셈 *, 정수나눗셈 //, 나머지 % 를 사용해요.',
      '🔍 print("합:", a+b) 처럼 문자열과 결과를 함께 출력해요.',
      '✏️ 구조:\nprint("합:", a+b)\nprint("차:", a-b)\nprint("곱:", a*b)\nprint("몫:", a//b)\nprint("나머지:", a%b)',
    ],
  },
  {
    id: 3,
    title: '홀짝 판별기',
    level: 2,
    unit: 2,
    topic: '조건문 (if/else)',
    icon: 'ti-git-branch',
    description: `숫자를 입력받아 홀수인지 짝수인지 판별하세요.

입력: 7 → 출력: 7은 홀수입니다.
입력: 4 → 출력: 4는 짝수입니다.`,
    template: `n = int(input("숫자를 입력하세요: "))\n\n# 홀짝 판별 코드를 작성하세요\n`,
    expectedOutput: '7은 홀수입니다.',
    tags: ['if', 'else', '%', 'input'],
    needsInput: true,
    defaultInput: '7',
    hints: [
      '💡 2로 나눈 나머지가 0이면 짝수, 1이면 홀수예요. 나머지 연산자는 % 예요.',
      '🔍 if n % 2 == 0: 이 조건이면 짝수예요. else: 로 홀수를 처리해요.',
      '✏️ 구조:\nif n % 2 == 0:\n    print(str(n)+"는 짝수입니다.")\nelse:\n    print(str(n)+"은 홀수입니다.")',
    ],
  },
  {
    id: 4,
    title: '구구단 3단',
    level: 2,
    unit: 3,
    topic: 'for 반복문',
    icon: 'ti-refresh',
    description: `for문과 range()를 사용해서 3단 구구단을 출력하세요.

3 x 1 = 3
3 x 2 = 6
...
3 x 9 = 27`,
    template: `dan = 3\n\n# for문으로 구구단을 출력하세요\n`,
    expectedOutput: '3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27',
    tags: ['for', 'range'],
    needsInput: false,
    hints: [
      '💡 for i in range(1, 10): 으로 1부터 9까지 반복해요.',
      '🔍 반복문 안에서 dan * i 가 각 단의 결과예요.',
      '✏️ 구조:\nfor i in range(1, 10):\n    print(str(dan)+" x "+str(i)+" = "+str(dan*i))',
    ],
  },
  {
    id: 5,
    title: '369 게임',
    level: 3,
    unit: 3,
    topic: 'while · break · continue',
    icon: 'ti-flame',
    description: `1~30 369 게임 프로그램을 만드세요.
3, 6, 9가 포함된 숫자 → "짝" 출력
나머지 → 숫자 출력

⚠️ str() 사용 금지
⚠️ while True / break / continue 필수`,
    template: `i = 0\nwhile True:\n    i += 1\n\n    # 1. 종료 조건 (break)\n    \n\n    # 2. 일의 자리 계산\n    \n\n    # 3. 369 판별 (continue)\n    \n\n    # 4. 숫자 출력\n    print(i)\n`,
    expectedOutput: '1\n2\n짝\n4\n5\n짝\n7\n8\n짝\n10\n11\n12\n짝\n14\n15\n짝\n17\n18\n짝\n20\n21\n22\n짝\n24\n25\n짝\n27\n28\n짝\n짝',
    tags: ['while', 'break', 'continue', '%'],
    needsInput: false,
    hints: [
      '💡 break 조건부터요. i가 30보다 크면 멈춰야 해요.',
      '🔍 일의 자리는 i % 10으로 구해요. 30은 예외 처리 필요해요.',
      '✏️ 핵심:\nif i > 30: break\none = i % 10\nif one==3 or one==6 or one==9 or i==30:\n    print("짝")\n    continue\nprint(i)',
    ],
  },
  {
    id: 6,
    title: '별 삼각형',
    level: 1,
    unit: 3,
    topic: '중첩 for문',
    icon: 'ti-triangle',
    description: `for문으로 별 삼각형을 출력하세요.

*
**
***
****
*****`,
    template: `# for문으로 별 삼각형을 출력하세요\n`,
    expectedOutput: '*\n**\n***\n****\n*****',
    tags: ['for', 'range', '*연산자'],
    needsInput: false,
    hints: [
      '💡 range(1, 6) 으로 1부터 5까지 반복해요.',
      '🔍 "*" * i 는 * 를 i개 반복한 문자열이에요.',
      '✏️ 구조:\nfor i in range(1, 6):\n    print("*" * i)',
    ],
  },
  {
    id: 7,
    title: '가위바위보',
    level: 2,
    unit: 2,
    topic: 'random · if/elif',
    icon: 'ti-hand-rock',
    description: `컴퓨터와 가위바위보를 해보세요!
입력(가위/바위/보)에 따라 승패를 출력하세요.

입력: 바위
출력 예시:
컴퓨터: 가위
결과: 이겼습니다!`,
    template: `import random\n\nchoices = ["가위", "바위", "보"]\ncomputer = random.choice(choices)\nmy = input("가위/바위/보 중 선택하세요: ")\n\nprint("컴퓨터:", computer)\n# 승패 판별 코드를 작성하세요\n`,
    expectedOutput: '컴퓨터: 가위\n결과: 이겼습니다!',
    tags: ['random', 'if/elif', 'input'],
    needsInput: true,
    defaultInput: '바위',
    hints: [
      '💡 컴퓨터 선택이 "가위"로 고정됩니다(테스트용). 내가 "바위"를 냈을 때 이기는 조건을 생각해봐요.',
      '🔍 my == computer 이면 무승부, 특정 조합이면 승리/패배예요.',
      '✏️ 구조:\nif my == computer:\n    print("결과: 무승부!")\nelif (my=="바위" and computer=="가위") or ...:\n    print("결과: 이겼습니다!")\nelse:\n    print("결과: 졌습니다!")',
    ],
  },
  {
    id: 8,
    title: '로또 번호',
    level: 2,
    unit: 3,
    topic: 'random · 리스트',
    icon: 'ti-ticket',
    description: `1~45 중 6개를 랜덤으로 뽑아 오름차순으로 출력하세요.

출력 예시:
로또 번호: [3, 12, 24, 33, 38, 45]`,
    template: `import random\n\n# 1~45 중 6개를 뽑아 정렬 후 출력하세요\n`,
    expectedOutput: '로또 번호: [3, 12, 24, 33, 38, 45]',
    tags: ['random', 'list', 'sort'],
    needsInput: false,
    hints: [
      '💡 random.sample(범위, 개수) 로 중복 없이 뽑을 수 있어요.',
      '🔍 random.sample(range(1,46), 6) 으로 6개를 뽑고, sort()로 정렬해요.',
      '✏️ 구조:\nnums = random.sample(range(1, 46), 6)\nnums.sort()\nprint("로또 번호:", nums)',
    ],
  },
  {
    id: 9,
    title: '소수 탐정',
    level: 2,
    unit: 3,
    topic: '중첩 for · 조건문',
    icon: 'ti-search',
    description: `2부터 30 사이의 소수를 모두 출력하세요.

2 3 5 7 11 13 17 19 23 29`,
    template: `# 2~30 사이 소수를 찾아 출력하세요\n`,
    expectedOutput: '2 3 5 7 11 13 17 19 23 29',
    tags: ['for', 'range', '%', 'flag'],
    needsInput: false,
    hints: [
      '💡 소수는 1과 자기 자신만으로 나누어지는 수예요. 2부터 n-1까지 나눠봐요.',
      '🔍 is_prime = True 로 시작하고, 나누어 떨어지면 False로 바꿔요.',
      '✏️ 구조:\nresult = []\nfor n in range(2, 31):\n    is_prime = True\n    for i in range(2, n):\n        if n % i == 0:\n            is_prime = False\n            break\n    if is_prime:\n        result.append(str(n))\nprint(" ".join(result))',
    ],
  },
  {
    id: 10,
    title: 'BMI 계산기',
    level: 2,
    unit: 2,
    topic: 'input · 조건문',
    icon: 'ti-heart-rate-monitor',
    description: `키(cm)와 몸무게(kg)를 입력받아 BMI를 계산하고 체형을 출력하세요.

입력: 170 65
BMI: 22.5
판정: 정상`,
    template: `height = float(input("키(cm): "))\nweight = float(input("몸무게(kg): "))\n\n# BMI = 몸무게 / (키/100)^2\n# 판정: 18.5 미만=저체중, 18.5~25=정상, 25~30=과체중, 30이상=비만\n`,
    expectedOutput: 'BMI: 22.5\n판정: 정상',
    tags: ['input', 'float', '**', 'if/elif'],
    needsInput: true,
    defaultInput: '170,65',
    hints: [
      '💡 키를 미터로 변환해야 해요. 170cm → 1.70m (170/100)',
      '🔍 bmi = weight / (height/100) ** 2 로 계산하고, round(bmi, 1) 로 소수점 처리해요.',
      '✏️ 구조:\nbmi = weight / (height/100)**2\nprint("BMI:", round(bmi, 1))\nif bmi < 18.5:\n    print("판정: 저체중")\nelif bmi < 25:\n    print("판정: 정상")\n...',
    ],
  },
  {
    id: 11,
    title: '피보나치 수열',
    level: 3,
    unit: 4,
    topic: 'while · 변수 교환',
    icon: 'ti-spiral',
    description: `피보나치 수열의 첫 10개를 출력하세요.
(앞의 두 수를 더한 값이 다음 수가 되는 수열)

0 1 1 2 3 5 8 13 21 34`,
    template: `# 피보나치 수열 첫 10개를 출력하세요\na, b = 0, 1\n`,
    expectedOutput: '0 1 1 2 3 5 8 13 21 34',
    tags: ['while', '변수교환', 'list'],
    needsInput: false,
    hints: [
      '💡 a, b = 0, 1 에서 시작해요. 다음 수는 a+b 예요.',
      '🔍 a, b = b, a+b 로 동시에 갱신해요. 이게 핵심이에요!',
      '✏️ 구조:\nresult = []\nfor _ in range(10):\n    result.append(str(a))\n    a, b = b, a+b\nprint(" ".join(result))',
    ],
  },
  {
    id: 12,
    title: '시저 암호',
    level: 3,
    unit: 4,
    topic: '문자열 · ord/chr',
    icon: 'ti-lock',
    description: `알파벳을 3칸씩 밀어 암호화하세요. (스파이 미션!)

입력: hello
출력: khoor`,
    template: `text = input("암호화할 텍스트: ").lower()\nshift = 3\nresult = ""\n\n# 각 글자를 3칸 뒤로 밀어 암호화하세요\n`,
    expectedOutput: 'khoor',
    tags: ['ord', 'chr', 'for', '%26'],
    needsInput: true,
    defaultInput: 'hello',
    hints: [
      '💡 ord("a") = 97, chr(97) = "a" 예요. 알파벳을 숫자로 바꿔서 더할 수 있어요.',
      '🔍 ord(c) - ord("a") 로 0~25 사이 숫자를 얻고, shift 더한 뒤 % 26 으로 범위를 맞춰요.',
      '✏️ 구조:\nfor c in text:\n    if c.isalpha():\n        shifted = (ord(c) - ord("a") + shift) % 26\n        result += chr(shifted + ord("a"))\n    else:\n        result += c\nprint(result)',
    ],
  },
  {
    id: 13,
    title: '구구단 전체표',
    level: 3,
    unit: 3,
    topic: '중첩 for · 출력 포맷',
    icon: 'ti-table',
    description: `2단부터 9단까지 전체 구구단을 출력하세요.

2 x 1 = 2   3 x 1 = 3   ...
2 x 2 = 4   3 x 2 = 6   ...`,
    template: `# 중첩 for문으로 구구단 전체 표를 출력하세요\n`,
    expectedOutput: '2 x 1 = 2\t3 x 1 = 3\t4 x 1 = 4\t5 x 1 = 5\t6 x 1 = 6\t7 x 1 = 7\t8 x 1 = 8\t9 x 1 = 9',
    tags: ['중첩for', 'range', 'end', 'join'],
    needsInput: false,
    hints: [
      '💡 바깥 for는 줄(1~9), 안쪽 for는 단(2~9)을 반복해요.',
      '🔍 print(내용, end="\\t") 로 탭 간격을 줄 수 있어요.',
      '✏️ 구조:\nfor i in range(1, 10):\n    for d in range(2, 10):\n        print(str(d)+" x "+str(i)+" = "+str(d*i), end="\\t")\n    print()',
    ],
  },
  {
    id: 14,
    title: '숫자 맞추기',
    level: 2,
    unit: 3,
    topic: 'while · random · 힌트',
    icon: 'ti-question-mark',
    description: `1~100 사이 랜덤 숫자를 맞추는 게임!
"너무 커요" / "너무 작아요" 힌트를 주세요.

입력: 50 → 너무 작아요
입력: 75 → 너무 커요
입력: 62 → 정답!`,
    template: `import random\n\nanswer = random.randint(1, 100)\n# while 반복으로 맞출 때까지 도전하세요\n`,
    expectedOutput: '너무 작아요\n너무 커요\n정답!',
    tags: ['random', 'while', 'input', 'if/elif'],
    needsInput: true,
    defaultInput: '50,75,62',
    hints: [
      '💡 answer를 50으로 고정하고 테스트해요(테스트용). while True 로 반복해요.',
      '🔍 guess = int(input("숫자를 입력하세요: ")) 로 입력받고 answer와 비교해요.',
      '✏️ 구조:\nwhile True:\n    guess = int(input("숫자: "))\n    if guess == answer:\n        print("정답!")\n        break\n    elif guess < answer:\n        print("너무 작아요")\n    else:\n        print("너무 커요")',
    ],
  },
  {
    id: 15,
    title: '콜라츠 추측',
    level: 3,
    unit: 4,
    topic: 'while · 수학 미스터리',
    icon: 'ti-infinity',
    description: `어떤 수든 결국 1이 된다는 미해결 수학 문제!
짝수면 2로 나누고, 홀수면 3배+1을 반복하세요.

입력: 6
출력:
6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1
총 8번 만에 1 도달!`,
    template: `n = int(input("시작 숫자: "))\nresult = [str(n)]\ncount = 0\n\n# n이 1이 될 때까지 반복하세요\n`,
    expectedOutput: '6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1\n총 8번 만에 1 도달!',
    tags: ['while', '%2', 'list', 'join'],
    needsInput: true,
    defaultInput: '6',
    hints: [
      '💡 n이 짝수면 n//2, 홀수면 n*3+1 을 반복해요. n==1이 되면 종료해요.',
      '🔍 각 단계를 result 리스트에 추가하고, " → ".join(result) 로 출력해요.',
      '✏️ 구조:\nwhile n != 1:\n    if n % 2 == 0:\n        n = n // 2\n    else:\n        n = n * 3 + 1\n    result.append(str(n))\n    count += 1\nprint(" → ".join(result))\nprint("총 "+str(count)+"번 만에 1 도달!")',
    ],
  },
]

// 단원 정의
export const UNITS = [
  { id: 1, title: '출력과 변수', missions: [1, 2], icon: 'ti-terminal-2', color: '#0F6E56' },
  { id: 2, title: '조건문',      missions: [3, 7, 10], icon: 'ti-git-branch', color: '#185FA5' },
  { id: 3, title: '반복문',      missions: [4, 5, 6, 8, 9, 13, 14], icon: 'ti-refresh', color: '#993C1D' },
  { id: 4, title: '심화 도전',   missions: [11, 12, 15], icon: 'ti-flame', color: '#854F0B' },
]

// 점수 계산
export function calcScore(hintsUsed: number, level: 1 | 2 | 3): number {
  const base = 100
  const hintBonus = hintsUsed === 0 ? 50 : hintsUsed === 1 ? 0 : hintsUsed === 2 ? -20 : -40
  const levelMult = level === 1 ? 1.0 : level === 2 ? 1.2 : 1.5
  return Math.round((base + hintBonus) * levelMult)
}

export function calcGems(hintsUsed: number): number {
  return hintsUsed === 0 ? 15 : hintsUsed === 1 ? 10 : hintsUsed === 2 ? 7 : 5
}
