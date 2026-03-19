import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { Sidebar } from '@/components/sidebar';
import { SettingsProvider } from '@/components/settings-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '服装ERP系统',
    template: '%s | 服装ERP系统',
  },
  description: '专业的服装行业ERP管理系统',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN">
      <body className="antialiased bg-gray-50">
        {isDev && <Inspector />}
        <SettingsProvider>
          <Sidebar />
          <main className="ml-[180px] min-h-screen" style={{ padding: 'var(--page-padding)' }}>
            {children}
          </main>
          <Toaster />
        </SettingsProvider>
      </body>
    </html>
  );
}
