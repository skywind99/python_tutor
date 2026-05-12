'use client'

import { useEffect, useRef, useState } from 'react'

type GemType = {
  name: string
  colors: [string, string, string]
}

const GEM_TYPES: GemType[] = [
  { name: 'ruby',     colors: ['#E83030', '#FF5555', '#C01818'] },
  { name: 'sapphire', colors: ['#2855C8', '#4477EE', '#1833A0'] },
  { name: 'emerald',  colors: ['#18A845', '#2ECC60', '#0D7A30'] },
  { name: 'topaz',    colors: ['#E89020', '#FFB833', '#C07010'] },
  { name: 'amethyst', colors: ['#8B35BB', '#A855D4', '#6622A0'] },
  { name: 'diamond',  colors: ['#70C8E8', '#A0E0F8', '#4090B8'] },
]

function gemSVG(type: GemType, size = 28) {
  const [c1, c2, c3] = type.colors
  return `<svg width="${size}" height="${size}" viewBox="0 0 30 34">
    <polygon points="15,2 27,10 27,24 15,32 3,24 3,10" fill="${c1}"/>
    <polygon points="15,2 27,10 15,18" fill="${c2}" opacity="0.6"/>
    <polygon points="15,2 3,10 15,18" fill="white" opacity="0.25"/>
    <polygon points="3,10 15,18 3,24" fill="${c3}" opacity="0.5"/>
    <polygon points="27,10 15,18 27,24" fill="${c3}" opacity="0.3"/>
    <polygon points="15,18 3,24 15,32 27,24" fill="${c1}" opacity="0.8"/>
    <polygon points="15,2 27,10 27,24 15,32 3,24 3,10" fill="none" stroke="white" stroke-width="0.5" opacity="0.3"/>
  </svg>`
}

type Props = {
  score: number
  xp: number
  level: number
  streak: number
  gemCount: number
  lastScore?: number        // 마지막으로 얻은 점수 (애니메이션용)
  trigger?: number          // 이 값이 바뀌면 보석 낙하
}

