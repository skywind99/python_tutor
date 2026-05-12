'use client'
import { useState } from 'react'

type Profile = {
  id: string; name: string; email: string; role: string
  class_id: string | null; classes?: { name: string } | null
}
type ClassInfo = { id: string; name: string; invite_code: string; teacher_id: string }

export default function AdminPage() {
  const [pw, setPw] = useState('')
  const [authed, setAuthed] = useState(false)
  const [pwError, setPwError] = useState('')
  const [data, setData] = useState<{ profiles: Profile[], classes: ClassInfo[] } | null>(null)
  const [tab, setTab] = useState<'users'|'classes'>('users')
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editClassId, setEditClassId] = useState('')
  const [newPw, setNewPw] = useState('')

  async function login() {
    setLoading(true)
    const res = await fetch(`/api/admin?pw=${encodeURIComponent(pw)}`)
    if (!res.ok) { setPwError('비밀번호가 틀렸어요'); setLoading(false); return }
    const d = await res.json()
    setData(d); setAuthed(true); setLoading(false)
  }

  async function refresh() {
    const res = await fetch(`/api/admin?pw=${encodeURIComponent(pw)}`)
    const d = await res.json()
    setData(d)
  }

  async function updateProfile() {
    if (!editUser) return
    await fetch(`/api/admin?pw=${encodeURIComponent(pw)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'profile', id: editUser.id, data: {
        name: editName, role: editRole, class_id: editClassId || null
      }})
    })
    if (newPw.length >= 6) {
      await fetch(`/api/admin?pw=${encodeURIComponent(pw)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'reset_password', id: editUser.id, data: { password: newPw }})
      })
    }
    setMsg('저장됐어요'); setEditUser(null); setNewPw('')
    await refresh()
    setTimeout(() => setMsg(''), 2000)
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`${name} 계정을 삭제할까요? 복구 불가능해요.`)) return
    await fetch(`/api/admin?pw=${encodeURIComponent(pw)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'delete_user', id })
    })
    await refresh(); setMsg('삭제됐어요')
    setTimeout(() => setMsg(''), 2000)
  }

  async function deleteClass(id: string, name: string) {
    if (!confirm(`${name} 반을 삭제할까요? 소속 학생들의 반 배정이 해제돼요.`)) return
    await fetch(`/api/admin?pw=${encodeURIComponent(pw)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'delete_class', id })
    })
    await refresh(); setMsg('반이 삭제됐어요')
    setTimeout(() => setMsg(''), 2000)
  }

  if (!authed) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl p-8 w-80">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-white font-bold text-xl">관리자 페이지</h1>
          <p className="text-gray-400 text-sm mt-1">관리자 비밀번호를 입력하세요</p>
        </div>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="관리자 비밀번호"
          className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 text-sm outline-none mb-3 border border-gray-600 focus:border-indigo-500"/>
        {pwError && <p className="text-red-400 text-xs mb-3">{pwError}</p>}
        <button onClick={login} disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {loading ? '확인 중...' : '로그인'}
        </button>
        <p className="text-gray-500 text-xs text-center mt-4">기본 비밀번호: admin1234<br/>Vercel ADMIN_PASSWORD 환경변수로 변경 가능</p>
      </div>
    </div>
  )

  const profiles = data?.profiles || []
  const classes = data?.classes || []

  const filtered = profiles.filter(p => {
    const matchSearch = p.name?.includes(search) || p.email?.includes(search)
    const matchRole = filterRole === 'all' || p.role === filterRole
    return matchSearch && matchRole
  })

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔐</span>
          <div>
            <h1 className="font-bold text-lg">관리자 페이지</h1>
            <p className="text-xs text-gray-400">파이썬 학습실 전체 관리</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-teal-400 font-medium">{msg}</span>}
          <button onClick={refresh} className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors">
            🔄 새로고침
          </button>
          <a href="/" className="text-xs text-gray-400 hover:text-white">← 사이트로</a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 p-6 pb-0">
        {[
          { label: '전체 사용자', value: profiles.length, icon: '👥' },
          { label: '학생', value: profiles.filter(p=>p.role==='student').length, icon: '🎓' },
          { label: '교사', value: profiles.filter(p=>p.role==='teacher').length, icon: '👨‍🏫' },
          { label: '반', value: classes.length, icon: '🏫' },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="p-6 space-y-5">
        {/* 탭 */}
        <div className="flex rounded-xl overflow-hidden border border-gray-700 w-fit">
          {(['users','classes'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 text-sm font-medium transition-colors ${tab===t?'bg-indigo-600 text-white':'text-gray-400 hover:bg-gray-700'}`}>
              {t==='users' ? `👥 사용자 (${profiles.length})` : `🏫 반 (${classes.length})`}
            </button>
          ))}
        </div>

        {tab === 'users' ? (
          <>
            {/* 검색/필터 */}
            <div className="flex gap-3">
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="이름 또는 이메일 검색"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 text-white placeholder-gray-500"/>
              <div className="flex rounded-xl overflow-hidden border border-gray-700">
                {['all','student','teacher'].map(r => (
                  <button key={r} onClick={()=>setFilterRole(r)}
                    className={`px-4 py-2 text-sm transition-colors ${filterRole===r?'bg-indigo-600 text-white':'text-gray-400 hover:bg-gray-700'}`}>
                    {r==='all'?'전체':r==='student'?'학생':'교사'}
                  </button>
                ))}
              </div>
            </div>

            {/* 유저 목록 */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="grid grid-cols-6 gap-4 px-5 py-3 bg-gray-750 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-700">
                <div className="col-span-2">이름 / 이메일</div>
                <div>역할</div>
                <div>소속 반</div>
                <div>가입일</div>
                <div>관리</div>
              </div>
              <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
                {filtered.map(p => (
                  <div key={p.id} className="grid grid-cols-6 gap-4 px-5 py-3 items-center hover:bg-gray-750 transition-colors">
                    <div className="col-span-2">
                      <div className="text-sm font-semibold text-white">{p.name || '-'}</div>
                      <div className="text-xs text-gray-400 truncate">{p.email}</div>
                    </div>
                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.role==='teacher'?'bg-indigo-900 text-indigo-300':p.role==='admin'?'bg-red-900 text-red-300':'bg-gray-700 text-gray-300'}`}>
                        {p.role==='teacher'?'교사':p.role==='admin'?'관리자':'학생'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {p.classes?.name || '-'}
                    </div>
                    <div className="text-xs text-gray-500">-</div>
                    <div className="flex gap-1">
                      <button onClick={() => {
                        setEditUser(p); setEditName(p.name||'')
                        setEditRole(p.role); setEditClassId(p.class_id||'')
                        setNewPw('')
                      }} className="text-xs bg-indigo-800 text-indigo-300 px-2 py-1 rounded-lg hover:bg-indigo-700 transition-colors">
                        수정
                      </button>
                      <button onClick={() => deleteUser(p.id, p.name)}
                        className="text-xs bg-red-900 text-red-400 px-2 py-1 rounded-lg hover:bg-red-800 transition-colors">
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* 반 관리 */
          <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-700">
              <div>반 이름</div>
              <div>초대코드</div>
              <div>교사</div>
              <div>학생 수</div>
              <div>관리</div>
            </div>
            <div className="divide-y divide-gray-700">
              {classes.map(cls => {
                const teacher = profiles.find(p => p.id === cls.teacher_id)
                const studentCount = profiles.filter(p => p.class_id === cls.id && p.role === 'student').length
                return (
                  <div key={cls.id} className="grid grid-cols-5 gap-4 px-5 py-4 items-center hover:bg-gray-750">
                    <div className="font-semibold text-sm text-white">{cls.name}</div>
                    <div className="font-mono text-sm text-indigo-300 bg-indigo-900 px-2 py-0.5 rounded w-fit">
                      {cls.invite_code}
                    </div>
                    <div className="text-sm text-gray-300">{teacher?.name || '-'}</div>
                    <div className="text-sm text-gray-300">{studentCount}명</div>
                    <div>
                      <button onClick={() => deleteClass(cls.id, cls.name)}
                        className="text-xs bg-red-900 text-red-400 px-2 py-1 rounded-lg hover:bg-red-800 transition-colors">
                        삭제
                      </button>
                    </div>
                  </div>
                )
              })}
              {classes.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-500">반이 없어요</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 유저 수정 모달 */}
      {editUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg text-white">사용자 수정</h2>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">이메일</label>
                <div className="text-sm text-gray-300 bg-gray-700 rounded-xl px-4 py-2.5">{editUser.email}</div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">이름</label>
                <input value={editName} onChange={e=>setEditName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"/>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">역할</label>
                <div className="flex gap-2">
                  {['student','teacher'].map(r => (
                    <button key={r} onClick={() => setEditRole(r)}
                      className={`flex-1 py-2 text-sm rounded-xl border transition-colors font-medium ${editRole===r?'bg-indigo-600 text-white border-indigo-600':'text-gray-400 border-gray-600 hover:border-gray-500'}`}>
                      {r==='student'?'🎓 학생':'👨‍🏫 교사'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">반 배정</label>
                <select value={editClassId} onChange={e=>setEditClassId(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500">
                  <option value="">반 없음</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.invite_code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">비밀번호 재설정 (선택)</label>
                <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)}
                  placeholder="새 비밀번호 (6자 이상)"
                  className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"/>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditUser(null)}
                className="flex-1 py-2.5 text-sm text-gray-400 border border-gray-600 rounded-xl hover:bg-gray-700 transition-colors">
                취소
              </button>
              <button onClick={updateProfile}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors">
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
