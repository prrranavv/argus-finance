"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      closeButton
      duration={5000}
      toastOptions={{
        style: {
          background: '#1f1f1f',
          color: '#ffffff',
          border: '1px solid #333333',
        },
        className: 'dark-toast',
      }}
      style={
        {
          "--normal-bg": "#1f1f1f",
          "--normal-text": "#ffffff",
          "--normal-border": "#333333",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
