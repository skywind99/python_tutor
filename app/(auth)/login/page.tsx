'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'student'|'teacher'>('student')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'login'|'signup'>('login')

  async function handleSubmit() {
    setError(''); setLoading(true)
    const sb = getClient()
    if (mode === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/learn')
    } else {
      const { data, error } = await sb.auth.signUp({
        email, password,
        options: { data: { name, role } }
      })
      if (error) { setError(error.message); setLoading(false); return }
      if (data.user && role === 'student' && inviteCode) {
        const { data: cls } = await sb.from('classes').select('id').eq('invite_code', inviteCode).single()
        if (cls) await sb.from('profiles').update({ class_id: cls.id }).eq('id', data.user.id)
      }
      router.push('/learn')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">💎</div>
          <h1 className="text-xl font-medium text-gray-900">파이썬 학습실</h1>
          <p className="text-sm text-gray-500 mt-1">AI 힌트로 스스로 배우는 파이썬</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {(['login','signup'] as const).map(m=>(
              <button key={m} onClick={()=>setMode(m)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${mode===m?'bg-gray-900 text-white':'text-gray-500 hover:bg-gray-50'}`}>
                {m==='login'?'로그인':'회원가입'}
              </button>
            ))}
          </div>
          {mode==='signup' && <>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">이름</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="홍길동"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"/>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">역할</label>
              <div className="flex gap-2">
                {(['student','teacher'] as const).map(r=>(
                  <button key={r} onClick={()=>setRole(r)}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${role===r?'border-gray-900 bg-gray-900 text-white':'border-gray-200 text-gray-600'}`}>
                    {r==='student'?'학생':'교사'}
                  </button>
                ))}
              </div>
            </div>
            {role==='student' && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">반 초대코드</label>
                <input type="text" value={inviteCode} onChange={e=>setInviteCode(e.target.value)}
                  placeholder="선생님께 받은 코드"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-gray-400"/>
              </div>
            )}
          </>}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">이메일</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@school.kr"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"/>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">비밀번호</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"/>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors">
            {loading?'처리 중...':(mode==='login'?'로그인':'회원가입')}
          </button>
        </div>
      </div>
    </div>
  )
}
