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
  const [open, setMenuOpen] = useState(false)

  useEffect(() => {
    getClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      getClient().from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfile(data))
    })
  }, [])

  useEffect(() => { setMenuOpen(false) }, [pathname])

  if (!profile) return <div className="h-14" />

  const isTeacher = profile?.role === 'teacher'
  const theme = isTeacher
    ? { primary: '#4338CA', hover: 'rgba(255,255,255,0.15)', badge: '#818CF8' }
    : { primary: '#1D4ED8', hover: 'rgba(255,255,255,0.15)', badge: '#60A5FA' }

  // 공통 메뉴
  const commonLinks = [
    { href: isTeacher ? '/teacher/dashboard' : '/dashboard', label: '대시보드', icon: '🏠' },
    { href: '/learn',    label: '학습자료', icon: '📚' },
    { href: '/ranking',  label: '랭킹',     icon: '🏆' },
    { href: '/profile',  label: '내 정보',  icon: '👤' },
  ]

  // 교사 전용 메뉴 (구분선 뒤)
  const teacherLinks = [
    { href: '/teacher/students',     label: '학생관리', icon: '👥' },
    { href: '/teacher/problems',     label: '문제관리', icon: '📝' },
    { href: '/teacher/create-mission', label: '문제생성', icon: '✨' },
  ]

  const isActive = (href: string) =>
    pathname === href || (href.length > 1 && pathname.startsWith(href + '/'))

  const linkStyle = (href: string) => ({
    background: isActive(href) ? 'rgba(255,255,255,0.22)' : 'transparent',
    color: isActive(href) ? '#fff' : 'rgba(255,255,255,0.68)',
  })

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center h-14 px-4 shadow-md"
        style={{ background: theme.primary }}>

        {/* 로고 */}
        <Link href={isTeacher ? '/teacher/dashboard' : '/dashboard'}
          className="flex items-center gap-2 mr-4 flex-shrink-0">
          <span className="text-xl">💎</span>
          <span className="font-bold text-white text-sm hidden sm:block">파이썬 학습실</span>
          {isTeacher && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold hidden sm:block"
              style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>교사</span>
          )}
        </Link>

        {/* 공통 메뉴 */}
        <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
          {commonLinks.map(l => (
            <Link key={l.href} href={l.href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
              style={linkStyle(l.href)}>
              <span className="text-sm">{l.icon}</span>
              <span className="hidden md:inline">{l.label}</span>
            </Link>
          ))}

          {/* 교사 전용 구분선 + 메뉴 */}
          {isTeacher && (
            <>
              <div className="w-px h-5 mx-1 bg-white/20 flex-shrink-0" />
              {teacherLinks.map(l => (
                <Link key={l.href} href={l.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
                  style={linkStyle(l.href)}>
                  <span className="text-sm">{l.icon}</span>
                  <span className="hidden md:inline">{l.label}</span>
                </Link>
              ))}
            </>
          )}
        </div>

        {/* 우측 유저 메뉴 */}
        <div className="relative ml-auto flex-shrink-0">
          <button onClick={() => setMenuOpen(!open)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(255,255,255,0.28)', color: '#fff' }}>
              {profile?.name?.[0] || '?'}
            </div>
            <span className="text-sm text-white font-medium hidden sm:block max-w-24 truncate">
              {profile?.name}
            </span>
            <span className="text-white/50 text-xs">▾</span>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 w-52 z-50">
                <div className="px-4 py-3 border-b border-gray-50">
                  <div className="font-semibold text-sm text-gray-900">{profile?.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{profile?.email}</div>
                  <div className="text-xs font-medium mt-1 px-1.5 py-0.5 rounded-full inline-block"
                    style={{ background: isTeacher ? '#EEF2FF' : '#EFF6FF', color: theme.primary }}>
                    {isTeacher ? '👨‍🏫 교사' : '🎓 학생'}
                  </div>
                </div>

                {/* 드롭다운 전체 메뉴 */}
                {[...commonLinks, ...(isTeacher ? teacherLinks : [])].map(l => (
                  <Link key={l.href} href={l.href}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <span>{l.icon}</span>{l.label}
                  </Link>
                ))}

                {/* 관리자 링크 (교사만) */}
                {isTeacher && (
                  <Link href="/admin"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors border-t border-gray-50 mt-1">
                    <span>🔐</span>관리자 페이지
                  </Link>
                )}

                <button onClick={async () => { await getClient().auth.signOut(); router.push('/login') }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full border-t border-gray-50 mt-1">
                  <span>🚪</span>로그아웃
                </button>
              </div>
            </>
          )}
        </div>
      </nav>
      <div className="h-14" />
    </>
  )
}
