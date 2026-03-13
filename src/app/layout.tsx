import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: '중년나라 - 다시 설레는 그 시절처럼',
  description: '40~60대 중년을 위한 따뜻한 만남과 채팅 커뮤니티',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen pt-0 md:pt-16 pb-16 md:pb-0">
            {children}
          </main>
          <BottomNav />
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
