export type Level = 1 | 2 | 3

export interface Mission {
  id: number
  unitId: number
  title: string
  level: Level
  topic: string
  icon: string
  description: string
  template: string
  expectedOutput: string
  tags: string[]
  needsInput: boolean
  defaultInput?: string
  hints: string[]
  bonusCondition?: string
}

export const MISSIONS: Mission[] = [
  // 단원 1: 출력과 변수
  {
    id: 1, unitId: 1,
    title: "안녕, 파이썬!",
    level: 1, icon: "terminal-2", topic: "출력 (print)",
    description: `print() 함수를 사용해서 다음 두 줄을 출력하세요.\n\nHello, Python!\n파이썬 학습 시작!`,
    template: `# print() 함수를 사용해보세요\n\n`,
    expectedOutput: "Hello, Python!\n파이썬 학습 시작!",
    tags: ["print"], needsInput: false,
    hints: [
      "💡 print() 안에 따옴표로 감싼 내용을 넣으면 출력돼요. 두 줄을 출력하려면 몇 번 써야 할까요?",
      '🔍 print("Hello, Python!") 처럼 작성해요. 두 번째 줄도 같은 방식으로 작성해보세요.',
      '✏️ 두 줄 모두:\nprint("Hello, Python!")\nprint("파이썬 학습 시작!")',
    ]
  },

  // 단원 2: 연산자
  {
    id: 2, unitId: 2,
    title: "사칙연산",
    level: 1, icon: "calculator", topic: "산술 연산자",
    description: `a = 10, b = 3 선언 후 연산 결과를 출력하세요.\n\n합: 13\n차: 7\n곱: 30\n몫: 3\n나머지: 1`,
    template: `a = 10\nb = 3\n\n# 연산 결과를 출력하세요\n`,
    expectedOutput: "합: 13\n차: 7\n곱: 30\n몫: 3\n나머지: 1",
    tags: ["변수", "+", "-", "*", "//", "%"], needsInput: false,
    hints: [
      "💡 덧셈 +, 뺄셈 -, 곱셈 *, 정수 나눗셈 //, 나머지 % 를 사용해요.",
      '🔍 print("합:", a+b) 처럼 문자열과 계산을 함께 출력할 수 있어요.',
      '✏️ 구조:\nprint("합:", a+b)\nprint("차:", a-b)\nprint("곱:", a*b)\nprint("몫:", a//b)\nprint("나머지:", a%b)',
    ]
  },
  {
    id: 16, unitId: 2,
    title: "온도 변환기",
    level: 2, icon: "thermometer", topic: "산술 연산자",
    description: `섭씨(Celsius)를 화씨(Fahrenheit)로 변환해 출력하세요.\n\n공식: F = C × 9/5 + 32\n\n주어진 코드:\ncelsius = 25\n\n출력:\n25도는 화씨 77.0도입니다.`,
    template: `celsius = 25\n\n# 화씨로 변환하고 출력하세요\n# 공식: F = C * 9/5 + 32\n`,
    expectedOutput: "25도는 화씨 77.0도입니다.",
    tags: ["산술연산자", "*", "/", "+"], needsInput: false,
    hints: [
      "💡 공식 그대로 fahrenheit = celsius * 9/5 + 32 를 계산해봐요.",
      "🔍 변수에 결과를 저장하고 print()로 출력해요. 결과는 소수점이 있는 실수예요.",
      '✏️ 구조:\nfahrenheit = celsius * 9/5 + 32\nprint(str(celsius)+"도는 화씨 "+str(fahrenheit)+"도입니다.")',
    ]
  },

  // 단원 3: 입력
  {
    id: 17, unitId: 3,
    title: "나만의 인사말",
    level: 1, icon: "message-circle", topic: "input() · 문자열",
    description: `이름을 입력받아 인사말을 출력하세요.\n\n입력 예시: 홍길동\n출력:\n안녕하세요, 홍길동님!\n만나서 반가워요!`,
    template: `name = input("이름을 입력하세요: ")\n\n# 인사말을 출력하세요\n`,
    expectedOutput: "안녕하세요, 홍길동님!\n만나서 반가워요!",
    tags: ["input", "str", "print"], needsInput: true, defaultInput: "홍길동",
    hints: [
      "💡 input()으로 받은 값은 name 변수에 저장돼요. 이 변수를 출력에 활용해봐요.",
      '🔍 "안녕하세요, " + name + "님!" 처럼 문자열을 이어 붙일 수 있어요.',
      '✏️ 구조:\nprint("안녕하세요, "+name+"님!")\nprint("만나서 반가워요!")',
    ]
  },
  {
    id: 18, unitId: 3,
    title: "직사각형 계산기",
    level: 2, icon: "rectangle", topic: "input() · int() 변환",
    description: `가로와 세로를 입력받아\n넓이와 둘레를 계산해 출력하세요.\n\n입력 예시:\n가로: 5\n세로: 3\n\n출력:\n넓이: 15\n둘레: 16`,
    template: `width = int(input("가로: "))\nheight = int(input("세로: "))\n\n# 넓이와 둘레를 계산해서 출력하세요\n`,
    expectedOutput: "넓이: 15\n둘레: 16",
    tags: ["input", "int", "산술연산자"], needsInput: true, defaultInput: "5,3",
    hints: [
      "💡 넓이 = 가로 × 세로, 둘레 = (가로 + 세로) × 2 예요.",
      "🔍 area = width * height, perimeter = (width + height) * 2 로 계산해요.",
      '✏️ 구조:\narea = width * height\nperimeter = (width + height) * 2\nprint("넓이:", area)\nprint("둘레:", perimeter)',
    ]
  },

  // 단원 4: 조건문
  {
    id: 3, unitId: 4,
    title: "홀짝 판별기",
    level: 2, icon: "git-branch", topic: "조건문 (if/else)",
    description: `숫자를 입력받아 홀짝을 판별하세요.\n\n입력: 7 → 7은 홀수입니다.\n입력: 4 → 4는 짝수입니다.\n\n(테스트 입력값에 7 입력 후 실행)`,
    template: `n = int(input("숫자를 입력하세요: "))\n\n# 홀짝 판별 코드를 작성하세요\n`,
    expectedOutput: "7은 홀수입니다.",
    tags: ["if", "else", "%", "input"], needsInput: true, defaultInput: "7",
    hints: [
      "💡 2로 나눈 나머지가 0이면 짝수, 1이면 홀수예요. 나머지 연산자는 % 예요.",
      "🔍 if n % 2 == 0: 이면 짝수 조건이에요. else: 로 홀수 경우를 처리해요.",
      '✏️ 구조:\nif n % 2 == 0:\n    print(str(n)+"는 짝수입니다.")\nelse:\n    print(str(n)+"은 홀수입니다.")',
    ]
  },
  {
    id: 4, unitId: 4,
    title: "성적 등급기",
    level: 2, icon: "chart-bar", topic: "조건문 (if/elif/else)",
    description: `점수를 입력받아 등급을 출력하세요.\n\n90이상: A\n80이상: B\n70이상: C\n60이상: D\n60미만: F\n\n입력: 85 → B`,
    template: `score = int(input("점수를 입력하세요: "))\n\n# 등급 판별 코드를 작성하세요\n`,
    expectedOutput: "B",
    tags: ["if", "elif", "else", "input"], needsInput: true, defaultInput: "85",
    hints: [
      "💡 여러 조건을 순서대로 검사할 때는 elif를 사용해요.",
      "🔍 if score >= 90: 부터 시작해서 elif score >= 80: 순서로 작성해요.",
      '✏️ 구조:\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelif score >= 70:\n    print("C")',
    ]
  },

  // 단원 5: 반복문
  {
    id: 5, unitId: 5,
    title: "구구단 3단",
    level: 2, icon: "refresh", topic: "for 반복문",
    description: `for문과 range()로 3단을 출력하세요.\n\n3 x 1 = 3\n3 x 2 = 6\n...\n3 x 9 = 27`,
    template: `dan = 3\n\n# for문으로 구구단을 출력하세요\n`,
    expectedOutput: "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27",
    tags: ["for", "range"], needsInput: false,
    hints: [
      "💡 for i in range(1, 10): 으로 1부터 9까지 반복해요.",
      "🔍 반복문 안에서 dan * i 가 각 단의 결과예요.",
      '✏️ 구조:\nfor i in range(1, 10):\n    print(str(dan)+" x "+str(i)+" = "+str(dan*i))',
    ]
  },
  {
    id: 6, unitId: 5,
    title: "별 피라미드",
    level: 2, icon: "triangle", topic: "중첩 for · 문자열 반복",
    description: `for문으로 별 피라미드를 출력하세요.\n\n*\n**\n***\n****\n*****`,
    template: `n = 5\n\n# for문으로 별 피라미드를 만들어보세요\n`,
    expectedOutput: "*\n**\n***\n****\n*****",
    tags: ["for", "range", "* 연산자"], needsInput: false,
    hints: [
      "💡 for i in range(1, n+1): 로 1부터 n까지 반복해요.",
      '🔍 "*" * i 는 *을 i번 반복한 문자열이에요. "*" * 3 → "***"',
      '✏️ 구조:\nfor i in range(1, n+1):\n    print("*" * i)',
    ]
  },
  {
    id: 7, unitId: 5,
    title: "369 게임",
    level: 3, icon: "flame", topic: "while · break · continue",
    description: `1~30 369 게임을 만드세요.\n3,6,9 포함 숫자 → "짝"\n나머지 → 숫자 출력\n\n⚠️ str() 사용 금지\n⚠️ while True / break / continue 필수`,
    template: `i = 0\nwhile True:\n    i += 1\n\n    # 1. 종료 조건 (break)\n    \n\n    # 2. 일의 자리 계산\n    \n\n    # 3. 369 판별 (continue)\n    \n\n    # 4. 숫자 출력\n    print(i)\n`,
    expectedOutput: "1\n2\n짝\n4\n5\n짝\n7\n8\n짝\n10\n11\n12\n짝\n14\n15\n짝\n17\n18\n짝\n20\n21\n22\n짝\n24\n25\n짝\n27\n28\n짝\n짝",
    tags: ["while", "break", "continue", "%"], needsInput: false,
    hints: [
      "💡 break 조건부터요. i가 30보다 크면 루프를 멈춰야 해요. if i > 30: break",
      "🔍 일의 자리는 % 10으로 구해요 (예: 13%10=3). 30은 예외 처리 필요해요.",
      '✏️ 핵심 구조:\nif i > 30: break\none = i % 10\nif one==3 or one==6 or one==9 or i==30:\n    print("짝")\n    continue\nprint(i)',
    ]
  },

  // 단원 6: 함수
  {
    id: 8, unitId: 6,
    title: "계산기 함수",
    level: 2, icon: "math-function", topic: "함수 (def)",
    description: `두 수를 더하는 add() 함수를 만들고\n결과를 출력하세요.\n\nadd(3, 5) → 8\nadd(10, 20) → 30`,
    template: `# add 함수를 정의하세요\n\n\n# 함수를 호출하세요\nprint(add(3, 5))\nprint(add(10, 20))\n`,
    expectedOutput: "8\n30",
    tags: ["def", "return", "매개변수"], needsInput: false,
    hints: [
      "💡 def 함수명(매개변수): 로 함수를 정의해요. return으로 결과를 돌려줘요.",
      "🔍 def add(a, b): 로 시작하고 return a + b 로 결과를 반환해요.",
      '✏️ 구조:\ndef add(a, b):\n    return a + b',
    ]
  },

  // 단원 7: 리스트
  {
    id: 9, unitId: 7,
    title: "리스트 마스터",
    level: 2, icon: "list", topic: "리스트 · 인덱싱",
    description: `fruits 리스트에서 다음을 출력하세요.\n\nfruits = ["사과", "바나나", "포도", "딸기"]\n\n첫 번째 과일: 사과\n마지막 과일: 딸기\n과일 개수: 4`,
    template: `fruits = ["사과", "바나나", "포도", "딸기"]\n\n# 첫 번째 과일 출력\n\n# 마지막 과일 출력\n\n# 과일 개수 출력\n`,
    expectedOutput: "첫 번째 과일: 사과\n마지막 과일: 딸기\n과일 개수: 4",
    tags: ["list", "인덱스", "len"], needsInput: false,
    hints: [
      "💡 리스트의 첫 번째 요소는 인덱스 0이에요. fruits[0] 이 첫 번째예요.",
      "🔍 마지막 요소는 fruits[-1] 또는 fruits[len(fruits)-1] 로 접근해요.",
      '✏️ 구조:\nprint("첫 번째 과일:", fruits[0])\nprint("마지막 과일:", fruits[-1])\nprint("과일 개수:", len(fruits))',
    ]
  },

  // 단원 8: 심화 문제들
  {
    id: 10, unitId: 8,
    title: "가위바위보",
    level: 2, icon: "hand-stop", topic: "random · if/elif",
    description: `컴퓨터와 가위바위보!\n\n"가위", "바위", "보" 중 하나를 입력하면\n컴퓨터가 랜덤으로 선택 후 승패를 알려줘요.\n\n입력: 바위\n예시 출력:\n나: 바위 / 컴퓨터: 가위\n내가 이겼다!`,
    template: `import random\n\nchoices = ["가위", "바위", "보"]\nmy = input("가위, 바위, 보 중 하나를 입력하세요: ")\ncomputer = random.choice(choices)\n\nprint("나:", my, "/ 컴퓨터:", computer)\n\n# 승패 판별 코드를 작성하세요\n`,
    expectedOutput: "나: 바위 / 컴퓨터: 가위\n내가 이겼다!",
    tags: ["random", "if/elif", "input", "list"], needsInput: true, defaultInput: "바위",
    hints: [
      "💡 비기는 경우는 my == computer, 이기는 경우는 (가위 vs 보), (바위 vs 가위), (보 vs 바위) 3가지예요.",
      "🔍 if my == computer: 비김 / elif my == '가위' and computer == '보': 이김 으로 시작해요.",
      '✏️ 구조:\nif my == computer:\n    print("비겼다!")\nelif (my=="가위" and computer=="보") or (my=="바위" and computer=="가위") or (my=="보" and computer=="바위"):\n    print("내가 이겼다!")\nelse:\n    print("졌다...")',
    ]
  },
  {
    id: 11, unitId: 8,
    title: "소수 탐정",
    level: 2, icon: "search", topic: "중첩 for · 조건문",
    description: `2부터 30까지 소수를 모두 출력하세요.\n\n2 3 5 7 11 13 17 19 23 29`,
    template: `# 2부터 30까지 소수를 찾아 출력하세요\n# 소수: 1과 자기 자신만으로 나누어지는 수\n\n`,
    expectedOutput: "2 3 5 7 11 13 17 19 23 29",
    tags: ["for", "range", "중첩반복", "%"], needsInput: false,
    hints: [
      "💡 소수 판별: 2부터 자기 자신 전까지 나누어지면 소수가 아니에요.",
      "🔍 is_prime = True 플래그를 사용해요. 나누어지면 False로 바꾸고 break해요.",
      '✏️ 구조:\nresult = []\nfor n in range(2, 31):\n    is_prime = True\n    for i in range(2, n):\n        if n % i == 0:\n            is_prime = False\n            break\n    if is_prime:\n        result.append(str(n))\nprint(" ".join(result))',
    ]
  },
  {
    id: 12, unitId: 8,
    title: "BMI 계산기",
    level: 2, icon: "heart-rate-monitor", topic: "input · 나눗셈 · 조건문",
    description: `키(cm)와 몸무게(kg)를 입력받아\nBMI를 계산하고 체형을 출력하세요.\n\nBMI = 몸무게 / (키/100)²\n\n18.5 미만: 저체중\n23 미만: 정상\n25 미만: 과체중\n25 이상: 비만\n\n입력: 170, 65 → 정상 (BMI: 22.5)`,
    template: `height = float(input("키(cm): "))\nweight = float(input("몸무게(kg): "))\n\n# BMI 계산 및 체형 판별\n`,
    expectedOutput: "정상 (BMI: 22.5)",
    tags: ["input", "float", "**", "if/elif"], needsInput: true, defaultInput: "170,65",
    hints: [
      "💡 BMI = weight / (height/100) ** 2 으로 계산해요. ** 는 거듭제곱이에요.",
      "🔍 계산 후 round(bmi, 1) 로 소수점 1자리로 반올림해요.",
      '✏️ 구조:\nbmi = weight / (height/100)**2\nbmi = round(bmi, 1)\nif bmi < 18.5:\n    status = "저체중"\nelif bmi < 23:\n    status = "정상"\nprint(status+" (BMI: "+str(bmi)+")")',
    ]
  },
  {
    id: 13, unitId: 8,
    title: "피보나치 수열",
    level: 3, icon: "infinity", topic: "while · 변수 교환",
    description: `피보나치 수열의 첫 10개를 출력하세요.\n(앞의 두 수의 합이 다음 수)\n\n1 1 2 3 5 8 13 21 34 55`,
    template: `# 피보나치 수열 첫 10개를 출력하세요\n# 0, 1, 1, 2, 3, 5, 8, 13, 21, 34...\n\n`,
    expectedOutput: "1 1 2 3 5 8 13 21 34 55",
    tags: ["while", "변수교환", "list"], needsInput: false,
    hints: [
      "💡 a, b = 1, 1 로 시작하고, 매번 a, b = b, a+b 로 다음 수를 구해요.",
      "🔍 결과를 리스트에 담아서 마지막에 ' '.join() 으로 출력하면 돼요.",
      '✏️ 구조:\na, b = 1, 1\nresult = []\nfor i in range(10):\n    result.append(str(a))\n    a, b = b, a+b\nprint(" ".join(result))',
    ]
  },
  {
    id: 14, unitId: 8,
    title: "로또 번호 생성기",
    level: 2, icon: "ticket", topic: "random · 리스트 · 정렬",
    description: `1~45에서 6개 번호를 랜덤으로 뽑아\n오름차순으로 출력하세요.\n\n예시: 3 12 17 28 33 41\n(매번 다른 결과가 나와요!)`,
    template: `import random\n\n# 1~45에서 중복 없이 6개 뽑아서\n# 오름차순으로 출력하세요\n`,
    expectedOutput: "3 12 17 28 33 41",
    tags: ["random", "list", "sort", "range"], needsInput: false,
    hints: [
      "💡 random.sample(범위, 개수) 로 중복 없이 뽑을 수 있어요.",
      "🔍 numbers = random.sample(range(1,46), 6) 으로 6개를 뽑고 sort() 로 정렬해요.",
      '✏️ 구조:\nnumbers = random.sample(range(1, 46), 6)\nnumbers.sort()\nprint(" ".join(str(n) for n in numbers))',
    ]
  },
  {
    id: 15, unitId: 8,
    title: "시저 암호 해독기",
    level: 3, icon: "lock", topic: "문자열 · for · ord/chr",
    description: `알파벳을 3칸씩 밀어 암호화하는\n시저 암호를 구현하세요.\n\nA→D, B→E, Z→C\n\n입력: HELLO\n출력: KHOOR`,
    template: `text = input("암호화할 텍스트(대문자): ")\nshift = 3\nresult = ""\n\n# 각 문자를 3칸 밀어서 result에 더하세요\n\nprint(result)\n`,
    expectedOutput: "KHOOR",
    tags: ["for", "ord", "chr", "input", "%"], needsInput: true, defaultInput: "HELLO",
    hints: [
      "💡 ord('A') = 65, chr(65) = 'A'. ord()로 숫자로, chr()로 문자로 변환해요.",
      "🔍 (ord(c) - ord('A') + shift) % 26 + ord('A') 로 밀어낸 문자 코드를 구해요.",
      '✏️ 구조:\nfor c in text:\n    new_code = (ord(c) - ord("A") + shift) % 26 + ord("A")\n    result += chr(new_code)\nprint(result)',
    ]
  },
]

