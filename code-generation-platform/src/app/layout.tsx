import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CodeGen Platform - Multi-Model Code Generation',
  description:
    'Compare and refine code from multiple AI models. Generate, test, and optimize code with GPT-4, Claude, Gemini, and Llama.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-neutral-900 text-neutral-50 antialiased">
        {children}
      </body>
    </html>
  );
}
