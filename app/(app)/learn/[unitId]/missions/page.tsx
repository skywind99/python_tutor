'use client'
import { useParams } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { MISSIONS, UNITS, LEVEL_INFO, calcScore } from '@/data/missions'
import type { Mission } from '@/data/missions'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

const DotLottie = dynamic(
  () => import('@lottiefiles/dotlottie-react').then(m => ({ default: m.DotLottieReact })),
  { ssr: false }
)

declare global { interface Window { Sk: any } }

function getClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

const GEM_TYPES = [
  { colors: ['#E83030','#FF5555','#C01818'] },
  { colors: ['#2855C8','#4477EE','#1833A0'] },
  { colors: ['#18A845','#2ECC60','#0D7A30'] },
  { colors: ['#E89020','#FFB833','#C07010'] },
  { colors: ['#8B35BB','#A855D4','#6622A0'] },
  { colors: ['#70C8E8','#A0E0F8','#4090B8'] },
]
function GemSVG({ type, size=26 }: { type: typeof GEM_TYPES[0], size?: number }) {
  const [c1,c2,c3] = type.colors
  return (
    <svg width={size} height={size} viewBox="0 0 30 34">
      <polygon points="15,2 27,10 27,24 15,32 3,24 3,10" fill={c1}/>
      <polygon points="15,2 27,10 15,18" fill={c2} opacity="0.6"/>
      <polygon points="15,2 3,10 15,18" fill="white" opacity="0.25"/>
      <polygon points="3,10 15,18 3,24" fill={c3} opacity="0.5"/>
      <polygon points="27,10 15,18 27,24" fill={c3} opacity="0.3"/>
      <polygon points="15,18 3,24 15,32 27,24" fill={c1} opacity="0.8"/>
    </svg>
  )
}

function norm(s: string) { return s.trim().replace(/\r\n/g,'\n').replace(/\s+$/gm,'') }