export const UNITS = [
  { id: 1, title: "출력과 변수", icon: "terminal-2", description: "파이썬의 시작! 화면에 출력하고 변수에 값을 저장해요.", missionIds: [1] },
  { id: 2, title: "연산자", icon: "calculator", description: "산술·비교·논리 연산자를 배워요.", missionIds: [2, 16] },
  { id: 3, title: "입력", icon: "keyboard", description: "input()으로 사용자 입력을 받아 인터랙티브한 프로그램을 만들어요.", missionIds: [17, 18] },
  { id: 4, title: "조건문", icon: "git-branch", description: "상황에 따라 다르게 동작하는 코드를 작성해요.", missionIds: [3, 4] },
  { id: 5, title: "반복문", icon: "refresh", description: "같은 동작을 반복하거나 패턴을 만들어요.", missionIds: [5, 6, 7] },
  { id: 6, title: "함수", icon: "math-function", description: "코드를 재사용할 수 있는 함수를 만들어요.", missionIds: [8] },
  { id: 7, title: "리스트", icon: "list", description: "여러 값을 한꺼번에 다루는 리스트를 배워요.", missionIds: [9] },
  { id: 8, title: "심화 미션", icon: "flame", description: "배운 것을 모두 활용하는 도전 미션!", missionIds: [10, 11, 12, 13, 14, 15] },
]

export const LEVEL_INFO = {
  1: { bg: "#E1F5EE", text: "#0F6E56", label: "기초", score: 100, gemCount: 10 },
  2: { bg: "#E6F1FB", text: "#185FA5", label: "응용", score: 150, gemCount: 15 },
  3: { bg: "#FAECE7", text: "#993C1D", label: "심화", score: 225, gemCount: 22 },
} as const

export function calcScore(level: Level, hintsUsed: number): number {
  const base = LEVEL_INFO[level].score
  const penalty = hintsUsed === 0 ? 50 : hintsUsed === 1 ? 0 : hintsUsed === 2 ? -20 : -40
  return Math.max(base + penalty, 30)
}
