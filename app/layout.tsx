import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '파이썬 학습실',
  description: 'AI 힌트 기반 파이썬 자기주도 학습 플랫폼',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
