import type { Metadata } from 'next'
import "./globals.css";
import { Providers } from './providers'

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
      <head>
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --font-noto-serif-sc: "Noto Serif SC", "Source Han Serif SC", "思源宋体", serif;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
              "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
              "Helvetica Neue", Helvetica, Arial, sans-serif,
              "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
          }
        `}} />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 