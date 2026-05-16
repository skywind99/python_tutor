'use client'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createBrowserClient } from '@supabase/ssr'

const DotLottie = dynamic(
  () => import('@lottiefiles/dotlottie-react').then(m => ({ default: m.DotLottieReact })),
  { ssr: false }
)

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
  const [chatMessages, setChatMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [hintLoading, setHintLoading] = useState(false)
  const [hintCount, setHintCount] = useState(0)
  const [passed, setPassed] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [showSuccessLottie, setShowSuccessLottie] = useState(false)
  const [showErrorLottie, setShowErrorLottie] = useState(false)
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
    setRunning(true)
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
        setShowErrorLottie(true); setTimeout(() => setShowErrorLottie(false), 2200)
      } else if (!passed) {
        setPassed(true)
        setShowSuccessLottie(true)
        setTimeout(() => setShowSuccessLottie(false), 3500)
        if (userId) {
          const sb = getClient()
          sb.from('custom_mission_logs').upsert({
            custom_mission_id: id,
            student_id: userId,
            passed: true,
            code,
            score: Math.max(10, 100 - hintCount * 15),
            hints_used: hintCount,
          }, { onConflict: 'custom_mission_id,student_id' })
        }
      }
    } catch (e: any) {
      setOutput(String(e).replace(/^.*?Error:/, '오류:'))
      setOutputOk(false)
      setShowErrorLottie(true); setTimeout(() => setShowErrorLottie(false), 2200)
    }
    setRunning(false)
  }

  const sendChat = async (message: string) => {
    if (hintLoading || !mission) return
    const userMsg = message.trim()
    setHintLoading(true)
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
      setHintCount(c => Math.min(c + 1, 5))
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: '힌트를 불러오지 못했어요.' }])
    }
    setHintLoading(false)
    setTimeout(scrollToBottom, 100)
  }

  if (!mission) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
      <div className="text-4xl animate-bounce">⏳</div>
    </div>
  )

  const levelLabel = ['', '기초', '응용', '심화'][mission.level] || '응용'
  const levelColors: Record<string, { bg: string; text: string }> = {
    '기초': { bg: 'rgba(63,185,80,0.15)', text: '#3fb950' },
    '응용': { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
    '심화': { bg: 'rgba(248,81,73,0.15)', text: '#f85149' },
  }
  const lv = levelColors[levelLabel] || levelColors['응용']

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 3.5rem)', background: '#0d1117' }}>

      {/* ── 사이드바 ── */}
      <div className="w-52 flex flex-col overflow-y-auto flex-shrink-0" style={{ background: '#161b22', borderRight: '1px solid #30363d' }}>
        <div className="p-4" style={{ borderBottom: '1px solid #30363d' }}>
          <Link href="/dashboard" className="text-xs hover:opacity-80 mb-2 block transition-opacity" style={{ color: '#8b949e' }}>← 대시보드</Link>
          <div className="text-xs font-semibold mb-0.5" style={{ color: '#a78bfa' }}>✨ 추가문제</div>
          <div className="font-semibold text-sm text-white mt-1">{mission.title}</div>
          <div className="mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: lv.bg, color: lv.text }}>
              {levelLabel}
            </span>
            {mission.topic && (
              <span className="text-xs ml-1.5" style={{ color: '#8b949e' }}>{mission.topic}</span>
            )}
          </div>
        </div>

        {mission.unit_id && (
          <div className="p-3" style={{ borderBottom: '1px solid #21262d' }}>
            <Link href={`/learn/${mission.unit_id}/missions`}
              className="text-xs hover:opacity-80 transition-opacity block"
              style={{ color: '#58a6ff' }}>
              ← 단원 미션으로 돌아가기
            </Link>
          </div>
        )}

        {passed && (
          <div className="m-3 rounded-xl p-3 text-center" style={{ background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.3)' }}>
            <div className="text-2xl mb-1">🎉</div>
            <div className="text-xs font-semibold" style={{ color: '#3fb950' }}>미션 완료!</div>
          </div>
        )}

        {mission.hints && mission.hints.length > 0 && (
          <div className="p-3">
            <div className="text-xs font-semibold mb-2" style={{ color: '#8b949e' }}>💡 힌트</div>
            <div className="space-y-1.5">
              {mission.hints.map((h: string, i: number) => (
                <div key={i} className="text-xs rounded-lg px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.04)', color: '#c9d1d9' }}>
                  {i + 1}. {h}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 메인: 좌우 분할 ── */}
      <div className="flex-1 flex overflow-hidden min-w-0">

        {/* ── 좌측 패널: 문제 설명 + AI 채팅 ── */}
        <div className="flex flex-col overflow-hidden flex-shrink-0" style={{ width: '42%', background: '#ffffff', borderRight: '1px solid #e5e7eb' }}>

          {/* 문제 설명 */}
          <div className="overflow-y-auto p-5" style={{ flex: '3 1 0%', minHeight: 0, borderBottom: '1px solid #e5e7eb' }}>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="font-bold text-gray-900 text-sm">{mission.title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: lv.bg, color: lv.text }}>
                {levelLabel}
              </span>
              {passed && (
                <span className="text-xs font-semibold ml-auto" style={{ color: '#059669' }}>✓ 완료!</span>
              )}
            </div>
            {mission.topic && (
              <div className="flex gap-1 flex-wrap mb-3">
                <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: '#f3f4f6', color: '#6b7280' }}>{mission.topic}</span>
              </div>
            )}
            <pre className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed font-sans">{mission.description}</pre>
            {mission.expected_output && (
              <div className="mt-4 rounded-xl px-3 py-2.5" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div className="text-xs font-semibold mb-1" style={{ color: '#059669' }}>📋 예상 출력</div>
                <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: '#047857' }}>{mission.expected_output}</pre>
              </div>
            )}
          </div>

          {/* AI 튜터 채팅 */}
          <div className="flex flex-col overflow-hidden" style={{ flex: '4 1 0%', minHeight: 0, background: '#f9fafb' }}>
            <div className="flex items-center justify-between px-3 py-2 flex-shrink-0" style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
              <div className="text-xs font-semibold text-gray-700">AI 튜터</div>
              <div className="flex items-center gap-2">
                {hintCount > 0 && (
                  <span className="text-xs" style={{ color: '#9ca3af' }}>힌트 {hintCount}회 사용</span>
                )}
                {hintLoading && (
                  <span className="text-xs animate-pulse" style={{ color: '#6366f1' }}>생각 중...</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {chatMessages.length === 0 && !hintLoading && (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <div style={{ width: 120, height: 120 }}>
                    <DotLottie src="/lottie/animation/Live chatbot.lottie" loop autoplay />
                  </div>
                  <p className="text-xs text-center" style={{ color: '#9ca3af' }}>AI 튜터에게 질문하거나<br />코드를 분석 받아보세요!</p>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'text-white rounded-br-sm' : 'text-gray-700 rounded-bl-sm'}`}
                    style={m.role === 'user'
                      ? { background: '#2563eb' }
                      : { background: 'white', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }
                    }>
                    {m.text}
                  </div>
                </div>
              ))}
              {hintLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm px-3 py-2 text-xs flex items-center gap-1"
                    style={{ background: 'white', border: '1px solid #e5e7eb', color: '#9ca3af' }}>
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.15s' }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>●</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-2 flex gap-1.5 flex-shrink-0 items-center" style={{ background: 'white', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ width: 44, height: 44, flexShrink: 0 }}>
                <DotLottie src="/lottie/animation/Flirting Dog.lottie" loop autoplay />
              </div>
              <button onClick={() => sendChat('내 코드 분석해줘')} disabled={hintLoading}
                className="px-2.5 py-2 text-xs rounded-lg border transition-colors disabled:opacity-40 whitespace-nowrap font-medium"
                style={{ borderColor: '#e5e7eb', color: '#374151' }}>
                💡 분석
              </button>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && chatInput.trim()) { e.preventDefault(); sendChat(chatInput) } }}
                placeholder="질문하세요..."
                className="flex-1 text-xs border rounded-lg px-3 py-2 outline-none min-w-0"
                style={{ borderColor: '#e5e7eb' }}
                disabled={hintLoading}
              />
              <button onClick={() => { if (chatInput.trim()) sendChat(chatInput) }} disabled={hintLoading || !chatInput.trim()}
                className="px-3 py-2 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-40"
                style={{ background: '#2563eb' }}>
                전송
              </button>
            </div>
          </div>
        </div>

        {/* ── 우측 패널: 코드 에디터 + 실행 결과 ── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ background: '#0d1117' }}>

          {/* 코드 에디터 헤더 */}
          <div className="flex items-center justify-between px-4 py-2 flex-shrink-0"
            style={{ background: '#161b22', borderBottom: '1px solid #30363d' }}>
            <span className="text-xs font-mono" style={{ color: '#8b949e' }}>Python</span>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: pyReady ? '#3fb950' : '#8b949e' }}>
                {pyReady ? '● 준비됨' : '● 로딩 중...'}
              </span>
              <button onClick={runCode} disabled={!pyReady || running}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all disabled:opacity-40 active:scale-95"
                style={{ background: running ? '#1f6feb' : '#238636', color: '#ffffff' }}>
                {running ? '⏳ 실행 중...' : '▶  실행'}
              </button>
            </div>
          </div>

          {/* 코드 textarea */}
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            className="p-4 font-mono text-sm border-none outline-none resize-none overflow-auto"
            style={{
              flex: '5 1 0%', minHeight: 0,
              background: '#0d1117',
              color: '#e6edf3',
              caretColor: '#e6edf3',
              lineHeight: '1.7',
              tabSize: 4,
            }}
            spellCheck={false}
          />

          {/* 실행 결과 영역 */}
          <div className="flex flex-col overflow-hidden" style={{ flex: '3 1 0%', minHeight: 0, background: '#161b22', borderTop: '1px solid #30363d' }}>
            <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0" style={{ borderBottom: '1px solid #21262d' }}>
              <span className="text-xs font-semibold" style={{ color: '#8b949e' }}>실행 결과</span>
              {outputOk === true && (
                <span className="text-xs font-bold" style={{ color: '#3fb950' }}>✓ 정답!</span>
              )}
              {outputOk === false && (
                <span className="text-xs font-bold" style={{ color: '#f85149' }}>✗ 아직 아니에요</span>
              )}
              {showErrorLottie && (
                <div className="ml-auto" style={{ width: 40, height: 40 }}>
                  <DotLottie src="/lottie/animation/Cat Crying emojiSticker animation.lottie" loop autoplay />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
              {output ? (
                <div>
                  <pre className="text-xs font-mono whitespace-pre-wrap mb-2" style={{ color: '#c9d1d9' }}>{output}</pre>
                  {outputOk === false && diffMsg && (
                    <div className="text-xs rounded-lg px-3 py-2 mt-2"
                      style={{ background: 'rgba(248,81,73,0.1)', color: '#f85149', border: '1px solid rgba(218,54,51,0.4)' }}>
                      {diffMsg}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center mt-6">
                  <div className="text-2xl mb-2">⚡</div>
                  <p className="text-xs" style={{ color: '#6e7681' }}>▶ 실행 버튼을 눌러 결과를 확인하세요</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 성공 오버레이 ── */}
      {showSuccessLottie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.18)' }}>
          <div style={{ width: 320, height: 320 }}>
            <DotLottie src="/lottie/animation/Cute Mascot Jumping Character.lottie" loop={false} autoplay />
          </div>
        </div>
      )}
    </div>
  )
}
