import React, { useEffect, useState } from 'react'
import { TickCircle, Danger, InfoCircle, CloseSquare } from "iconsax-react"
import { motion, AnimatePresence } from 'framer-motion'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export type NotificationToastProps = {
  id: string
  title: string
  message?: string
  variant?: ToastVariant
  duration?: number
  onClose: (id: string) => void
}

const icons = {
  success: <TickCircle className="w-5 h-5 text-success" />,
  error: <Danger className="w-5 h-5 text-destructive" />,
  warning: <Danger className="w-5 h-5 text-warning" />,
  info: <InfoCircle className="w-5 h-5 text-info" />,
}

export function NotificationToast({
  id, title, message, variant = 'info', duration = 5000, onClose
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose(id), 300) // allow exit animation
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, id, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(id), 300)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className="bg-card border border-border shadow-lg rounded-lg p-4 w-[350px] max-w-[calc(100vw-2rem)] flex gap-3 relative pointer-events-auto"
          role="alert"
          aria-live="assertive"
          data-testid={`toast-${variant}`}
        >
          <div className="shrink-0 mt-0.5">{icons[variant]}</div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-foreground">{title}</h4>
            {message && <p className="text-sm text-muted-foreground mt-1 leading-snug">{message}</p>}
          </div>
          <button 
            onClick={handleClose}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close notification"
          >
            <CloseSquare className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
