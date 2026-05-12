'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    getClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      getClient().from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfile(data))
    })
  }, [])

  const isTeacher = profile?.role === 'teacher'

  // 교사: 보라색 테마 / 학생: 파란색 테마
  const theme = isTeacher
    ? { bg: '#3730A3', hover: '#4338CA', accent: '#818CF8', light: '#EEF2FF' }
    : { bg: '#1E40AF', hover: '#2563EB', accent: '#60A5FA', light: '#EFF6FF' }

  const studentLinks = [
    { href: '/dashboard', label: '대시보드', icon: '🏠' },
    { href: '/learn',     label: '학습',     icon: '📚' },
    { href: '/ranking',   label: '랭킹',     icon: '🏆' },
    { href: '/profile',   label: '내 정보',  icon: '👤' },
  ]

  const teacherLinks = [
    { href: '/teacher/dashboard', label: '대시보드',   icon: '📊' },
    { href: '/learn',             label: '학습자료',   icon: '📚' },
    { href: '/teacher/students',  label: '학생관리',   icon: '👥' },
    { href: '/teacher/problems',  label: '문제관리',   icon: '📝' },
    { href: '/ranking',           label: '랭킹',       icon: '🏆' },
    { href: '/profile',           label: '내 정보',    icon: '👤' },
  ]

  const links = isTeacher ? teacherLinks : studentLinks

  if (!profile) return null

  return (
    <>
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center px-5 py-0 shadow-sm" style={{ background: theme.bg, height: 52 }}>
        {/* Logo */}
        <Link href={isTeacher ? '/teacher/dashboard' : '/dashboard'} className="flex items-center gap-2 mr-6">
          <span className="text-xl">💎</span>
          <span className="font-bold text-white text-sm">파이썬 학습실</span>
          {isTeacher && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: theme.accent, color: '#1E1B4B' }}>
              교사
            </span>
          )}
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1 flex-1">
          {links.map(l => {
            const active = pathname === l.href || pathname.startsWith(l.href + '/')
            return (
              <Link key={l.href} href={l.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                }}>
                <span className="text-sm">{l.icon}</span>
                {l.label}
              </Link>
            )
          })}
        </div>

        {/* User menu */}
        <div className="relative">
          <button onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: theme.accent }}>
              {profile.name?.[0] || '?'}
            </div>
            <span className="text-sm text-white font-medium">{profile.name}</span>
            <span className="text-white/50 text-xs">▾</span>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-44 z-50">
              <div className="px-4 py-2 border-b border-gray-50">
                <div className="text-xs font-semibold text-gray-900">{profile.name}</div>
                <div className="text-xs text-gray-400">{isTeacher ? '👨‍🏫 교사' : '🎓 학생'}</div>
              </div>
              <Link href="/profile" onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <span>👤</span> 내 정보
              </Link>
              {isTeacher && (
                <Link href="/teacher/students" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <span>👥</span> 학생 관리
                </Link>
              )}
              <button onClick={async () => {
                await getClient().auth.signOut()
                router.push('/login')
              }} className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full text-left">
                <span>🚪</span> 로그아웃
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Spacer */}
      <div style={{ height: 52 }} />
    </>
  )
}
