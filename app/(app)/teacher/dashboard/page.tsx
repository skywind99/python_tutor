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
  const [classInfo, setClassInfo] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [geminiKey, setGeminiKey] = useState('')
  const [savedKey, setSavedKey] = useState('')
  const [keyLoading, setKeyLoading] = useState(false)
  const [keyMsg, setKeyMsg] = useState('')

  useEffect(() => {
    async function load() {
      const sb = getClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await sb.from('profiles').select('*').eq('id', user.id).single()
      if (prof?.role !== 'teacher') { router.push('/dashboard'); return }
      setProfile(prof)

      // 내 반 가져오기
      const { data: cls } = await sb.from('classes').select('*').eq('teacher_id', user.id).single()
      setClassInfo(cls)

      // 저장된 Gemini 키 로드
      if (prof?.gemini_key) {
        setSavedKey('●'.repeat(20) + prof.gemini_key.slice(-6))
      }

      if (cls) {
        const { data: studs } = await sb.from('profiles')
          .select('id, name, mission_logs(*)')
          .eq('class_id', cls.id)
          .eq('role', 'student')
        setStudents(studs || [])
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function createClass() {
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data } = await sb.from('classes').insert({
      name: `${profile?.name}선생님 반`,
      teacher_id: user.id,
      invite_code: code
    }).select().single()
    setClassInfo(data)
  }

  async function saveGeminiKey() {
    if (!geminiKey.trim()) return
    setKeyLoading(true)
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    const { error } = await sb.from('profiles').update({ gemini_key: geminiKey.trim() }).eq('id', user.id)
    if (error) { setKeyMsg('저장 실패: ' + error.message) }
    else {
      setSavedKey('●'.repeat(20) + geminiKey.slice(-6))
      setGeminiKey('')
      setKeyMsg('✓ API 키가 저장됐어요!')
      setTimeout(() => setKeyMsg(''), 3000)
    }
    setKeyLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-bounce">👨‍🏫</div>
    </div>
  )

  // 학생별 통계
  const studentStats = students.map(s => {
    const logs = s.mission_logs || []
    const passed = logs.filter((l: any) => l.passed)
    const totalScore = logs.reduce((sum: number, l: any) => sum + (l.score || 0), 0)
    const avgHints = logs.length > 0 ? (logs.reduce((s: number, l: any) => s + l.hints_used, 0) / logs.length).toFixed(1) : '0'
    return { ...s, passed: passed.length, totalScore, avgHints }
  }).sort((a, b) => b.totalScore - a.totalScore)

  // 미션별 통과율
  const missionStats = MISSIONS.slice(0, 7).map(m => {
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

      <div className="max-w-5xl mx-auto p-6 space-y-5">
        {/* 반 정보 */}
        {!classInfo ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <div className="text-4xl mb-3">🏫</div>
            <h2 className="font-semibold text-gray-900 mb-2">반을 만들어보세요</h2>
            <p className="text-sm text-gray-400 mb-5">학생들에게 초대코드를 공유하면 반에 합류할 수 있어요</p>
            <button onClick={createClass} className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
              반 만들기
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{classInfo.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">학생 {students.length}명</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">학생 초대코드</div>
                <div className="text-xl font-bold font-mono text-gray-900 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                  {classInfo.invite_code}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gemini API 키 설정 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">🔑</span>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Gemini API 키 설정</h2>
              <p className="text-xs text-gray-400 mt-0.5">학생들의 AI 힌트에 사용될 무료 Gemini API 키를 등록하세요</p>
            </div>
          </div>
          {savedKey && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-teal-50 rounded-xl text-sm">
              <span className="text-teal-600">✓</span>
              <span className="text-teal-700 font-mono text-xs">{savedKey}</span>
              <span className="text-teal-500 text-xs ml-auto">등록됨</span>
            </div>
          )}
          <div className="flex gap-2">
            <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)}
              placeholder="AIzaSy... (aistudio.google.com에서 무료 발급)"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-indigo-400"/>
            <button onClick={saveGeminiKey} disabled={keyLoading || !geminiKey.trim()}
              className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-40 transition-colors whitespace-nowrap"
              style={{background:'#4338CA'}}>
              {keyLoading ? '저장 중...' : '저장'}
            </button>
          </div>
          {keyMsg && <p className={`text-xs mt-2 ${keyMsg.startsWith('✓') ? 'text-teal-600' : 'text-red-500'}`}>{keyMsg}</p>}
          <p className="text-xs text-gray-400 mt-2">
            👉 <a href="https://aistudio.google.com" target="_blank" rel="noopener" className="text-indigo-500 hover:underline">aistudio.google.com</a>에서 Google 계정으로 무료 발급 가능
          </p>
        </div>

        {students.length > 0 && (
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
                    {['순위','이름','완료 미션','총점','평균 힌트','취약 단계'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {studentStats.map((s, i) => {
                    const lv = LEVEL_INFO[Number(s.avgHints) > 2 ? 3 : Number(s.avgHints) > 1 ? 2 : 1 as 1|2|3]
                    return (
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
                    )
                  })}
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
                      <div className="text-xs text-gray-400 w-16 flex-shrink-0">힌트 avg {m.avgHints}개</div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-4">🔴 통과율 40% 미만 → 수업에서 집중 지도 필요</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
