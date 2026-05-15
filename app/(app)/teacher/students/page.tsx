'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { MISSIONS, LEVEL_INFO } from '@/data/missions'
import { Suspense } from 'react'

function getClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

function StudentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [classInfo, setClassInfo] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'list'|'bulk'>(searchParams.get('tab') === 'bulk' ? 'bulk' : 'list')

  // 일괄등록
  const [bulkText, setBulkText] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResults, setBulkResults] = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

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

  async function removeStudent(id: string) {
    if (!confirm('이 학생을 반에서 제거할까요?')) return
    await getClient().from('profiles').update({ class_id: null }).eq('id', id)
    setStudents(p => p.filter(s => s.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  async function bulkRegister() {
    if (!bulkText.trim()) return
    setBulkLoading(true); setBulkResults([])
    const lines = bulkText.trim().split('\n').filter(l => l.trim())
    const students = lines.map(line => {
      const parts = line.split(/[,\t]/).map(s => s.trim())
      return { name: parts[0], email: parts[1] || `${parts[0].replace(/\s/g,'').toLowerCase()}@school.kr` }
    }).filter(s => s.name)

    try {
      const res = await fetch('/api/bulk-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students, classId: classInfo?.id })
      })
      const data = await res.json()
      setBulkResults(data.results || [])
      // 성공한 학생들 목록 새로고침
      if (classInfo) {
        const { data: studs } = await getClient().from('profiles')
          .select('id, name, email, created_at, mission_logs(*)')
          .eq('class_id', classInfo.id).eq('role', 'student')
        setStudents(studs || [])
      }
    } catch (e) {
      alert('오류가 발생했어요.')
    }
    setBulkLoading(false)
  }

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { setBulkText(ev.target?.result as string || '') }
    reader.readAsText(file)
  }

  function getStats(s: any) {
    const logs = s.mission_logs || []
    return {
      score: logs.reduce((sum: number, l: any) => sum + (l.score || 0), 0),
      passed: logs.filter((l: any) => l.passed).length,
      avgHints: logs.length > 0 ? (logs.reduce((sum: number, l: any) => sum + l.hints_used, 0) / logs.length).toFixed(1) : '0'
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">👥 학생 관리</h1>
          {classInfo && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">{classInfo.name}</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full" style={{background:'#EEF2FF',color:'#4338CA'}}>
                초대코드: {classInfo.invite_code}
              </span>
            </div>
          )}
        </div>
        <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm">
          {(['list','bulk'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 font-medium transition-colors ${tab===t?'text-white':'text-gray-500 hover:bg-gray-50'}`}
              style={tab===t?{background:'#4338CA'}:{}}>
              {t === 'list' ? `📋 학생 목록 (${students.length})` : '➕ 일괄 등록'}
            </button>
          ))}
        </div>
      </div>

      {!classInfo ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <div className="text-4xl mb-3">🏫</div>
          <p className="text-gray-500">대시보드에서 반을 먼저 만들어주세요</p>
        </div>
      ) : tab === 'list' ? (
        <div className="flex gap-5">
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 text-white text-sm font-semibold" style={{background:'#4338CA'}}>
              전체 학생 목록
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-400">불러오는 중...</div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl mb-2">🎓</div>
                <p className="text-gray-500 text-sm">아직 학생이 없어요</p>
                <button onClick={() => setTab('bulk')}
                  className="mt-3 text-sm text-indigo-600 underline">일괄 등록하기</button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {students.map(s => {
                  const st = getStats(s)
                  const isSelected = selected?.id === s.id
                  return (
                    <div key={s.id} onClick={() => setSelected(isSelected ? null : s)}
                      className={`flex items-center justify-between px-5 py-4 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-sm" style={{background:'#4338CA'}}>
                          {s.name?.[0] || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{s.name}</div>
                          <div className="text-xs text-gray-400">{s.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900">{st.score.toLocaleString()}점</div>
                          <div className="text-xs text-gray-400">{st.passed}/{MISSIONS.length} 미션</div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${Number(st.avgHints)>=2?'bg-red-50 text-red-500':Number(st.avgHints)>=1?'bg-yellow-50 text-yellow-600':'bg-teal-50 text-teal-600'}`}>
                          힌트 {st.avgHints}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {selected && (
            <div className="w-72 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden sticky top-20">
                <div className="px-5 py-4 text-white flex items-center justify-between" style={{background:'#4338CA'}}>
                  <div>
                    <div className="font-semibold">{selected.name}</div>
                    <div className="text-xs opacity-70">{selected.email}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-white/50 hover:text-white text-xl">×</button>
                </div>
                <div className="p-4 space-y-4">
                  {(() => {
                    const st = getStats(selected)
                    const logs = selected.mission_logs || []
                    return (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          {[{l:'총점',v:st.score.toLocaleString()},{l:'미션',v:`${st.passed}/${MISSIONS.length}`},{l:'힌트',v:st.avgHints}].map(s=>(
                            <div key={s.l} className="text-center p-2 bg-gray-50 rounded-xl">
                              <div className="text-sm font-bold text-gray-900">{s.v}</div>
                              <div className="text-xs text-gray-400">{s.l}</div>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-2">미션별 풀이</div>
                          <div className="space-y-1 max-h-52 overflow-y-auto">
                            {MISSIONS.map(m => {
                              const log = logs.find((l: any) => l.mission_id === m.id)
                              const lv = LEVEL_INFO[m.level as 1|2|3]
                              return (
                                <div key={m.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-gray-50">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span>{log?.passed ? '✅' : '⬜'}</span>
                                    <span className="text-gray-700 truncate">{m.title}</span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className="px-1.5 py-0.5 rounded-full" style={{background:lv.bg,color:lv.text}}>{lv.label}</span>
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
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 일괄 등록 탭 */
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-2">📋 학생 일괄 등록</h2>
            <p className="text-sm text-gray-500 mb-4">
              한 줄에 한 명씩 <code className="bg-gray-100 px-1 rounded text-xs">이름, 이메일</code> 형식으로 입력하세요.<br/>
              이메일 생략 시 <code className="bg-gray-100 px-1 rounded text-xs">이름@school.kr</code>로 자동 생성돼요.<br/>
              초기 비밀번호는 모두 <code className="bg-gray-100 px-1 rounded text-xs font-mono">python1234</code>예요.
            </p>

            <div className="flex gap-3 mb-4">
              <button onClick={() => fileRef.current?.click()}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                📁 CSV 파일 불러오기
              </button>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCSV}/>
              <button onClick={() => setBulkText('홍길동, hong@school.kr\n김철수, kim@school.kr\n이영희')}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                예시 불러오기
              </button>
            </div>

            <textarea
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
              placeholder={'홍길동, hong@school.kr\n김철수, kim@school.kr\n이영희, lee@school.kr'}
              rows={8}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 font-mono text-sm outline-none focus:border-indigo-400 resize-none"/>

            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-400">
                {bulkText.trim() ? bulkText.trim().split('\n').filter(l=>l.trim()).length + '명 입력됨' : ''}
              </span>
              <button onClick={bulkRegister} disabled={bulkLoading || !bulkText.trim()}
                className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-colors"
                style={{background:'#4338CA'}}>
                {bulkLoading ? '등록 중...' : '✅ 일괄 등록하기'}
              </button>
            </div>

            {bulkResults.length > 0 && (
              <div className="mt-5">
                <div className="text-sm font-semibold text-gray-700 mb-3">
                  등록 결과 ({bulkResults.filter(r=>r.success).length}/{bulkResults.length}명 성공)
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {bulkResults.map((r, i) => (
                    <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm ${r.success ? 'bg-teal-50' : 'bg-red-50'}`}>
                      <div>
                        <span className="font-semibold">{r.name}</span>
                        <span className="text-gray-500 ml-2 text-xs">{r.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.success ? (
                          <>
                            <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border">{r.password}</span>
                            <span className="text-teal-600 text-xs font-medium">✓ 등록완료</span>
                          </>
                        ) : (
                          <span className="text-red-500 text-xs">{r.error}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {bulkResults.some(r=>r.success) && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                    ⚠️ 초기 비밀번호 <strong>python1234</strong>를 학생들에게 알려주세요. 학생들이 직접 변경하도록 안내해주세요.
                  </div>
                )}
              </div>
            )}

            {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-700">
                ⚠️ 일괄 등록을 사용하려면 Vercel 환경변수에 <code>SUPABASE_SERVICE_ROLE_KEY</code>를 추가해야 해요.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">불러오는 중...</div>}>
      <StudentsContent />
    </Suspense>
  )
}
