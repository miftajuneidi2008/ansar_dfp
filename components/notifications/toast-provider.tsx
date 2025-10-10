"use client"

import type React from "react"

import { createContext, useContext, useState, useCallback } from "react"
import { Toast, type ToastProps } from "@/components/ui/toast"
import { useRouter } from "next/navigation"

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, "id" | "onDismiss">) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])
  const router = useRouter()

  const showToast = useCallback((toast: Omit<ToastProps, "id" | "onDismiss">) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: ToastProps = {
      ...toast,
      id,
      onDismiss: () => dismissToast(id),
    }
    setToasts((prev) => [...prev, newToast])

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismissToast(id)
    }, 5000)
  }, [])

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
