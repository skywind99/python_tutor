'use client'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { UNITS } from '@/data/missions'
import { UNIT_CONTENTS } from '@/data/content'
import { createBrowserClient } from '@supabase/ssr'

function getClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export default function ConceptPage() {
  const params = useParams()
  const unitId = Number(params.unitId)
  const unit = UNITS.find(u => u.id === unitId)
  const content = UNIT_CONTENTS.find(c => c.unitId === unitId)
  const [role, setRole] = useState('student')
  const [editMode, setEditMode] = useState(false)
  const [activeSection, setActiveSection] = useState(0)

  useEffect(() => {
    getClient().auth.getUser().then(({ data: { user } }) => {
      if (user) getClient().from('profiles').select('role').eq('id', user.id).single()
        .then(({ data }) => { if (data) setRole(data.role) })
    })
  }, [])

  if (!unit || !content) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-gray-500">단원을 찾을 수 없어요</p>
        <Link href="/learn" className="text-blue-600 text-sm mt-2 block">← 단원 목록으로</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/learn" className="text-gray-400 hover:text-gray-600 text-sm">← 단원 목록</Link>
            <span className="text-gray-200">|</span>
            <span className="font-semibold text-gray-900 text-sm">단원 {unitId}: {unit.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {role === 'teacher' && (
              <button onClick={() => setEditMode(!editMode)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${editMode ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600'}`}>
                {editMode ? '✏️ 편집 중' : '✏️ 교사 편집'}
              </button>
            )}
            <div className="flex rounded-xl overflow-hidden border border-gray-100 bg-gray-50 text-xs">
              <Link href={`/learn/${unitId}/concept`} className="px-3 py-2 bg-white text-gray-900 shadow-sm font-medium">📖 개념</Link>
              <Link href={`/learn/${unitId}/examples`} className="px-3 py-2 text-gray-400 hover:text-gray-600">💻 예제</Link>
              <Link href={`/learn/${unitId}/guided`} className="px-3 py-2 text-gray-400 hover:text-gray-600">✏️ 연습</Link>
              <Link href={`/learn/${unitId}/missions`} className="px-3 py-2 text-gray-400 hover:text-gray-600">🎯 미션</Link>
              <Link href={`/learn/${unitId}/custom-missions`} className="px-3 py-2 text-gray-400 hover:text-gray-600">✨ 추가</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <div className="text-sm font-semibold text-blue-900 mb-1">이번 단원에서 배울 것</div>
              <p className="text-sm text-blue-700 leading-relaxed">{content.concept.summary}</p>
            </div>
          </div>
        </div>

        {content.concept.sections.map((section, i) => (
          <div key={i} className={`bg-white rounded-2xl border transition-all ${activeSection === i ? 'border-blue-200 shadow-sm' : 'border-gray-100'}`}>
            <button className="w-full text-left px-6 py-4 flex items-center justify-between" onClick={() => setActiveSection(activeSection === i ? -1 : i)}>
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">{i+1}</span>
                <h2 className="font-semibold text-gray-900">{section.title}</h2>
              </div>
              <span className="text-gray-400">{activeSection === i ? '▲' : '▼'}</span>
            </button>
            {activeSection === i && (
              <div className="px-6 pb-6 space-y-4">
                <p className="text-gray-600 leading-relaxed text-sm">{section.body}</p>
                {section.code && (
                  <div className="rounded-xl overflow-hidden border border-gray-100">
                    <div className="flex items-center justify-between bg-gray-900 px-4 py-2">
                      <span className="text-xs text-gray-400 font-mono">Python</span>
                      <button onClick={() => navigator.clipboard?.writeText(section.code || '')} className="text-xs text-gray-400 hover:text-white">복사</button>
                    </div>
                    {editMode ? (
                      <textarea defaultValue={section.code} rows={section.code.split('\n').length + 1}
                        className="w-full bg-gray-950 text-green-400 font-mono text-sm px-4 py-4 outline-none resize-none border-none w-full"/>
                    ) : (
                      <pre className="bg-gray-950 text-green-400 font-mono text-sm px-4 py-4 overflow-x-auto"><code>{section.code}</code></pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">✅ 핵심 정리</h2>
          <div className="grid grid-cols-2 gap-3">
            {content.concept.keyPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-teal-50 rounded-xl">
                <span className="text-teal-500 text-sm mt-0.5">•</span>
                <span className="text-sm text-teal-800 leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>

        <Link href={`/learn/${unitId}/examples`}
          className="flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition-colors">
          예제 코드 보러 가기 💻
        </Link>
      </div>
    </div>
  )
}
