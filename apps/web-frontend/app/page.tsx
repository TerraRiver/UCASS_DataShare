import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadIcon, SearchIcon, ShieldCheckIcon, BarChart3Icon } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">UD</span>
            </div>
            <h1 className="text-2xl font-bold">UCASS DataShare</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/discover" className="text-muted-foreground hover:text-foreground">
              数据发现
            </Link>
            <Link href="/upload" className="text-muted-foreground hover:text-foreground">
              数据上传
            </Link>
            <Link href="/admin/login" className="text-muted-foreground hover:text-foreground">
              管理后台
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-bg text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            人文社科数据分享平台
          </h2>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            促进学术研究数据的安全共享、规范管理和协作使用，专为人文社科实验室设计
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/discover">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                <SearchIcon className="mr-2 h-5 w-5" />
                探索数据集
              </Button>
            </Link>
            <Link href="/upload">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20">
                <UploadIcon className="mr-2 h-5 w-5" />
                上传数据
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">平台核心功能</h3>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              为人文社科研究提供专业的数据管理和分享解决方案
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <UploadIcon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>便捷上传</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  支持多种文件格式，简单拖拽即可完成数据集上传，自动元数据提取
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>伦理审查</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  内置伦理审查流程，确保所有数据集符合学术规范和隐私保护要求
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>智能发现</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  强大的搜索和筛选功能，按学科、类型、关键词快速找到所需数据集
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3Icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>数据分析</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  内置可视化和统计分析工具，直接在线预览和分析数据集内容
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">0</div>
              <div className="text-muted-foreground">数据集总数</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">0</div>
              <div className="text-muted-foreground">下载次数</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">5+</div>
              <div className="text-muted-foreground">支持学科</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">全天候服务</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 UCASS DataShare. 中国社会科学院大学数据分享平台.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 