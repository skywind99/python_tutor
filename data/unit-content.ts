export interface Example {
  title: string
  description: string
  code: string
  expectedOutput: string
}

export interface UnitContent {
  unitId: number
  concept: {
    summary: string
    sections: { title: string; body: string; code?: string; output?: string }[]
  }
  examples: Example[]
}

export const UNIT_CONTENTS: UnitContent[] = [
  {
    unitId: 1,
    concept: {
      summary: "파이썬의 가장 기본! 화면에 출력하고 변수에 값을 저장하는 법을 배워요.",
      sections: [
        {
          title: "print() 함수로 출력하기",
          body: "print() 함수는 괄호 안의 내용을 화면에 출력해요. 문자열은 따옴표로 감싸야 해요.",
          code: `print("Hello, Python!")
print('작은따옴표도 돼요')
print(42)
print(3.14)`,
          output: `Hello, Python!\n작은따옴표도 돼요\n42\n3.14`
        },
        {
          title: "변수(variable)란?",
          body: "변수는 값을 저장하는 상자예요. 변수 이름 = 값 형태로 선언해요. 파이썬은 자료형을 자동으로 파악해요.",
          code: `name = "홍길동"
age = 17
height = 172.5
is_student = True

print(name)
print(age)
print(type(age))`,
          output: `홍길동\n17\n<class 'int'>`
        },
        {
          title: "산술 연산자",
          body: "파이썬에서 사용하는 기본 연산자들이에요. // 는 정수 나눗셈(몫), % 는 나머지예요.",
          code: `a = 10
b = 3

print(a + b)   # 덧셈: 13
print(a - b)   # 뺄셈: 7
print(a * b)   # 곱셈: 30
print(a / b)   # 나눗셈: 3.333...
print(a // b)  # 정수 나눗셈(몫): 3
print(a % b)   # 나머지: 1
print(a ** b)  # 거듭제곱: 1000`,
          output: `13\n7\n30\n3.3333333333333335\n3\n1\n1000`
        },
        {
          title: "문자열과 숫자 합치기",
          body: "print()에서 쉼표(,)로 여러 값을 이어 출력하거나, str()로 숫자를 문자열로 변환해서 + 로 합칠 수 있어요.",
          code: `name = "김파이"
score = 95

# 방법 1: 쉼표 사용
print("이름:", name, "점수:", score)

# 방법 2: str() 변환 후 +
print("이름: " + name + ", 점수: " + str(score))`,
          output: `이름: 김파이 점수: 95\n이름: 김파이, 점수: 95`
        }
      ]
    },
    examples: [
      {
        title: "자기소개 프로그램",
        description: "변수를 사용해서 자기소개를 출력해봐요.",
        code: `name = "홍길동"
age = 17
school = "파이썬고등학교"

print("안녕하세요!")
print("제 이름은 " + name + "이에요.")
print("나이는 " + str(age) + "살이고")
print(school + "에 다니고 있어요.")`,
        expectedOutput: `안녕하세요!\n제 이름은 홍길동이에요.\n나이는 17살이고\n파이썬고등학교에 다니고 있어요.`
      },
      {
        title: "영수증 계산기",
        description: "물건 가격과 개수로 총금액을 계산해봐요.",
        code: `item = "떡볶이"
price = 4500
count = 3

total = price * count
print("==== 영수증 ====")
print("품목:", item)
print("단가:", price, "원")
print("수량:", count, "개")
print("총액:", total, "원")`,
        expectedOutput: `==== 영수증 ====\n품목: 떡볶이\n단가: 4500 원\n수량: 3 개\n총액: 13500 원`
      }
    ]
  },
  {
    unitId: 2,
    concept: {
      summary: "조건에 따라 다르게 동작하는 코드를 작성해요. 프로그램이 '생각'하게 만들어요!",
      sections: [
        {
          title: "if 문 기본 구조",
          body: "if 조건: 다음 줄에 들여쓰기(스페이스 4칸)로 실행할 코드를 작성해요. 조건이 True일 때만 실행돼요.",
          code: `score = 85

if score >= 60:
    print("합격!")
    
if score >= 90:
    print("장학금 대상")`,
          output: `합격!`
        },
        {
          title: "if / else",
          body: "else: 는 if 조건이 False일 때 실행돼요. if와 else는 둘 중 하나만 실행돼요.",
          code: `age = 16

if age >= 18:
    print("성인입니다")
else:
    print("미성년자입니다")`,
          output: `미성년자입니다`
        },
        {
          title: "if / elif / else",
          body: "여러 조건을 순서대로 검사할 때 elif를 사용해요. 위에서부터 검사해서 처음 True인 곳만 실행돼요.",
          code: `score = 85

if score >= 90:
    print("A")
elif score >= 80:
    print("B")
elif score >= 70:
    print("C")
elif score >= 60:
    print("D")
else:
    print("F")`,
          output: `B`
        },
        {
          title: "비교 연산자와 논리 연산자",
          body: "조건을 만드는 연산자들이에요.",
          code: `x = 5

# 비교 연산자
print(x > 3)    # True
print(x == 5)   # True
print(x != 4)   # True

# 논리 연산자
print(x > 3 and x < 10)  # True (둘 다 참)
print(x > 10 or x > 3)   # True (하나라도 참)
print(not x > 10)         # True (반대)`,
          output: `True\nTrue\nTrue\nTrue\nTrue\nTrue`
        }
      ]
    },
    examples: [
      {
        title: "로그인 시스템",
        description: "아이디와 비밀번호가 맞는지 확인해봐요.",
        code: `correct_id = "student01"
correct_pw = "1234"

input_id = "student01"
input_pw = "1234"

if input_id == correct_id and input_pw == correct_pw:
    print("로그인 성공! 환영합니다 🎉")
else:
    print("아이디 또는 비밀번호가 틀렸어요 ❌")`,
        expectedOutput: `로그인 성공! 환영합니다 🎉`
      },
      {
        title: "삼각형 판별기",
        description: "세 변의 길이로 삼각형 종류를 판별해요.",
        code: `a, b, c = 5, 5, 5

if a == b == c:
    print("정삼각형")
elif a == b or b == c or a == c:
    print("이등변삼각형")
else:
    print("일반삼각형")`,
        expectedOutput: `정삼각형`
      }
    ]
  },
  {
    unitId: 3,
    concept: {
      summary: "같은 동작을 반복하거나 패턴을 만들 때 반복문을 써요. 코드가 확 줄어들어요!",
      sections: [
        {
          title: "for 문과 range()",
          body: "for 변수 in range(n): 으로 0부터 n-1까지 반복해요. range(시작, 끝)으로 범위를 지정할 수도 있어요.",
          code: `# 0부터 4까지
for i in range(5):
    print(i)`,
          output: `0\n1\n2\n3\n4`
        },
        {
          title: "range() 활용",
          body: "range(시작, 끝, 간격)으로 다양하게 사용할 수 있어요.",
          code: `# 1부터 10까지
for i in range(1, 11):
    print(i, end=" ")
print()

# 짝수만
for i in range(2, 11, 2):
    print(i, end=" ")
print()

# 역순
for i in range(5, 0, -1):
    print(i, end=" ")`,
          output: `1 2 3 4 5 6 7 8 9 10 \n2 4 6 8 10 \n5 4 3 2 1 `
        },
        {
          title: "while 문",
          body: "while 조건: 은 조건이 True인 동안 계속 반복해요. 조건이 False가 되면 멈춰요.",
          code: `count = 0
while count < 5:
    print("카운트:", count)
    count += 1
    
print("완료!")`,
          output: `카운트: 0\n카운트: 1\n카운트: 2\n카운트: 3\n카운트: 4\n완료!`
        },
        {
          title: "break와 continue",
          body: "break는 반복문을 즉시 종료해요. continue는 현재 반복을 건너뛰고 다음으로 넘어가요.",
          code: `# break 예시
for i in range(10):
    if i == 5:
        break
    print(i, end=" ")
print()

# continue 예시
for i in range(10):
    if i % 2 == 0:
        continue
    print(i, end=" ")`,
          output: `0 1 2 3 4 \n1 3 5 7 9 `
        }
      ]
    },
    examples: [
      {
        title: "구구단 출력기",
        description: "원하는 단의 구구단을 출력해요.",
        code: `dan = 7

print(f"=== {dan}단 ===")
for i in range(1, 10):
    result = dan * i
    print(f"{dan} x {i} = {result}")`,
        expectedOutput: `=== 7단 ===\n7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n7 x 6 = 42\n7 x 7 = 49\n7 x 8 = 56\n7 x 9 = 63`
      },
      {
        title: "합계 계산기",
        description: "1부터 100까지 더해봐요.",
        code: `total = 0
for i in range(1, 101):
    total += i

print("1부터 100까지의 합:", total)
print("가우스 공식 검증:", 100 * 101 // 2)`,
        expectedOutput: `1부터 100까지의 합: 5050\n가우스 공식 검증: 5050`
      }
    ]
  },
  {
    unitId: 4,
    concept: {
      summary: "반복되는 코드를 함수로 묶어서 재사용해요. 코드가 깔끔해지고 유지보수가 쉬워져요!",
      sections: [
        {
          title: "함수 정의와 호출",
          body: "def 함수명(): 으로 함수를 정의하고, 함수명()으로 호출해요.",
          code: `def greet():
    print("안녕하세요!")
    print("파이썬 학습실에 오신 걸 환영해요 🎉")

# 함수 호출
greet()
greet()  # 여러 번 호출 가능`,
          output: `안녕하세요!\n파이썬 학습실에 오신 걸 환영해요 🎉\n안녕하세요!\n파이썬 학습실에 오신 걸 환영해요 🎉`
        },
        {
          title: "매개변수(parameter)",
          body: "함수에 값을 전달할 수 있어요. 괄호 안에 매개변수를 정의해요.",
          code: `def greet(name):
    print("안녕하세요,", name + "님!")

greet("홍길동")
greet("김파이")`,
          output: `안녕하세요, 홍길동님!\n안녕하세요, 김파이님!`
        },
        {
          title: "return 문",
          body: "return은 함수의 결과값을 돌려줘요. return 이후 코드는 실행되지 않아요.",
          code: `def add(a, b):
    return a + b

def multiply(a, b):
    return a * b

result1 = add(3, 5)
result2 = multiply(4, 6)

print(result1)
print(result2)
print(add(10, 20))`,
          output: `8\n24\n30`
        }
      ]
    },
    examples: [
      {
        title: "계산기 함수",
        description: "사칙연산 함수를 만들어봐요.",
        code: `def calc(a, b, op):
    if op == "+":
        return a + b
    elif op == "-":
        return a - b
    elif op == "*":
        return a * b
    elif op == "/":
        return a / b

print(calc(10, 3, "+"))
print(calc(10, 3, "-"))
print(calc(10, 3, "*"))
print(calc(10, 3, "/"))`,
        expectedOutput: `13\n7\n30\n3.3333333333333335`
      }
    ]
  },
  {
    unitId: 5,
    concept: {
      summary: "여러 값을 한꺼번에 저장하고 다루는 리스트를 배워요. 데이터를 다루는 핵심 도구예요!",
      sections: [
        {
          title: "리스트 만들기",
          body: "대괄호 []로 리스트를 만들어요. 여러 자료형을 섞어서 담을 수 있어요.",
          code: `fruits = ["사과", "바나나", "포도"]
numbers = [1, 2, 3, 4, 5]
mixed = [1, "hello", True, 3.14]

print(fruits)
print(len(fruits))  # 길이`,
          output: `['사과', '바나나', '포도']\n3`
        },
        {
          title: "인덱싱과 슬라이싱",
          body: "인덱스는 0부터 시작해요. 음수 인덱스는 뒤에서부터 세요.",
          code: `fruits = ["사과", "바나나", "포도", "딸기", "수박"]

print(fruits[0])    # 첫 번째
print(fruits[-1])   # 마지막
print(fruits[1:3])  # 1번~2번 (3번 미포함)
print(fruits[:2])   # 처음~1번`,
          output: `사과\n수박\n['바나나', '포도']\n['사과', '바나나']`
        },
        {
          title: "리스트 메서드",
          body: "리스트를 다루는 다양한 메서드들이에요.",
          code: `nums = [3, 1, 4, 1, 5, 9, 2, 6]

nums.append(7)      # 맨 뒤에 추가
nums.sort()         # 정렬
print(nums)

nums.remove(1)      # 첫 번째 1 제거
print(nums)
print(nums.index(5))  # 5의 위치`,
          output: `[1, 1, 2, 3, 4, 5, 6, 7, 9]\n[1, 2, 3, 4, 5, 6, 7, 9]\n4`
        }
      ]
    },
    examples: [
      {
        title: "성적 분석기",
        description: "성적 리스트의 평균, 최고점, 최저점을 구해봐요.",
        code: `scores = [85, 92, 78, 96, 88, 74, 91]

total = sum(scores)
average = total / len(scores)
highest = max(scores)
lowest = min(scores)

print("총점:", total)
print("평균:", round(average, 1))
print("최고점:", highest)
print("최저점:", lowest)`,
        expectedOutput: `총점: 604\n평균: 86.3\n최고점: 96\n최저점: 74`
      }
    ]
  },
  {
    unitId: 6,
    concept: {
      summary: "지금까지 배운 모든 것을 활용하는 심화 미션들이에요. 실전 감각을 키워봐요!",
      sections: [
        {
          title: "random 모듈",
          body: "random 모듈로 랜덤한 값을 만들 수 있어요. import로 불러와서 사용해요.",
          code: `import random

print(random.randint(1, 10))  # 1~10 정수
print(random.random())         # 0~1 실수

fruits = ["사과", "바나나", "포도"]
print(random.choice(fruits))   # 무작위 선택

nums = list(range(1, 46))
print(random.sample(nums, 6))  # 중복없이 6개`,
          output: `7\n0.3421...\n바나나\n[3, 15, 22, 31, 38, 44]`
        },
        {
          title: "문자열 메서드",
          body: "문자열을 다양하게 처리하는 메서드들이에요.",
          code: `text = "Hello, Python World!"

print(text.upper())          # 대문자
print(text.lower())          # 소문자
print(text.replace("o", "0")) # 치환
print(text.split(", "))      # 분리
print(len(text))             # 길이
print(text.count("l"))       # l 개수`,
          output: `HELLO, PYTHON WORLD!\nhello, python world!\nHell0, Pyth0n W0rld!\n['Hello', 'Python World!']\n21\n3`
        },
        {
          title: "중첩 반복문",
          body: "반복문 안에 반복문을 넣을 수 있어요. 구구단 전체표나 패턴 출력에 활용해요.",
          code: `for i in range(2, 5):
    for j in range(1, 10):
        print(f"{i}×{j}={i*j}", end="  ")
    print()`,
          output: `2×1=2  2×2=4  2×3=6  ...\n3×1=3  3×2=6  ...\n4×1=4  4×2=8  ...`
        }
      ]
    },
    examples: [
      {
        title: "간단한 로또 시뮬레이터",
        description: "로또 번호를 자동으로 생성해요.",
        code: `import random

my_numbers = sorted(random.sample(range(1, 46), 6))
winning = sorted(random.sample(range(1, 46), 6))

print("내 번호:", my_numbers)
print("당첨번호:", winning)

matched = len(set(my_numbers) & set(winning))
print(f"일치: {matched}개")

if matched == 6:
    print("1등! 🏆")
elif matched == 5:
    print("3등! 🥉")
elif matched == 4:
    print("4등!")
elif matched == 3:
    print("5등!")
else:
    print("꽝... 다음엔 될 거야!")`,
        expectedOutput: `내 번호: [3, 15, 22, 31, 38, 44]\n당첨번호: [7, 15, 23, 31, 39, 45]\n일치: 2개\n꽝... 다음엔 될 거야!`
      }
    ]
  }
]

export function getUnitContent(unitId: number): UnitContent | undefined {
  return UNIT_CONTENTS.find(c => c.unitId === unitId)
}
