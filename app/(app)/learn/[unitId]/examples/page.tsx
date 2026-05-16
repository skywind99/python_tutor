'use client'
import { useParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { UNITS } from '@/data/missions'
import { UNIT_CONTENTS } from '@/data/content'
import { createBrowserClient } from '@supabase/ssr'

function getClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

declare global { interface Window { Sk: any } }

const XP_PER_EXAMPLE = 5

export default function ExamplesPage() {
  const params = useParams()
  const unitId = Number(params.unitId)
  const unit = UNITS.find(u => u.id === unitId)
  const content = UNIT_CONTENTS.find(c => c.unitId === unitId)
  const [pyReady, setPyReady] = useState(false)
  const [outputs, setOutputs] = useState<Record<number, {text:string, isError:boolean}>>({})
  const [running, setRunning] = useState<number | null>(null)
  const [codes, setCodes] = useState<Record<number, string>>({})
  const [inputValues, setInputValues] = useState<Record<number, string[]>>({})
  const [xpedSet, setXpedSet] = useState<Set<number>>(new Set())
  const [totalXP, setTotalXP] = useState(0)
  const [xpPopup, setXpPopup] = useState<{key: number} | null>(null)
  const popupKeyRef = useRef(0)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    async function init() {
      const sb = getClient()

      // 유저 ID + 기존 XP 로드
      const { data: { user } } = await sb.auth.getUser()
      if (user) {
        userIdRef.current = user.id
        const { data: logs } = await sb.from('xp_logs')
          .select('source_id, xp')
          .eq('student_id', user.id)
          .like('source_id', `ex-${unitId}-%`)
        if (logs && logs.length > 0) {
          const earned = new Set(logs.map((l: any) => parseInt(l.source_id.split('-')[2])))
          setXpedSet(earned)
          setTotalXP(logs.reduce((s: number, l: any) => s + (l.xp || 0), 0))
        }
      }

      if (content) {
        const initialCodes: Record<number, string> = {}
        const initialInputs: Record<number, string[]> = {}
        content.examples.forEach((ex, i) => {
          initialCodes[i] = ex.code
          initialInputs[i] = ex.defaultInputs ? [...ex.defaultInputs] : []
        })
        setCodes(initialCodes)
        setInputValues(initialInputs)
      }

      const s1 = document.createElement('script')
      s1.src = 'https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js'
      s1.onload = () => {
        const s2 = document.createElement('script')
        s2.src = 'https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js'
        s2.onload = () => setPyReady(true)
        document.head.appendChild(s2)
      }
      document.head.appendChild(s1)
    }
    init()
  }, [content, unitId])

  if (!unit || !content) return (
    <div className="flex items-center justify-center py-20 text-gray-400">단원을 찾을 수 없어요</div>
  )

  async function runCode(index: number) {
    if (!pyReady) return
    setRunning(index)
    const Sk = window.Sk
    let out = ''
    const code = codes[index] ?? (content?.examples[index]?.code || '')
    const inputs = inputValues[index] || []
    let inputIdx = 0

    Sk.configure({
      output: (t: string) => { out += t },
      read: (x: string) => {
        if (!Sk.builtinFiles?.files?.[x]) throw 'File not found: ' + x
        return Sk.builtinFiles.files[x]
      },
      inputfun: () => inputs[inputIdx++] ?? '',
      inputfunTakesPrompt: true,
      __future__: Sk.python3,
      execLimit: 5000
    })

    try {
      await Sk.misceval.asyncToPromise(() =>
        Sk.importMainWithBody('<stdin>', false, code, true)
      )
      setOutputs(prev => ({ ...prev, [index]: { text: out.trim() || '(출력 없음)', isError: false } }))

      if (!xpedSet.has(index)) {
        setXpedSet(prev => new Set([...prev, index]))
        setTotalXP(prev => prev + XP_PER_EXAMPLE)
        popupKeyRef.current += 1
        const key = popupKeyRef.current
        setXpPopup({ key })
        setTimeout(() => setXpPopup(p => p?.key === key ? null : p), 2000)

        // Supabase에 XP 저장 (중복 방지)
        if (userIdRef.current) {
          const sb = getClient()
          await sb.from('xp_logs').upsert({
            student_id: userIdRef.current,
            source_id: `ex-${unitId}-${index}`,
            xp: XP_PER_EXAMPLE
          }, { onConflict: 'student_id,source_id', ignoreDuplicates: true })
        }
      }
    } catch (e: any) {
      const errMsg = String(e).replace(/^.*?Error:/, '오류:')
      setOutputs(prev => ({ ...prev, [index]: { text: errMsg, isError: true } }))
    }
    setRunning(null)
  }

  function resetCode(index: number) {
    setCodes(prev => ({ ...prev, [index]: content?.examples[index]?.code || '' }))
    setInputValues(prev => ({ ...prev, [index]: content?.examples[index]?.defaultInputs ? [...(content.examples[index].defaultInputs!)] : [] }))
    setOutputs(prev => { const next = {...prev}; delete next[index]; return next })
  }

  const maxXP = (content?.examples.length ?? 0) * XP_PER_EXAMPLE

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <style>{`
        @keyframes xpFloat {
          0%   { opacity: 0; transform: translateY(0)   scale(0.8); }
          15%  { opacity: 1; transform: translateY(-10px) scale(1.05); }
          70%  { opacity: 1; transform: translateY(-20px) scale(1); }
          100% { opacity: 0; transform: translateY(-36px) scale(0.9); }
        }
      `}</style>

      {/* XP 팝업 */}
      {xpPopup && (
        <div key={xpPopup.key} className="fixed top-8 right-8 z-50 pointer-events-none"
          style={{ animation: 'xpFloat 2s ease-out forwards' }}>
          <div className="bg-teal-500 text-white font-bold px-5 py-2.5 rounded-full shadow-xl text-sm flex items-center gap-2">
            💎 +{XP_PER_EXAMPLE} XP
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/learn" className="hover:text-gray-600">단원 목록</Link>
            <span>›</span>
            <span>단원 {unitId}: {unit.title}</span>
          </div>
          <div className="flex rounded-xl overflow-hidden border border-gray-100 bg-gray-50 text-xs">
            <Link href={`/learn/${unitId}/concept`} className="px-3 py-2 text-gray-400 hover:text-gray-600">📖 개념</Link>
            <span className="px-3 py-2 bg-white text-gray-900 shadow-sm font-medium">💻 예제</span>
            <Link href={`/learn/${unitId}/guided`} className="px-3 py-2 text-gray-400 hover:text-gray-600">✏️ 연습</Link>
            <Link href={`/learn/${unitId}/missions`} className="px-3 py-2 text-gray-400 hover:text-gray-600">🎯 미션</Link>
            <Link href={`/learn/${unitId}/custom-missions`} className="px-3 py-2 text-gray-400 hover:text-gray-600">✨ 추가</Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            totalXP > 0 ? 'bg-teal-50 text-teal-700' : 'bg-gray-50 text-gray-300'
          }`}>
            💎 {totalXP}/{maxXP} XP
          </div>
          <div className="text-xs text-gray-400">{pyReady ? '🟢 실행 준비됨' : '⏳ 로딩 중...'}</div>
        </div>
      </div>

      {/* 예제 목록 */}
      {content.examples.map((example, i) => {
        const currentCode = codes[i] ?? example.code
        const output = outputs[i]
        const isModified = currentCode !== example.code
        const hasInputs = example.defaultInputs && example.defaultInputs.length > 0
        const currentInputs = inputValues[i] || []
        const alreadyXped = xpedSet.has(i)

        return (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{example.title}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{example.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {alreadyXped && (
                  <span className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-medium">+{XP_PER_EXAMPLE} XP 획득 ✓</span>
                )}
                {isModified && (
                  <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">수정됨</span>
                )}
                <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">예제 {i + 1}</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* 코드 에디터 */}
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <div className="flex items-center justify-between bg-gray-900 px-4 py-2.5">
                  <span className="text-xs text-gray-400 font-mono">Python</span>
                  <div className="flex gap-2">
                    <button onClick={() => navigator.clipboard?.writeText(currentCode)}
                      className="text-xs text-gray-400 hover:text-white transition-colors px-2">
                      복사
                    </button>
                    {isModified && (
                      <button onClick={() => resetCode(i)}
                        className="text-xs text-gray-400 hover:text-yellow-400 transition-colors px-2">
                        원복
                      </button>
                    )}
                    <button onClick={() => runCode(i)} disabled={!pyReady || running === i}
                      className="text-xs bg-teal-600 text-white px-3 py-1 rounded-md hover:bg-teal-700 disabled:opacity-50 transition-colors font-medium">
                      {running === i ? '실행 중...' : '▶ 실행'}
                    </button>
                  </div>
                </div>

                <textarea
                  value={currentCode}
                  onChange={e => setCodes(prev => ({ ...prev, [i]: e.target.value }))}
                  rows={Math.max(currentCode.split('\n').length + 1, 5)}
                  spellCheck={false}
                  className="w-full bg-gray-950 text-green-400 font-mono text-sm px-4 py-4 outline-none resize-none border-none"
                  style={{ minHeight: 120 }}
                />
              </div>

              {/* input() 입력값 UI */}
              {hasInputs && (
                <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                  <div className="text-xs font-semibold text-sky-700 mb-2">⌨️ 테스트 입력값 (input() 에 들어가는 값)</div>
                  <div className="flex flex-wrap gap-2">
                    {currentInputs.map((val, j) => (
                      <div key={j} className="flex items-center gap-1">
                        <span className="text-xs text-sky-400">{j + 1}번째 입력:</span>
                        <input
                          value={val}
                          onChange={e => {
                            const next = [...currentInputs]
                            next[j] = e.target.value
                            setInputValues(prev => ({ ...prev, [i]: next }))
                          }}
                          className="text-xs font-mono border border-sky-200 rounded-lg px-2 py-1 outline-none focus:border-sky-400 bg-white w-24"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-sky-400 mt-1.5">값을 바꾸고 실행해보세요!</p>
                </div>
              )}

              {/* 실행 결과 */}
              {output !== undefined && (
                <div className="rounded-xl border overflow-hidden" style={{borderColor: output.isError ? '#FCA5A5' : '#D1FAE5'}}>
                  <div className="px-4 py-2 text-xs font-semibold flex items-center gap-2"
                    style={{background: output.isError ? '#FEF2F2' : '#F0FDF4', color: output.isError ? '#DC2626' : '#059669'}}>
                    {output.isError ? '❌ 오류' : '✅ 실행 결과'}
                    {isModified && !output.isError && (
                      <span className="font-normal text-gray-400">(수정된 코드로 실행)</span>
                    )}
                  </div>
                  <pre className="font-mono text-sm px-4 py-3 whitespace-pre-wrap"
                    style={{background: output.isError ? '#FFF5F5' : '#F8FFF8', color: output.isError ? '#9B1C1C' : '#1F2937'}}>
                    {output.text}
                  </pre>
                </div>
              )}

              {/* 코드 설명 */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="text-xs font-semibold text-amber-800 mb-1.5">💬 코드 설명</div>
                <p className="text-sm text-amber-700 leading-relaxed">{example.explanation}</p>
              </div>

              {!output && (
                <p className="text-xs text-gray-400 text-center">
                  코드를 직접 수정하고 ▶ 실행을 눌러보세요.{!alreadyXped && ` 성공하면 +${XP_PER_EXAMPLE} XP!`}
                </p>
              )}
            </div>
          </div>
        )
      })}

      <Link href={`/learn/${unitId}/guided`}
        className="flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition-colors">
        빈칸 채우기 연습하기 ✏️
      </Link>
    </div>
  )
}