export default function MissionsPage() {
  const params = useParams()
  const unitId = Number(params.unitId)
  const unit = UNITS.find(u => u.id === unitId)
  const missions = MISSIONS.filter(m => m.unitId === unitId)

  const [current, setCurrent] = useState<Mission>(missions[0])
  const [code, setCode] = useState(missions[0]?.template || '')
  const [output, setOutput] = useState('')
  const [outputOk, setOutputOk] = useState<boolean|null>(null)
  const [diffMsg, setDiffMsg] = useState('')
  const [testResults, setTestResults] = useState<{label:string;passed:boolean;actual:string;expected:string;inputs:string[]}[]>([])
  const [chatMessages, setChatMessages] = useState<{role:'ai'|'user', text:string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [hintCount, setHintCount] = useState(0)
  const [hintLoading, setHintLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [running, setRunning] = useState(false)
  const [pyReady, setPyReady] = useState(false)
  const [score, setScore] = useState(0)
  const [xp, setXp] = useState(0)
  const [level, setLevel] = useState(1)
  const [passed, setPassed] = useState<Record<number,{hints:number,score:number}>>({})
  const [gems, setGems] = useState<{id:number,type:typeof GEM_TYPES[0],x:number}[]>([])
  const [pile, setPile] = useState<typeof GEM_TYPES[0][]>([])
  const [celebration, setCelebration] = useState('')
  const [scorePopup, setScorePopup] = useState<{text:string}|null>(null)
  const [role, setRole] = useState('student')
  const [userId, setUserId] = useState<string|null>(null)
  const gemIdRef = useRef(0)

  const [showSuccessLottie, setShowSuccessLottie] = useState(false)
  const [showErrorLottie, setShowErrorLottie] = useState(false)

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


    async function loadUserProgress() {
      const sb = getClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).single()
      if (prof) setRole(prof.role)
      try {
        const res = await fetch('/api/progress')
        const data = await res.json()
        const logs = data.logs || []
        const passedMap: Record<number,{hints:number,score:number}> = {}
        let totalScore = 0
        logs.forEach((l: any) => {
          if (l.passed) {
            passedMap[l.mission_id] = { hints: l.hints_used, score: l.score }
            totalScore += l.score
          }
        })
        setPassed(passedMap)
        setScore(totalScore)
        setXp(totalScore % 1000)
        setLevel(Math.floor(totalScore / 1000) + 1)
      } catch (e) { console.error('Load progress failed:', e) }
      const initialPile = Array.from({length:28}, () => GEM_TYPES[Math.floor(Math.random()*GEM_TYPES.length)])
      setPile(initialPile)
    }
    loadUserProgress()
  }, [])

  const changeMission = (m: Mission) => {
    setCurrent(m); setCode(m.template); setOutput(''); setOutputOk(null)
    setDiffMsg(''); setTestResults([]); setChatMessages([]); setChatInput(''); setHintCount(0)
  }

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const runCode = async () => {
    if (!pyReady || running) return
    setRunning(true)
    const Sk = window.Sk

    if (current.testCases && current.testCases.length > 0) {
      setTestResults([])
      const results: {label:string;passed:boolean;actual:string;expected:string;inputs:string[]}[] = []
      try {
        for (const tc of current.testCases) {
          let out = ''; let inputIdx = 0
          Sk.configure({
            output: (t: string) => { out += t },
            read: (x: string) => { if (!Sk.builtinFiles?.files?.[x]) throw 'File not found: '+x; return Sk.builtinFiles.files[x] },
            inputfun: () => tc.inputs[inputIdx++] ?? '',
            inputfunTakesPrompt: true, __future__: Sk.python3, execLimit: 5000,
          })
          await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, code, true))
          const actual = out.trim()
          results.push({ label: tc.label, passed: norm(actual) === norm(tc.expectedOutput), actual, expected: tc.expectedOutput, inputs: tc.inputs })
        }
      } catch (e: any) {
        setOutput(String(e).replace(/^.*?Error:/,'오류:')); setOutputOk(false); setRunning(false); return
      }
      setTestResults(results)
      const allPassed = results.every(r => r.passed)
      setOutputOk(allPassed)
      if (allPassed && !passed[current.id]) await onPass(results[0].actual)
      else if (!allPassed) { setShowErrorLottie(true); setTimeout(() => setShowErrorLottie(false), 2200) }
      setRunning(false)
      return
    }

    const inputs = (current.defaultInput || '').split(',').map((s: string) => s.trim())
    let out = ''; let inputIdx = 0
    try {
      Sk.configure({
        output: (t: string) => { out += t },
        read: (x: string) => { if (!Sk.builtinFiles?.files?.[x]) throw 'File not found: '+x; return Sk.builtinFiles.files[x] },
        inputfun: () => inputs[inputIdx++] || '',
        inputfunTakesPrompt: true, __future__: Sk.python3, execLimit: 5000,
      })
      await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, code, true))
      const actual = out.trim()
      setOutput(actual)
      const ok = norm(actual) === norm(current.expectedOutput)
      setOutputOk(ok)
      if (!ok) {
        const exp = norm(current.expectedOutput).split('\n')
        const act = norm(actual).split('\n')
        if (exp.length !== act.length) setDiffMsg(`줄 수가 달라요 (예상 ${exp.length}줄, 출력 ${act.length}줄)`)
        else {
          const wi = exp.findIndex((l,i)=>l!==act[i])
          if(wi>=0) setDiffMsg(`${wi+1}번째 줄 → 예상: "${exp[wi]}" / 출력: "${act[wi]||'없음'}"`)
        }
        setShowErrorLottie(true); setTimeout(() => setShowErrorLottie(false), 2200)
      } else if (!passed[current.id]) {
        await onPass(actual)
      }
    } catch (e: any) {
      setOutput(String(e).replace(/^.*?Error:/,'오류:')); setOutputOk(false)
      setShowErrorLottie(true); setTimeout(() => setShowErrorLottie(false), 2200)
    }
    setRunning(false)
  }

  const onPass = async (actualOutput: string) => {
    const s = calcScore(current.level, hintCount)
    const gemN = LEVEL_INFO[current.level].gemCount + (hintCount===0?5:0)
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId: current.id, passed: true, hintsUsed: hintCount, score: s, code })
      })
    } catch (e) { console.error('Save failed:', e) }

    setPassed(p => ({...p, [current.id]: {hints: hintCount, score: s}}))
    setScore(prev => prev + s)
    setXp(prev => { const nx = prev + Math.floor(s/3); if(nx>=1000){setLevel(l=>l+1);return nx-1000} return nx })
    setScorePopup({ text: `+${s}` })
    setTimeout(() => setScorePopup(null), 1500)

    setShowSuccessLottie(true)
    setTimeout(() => setShowSuccessLottie(false), 3500)

    for (let i=0; i<gemN; i++) {
      setTimeout(() => {
        const type = GEM_TYPES[Math.floor(Math.random()*GEM_TYPES.length)]
        const id = ++gemIdRef.current
        setGems(g => [...g, {id, type, x: 10+Math.random()*80}])
        setTimeout(() => {
          setGems(g => g.filter(gem=>gem.id!==id))
          setPile(p => [...p, type].slice(-60))
        }, 900)
      }, i*80)
    }

    const msgs = hintCount===0
      ? ['🔥 천재! 힌트 없이 혼자 해냈어!','⚡ 완벽해! 보너스 보석 +5개!']
      : ['💎 미션 클리어!','🎯 잘했어! 다음 미션도 화이팅!']
    setCelebration(msgs[Math.floor(Math.random()*msgs.length)])
    setTimeout(() => setCelebration(''), 2500)
  }

  const sendChat = async (message: string) => {
    if (hintLoading) return
    const userMsg = message.trim()
    setHintLoading(true)
    if (userMsg) setChatMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setChatInput('')
    setTimeout(scrollToBottom, 50)


    try {
      const res = await fetch('/api/hint', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionTitle: current.title,
          missionDesc: current.description,
          code,
          studentMessage: userMsg,
          chatHistory: chatMessages.map(m => ({ role: m.role, content: m.text })),
          errorMsg: outputOk === false ? diffMsg : undefined,
          userId,
        })
      })
      const data = await res.json()
      const reply = data.hint || data.error || '응답을 받지 못했어요.'
      setChatMessages(prev => [...prev, { role: 'ai', text: reply }])
      setHintCount(c => Math.min(c + 1, 5))
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', text: '힌트를 불러오지 못했어요. 다시 시도해주세요.' }])
    }
    setHintLoading(false)
    setTimeout(scrollToBottom, 100)
  }

  const xpPct = Math.min((xp/1000)*100,100)
  const ringArc = Math.round((xp/1000)*94)
  const lv = LEVEL_INFO[current.level]

  return (
    <div className="flex overflow-hidden" style={{height:'calc(100vh - 3.5rem)',background:'#0d1117'}}>

      {/* ── 사이드바: 미션 목록 ── */}
      <div className="w-52 flex flex-col overflow-y-auto flex-shrink-0" style={{background:'#161b22',borderRight:'1px solid #30363d'}}>
        <div className="p-4" style={{borderBottom:'1px solid #30363d'}}>
          <Link href="/learn" className="text-xs hover:opacity-80 mb-2 block transition-opacity" style={{color:'#8b949e'}}>← 단원 목록</Link>
          <div className="text-xs font-semibold mb-0.5" style={{color:'#8b949e'}}>단원 {unitId}</div>
          <div className="font-semibold text-sm text-white">{unit?.title}</div>
          <div className="flex gap-1 mt-2">
            <Link href={`/learn/${unitId}/concept`} className="text-xs px-2 py-1 rounded-lg transition-colors" style={{background:'rgba(255,255,255,0.05)',color:'#8b949e'}}>📖</Link>
            <Link href={`/learn/${unitId}/examples`} className="text-xs px-2 py-1 rounded-lg transition-colors" style={{background:'rgba(255,255,255,0.05)',color:'#8b949e'}}>💻</Link>
            <Link href={`/learn/${unitId}/guided`} className="text-xs px-2 py-1 rounded-lg transition-colors" style={{background:'rgba(255,255,255,0.05)',color:'#8b949e'}}>✏️</Link>
            <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{background:'rgba(249,115,22,0.15)',color:'#fb923c'}}>🎯</span>
          </div>
        </div>
        {missions.map(m => {
          const lv = LEVEL_INFO[m.level]; const done = passed[m.id]; const active = current.id===m.id
          return (
            <button key={m.id} onClick={() => changeMission(m)}
              className="text-left p-3 transition-colors"
              style={{
                borderBottom:'1px solid #21262d',
                background: active ? 'rgba(31,111,235,0.15)' : 'transparent',
                borderLeft: active ? '2px solid #1f6feb' : '2px solid transparent',
              }}>
              <div className="flex items-center gap-1.5 mb-1">
                {done
                  ? <span className="text-xs font-bold" style={{color:'#3fb950'}}>✓</span>
                  : <span className="text-xs" style={{color:'#30363d'}}>○</span>}
                <span className="text-xs font-semibold text-white truncate">{m.title}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:lv.bg,color:lv.text}}>{lv.label}</span>
                {done && <span className="text-xs" style={{color:'#8b949e'}}>{done.score}점</span>}
              </div>
            </button>
          )
        })}
        {role === 'teacher' && (
          <Link href="/teacher/create-mission" className="m-3 py-2 text-center text-xs rounded-xl font-medium transition-colors" style={{background:'rgba(31,111,235,0.15)',color:'#58a6ff'}}>
            ✨ 문제 만들기
          </Link>
        )}
      </div>

      {/* ── 메인: 좌우 분할 ── */}
      <div className="flex-1 flex overflow-hidden min-w-0">

        {/* ── 좌측 패널: 문제 설명 + AI 채팅 ── */}
        <div className="flex flex-col overflow-hidden flex-shrink-0" style={{width:'42%',background:'#ffffff',borderRight:'1px solid #e5e7eb'}}>

          {/* 문제 설명 */}
          <div className="overflow-y-auto p-5" style={{flex:'3 1 0%',minHeight:0,borderBottom:'1px solid #e5e7eb'}}>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="font-bold text-gray-900 text-sm">{current.title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{background:lv.bg,color:lv.text}}>
                {lv.label}
              </span>
              {passed[current.id] && (
                <span className="text-xs font-semibold ml-auto" style={{color:'#059669'}}>✓ 완료 · {passed[current.id].score}점</span>
              )}
            </div>
            <div className="flex gap-1 flex-wrap mb-4">
              {current.tags.map(t=>(
                <span key={t} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{background:'#f3f4f6',color:'#6b7280'}}>{t}</span>
              ))}
            </div>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed font-sans">{current.description}</pre>
            {current.testCases && (
              <div className="mt-4 rounded-xl px-3 py-2.5" style={{background:'#eef2ff',border:'1px solid #c7d2fe'}}>
                <span className="text-xs font-semibold" style={{color:'#4338ca'}}>🧪 {current.testCases.length}가지 입력으로 자동 검증돼요</span>
              </div>
            )}
            {current.needsInput && !current.testCases && (
              <div className="mt-4 rounded-xl px-3 py-2.5" style={{background:'#f0fdf4',border:'1px solid #bbf7d0'}}>
                <div className="text-xs font-semibold mb-1.5" style={{color:'#059669'}}>⌨️ 테스트 입력값</div>
                <input
                  className="text-xs font-mono border rounded px-2 py-1 outline-none w-full"
                  style={{borderColor:'#d1fae5',background:'white'}}
                  defaultValue={current.defaultInput}
                  onChange={e=>{(current as any)._testInput=e.target.value}}
                />
              </div>
            )}
          </div>

          {/* AI 튜터 채팅 */}
          <div className="flex flex-col overflow-hidden" style={{flex:'4 1 0%',minHeight:0,background:'#f9fafb'}}>
            {/* 채팅 헤더 */}
            <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0" style={{background:'white',borderBottom:'1px solid #e5e7eb'}}>
              <div style={{width:36,height:36,flexShrink:0}}>
                <DotLottie src="/lottie/animation/Live chatbot.lottie" loop autoplay />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-700">AI 튜터</div>
                {hintCount > 0 && (
                  <div className="text-xs" style={{color:'#9ca3af'}}>힌트 {hintCount}회 사용</div>
                )}
              </div>
              {hintLoading && (
                <span className="text-xs animate-pulse" style={{color:'#6366f1'}}>생각 중...</span>
              )}
            </div>

            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {chatMessages.length === 0 && !hintLoading && (
                <div className="text-center mt-6 leading-relaxed">
                  <div className="text-2xl mb-2">💬</div>
                  <p className="text-xs" style={{color:'#9ca3af'}}>AI 튜터에게 질문하거나<br/>코드를 분석 받아보세요!</p>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'text-white rounded-br-sm'
                      : 'text-gray-700 rounded-bl-sm'
                  }`} style={m.role === 'user'
                    ? {background:'#2563eb'}
                    : {background:'white',border:'1px solid #e5e7eb',boxShadow:'0 1px 2px rgba(0,0,0,0.06)'}
                  }>
                    {m.text}
                  </div>
                </div>
              ))}
              {hintLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm px-3 py-2 text-xs flex items-center gap-1"
                    style={{background:'white',border:'1px solid #e5e7eb',color:'#9ca3af'}}>
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce" style={{animationDelay:'0.15s'}}>●</span>
                    <span className="animate-bounce" style={{animationDelay:'0.3s'}}>●</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* 입력창 */}
            <div className="p-2 flex gap-1.5 flex-shrink-0 items-center" style={{background:'white',borderTop:'1px solid #e5e7eb'}}>
              <div style={{width:28,height:28,flexShrink:0}}>
                <DotLottie src="/lottie/animation/Flirting Dog.lottie" loop autoplay />
              </div>
              <button onClick={() => sendChat('내 코드 분석해줘')} disabled={hintLoading}
                className="px-2.5 py-2 text-xs rounded-lg border transition-colors disabled:opacity-40 whitespace-nowrap font-medium"
                style={{borderColor:'#e5e7eb',color:'#374151'}}>
                💡 분석
              </button>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && chatInput.trim()) { e.preventDefault(); sendChat(chatInput) } }}
                placeholder="질문하세요..."
                className="flex-1 text-xs border rounded-lg px-3 py-2 outline-none min-w-0"
                style={{borderColor:'#e5e7eb'}}
                disabled={hintLoading}
              />
              <button onClick={() => { if (chatInput.trim()) sendChat(chatInput) }} disabled={hintLoading || !chatInput.trim()}
                className="px-3 py-2 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-40"
                style={{background:'#2563eb'}}>
                전송
              </button>
            </div>
          </div>
        </div>

        {/* ── 우측 패널: 코드 에디터 + 실행 결과 ── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{background:'#0d1117'}}>

          {/* 코드 에디터 헤더 */}
          <div className="flex items-center justify-between px-4 py-2 flex-shrink-0"
            style={{background:'#161b22',borderBottom:'1px solid #30363d'}}>
            <span className="text-xs font-mono" style={{color:'#8b949e'}}>Python</span>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{color: pyReady ? '#3fb950' : '#8b949e'}}>
                {pyReady ? '● 준비됨' : '● 로딩 중...'}
              </span>
              <button onClick={runCode} disabled={!pyReady||running}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all disabled:opacity-40 active:scale-95"
                style={{background:running?'#1f6feb':'#238636',color:'#ffffff'}}>
                {running ? '⏳ 실행 중...' : '▶  실행'}
              </button>
            </div>
          </div>

          {/* 코드 textarea */}
          <textarea
            value={code}
            onChange={e=>setCode(e.target.value)}
            className="p-4 font-mono text-sm border-none outline-none resize-none overflow-auto"
            style={{
              flex:'5 1 0%', minHeight:0,
              background:'#0d1117',
              color:'#e6edf3',
              caretColor:'#e6edf3',
              lineHeight:'1.7',
              tabSize:4,
            }}
            spellCheck={false}
          />

          {/* 실행 결과 영역 */}
          <div className="flex flex-col overflow-hidden" style={{flex:'3 1 0%',minHeight:0,background:'#161b22',borderTop:'1px solid #30363d'}}>
            <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0" style={{borderBottom:'1px solid #21262d'}}>
              <span className="text-xs font-semibold" style={{color:'#8b949e'}}>실행 결과</span>
              {outputOk === true && (
                <span className="text-xs font-bold" style={{color:'#3fb950'}}>✓ 정답!</span>
              )}
              {outputOk === false && (
                <span className="text-xs font-bold" style={{color:'#f85149'}}>✗ 아직 아니에요</span>
              )}
              {showErrorLottie && (
                <div className="ml-auto" style={{width:40,height:40}}>
                  <DotLottie src="/lottie/animation/Cat Crying emojiSticker animation.lottie" loop autoplay />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
              {testResults.length > 0 ? (
                <div className="space-y-2">
                  {testResults.map((r, i) => (
                    <div key={i} className="rounded-lg p-2.5"
                      style={{
                        background: r.passed ? 'rgba(63,185,80,0.08)' : 'rgba(248,81,73,0.08)',
                        border: `1px solid ${r.passed ? '#238636' : '#da3633'}`,
                      }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold" style={{color: r.passed ? '#3fb950' : '#f85149'}}>
                          {r.passed ? '✓' : '✗'} {r.label}
                        </span>
                        <span className="text-xs" style={{color:'#6e7681'}}>입력: {r.inputs.join(' / ')}</span>
                      </div>
                      <pre className="text-xs font-mono whitespace-pre-wrap" style={{color:'#c9d1d9'}}>{r.actual || '(출력 없음)'}</pre>
                      {!r.passed && (
                        <div className="mt-1.5 pt-1.5" style={{borderTop:'1px solid rgba(218,54,51,0.3)'}}>
                          <span className="text-xs" style={{color:'#f85149'}}>예상: </span>
                          <pre className="text-xs font-mono whitespace-pre-wrap inline" style={{color:'#f85149'}}>{r.expected}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                  {outputOk === true && (
                    <div className="text-xs text-center font-bold pt-1" style={{color:'#3fb950'}}>
                      🎉 모든 테스트 케이스 통과!
                    </div>
                  )}
                </div>
              ) : output ? (
                <div>
                  <pre className="text-xs font-mono whitespace-pre-wrap mb-2" style={{color:'#c9d1d9'}}>{output}</pre>
                  {outputOk===false && diffMsg && (
                    <div className="text-xs rounded-lg px-3 py-2 mt-2"
                      style={{background:'rgba(248,81,73,0.1)',color:'#f85149',border:'1px solid rgba(218,54,51,0.4)'}}>
                      {diffMsg}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center mt-6">
                  <div className="text-2xl mb-2">⚡</div>
                  <p className="text-xs" style={{color:'#6e7681'}}>▶ 실행 버튼을 눌러 결과를 확인하세요</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Gem Vault ── */}
      <div className="w-56 flex-shrink-0 flex flex-col relative" style={{background:'#140e04'}}>
        <div className="relative z-10 p-3 flex justify-between items-start">
          <div>
            <div className="text-xs font-semibold tracking-widest" style={{color:'rgba(255,200,80,0.7)'}}>VAULT</div>
            <div className="text-xs mt-1" style={{color:'rgba(255,200,80,0.4)'}}>
              {Object.keys(passed).length}/{MISSIONS.length} 미션
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-xs" style={{color:'rgba(255,200,80,0.5)'}}>LV</div>
            <div className="text-base font-semibold" style={{color:'rgba(255,200,80,0.9)'}}>{level}</div>
            <svg width="34" height="34" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,200,80,0.15)" strokeWidth="3"/>
              <circle cx="18" cy="18" r="15" fill="none" stroke="#FFD700" strokeWidth="3"
                strokeDasharray={`${ringArc} ${94-ringArc}`} strokeDashoffset="23.5" strokeLinecap="round"
                transform="rotate(-90 18 18)"/>
            </svg>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden mx-2 rounded-lg" style={{background:'rgba(0,0,0,0.2)'}}>
          {gems.map(g=>(
            <div key={g.id} className="absolute" style={{left:`${g.x}%`,top:0,animation:'fall 0.9s ease-in forwards'}}>
              <GemSVG type={g.type} size={22}/>
            </div>
          ))}
          {scorePopup && (
            <div className="absolute z-10 left-1/2 -translate-x-1/2 text-base font-semibold font-mono"
              style={{bottom:80,color:'#FFD700',animation:'scoreUp 1.4s ease-out forwards',textShadow:'0 0 8px rgba(255,200,0,0.8)'}}>
              {scorePopup.text}
            </div>
          )}
          {celebration && (
            <div className="absolute inset-0 flex items-center justify-center z-20 p-2">
              <div className="text-center text-xs font-semibold rounded-xl px-3 py-2"
                style={{background:'rgba(255,200,0,0.95)',color:'#3d2000',animation:'popIn 0.3s ease'}}>
                {celebration}
              </div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center items-end gap-0.5 p-1" style={{minHeight:50}}>
            {pile.slice(-50).map((t,i)=><GemSVG key={i} type={t} size={11}/>)}
          </div>
        </div>

        <div className="relative z-10 p-3" style={{borderTop:'1px solid rgba(255,180,50,0.1)'}}>
          <div className="text-xs mb-1" style={{color:'rgba(255,200,80,0.5)',letterSpacing:'0.1em'}}>TOTAL</div>
          <div className="text-2xl font-semibold font-mono" style={{color:'#FFD700'}}>{score.toLocaleString()}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="text-xs" style={{color:'rgba(255,200,80,0.4)'}}>XP</div>
            <div className="flex-1 h-1 rounded-full" style={{background:'rgba(255,255,255,0.1)'}}>
              <div className="h-1 rounded-full transition-all duration-700" style={{width:`${xpPct}%`,background:'#FFD700'}}/>
            </div>
            <div className="text-xs" style={{color:'rgba(255,200,80,0.5)'}}>{xp}</div>
          </div>
        </div>
      </div>

      {/* ── 성공 오버레이: Confetti 배경 + 점핑 캐릭터 ── */}
      {showSuccessLottie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{background:'rgba(0,0,0,0.25)'}}>
          {/* 폭죽 배경 */}
          <div className="absolute inset-0">
            <DotLottie src="/lottie/animation/Confetti.lottie" loop autoplay />
          </div>
          {/* 점핑 캐릭터 */}
          <div className="relative z-10" style={{width:320,height:320}}>
            <DotLottie src="/lottie/animation/Cute Mascot Jumping Character.lottie" loop={false} autoplay />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fall { 0%{transform:translateY(-20px) rotate(0deg);opacity:0} 10%{opacity:1} 100%{transform:translateY(300px) rotate(180deg);opacity:0.9} }
        @keyframes scoreUp { 0%{transform:translateX(-50%) translateY(0) scale(0.8);opacity:1} 100%{transform:translateX(-50%) translateY(-60px) scale(1.2);opacity:0} }
        @keyframes popIn { 0%{transform:scale(0.7);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  )
}
