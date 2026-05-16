'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { MISSIONS, UNITS, LEVEL_INFO } from '@/data/missions'

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function StudentDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [customMissions, setCustomMissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const sb = getClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await sb.from('profiles').select('*').eq('id', user.id).single()
      if (prof?.role === 'teacher') { router.push('/teacher/dashboard'); return }
      setProfile(prof)

      const { data: missionLogs } = await sb.from('mission_logs')
        .select('*').eq('student_id', user.id)
      setLogs(missionLogs || [])

      if (prof?.class_id) {
        const { data: rank } = await sb.from('profiles')
          .select('id, name, mission_logs(score)')
          .eq('class_id', prof.class_id)
          .eq('role', 'student')
        setRanking(rank || [])
      }
      // 선생님이 추가한 문제
      const cmRes = await fetch('/api/custom-missions')
      const cmData = await cmRes.json()
      setCustomMissions(cmData.missions || [])

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-bounce">💎</div>
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    </div>
  )

  const passedMissions = logs.filter(l => l.passed)
  const totalScore = logs.reduce((sum, l) => sum + (l.score || 0), 0)
  const totalMissions = MISSIONS.length
  const progressPct = Math.round((passedMissions.length / totalMissions) * 100)

  // 단원별 진행도
  const unitProgress = UNITS.map(unit => {
    const unitMissions = MISSIONS.filter(m => m.unitId === unit.id)
    const unitPassed = unitMissions.filter(m => logs.find(l => l.mission_id === m.id && l.passed))
    return { ...unit, passed: unitPassed.length, total: unitMissions.length }
  })

  // 랭킹 계산
  const rankData = ranking.map((r: any) => ({
    name: r.name,
    score: (r.mission_logs || []).reduce((s: number, l: any) => s + (l.score || 0), 0)
  })).sort((a: any, b: any) => b.score - a.score)

  const myRank = rankData.findIndex((r: any) => r.name === profile?.name) + 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 인사말 */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">안녕하세요, {profile?.name}님! 👋</h1>
        <p className="text-sm text-gray-400 mt-0.5">오늘도 파이썬 미션에 도전해봐요 💎</p>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-5">
        {/* 상단 stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '총 점수', value: totalScore.toLocaleString(), icon: '💎', sub: '획득한 보석' },
            { label: '완료한 미션', value: `${passedMissions.length}/${totalMissions}`, icon: '🎯', sub: `진행률 ${progressPct}%` },
            { label: '반 내 순위', value: myRank > 0 ? `${myRank}위` : '-', icon: '🏆', sub: ranking.length > 0 ? `${ranking.length}명 중` : '반 미배정' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900 mb-0.5">{s.value}</div>
              <div className="text-xs text-gray-400">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* 전체 진행도 바 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">전체 학습 진행도</h2>
            <span className="text-sm font-bold text-gray-900">{progressPct}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }} />
          </div>
          <div className="grid grid-cols-8 gap-2">
            {unitProgress.map(u => (
              <div key={u.id} className="text-center">
                <div className={`text-xs font-medium mb-1 ${u.passed === u.total && u.total > 0 ? 'text-teal-600' : 'text-gray-500'}`}>
                  {u.passed === u.total && u.total > 0 ? '✓' : `${u.passed}/${u.total}`}
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${u.passed === u.total && u.total > 0 ? 'bg-teal-500' : 'bg-blue-400'}`}
                    style={{ width: `${u.total > 0 ? (u.passed/u.total)*100 : 0}%` }} />
                </div>
                <div className="text-xs text-gray-400 mt-1 truncate">{u.title}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 단원 바로가기 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-4">단원별 학습</h2>
            <div className="space-y-2">
              {unitProgress.map(u => (
                <Link key={u.id} href={`/learn/${u.id}/missions`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      u.passed === u.total && u.total > 0 ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'
                    }`}>{u.id}</div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{u.title}</div>
                      <div className="text-xs text-gray-400">{u.passed}/{u.total} 완료</div>
                    </div>
                  </div>
                  <span className="text-gray-300 group-hover:text-gray-500 transition-colors">→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* 반 랭킹 */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-4">
              🏆 반 내 랭킹
              {ranking.length === 0 && <span className="text-xs text-gray-400 font-normal ml-2">(반 배정 후 활성화)</span>}
            </h2>
            {rankData.length > 0 ? (
              <div className="space-y-2">
                {rankData.slice(0, 5).map((r: any, i: number) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${
                    r.name === profile?.name ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' :
                        i === 1 ? 'bg-gray-100 text-gray-600' :
                        i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'
                      }`}>{i+1}</div>
                      <span className={`text-sm ${r.name === profile?.name ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>
                        {r.name} {r.name === profile?.name ? '(나)' : ''}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{r.score.toLocaleString()}점</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🎯</div>
                <p className="text-xs text-gray-400">선생님께 반 초대코드를 받아서<br/>입력하면 랭킹을 볼 수 있어요!</p>
              </div>
            )}
          </div>
        </div>

        {/* 선생님 추가 문제 */}
        {customMissions.length > 0 && (
          <div className="bg-white rounded-2xl border border-indigo-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-semibold text-gray-800 text-sm">✨ 선생님이 추가한 문제</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500 font-medium">{customMissions.length}개</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customMissions.map((m: any) => {
                const levelLabel = ['', '기초', '응용', '심화'][m.level] || '응용'
                const levelColor = [, '#DBEAFE #2563EB', '#FEF3C7 #D97706', '#FCE7F3 #DB2777'][m.level]
                const [bg, color] = (levelColor || '#F3F4F6 #6B7280').split(' ')
                return (
                  <Link key={m.id} href={`/custom-mission/${m.id}`}
                    className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-lg flex-shrink-0">✨</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{m.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: bg, color }}>{levelLabel}</span>
                        <span className="text-xs text-gray-400 truncate">{m.topic}</span>
                      </div>
                    </div>
                    <span className="text-gray-300 group-hover:text-indigo-400 transition-colors text-sm mt-1">→</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* 최근 활동 */}
        {logs.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-800 text-sm mb-4">최근 활동</h2>
            <div className="space-y-2">
              {logs.slice(-5).reverse().map((l, i) => {
                const mission = MISSIONS.find(m => m.id === l.mission_id)
                if (!mission) return null
                const lv = LEVEL_INFO[mission.level as 1|2|3]
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${l.passed ? 'bg-teal-100 text-teal-600' : 'bg-red-100 text-red-500'}`}>
                        {l.passed ? '✓' : '✗'}
                      </span>
                      <div>
                        <div className="text-sm text-gray-800">{mission.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:lv.bg,color:lv.text}}>{lv.label}</span>
                          <span className="text-xs text-gray-400">힌트 {l.hints_used}개 사용</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">+{l.score}점</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
