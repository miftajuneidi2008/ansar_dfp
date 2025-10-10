"use client"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  id: string
  title: string
  message: string
  type?: "info" | "success" | "warning" | "error"
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss: () => void
}

export function Toast({ title, message, type = "info", action, onDismiss }: ToastProps) {
  const bgColor = {
    info: "bg-white border-teal-200",
    success: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    error: "bg-red-50 border-red-200",
  }[type]

  const iconBg = {
    info: "bg-teal-100",
    success: "bg-green-100",
    warning: "bg-yellow-100",
    error: "bg-red-100",
  }[type]

  const iconColor = {
    info: "text-teal-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
  }[type]

  return (
    <div
      className={cn("w-96 rounded-lg border-2 shadow-lg p-4 animate-in slide-in-from-right-full duration-300", bgColor)}
    >
      <div className="flex gap-3">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", iconBg)}>
          <svg className={cn("w-5 h-5", iconColor)} fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
          <p className="text-sm text-slate-600 mt-1">{message}</p>

          {action && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={action.onClick}
                className="px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-md hover:bg-teal-600 transition-colors"
              >
                {action.label}
              </button>
              <button
                onClick={onDismiss}
                className="px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-md border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        <button onClick={onDismiss} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
