'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { TUTORIAL_MISSIONS, TUTORIAL_PARTS, type Mission, type TutorialPage } from '@/data/tutorial'

function getClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// ── 타입 ──────────────────────────────────
type Screen = 'map' | 'prologue' | 'mission'

// ── 유틸 ──────────────────────────────────
function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, '')
}

// ── 서브 컴포넌트: 선택지 퀴즈 ─────────────
function QuizPage({ page, onPass }: { page: TutorialPage; onPass: () => void }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)

  const check = () => {
    if (selected === null) return
    setChecked(true)
  }

  const isCorrect = checked && selected !== null && page.answer.some(a =>
    normalize(a) === normalize(String(selected + 1)) ||
    normalize(a) === normalize(page.options?.[selected] || '')
  )

  return (
    <div className="space-y-5">
      <p className="text-white/90 leading-relaxed text-sm">{page.question}</p>
      <div className="space-y-2">
        {page.options?.map((opt, i) => {
          let bg = 'bg-white/10 border-white/20 hover:bg-white/20'
          if (checked) {
            const correct = page.answer.some(a =>
              normalize(a) === normalize(String(i + 1)) ||
              normalize(a) === normalize(opt || '')
            )
            if (correct) bg = 'bg-green-500/30 border-green-400'
            else if (i === selected) bg = 'bg-red-500/30 border-red-400'
            else bg = 'bg-white/5 border-white/10 opacity-50'
          } else if (selected === i) {
            bg = 'bg-white/25 border-white/60'
          }
          return (
            <button key={i} onClick={() => !checked && setSelected(i)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm text-white font-medium transition-all ${bg}`}>
              <span className="text-white/50 mr-3 font-mono">{'①②③④'[i]}</span>
              {opt}
            </button>
          )
        })}
      </div>
      {!checked ? (
        <div className="space-y-2">
          <button onClick={check} disabled={selected === null}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
            style={{ background: selected !== null ? '#fff' : 'rgba(255,255,255,0.2)', color: '#1F2937' }}>
            확인하기 ✓
          </button>
          <details className="text-xs text-white/40">
            <summary className="cursor-pointer hover:text-white/60">💡 힌트 보기</summary>
            <p className="mt-2 text-white/70 bg-white/10 rounded-lg p-3">{page.hint}</p>
          </details>
        </div>
      ) : (
        <div className={`rounded-xl p-4 ${isCorrect ? 'bg-green-500/20 border border-green-400/50' : 'bg-red-500/20 border border-red-400/50'}`}>
          <p className="text-sm font-bold mb-2">{isCorrect ? page.successMsg : '아쉬워요! 다시 도전해볼까요?'}</p>
          {isCorrect ? (
            <button onClick={onPass}
              className="w-full py-2.5 rounded-lg text-sm font-bold bg-white text-gray-900 hover:bg-gray-100 transition-colors mt-2">
              다음 퀘스트로 → (+{page.xp} XP)
            </button>
          ) : (
            <button onClick={() => { setSelected(null); setChecked(false) }}
              className="w-full py-2.5 rounded-lg text-sm font-bold bg-white/20 text-white hover:bg-white/30 transition-colors mt-2">
              다시 시도
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── 서브 컴포넌트: 빈칸 채우기 ─────────────
function FillBlankPage({ page, onPass }: { page: TutorialPage; onPass: () => void }) {
  const blanksCount = page.blanks?.length || 1
  const [inputs, setInputs] = useState<string[]>(Array(blanksCount).fill(''))
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(false)

  const check = () => {
    if (inputs.some(i => !i.trim())) return
    let ok = true
    if (page.type === 'fillblank') {
      // Single blank - check against answer array
      ok = page.answer.some(a => normalize(a) === normalize(inputs[0]))
    } else {
      // Multi blank - each input must match corresponding answer
      for (let i = 0; i < blanksCount; i++) {
        if (normalize(inputs[i]) !== normalize(page.answer[i] || '')) { ok = false; break }
      }
    }
    setCorrect(ok)
    setChecked(true)
  }

  // Render code with blanks as inputs
  const renderCode = () => {
    if (!page.codeTemplate) return null
    let blankIdx = 0
    const parts = page.codeTemplate.split(/\[___(?:\d+___)?\]/)
    return parts.map((part, i) => {
      const currentIdx = blankIdx
      const inputEl = i < parts.length - 1 ? (
        <input key={`inp-${i}`}
          value={inputs[currentIdx] || ''}
          onChange={e => {
            setInputs(prev => { const n = [...prev]; n[currentIdx] = e.target.value; return n })
            setChecked(false)
          }}
          className="inline-block font-mono text-sm px-2 py-0.5 rounded border min-w-16 text-center outline-none transition-colors"
          style={{
            background: checked ? (correct ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)') : 'rgba(255,255,255,0.2)',
            borderColor: checked ? (correct ? '#4ade80' : '#f87171') : 'rgba(255,255,255,0.4)',
            color: '#fff',
            width: Math.max(80, (inputs[currentIdx]?.length || 4) * 10 + 20) + 'px',
          }}
          placeholder={page.blankLabels?.[currentIdx] || '???'}
          disabled={checked && correct}
        />
      ) : null
      blankIdx++
      return [
        <span key={`part-${i}`} className="whitespace-pre-wrap">{part}</span>,
        inputEl
      ]
    })
  }

  return (
    <div className="space-y-4">
      {page.context && (
        <div className="bg-white/10 rounded-xl p-3 text-xs text-white/70 whitespace-pre-wrap">{page.context}</div>
      )}
      <div className="bg-gray-900/70 rounded-xl p-4 overflow-x-auto">
        <div className="font-mono text-sm text-green-400 leading-7">{renderCode()}</div>
      </div>
      {!checked || !correct ? (
        <div className="space-y-2">
          <button onClick={check} disabled={inputs.some(i => !i.trim())}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.9)', color: '#1F2937' }}>
            제출하기 ✓
          </button>
          <details className="text-xs text-white/40">
            <summary className="cursor-pointer hover:text-white/60">💡 힌트 보기</summary>
            <p className="mt-2 text-white/70 bg-white/10 rounded-lg p-3">{page.hint}</p>
          </details>
        </div>
      ) : null}
      {checked && (
        <div className={`rounded-xl p-4 ${correct ? 'bg-green-500/20 border border-green-400/50' : 'bg-red-500/20 border border-red-400/50'}`}>
          <p className="text-sm font-bold mb-2">{correct ? page.successMsg : '아쉬워요! 정답을 확인하고 다시 시도해봐요!'}</p>
          {correct ? (
            <button onClick={onPass}
              className="w-full py-2.5 rounded-lg text-sm font-bold bg-white text-gray-900 hover:bg-gray-100 transition-colors mt-2">
              다음 퀘스트로 → (+{page.xp} XP)
            </button>
          ) : (
            <button onClick={() => { setInputs(Array(blanksCount).fill('')); setChecked(false) }}
              className="w-full py-2.5 rounded-lg text-sm font-bold bg-white/20 text-white hover:bg-white/30 transition-colors mt-2">
              다시 시도
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── 메인 컴포넌트 ──────────────────────────
export default function TutorialPage() {
  const [screen, setScreen] = useState<Screen>('map')
  const [selectedPart, setSelectedPart] = useState(1)
  const [currentMission, setCurrentMission] = useState<Mission | null>(null)
  const [pageIdx, setPageIdx] = useState(0)
  const [completedPages, setCompletedPages] = useState<Set<string>>(new Set())
  const [totalXP, setTotalXP] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const savingRef = useRef(false)

  const totalPages = TUTORIAL_MISSIONS.reduce((s, m) => s + m.pages.length, 0)
  const completedCount = completedPages.size

  // 로그인된 경우 기존 진행도 로드
  useEffect(() => {
    async function loadProgress() {
      const sb = getClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: logs } = await sb.from('xp_logs')
        .select('source_id, xp')
        .eq('student_id', user.id)
        .like('source_id', 'tutorial-%')

      if (logs && logs.length > 0) {
        // source_id 형식: tutorial-{missionId}-{pageId}
        const keys = new Set(logs.map(l => l.source_id.slice('tutorial-'.length)))
        setCompletedPages(keys)
        setTotalXP(logs.reduce((s, l) => s + (l.xp || 0), 0))
      }
    }
    loadProgress()
  }, [])

  function startMission(mission: Mission) {
    setCurrentMission(mission)
    setPageIdx(0)
    setScreen('prologue')
  }

  async function onPassPage() {
    if (!currentMission) return
    const page = currentMission.pages[pageIdx]
    const key = `${currentMission.id}-${page.id}`

    if (!completedPages.has(key)) {
      setCompletedPages(prev => new Set([...prev, key]))
      setTotalXP(prev => prev + page.xp)

      // 로그인된 경우 DB에 저장
      if (userId && !savingRef.current) {
        savingRef.current = true
        try {
          const sb = getClient()
          await sb.from('xp_logs').upsert({
            student_id: userId,
            source_id: `tutorial-${key}`,
            xp: page.xp,
          }, { onConflict: 'student_id,source_id', ignoreDuplicates: true })
        } finally {
          savingRef.current = false
        }
      }
    }

    if (pageIdx < currentMission.pages.length - 1) {
      setPageIdx(pageIdx + 1)
    } else {
      setShowComplete(true)
    }
  }

  function isMissionDone(mission: Mission) {
    return mission.pages.every(p => completedPages.has(`${mission.id}-${p.id}`))
  }

  function getMissionProgress(mission: Mission) {
    return mission.pages.filter(p => completedPages.has(`${mission.id}-${p.id}`)).length
  }

  // ── 미션 맵 화면 ──────────────────────────
  if (screen === 'map') {
    const currentPart = TUTORIAL_PARTS.find(p => p.part === selectedPart)!
    const partMissions = TUTORIAL_MISSIONS.filter(m => currentPart.missionIds.includes(m.id))
    const partCompleted = partMissions.every(m => isMissionDone(m))

    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243E 100%)' }}>
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between">
          <Link href={userId ? "/learn" : "/"} className="text-white/50 hover:text-white text-sm transition-colors">
            {userId ? "← 학습으로" : "← 홈으로"}
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-xs text-white/50">{completedCount}/{totalPages} 완료</div>
            <div className="bg-yellow-500/20 text-yellow-300 text-xs font-bold px-3 py-1 rounded-full border border-yellow-500/30">
              ⚡ {totalXP.toLocaleString()} XP
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 pb-10">
          {/* Title */}
          <div className="text-center mb-8 pt-4">
            <div className="text-4xl mb-3">🎙️</div>
            <h1 className="text-2xl font-black text-white mb-1">슬기로운 방송부 생활</h1>
            <p className="text-white/40 text-xs">파이썬 자동화 대작전</p>
          </div>

          {/* PART 탭 */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {TUTORIAL_PARTS.map(part => {
              const pMissions = TUTORIAL_MISSIONS.filter(m => part.missionIds.includes(m.id))
              const pDone = !part.comingSoon && pMissions.length > 0 && pMissions.every(m => isMissionDone(m))
              const isActive = selectedPart === part.part
              return (
                <button key={part.part} onClick={() => setSelectedPart(part.part)}
                  className="rounded-xl p-2.5 text-center transition-all border"
                  style={{
                    background: isActive ? `${part.color}30` : 'rgba(255,255,255,0.05)',
                    borderColor: isActive ? part.color : 'rgba(255,255,255,0.1)',
                  }}>
                  <div className="text-xl mb-1">{pDone ? '✅' : part.comingSoon ? '🔒' : part.emoji}</div>
                  <div className="text-xs font-bold text-white/80" style={{ color: isActive ? '#fff' : undefined }}>
                    PART {part.part}
                  </div>
                  <div className="text-xs text-white/40 mt-0.5 leading-tight">{part.description}</div>
                </button>
              )
            })}
          </div>

          {/* 선택된 PART 정보 */}
          <div className="rounded-2xl border mb-5 px-5 py-4"
            style={{ background: `${currentPart.color}15`, borderColor: `${currentPart.color}40` }}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{currentPart.emoji}</div>
              <div>
                <div className="text-xs text-white/40 mb-0.5">{currentPart.unitRange} · {currentPart.description}</div>
                <div className="font-bold text-white text-base">PART {currentPart.part}. {currentPart.title}</div>
              </div>
              {partCompleted && (
                <div className="ml-auto text-xs font-bold text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded-full">✓ 완료</div>
              )}
            </div>
          </div>

          {/* PART 콘텐츠 */}
          {currentPart.comingSoon ? (
            <div className="text-center py-16 rounded-2xl border border-white/10" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-5xl mb-4">{currentPart.emoji}</div>
              <p className="text-white/50 font-bold text-base mb-1">준비 중이에요!</p>
              <p className="text-white/30 text-sm">단원 {currentPart.unitRange.replace('단원 ', '')} 학습 후 공개 예정</p>
            </div>
          ) : (
            <div className="space-y-4">
              {partMissions.map((mission, idx) => {
                const done = isMissionDone(mission)
                const progress = getMissionProgress(mission)
                const prevMission = partMissions[idx - 1]
                const locked = idx > 0 && prevMission && !isMissionDone(prevMission)

                return (
                  <div key={mission.id} className={`rounded-2xl border overflow-hidden transition-all ${
                    locked ? 'opacity-50' : 'hover:scale-[1.01]'
                  }`} style={{ borderColor: done ? mission.color : 'rgba(255,255,255,0.1)', background: done ? `${mission.color}20` : 'rgba(255,255,255,0.05)' }}>
                    <div className="p-5 flex items-center gap-5">
                      <div className="text-4xl w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${mission.color}30`, border: `2px solid ${mission.color}50` }}>
                        {done ? '✅' : locked ? '🔒' : mission.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                            style={{ background: mission.color }}>미션 {mission.id}</span>
                          <span className="text-xs text-white/40">{mission.subtitle}</span>
                        </div>
                        <h3 className="font-bold text-white text-base">{mission.title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex gap-1">
                            {mission.pages.map((p, pi) => (
                              <div key={pi} className="w-4 h-4 rounded-full border"
                                style={{
                                  background: completedPages.has(`${mission.id}-${p.id}`) ? mission.color : 'transparent',
                                  borderColor: completedPages.has(`${mission.id}-${p.id}`) ? mission.color : 'rgba(255,255,255,0.2)'
                                }} />
                            ))}
                          </div>
                          <span className="text-xs text-white/40">{progress}/{mission.pages.length}페이지</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xs text-white/40">
                          +{mission.pages.reduce((s, p) => s + p.xp, 0)} XP
                        </div>
                        {!locked && (
                          <button onClick={() => startMission(mission)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors"
                            style={{ background: done ? mission.darkColor : mission.color }}>
                            {done ? '다시 하기' : progress > 0 ? '이어하기 →' : '시작 →'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {completedCount === totalPages && (
            <div className="mt-8 text-center p-6 rounded-2xl border" style={{background:'rgba(234,179,8,0.1)',borderColor:'rgba(234,179,8,0.3)'}}>
              <div className="text-4xl mb-3">🏆</div>
              <h2 className="text-xl font-black text-yellow-300 mb-1">전체 클리어!</h2>
              <p className="text-white/60 text-sm mb-4">당신은 진정한 마스터 PD입니다!</p>
              {!userId && (
                <p className="text-yellow-300/70 text-xs mb-3">💡 로그인하면 XP가 계정에 저장돼요!</p>
              )}
              <Link href={userId ? "/learn" : "/login"}
                className="inline-block px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-300 transition-colors text-sm">
                {userId ? "이제 미션 풀러 가기 🎯" : "로그인하고 이어하기 →"}
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── 프롤로그 화면 ──────────────────────────
  if (screen === 'prologue' && currentMission) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: `linear-gradient(135deg, ${currentMission.darkColor} 0%, #0F0C29 100%)` }}>
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{currentMission.icon}</div>
            <div className="text-white/50 text-sm mb-2">미션 {currentMission.id}</div>
            <h2 className="text-2xl font-black text-white">{currentMission.title}</h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                📰
              </div>
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{currentMission.prologue}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setScreen('map')}
              className="flex-1 py-3 rounded-xl text-sm text-white/60 border border-white/20 hover:bg-white/10 transition-colors">
              ← 지도로
            </button>
            <button onClick={() => setScreen('mission')}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-colors"
              style={{ background: currentMission.color }}>
              퀘스트 시작! ⚔️
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 미션 퀘스트 화면 ──────────────────────
  if (screen === 'mission' && currentMission) {
    const page = currentMission.pages[pageIdx]

    return (
      <div className="min-h-screen"
        style={{ background: `linear-gradient(135deg, ${currentMission.darkColor} 0%, #0F0C29 100%)` }}>
        {/* Top bar */}
        <div className="px-5 py-3 flex items-center gap-4">
          <button onClick={() => setScreen('map')} className="text-white/40 hover:text-white transition-colors text-sm">
            ← 지도
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {currentMission.pages.map((_, i) => (
                <div key={i} className="h-1.5 flex-1 rounded-full transition-all"
                  style={{
                    background: i < pageIdx ? currentMission.color :
                      i === pageIdx ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'
                  }} />
              ))}
            </div>
            <div className="text-xs text-white/40">{pageIdx + 1} / {currentMission.pages.length} 페이지</div>
          </div>
          <div className="text-xs text-yellow-300 font-bold">⚡ {totalXP} XP</div>
        </div>

        <div className="max-w-xl mx-auto px-5 pb-10">
          {/* Quest title */}
          <div className="mb-4">
            <span className="text-xs font-semibold px-2 py-1 rounded-full text-white"
              style={{ background: currentMission.color }}>
              {currentMission.icon} 미션 {currentMission.id}
            </span>
            <h2 className="font-bold text-white text-lg mt-2">{page.questTitle}</h2>
          </div>

          {/* VIBE dialogue */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-4 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-lg flex-shrink-0">🤖</div>
              <div>
                <div className="text-xs text-purple-300 font-semibold mb-1">바이브 (VIBE)</div>
                <p className="text-sm text-white/85 leading-relaxed">{page.vibeText}</p>
              </div>
            </div>
          </div>

          {/* Interactive content */}
          {page.type === 'quiz' && <QuizPage key={page.id} page={page} onPass={onPassPage} />}
          {(page.type === 'fillblank' || page.type === 'multiblank') && <FillBlankPage key={page.id} page={page} onPass={onPassPage} />}
        </div>

        {/* Mission complete modal */}
        {showComplete && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
            <div className="bg-gray-900 rounded-3xl p-8 max-w-sm w-full text-center border border-yellow-500/30">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-black text-white mb-2">미션 완료!</h2>
              <p className="text-white/60 text-sm mb-1">{currentMission.title}</p>
              <div className="text-yellow-300 font-bold text-lg mb-6">
                +{currentMission.pages.reduce((s, p) => s + p.xp, 0)} XP 획득!
              </div>
              <div className="flex flex-col gap-3">
                {currentMission.id < TUTORIAL_MISSIONS.length ? (
                  <button onClick={() => {
                    const next = TUTORIAL_MISSIONS[currentMission.id]
                    setShowComplete(false)
                    startMission(next)
                  }} className="py-3 rounded-xl font-bold text-white text-sm"
                    style={{ background: TUTORIAL_MISSIONS[currentMission.id]?.color || '#7C3AED' }}>
                    다음 미션 시작! →
                  </button>
                ) : (
                  <Link href="/learn" onClick={() => setShowComplete(false)}
                    className="py-3 rounded-xl font-bold text-gray-900 text-sm bg-yellow-400 hover:bg-yellow-300 transition-colors block">
                    미션 풀러 가기 🎯
                  </Link>
                )}
                <button onClick={() => { setShowComplete(false); setScreen('map') }}
                  className="py-2 rounded-xl text-white/50 hover:text-white text-sm transition-colors">
                  지도로 돌아가기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}
