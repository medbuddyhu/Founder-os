import "./globals.css"
import { ReactNode } from "react"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-inter">
        {children}
      </body>
    </html>
  )
}