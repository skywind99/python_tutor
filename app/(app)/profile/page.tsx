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
  const [school, setSchool] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [currentClass, setCurrentClass] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pwNew, setPwNew] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [stats, setStats] = useState({ missions: 0, score: 0, avgHints: 0 })
  const [geminiKey, setGeminiKey] = useState('')
  const [geminiSaved, setGeminiSaved] = useState('')
  const [geminiLoading, setGeminiLoading] = useState(false)
  const [geminiMsg, setGeminiMsg] = useState('')
  const [groqKey, setGroqKey] = useState('')
  const [groqSaved, setGroqSaved] = useState('')
  const [groqLoading, setGroqLoading] = useState(false)
  const [groqMsg, setGroqMsg] = useState('')
  const [quota, setQuota] = useState<any>(null)
  const [quotaLoading, setQuotaLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const sb = getClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: prof } = await sb.from('profiles').select('*').eq('id', user.id).single()
      setProfile({ ...prof, email: user.email })
      setName(prof?.name || '')
      setSchool(prof?.school || '')
      if (prof?.gemini_key) setGeminiSaved('●'.repeat(20) + prof.gemini_key.slice(-6))
      if (prof?.groq_key) setGroqSaved('●'.repeat(20) + prof.groq_key.slice(-6))
      if (prof?.class_id) {
        const { data: cls } = await sb.from('classes').select('*').eq('id', prof.class_id).single()
        setCurrentClass(cls)
      }
      if (prof?.role === 'student') {
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
    }
    load()
  }, [router])

  async function saveName() {
    setSaving(true)
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    await sb.from('profiles').update({ name, ...(profile?.role === 'teacher' ? { school } : {}) }).eq('id', user.id)
    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  async function joinClass() {
    if (!inviteCode.trim()) return
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { alert('로그인이 필요해요'); return }
    const code = inviteCode.trim().toUpperCase()
    const { data: cls } = await sb.from('classes').select('*').eq('invite_code', code).single()
    if (!cls) { alert('초대코드를 확인해주세요. (' + code + ')'); return }
    const { error } = await sb.from('profiles').update({ class_id: cls.id }).eq('id', user.id)
    if (error) { alert('반 등록 실패: ' + error.message); return }
    setCurrentClass(cls); setInviteCode('')
    alert('반에 성공적으로 등록됐어요!')
  }

  async function changePassword() {
    if (!pwNew || pwNew.length < 6) { setPwMsg('비밀번호는 6자 이상이어야 해요'); return }
    const sb = getClient()
    const { error } = await sb.auth.updateUser({ password: pwNew })
    if (error) { setPwMsg(error.message); return }
    setPwMsg('✓ 비밀번호가 변경됐어요!'); setPwNew('')
  }

  async function checkQuota() {
    setQuotaLoading(true)
    setQuota(null)
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    const res = await fetch('/api/check-quota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
    const data = await res.json()
    setQuota(data)
    setQuotaLoading(false)
  }

  async function saveGroqKey() {
    if (!groqKey.trim()) return
    setGroqLoading(true)
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    const { error } = await sb.from('profiles').update({ groq_key: groqKey.trim() }).eq('id', user.id)
    if (error) { setGroqMsg('저장 실패: ' + error.message) }
    else {
      setGroqSaved('●'.repeat(20) + groqKey.slice(-6))
      setGroqKey('')
      setGroqMsg('✓ 키가 저장됐어요! Gemini 키가 없을 때 자동으로 사용돼요.')
      setTimeout(() => setGroqMsg(''), 4000)
    }
    setGroqLoading(false)
  }

  async function saveGeminiKey() {
    if (!geminiKey.trim()) return
    setGeminiLoading(true)
    const sb = getClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return
    const { error } = await sb.from('profiles').update({ gemini_key: geminiKey.trim() }).eq('id', user.id)
    if (error) { setGeminiMsg('저장 실패: ' + error.message) }
    else {
      setGeminiSaved('●'.repeat(20) + geminiKey.slice(-6))
      setGeminiKey('')
      setGeminiMsg('✓ 키가 저장됐어요! 학생들의 AI 힌트에 이 키가 사용돼요.')
      setTimeout(() => setGeminiMsg(''), 4000)
    }
    setGeminiLoading(false)
  }

  if (!profile) return <div className="flex items-center justify-center py-32"><div className="text-3xl animate-bounce">💎</div></div>

  const isTeacher = profile.role === 'teacher'
  const themeColor = isTeacher ? '#4338CA' : '#2563EB'
  const themeBg = isTeacher ? '#EEF2FF' : '#EFF6FF'

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">
      <h1 className="text-xl font-bold text-gray-900">👤 내 정보</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ background: themeColor }}>{name?.[0] || '?'}</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900 text-lg">{profile.name}</div>
            <div className="text-sm text-gray-400 truncate">{profile.email}</div>
            <div className="text-xs mt-1 px-2 py-0.5 rounded-full inline-block font-medium"
              style={{ background: themeBg, color: themeColor }}>
              {isTeacher ? '👨‍🏫 교사' : '🎓 학생'}
            </div>
          </div>
          {!isTeacher && (
            <div className="grid grid-cols-3 gap-3 text-center flex-shrink-0">
              {[{l:'완료 미션',v:stats.missions},{l:'총점',v:stats.score.toLocaleString()},{l:'평균 힌트',v:stats.avgHints}].map(s=>(
                <div key={s.l} className="bg-gray-50 rounded-xl p-3 min-w-16">
                  <div className="text-lg font-bold text-gray-900">{s.v}</div>
                  <div className="text-xs text-gray-400">{s.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          {isTeacher && (
            <input value={school} onChange={e=>setSchool(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              placeholder="학교 이름 (예: 한국고등학교)"/>
          )}
          <div className="flex gap-2">
            <input value={name} onChange={e=>setName(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400"
              placeholder="이름"/>
            <button onClick={saveName} disabled={saving}
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-colors"
              style={{background:themeColor}}>
              {saved?'✓ 저장됨':saving?'...':'저장'}
            </button>
          </div>
          {isTeacher && school && (
            <p className="text-xs text-gray-400">Nav에 <span className="font-medium text-gray-600">"{school} 파이썬 학습실"</span>로 표시돼요</p>
          )}
        </div>
      </div>

      {/* 학생: 반 */}
      {!isTeacher && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">🏫 반 정보</h2>
          {currentClass ? (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div>
                <div className="font-semibold text-gray-900">{currentClass.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">현재 소속 반</div>
              </div>
              <span className="text-2xl">✅</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">선생님께 받은 초대코드를 입력해서 반에 합류하세요.</p>
              <div className="flex gap-2">
                <input value={inviteCode} onChange={e=>setInviteCode(e.target.value.toUpperCase())}
                  placeholder="초대코드 6자리" maxLength={6}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-gray-400 tracking-widest"/>
                <button onClick={joinClass}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors">참여</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 교사: AI API 키 */}
      {isTeacher && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">🔑</div>
            <div>
              <h2 className="font-semibold text-gray-900">AI API 키 <span className="text-xs text-gray-400 font-normal">AI 힌트 · 문제 생성에 사용</span></h2>
              <p className="text-xs text-gray-400 mt-0.5">내 반 학생들의 AI 기능에 사용돼요 · Gemini 우선, 없으면 Groq 사용</p>
            </div>
          </div>

          {/* Gemini */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-700">Gemini</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">1순위</span>
            </div>
            {geminiSaved && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-teal-50 border border-teal-200 rounded-xl">
                <span className="text-teal-600">✓</span>
                <span className="text-xs text-teal-700 font-mono">{geminiSaved}</span>
                <span className="text-xs text-teal-500 ml-auto">등록됨</span>
              </div>
            )}
            <div className="flex gap-2">
              <input type="password" value={geminiKey} onChange={e=>setGeminiKey(e.target.value)}
                placeholder="AIzaSy... 새 키 입력"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-indigo-400"/>
              <button onClick={saveGeminiKey} disabled={geminiLoading||!geminiKey.trim()}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-colors whitespace-nowrap"
                style={{background:'#4338CA'}}>
                {geminiLoading?'저장 중...':'저장'}
              </button>
            </div>
            {geminiMsg && <p className={`text-xs ${geminiMsg.startsWith('✓')?'text-teal-600':'text-red-500'}`}>{geminiMsg}</p>}
            <p className="text-xs text-gray-400">
              👉 <a href="https://aistudio.google.com" target="_blank" rel="noopener" className="text-indigo-500 hover:underline">aistudio.google.com</a> → Get API key → 무료 발급
            </p>
          </div>

          <div className="border-t border-gray-100" />

          {/* Groq */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-700">Groq</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">2순위 (Gemini 없을 때)</span>
            </div>
            {groqSaved && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-teal-50 border border-teal-200 rounded-xl">
                <span className="text-teal-600">✓</span>
                <span className="text-xs text-teal-700 font-mono">{groqSaved}</span>
                <span className="text-xs text-teal-500 ml-auto">등록됨</span>
              </div>
            )}
            <div className="flex gap-2">
              <input type="password" value={groqKey} onChange={e=>setGroqKey(e.target.value)}
                placeholder="gsk_... 새 키 입력"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-orange-400"/>
              <button onClick={saveGroqKey} disabled={groqLoading||!groqKey.trim()}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-colors whitespace-nowrap"
                style={{background:'#EA580C'}}>
                {groqLoading?'저장 중...':'저장'}
              </button>
            </div>
            {groqMsg && <p className={`text-xs ${groqMsg.startsWith('✓')?'text-teal-600':'text-red-500'}`}>{groqMsg}</p>}
            <p className="text-xs text-gray-400">
              👉 <a href="https://console.groq.com" target="_blank" rel="noopener" className="text-orange-500 hover:underline">console.groq.com</a> → 구글 로그인 → API Keys → 무료 발급 (1,000회/일 · 100K 토큰/일)
            </p>
          </div>

          <div className="border-t border-gray-100" />

          {/* 잔여량 확인 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">📊 API 잔여량</span>
              <div className="flex items-center gap-2">
                <a href="https://aistudio.google.com/" target="_blank" rel="noopener"
                  className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                  Gemini →
                </a>
                <a href="https://console.groq.com/usage" target="_blank" rel="noopener"
                  className="text-xs px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors">
                  Groq →
                </a>
                <button onClick={checkQuota} disabled={quotaLoading || !groqSaved}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 transition-colors">
                  {quotaLoading ? '확인 중...' : '🔄 실시간'}
                </button>
              </div>
            </div>
            {!groqSaved && (
              <p className="text-xs text-gray-400">Groq 키를 등록하면 실시간 잔여량을 확인할 수 있어요.</p>
            )}
            {quota?.error && (
              <p className="text-xs text-red-500">{quota.error}</p>
            )}
            {quota?.groq && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: 'Groq 요청 잔여',
                      value: quota.groq.remainingRequests >= 0 ? quota.groq.remainingRequests.toLocaleString() : '-',
                      total: quota.groq.limitRequests >= 0 ? quota.groq.limitRequests : null,
                    },
                    {
                      label: 'Groq 토큰 잔여',
                      value: quota.groq.remainingTokens >= 0 ? quota.groq.remainingTokens.toLocaleString() : '-',
                      total: quota.groq.limitTokens >= 0 ? quota.groq.limitTokens : null,
                    },
                  ].map(item => (
                    <div key={item.label} className="bg-orange-50 rounded-xl p-3">
                      <div className="text-xs text-orange-500 mb-1">{item.label}</div>
                      <div className="text-lg font-bold text-orange-700">{item.value}</div>
                      {item.total != null && (
                        <div className="text-xs text-orange-400">/ {item.total.toLocaleString()}</div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {quota.fromCache ? '🕐 학생이 AI 힌트를 쓸 때마다 자동 갱신돼요' : '🔄 초기값 조회 완료'}{quota.groq.updatedAt ? ` · 마지막 갱신: ${new Date(quota.groq.updatedAt).toLocaleString('ko-KR', {month:'numeric',day:'numeric',hour:'numeric',minute:'numeric'})}` : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 비밀번호 변경 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">🔒 비밀번호 변경</h2>
        <div className="space-y-3">
          <input type="password" value={pwNew} onChange={e=>setPwNew(e.target.value)}
            placeholder="새 비밀번호 (6자 이상)"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400"/>
          {pwMsg && <p className={`text-sm ${pwMsg.startsWith('✓')?'text-teal-600':'text-red-500'}`}>{pwMsg}</p>}
          <button onClick={changePassword}
            className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-colors"
            style={{background:themeColor}}>비밀번호 변경</button>
        </div>
      </div>
    </div>
  )
}
