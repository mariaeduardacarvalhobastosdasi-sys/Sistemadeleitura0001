import type {Metadata} from 'next';
import {Inter, JetBrains_Mono} from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Gestão Pro - Máquinas de Caixa',
  description: 'Sistema profissional para gestão de contadores de vida útil.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${mono.variable}`}>
      <body suppressHydrationWarning className="bg-[#f5f5f5] text-[#141414] font-sans">
        {children}
      </body>
    </html>
  );
}
