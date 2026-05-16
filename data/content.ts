export interface UnitContent {
  unitId: number
  concept: {
    summary: string
    sections: { title: string; body: string; code?: string }[]
    keyPoints: string[]
  }
  examples: {
    title: string
    description: string
    code: string
    output: string
    explanation: string
  }[]
}

export const UNIT_CONTENTS: UnitContent[] = [
  {
    unitId: 1,
    concept: {
      summary: "파이썬에서 화면에 내용을 출력하고, 변수에 값을 저장하는 방법을 배워요.",
      sections: [
        {
          title: "print() 함수",
          body: "print() 함수는 괄호 안의 내용을 화면에 출력해요. 문자열은 따옴표로 감싸야 해요.",
          code: `print("Hello, World!")
print("파이썬 시작!")
print(42)
print(3.14)`
        },
        {
          title: "변수 (Variable)",
          body: "변수는 데이터를 저장하는 상자예요. = 기호로 값을 넣을 수 있어요.",
          code: `name = "홍길동"
age = 17
height = 175.5

print(name)    # 홍길동
print(age)     # 17
print(height)  # 175.5`
        },
        {
          title: "자료형 (Data Type)",
          body: "파이썬의 기본 자료형은 4가지예요.",
          code: `x = 10        # 정수 (int)
y = 3.14      # 실수 (float)
s = "안녕"    # 문자열 (str)
b = True      # 불리언 (bool)

print(type(x))  # <class 'int'>
print(type(s))  # <class 'str'>`
        },
        {
          title: "여러 값 출력하기",
          body: "print()에 쉼표로 여러 값을 넣거나, + 로 문자열을 이어 붙일 수 있어요.",
          code: `name = "홍길동"
age = 17

print("이름:", name, "나이:", age)   # 쉼표 방식
print("이름: " + name)              # 문자열 연결`
        }
      ],
      keyPoints: [
        "print()로 화면에 출력할 수 있어요",
        "변수 이름은 영문자나 _로 시작해야 해요",
        "= 는 오른쪽 값을 왼쪽 변수에 저장해요",
        "문자열은 따옴표(' ' 또는 \" \")로 감싸요"
      ]
    },
    examples: [
      {
        title: "자기소개 출력하기",
        description: "변수에 정보를 저장하고 출력해봐요",
        code: `name = "홍길동"
age = 17
school = "○○고등학교"

print("이름:", name)
print("나이:", age)
print("학교:", school)`,
        output: "이름: 홍길동\n나이: 17\n학교: ○○고등학교",
        explanation: "변수에 문자열과 숫자를 저장한 뒤 print()로 출력해요. 쉼표로 여러 값을 한 번에 출력할 수 있어요."
      },
      {
        title: "다양한 출력 방법",
        description: "print()의 여러 활용법을 익혀봐요",
        code: `subject = "파이썬"
score = 100

print("과목:", subject)
print("점수:", score)
print(subject + " 점수는 " + str(score) + "점!")`,
        output: "과목: 파이썬\n점수: 100\n파이썬 점수는 100점!",
        explanation: "숫자를 문자열과 + 로 합칠 때는 str()로 변환해야 해요."
      }
    ]
  },
  {
    unitId: 2,
    concept: {
      summary: "덧셈·뺄셈 같은 산술 연산부터 크기 비교, 참/거짓을 다루는 논리 연산까지 배워요.",
      sections: [
        {
          title: "산술 연산자",
          body: "숫자 계산에 사용하는 연산자들이에요.",
          code: `a = 10
b = 3

print(a + b)   # 13  (덧셈)
print(a - b)   # 7   (뺄셈)
print(a * b)   # 30  (곱셈)
print(a / b)   # 3.333... (나눗셈)
print(a // b)  # 3   (몫)
print(a % b)   # 1   (나머지)
print(a ** b)  # 1000 (거듭제곱)`
        },
        {
          title: "비교 연산자",
          body: "두 값을 비교해서 True 또는 False를 반환해요.",
          code: `print(5 > 3)    # True  (크다)
print(5 < 3)    # False (작다)
print(5 >= 5)   # True  (크거나 같다)
print(5 <= 4)   # False (작거나 같다)
print(5 == 5)   # True  (같다)
print(5 != 3)   # True  (다르다)`
        },
        {
          title: "논리 연산자",
          body: "여러 조건을 합쳐서 참/거짓을 판단해요.",
          code: `x = 15
print(x > 10 and x < 20)  # True  (둘 다 참)
print(x < 5 or x > 10)    # True  (하나라도 참)
print(not x > 20)           # True  (반대)`
        },
        {
          title: "복합 대입 연산자",
          body: "변수 값을 바꿀 때 줄여서 쓸 수 있어요.",
          code: `count = 0
count += 1   # count = count + 1
print(count)  # 1

score = 100
score -= 10   # score = score - 10
print(score)  # 90

score *= 2    # score = score * 2
print(score)  # 180`
        }
      ],
      keyPoints: [
        "// 는 나눗셈의 몫, % 는 나머지예요",
        "** 는 거듭제곱이에요 (2**10 = 1024)",
        "비교 연산자 결과는 True 또는 False",
        "== 는 같다, != 는 다르다, = 는 대입(저장)"
      ]
    },
    examples: [
      {
        title: "용돈 계산기",
        description: "연산자로 용돈을 계산해봐요",
        code: `pocket_money = 50000
snack = 3500
lunch = 8000

total_spent = snack + lunch
remaining = pocket_money - total_spent

print("쓴 돈:", total_spent, "원")
print("남은 돈:", remaining, "원")
print("절반 이상 썼나요?", total_spent > pocket_money // 2)`,
        output: "쓴 돈: 11500 원\n남은 돈: 38500 원\n절반 이상 썼나요? False",
        explanation: "산술 연산으로 계산하고, 비교 연산으로 True/False를 출력했어요."
      },
      {
        title: "점수 판별하기",
        description: "비교·논리 연산자로 조건을 확인해봐요",
        code: `score = 78

print("합격 여부:", score >= 60)
print("우수 학생:", score >= 80 and score <= 100)
print("재시험 대상:", score < 60 or score > 100)`,
        output: "합격 여부: True\n우수 학생: False\n재시험 대상: False",
        explanation: "비교 연산자와 논리 연산자를 함께 쓰면 복잡한 조건도 만들 수 있어요."
      }
    ]
  },
  {
    unitId: 3,
    concept: {
      summary: "input() 함수로 사용자에게 값을 입력받아 인터랙티브한 프로그램을 만들어요.",
      sections: [
        {
          title: "input() 함수",
          body: "input()은 사용자가 키보드로 입력한 값을 문자열로 받아요. 괄호 안에 안내 문구를 쓸 수 있어요.",
          code: `name = input("이름을 입력하세요: ")
print("안녕하세요,", name + "님!")`
        },
        {
          title: "숫자로 변환하기",
          body: "input()은 항상 문자열을 반환해요. 숫자로 계산하려면 int() 또는 float()로 변환해야 해요.",
          code: `# 문자열로 받기
age_str = input("나이: ")   # "17" (문자열)

# 정수로 변환
age = int(age_str)           # 17 (정수)

# 한 번에 변환
height = float(input("키(cm): "))  # 175.5 (실수)

print("10년 후 나이:", age + 10)`
        },
        {
          title: "여러 값 입력받기",
          body: "input()을 여러 번 호출해서 값을 따로 받을 수 있어요.",
          code: `width = int(input("가로: "))
height = int(input("세로: "))

area = width * height
print("넓이:", area)`
        },
        {
          title: "자료형 변환 정리",
          body: "변환 함수를 상황에 맞게 골라 써요.",
          code: `s = "123"
print(int(s))     # 123  (정수)
print(float(s))   # 123.0 (실수)

n = 456
print(str(n))     # "456" (문자열로)

# input()과 함께 자주 쓰는 패턴
score = int(input("점수: "))
price = float(input("가격: "))`
        }
      ],
      keyPoints: [
        "input()은 항상 문자열(str)을 반환해요",
        "숫자로 계산하려면 int() 또는 float() 변환 필수",
        "int()는 정수, float()는 소수점이 있는 숫자",
        "str()로 숫자를 문자열로 변환할 수 있어요"
      ]
    },
    examples: [
      {
        title: "자기소개 프로그램",
        description: "input()으로 이름과 나이를 입력받아봐요",
        code: `name = input("이름: ")
age = int(input("나이: "))

print("안녕하세요!")
print("저는", name + "이에요.")
print("나이는", age, "살이고, 10년 후엔", age+10, "살이에요.")`,
        output: "안녕하세요!\n저는 홍길동이에요.\n나이는 17 살이고, 10년 후엔 27 살이에요.",
        explanation: "input()으로 받은 이름은 그대로, 나이는 int()로 변환해서 계산에 사용했어요."
      },
      {
        title: "간단한 계산기",
        description: "두 숫자를 입력받아 사칙연산 결과를 출력해봐요",
        code: `a = int(input("첫 번째 숫자: "))
b = int(input("두 번째 숫자: "))

print(a, "+", b, "=", a + b)
print(a, "-", b, "=", a - b)
print(a, "*", b, "=", a * b)
print(a, "//", b, "=", a // b)`,
        output: "3 + 5 = 8\n3 - 5 = -2\n3 * 5 = 15\n3 // 5 = 0",
        explanation: "int(input())으로 숫자를 입력받아서 바로 연산할 수 있어요."
      }
    ]
  },
  {
    unitId: 4,
    concept: {
      summary: "조건에 따라 다른 코드를 실행하는 if문을 배워요.",
      sections: [
        {
          title: "if 문 기본",
          body: "조건이 참(True)이면 들여쓰기 블록을 실행해요.",
          code: `score = 85

if score >= 60:
    print("합격!")

# 조건이 거짓이면 아무것도 실행 안 함`
        },
        {
          title: "if-else 문",
          body: "조건이 참이면 if 블록, 거짓이면 else 블록을 실행해요.",
          code: `age = 15

if age >= 18:
    print("성인입니다")
else:
    print("미성년자입니다")`
        },
        {
          title: "if-elif-else 문",
          body: "여러 조건을 순서대로 검사할 때 elif를 사용해요.",
          code: `score = 85

if score >= 90:
    print("A")
elif score >= 80:
    print("B")
elif score >= 70:
    print("C")
else:
    print("F")`
        },
        {
          title: "비교/논리 연산자 활용",
          body: "조건을 만들 때 비교·논리 연산자를 함께 써요.",
          code: `# 비교 연산자
print(5 > 3)    # True
print(5 == 5)   # True
print(5 != 3)   # True

# 논리 연산자
x = 15
print(x > 10 and x < 20)  # True (둘 다 참)
print(x < 5 or x > 10)    # True (하나라도 참)
print(not x > 20)           # True (반대)`
        }
      ],
      keyPoints: [
        "if 다음에 조건, 조건 다음에 콜론(:) 필수!",
        "들여쓰기(4칸)가 블록을 구분해요",
        "elif는 여러 조건을 순서대로 검사해요",
        "== 는 같다, != 는 다르다를 의미해요"
      ]
    },
    examples: [
      {
        title: "홀수/짝수 판별",
        description: "% 연산자로 홀짝을 구분해봐요",
        code: `n = 7

if n % 2 == 0:
    print(str(n) + "은 짝수입니다")
else:
    print(str(n) + "은 홀수입니다")`,
        output: "7은 홀수입니다",
        explanation: "% 2 의 나머지가 0이면 짝수, 1이면 홀수예요."
      },
      {
        title: "성적 등급 판정",
        description: "elif로 여러 단계 조건을 처리해봐요",
        code: `score = 78

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
elif score >= 60:
    grade = "D"
else:
    grade = "F"

print("점수:", score)
print("등급:", grade)`,
        output: "점수: 78\n등급: C",
        explanation: "위에서부터 차례로 조건을 검사해서 처음으로 참이 되는 블록만 실행해요."
      }
    ]
  },
  {
    unitId: 5,
    concept: {
      summary: "같은 코드를 반복 실행하는 for문과 while문을 배워요.",
      sections: [
        {
          title: "for 문과 range()",
          body: "range()로 반복 횟수를 지정해요.",
          code: `# 0부터 4까지 (5번 반복)
for i in range(5):
    print(i)

# 1부터 5까지
for i in range(1, 6):
    print(i)

# 1부터 10까지 2씩 증가
for i in range(1, 11, 2):
    print(i)`
        },
        {
          title: "리스트 순회",
          body: "리스트의 각 요소를 하나씩 꺼내서 처리해요.",
          code: `fruits = ["사과", "바나나", "딸기"]

for fruit in fruits:
    print(fruit)

# 인덱스와 값 함께
for i, fruit in enumerate(fruits):
    print(i, fruit)`
        },
        {
          title: "while 문",
          body: "조건이 참인 동안 계속 반복해요.",
          code: `count = 1

while count <= 5:
    print(count)
    count += 1  # count = count + 1`
        },
        {
          title: "break와 continue",
          body: "break는 반복문을 즉시 종료, continue는 현재 반복을 건너뛰어요.",
          code: `# break 예시
for i in range(10):
    if i == 5:
        break      # 5에서 멈춤
    print(i)

# continue 예시
for i in range(10):
    if i % 2 == 0:
        continue   # 짝수는 건너뜀
    print(i)       # 홀수만 출력`
        }
      ],
      keyPoints: [
        "range(끝), range(시작, 끝), range(시작, 끝, 간격) 세 가지",
        "for문은 횟수가 정해질 때, while문은 조건이 있을 때",
        "break = 반복 종료, continue = 현재 건너뛰기",
        "while True: 로 무한루프, break로 탈출"
      ]
    },
    examples: [
      {
        title: "구구단 출력",
        description: "for문으로 구구단을 만들어봐요",
        code: `dan = 3

for i in range(1, 10):
    print(str(dan) + " x " + str(i) + " = " + str(dan * i))`,
        output: "3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27",
        explanation: "range(1, 10)은 1부터 9까지예요. str()로 숫자를 문자열로 변환해서 연결했어요."
      },
      {
        title: "1부터 100까지 합계",
        description: "누적합 패턴을 익혀봐요",
        code: `total = 0

for i in range(1, 101):
    total += i   # total = total + i

print("1부터 100까지의 합:", total)`,
        output: "1부터 100까지의 합: 5050",
        explanation: "total 변수에 i를 계속 더해나가는 누적합 패턴이에요. range(1, 101)은 1~100이에요."
      }
    ]
  },
  {
    unitId: 6,
    concept: {
      summary: "반복해서 사용하는 코드를 함수로 묶어 재사용하는 방법을 배워요.",
      sections: [
        {
          title: "함수 정의와 호출",
          body: "def로 함수를 정의하고, 이름()으로 호출해요.",
          code: `def greet():
    print("안녕하세요!")
    print("반갑습니다.")

# 함수 호출
greet()
greet()  # 여러 번 재사용 가능`
        },
        {
          title: "매개변수 (Parameter)",
          body: "함수에 값을 전달할 수 있어요.",
          code: `def greet(name):
    print("안녕하세요,", name + "님!")

greet("홍길동")
greet("김철수")`
        },
        {
          title: "반환값 (return)",
          body: "return으로 함수의 결과값을 돌려줄 수 있어요.",
          code: `def add(a, b):
    return a + b

result = add(3, 5)
print(result)   # 8

print(add(10, 20))  # 30`
        }
      ],
      keyPoints: [
        "def 함수명(매개변수): 로 함수를 정의해요",
        "함수 안의 코드는 반드시 들여쓰기!",
        "return으로 결과값을 반환해요",
        "함수는 여러 번 재사용할 수 있어요"
      ]
    },
    examples: [
      {
        title: "계산기 함수",
        description: "사칙연산 함수를 만들어봐요",
        code: `def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b

print("3 + 5 =", add(3, 5))
print("10 - 4 =", subtract(10, 4))
print("6 x 7 =", multiply(6, 7))`,
        output: "3 + 5 = 8\n10 - 4 = 6\n6 x 7 = 42",
        explanation: "각 연산을 별도 함수로 만들면 필요할 때마다 호출해서 쓸 수 있어요."
      }
    ]
  },
  {
    unitId: 7,
    concept: {
      summary: "여러 데이터를 하나로 묶어 관리하는 리스트를 배워요.",
      sections: [
        {
          title: "리스트 기본",
          body: "대괄호 []로 여러 값을 묶어요.",
          code: `fruits = ["사과", "바나나", "딸기", "포도"]

print(fruits)         # 전체 리스트
print(fruits[0])      # 첫 번째: 사과
print(fruits[-1])     # 마지막: 포도
print(len(fruits))    # 길이: 4`
        },
        {
          title: "리스트 수정",
          body: "리스트에 요소를 추가, 삭제, 변경할 수 있어요.",
          code: `nums = [1, 2, 3]

nums.append(4)    # 끝에 추가
print(nums)       # [1, 2, 3, 4]

nums.remove(2)    # 값으로 삭제
print(nums)       # [1, 3, 4]

nums[0] = 10      # 값 변경
print(nums)       # [10, 3, 4]`
        },
        {
          title: "슬라이싱",
          body: "리스트의 일부를 잘라낼 수 있어요.",
          code: `data = [10, 20, 30, 40, 50]

print(data[1:3])    # [20, 30]
print(data[:3])     # [10, 20, 30]
print(data[2:])     # [30, 40, 50]
print(data[::2])    # [10, 30, 50] (2칸씩)`
        }
      ],
      keyPoints: [
        "인덱스는 0부터 시작, -1은 마지막",
        "append()로 추가, remove()로 삭제",
        "len()으로 리스트 길이를 구해요",
        "슬라이싱: 리스트[시작:끝]"
      ]
    },
    examples: [
      {
        title: "성적 관리",
        description: "리스트로 성적을 관리해봐요",
        code: `scores = [85, 92, 78, 95, 88]

print("성적 목록:", scores)
print("최고점:", max(scores))
print("최저점:", min(scores))
print("평균:", sum(scores) // len(scores))`,
        output: "성적 목록: [85, 92, 78, 95, 88]\n최고점: 95\n최저점: 78\n평균: 87",
        explanation: "max(), min(), sum()은 리스트를 처리하는 유용한 내장 함수예요."
      }
    ]
  },
  {
    unitId: 8,
    concept: {
      summary: "배운 모든 개념을 활용하는 심화 미션이에요. random, 문자열 처리 등 새로운 기능도 배워요.",
      sections: [
        {
          title: "random 모듈",
          body: "무작위 숫자를 생성할 때 사용해요.",
          code: `import random

print(random.randint(1, 10))   # 1~10 사이 정수
print(random.random())          # 0.0~1.0 실수

items = ["가위", "바위", "보"]
print(random.choice(items))    # 랜덤 선택

nums = list(range(1, 46))
print(random.sample(nums, 6))  # 중복 없이 6개`
        },
        {
          title: "문자열 처리",
          body: "문자열을 다루는 다양한 방법이에요.",
          code: `s = "Hello, Python!"

print(len(s))           # 길이: 14
print(s.upper())        # 대문자: HELLO, PYTHON!
print(s.lower())        # 소문자: hello, python!
print(s.replace("Python", "파이썬"))
print(s[0])             # H (인덱싱)
print(s[7:13])          # Python (슬라이싱)

# ord/chr
print(ord('A'))         # 65
print(chr(65))          # A`
        }
      ],
      keyPoints: [
        "import로 외부 모듈을 불러와요",
        "random.randint(a,b): a~b 사이 정수",
        "random.choice(): 리스트에서 랜덤 선택",
        "ord()는 문자→숫자, chr()는 숫자→문자"
      ]
    },
    examples: [
      {
        title: "주사위 굴리기",
        description: "random으로 주사위를 만들어봐요",
        code: `import random

result = random.randint(1, 6)
print("주사위:", result)

if result == 6:
    print("🎉 최고!")
elif result >= 4:
    print("👍 좋아!")
else:
    print("다시 도전!")`,
        output: "주사위: 4\n👍 좋아!",
        explanation: "random.randint(1, 6)으로 1~6 사이 랜덤 숫자를 뽑아요. 매번 실행마다 다른 결과가 나와요."
      }
    ]
  }
]
