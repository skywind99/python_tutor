'use client'
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type GeneratedMission = {
  title: string
  topic: string
  description: string
  template: string
  expectedOutput: string
  tags: string[]
  hints: string[]
  level: number
}

export default function CreateMissionPage() {
  const router = useRouter()
  const [concept, setConcept] = useState('')
  const [difficulty, setDifficulty] = useState('2')
  const [context, setContext] = useState('')
  const [generating, setGenerating] = useState(false)
  const [mission, setMission] = useState<GeneratedMission | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')

  // 편집 가능한 필드
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editTemplate, setEditTemplate] = useState('')
  const [editOutput, setEditOutput] = useState('')
  const [editHints, setEditHints] = useState(['', '', ''])

  async function generate() {
    if (!concept.trim()) { setError('개념을 입력해주세요.'); return }
    setGenerating(true); setError(''); setMission(null); setSaved(false)
    try {
      const res = await fetch('/api/generate-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept, difficulty: Number(difficulty), context, unitId: 6, userId })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMission(data.mission)
      setEditTitle(data.mission.title)
      setEditDesc(data.mission.description)
      setEditTemplate(data.mission.template)
      setEditOutput(data.mission.expectedOutput)
      setEditHints(data.mission.hints || ['', '', ''])
    } catch (e: any) {
      setError(e.message || '생성에 실패했어요.')
    }
    setGenerating(false)
  }

  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    sb.auth.getUser().then(({ data: { user } }) => { if (user) setUserId(user.id) })
  }, [])

  const CONCEPTS = ['print() 출력', 'if/else 조건문', 'for 반복문', 'while 반복문', '함수 def', '리스트', 'random 모듈', '문자열 처리', '중첩 반복문', '복합 조건']
  const THEMES = ['급식 메뉴', '학교생활', '게임', '스포츠', 'K-pop', '요리', '여행', '환경', '우주', '동물']

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link href="/teacher/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
          ← 대시보드
        </Link>
        <div>
          <h1 className="font-semibold text-gray-900">✨ AI 문제 생성기</h1>
          <p className="text-xs text-gray-400">개념과 테마만 입력하면 AI가 문제를 만들어줘요</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-5">
        {/* 입력 폼 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">파이썬 개념 *</label>
            <input value={concept} onChange={e=>setConcept(e.target.value)}
              placeholder="예: while + break, 리스트 슬라이싱..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition-colors"/>
            <div className="flex flex-wrap gap-2 mt-2">
              {CONCEPTS.map(c => (
                <button key={c} onClick={()=>setConcept(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    concept===c ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}>{c}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">난이도</label>
            <div className="flex gap-2">
              {[['1','기초 ⭐'],['2','응용 ⭐⭐'],['3','심화 ⭐⭐⭐']].map(([v,l])=>(
                <button key={v} onClick={()=>setDifficulty(v)}
                  className={`flex-1 py-3 text-sm rounded-xl border-2 font-medium transition-all ${
                    difficulty===v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-100 text-gray-500 hover:border-gray-300'
                  }`}>{l}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              문제 테마/맥락 <span className="text-gray-400 font-normal">(선택 - 더 재밌는 문제가 나와요)</span>
            </label>
            <input value={context} onChange={e=>setContext(e.target.value)}
              placeholder="예: 우리 학교 급식 메뉴, 월드컵 경기 결과..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 transition-colors"/>
            <div className="flex flex-wrap gap-2 mt-2">
              {THEMES.map(t => (
                <button key={t} onClick={()=>setContext(t)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    context===t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}>{t}</button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

          <button onClick={generate} disabled={generating}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all text-sm">
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⟳</span> AI가 문제를 만들고 있어요...
              </span>
            ) : '✨ AI로 문제 생성하기'}
          </button>
        </div>

        {/* 생성된 문제 미리보기 + 편집 */}
        {mission && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">생성된 문제 (편집 가능)</h2>
                  <p className="text-xs text-gray-500 mt-0.5">내용을 수정하고 저장할 수 있어요</p>
                </div>
                {saved && (
                  <div className="flex items-center gap-2 text-teal-600 text-sm font-semibold">
                    ✓ 저장 완료!
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">제목</label>
                <input value={editTitle} onChange={e=>setEditTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-gray-400"/>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">문제 설명</label>
                <textarea value={editDesc} onChange={e=>setEditDesc(e.target.value)} rows={5}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-gray-400 resize-none font-sans"/>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">코드 템플릿</label>
                <textarea value={editTemplate} onChange={e=>setEditTemplate(e.target.value)} rows={8}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-gray-400 resize-none bg-gray-50"/>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">예상 출력</label>
                <textarea value={editOutput} onChange={e=>setEditOutput(e.target.value)} rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-gray-400 resize-none bg-gray-50"/>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">AI 힌트 3단계</label>
                <div className="space-y-2">
                  {editHints.map((h, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg mt-1.5 flex-shrink-0 font-medium">
                        {i+1}단계
                      </span>
                      <textarea value={h} onChange={e=>{
                        const next = [...editHints]; next[i]=e.target.value; setEditHints(next)
                      }} rows={2}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gray-400 resize-none"/>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={generate} disabled={generating}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors">
                  🔄 다시 생성
                </button>
                <button onClick={async () => {
                  setSaving(true)
                  // 로컬 저장 (실제로는 Supabase custom_missions 테이블에 저장)
                  const saved_mission = {
                    ...mission,
                    title: editTitle,
                    description: editDesc,
                    template: editTemplate,
                    expectedOutput: editOutput,
                    hints: editHints,
                  }
                  localStorage.setItem(`custom_mission_${Date.now()}`, JSON.stringify(saved_mission))
                  setSaved(true); setSaving(false)
                }} disabled={saving}
                  className="flex-1 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors">
                  {saving ? '저장 중...' : '✅ 문제 저장하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
