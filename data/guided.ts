export interface GuidedExercise {
  id: number
  title: string
  description: string
  codeTemplate: string   // [___] 또는 [___1___], [___2___]
  answer: string[]       // 빈칸 순서대로 정답
  blankLabels: string[]  // 빈칸 힌트 레이블
  hint: string
  successMsg: string
}

export interface UnitGuided {
  unitId: number
  exercises: GuidedExercise[]
}

export const UNIT_GUIDED: UnitGuided[] = [
  {
    unitId: 1,
    exercises: [
      {
        id: 1,
        title: '화면에 출력하기',
        description: '빈칸에 알맞은 함수 이름을 채워서\n"파이썬 시작!" 이 출력되게 해보세요.',
        codeTemplate: `[___]("파이썬 시작!")`,
        answer: ['print'],
        blankLabels: ['출력 함수'],
        hint: '화면에 글자를 출력하는 함수예요. "인쇄하다"를 영어로 하면?',
        successMsg: '맞아요! print()가 화면에 글자를 출력해줘요 🎉',
      },
      {
        id: 2,
        title: '변수에 값 저장하기',
        description: '변수 이름을 채워서\n"한국고등학교" 가 출력되게 해보세요.',
        codeTemplate: `[___] = "한국고등학교"
print(school)`,
        answer: ['school'],
        blankLabels: ['변수 이름'],
        hint: '오른쪽에 이미 print(school) 이 있어요. 변수 이름이 뭐여야 할까요?',
        successMsg: '완벽해요! 변수에 값을 저장하고 출력했어요 💎',
      },
    ],
  },
  {
    unitId: 2,
    exercises: [
      {
        id: 1,
        title: '사용자 입력 받기',
        description: '빈칸을 채워서 사용자에게 이름을 입력받아 저장하세요.',
        codeTemplate: `name = [___]("이름이 뭐예요? ")
print("안녕,", name)`,
        answer: ['input'],
        blankLabels: ['입력 함수'],
        hint: '"안으로 넣다"는 뜻이에요. input!',
        successMsg: '맞아요! input()으로 사용자의 입력을 받을 수 있어요 🎉',
      },
      {
        id: 2,
        title: '문자열을 숫자로 변환하기',
        description: '"42"라는 문자열을 숫자로 바꿔서\n42 + 8 = 50 이 출력되게 해보세요.',
        codeTemplate: `num_str = "42"
num = [___](num_str)
print(num + 8)`,
        answer: ['int'],
        blankLabels: ['정수 변환 함수'],
        hint: '정수(Integer)로 바꾸는 함수예요. 줄여서 3글자!',
        successMsg: 'int()로 문자열을 정수로 변환했어요! 💎',
      },
    ],
  },
  {
    unitId: 3,
    exercises: [
      {
        id: 1,
        title: 'if 조건문 시작하기',
        description: '빈칸을 채워서 점수가 60 이상일 때\n"합격!" 이 출력되게 해보세요.',
        codeTemplate: `score = 75
[___] score >= 60:
    print("합격!")`,
        answer: ['if'],
        blankLabels: ['조건문 키워드'],
        hint: '"만약에~" 를 영어로 하면?',
        successMsg: 'if로 조건에 따라 다른 동작을 만들 수 있어요 🎉',
      },
      {
        id: 2,
        title: 'elif로 여러 조건 만들기',
        description: '"B"가 출력되려면 두 번째 조건에 뭐가 들어갈까요?',
        codeTemplate: `score = 75
if score >= 90:
    print("A")
[___] score >= 60:
    print("B")
else:
    print("C")`,
        answer: ['elif'],
        blankLabels: ['중간 조건 키워드'],
        hint: 'else + if 를 합친 줄임말이에요!',
        successMsg: 'elif로 세 가지 조건을 깔끔하게 처리했어요 💎',
      },
    ],
  },
  {
    unitId: 4,
    exercises: [
      {
        id: 1,
        title: 'for 반복문 시작하기',
        description: '빈칸을 채워서 0부터 4까지 출력되게 해보세요.',
        codeTemplate: `[___] i in range(5):
    print(i)`,
        answer: ['for'],
        blankLabels: ['반복 키워드'],
        hint: '"~를 위해" 반복한다는 뜻이에요. 영어로 3글자!',
        successMsg: 'for 반복문으로 같은 코드를 여러 번 실행했어요 🎉',
      },
      {
        id: 2,
        title: 'range로 범위 지정하기',
        description: '1, 2, 3이 출력되도록 range 함수를 완성하세요.',
        codeTemplate: `for i in [___](1, 4):
    print(i)`,
        answer: ['range'],
        blankLabels: ['범위 함수'],
        hint: '범위(Range)를 만드는 함수예요!',
        successMsg: 'range(시작, 끝) 으로 원하는 숫자 범위를 만들었어요 💎',
      },
    ],
  },
  {
    unitId: 5,
    exercises: [
      {
        id: 1,
        title: '나머지 연산자',
        description: '10을 3으로 나눈 나머지 1이 출력되도록\n올바른 연산자를 채우세요.',
        codeTemplate: `result = 10 [___] 3
print(result)`,
        answer: ['%'],
        blankLabels: ['나머지 연산자'],
        hint: '나머지를 구하는 특수 기호예요. 퍼센트처럼 생겼어요!',
        successMsg: '% 연산자로 나머지를 구할 수 있어요 🎉',
      },
      {
        id: 2,
        title: '비교 연산자',
        description: 'x가 5보다 크면 True가 출력되게\n비교 연산자를 채우세요.',
        codeTemplate: `x = 7
is_big = x [___] 5
print(is_big)`,
        answer: ['>'],
        blankLabels: ['비교 연산자'],
        hint: '"~보다 크다"를 기호로 표현해요. 키보드의 . 옆에 있어요!',
        successMsg: '> 연산자로 두 값을 비교했어요 💎',
      },
    ],
  },
  {
    unitId: 6,
    exercises: [
      {
        id: 1,
        title: '함수 만들기',
        description: '빈칸을 채워서 say_hello 함수를 정의하세요.',
        codeTemplate: `[___] say_hello():
    print("안녕하세요!")

say_hello()`,
        answer: ['def'],
        blankLabels: ['함수 정의 키워드'],
        hint: 'define(정의하다)의 줄임말이에요. 3글자!',
        successMsg: 'def로 나만의 함수를 만들었어요 🎉',
      },
      {
        id: 2,
        title: '결과값 돌려주기',
        description: 'double(5) 호출 시 10이 출력되도록\n빈칸을 채우세요.',
        codeTemplate: `def double(n):
    [___] n * 2

print(double(5))`,
        answer: ['return'],
        blankLabels: ['반환 키워드'],
        hint: '함수가 값을 "돌려보낸다"는 뜻이에요. "돌아가다"를 영어로?',
        successMsg: 'return으로 함수의 결과값을 돌려줬어요 💎',
      },
    ],
  },
  {
    unitId: 7,
    exercises: [
      {
        id: 1,
        title: '리스트에 항목 추가하기',
        description: '"딸기"를 리스트 끝에 추가하도록\n빈칸을 채우세요.',
        codeTemplate: `fruits = ["사과", "바나나"]
fruits.[___]("딸기")
print(fruits)`,
        answer: ['append'],
        blankLabels: ['추가 메서드'],
        hint: '"덧붙이다, 추가하다"를 영어로 하면?',
        successMsg: 'append()로 리스트에 새 항목을 추가했어요 🎉',
      },
      {
        id: 2,
        title: '리스트 길이 구하기',
        description: '리스트에 항목이 몇 개인지\n출력해보세요. (정답: 5)',
        codeTemplate: `numbers = [1, 2, 3, 4, 5]
print([___](numbers))`,
        answer: ['len'],
        blankLabels: ['길이 함수'],
        hint: 'Length(길이)의 줄임말이에요. 3글자!',
        successMsg: 'len()으로 리스트 길이를 구했어요 💎',
      },
    ],
  },
  {
    unitId: 8,
    exercises: [
      {
        id: 1,
        title: '문자열 대문자로 바꾸기',
        description: '"hello"를 "HELLO"로 바꿔 출력되게\n빈칸을 채우세요.',
        codeTemplate: `text = "hello"
print(text.[___]())`,
        answer: ['upper'],
        blankLabels: ['대문자 변환 메서드'],
        hint: '"위쪽"을 뜻하는 영어예요. 대문자는 위에 있다고 생각해요!',
        successMsg: 'upper()로 문자열을 대문자로 바꿨어요 🎉',
      },
      {
        id: 2,
        title: '문자열 나누기',
        description: '문장을 단어로 쪼개서 단어 수(3)가\n출력되게 빈칸을 채우세요.',
        codeTemplate: `sentence = "파이썬 재밌어 정말"
words = sentence.[___]()
print(len(words))`,
        answer: ['split'],
        blankLabels: ['나누기 메서드'],
        hint: '"쪼개다, 나누다"를 영어로 하면? 5글자!',
        successMsg: 'split()으로 문자열을 단어별로 나눴어요 💎',
      },
    ],
  },
]
