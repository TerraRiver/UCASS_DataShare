import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import "./globals.css";
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UCASS DataShare - 人文社科数据分享平台',
  description: '专为人文社科实验室设计的数据分享平台，促进学术研究数据的安全共享、规范管理和协作使用',
  keywords: ['数据分享', '人文社科', '学术研究', '数据管理'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 