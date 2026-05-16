export type PageType = 'quiz' | 'fillblank' | 'multiblank'

export interface TutorialPage {
  id: number
  type: PageType
  questTitle: string
  vibeText: string
  context?: string
  // Quiz
  question?: string
  options?: string[]
  // Fill blank
  codeTemplate?: string // ___ 를 빈칸으로 표시
  blanks?: string[]     // 정답 배열
  blankLabels?: string[] // 빈칸 설명
  expectedOutput?: string
  // 힌트
  hint: string
  answer: string[]      // 정답 (소문자 trim 비교)
  successMsg: string
  xp: number
}

export interface Mission {
  id: number
  title: string
  subtitle: string
  icon: string
  color: string
  darkColor: string
  prologue: string
  pages: TutorialPage[]
}

export const TUTORIAL_MISSIONS: Mission[] = [
  {
    id: 1,
    title: '사연 자동 접수기',
    subtitle: '입력과 변수',
    icon: '📻',
    color: '#7C3AED',
    darkColor: '#5B21B6',
    prologue: `"끼이익-" 낡은 방송실 문을 열고 들어가자, 천장까지 쌓인 종이 사연 뭉치들이 당신을 반깁니다.\n\n당신은 치열한 오디션을 뚫고 선발된 신입 메인 PD! 그때, 방송실 구석의 낡은 모니터가 번쩍이며 홀로그램 AI 조수 바이브(VIBE)가 나타납니다.`,
    pages: [
      {
        id: 1,
        type: 'quiz',
        questTitle: '퀘스트 1-1. 마법의 주문을 찾아라!',
        vibeText: 'PD님! 학생들이 컴퓨터로 사연을 접수하게 하려면, 사용자의 타이핑을 "듣게" 만들어야 해요. 사용자의 입력을 받아들이는 파이썬 마법 주문(함수)을 찾아주세요!',
        question: '학생이 직접 이름과 신청곡을 키보드로 입력할 수 있게 해주는 파이썬 함수는 무엇일까요?',
        options: [
          'print()  — "화면에 출력해 줘!"',
          'input()  — "사용자의 입력을 받아 줘!"',
          'type()   — "이 데이터의 정체가 뭐야?"',
          'int()    — "숫자로 변환해 줘!"',
        ],
        hint: '💡 "안으로(in) 넣다(put)"라는 뜻을 가진 영단어를 생각해보세요!',
        answer: ['2', 'input()', 'input'],
        successMsg: '🎉 정답! input() 함수로 학생들의 타이핑을 받을 수 있어요!',
        xp: 100,
      },
      {
        id: 2,
        type: 'multiblank',
        questTitle: '퀘스트 1-2. 보물 상자에 이름표 붙이기!',
        vibeText: '정답입니다! 그런데 입력받은 이름과 신청곡을 어딘가에 보관해두지 않으면, 컴퓨터가 3초 만에 까먹고 말 거예요! 데이터를 담아둘 변수를 만들어주세요!',
        context: '"김파이"를 담을 상자 → name\n"밤양갱"을 담을 상자 → song',
        codeTemplate: `# 학생의 이름을 입력받아 저장합니다.
[___1___] = input("이름을 입력하세요: ")

# 학생의 신청곡을 입력받아 저장합니다.
[___2___] = input("신청곡을 입력하세요: ")`,
        blanks: ['name', 'song'],
        blankLabels: ['이름을 담을 변수 이름', '신청곡을 담을 변수 이름'],
        hint: '💡 "이름표 이름 = 저장할 내용" 형식으로 변수를 만들어요!',
        answer: ['name', 'song'],
        successMsg: '🎉 name과 song 상자에 데이터가 안전하게 보관됐어요!',
        xp: 100,
      },
      {
        id: 3,
        type: 'multiblank',
        questTitle: '퀘스트 1-3. 스피커로 방송하기!',
        vibeText: '완벽해요! 이제 접수가 잘 됐다고 화면에 안내 메시지를 띄워줄 차례입니다. f-string 스킬로 변수를 쏙 넣어 메시지를 출력해 보세요!',
        context: '출력 목표:\n[접수 완료] 김파이 학생이 신청하신 \'밤양갱\'이 선곡 목록에 추가되었습니다!',
        codeTemplate: `# 앞에서 저장한 변수들이 이미 준비되어 있어요.
# 이름은 ??? 변수에, 신청곡은 ??? 변수에 담겨 있습니다.

# f-string을 활용하여 완성된 문장을 출력합니다.
print(f"[접수 완료] {[___1___]} 학생이 신청하신 '{[___2___]}'이(가) 선곡 목록에 추가되었습니다!")`,
        blanks: ['name', 'song'],
        blankLabels: ['이름 변수', '신청곡 변수'],
        hint: '💡 f-string의 중괄호 {} 안에 변수 이름을 그대로 넣으면 돼요!',
        answer: ['name', 'song'],
        successMsg: '🎊 띠링! 사연 접수처가 성공적으로 오픈되었습니다. 경험치 +100!',
        xp: 100,
      },
    ],
  },

  {
    id: 2,
    title: '쉬는 시간을 지켜라!',
    subtitle: '연산자 마법',
    icon: '⏱️',
    color: '#DC2626',
    darkColor: '#991B1B',
    prologue: `"쾅!" 방송실 문이 거칠게 열립니다. 호랑이 학생부장 선생님입니다.\n\n"신입 PD! 앞으로 한 곡당 재생 시간은 무조건 180초 이하로 제한한다. 한 번만 더 넘기면 장비는 압수야!"\n\n🤖 바이브: "진정하세요, PD님. 파이썬 연산자 마법이 있습니다!"`,
    pages: [
      {
        id: 1,
        type: 'quiz',
        questTitle: '퀘스트 2-1. 시간의 마술사 (산술 연산자)',
        vibeText: '첫 번째 신청곡이 "4분 10초"라고 적혀 왔어요. 컴퓨터는 초(second) 단위로만 계산할 수 있어요. 4분 10초를 총 몇 초인지 계산하려면 어떤 기호를 써야 할까요?',
        question: '파이썬에서 곱하기와 더하기를 할 때 사용하는 올바른 기호의 짝은?',
        options: [
          'x  와  +',
          '*  와  +',
          'X  와  &',
          '*  와  and',
        ],
        hint: '💡 키보드 숫자 8 위에 있는 별표 모양을 잘 살펴보세요!',
        answer: ['2', '* 와 +', '*'],
        successMsg: '🎉 정답! 4 * 60 + 10 = 250초. 파이썬에서 곱하기는 * 기호를 써요!',
        xp: 150,
      },
      {
        id: 2,
        type: 'fillblank',
        questTitle: '퀘스트 2-2. 진실의 저울 (비교 연산자)',
        vibeText: '250초가 제한 시간 180초보다 짧은지 긴지, 컴퓨터의 "진실의 저울"에 올려봐야 합니다. 왼쪽 값이 오른쪽 값보다 "작거나 같은지" 확인하는 비교 연산자를 찾아주세요!',
        context: '크다/작다: > <  |  같다: ==  |  크거나같다/작거나같다: >= <=',
        codeTemplate: `song_time = 250   # FT아일랜드 노래의 총 길이(초)
limit_time = 180  # 학생부장 선생님의 제한 시간(초)

# 곡 길이가 제한 시간보다 "작거나 같은지" 비교하기!
is_safe = (song_time  [___]  limit_time)`,
        blanks: ['<='],
        blankLabels: ['비교 연산자 (작거나 같다)'],
        hint: '💡 "작거나 같다"는 < 와 = 를 합쳐서 표현해요!',
        answer: ['<='],
        successMsg: '🎉 정답! <= 연산자로 250 <= 180을 비교하면 False가 나와요!',
        xp: 150,
      },
      {
        id: 3,
        type: 'fillblank',
        questTitle: '퀘스트 2-3. 컴퓨터의 판결 듣기!',
        vibeText: '비교 연산자를 사용하면 컴퓨터는 True(참) 또는 False(거짓)로만 대답합니다. is_safe 변수에 담긴 판결을 화면에 출력해서 방송 가능 여부를 확인해 보세요!',
        context: '출력 목표:\n컴퓨터의 대답은? False',
        codeTemplate: `song_time = 250
limit_time = 180
is_safe = (song_time <= limit_time)

# is_safe 안에 들어있는 판결(True 또는 False)을 출력하기!
print("컴퓨터의 대답은?", [___] )`,
        blanks: ['is_safe'],
        blankLabels: ['출력할 변수 이름'],
        hint: '💡 저장된 변수 이름을 그대로 print() 안에 넣으면 값이 출력돼요!',
        answer: ['is_safe'],
        successMsg: '🎊 띠링! 자동 시간 판별기가 작동을 시작합니다. 경험치 +150!',
        xp: 150,
      },
    ],
  },

  {
    id: 3,
    title: '스마트한 선곡표!',
    subtitle: '조건문 분기',
    icon: '🎛️',
    color: '#059669',
    darkColor: '#065F46',
    prologue: `창밖을 보니 신청곡을 낸 학생이 방송실을 향해 간절한 눈빛을 보내고 있어요.\n무조건 안 된다고 자르기엔 마음이 약해집니다.\n\n🤖 바이브: "짧으면 다 틀어주고, 조금 길면 1절만, 너무 길면 거절하는 거죠! 조건 분기 마법을 사용할 때입니다!"`,
    pages: [
      {
        id: 1,
        type: 'quiz',
        questTitle: '퀘스트 3-1. 만약에 말이야 (if 와 else)',
        vibeText: '파이썬 마법서에서 가장 많이 쓰이는 주문입니다. "만약(If) ~라면 A를 하고, 그렇지 않으면(Else) B를 해라!" 아주 직관적인 영단어 두 개가 한 세트로 묶여 다닙니다.',
        question: '컴퓨터가 상황에 따라 다른 행동을 하도록 갈림길을 만들어주는 파이썬 키워드 짝꿍은?',
        options: [
          'for  와  in',
          'when  과  other',
          'if  와  else',
          'true  와  false',
        ],
        hint: '💡 "만약에~"를 영어로 번역하면?',
        answer: ['3', 'if 와 else', 'if'],
        successMsg: '🎉 정답! if와 else로 컴퓨터에게 갈림길을 만들어줄 수 있어요!',
        xp: 200,
      },
      {
        id: 2,
        type: 'multiblank',
        questTitle: '퀘스트 3-2. 세 가지 갈림길 (elif 등장)',
        vibeText: '갈림길이 두 개가 아니라 세 개가 필요합니다! 180초 이하면 "전곡", 300초 이하면 "1절만", 둘 다 아니면 "방송 불가". if와 else 사이에 끼워 넣는 마법의 연결 고리 "elif"를 써보세요!',
        codeTemplate: `song_time = 250

if song_time <= 180:
    print("전곡을 재생합니다.")
[___1___] song_time <= 300:
    print("시간이 부족해 1절만 재생합니다.")
[___2___]:
    print("너무 길어서 방송할 수 없습니다.")`,
        blanks: ['elif', 'else'],
        blankLabels: ['180초보단 길지만 300초 이하일 때', '위의 두 조건에 모두 해당하지 않을 때'],
        hint: '💡 elif = "else if"의 줄임말. else 뒤엔 조건 없이 바로 콜론(:)!',
        answer: ['elif', 'else'],
        successMsg: '🎉 완벽해요! if - elif - else 구조로 세 가지 상황을 처리할 수 있어요!',
        xp: 200,
      },
      {
        id: 3,
        type: 'quiz',
        questTitle: '퀘스트 3-3. 보이지 않는 규칙 (들여쓰기)',
        vibeText: '파이썬에는 아주 중요한 "보이지 않는 규칙"이 있습니다! if문에 속한 명령이라는 것을 컴퓨터에게 알려주려면, 코드의 시작 위치를 안쪽으로 쑥 밀어 넣어주어야 합니다. 이를 "들여쓰기"라고 해요!',
        question: '파이썬에서 들여쓰기를 할 때 키보드에서 누르는 가장 올바른 키는?',
        options: [
          'Enter 키',
          'Shift 키',
          'Tab 키  (또는 스페이스바 4번)',
          'Caps Lock 키',
        ],
        hint: '💡 글을 쓸 때 문단 시작을 띄어 쓰는 것처럼, 키보드 왼쪽 끝을 살펴보세요!',
        answer: ['3', 'Tab', 'tab'],
        successMsg: '🎊 띠링! 3단계 스마트 선곡 시스템이 완성되었습니다. 경험치 +200!',
        xp: 200,
      },
    ],
  },

  {
    id: 4,
    title: '멈추지 않는 점심시간!',
    subtitle: '반복문과 리스트',
    icon: '🔁',
    color: '#D97706',
    darkColor: '#92400E',
    prologue: `"아아- 마이크 테스트." 오늘 틀어야 할 노래만 무려 10곡.\n\n3분마다 다음 노래 재생 버튼을 누르려면 점심도 못 먹을 판입니다!\n\n🤖 바이브: "단순 반복 노동은 컴퓨터에게 맡기세요! 반복문 마법을 펼칠 시간입니다!"`,
    pages: [
      {
        id: 1,
        type: 'quiz',
        questTitle: '퀘스트 4-1. 빙글빙글 루프 마법!',
        vibeText: '"이 안에(in) 있는 것들을 하나씩 꺼내서(for) 반복해 줘!" 선곡표에서 컴퓨터가 알아서 노래를 하나씩 꺼내 재생하게 만들어야 합니다.',
        question: '묶음(리스트) 안의 데이터들을 하나씩 꺼내어 반복 작업을 시킬 때 사용하는 파이썬 키워드 짝꿍은?',
        options: [
          'if  와  else',
          'for  와  in',
          'start  와  stop',
          'while  과  break',
        ],
        hint: '💡 "너를 위해"를 영어로? 그리고 "~안에"를 영어로?',
        answer: ['2', 'for 와 in', 'for'],
        successMsg: '🎉 정답! for ~ in ~ 로 리스트에서 하나씩 꺼내 반복할 수 있어요!',
        xp: 500,
      },
      {
        id: 2,
        type: 'multiblank',
        questTitle: '퀘스트 4-2. 선곡표 기차 만들기!',
        vibeText: '여러 곡을 한 번에 담으려면 칸이 여러 개인 기차 모양의 보관함이 필요합니다. 대괄호 []로 만든 이 기차를 "리스트"라고 불러요! playlist에서 노래를 하나씩 꺼내 반복해 보세요.',
        codeTemplate: `# 3곡이 담긴 선곡표 리스트 기차
playlist = ["Supernova", "Love wins all", "Ditto"]

# playlist 안에서 노래를 하나씩 꺼내 song에 담아 반복!
[___1___] song [___2___] playlist:`,
        blanks: ['for', 'in'],
        blankLabels: ['반복 키워드', '~안에 키워드'],
        hint: '💡 for 변수 in 리스트: 형태로 작성해요!',
        answer: ['for', 'in'],
        successMsg: '🎉 for song in playlist: 완성! playlist에서 song을 하나씩 꺼내요!',
        xp: 500,
      },
      {
        id: 3,
        type: 'fillblank',
        questTitle: '퀘스트 4-3. 자동 재생 시작!',
        vibeText: '마지막 관문! for 루프가 playlist에서 노래를 꺼낼 때마다, 그 노래는 song 변수에 담겨요. 이제 print 안에 그 변수를 넣어서 화면에 출력해 보세요!',
        context: '출력 목표:\n🎵 지금 재생 중인 곡: Supernova\n🎵 지금 재생 중인 곡: Love wins all\n🎵 지금 재생 중인 곡: Ditto',
        codeTemplate: `playlist = ["Supernova", "Love wins all", "Ditto"]

for song in playlist:
    print("🎵 지금 재생 중인 곡:", [___])`,
        blanks: ['song'],
        blankLabels: ['꺼낸 노래가 담긴 변수 이름'],
        hint: '💡 for song in playlist: 에서 꺼낸 노래는 어느 변수에 담겼나요?',
        answer: ['song'],
        successMsg: '🎊 만세!! 점심시간 자동 재생 시스템 구축 완료! 최종 경험치 +500! 당신은 진정한 마스터 PD입니다!',
        xp: 500,
      },
    ],
  },
]
