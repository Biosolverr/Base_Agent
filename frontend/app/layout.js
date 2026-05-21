import './globals.css';

export const metadata = {
  title: 'Base Agent — Onchain Wallet Analyzer',
  description: 'AI-powered wallet activity analyzer for Base L2. Track transactions, token flows, and get trading signals.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="base:app_id" content="6a0f779b67c7b388e6ae5116" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
