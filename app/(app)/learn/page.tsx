'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { UNITS, MISSIONS, LEVEL_INFO } from '@/data/missions'
import { TUTORIAL_MISSIONS, TUTORIAL_PARTS } from '@/data/tutorial'
import dynamic from 'next/dynamic'

const DotLottie = dynamic(
  () => import('@lottiefiles/dotlottie-react').then(m => ({ default: m.DotLottieReact })),
  { ssr: false }
)

function StarBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {Array.from({ length: 60 }).map((_, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: 'white',
            opacity: Math.random() * 0.5 + 0.1,
          }} />
      ))}
    </div>
  )
}

export default function LearnPage() {
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set())
  const [showTutorial, setShowTutorial] = useState<Record<number, boolean>>(
    Object.fromEntries(TUTORIAL_PARTS.map(p => [p.part, true]))
  )
  const [customMissions, setCustomMissions] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/custom-missions').then(r => r.json()).then(d => setCustomMissions(d.missions || []))

    async function loadProgress() {
      const sb = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data: logs } = await sb.from('xp_logs').select('source_id')
        .eq('student_id', user.id).like('source_id', 'tutorial-%')
      if (logs) {
        setCompletedKeys(new Set(logs.map((l: any) => l.source_id.slice('tutorial-'.length))))
      }
    }
    loadProgress()
  }, [])

  const customByUnit = customMissions.reduce((acc, m) => {
    if (m.unit_id) acc[m.unit_id] = (acc[m.unit_id] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  function getMissionProgress(missionId: number) {
    const m = TUTORIAL_MISSIONS.find(tm => tm.id === missionId)
    if (!m) return { done: 0, total: 0 }
    const done = m.pages.filter(p => completedKeys.has(`${missionId}-${p.id}`)).length
    return { done, total: m.pages.length }
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(180deg, #080818 0%, #0c1428 50%, #080818 100%)' }}>
      <StarBg />

      <div className="relative z-10 max-w-6xl mx-auto px-5 py-8">

        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 flex-shrink-0">
            <DotLottie src="/lottie/animation/Live chatbot.lottie" loop autoplay />
          </div>
          <div>
            <div className="text-xs font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Python Study</div>
            <div className="text-2xl font-bold text-white tracking-tight">학습자료</div>
          </div>
        </div>

        {/* PART 섹션들 */}
        <div className="space-y-10">
          {TUTORIAL_PARTS.map(part => {
            const partUnits = UNITS.filter(u => Math.ceil(u.id / 2) === part.part)
            const tutorialMissions = TUTORIAL_MISSIONS.filter(m => part.missionIds.includes(m.id))
            const isShowing = showTutorial[part.part]

            if (part.comingSoon) {
              return (
                <div key={part.part} style={{ opacity: 0.3 }}>
                  <div className="flex items-center gap-3 px-1 mb-3">
                    <span>🔒</span>
                    <span className="text-xs font-bold text-white/50">PART {part.part}</span>
                    <span className="text-sm text-white/40">{part.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full text-white/30"
                      style={{ border: '1px solid rgba(255,255,255,0.1)' }}>준비중</span>
                  </div>
                  <div className="rounded-2xl p-5 flex items-center gap-4"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-3xl">{part.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold text-white/40">{part.description}</div>
                      <div className="text-xs text-white/20 mt-0.5">{part.unitRange}</div>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div key={part.part}>
                {/* PART 레이블 */}
                <div className="flex items-center gap-2 px-1 mb-3">
                  <span className="text-base">{part.emoji}</span>
                  <span className="text-xs font-bold" style={{ color: part.color }}>PART {part.part}</span>
                  <span className="text-sm font-semibold text-white/70">{part.title}</span>
                  <div className="flex-1 h-px ml-2" style={{ background: `${part.color}30` }} />
                </div>

                {/* 튜토리얼 섹션 */}
                <div className="rounded-2xl overflow-hidden mb-4"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${part.color}30` }}>

                  {/* 튜토리얼 헤더 */}
                  <div className="px-5 py-3.5 flex items-center justify-between"
                    style={{ borderBottom: isShowing ? `1px solid ${part.color}20` : 'none' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${part.color}20`, color: part.color }}>튜토리얼</span>
                      <span className="text-sm font-semibold text-white">
                        [PART {part.part}] {part.title}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowTutorial(p => ({ ...p, [part.part]: !p[part.part] }))}
                      className="text-xs px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5"
                      style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>
                      {isShowing ? (
                        <><span style={{ color: part.color }}>▲</span> 숨기기</>
                      ) : (
                        <><span style={{ color: part.color }}>▼</span> 튜토리얼 보기</>
                      )}
                    </button>
                  </div>

                  {/* 튜토리얼 미션 카드들 */}
                  {isShowing && (
                    <div className="p-4 grid grid-cols-2 gap-3">
                      {tutorialMissions.map(mission => {
                        const { done, total } = getMissionProgress(mission.id)
                        const allDone = total > 0 && done === total
                        return (
                          <Link key={mission.id} href={`/tutorial?part=${part.part}`}>
                            <div className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02]"
                              style={{
                                background: allDone ? `${part.color}15` : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${allDone ? part.color + '50' : 'rgba(255,255,255,0.08)'}`,
                              }}>
                              <div className="text-3xl mb-2">{mission.icon}</div>
                              <div className="text-sm font-bold text-white leading-tight">{mission.title}</div>
                              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{mission.subtitle}</div>
                              {/* 진행 도트 */}
                              <div className="flex gap-1 mt-2.5 flex-wrap">
                                {mission.pages.map(p => (
                                  <div key={p.id} className="w-2 h-2 rounded-full transition-all"
                                    style={{ background: completedKeys.has(`${mission.id}-${p.id}`) ? part.color : 'rgba(255,255,255,0.12)' }} />
                                ))}
                              </div>
                              <div className="text-xs mt-1.5" style={{ color: allDone ? part.color : 'rgba(255,255,255,0.25)' }}>
                                {allDone ? '✓ 완료' : `${done} / ${total} 완료`}
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* 단원 섹션 */}
                <div>
                  <div className="text-xs font-semibold px-1 mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    단원 목록 · {part.description}
                  </div>
                  <div className="space-y-3">
                    {partUnits.map(unit => {
                      const unitMissions = MISSIONS.filter(m => m.unitId === unit.id)
                      const levels = Array.from(new Set(unitMissions.map(m => m.level))) as (1|2|3)[]
                      const customCount = customByUnit[unit.id] || 0

                      return (
                        <div key={unit.id} className="rounded-2xl p-4"
                          style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                              style={{ background: `${part.color}25`, color: part.color, border: `1px solid ${part.color}40` }}>
                              {unit.id}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm">단원 {unit.id}. {unit.title}</div>
                              <div className="flex items-center gap-1 mt-0.5">
                                {levels.map(l => (
                                  <span key={l} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                    style={{ background: LEVEL_INFO[l].bg, color: LEVEL_INFO[l].text }}>
                                    {LEVEL_INFO[l].label}
                                  </span>
                                ))}
                                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                  {unitMissions.length}개 미션
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            {[
                              { href: `/learn/${unit.id}/concept`,  label: '📖 개념', bg: 'rgba(20,184,166,0.15)',  color: '#2dd4bf' },
                              { href: `/learn/${unit.id}/examples`, label: '💻 예제', bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa' },
                              { href: `/learn/${unit.id}/guided`,   label: '✏️ 연습', bg: 'rgba(139,92,246,0.15)', color: '#a78bfa' },
                              { href: `/learn/${unit.id}/missions`, label: '🎯 미션', bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
                              {
                                href: `/learn/${unit.id}/missions`,
                                label: '✨ 추가',
                                bg: customCount > 0 ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                                color: customCount > 0 ? '#818cf8' : 'rgba(255,255,255,0.2)',
                              },
                            ].map(btn => (
                              <Link key={btn.href + btn.label} href={btn.href}
                                className="text-center py-3 rounded-xl text-xs font-semibold transition-all hover:brightness-125"
                                style={{ background: btn.bg, color: btn.color }}>
                                {btn.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
