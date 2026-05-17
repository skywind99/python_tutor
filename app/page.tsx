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
  { icon: '🎯', title: '단계별 미션', desc: '기초부터 심화까지 체계적인 커리큘럼' },
  { icon: '🤖', title: 'AI 힌트', desc: '소크라테스식 질문으로 스스로 깨닫게' },
  { icon: '💎', title: 'XP & 레벨', desc: '예제·연습·미션 모두 경험치로 성장' },
  { icon: '🏆', title: '반 랭킹', desc: '반 친구들과 점수 경쟁으로 동기 부여' },
]

const FLOW = [
  { icon: '📖', label: '개념', color: '#3B82F6' },
  { icon: '💻', label: '예제', color: '#06B6D4' },
  { icon: '✏️', label: '연습', color: '#8B5CF6' },
  { icon: '🎯', label: '미션', color: '#F59E0B' },
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
    <main className="min-h-screen bg-gray-50">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden flex items-center justify-center text-center px-6 py-24"
        style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #0EA5E9 100%)' }}>
        {/* 배경 장식 */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #60A5FA, transparent)' }} />
          <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #A78BFA, transparent)' }} />
        </div>

        <div className="relative z-10 max-w-2xl w-full">
          <div className="text-7xl mb-5 select-none">💎</div>
          <h1 className="text-5xl font-black text-white mb-4 leading-tight tracking-tight">
            파이썬 학습실
          </h1>
          <p className="text-lg text-white/70 mb-10 leading-relaxed">
            AI 튜터와 함께 단계별로 파이썬을 배워요<br/>
            힌트 없이 풀수록 더 많은 보석을 획득!
          </p>

          {/* 인증 상태별 CTA */}
          {authState === 'loading' && (
            <div className="flex gap-3 justify-center">
              <div className="h-12 w-32 bg-white/20 rounded-xl animate-pulse" />
              <div className="h-12 w-32 bg-white/10 rounded-xl animate-pulse" />
            </div>
          )}

          {authState === 'student' && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-white/60">다시 오셨군요! 오늘도 파이썬 미션에 도전해봐요.</p>
              <Link href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-700 rounded-2xl font-bold text-base hover:bg-blue-50 transition-colors shadow-xl shadow-blue-900/30">
                📚 내 대시보드로 가기 →
              </Link>
            </div>
          )}

          {authState === 'teacher' && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-white/60">선생님, 오늘의 학습 현황을 확인해보세요.</p>
              <Link href="/teacher/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-700 rounded-2xl font-bold text-base hover:bg-indigo-50 transition-colors shadow-xl shadow-indigo-900/30">
                📊 교사 대시보드로 가기 →
              </Link>
            </div>
          )}

          {authState === 'guest' && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-3">
                <Link href="/login"
                  className="px-8 py-3.5 bg-white text-blue-700 rounded-2xl font-bold hover:bg-blue-50 transition-colors shadow-xl shadow-blue-900/30">
                  로그인
                </Link>
                <Link href="/register"
                  className="px-8 py-3.5 bg-white/15 text-white rounded-2xl font-bold border border-white/30 hover:bg-white/25 transition-colors">
                  회원가입
                </Link>
              </div>
              <p className="text-xs text-white/40">선생님이라면 회원가입 시 역할을 '교사'로 선택해주세요</p>
            </div>
          )}
        </div>
      </section>

      {/* ── 학습 흐름 ── */}
      <section className="max-w-3xl mx-auto px-6 mb-10">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-4 text-center">단원별 학습 흐름</h2>
          <div className="flex items-center justify-center gap-2">
            {FLOW.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: `${step.color}18` }}>
                    {step.icon}
                  </div>
                  <span className="text-xs font-semibold mt-1.5" style={{ color: step.color }}>{step.label}</span>
                </div>
                {i < FLOW.length - 1 && (
                  <div className="text-gray-200 text-xl font-light mb-3">→</div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            개념을 보고 → 예제로 익히고 → 빈칸 연습 → 미션 도전!
          </p>
        </div>
      </section>

      {/* ── 기능 카드 ── */}
      <section className="max-w-3xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-semibold text-gray-800 text-sm mb-1">{f.title}</div>
              <div className="text-gray-400 text-xs leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="border-t border-gray-100 py-6 text-center">
        <p className="text-xs text-gray-300">
          💎 파이썬 학습실 · AI 기반 파이썬 학습 플랫폼
        </p>
      </footer>
    </main>
  )
}
