'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Nav from '@/components/Nav'
import { MISSIONS } from '@/data/missions'

function getClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export default function RankingPage() {
  const router = useRouter()
  const [myId, setMyId] = useState('')
  const [isTeacher, setIsTeacher] = useState(false)
  const [ranking, setRanking] = useState<any[]>([])
  const [myRank, setMyRank] = useState(0)
  const [tab, setTab] = useState<'week'|'all'>('week')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const sb = getClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }
      setMyId(user.id)

      const { data: prof } = await sb.from('profiles').select('role, class_id').eq('id', user.id).single()
      if (prof?.role === 'teacher') setIsTeacher(true)

      // Get class students with logs
      let query = sb.from('profiles').select('id, name, mission_logs(score, passed, hints_used, created_at)').eq('role', 'student')
      if (prof?.class_id) query = query.eq('class_id', prof.class_id)

      const { data: students } = await query
      if (!students) { setLoading(false); return }

      const now = new Date()
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay())

      const ranked = students.map((s: any) => {
        const logs = s.mission_logs || []
        const weekLogs = logs.filter((l: any) => new Date(l.created_at) >= weekStart)
        return {
          id: s.id, name: s.name,
          weekScore: weekLogs.reduce((sum: number, l: any) => sum + (l.score || 0), 0),
          totalScore: logs.reduce((sum: number, l: any) => sum + (l.score || 0), 0),
          missions: logs.filter((l: any) => l.passed).length,
          avgHints: logs.length > 0 ? (logs.reduce((s: number, l: any) => s + l.hints_used, 0) / logs.length).toFixed(1) : '0',
        }
      })

      const sorted = [...ranked].sort((a, b) =>
        tab === 'week' ? b.weekScore - a.weekScore : b.totalScore - a.totalScore
      )
      setRanking(sorted)
      setMyRank(sorted.findIndex(r => r.id === user.id) + 1)
      setLoading(false)
    }
    load()
  }, [router, tab])

  const sorted = [...ranking].sort((a, b) => tab === 'week' ? b.weekScore - a.weekScore : b.totalScore - a.totalScore)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">🏆 랭킹</h1>
          <div className="flex rounded-xl overflow-hidden border border-gray-100 bg-white text-sm">
            {(['week','all'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 font-medium transition-colors ${tab===t ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                {t === 'week' ? '주간' : '전체'}
              </button>
            ))}
          </div>
        </div>

        {/* 내 순위 */}
        {myRank > 0 && (
          <div className="bg-blue-600 text-white rounded-2xl p-5 mb-5 flex items-center justify-between">
            <div>
              <div className="text-sm opacity-80 mb-1">내 {tab === 'week' ? '주간' : '전체'} 순위</div>
              <div className="text-4xl font-bold">{myRank}위</div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-80 mb-1">점수</div>
              <div className="text-2xl font-bold">
                {(tab === 'week'
                  ? sorted.find(r => r.id === myId)?.weekScore
                  : sorted.find(r => r.id === myId)?.totalScore
                )?.toLocaleString() || 0}점
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">불러오는 중...</div>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-gray-500">아직 같은 반 학생이 없어요</p>
            <p className="text-xs text-gray-400 mt-1">선생님께 초대코드를 받아 반에 합류하세요</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-4 bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div>순위</div>
              <div>이름</div>
              <div className="text-right">점수</div>
              <div className="text-right">미션</div>
            </div>
            {sorted.map((r, i) => {
              const isMe = r.id === myId
              return (
                <div key={r.id} className={`grid grid-cols-4 px-5 py-4 items-center border-t border-gray-50 transition-colors ${isMe ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    {i < 3 ? (
                      <span className="text-xl">{medals[i]}</span>
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">{i+1}</span>
                    )}
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${isMe ? 'text-blue-700' : 'text-gray-900'}`}>
                      {r.name} {isMe && <span className="text-xs font-normal">(나)</span>}
                    </div>
                    <div className="text-xs text-gray-400">힌트 평균 {r.avgHints}개</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {(tab === 'week' ? r.weekScore : r.totalScore).toLocaleString()}점
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">{r.missions}/{MISSIONS.length}</div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'week' && (
          <p className="text-xs text-gray-400 text-center mt-4">주간 랭킹은 매주 월요일 0시에 초기화돼요</p>
        )}
      </div>
    </div>
  )
}