export default function GemVault({ score, xp, level, streak, gemCount, lastScore, trigger }: Props) {
  const zoneRef = useRef<HTMLDivElement>(null)
  const pileRef = useRef<HTMLDivElement>(null)
  const [displayScore, setDisplayScore] = useState(score)
  const [displayXP, setDisplayXP] = useState(xp)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const pileCountRef = useRef(0)
  const MAX_PILE = 80

  // 점수 카운터 애니메이션
  useEffect(() => {
    const from = displayScore
    const to = score
    if (from === to) return
    const dur = 800
    const start = Date.now()
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplayScore(Math.round(from + (to - from) * ease))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [score])

  // 보석 낙하 트리거
  useEffect(() => {
    if (trigger === undefined || trigger === 0) return
    const zone = zoneRef.current
    if (!zone) return

    const gemCount = lastScore && lastScore > 150 ? 15 : lastScore && lastScore > 80 ? 10 : 7
    const pts = lastScore ?? 100

    // 보석 낙하
    for (let i = 0; i < gemCount; i++) {
      setTimeout(() => {
        const type = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)]
        const el = document.createElement('div')
        el.style.cssText = `
          position:absolute;
          left:${Math.random() * (zone.offsetWidth - 40) + 10}px;
          top:0;
          --fall-dist:${zone.offsetHeight - 60 - Math.random() * 30}px;
          --rotation:${(Math.random() - 0.5) * 360}deg;
          --fall-dur:${0.8 + Math.random() * 0.5}s;
          animation:gem-fall var(--fall-dur) ease-in forwards;
          z-index:5;
          pointer-events:none;
        `
        el.innerHTML = gemSVG(type, 28)
        zone.appendChild(el)
        const dur = parseFloat(el.style.getPropertyValue('--fall-dur') || '0.9')
        setTimeout(() => {
          el.remove()
          if (pileCountRef.current < MAX_PILE && pileRef.current) {
            const pileEl = document.createElement('div')
            pileEl.innerHTML = gemSVG(type, 12 + Math.floor(Math.random() * 5))
            pileEl.style.animation = 'gem-land 0.4s cubic-bezier(0.34,1.56,0.64,1) both'
            pileRef.current.appendChild(pileEl)
            pileCountRef.current++
          }
        }, dur * 1000)
      }, i * 80 + Math.random() * 60)
    }

    // +점수 팝업
    setTimeout(() => {
      const popup = document.createElement('div')
      popup.style.cssText = `
        position:absolute;
        left:${30 + Math.random() * (zone.offsetWidth - 100)}px;
        bottom:80px;
        font-size:20px;
        font-weight:600;
        color:#FFD700;
        font-family:monospace;
        animation:score-pop 1.4s ease-out forwards;
        pointer-events:none;
        z-index:10;
        text-shadow:0 0 12px rgba(255,200,0,0.8);
      `
      popup.textContent = `+${pts}`
      zone.appendChild(popup)
      setTimeout(() => popup.remove(), 1400)
    }, 200)

    // 플래시
    const flash = document.createElement('div')
    flash.style.cssText = `
      position:absolute;inset:0;
      background:rgba(255,200,50,0.25);
      animation:vault-flash 0.4s ease-out;
      pointer-events:none;z-index:8;
    `
    zone.appendChild(flash)
    setTimeout(() => flash.remove(), 400)

    // XP 레벨업 체크
    if (xp >= 1000) setShowLevelUp(true)
  }, [trigger])

  useEffect(() => {
    if (showLevelUp) setTimeout(() => setShowLevelUp(false), 2000)
  }, [showLevelUp])

  // 초기 파일 채우기
  useEffect(() => {
    if (!pileRef.current) return
    const count = Math.min(gemCount, MAX_PILE)
    for (let i = 0; i < count; i++) {
      const type = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)]
      const el = document.createElement('div')
      el.innerHTML = gemSVG(type, 11 + Math.floor(Math.random() * 5))
      pileRef.current.appendChild(el)
      pileCountRef.current++
    }
  }, [])

  const xpPct = Math.min((xp % 1000) / 1000 * 100, 100)
  const arcLen = Math.round(xpPct / 100 * 94)

  return (
    <div className="rounded-xl overflow-hidden flex flex-col" style={{ background: '#140e04', minHeight: 460 }}>
      {/* 격자 배경 */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.04) 0,rgba(255,255,255,0.04) 1px,transparent 0,transparent 60px),repeating-linear-gradient(0deg,rgba(255,255,255,0.04) 0,rgba(255,255,255,0.04) 1px,transparent 0,transparent 40px)'
      }} />

      {/* 헤더 */}
      <div className="relative z-10 flex items-start justify-between p-4">
        <div>
          <div style={{ color: 'rgba(255,200,80,0.65)', fontSize: 10, letterSpacing: 2, fontWeight: 500 }}>TREASURE VAULT</div>
          {/* 연속 출석 */}
          <div className="flex items-center gap-1.5 mt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full transition-all"
                style={{
                  background: i < streak ? '#FF8C00' : 'rgba(255,255,255,0.12)',
                  boxShadow: i < streak ? '0 0 6px rgba(255,140,0,0.6)' : 'none',
                }}
              />
            ))}
            <span style={{ fontSize: 10, color: 'rgba(255,200,80,0.5)', marginLeft: 4 }}>
              {streak}일 연속
            </span>
          </div>
        </div>
        {/* 레벨 링 */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div style={{ fontSize: 10, color: 'rgba(255,200,80,0.5)' }}>LEVEL</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#FFD700', lineHeight: 1 }}>{level}</div>
          </div>
          <svg width="40" height="40" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,200,80,0.15)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15"
              fill="none"
              stroke="#FFD700"
              strokeWidth="3"
              strokeDasharray={`${arcLen} ${94 - arcLen}`}
              strokeDashoffset="23.5"
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          </svg>
        </div>
      </div>

      {/* 보석 낙하 영역 */}
      <div ref={zoneRef} className="relative flex-1 overflow-hidden mx-2">
        {showLevelUp && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium"
            style={{ background: 'rgba(255,200,0,0.95)', color: '#3d2000', animation: 'level-up 0.6s ease' }}
          >
            🏆 LEVEL UP! {level}레벨 달성!
          </div>
        )}
        {/* 보석 더미 */}
        <div
          ref={pileRef}
          className="absolute bottom-0 left-0 right-0 flex flex-wrap justify-center items-end gap-px px-2 pb-1"
          style={{ minHeight: 60 }}
        />
      </div>

      {/* 점수 바 */}
      <div className="relative z-10 px-4 py-3 border-t" style={{ borderColor: 'rgba(255,180,50,0.12)' }}>
        <div className="flex items-end justify-between mb-2">
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,200,80,0.5)', letterSpacing: 1 }}>TOTAL GEMS</div>
            <div style={{ fontSize: 28, fontWeight: 600, fontFamily: 'monospace', color: '#FFD700', lineHeight: 1 }}>
              {displayScore.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            {lastScore && lastScore > 0 && (
              <div style={{ fontSize: 12, color: '#FFD700', fontFamily: 'monospace' }}>+{lastScore}</div>
            )}
            <div style={{ fontSize: 10, color: 'rgba(255,200,80,0.5)' }}>이번 미션</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 10, color: 'rgba(255,200,80,0.5)' }}>XP</span>
          <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${xpPct}%`, background: '#FFD700', transition: 'width 0.6s ease' }}
            />
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,200,80,0.5)' }}>{xp % 1000}/1000</span>
        </div>
      </div>

      <style>{`
        @keyframes gem-fall {
          0% { transform: translateY(-50px) rotate(0deg) scale(0.8); opacity: 0; }
          10% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(var(--fall-dist)) rotate(var(--rotation)) scale(1); opacity: 0.95; }
        }
        @keyframes gem-land {
          0% { transform: scale(1.6); opacity: 0; }
          60% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes score-pop {
          0% { transform: translateY(0) scale(0.8); opacity: 1; }
          30% { transform: translateY(-20px) scale(1.3); opacity: 1; }
          100% { transform: translateY(-70px) scale(1); opacity: 0; }
        }
        @keyframes vault-flash {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.18; }
        }
        @keyframes level-up {
          0% { transform: translate(-50%,-50%) scale(1); }
          30% { transform: translate(-50%,-50%) scale(1.4); }
          60% { transform: translate(-50%,-50%) scale(0.9); }
          100% { transform: translate(-50%,-50%) scale(1); }
        }
      `}</style>
    </div>
  )
}
