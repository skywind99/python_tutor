'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

function getClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [currentClass, setCurrentClass] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [stats, setStats] = useState({ missions: 0, score: 0, avgHints: 0 })

  useEffect(() => {
    async function load() {
      const sb = getClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: prof } = await sb.from('profiles').select('*, classes(name, invite_code)').eq('id', user.id).single()
      setProfile({ ...prof, email: user.email })
      setName(prof?.name || '')
      setCurrentClass(prof?.classes)
      const { data: logs } = await sb.from('mission_logs').select('*').eq('student_id', user.id)
      if (logs) {
        const passed = logs.filter((l: any) => l.passed)
        setStats({
          missions: passed.length,
          score: logs.reduce((s: number, l: any) => s + (l.score || 0), 0),
          avgHints: logs.length > 0 ? Math.round(logs.reduce((s: number, l: any) => s + l.hints_used, 0) / logs.length * 10) / 10 : 0,
        })
      }
    }
    load()
  }, [router])

  async function saveName() {
    setSaving(true)
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    await sb.from('profiles').update({ name }).eq('id', user.id)
    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  async function joinClass() {
    if (!inviteCode.trim()) return
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    const { data: cls } = await sb.from('classes').select('*').eq('invite_code', inviteCode.toUpperCase()).single()
    if (!cls) { alert('초대코드를 확인해주세요.'); return }
    await sb.from('profiles').update({ class_id: cls.id }).eq('id', user.id)
    setCurrentClass(cls)
    setInviteCode('')
  }

  async function changePassword() {
    if (!pwNew || pwNew.length < 6) { setPwMsg('비밀번호는 6자 이상이어야 해요'); return }
    const sb = getClient()
    const { error } = await sb.auth.updateUser({ password: pwNew })
    if (error) { setPwMsg(error.message); return }
    setPwMsg('✓ 비밀번호가 변경됐어요!')
    setPwCurrent(''); setPwNew('')
  }

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-3xl animate-bounce">💎</div>
    </div>
  )

  const isTeacher = profile.role === 'teacher'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        <h1 className="text-xl font-bold text-gray-900">내 정보</h1>

        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: isTeacher ? '#3730A3' : '#1E40AF' }}>
              {name?.[0] || '?'}
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg">{profile.name}</div>
              <div className="text-sm text-gray-400">{profile.email}</div>
              <div className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block font-medium"
                style={{ background: isTeacher ? '#EEF2FF' : '#EFF6FF', color: isTeacher ? '#3730A3' : '#1E40AF' }}>
                {isTeacher ? '👨‍🏫 교사' : '🎓 학생'}
              </div>
            </div>
          </div>

          {/* 통계 (학생만) */}
          {!isTeacher && (
            <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{stats.missions}</div>
                <div className="text-xs text-gray-400">완료 미션</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{stats.score.toLocaleString()}</div>
                <div className="text-xs text-gray-400">총점</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{stats.avgHints}</div>
                <div className="text-xs text-gray-400">평균 힌트</div>
              </div>
            </div>
          )}

          {/* 이름 변경 */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 block">이름 변경</label>
            <div className="flex gap-2">
              <input value={name} onChange={e => setName(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400"/>
              <button onClick={saveName} disabled={saving}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-colors"
                style={{ background: isTeacher ? '#3730A3' : '#1E40AF' }}>
                {saved ? '✓ 저장됨' : saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>

        {/* 반 정보 (학생) */}
        {!isTeacher && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">🏫 반 정보</h2>
            {currentClass ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div>
                  <div className="font-semibold text-gray-900">{currentClass.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">현재 소속 반</div>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">선생님께 받은 초대코드를 입력해서 반에 합류하세요.</p>
                <div className="flex gap-2">
                  <input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="초대코드 6자리" maxLength={6}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-gray-400 tracking-widest"/>
                  <button onClick={joinClass}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">
                    참여
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 비밀번호 변경 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">🔒 비밀번호 변경</h2>
          <div className="space-y-3">
            <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)}
              placeholder="새 비밀번호 (6자 이상)"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400"/>
            {pwMsg && (
              <p className={`text-sm ${pwMsg.startsWith('✓') ? 'text-teal-600' : 'text-red-500'}`}>{pwMsg}</p>
            )}
            <button onClick={changePassword}
              className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-colors"
              style={{ background: isTeacher ? '#3730A3' : '#1E40AF' }}>
              비밀번호 변경
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
