'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function check() {
      const sb = getClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await sb.from('profiles').select('*').eq('id', user.id).single()
      setProfile({ ...data, email: user.email })
      setLoading(false)
    }
    check()
  }, [router])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl animate-bounce mb-3">💎</div>
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    </div>
  )

  const isTeacher = profile?.role === 'teacher'

  // 테마 색상
  const theme = isTeacher
    ? { primary: '#4338CA', dark: '#312E81', light: '#EEF2FF', text: '#4338CA' }
    : { primary: '#2563EB', dark: '#1E3A8A', light: '#EFF6FF', text: '#2563EB' }

  const studentNav = [
    { href: '/dashboard', label: '대시보드', icon: '🏠' },
    { href: '/learn',     label: '학습',     icon: '📚' },
    { href: '/ranking',   label: '랭킹',     icon: '🏆' },
    { href: '/profile',   label: '내 정보',  icon: '👤' },
  ]

  const teacherNav = [
    { href: '/teacher/dashboard', label: '대시보드',   icon: '📊' },
    { href: '/learn',             label: '학습자료',   icon: '📚' },
    { href: '/teacher/students',  label: '학생관리',   icon: '👥' },
    { href: '/teacher/problems',  label: '문제관리',   icon: '📝' },
    { href: '/ranking',           label: '랭킹',       icon: '🏆' },
    { href: '/profile',           label: '내 정보',    icon: '👤' },
  ]

  const navLinks = isTeacher ? teacherNav : studentNav

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && href !== '/teacher/dashboard' && pathname.startsWith(href))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── 상단 네비게이션 ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center h-14 px-4 shadow-md"
        style={{ background: theme.primary }}>

        {/* 로고 */}
        <Link href={isTeacher ? '/teacher/dashboard' : '/dashboard'}
          className="flex items-center gap-2 mr-5">
          <span className="text-xl">💎</span>
          <div className="hidden sm:block">
            <span className="font-bold text-white text-sm leading-none">파이썬 학습실</span>
            <div className="text-xs font-medium mt-0.5 px-1.5 py-0.5 rounded-full inline-block ml-1"
              style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 10 }}>
              {isTeacher ? '교사' : '학생'}
            </div>
          </div>
        </Link>

        {/* 메뉴 */}
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto no-scrollbar">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: isActive(l.href) ? 'rgba(255,255,255,0.25)' : 'transparent',
                color: isActive(l.href) ? '#fff' : 'rgba(255,255,255,0.65)',
              }}>
              <span>{l.icon}</span>
              <span className="hidden md:inline">{l.label}</span>
            </Link>
          ))}
        </div>

        {/* 유저 메뉴 */}
        <div className="relative ml-2">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.3)', color: '#fff' }}>
              {profile?.name?.[0] || '?'}
            </div>
            <span className="text-sm text-white font-medium hidden sm:block max-w-20 truncate">
              {profile?.name}
            </span>
            <span className="text-white/50 text-xs">▾</span>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-52 z-50">
                {/* 유저 정보 */}
                <div className="px-4 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                      style={{ background: theme.primary }}>
                      {profile?.name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{profile?.name}</div>
                      <div className="text-xs px-1.5 py-0.5 rounded-full inline-block font-medium mt-0.5"
                        style={{ background: theme.light, color: theme.text }}>
                        {isTeacher ? '👨‍🏫 교사' : '🎓 학생'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 메뉴 항목 */}
                {navLinks.map(l => (
                  <Link key={l.href} href={l.href}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <span>{l.icon}</span>
                    {l.label}
                  </Link>
                ))}

                {isTeacher && (
                  <Link href="/teacher/students?tab=bulk"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <span>📋</span>
                    학생 일괄등록
                  </Link>
                )}

                <div className="border-t border-gray-50 mt-1">
                  <button onClick={async () => {
                    await getClient().auth.signOut()
                    router.push('/login')
                  }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full">
                    <span>🚪</span>
                    로그아웃
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* 상단 여백 */}
      <div className="h-14" />

      {/* 페이지 컨텐츠 */}
      {children}
    </div>
  )
}
