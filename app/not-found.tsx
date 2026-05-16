'use client'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const DotLottie = dynamic(
  () => import('@lottiefiles/dotlottie-react').then(m => ({ default: m.DotLottieReact })),
  { ssr: false }
)

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div style={{ width: 320, height: 320 }}>
        <DotLottie src="/lottie/animation/404 error page with cat.lottie" loop autoplay />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">페이지를 찾을 수 없어요</h1>
      <p className="text-gray-400 text-sm mb-8">주소가 잘못됐거나 삭제된 페이지예요.</p>
      <Link href="/dashboard"
        className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors">
        대시보드로 돌아가기
      </Link>
    </div>
  )
}
