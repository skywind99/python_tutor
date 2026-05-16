'use client'
import { useParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { UNITS } from '@/data/missions'
import { UNIT_GUIDED } from '@/data/guided'
import { createBrowserClient } from '@supabase/ssr'

function getClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export default function GuidedPage() {
  const params = useParams()
  const unitId = Number(params.unitId)
  const unit = UNITS.find(u => u.id === unitId)
  const guided = UNIT_GUIDED.find(g => g.unitId === unitId)

  const [exIdx, setExIdx] = useState(0)
  const [inputs, setInputs] = useState<string[]>([])
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [done, setDone] = useState(false)
  const [earnedXP, setEarnedXP] = useState(0)
  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set())
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    async function init() {
      const sb = getClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      userIdRef.current = user.id

      // 기존에 완료한 문제 로드
      const { data: logs } = await sb.from('xp_logs')
        .select('source_id, xp')
        .eq('student_id', user.id)
        .like('source_id', `guided-${unitId}-%`)
      if (logs && logs.length > 0) {
        const earned = new Set(logs.map((l: any) => parseInt(l.source_id.split('-')[2])))
        setCompletedSet(earned)
        setEarnedXP(logs.reduce((s: number, l: any) => s + (l.xp || 0), 0))
      }
    }
    init()
  }, [unitId])

  if (!unit || !guided) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">단원을 찾을 수 없어요</div>
  )

  const exercises = guided.exercises
  const ex = exercises[exIdx]
  const totalBlanks = (ex.codeTemplate.match(/\[___\]/g) || []).length

  function parseTemplate(template: string) {
    const parts = template.split('[___]')
    const elements: JSX.Element[] = []
    let blankIdx = 0

    parts.forEach((part, i) => {
      if (part) {
        elements.push(
          <span key={`txt-${i}`} className="font-mono text-sm whitespace-pre text-green-400">
            {part}
          </span>
        )
      }
      if (i < parts.length - 1) {
        const currentIdx = blankIdx
        const isCorrect = checked && correct
        const isWrong = checked && !correct && inputs[currentIdx]

        elements.push(
          <input
            key={`inp-${i}`}
            value={inputs[currentIdx] || ''}
            onChange={e => {
              setInputs(prev => {
                const n = [...prev]
                n[currentIdx] = e.target.value
                return n
              })
              setChecked(false)
            }}
            onKeyDown={e => { if (e.key === 'Enter') checkAnswer() }}
            placeholder={ex.blankLabels?.[currentIdx] || '???'}
            disabled={isCorrect}
            className={`inline-block font-mono text-sm px-2 py-0.5 rounded border outline-none transition-all mx-1 ${
              isCorrect
                ? 'bg-teal-50 border-teal-400 text-teal-700'
                : isWrong
                ? 'bg-red-50 border-red-400 text-red-700'
                : 'bg-white border-blue-300 focus:border-blue-500 text-gray-900'
            }`}
            style={{ width: Math.max(80, ((inputs[currentIdx]?.length || ex.blankLabels?.[currentIdx]?.length || 4) * 10) + 24) + 'px' }}
          />
        )
        blankIdx++
      }
    })

    return elements
  }

  async function checkAnswer() {
    const allCorrect = ex.answer.every((ans, i) => (inputs[i] || '').trim() === ans)
    setChecked(true)
    setCorrect(allCorrect)

    if (allCorrect && !completedSet.has(exIdx)) {
      const xp = showHint ? 5 : 10
      setEarnedXP(prev => prev + xp)
      setCompletedSet(prev => new Set([...prev, exIdx]))

      // Supabase에 XP 저장
      if (userIdRef.current) {
        const sb = getClient()
        await sb.from('xp_logs').upsert({
          student_id: userIdRef.current,
          source_id: `guided-${unitId}-${exIdx}`,
          xp
        }, { onConflict: 'student_id,source_id', ignoreDuplicates: true })
      }
    }
  }

  function nextExercise() {
    if (exIdx + 1 >= exercises.length) {
      setDone(true)
    } else {
      setExIdx(exIdx + 1)
      setInputs([])
      setChecked(false)
      setCorrect(false)
      setShowHint(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">연습 완료!</h2>
          <p className="text-gray-500 text-sm mb-6">
            단원 {unitId} 빈칸 채우기를 모두 마쳤어요.<br/>
            이제 미션에 도전해볼 준비가 됐어요!
          </p>
          <div className="bg-teal-50 rounded-xl p-4 mb-6">
            <div className="text-2xl font-bold text-teal-700">+{earnedXP} XP</div>
            <div className="text-xs text-teal-500 mt-0.5">획득한 경험치 (대시보드에 반영돼요)</div>
          </div>
          <Link href={`/learn/${unitId}/missions`}
            className="block w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors mb-3">
            🎯 미션 도전하러 가기
          </Link>
          <Link href="/learn"
            className="block w-full py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm">
            ← 단원 목록으로
          </Link>
        </div>
      </div>
    )
  }

  const progress = ((exIdx) / exercises.length) * 100
  const alreadyDone = completedSet.has(exIdx)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 + 탭 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/learn" className="text-gray-400 hover:text-gray-600 text-sm">← 단원 목록</Link>
            <span className="text-gray-200">|</span>
            <span className="font-semibold text-gray-900 text-sm">단원 {unitId}: {unit.title}</span>
          </div>
          <div className="flex rounded-xl overflow-hidden border border-gray-100 bg-gray-50 text-xs">
            <Link href={`/learn/${unitId}/concept`} className="px-3 py-2 text-gray-400 hover:text-gray-600">📖 개념</Link>
            <Link href={`/learn/${unitId}/examples`} className="px-3 py-2 text-gray-400 hover:text-gray-600">💻 예제</Link>
            <span className="px-3 py-2 bg-white text-gray-900 shadow-sm font-medium">✏️ 연습</span>
            <Link href={`/learn/${unitId}/missions`} className="px-3 py-2 text-gray-400 hover:text-gray-600">🎯 미션</Link>
            <Link href={`/learn/${unitId}/custom-missions`} className="px-3 py-2 text-gray-400 hover:text-gray-600">✨ 추가</Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {/* 진행도 */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">{exIdx + 1} / {exercises.length}</span>
        </div>

        {/* 문제 카드 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="text-xs text-blue-500 font-semibold">연습 {exIdx + 1}</div>
                {alreadyDone && (
                  <span className="text-xs bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded-full font-medium">✓ 완료</span>
                )}
              </div>
              <h2 className="font-bold text-gray-900">{ex.title}</h2>
            </div>
            <div className="flex items-center gap-1">
              {exercises.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
                  completedSet.has(i) ? 'bg-teal-400' : i === exIdx ? 'bg-blue-500' : 'bg-gray-200'
                }`} />
              ))}
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* 설명 */}
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-line">{ex.description}</p>
            </div>

            {/* 코드 빈칸 */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 px-4 py-2 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="text-xs text-gray-400 font-mono ml-2">Python</span>
              </div>
              <div className="bg-gray-950 px-5 py-4 leading-8">
                {parseTemplate(ex.codeTemplate)}
              </div>
            </div>

            {/* 힌트 */}
            <div>
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors">
                💡 {showHint ? '힌트 숨기기' : `힌트 보기 (${alreadyDone ? '이미 완료' : '-5 XP'})`}
              </button>
              {showHint && (
                <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <p className="text-sm text-amber-800">{ex.hint}</p>
                </div>
              )}
            </div>

            {/* 정답 확인 결과 */}
            {checked && (
              <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
                correct ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {correct
                  ? `✅ ${ex.successMsg}${!alreadyDone ? (showHint ? ' (+5 XP)' : ' (+10 XP)') : ''}`
                  : '❌ 아직 틀렸어요. 다시 생각해보세요!'}
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3">
              {!correct ? (
                <button
                  onClick={checkAnswer}
                  disabled={inputs.filter(Boolean).length < totalBlanks}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  정답 확인
                </button>
              ) : (
                <button
                  onClick={nextExercise}
                  className="flex-1 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 transition-colors animate-pulse">
                  {exIdx + 1 >= exercises.length ? '완료하기 🎉' : '다음 문제 →'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 하단 안내 */}
        <p className="text-xs text-gray-400 text-center">
          Enter 키로 정답을 확인할 수 있어요. 힌트를 사용하면 XP가 줄어요!
        </p>
      </div>
    </div>
  )
}
