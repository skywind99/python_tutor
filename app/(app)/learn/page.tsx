'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { UNITS, MISSIONS, LEVEL_INFO } from '@/data/missions'

export default function LearnPage() {
  const [customMissions, setCustomMissions] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/custom-missions').then(r => r.json()).then(d => setCustomMissions(d.missions || []))
  }, [])

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-gray-900">단원별 학습</h1>
        <p className="text-sm text-gray-400 mt-0.5">개념 → 예제 → 미션 순서로 학습해요</p>
      </div>

      {/* 단원 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {UNITS.map((unit, idx) => {
          const unitMissions = MISSIONS.filter(m => m.unitId === unit.id)
          const levels = Array.from(new Set(unitMissions.map(m => m.level))) as (1|2|3)[]

          return (
            <div key={unit.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">{unit.title}</div>
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
              <div className="flex gap-2">
                <Link href={`/learn/${unit.id}/concept`}
                  className="flex-1 text-center py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-xs font-semibold text-teal-700 transition-colors">
                  📖 개념
                </Link>
                <Link href={`/learn/${unit.id}/examples`}
                  className="flex-1 text-center py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-blue-700 transition-colors">
                  💻 예제
                </Link>
                <Link href={`/learn/${unit.id}/missions`}
                  className="flex-1 text-center py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-xs font-semibold text-orange-700 transition-colors">
                  🎯 미션
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* 선생님 추가 문제 */}
      {customMissions.length > 0 && (
        <div className="bg-white rounded-2xl border border-indigo-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">✨ 선생님 추가 문제</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500 font-medium">{customMissions.length}개</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {customMissions.map((m: any) => {
              const levelLabel = ['', '기초', '응용', '심화'][m.level] || '응용'
              const levelBg = ['', '#DBEAFE', '#FEF3C7', '#FCE7F3'][m.level] || '#F3F4F6'
              const levelColor = ['', '#2563EB', '#D97706', '#DB2777'][m.level] || '#6B7280'
              return (
                <Link key={m.id} href={`/custom-mission/${m.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-sm flex-shrink-0">✨</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{m.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: levelBg, color: levelColor }}>{levelLabel}</span>
                      <span className="text-xs text-gray-400 truncate">{m.topic}</span>
                    </div>
                  </div>
                  <span className="text-gray-300 group-hover:text-indigo-400 transition-colors">→</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
