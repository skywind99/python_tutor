'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { UNITS, MISSIONS, LEVEL_INFO } from '@/data/missions'

export default function LearnPage() {
  const [customMissions, setCustomMissions] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/custom-missions').then(r => r.json()).then(d => setCustomMissions(d.missions || []))
  }, [])

  const customByUnit = customMissions.reduce((acc, m) => {
    if (m.unit_id) acc[m.unit_id] = (acc[m.unit_id] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-900">단원별 학습</h1>
      </div>

      <div className="flex flex-col gap-3">
        {UNITS.map((unit, idx) => {
          const unitMissions = MISSIONS.filter(m => m.unitId === unit.id)
          const levels = Array.from(new Set(unitMissions.map(m => m.level))) as (1|2|3)[]
          const customCount = customByUnit[unit.id] || 0

          return (
            <div key={unit.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
                  {idx + 1}
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
}
