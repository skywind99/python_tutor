import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">🐍</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">파이썬 학습실</h1>
          <p className="text-lg text-gray-500">AI 튜터와 함께 단계별로 파이썬을 배워요<br/>힌트 없이 풀수록 더 많은 보석을 획득!</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {icon:"🎯",title:"15개 미션",desc:"기초부터 심화까지"},
            {icon:"💎",title:"AI 힌트",desc:"소크라테스식 피드백"},
            {icon:"🏆",title:"랭킹 시스템",desc:"반 친구들과 경쟁"},
          ].map(f=>(
            <div key={f.title} className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="font-semibold text-gray-800 text-sm">{f.title}</div>
              <div className="text-gray-400 text-xs mt-1">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* 튜토리얼 배너 */}
        <Link href="/tutorial"
          className="block w-full mb-5 rounded-2xl p-5 text-left transition-transform hover:scale-[1.01]"
          style={{background:'linear-gradient(135deg, #302B63 0%, #0F0C29 100%)'}}>
          <div className="flex items-center gap-4">
            <div className="text-4xl">🎙️</div>
            <div>
              <div className="text-xs text-purple-300 font-semibold mb-0.5">🆕 게임형 튜토리얼</div>
              <div className="text-white font-bold">슬기로운 방송부 생활</div>
              <div className="text-white/50 text-xs mt-0.5">파이썬 입문? 여기서 시작해요! 4개 미션 · 1,450 XP</div>
            </div>
            <div className="ml-auto text-white/40 text-xl">→</div>
          </div>
        </Link>

        <div className="flex gap-3 justify-center">
          <Link href="/login" className="px-8 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors">
            로그인
          </Link>
          <Link href="/register" className="px-8 py-3 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:bg-gray-50 transition-colors">
            회원가입
          </Link>
        </div>
      </div>
    </main>
  )
}
