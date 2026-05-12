'use client'
import { useParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { MISSIONS, UNITS, LEVEL_INFO, calcScore } from '@/data/missions'
import type { Mission } from '@/data/missions'

declare global { interface Window { Sk: any; loadPyodide: any } }

// ── Gem types ─────────────────────────────────────────────────────────
const GEM_TYPES = [
  { colors: ['#E83030','#FF5555','#C01818'] },
  { colors: ['#2855C8','#4477EE','#1833A0'] },
  { colors: ['#18A845','#2ECC60','#0D7A30'] },
  { colors: ['#E89020','#FFB833','#C07010'] },
  { colors: ['#8B35BB','#A855D4','#6622A0'] },
  { colors: ['#70C8E8','#A0E0F8','#4090B8'] },
]
function GemSVG({ type, size=28 }: { type: typeof GEM_TYPES[0], size?: number }) {
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
  const [hints, setHints] = useState<{level:number,text:string}[]>([])
  const [hintCount, setHintCount] = useState(0)
  const [hintLoading, setHintLoading] = useState(false)
  const [tab, setTab] = useState<'output'|'hint'>('output')
  const [running, setRunning] = useState(false)
  const [pyReady, setPyReady] = useState(false)
  const [score, setScore] = useState(1240)
  const [xp, setXp] = useState(420)
  const [level, setLevel] = useState(3)
  const [passed, setPassed] = useState<Record<number,boolean>>({})
  const [gems, setGems] = useState<{id:number,type:typeof GEM_TYPES[0],x:number}[]>([])
  const [pile, setPile] = useState<typeof GEM_TYPES[0][]>([])
  const [showCelebration, setShowCelebration] = useState('')
  const [scorePopup, setScorePopup] = useState<{text:string,x:number}|null>(null)
  const gemIdRef = useRef(0)

  // Load Skulpt
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

    // Pre-fill pile
    const initialPile = Array.from({length:28}, () => GEM_TYPES[Math.floor(Math.random()*GEM_TYPES.length)])
    setPile(initialPile)
  }, [])

  const changeMission = (m: Mission) => {
    setCurrent(m); setCode(m.template); setOutput(''); setOutputOk(null)
    setDiffMsg(''); setHints([]); setHintCount(0); setTab('output')
  }

  const runCode = async () => {
    if (!pyReady || running) return
    setRunning(true); setTab('output')
    const Sk = (window as any).Sk
    const inputs = (current.defaultInput || '').split(',').map((s:string)=>s.trim())
    let out = ''; let inputIdx = 0
    try {
      Sk.configure({
        output: (t:string) => { out += t },
        read: (x:string) => { if (!Sk.builtinFiles?.files?.[x]) throw 'File not found: '+x; return Sk.builtinFiles.files[x] },
        inputfun: () => inputs[inputIdx++] || '',
        inputfunTakesPrompt: true,
        __future__: Sk.python3,
        execLimit: 5000,
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
          if(wi>=0) setDiffMsg(`${wi+1}번째 줄 예상: "${exp[wi]}" → 출력: "${act[wi]||'없음'}"`)
        }
      } else if (!passed[current.id]) {
        onPass()
      }
    } catch (e: any) {
      setOutput(String(e).replace(/^.*?Error:/,'오류:')); setOutputOk(false)
    }
    setRunning(false)
  }

  const onPass = () => {
    const s = calcScore(current.level, hintCount)
    const gemN = LEVEL_INFO[current.level].gemCount + (hintCount===0?5:0)
    setPassed(p => ({...p, [current.id]: true}))
    setScore(prev => prev + s)
    setXp(prev => { const nx = prev + Math.floor(s/3); if(nx>=1000){setLevel(l=>l+1);return nx-1000} return nx })
    setScorePopup({ text: `+${s}`, x: 40+Math.random()*60 })
    setTimeout(() => setScorePopup(null), 1500)

    // Spawn gems
    for (let i=0; i<gemN; i++) {
      setTimeout(() => {
        const type = GEM_TYPES[Math.floor(Math.random()*GEM_TYPES.length)]
        const id = ++gemIdRef.current
        setGems(g => [...g, {id, type, x: 10+Math.random()*80}])
        setTimeout(() => {
          setGems(g => g.filter(gem=>gem.id!==id))
          setPile(p => [...p, type].slice(-60))
        }, 1000)
      }, i*80)
    }

    const msgs = hintCount===0
      ? ['🔥 천재 등장! 힌트 없이 해냈어!','⚡ 완벽해! 보너스 보석 +5개!']
      : ['💎 잘했어! 다음엔 힌트 없이 도전해봐!','🎯 클리어!']
    setShowCelebration(msgs[Math.floor(Math.random()*msgs.length)])
    setTimeout(() => setShowCelebration(''), 2500)
  }

  const getHint = async () => {
    if (hintCount>=3 || hintLoading) return
    setHintLoading(true); setTab('hint')
    const next = hintCount+1
    try {
      const res = await fetch('/api/hint', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ missionTitle:current.title, missionDesc:current.description, code, hintLevel:next })
      })
      const data = await res.json()
      setHints(h=>[...h,{level:next,text:data.hint||current.hints[hintCount]}])
    } catch {
      setHints(h=>[...h,{level:next,text:current.hints[hintCount]}])
    }
    setHintCount(next); setHintLoading(false)
  }

  const xpPct = Math.min((xp/1000)*100,100)
  const ringArc = Math.round((xp/1000)*94)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-52 bg-white border-r border-gray-100 flex flex-col overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="text-xs font-semibold text-gray-400 mb-1">단원 {unitId}</div>
          <div className="font-semibold text-gray-800 text-sm">{unit?.title}</div>
        </div>
        {missions.map(m => {
          const lv = LEVEL_INFO[m.level]
          const done = passed[m.id]
          const active = current.id===m.id
          return (
            <button key={m.id} onClick={() => changeMission(m)}
              className={`text-left p-3 border-b border-gray-50 transition-colors ${active?'bg-blue-50 border-l-2 border-l-blue-500':'hover:bg-gray-50'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                {done && <span className="text-teal-500 text-xs">✓</span>}
                <span className="text-xs font-semibold text-gray-800 truncate">{m.title}</span>
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{background:lv.bg, color:lv.text}}>{lv.label}</span>
              <div className="text-xs text-gray-400 mt-0.5 truncate">{m.topic}</div>
            </button>
          )
        })}
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Problem + Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Problem desc */}
          <div className="bg-white border-b border-gray-100 p-4" style={{height:'200px',overflowY:'auto'}}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-gray-900">{current.title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{background:LEVEL_INFO[current.level].bg, color:LEVEL_INFO[current.level].text}}>
                {LEVEL_INFO[current.level].label}
              </span>
              <div className="flex gap-1 ml-auto">
                {current.tags.map(t=>(
                  <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">{t}</span>
                ))}
              </div>
            </div>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed font-sans">{current.description}</pre>
          </div>

          {/* Tabs: output / hints */}
          <div className="bg-white border-b border-gray-100 flex flex-shrink-0" style={{height:'180px',display:'flex',flexDirection:'column'}}>
            <div className="flex border-b border-gray-100">
              {(['output','hint'] as const).map(t=>(
                <button key={t} onClick={()=>setTab(t)}
                  className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${tab===t?'border-blue-500 text-blue-600':'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {t==='output'?'실행 결과':`AI 힌트${hintCount>0?` (${hintCount}/3)`:''}`}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {tab==='output' ? (
                output ? (
                  <div>
                    <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap mb-2">{output}</pre>
                    {outputOk===true && <div className="text-xs text-teal-600 font-semibold">✓ 정답!</div>}
                    {outputOk===false && <div>
                      <div className="text-xs text-red-500 font-semibold mb-1">✗ 아직 아니에요</div>
                      {diffMsg && <div className="text-xs text-red-400 bg-red-50 rounded p-2">{diffMsg}</div>}
                    </div>}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 text-center mt-6">실행 버튼을 눌러보세요</div>
                )
              ) : (
                <div className="space-y-2">
                  {hints.length===0 && !hintLoading && <div className="text-xs text-gray-400 text-center mt-4">막히면 AI 힌트를 요청해보세요</div>}
                  {hints.map((h,i)=>(
                    <div key={i} className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-blue-400 mb-1 font-semibold">힌트 {h.level}단계</div>
                      <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{h.text}</div>
                    </div>
                  ))}
                  {hintLoading && <div className="text-xs text-gray-400 flex items-center gap-2">
                    <span className="animate-spin">⟳</span> AI 튜터가 생각 중...
                  </div>}
                </div>
              )}
            </div>
          </div>

          {/* Code editor */}
          <div className="flex-1 flex flex-col min-h-0">
            <textarea
              value={code}
              onChange={e=>setCode(e.target.value)}
              className="flex-1 p-4 font-mono text-sm text-gray-800 bg-gray-50 border-none outline-none resize-none"
              spellCheck={false}
            />
            {current.needsInput && (
              <div className="bg-white border-t border-gray-100 px-4 py-2 flex items-center gap-3">
                <span className="text-xs text-gray-400">테스트 입력값</span>
                <input className="flex-1 text-xs font-mono border border-gray-200 rounded px-2 py-1 outline-none"
                  defaultValue={current.defaultInput}
                  onChange={e=>{ (current as any)._testInput = e.target.value }}
                />
              </div>
            )}
            <div className="bg-white border-t border-gray-100 px-4 py-2.5 flex gap-2 items-center">
              <button onClick={runCode} disabled={!pyReady||running}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors">
                {running ? '실행 중...' : '▶ 실행'}
              </button>
              <button onClick={getHint} disabled={hintCount>=3||hintLoading}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                💡 AI 힌트{hintCount>0?` (${hintCount}/3)`:''}
              </button>
              <div className="ml-auto text-xs text-gray-400">
                {pyReady ? '🟢 Python 준비됨' : '⏳ 로딩 중...'}
              </div>
            </div>
          </div>
        </div>

        {/* Gem Vault */}
        <div className="w-56 flex-shrink-0 flex flex-col" style={{background:'#140e04'}}>
          {/* Wood texture overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-5"
            style={{backgroundImage:'repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 60px)',width:'224px'}}/>

          {/* Header */}
          <div className="relative z-10 p-3 flex justify-between items-start">
            <div>
              <div className="text-xs font-semibold tracking-widest" style={{color:'rgba(255,200,80,0.7)'}}>VAULT</div>
              <div className="flex gap-1 mt-2">
                {[1,2,3,4,5,6,7].map(d=>(
                  <div key={d} className="rounded-full" style={{width:8,height:8,background:d<=3?'#FF8C00':'rgba(255,255,255,0.12)'}}/>
                ))}
              </div>
              <div className="text-xs mt-1" style={{color:'rgba(255,200,80,0.4)'}}>3일 연속</div>
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

          {/* Gem area */}
          <div className="relative flex-1 overflow-hidden mx-2 rounded-lg" style={{background:'rgba(0,0,0,0.2)'}}>
            {/* Falling gems */}
            {gems.map(g=>(
              <div key={g.id} className="absolute" style={{left:`${g.x}%`,top:0,animation:'fall 0.9s ease-in forwards'}}>
                <GemSVG type={g.type} size={24}/>
              </div>
            ))}
            {/* Score popup */}
            {scorePopup && (
              <div className="absolute z-10 text-base font-semibold font-mono"
                style={{left:`${scorePopup.x}%`,bottom:80,color:'#FFD700',animation:'scoreUp 1.4s ease-out forwards',textShadow:'0 0 8px rgba(255,200,0,0.8)'}}>
                {scorePopup.text}
              </div>
            )}
            {/* Celebration */}
            {showCelebration && (
              <div className="absolute inset-0 flex items-center justify-center z-20 p-2">
                <div className="text-center text-sm font-semibold rounded-xl px-3 py-2"
                  style={{background:'rgba(255,200,0,0.95)',color:'#3d2000',animation:'popIn 0.3s ease'}}>
                  {showCelebration}
                </div>
              </div>
            )}
            {/* Pile */}
            <div className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center items-end gap-0.5 p-1" style={{minHeight:50}}>
              {pile.slice(-50).map((t,i)=><GemSVG key={i} type={t} size={11}/>)}
            </div>
          </div>

          {/* Score bar */}
          <div className="relative z-10 p-3" style={{borderTop:'1px solid rgba(255,180,50,0.1)'}}>
            <div className="text-xs mb-1" style={{color:'rgba(255,200,80,0.5)',letterSpacing:'0.1em'}}>TOTAL GEMS</div>
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
      </div>

      <style>{`
        @keyframes fall { 0%{transform:translateY(-20px) rotate(0deg);opacity:0} 10%{opacity:1} 100%{transform:translateY(300px) rotate(180deg);opacity:0.9} }
        @keyframes scoreUp { 0%{transform:translateY(0) scale(0.8);opacity:1} 100%{transform:translateY(-60px) scale(1.2);opacity:0} }
        @keyframes popIn { 0%{transform:scale(0.7);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  )
}
