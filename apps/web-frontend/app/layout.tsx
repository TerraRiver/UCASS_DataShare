import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '../components/auth/AuthContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UCASS DataShare - 社科大数据分享平台',
  description: '中国社会科学院大学数据集分享与分析平台',
  keywords: ['数据分享', '数据分析', '数据可视化', '社科数据', 'UCASS'],
  authors: [{ name: 'UCASS DataShare Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 