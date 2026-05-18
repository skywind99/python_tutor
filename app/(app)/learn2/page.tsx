'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { UNITS, MISSIONS, LEVEL_INFO } from '@/data/missions'
import { TUTORIAL_MISSIONS, TUTORIAL_PARTS } from '@/data/tutorial'

const TUTORIAL_TOTAL_PAGES = TUTORIAL_MISSIONS.reduce((s, m) => s + m.pages.length, 0)

export default function Learn2Page() {
  const [customMissions, setCustomMissions] = useState<any[]>([])
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/custom-missions').then(r => r.json()).then(d => setCustomMissions(d.missions || []))

    async function loadTutorial() {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data: logs } = await sb.from('xp_logs').select('source_id')
        .eq('student_id', user.id).like('source_id', 'tutorial-%')
      if (logs) {
        const keys = new Set(logs.map((l: any) => l.source_id.slice('tutorial-'.length)))
        setCompletedKeys(keys)
      }
    }
    loadTutorial()
  }, [])

  function getPartProgress(partMissionIds: number[]) {
    const missions = TUTORIAL_MISSIONS.filter(m => partMissionIds.includes(m.id))
    const done = missions.reduce((s, m) => s + m.pages.filter(p => completedKeys.has(`${m.id}-${p.id}`)).length, 0)
    const total = missions.reduce((s, m) => s + m.pages.length, 0)
    return { done, total }
  }

  const tutorialDone = completedKeys.size

  const customByUnit = customMissions.reduce((acc, m) => {
    if (m.unit_id) acc[m.unit_id] = (acc[m.unit_id] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">📚 단원별 학습</h1>
          <p className="text-sm text-gray-400 mt-0.5">개념 · 예제 · 연습 · 미션 순서로 학습해요</p>
        </div>
      </div>

      {/* 튜토리얼 카드 */}
      <Link href="/tutorial" className="block mb-4">
        <div className="rounded-2xl p-4 hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #302B63 0%, #24243E 100%)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)' }}>
              🎙️
            </div>
            <div className="flex-1">
              <div className="font-bold text-white text-sm">슬기로운 방송부 생활</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                스토리로 배우는 파이썬 · 단원 전에 먼저!
              </div>
            </div>
            {tutorialDone >= TUTORIAL_TOTAL_PAGES
              ? <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>✓ 완주!</span>
              : <div className="text-white/30 text-sm">→</div>
            }
          </div>
          {/* PART별 진행도 */}
          <div className="grid grid-cols-4 gap-2">
            {TUTORIAL_PARTS.map(part => {
              const { done, total } = getPartProgress(part.missionIds)
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              const allDone = total > 0 && done === total
              return (
                <div key={part.part} className="rounded-xl p-2 text-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${allDone ? part.color : 'rgba(255,255,255,0.08)'}` }}>
                  <div className="text-base mb-1">{allDone ? '✅' : part.comingSoon ? '🔒' : part.emoji}</div>
                  <div className="text-xs font-bold text-white/60">PART {part.part}</div>
                  {!part.comingSoon && (
                    <>
                      <div className="h-1 rounded-full mt-1.5 mb-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: part.color }} />
                      </div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{done}/{total}</div>
                    </>
                  )}
                  {part.comingSoon && (
                    <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>준비중</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-5">
        {TUTORIAL_PARTS.map(part => {
          const partUnits = UNITS.filter(u => Math.ceil(u.id / 2) === part.part)
          if (partUnits.length === 0) return null
          return (
            <div key={part.part}>
              {/* PART 헤더 */}
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-base">{part.comingSoon ? '🔒' : part.emoji}</span>
                  <span className="text-xs font-bold text-gray-500">PART {part.part}</span>
                  <span className="text-sm font-bold text-gray-700">{part.title}</span>
                  <span className="text-xs text-gray-400">· {part.description}</span>
                </div>
                {!part.comingSoon && (
                  <Link href={`/tutorial?part=${part.part}`}
                    className="text-xs font-semibold px-3 py-1 rounded-full transition-colors hover:opacity-80"
                    style={{ background: `${part.color}18`, color: part.color, border: `1px solid ${part.color}40` }}>
                    {part.emoji} 튜토리얼 보기
                  </Link>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {partUnits.map((unit) => {
                  const globalIdx = UNITS.findIndex(u => u.id === unit.id)
                  const unitMissions = MISSIONS.filter(m => m.unitId === unit.id)
                  const levels = Array.from(new Set(unitMissions.map(m => m.level))) as (1|2|3)[]
                  const customCount = customByUnit[unit.id] || 0

                  return (
                    <div key={unit.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
                          {globalIdx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900">{unit.title}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {levels.map(l => (
                              <span key={l} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                style={{ background: LEVEL_INFO[l].bg, color: LEVEL_INFO[l].text }}>
                                {LEVEL_INFO[l].label}
                              </span>
                            ))}
                            <span className="text-xs text-gray-300 ml-1">{unitMissions.length}개 미션</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        <Link href={`/learn/${unit.id}/concept`}
                          className="text-center py-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-sm font-semibold text-teal-700 transition-colors">
                          📖 개념
                        </Link>
                        <Link href={`/learn/${unit.id}/examples`}
                          className="text-center py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-sm font-semibold text-blue-700 transition-colors">
                          💻 예제
                        </Link>
                        <Link href={`/learn/${unit.id}/guided`}
                          className="text-center py-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-sm font-semibold text-purple-700 transition-colors">
                          ✏️ 연습
                        </Link>
                        <Link href={`/learn/${unit.id}/missions`}
                          className="text-center py-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-sm font-semibold text-orange-700 transition-colors">
                          🎯 미션
                        </Link>
                        <Link href={`/learn/${unit.id}/custom-missions`}
                          className={`text-center py-3 rounded-xl text-sm font-semibold transition-colors ${
                            customCount > 0
                              ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-400'
                          }`}>
                          ✨ 추가
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
