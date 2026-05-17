'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { TUTORIAL_PARTS } from '@/data/tutorial'

interface TutorialBannerProps {
  unitId: number
}

export default function TutorialBanner({ unitId }: TutorialBannerProps) {
  const [dismissed, setDismissed] = useState(true)

  const partNumber = Math.ceil(unitId / 2)
  const part = TUTORIAL_PARTS.find(p => p.part === partNumber)

  useEffect(() => {
    if (!part || part.comingSoon) return
    const key = `tutorial_banner_dismissed_part${partNumber}`
    const isDismissed = localStorage.getItem(key) === '1'
    setDismissed(isDismissed)
  }, [partNumber, part])

  if (!part || part.comingSoon || dismissed) return null

  function dismiss() {
    const key = `tutorial_banner_dismissed_part${partNumber}`
    localStorage.setItem(key, '1')
    setDismissed(true)
  }

  return (
    <div className="rounded-2xl p-4 mb-4 flex items-center gap-3 relative"
      style={{ background: `${part.color}18`, border: `1px solid ${part.color}40` }}>
      <div className="text-2xl flex-shrink-0">{part.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold mb-0.5" style={{ color: part.color }}>
          PART {part.part} 튜토리얼 추천
        </div>
        <div className="text-sm font-semibold text-gray-800">{part.title}</div>
        <div className="text-xs text-gray-400 mt-0.5">{part.description} · 학습 전에 스토리로 먼저 익혀봐요!</div>
      </div>
      <Link href={`/tutorial?part=${partNumber}`}
        className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-80"
        style={{ background: part.color }}>
        튜토리얼 →
      </Link>
      <button onClick={dismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg leading-none w-6 h-6 flex items-center justify-center"
        aria-label="닫기">
        ×
      </button>
    </div>
  )
}
