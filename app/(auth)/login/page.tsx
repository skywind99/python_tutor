'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'student'|'teacher'>('student')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login'|'signup'>('login')

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') setMode('signup')
  }, [searchParams])

  // @가 있으면 이메일 그대로, 없으면 아이디로 변환
  function toEmail(input: string) {
    const v = input.trim()
    return v.includes('@') ? v : `${v.toLowerCase()}@pytutor.local`
  }

  async function handleSubmit() {
    setError(''); setLoading(true)
    const sb = getClient()
    try {
      if (!username.trim()) throw new Error('아이디 또는 이메일을 입력해주세요.')
      const email = toEmail(username)
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password })
        if (error) throw new Error('아이디(이메일) 또는 비밀번호가 올바르지 않아요.')
        router.push('/dashboard')
      } else {
        // 회원가입은 아이디(@ 없음)만 허용
        if (username.includes('@')) throw new Error('회원가입은 아이디로만 가능해요. (이메일 형식 불가)')
        if (!/^[a-z0-9_.]+$/i.test(username.trim())) throw new Error('아이디는 영문·숫자·_·.만 사용할 수 있어요.')
        if (!name.trim()) throw new Error('이름을 입력해주세요.')
        if (password.length < 6) throw new Error('비밀번호는 6자 이상이어야 해요.')
        const { data, error } = await sb.auth.signUp({
          email, password,
          options: { data: { name, role } }
        })
        if (error) throw error
        if (data.user && role === 'student' && inviteCode) {
          const { data: cls } = await sb.from('classes')
            .select('id').eq('invite_code', inviteCode).single()
          if (cls) await sb.from('profiles').update({ class_id: cls.id }).eq('id', data.user.id)
        }
        router.push('/dashboard')
      }
    } catch (e: any) {
      setError(e.message || '오류가 발생했어요.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">💎</div>
          <h1 className="text-xl font-semibold text-gray-900">파이썬 학습실</h1>
          <p className="text-sm text-gray-400 mt-1">AI 힌트로 스스로 배우는 파이썬</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          {/* 탭 */}
          <div className="flex rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
            {(['login','signup'] as const).map(m=>(
              <button key={m} onClick={()=>setMode(m)}
                className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                  mode===m ? 'bg-white text-gray-900 shadow-sm rounded-xl m-0.5' : 'text-gray-400'
                }`}>
                {m==='login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>

          {/* 회원가입 전용 필드 */}
          {mode==='signup' && <>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">이름</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)}
                placeholder="홍길동"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-gray-400 transition-colors"/>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">역할</label>
              <div className="flex gap-2">
                {(['student','teacher'] as const).map(r=>(
                  <button key={r} onClick={()=>setRole(r)}
                    className={`flex-1 py-2.5 text-sm rounded-xl border-2 transition-all font-medium ${
                      role===r ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}>
                    {r==='student' ? '🎓 학생' : '👨‍🏫 교사'}
                  </button>
                ))}
              </div>
            </div>
            {role==='student' && (
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  반 초대코드 <span className="text-gray-300">(선택)</span>
                </label>
                <input type="text" value={inviteCode} onChange={e=>setInviteCode(e.target.value)}
                  placeholder="선생님께 받은 코드 입력"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-mono outline-none focus:border-gray-400 transition-colors"/>
              </div>
            )}
          </>}

          {/* 공통 필드 */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">
              {mode === 'login' ? '아이디 또는 이메일' : '아이디'}
            </label>
            <input type="text" value={username} onChange={e=>setUsername(e.target.value)}
              placeholder={mode === 'login' ? 'student01  또는  user@email.com' : '영문·숫자·_·. 사용 가능'}
              autoComplete="username"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-gray-400 transition-colors"/>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">비밀번호</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-gray-400 transition-colors"/>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
              <p className="text-xs text-red-500">{error}</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-gray-800 active:scale-95 transition-all">
            {loading ? '처리 중...' : mode==='login' ? '로그인' : '회원가입'}
          </button>

          {mode==='login' && (
            <button onClick={()=>setMode('signup')}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors pt-1">
              계정이 없으신가요? <span className="underline">회원가입</span>
            </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          AI 힌트 기반 파이썬 자기주도 학습 플랫폼
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400 text-sm">로딩 중...</p></div>}>
      <LoginForm />
    </Suspense>
  )
}
