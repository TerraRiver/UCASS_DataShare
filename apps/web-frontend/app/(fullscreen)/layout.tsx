import { Navbar } from '@/components/navbar';

export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col h-screen">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
