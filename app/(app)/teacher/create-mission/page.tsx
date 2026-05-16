'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { UNITS } from '@/data/missions'

type GeneratedMission = {
  title: string; topic: string; description: string; template: string
  expectedOutput: string; tags: string[]; hints: string[]
  level: number; needsInput: boolean; defaultInput: string
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-bounce-in ${
      type === 'success' ? 'bg-teal-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {type === 'success' ? '✅' : '❌'} {msg}
    </div>
  )
}

export default function CreateMissionPage() {
  const [concept, setConcept] = useState('')
  const [difficulty, setDifficulty] = useState('2')
  const [context, setContext] = useState('')
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [mission, setMission] = useState<GeneratedMission | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editTemplate, setEditTemplate] = useState('')
  const [editOutput, setEditOutput] = useState('')
  const [editHints, setEditHints] = useState(['', '', ''])
  const [previewTab, setPreviewTab] = useState<'desc' | 'code' | 'output'>('desc')

  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id) })
  }, [])

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function generate() {
    if (!concept.trim()) { setError('개념을 입력해주세요.'); return }
    setGenerating(true); setError(''); setMission(null)
    try {
      const res = await fetch('/api/generate-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, difficulty: Number(difficulty), context, unitId: selectedUnit || 1, userId })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMission(data.mission)
      setEditTitle(data.mission.title)
      setEditDesc(data.mission.description)
      setEditTemplate(data.mission.template)
      setEditOutput(data.mission.expectedOutput)
      setEditHints(data.mission.hints?.slice(0, 3) || ['', '', ''])
      setPreviewTab('desc')
    } catch (e: any) {
      setError(e.message || '생성에 실패했어요.')
    }
    setGenerating(false)
  }

  async function saveMission() {
    if (!mission) return
    setSaving(true)
    try {
      const res = await fetch('/api/save-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          mission: {
            ...mission,
            title: editTitle,
            description: editDesc,
            template: editTemplate,
            expectedOutput: editOutput,
            hints: editHints,
            unitId: selectedUnit,
          }
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      showToast('문제가 반 학생들에게 공개됐어요!', 'success')
    } catch (e: any) {
      showToast(e.message || '저장 실패', 'error')
    }
    setSaving(false)
  }

  const CONCEPTS = ['print() 출력', 'if/else 조건문', 'for 반복문', 'while 반복문', '함수 def', '리스트', 'random 모듈', '문자열 처리', '중첩 반복문', '복합 조건']
  const THEMES = ['급식 메뉴', '학교생활', '게임', '스포츠', 'K-pop', '요리', '여행', '환경', '우주', '동물']

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link href="/teacher/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← 대시보드</Link>
        <div>
          <h1 className="font-semibold text-gray-900">✨ AI 문제 생성기</h1>
          <p className="text-xs text-gray-400">저장하면 반 학생 미션 목록에 자동으로 추가돼요</p>
        </div>
        <Link href="/teacher/create-mission/list" className="ml-auto text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
          📋 저장된 문제 보기
        </Link>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* 왼쪽: 입력 폼 */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">

              {/* 단원 선택 */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">단원 선택 <span className="text-gray-400 font-normal">(선택)</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {UNITS.map(u => (
                    <button key={u.id} onClick={() => setSelectedUnit(selectedUnit === u.id ? null : u.id)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        selectedUnit === u.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-gray-200 text-gray-500 hover:border-indigo-300'
                      }`}>
                      {u.id}. {u.title}
                    </button>
                  ))}
                </div>
                {selectedUnit && (
                  <p className="text-xs text-indigo-500 mt-1.5">
                    ✓ {UNITS.find(u => u.id === selectedUnit)?.title} 단원으로 저장돼요
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">파이썬 개념 *</label>
                <input value={concept} onChange={e => setConcept(e.target.value)}
                  placeholder="예: while + break, 리스트 슬라이싱..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors" />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {CONCEPTS.map(c => (
                    <button key={c} onClick={() => setConcept(c)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${concept === c ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">난이도</label>
                <div className="flex gap-2">
                  {[['1', '기초 ⭐'], ['2', '응용 ⭐⭐'], ['3', '심화 ⭐⭐⭐']].map(([v, l]) => (
                    <button key={v} onClick={() => setDifficulty(v)}
                      className={`flex-1 py-2.5 text-sm rounded-xl border-2 font-medium transition-all ${difficulty === v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-100 text-gray-500 hover:border-gray-300'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  테마 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <input value={context} onChange={e => setContext(e.target.value)}
                  placeholder="예: 우리 학교 급식 메뉴, 월드컵..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 transition-colors" />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {THEMES.map(t => (
                    <button key={t} onClick={() => setContext(t)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${context === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

              <button onClick={generate} disabled={generating}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all text-sm">
                {generating ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">⟳</span> AI가 만드는 중...</span> : '✨ AI로 문제 생성'}
              </button>
            </div>
          </div>

          {/* 오른쪽: 프리뷰 + 편집 */}
          <div>
            {!mission && !generating && (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <div className="text-4xl mb-3">✨</div>
                <p className="text-sm text-gray-400">왼쪽에서 개념과 테마를 입력하고<br />생성 버튼을 눌러보세요</p>
              </div>
            )}
            {generating && (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="text-3xl animate-spin mb-3">⟳</div>
                <p className="text-sm text-gray-400">AI가 문제를 만들고 있어요...</p>
              </div>
            )}
            {mission && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex gap-1">
                    {(['desc', 'code', 'output'] as const).map((t, i) => (
                      <button key={t} onClick={() => setPreviewTab(t)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${previewTab === t ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                        {['📝 문제', '💻 템플릿', '✅ 출력'][i]}
                      </button>
                    ))}
                  </div>
                  <button onClick={generate} disabled={generating}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
                    🔄 다시 생성
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    className="w-full text-base font-semibold text-gray-900 border-0 border-b border-gray-100 pb-2 outline-none focus:border-blue-300 bg-transparent" />

                  {previewTab === 'desc' && (
                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={8}
                      className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-300 resize-none font-sans leading-relaxed" />
                  )}
                  {previewTab === 'code' && (
                    <textarea value={editTemplate} onChange={e => setEditTemplate(e.target.value)} rows={8}
                      className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-blue-300 resize-none bg-gray-50" />
                  )}
                  {previewTab === 'output' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">예상 출력</label>
                        <textarea value={editOutput} onChange={e => setEditOutput(e.target.value)} rows={4}
                          className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-blue-300 resize-none bg-gray-50" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">힌트 3단계</label>
                        <div className="space-y-2">
                          {editHints.map((h, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-xs bg-blue-50 text-blue-500 px-2 py-1 rounded-lg mt-1 flex-shrink-0">{i + 1}</span>
                              <textarea value={h} onChange={e => { const n = [...editHints]; n[i] = e.target.value; setEditHints(n) }} rows={2}
                                className="flex-1 border border-gray-100 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-300 resize-none" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <button onClick={saveMission} disabled={saving}
                    className="w-full py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all">
                    {saving ? '저장 중...' : '📤 반 학생들에게 공개하기'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce-in { 0%{transform:translate(-50%,-20px);opacity:0} 60%{transform:translate(-50%,4px)} 100%{transform:translate(-50%,0);opacity:1} }
        .animate-bounce-in { animation: bounce-in 0.3s ease forwards; }
      `}</style>
    </div>
  )
}
