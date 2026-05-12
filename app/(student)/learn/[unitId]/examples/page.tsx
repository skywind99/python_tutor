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

declare global { interface Window { Sk: any } }

export default function ExamplesPage() {
  const params = useParams()
  const unitId = Number(params.unitId)
  const unit = UNITS.find(u => u.id === unitId)
  const content = UNIT_CONTENTS.find(c => c.unitId === unitId)
  const [role, setRole] = useState('student')
  const [editMode, setEditMode] = useState(false)
  const [pyReady, setPyReady] = useState(false)
  const [outputs, setOutputs] = useState<Record<number, string>>({})
  const [running, setRunning] = useState<number | null>(null)
  const [editCodes, setEditCodes] = useState<Record<number, string>>({})

  useEffect(() => {
    getClient().auth.getUser().then(({ data: { user } }) => {
      if (user) getClient().from('profiles').select('role').eq('id', user.id).single()
        .then(({ data }) => { if (data) setRole(data.role) })
    })

    const s1 = document.createElement('script')
    s1.src = 'https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js'
    s1.onload = () => {
      const s2 = document.createElement('script')
      s2.src = 'https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js'
      s2.onload = () => setPyReady(true)
      document.head.appendChild(s2)
    }
    document.head.appendChild(s1)
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

  async function runExample(index: number, code: string) {
    if (!pyReady) return
    setRunning(index)
    const Sk = window.Sk
    let out = ''
    Sk.configure({
      output: (t: string) => { out += t },
      read: (x: string) => { if (!Sk.builtinFiles?.files?.[x]) throw 'File not found: '+x; return Sk.builtinFiles.files[x] },
      __future__: Sk.python3, execLimit: 3000
    })
    try {
      await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, code, true))
      setOutputs(prev => ({ ...prev, [index]: out.trim() || '(출력 없음)' }))
    } catch (e: any) {
      setOutputs(prev => ({ ...prev, [index]: '오류: ' + String(e).replace(/^.*?Error:/, '') }))
    }
    setRunning(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
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
              <Link href={`/learn/${unitId}/concept`} className="px-3 py-2 text-gray-400 hover:text-gray-600">📖 개념</Link>
              <Link href={`/learn/${unitId}/examples`} className="px-3 py-2 bg-white text-gray-900 shadow-sm font-medium">💻 예제</Link>
              <Link href={`/learn/${unitId}/missions`} className="px-3 py-2 text-gray-400 hover:text-gray-600">🎯 미션</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-lg">💻 예제 코드</h2>
          <div className="text-xs text-gray-400">
            {pyReady ? '🟢 실행 준비됨' : '⏳ Python 로딩 중...'}
          </div>
        </div>

        {content.examples.map((example, i) => {
          const code = editCodes[i] ?? example.code
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{example.title}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{example.description}</p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">예제 {i+1}</span>
              </div>

              <div className="p-6 space-y-4">
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <div className="flex items-center justify-between bg-gray-900 px-4 py-2.5">
                    <span className="text-xs text-gray-400 font-mono">Python</span>
                    <div className="flex gap-2">
                      <button onClick={() => navigator.clipboard?.writeText(code)} className="text-xs text-gray-400 hover:text-white transition-colors">복사</button>
                      <button onClick={() => runExample(i, code)} disabled={!pyReady || running === i}
                        className="text-xs bg-teal-600 text-white px-3 py-1 rounded-md hover:bg-teal-700 disabled:opacity-50 transition-colors font-medium">
                        {running === i ? '실행 중...' : '▶ 실행'}
                      </button>
                    </div>
                  </div>
                  {editMode ? (
                    <textarea value={code} onChange={e => setEditCodes(prev => ({ ...prev, [i]: e.target.value }))}
                      rows={code.split('\n').length + 1}
                      className="w-full bg-gray-950 text-green-400 font-mono text-sm px-4 py-4 outline-none resize-none border-none"/>
                  ) : (
                    <pre className="bg-gray-950 text-green-400 font-mono text-sm px-4 py-4 overflow-x-auto"><code>{code}</code></pre>
                  )}
                </div>

                {outputs[i] !== undefined && (
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400">출력 결과</div>
                    <pre className="bg-gray-900 text-white font-mono text-sm px-4 py-3 whitespace-pre-wrap">{outputs[i]}</pre>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="text-xs font-semibold text-amber-800 mb-1.5">💬 코드 설명</div>
                  <p className="text-sm text-amber-700 leading-relaxed">{example.explanation}</p>
                </div>
              </div>
            </div>
          )
        })}

        <Link href={`/learn/${unitId}/missions`}
          className="flex items-center justify-center gap-2 py-4 bg-orange-500 text-white font-semibold rounded-2xl hover:bg-orange-600 transition-colors">
          미션 풀러 가기 🎯
        </Link>
      </div>
    </div>
  )
}
