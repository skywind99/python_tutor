'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { MISSIONS, LEVEL_INFO } from '@/data/missions'

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newClassName, setNewClassName] = useState('')
  const [showNewClassInput, setShowNewClassInput] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function load() {
      const sb = getClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await sb.from('profiles').select('*').eq('id', user.id).single()
      if (prof?.role !== 'teacher') { router.push('/dashboard'); return }
      setProfile(prof)

      const { data: cls } = await sb.from('classes').select('*').eq('teacher_id', user.id).order('created_at')
      const classList = cls || []
      setClasses(classList)
      if (classList.length > 0) setSelectedClassId(classList[0].id)

      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    if (!selectedClassId) { setStudents([]); return }
    async function loadStudents() {
      setStudentsLoading(true)
      const { data: studs } = await getClient().from('profiles')
        .select('id, name, mission_logs(*)')
        .eq('class_id', selectedClassId)
        .eq('role', 'student')
      setStudents(studs || [])
      setStudentsLoading(false)
    }
    loadStudents()
  }, [selectedClassId])

  async function createClass() {
    const name = newClassName.trim()
    if (!name) return
    setCreating(true)
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data } = await sb.from('classes').insert({
      name,
      teacher_id: user.id,
      invite_code: code
    }).select().single()
    if (data) {
      setClasses(prev => [...prev, data])
      setSelectedClassId(data.id)
    }
    setNewClassName('')
    setShowNewClassInput(false)
    setCreating(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-bounce">👨‍🏫</div>
    </div>
  )

  const selectedClass = classes.find(c => c.id === selectedClassId)

  // 학생별 통계
  const studentStats = students.map(s => {
    const logs = s.mission_logs || []
    const passed = logs.filter((l: any) => l.passed)
    const totalScore = logs.reduce((sum: number, l: any) => sum + (l.score || 0), 0)
    const avgHints = logs.length > 0 ? (logs.reduce((s: number, l: any) => s + l.hints_used, 0) / logs.length).toFixed(1) : '0'
    return { ...s, passed: passed.length, totalScore, avgHints }
  }).sort((a, b) => b.totalScore - a.totalScore)

  // 미션별 통과율
  const missionStats = MISSIONS.map(m => {
    const allLogs = students.flatMap(s => s.mission_logs || [])
    const mLogs = allLogs.filter((l: any) => l.mission_id === m.id)
    const passRate = mLogs.length > 0 ? Math.round((mLogs.filter((l: any) => l.passed).length / mLogs.length) * 100) : null
    const avgHints = mLogs.length > 0 ? (mLogs.reduce((s: number, l: any) => s + l.hints_used, 0) / mLogs.length).toFixed(1) : null
    return { ...m, passRate, avgHints, attempts: mLogs.length }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b px-6 py-4 flex items-center justify-between" style={{background:'#3730A3'}}>
        <div>
          <h1 className="text-lg font-bold text-white">안녕하세요, {profile?.name} 선생님! 👋</h1>
          <p className="text-sm mt-0.5" style={{color:'rgba(255,255,255,0.7)'}}>교사 대시보드 · 학생들의 학습 현황을 확인해보세요</p>
        </div>
        <Link href="/teacher/create-mission"
          className="px-4 py-2 text-sm font-semibold rounded-xl transition-colors"
          style={{background:'rgba(255,255,255,0.2)',color:'#fff'}}>
          ✨ AI 문제 만들기
        </Link>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-5">

        {/* 반 탭 선택 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium mr-1">반 선택</span>

            {classes.map(cls => (
              <button key={cls.id} onClick={() => setSelectedClassId(cls.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  selectedClassId === cls.id
                    ? 'text-white border-indigo-700'
                    : 'text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
                style={selectedClassId === cls.id ? {background:'#4338CA'} : {}}>
                🏫 {cls.name}
                {selectedClassId === cls.id && (
                  <span className="text-xs opacity-75 font-mono">{cls.invite_code}</span>
                )}
              </button>
            ))}

            {/* 새 반 만들기 */}
            {showNewClassInput ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createClass(); if (e.key === 'Escape') { setShowNewClassInput(false); setNewClassName('') } }}
                  placeholder="반 이름 (예: 1반, 3학년2반)"
                  className="border border-indigo-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 w-48"
                />
                <button onClick={createClass} disabled={creating || !newClassName.trim()}
                  className="px-3 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-50 transition-colors"
                  style={{background:'#4338CA'}}>
                  {creating ? '생성 중...' : '만들기'}
                </button>
                <button onClick={() => { setShowNewClassInput(false); setNewClassName('') }}
                  className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600">취소</button>
              </div>
            ) : (
              <button onClick={() => setShowNewClassInput(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-indigo-600 border border-dashed border-indigo-300 hover:bg-indigo-50 transition-colors">
                + 새 반 만들기
              </button>
            )}
          </div>

          {/* 선택된 반 초대코드 */}
          {selectedClass && (
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{selectedClass.name}</span> · 학생 {students.length}명
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">학생 초대코드</span>
                <span className="text-sm font-bold font-mono text-gray-900 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                  {selectedClass.invite_code}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 반이 없는 경우 */}
        {classes.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="text-4xl mb-3">🏫</div>
            <h2 className="font-semibold text-gray-900 mb-2">반을 만들어보세요</h2>
            <p className="text-sm text-gray-400 mb-5">학생들에게 초대코드를 공유하면 반에 합류할 수 있어요</p>
          </div>
        )}

        {studentsLoading && (
          <div className="text-center py-10 text-gray-400">불러오는 중...</div>
        )}

        {!studentsLoading && students.length > 0 && (
          <>
            {/* 요약 통계 */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: '전체 학생', value: students.length + '명', icon: '👥' },
                { label: '평균 완료 미션', value: (studentStats.reduce((s,st)=>s+st.passed,0)/students.length).toFixed(1) + '개', icon: '🎯' },
                { label: '평균 점수', value: Math.round(studentStats.reduce((s,st)=>s+st.totalScore,0)/students.length).toLocaleString() + '점', icon: '💎' },
                { label: '평균 힌트 사용', value: (studentStats.reduce((s,st)=>s+Number(st.avgHints),0)/students.length).toFixed(1) + '개', icon: '💡' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-lg font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>

            {/* 학생 목록 */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="font-semibold text-gray-800 text-sm">학생별 현황</h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['순위','이름','완료 미션','총점','평균 힌트','힌트 의존도'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {studentStats.map((s, i) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-bold text-gray-400">{i+1}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{s.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full w-16">
                            <div className="h-full bg-teal-400 rounded-full" style={{width:`${(s.passed/MISSIONS.length)*100}%`}}/>
                          </div>
                          <span className="text-xs text-gray-600">{s.passed}/{MISSIONS.length}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">{s.totalScore.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          Number(s.avgHints) >= 2 ? 'bg-red-50 text-red-600' :
                          Number(s.avgHints) >= 1 ? 'bg-yellow-50 text-yellow-700' : 'bg-teal-50 text-teal-700'
                        }`}>{s.avgHints}개</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {Number(s.avgHints) >= 2 ? '힌트 의존도 높음 🔴' : Number(s.avgHints) >= 1 ? '보통 🟡' : '우수 🟢'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 미션별 통과율 */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-800 text-sm mb-4">미션별 통과율 (취약 개념 파악)</h2>
              <div className="space-y-3">
                {missionStats.filter(m => m.attempts > 0).map(m => {
                  const lv = LEVEL_INFO[m.level as 1|2|3]
                  const rate = m.passRate || 0
                  return (
                    <div key={m.id} className="flex items-center gap-4">
                      <div className="w-32 text-xs text-gray-600 truncate flex-shrink-0">{m.title}</div>
                      <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0" style={{background:lv.bg,color:lv.text}}>{lv.label}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          rate >= 70 ? 'bg-teal-400' : rate >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                        }`} style={{width:`${rate}%`}}/>
                      </div>
                      <div className="text-xs font-semibold text-gray-700 w-10 text-right">{rate}%</div>
                      <div className="text-xs text-gray-400 w-16 flex-shrink-0">평균 힌트 {m.avgHints}개</div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-4">🔴 통과율 40% 미만 → 수업에서 집중 지도 필요</p>
            </div>
          </>
        )}

        {!studentsLoading && selectedClass && students.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="text-3xl mb-2">🎓</div>
            <p className="text-gray-500 text-sm">아직 학생이 없어요</p>
            <Link href="/teacher/students"
              className="mt-3 inline-block text-sm text-indigo-600 underline">
              학생 등록하러 가기
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
