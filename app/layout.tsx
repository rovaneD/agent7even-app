import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import Script from 'next/script'
import './globals.css'

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Agent7even App',
  description: 'Your marketing command center',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-8913QV8Z1M" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-8913QV8Z1M');
        `}</Script>
      </head>
      <body className="min-h-full bg-gray-50 text-gray-900">
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
