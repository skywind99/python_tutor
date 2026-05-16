'use client'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { UNITS } from '@/data/missions'

export default function UnitCustomMissionsPage() {
  const { unitId } = useParams<{ unitId: string }>()
  const unitIdNum = Number(unitId)
  const unit = UNITS.find(u => u.id === unitIdNum)
  const [missions, setMissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/custom-missions')
      .then(r => r.json())
      .then(d => {
        setMissions((d.missions || []).filter((m: any) => m.unit_id === unitIdNum))
        setLoading(false)
      })
  }, [unitIdNum])

  const levelLabel = (l: number) => ['', '기초', '응용', '심화'][l] || '응용'
  const levelBg = (l: number) => (['', '#DBEAFE', '#FEF3C7', '#FCE7F3'][l] || '#F3F4F6')
  const levelColor = (l: number) => (['', '#2563EB', '#D97706', '#DB2777'][l] || '#6B7280')

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-5">
        <Link href="/learn" className="text-xs text-gray-400 hover:text-gray-600">← 단원별 학습</Link>
        <h1 className="text-lg font-bold text-gray-900 mt-2">{unit?.title} · 추가문제</h1>
        <p className="text-sm text-gray-400 mt-0.5">선생님이 추가한 문제예요</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">불러오는 중...</div>
      ) : missions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-400 text-sm">이 단원에 추가된 문제가 없어요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {missions.map((m: any) => (
            <Link key={m.id} href={`/custom-mission/${m.id}`}
              className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-lg flex-shrink-0">✨</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900">{m.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: levelBg(m.level), color: levelColor(m.level) }}>
                    {levelLabel(m.level)}
                  </span>
                  <span className="text-xs text-gray-400">{m.topic}</span>
                </div>
              </div>
              <span className="text-gray-300 group-hover:text-indigo-400 transition-colors">→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
