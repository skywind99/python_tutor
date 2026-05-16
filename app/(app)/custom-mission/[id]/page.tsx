'use client'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

declare global { interface Window { Sk: any } }

function getClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

function norm(s: string) { return s.trim().replace(/\r\n/g, '\n').replace(/\s+$/gm, '') }

export default function CustomMissionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [mission, setMission] = useState<any>(null)
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [outputOk, setOutputOk] = useState<boolean | null>(null)
  const [diffMsg, setDiffMsg] = useState('')
  const [running, setRunning] = useState(false)
  const [pyReady, setPyReady] = useState(false)
  const [tab, setTab] = useState<'output' | 'hint'>('output')
  const [chatMessages, setChatMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [hintLoading, setHintLoading] = useState(false)
  const [passed, setPassed] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const s1 = document.createElement('script')
    s1.src = 'https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js'
    s1.onload = () => {
      const s2 = document.createElement('script')
      s2.src = 'https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js'
      s2.onload = () => setPyReady(true)
      document.head.appendChild(s2)
    }
    document.head.appendChild(s1)

    async function load() {
      const sb = getClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data } = await sb.from('custom_missions').select('*').eq('id', id).single()
      if (!data) { router.push('/dashboard'); return }
      setMission(data)
      setCode(data.template || '')
    }
    load()
  }, [id, router])

  const runCode = async () => {
    if (!pyReady || running || !mission) return
    setRunning(true); setTab('output')
    const Sk = window.Sk
    const inputs = (mission.default_input || '').split(',').map((s: string) => s.trim())
    let out = ''; let inputIdx = 0
    try {
      Sk.configure({
        output: (t: string) => { out += t },
        read: (x: string) => { if (!Sk.builtinFiles?.files?.[x]) throw 'File not found: ' + x; return Sk.builtinFiles.files[x] },
        inputfun: () => inputs[inputIdx++] || '',
        inputfunTakesPrompt: true, __future__: Sk.python3, execLimit: 5000,
      })
      await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, code, true))
      const actual = out.trim()
      setOutput(actual)
      const ok = norm(actual) === norm(mission.expected_output || '')
      setOutputOk(ok)
      if (!ok) {
        const exp = norm(mission.expected_output || '').split('\n')
        const act = norm(actual).split('\n')
        if (exp.length !== act.length) setDiffMsg(`줄 수가 달라요 (예상 ${exp.length}줄, 출력 ${act.length}줄)`)
        else {
          const wi = exp.findIndex((l, i) => l !== act[i])
          if (wi >= 0) setDiffMsg(`${wi + 1}번째 줄 → 예상: "${exp[wi]}" / 출력: "${act[wi] || '없음'}"`)
        }
      } else {
        setPassed(true)
      }
    } catch (e: any) {
      setOutput(String(e).replace(/^.*?Error:/, '오류:')); setOutputOk(false)
    }
    setRunning(false)
  }

  const sendChat = async (message: string) => {
    if (hintLoading || !mission) return
    const userMsg = message.trim()
    setHintLoading(true); setTab('hint')
    if (userMsg) setChatMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setChatInput('')
    setTimeout(scrollToBottom, 50)
    try {
      const res = await fetch('/api/hint', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionTitle: mission.title,
          missionDesc: mission.description,
          code,
          studentMessage: userMsg,
          chatHistory: chatMessages.map(m => ({ role: m.role, content: m.text })),
          errorMsg: outputOk === false ? diffMsg : undefined,
          userId,
        })
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, { role: 'ai', text: data.hint || data.error || '응답을 받지 못했어요.' }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: '힌트를 불러오지 못했어요.' }])
    }
    setHintLoading(false)
    setTimeout(scrollToBottom, 100)
  }

  if (!mission) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-4xl animate-bounce">⏳</div>
    </div>
  )

  const levelLabel = ['', '기초', '응용', '심화'][mission.level] || '응용'

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-52 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 p-4 space-y-3">
        <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600">← 대시보드</Link>
        <div className="bg-indigo-50 rounded-xl p-3">
          <div className="text-xs text-indigo-400 mb-1">선생님 추가 문제</div>
          <div className="text-sm font-semibold text-gray-800">{mission.title}</div>
          <div className="text-xs text-indigo-500 mt-1">{levelLabel} · {mission.topic}</div>
        </div>
        {passed && (
          <div className="bg-teal-50 rounded-xl p-3 text-center">
            <div className="text-2xl mb-1">🎉</div>
            <div className="text-xs font-semibold text-teal-600">미션 완료!</div>
          </div>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Problem */}
        <div className="bg-white border-b border-gray-100 p-4 overflow-y-auto flex-[2] min-h-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-gray-900">{mission.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{levelLabel}</span>
            {passed && <span className="text-xs text-teal-600 font-semibold ml-auto">✓ 완료!</span>}
          </div>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed font-sans">{mission.description}</pre>
        </div>

        {/* Output/Hint tabs */}
        <div className="bg-white border-b border-gray-100 flex flex-col flex-[2] min-h-0">
          <div className="flex border-b border-gray-100 flex-shrink-0">
            {(['output', 'hint'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {t === 'output' ? '실행 결과' : 'AI 튜터'}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {tab === 'output' ? (
              output ? (
                <div>
                  <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap mb-2">{output}</pre>
                  {outputOk === true && <div className="text-xs text-teal-600 font-semibold">✓ 정답!</div>}
                  {outputOk === false && (
                    <div>
                      <div className="text-xs text-red-500 font-semibold mb-1">✗ 아직 아니에요</div>
                      {diffMsg && <div className="text-xs text-red-400 bg-red-50 rounded p-2">{diffMsg}</div>}
                    </div>
                  )}
                </div>
              ) : <div className="text-xs text-gray-400 text-center mt-6">실행 버튼을 눌러보세요</div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto space-y-2 pb-1">
                  {chatMessages.length === 0 && !hintLoading && (
                    <div className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
                      💬 AI 튜터에게 물어보세요
                    </div>
                  )}
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user' ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-700 rounded-bl-sm'
                      }`}>{m.text}</div>
                    </div>
                  ))}
                  {hintLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-gray-400 flex items-center gap-1">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.15s' }}>●</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>●</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code editor */}
        <div className="flex-[3] flex flex-col min-h-0">
          <textarea value={code} onChange={e => setCode(e.target.value)}
            className="flex-1 p-4 font-mono text-sm text-gray-800 bg-gray-50 border-none outline-none resize-none overflow-auto" spellCheck={false} />
        </div>

        {/* 하단 고정 버튼바 */}
        <div className="bg-white border-t border-gray-100 px-4 py-2.5 flex gap-2 items-center flex-none">
          <button onClick={runCode} disabled={!pyReady || running}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
            {running ? '실행 중...' : '▶ 실행'}
          </button>
          <button onClick={() => sendChat('내 코드 분석해줘')} disabled={hintLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
            💡 분석
          </button>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && chatInput.trim()) { e.preventDefault(); sendChat(chatInput) } }}
            placeholder="AI 튜터에게 질문..."
            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-300"
            disabled={hintLoading} />
          <button onClick={() => { if (chatInput.trim()) sendChat(chatInput) }} disabled={hintLoading || !chatInput.trim()}
            className="px-3 py-2 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40">
            전송
          </button>
          <div className="text-xs text-gray-400">{pyReady ? '🟢' : '⏳'}</div>
        </div>
      </div>
    </div>
  )
}
