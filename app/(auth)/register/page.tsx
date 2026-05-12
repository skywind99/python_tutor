'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RegisterPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/login?mode=signup')
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">이동 중...</p>
    </div>
  )
}
