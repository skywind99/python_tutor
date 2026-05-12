'use client'
import Link from 'next/link'
import { UNITS, MISSIONS, LEVEL_INFO } from '@/data/missions'

export default function LearnPage() {
  return (
    <>
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">단원별 학습</h1>
        <p className="text-sm text-gray-400">개념 설명 → 예제 → 미션 순서로 학습해요</p>
      </div>


      <div className="grid gap-4">
        {UNITS.map((unit, idx) => {
          const unitMissions = MISSIONS.filter(m => m.unitId === unit.id)
          const levels = Array.from(new Set(unitMissions.map(m => m.level)))

          return (
            <div key={unit.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg font-bold text-blue-600">
                      {idx + 1}
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">{unit.title}</h2>
                      <p className="text-gray-400 text-sm">{unit.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {levels.map(l => (
                      <span key={l} className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: LEVEL_INFO[l].bg, color: LEVEL_INFO[l].text }}>
                        {LEVEL_INFO[l].label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 3단계 학습 흐름 */}
                <div className="flex gap-2 mt-4">
                  <Link href={`/learn/${unit.id}/concept`}
                    className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-teal-50 hover:bg-teal-100 transition-colors">
                    <span className="text-lg">📖</span>
                    <div>
                      <div className="text-xs font-semibold text-teal-800">개념 설명</div>
                      <div className="text-xs text-teal-600">이론 학습</div>
                    </div>
                  </Link>
                  <Link href={`/learn/${unit.id}/examples`}
                    className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                    <span className="text-lg">💻</span>
                    <div>
                      <div className="text-xs font-semibold text-blue-800">예제 코드</div>
                      <div className="text-xs text-blue-600">직접 실행</div>
                    </div>
                  </Link>
                  <Link href={`/learn/${unit.id}/missions`}
                    className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors">
                    <span className="text-lg">🎯</span>
                    <div>
                      <div className="text-xs font-semibold text-orange-800">미션 풀기</div>
                      <div className="text-xs text-orange-600">{unitMissions.length}개 미션</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  </>
  )
}
