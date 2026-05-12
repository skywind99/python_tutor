'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Nav from '@/components/Nav'
import { MISSIONS, LEVEL_INFO } from '@/data/missions'

function getClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export default function StudentsPage() {
  const router = useRouter()
  const [classInfo, setClassInfo] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const sb = getClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).single()
      if (prof?.role !== 'teacher') { router.push('/dashboard'); return }

      const { data: cls } = await sb.from('classes').select('*').eq('teacher_id', user.id).single()
      setClassInfo(cls)
      if (!cls) { setLoading(false); return }

      const { data: studs } = await sb.from('profiles')
        .select('id, name, email, created_at, mission_logs(*)')
        .eq('class_id', cls.id).eq('role', 'student')
        .order('created_at', { ascending: false })
      setStudents(studs || [])
      setLoading(false)
    }
    load()
  }, [router])

  async function removeStudent(studentId: string) {
    if (!confirm('이 학생을 반에서 제거할까요?')) return
    const sb = getClient()
    await sb.from('profiles').update({ class_id: null }).eq('id', studentId)
    setStudents(prev => prev.filter(s => s.id !== studentId))
    if (selected?.id === studentId) setSelected(null)
  }

  function getStudentStats(s: any) {
    const logs = s.mission_logs || []
    const passed = logs.filter((l: any) => l.passed)
    return {
      total: logs.reduce((sum: number, l: any) => sum + (l.score || 0), 0),
      passed: passed.length,
      avgHints: logs.length > 0 ? (logs.reduce((sum: number, l: any) => sum + l.hints_used, 0) / logs.length).toFixed(1) : '0',
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">👥 학생 관리</h1>
            {classInfo && (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500">{classInfo.name}</span>
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-mono font-medium">
                  초대코드: {classInfo.invite_code}
                </span>
              </div>
            )}
          </div>
          <div className="text-sm text-gray-400">학생 {students.length}명</div>
        </div>

        {!classInfo ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="text-4xl mb-3">🏫</div>
            <p className="text-gray-500">대시보드에서 반을 먼저 만들어주세요</p>
          </div>
        ) : (
          <div className="flex gap-5">
            {/* 학생 목록 */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-indigo-900 text-white text-sm font-semibold">
                전체 학생 목록
              </div>
              {loading ? (
                <div className="p-8 text-center text-gray-400">불러오는 중...</div>
              ) : students.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-3xl mb-2">🎓</div>
                  <p className="text-gray-500 text-sm">아직 반에 합류한 학생이 없어요</p>
                  <p className="text-xs text-gray-400 mt-1">초대코드를 학생들에게 공유해주세요</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {students.map(s => {
                    const stats = getStudentStats(s)
                    const isSelected = selected?.id === s.id
                    return (
                      <div key={s.id} onClick={() => setSelected(isSelected ? null : s)}
                        className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                            {s.name?.[0] || '?'}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{s.name}</div>
                            <div className="text-xs text-gray-400">{s.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <div className="text-sm font-bold text-gray-900">{stats.total.toLocaleString()}점</div>
                            <div className="text-xs text-gray-400">{stats.passed}미션</div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${Number(stats.avgHints) >= 2 ? 'bg-red-50 text-red-500' : Number(stats.avgHints) >= 1 ? 'bg-yellow-50 text-yellow-600' : 'bg-teal-50 text-teal-600'}`}>
                            힌트 {stats.avgHints}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 학생 상세 */}
            {selected && (() => {
              const logs = selected.mission_logs || []
              const stats = getStudentStats(selected)
              return (
                <div className="w-72 flex-shrink-0">
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-20">
                    <div className="bg-indigo-900 px-5 py-4 text-white">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{selected.name}</div>
                        <button onClick={() => setSelected(null)} className="text-white/50 hover:text-white text-xl leading-none">×</button>
                      </div>
                      <div className="text-xs text-indigo-200 mt-0.5">{selected.email}</div>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: '총점', value: stats.total.toLocaleString() },
                          { label: '미션', value: `${stats.passed}/${MISSIONS.length}` },
                          { label: '평균힌트', value: stats.avgHints },
                        ].map(s => (
                          <div key={s.label} className="text-center p-2 bg-gray-50 rounded-xl">
                            <div className="text-sm font-bold text-gray-900">{s.value}</div>
                            <div className="text-xs text-gray-400">{s.label}</div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-2">미션별 풀이 현황</div>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {MISSIONS.map(m => {
                            const log = logs.find((l: any) => l.mission_id === m.id)
                            const lv = LEVEL_INFO[m.level as 1|2|3]
                            return (
                              <div key={m.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-gray-50">
                                <div className="flex items-center gap-1.5">
                                  <span>{log?.passed ? '✅' : '⬜'}</span>
                                  <span className="text-gray-700 truncate max-w-28">{m.title}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="px-1.5 py-0.5 rounded-full text-xs" style={{background:lv.bg,color:lv.text}}>{lv.label}</span>
                                  {log && <span className="text-gray-400">{log.score}점</span>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <button onClick={() => removeStudent(selected.id)}
                        className="w-full py-2 text-xs text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                        반에서 제거
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
