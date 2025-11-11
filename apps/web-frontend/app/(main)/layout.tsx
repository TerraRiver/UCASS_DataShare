import { Navbar } from '@/components/navbar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen">
      <Navbar />
      <main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
        {children}
      </main>
      <footer className="w-full flex items-center justify-center py-3">
        <span className="text-default-600">中国社会科学院大学</span>
        <p className="text-primary ml-2">© 2025</p>
      </footer>
    </div>
  );
} 