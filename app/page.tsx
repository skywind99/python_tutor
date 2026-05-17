'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

type AuthState = 'loading' | 'guest' | 'student' | 'teacher'

const FEATURES = [
  { icon: '🎯', title: '단계별 미션', desc: '기초부터 심화까지 체계적 커리큘럼' },
  { icon: '🤖', title: 'AI 힌트', desc: '소크라테스식 질문으로 스스로 깨닫게' },
  { icon: '💎', title: 'XP & 레벨', desc: '미션마다 경험치로 레벨업' },
  { icon: '🏆', title: '반 랭킹', desc: '친구들과 점수 경쟁으로 동기 부여' },
]

const FLOW = [
  { icon: '📖', label: '개념', color: '#60A5FA' },
  { icon: '💻', label: '예제', color: '#34D399' },
  { icon: '✏️', label: '연습', color: '#A78BFA' },
  { icon: '🎯', label: '미션', color: '#FBBF24' },
]

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>('loading')

  useEffect(() => {
    async function check() {
      try {
        const sb = getClient()
        const { data: { user } } = await sb.auth.getUser()
        if (!user) { setAuthState('guest'); return }
        const { data: prof } = await sb.from('profiles').select('role').eq('id', user.id).single()
        setAuthState(prof?.role === 'teacher' ? 'teacher' : 'student')
      } catch {
        setAuthState('guest')
      }
    }
    check()
  }, [])

  return (
    <main className="h-screen overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #1D4ED8 100%)' }}>

      {/* 배경 장식 */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #60A5FA, transparent)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #A78BFA, transparent)' }} />
      </div>

      {/* ── 상단 바 ── */}
      <header className="relative z-10 flex items-center justify-between px-16 py-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💎</span>
          <span className="text-white font-black text-lg tracking-tight">파이썬 학습실</span>
        </div>
        {authState === 'guest' && (
          <div className="flex gap-3">
            <Link href="/login"
              className="px-5 py-2 text-sm font-semibold text-white/80 hover:text-white border border-white/20 rounded-xl hover:bg-white/10 transition-all">
              로그인
            </Link>
            <Link href="/login?mode=signup"
              className="px-5 py-2 text-sm font-semibold bg-white text-blue-800 rounded-xl hover:bg-blue-50 transition-all">
              회원가입
            </Link>
          </div>
        )}
        {(authState === 'student' || authState === 'teacher') && (
          <Link href={authState === 'teacher' ? '/teacher/dashboard' : '/dashboard'}
            className="px-5 py-2 text-sm font-semibold bg-white text-blue-800 rounded-xl hover:bg-blue-50 transition-all">
            대시보드 →
          </Link>
        )}
      </header>

      {/* ── 메인 콘텐츠 ── */}
      <div className="relative z-10 flex-1 flex items-center px-16 gap-20 max-w-screen-xl mx-auto w-full">

        {/* 왼쪽: 타이틀 + CTA */}
        <div className="flex-1">
          <div className="inline-block text-xs font-bold text-blue-300 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full mb-6">
            AI 기반 파이썬 자기주도 학습 플랫폼
          </div>
          <h1 className="text-6xl font-black text-white leading-tight mb-6">
            파이썬,<br/>
            <span style={{ color: '#60A5FA' }}>스스로</span> 배워요
          </h1>
          <p className="text-white/60 text-lg leading-relaxed mb-10">
            AI 튜터가 힌트로 이끌어줘요.<br/>
            정답은 스스로 찾는 게 진짜 실력이에요.
          </p>

          {/* CTA */}
          {authState === 'loading' && (
            <div className="flex gap-3">
              <div className="h-14 w-40 bg-white/10 rounded-2xl animate-pulse" />
              <div className="h-14 w-36 bg-white/5 rounded-2xl animate-pulse" />
            </div>
          )}
          {authState === 'guest' && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Link href="/login?mode=signup"
                  className="px-8 py-4 bg-white text-blue-800 rounded-2xl font-bold text-base hover:bg-blue-50 transition-all shadow-2xl shadow-blue-900/40">
                  무료로 시작하기 →
                </Link>
                <Link href="/login"
                  className="px-8 py-4 text-white border border-white/25 rounded-2xl font-bold text-base hover:bg-white/10 transition-all">
                  로그인
                </Link>
              </div>
              <p className="text-xs text-white/30">선생님은 회원가입 시 역할을 '교사'로 선택해주세요</p>
            </div>
          )}
          {authState === 'student' && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-white/50 mb-2">다시 오셨군요! 오늘도 미션에 도전해봐요.</p>
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-800 rounded-2xl font-bold text-base hover:bg-blue-50 transition-all shadow-2xl shadow-blue-900/40 w-fit">
                📚 내 대시보드로 가기 →
              </Link>
            </div>
          )}
          {authState === 'teacher' && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-white/50 mb-2">선생님, 오늘의 학습 현황을 확인해보세요.</p>
              <Link href="/teacher/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-800 rounded-2xl font-bold text-base hover:bg-indigo-50 transition-all shadow-2xl shadow-indigo-900/40 w-fit">
                📊 교사 대시보드로 가기 →
              </Link>
            </div>
          )}
        </div>

        {/* 오른쪽: 기능 카드 */}
        <div className="grid grid-cols-2 gap-4 w-[420px] flex-shrink-0">
          {FEATURES.map(f => (
            <div key={f.title}
              className="rounded-2xl p-5 border border-white/10 hover:border-white/25 transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-bold text-white text-sm mb-1">{f.title}</div>
              <div className="text-white/40 text-xs leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 하단: 학습 흐름 ── */}
      <footer className="relative z-10 flex-shrink-0 px-16 py-6 border-t border-white/10">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div className="flex items-center gap-2">
            {FLOW.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                  style={{ background: `${step.color}18` }}>
                  <span className="text-base">{step.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: step.color }}>{step.label}</span>
                </div>
                {i < FLOW.length - 1 && <span className="text-white/20 text-sm">→</span>}
              </div>
            ))}
            <span className="text-white/30 text-xs ml-3">단원별 학습 순서</span>
          </div>
          <p className="text-xs text-white/20">💎 파이썬 학습실 · AI 기반 파이썬 학습 플랫폼</p>
        </div>
      </footer>
    </main>
  )
}
