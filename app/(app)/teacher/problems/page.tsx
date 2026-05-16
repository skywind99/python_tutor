'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { MISSIONS, UNITS, LEVEL_INFO } from '@/data/missions'
import type { Mission } from '@/data/missions'

function getClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export default function ProblemsPage() {
  const router = useRouter()
  const [unitId, setUnitId] = useState(1)
  const [logs, setLogs] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [aiSolution, setAiSolution] = useState<Record<number, string>>({})
  const [aiLoading, setAiLoading] = useState<number | null>(null)
  const [userId, setUserId] = useState('')
  const [tab, setTab] = useState<'solutions'|'ai'>('solutions')
  const [customMissions, setCustomMissions] = useState<any[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [editingMission, setEditingMission] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({ title: '', topic: '', description: '', expectedOutput: '', level: 2 })
  const [savingEdit, setSavingEdit] = useState(false)

  const loadCustomMissions = useCallback(async () => {
    const res = await fetch('/api/custom-missions')
    const data = await res.json()
    setCustomMissions(data.missions || [])
  }, [])

  useEffect(() => {
    async function load() {
      const sb = getClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: prof } = await sb.from('profiles').select('role, gemini_key').eq('id', user.id).single()
      if (prof?.role !== 'teacher') { router.push('/dashboard'); return }

      const { data: cls } = await sb.from('classes').select('id').eq('teacher_id', user.id).single()
      if (!cls) { setLoading(false); return }

      const { data: studs } = await sb.from('profiles').select('id, name').eq('class_id', cls.id).eq('role', 'student')
      setStudents(studs || [])

      if (studs?.length) {
        const ids = studs.map((s: any) => s.id)
        const { data: allLogs } = await sb.from('mission_logs').select('*').in('student_id', ids)
        setLogs(allLogs || [])
      }
      setLoading(false)
    }
    load()
    loadCustomMissions()
  }, [router, loadCustomMissions])

  async function generateAiSolution(mission: Mission) {
    setAiLoading(mission.id)
    try {
      const res = await fetch('/api/ai-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: mission.title,
          description: mission.description,
          expectedOutput: mission.expectedOutput,
          tags: mission.tags,
          userId,
        })
      })
      const data = await res.json()
      if (data.solution) setAiSolution(prev => ({ ...prev, [mission.id]: data.solution }))
      else setAiSolution(prev => ({ ...prev, [mission.id]: data.error || '생성 실패' }))
    } catch {
      setAiSolution(prev => ({ ...prev, [mission.id]: '오류가 발생했어요.' }))
    }
    setAiLoading(null)
  }

  async function deleteCustomMission(id: string) {
    if (!confirm('이 문제를 삭제할까요?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/custom-missions?id=${id}`, { method: 'DELETE' })
      await loadCustomMissions()
    } finally {
      setDeletingId(null)
    }
  }

  function openEdit(m: any) {
    setEditingMission(m)
    setEditForm({
      title: m.title || '',
      topic: m.topic || '',
      description: m.description || '',
      expectedOutput: m.expected_output || '',
      level: m.level ?? 2,
    })
  }

  async function saveEdit() {
    if (!editingMission) return
    setSavingEdit(true)
    await fetch(`/api/custom-missions?id=${editingMission.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editForm.title,
        topic: editForm.topic,
        description: editForm.description,
        expectedOutput: editForm.expectedOutput,
        level: editForm.level,
      }),
    })
    await loadCustomMissions()
    setEditingMission(null)
    setSavingEdit(false)
  }

  async function moveCustomMission(id: string, newUnitId: number | null) {
    setMovingId(id)
    try {
      await fetch(`/api/custom-missions?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: newUnitId }),
      })
      await loadCustomMissions()
    } finally {
      setMovingId(null)
    }
  }

  const unitMissions = MISSIONS.filter(m => m.unitId === unitId)
  const unitCustomMissions = customMissions.filter(m => m.unit_id === unitId)
  const unassignedCustomMissions = customMissions.filter(m => !m.unit_id)

  function getMissionStats(missionId: number) {
    const mLogs = logs.filter(l => l.mission_id === missionId)
    const passed = mLogs.filter(l => l.passed)
    return {
      attempts: mLogs.length,
      passed: passed.length,
      passRate: students.length > 0 ? Math.round((passed.length / students.length) * 100) : 0,
      avgHints: mLogs.length > 0 ? (mLogs.reduce((s, l) => s + l.hints_used, 0) / mLogs.length).toFixed(1) : '-',
    }
  }

  function getStudentSolutions(missionId: number) {
    return logs
      .filter(l => l.mission_id === missionId)
      .map(l => ({ ...l, studentName: students.find(s => s.id === l.student_id)?.name || '알 수 없음' }))
      .sort((a, b) => b.score - a.score)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">불러오는 중...</div>
  )

  const levelLabel = (l: number) => ['', '기초', '응용', '심화'][l] || '응용'
  const levelBg = (l: number) => (['', '#DBEAFE', '#FEF3C7', '#FCE7F3'][l] || '#F3F4F6')
  const levelColor = (l: number) => (['', '#2563EB', '#D97706', '#DB2777'][l] || '#6B7280')

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 추가문제 수정 모달 */}
      {editingMission && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
          onClick={e => { if (e.target === e.currentTarget) setEditingMission(null) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
              style={{background:'#4338CA'}}>
              <h2 className="font-bold text-white">✏️ 추가문제 수정</h2>
              <button onClick={() => setEditingMission(null)} className="text-white/60 hover:text-white text-xl">×</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* 난이도 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">난이도</label>
                <div className="flex gap-2">
                  {[{v:1,l:'기초',bg:'#DBEAFE',c:'#2563EB'},{v:2,l:'응용',bg:'#FEF3C7',c:'#D97706'},{v:3,l:'심화',bg:'#FCE7F3',c:'#DB2777'}].map(opt => (
                    <button key={opt.v} onClick={() => setEditForm(p => ({...p, level: opt.v}))}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                      style={{
                        background: editForm.level === opt.v ? opt.bg : '#fff',
                        color: editForm.level === opt.v ? opt.c : '#9CA3AF',
                        borderColor: editForm.level === opt.v ? opt.c : '#E5E7EB',
                      }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">제목</label>
                <input
                  value={editForm.title}
                  onChange={e => setEditForm(p => ({...p, title: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  placeholder="문제 제목"
                />
              </div>

              {/* 주제 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">주제/태그</label>
                <input
                  value={editForm.topic}
                  onChange={e => setEditForm(p => ({...p, topic: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400"
                  placeholder="예: 변수, 조건문, 반복문"
                />
              </div>

              {/* 문제 설명 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">문제 설명</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(p => ({...p, description: e.target.value}))}
                  rows={5}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 resize-none"
                  placeholder="학생에게 보여줄 문제 설명"
                />
              </div>

              {/* 예상 출력 */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">예상 출력</label>
                <textarea
                  value={editForm.expectedOutput}
                  onChange={e => setEditForm(p => ({...p, expectedOutput: e.target.value}))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-indigo-400 resize-none"
                  placeholder="프로그램 실행 시 기대되는 출력 결과"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-50 flex gap-3">
              <button onClick={() => setEditingMission(null)}
                className="flex-1 py-2.5 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
                취소
              </button>
              <button onClick={saveEdit} disabled={savingEdit || !editForm.title.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                style={{background:'#4338CA'}}>
                {savingEdit ? '저장 중...' : '✅ 저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">📝 문제 관리</h1>
          <p className="text-sm text-gray-400 mt-0.5">단원별 문제 현황 · 학생 풀이 확인 · AI 풀이 생성</p>
        </div>
        <Link href="/teacher/create-mission"
          className="px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors"
          style={{ background: '#4338CA' }}>
          ✨ AI 문제 만들기
        </Link>
      </div>

      {/* 단원 탭 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {UNITS.map(u => (
          <button key={u.id} onClick={() => { setUnitId(u.id); setSelectedMission(null) }}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              unitId === u.id
                ? 'text-white shadow-sm'
                : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
            }`}
            style={unitId === u.id ? { background: '#4338CA' } : {}}>
            {u.id}단원 · {u.title}
          </button>
        ))}
      </div>

      <div className="flex gap-5">
        {/* 미션 목록 */}
        <div className="w-80 flex-shrink-0 space-y-3">
          {/* 기본 미션 */}
          {unitMissions.map(mission => {
            const stats = getMissionStats(mission.id)
            const lv = LEVEL_INFO[mission.level as 1|2|3]
            const isSelected = selectedMission?.id === mission.id

            return (
              <div key={mission.id}
                onClick={() => { setSelectedMission(isSelected ? null : mission); setTab('solutions') }}
                className={`bg-white rounded-2xl border p-4 cursor-pointer transition-all ${
                  isSelected ? 'border-indigo-300 shadow-md' : 'border-gray-100 hover:border-gray-200'
                }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: lv.bg, color: lv.text }}>{lv.label}</span>
                    <h3 className="font-semibold text-gray-900 text-sm mt-1.5">{mission.title}</h3>
                    <p className="text-xs text-gray-400">{mission.topic}</p>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <div className="text-lg font-bold" style={{ color: '#4338CA' }}>{stats.passRate}%</div>
                    <div className="text-xs text-gray-400">통과율</div>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all"
                    style={{
                      width: `${stats.passRate}%`,
                      background: stats.passRate >= 70 ? '#10B981' : stats.passRate >= 40 ? '#F59E0B' : '#EF4444'
                    }} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>시도 {stats.attempts}회</span>
                  <span>통과 {stats.passed}명/{students.length}명</span>
                  <span>힌트 평균 {stats.avgHints}개</span>
                </div>
              </div>
            )
          })}

          {/* 추가문제 섹션 */}
          {unitCustomMissions.length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-semibold text-gray-400 mb-2 px-1">✨ 선생님 추가 문제</div>
              {unitCustomMissions.map((m: any) => (
                <div key={m.id} className="bg-white rounded-2xl border border-indigo-100 p-3 mb-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: levelBg(m.level), color: levelColor(m.level) }}>
                        {levelLabel(m.level)}
                      </span>
                      <div className="text-sm font-semibold text-gray-900 mt-1 truncate">{m.title}</div>
                      <div className="text-xs text-gray-400">{m.topic}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <select
                      value={m.unit_id || ''}
                      onChange={e => moveCustomMission(m.id, e.target.value ? Number(e.target.value) : null)}
                      disabled={movingId === m.id}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-indigo-300 bg-white"
                      onClick={e => e.stopPropagation()}>
                      <option value="">단원 미지정</option>
                      {UNITS.map(u => (
                        <option key={u.id} value={u.id}>{u.id}. {u.title}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => openEdit(m)}
                      className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors flex-shrink-0">
                      수정
                    </button>
                    <button
                      onClick={() => deleteCustomMission(m.id)}
                      disabled={deletingId === m.id}
                      className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 disabled:opacity-40 transition-colors flex-shrink-0">
                      {deletingId === m.id ? '...' : '삭제'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {students.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-sm text-gray-500">아직 반에 학생이 없어요</p>
            </div>
          )}
        </div>

        {/* 상세 패널 */}
        {selectedMission && (
          <div className="flex-1 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">{selectedMission.title}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedMission.topic}</p>
                </div>
                <button onClick={() => setSelectedMission(null)} className="text-gray-300 hover:text-gray-500 text-xl">×</button>
              </div>
              <div className="flex gap-1 mt-3">
                {(['solutions', 'ai'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      tab === t ? 'text-white' : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    style={tab === t ? { background: '#4338CA' } : {}}>
                    {t === 'solutions' ? `📋 학생 풀이 (${getStudentSolutions(selectedMission.id).length})` : '🤖 AI 풀이'}
                  </button>
                ))}
              </div>
            </div>

            {tab === 'solutions' && (
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                {getStudentSolutions(selectedMission.id).length === 0 ? (
                  <div className="p-10 text-center text-gray-400">
                    <div className="text-4xl mb-3">📝</div>
                    <p className="text-sm">아직 이 문제를 시도한 학생이 없어요</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {getStudentSolutions(selectedMission.id).map((sol, i) => (
                      <div key={i} className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: '#4338CA' }}>
                              {sol.studentName?.[0] || '?'}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{sol.studentName}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                  sol.passed ? 'bg-teal-50 text-teal-600' : 'bg-gray-100 text-gray-400'
                                }`}>{sol.passed ? '✓ 통과' : '미통과'}</span>
                                <span className="text-xs text-gray-400">힌트 {sol.hints_used}개</span>
                                <span className="text-xs text-gray-400">시도 {sol.attempts}회</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-gray-900">{sol.score}점</div>
                          </div>
                        </div>
                        {sol.code && (
                          <div className="bg-gray-950 rounded-xl p-3 overflow-x-auto">
                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{sol.code}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'ai' && (
              <div className="p-6">
                <div className="mb-4">
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="text-xs font-semibold text-gray-500 mb-2">문제 설명</div>
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                      {selectedMission.description}
                    </pre>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-semibold text-gray-500 mb-1">예상 출력</div>
                      <pre className="text-xs text-gray-500 font-mono">{selectedMission.expectedOutput}</pre>
                    </div>
                  </div>

                  {!aiSolution[selectedMission.id] ? (
                    <button onClick={() => generateAiSolution(selectedMission)}
                      disabled={aiLoading === selectedMission.id}
                      className="w-full py-3 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-colors"
                      style={{ background: '#4338CA' }}>
                      {aiLoading === selectedMission.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin">⟳</span> AI가 풀이를 생성 중...
                        </span>
                      ) : '🤖 AI 모범 풀이 생성하기'}
                    </button>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-gray-500">AI 모범 풀이</div>
                        <button onClick={() => setAiSolution(prev => { const n = {...prev}; delete n[selectedMission.id]; return n })}
                          className="text-xs text-gray-400 hover:text-gray-600">다시 생성</button>
                      </div>
                      <div className="bg-gray-950 rounded-xl p-4">
                        <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                          {aiSolution[selectedMission.id]}
                        </pre>
                      </div>
                      <button onClick={() => navigator.clipboard?.writeText(aiSolution[selectedMission.id])}
                        className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                        📋 클립보드에 복사
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedMission && students.length > 0 && (
          <div className="flex-1 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center" style={{ minHeight: '200px' }}>
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-3">👈</div>
                <p className="text-sm">문제를 클릭하면<br/>학생 풀이와 AI 풀이를 볼 수 있어요</p>
              </div>
            </div>

            {/* 단원 미지정 추가문제 */}
            {unassignedCustomMissions.length > 0 && (
              <div className="bg-white rounded-2xl border border-indigo-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">✨ 단원 미지정 추가 문제</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500">{unassignedCustomMissions.length}개</span>
                </div>
                <div className="space-y-2">
                  {unassignedCustomMissions.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-2 p-3 rounded-xl border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{m.title}</div>
                        <div className="text-xs text-gray-400">{m.topic}</div>
                      </div>
                      <select
                        value=""
                        onChange={e => moveCustomMission(m.id, e.target.value ? Number(e.target.value) : null)}
                        disabled={movingId === m.id}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-indigo-300 bg-white">
                        <option value="">단원 배정...</option>
                        {UNITS.map(u => (
                          <option key={u.id} value={u.id}>{u.id}. {u.title}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => openEdit(m)}
                        className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 transition-colors">
                        수정
                      </button>
                      <button
                        onClick={() => deleteCustomMission(m.id)}
                        disabled={deletingId === m.id}
                        className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 disabled:opacity-40 transition-colors">
                        {deletingId === m.id ? '...' : '삭제'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
