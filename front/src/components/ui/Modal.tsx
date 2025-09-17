import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

export function Modal({ isOpen, onClose, title, children, size = 'md', className = '' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
          />
          
          {/* Modal container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring", 
              duration: 0.4,
              bounce: 0.1
            }}
            className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden ${className}`}
          >
            {/* Glass morphism container */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
              {/* Header with gradient accent */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/20 via-transparent to-brand-accent/20" />
                <div className="relative flex items-center justify-between p-5 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-gradient-to-b from-brand-primary to-brand-primaryDark rounded-full" />
                    <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="group p-2 hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Content with custom scrollbar */}
              <div className="overflow-y-auto max-h-[calc(90vh-120px)] scroll-y">
                <div className="p-5">
                  {children}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  confirmFirst?: boolean
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  variant = 'danger',
  confirmFirst = false
}: ConfirmModalProps) {
  
  const variantClasses = {
    danger: 'text-red-400',
    warning: 'text-yellow-400', 
    info: 'text-blue-400'
  }

  const buttonClasses = {
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30',
    warning: 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30',
    info: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30'
  }

  const iconClasses = {
    danger: 'bg-red-500/20 text-red-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    info: 'bg-blue-500/20 text-blue-400'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring", 
              duration: 0.4,
              bounce: 0.1
            }}
            className="relative w-full max-w-md"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-6">
                {/* Icon and title */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconClasses[variant]}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {variant === 'danger' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                      )}
                      {variant === 'warning' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                      )}
                      {variant === 'info' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                  </div>
                  <h3 className={`text-lg font-bold ${variantClasses[variant]}`}>{title}</h3>
                </div>
                
                {/* Message */}
                <p className="text-white/80 mb-6 leading-relaxed">{message}</p>
                
                {/* Buttons */}
                <div className="flex gap-3">
                  {confirmFirst ? (
                    <>
                      <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 ${buttonClasses[variant]} rounded-xl transition-all duration-200 font-medium hover:scale-105`}
                      >
                        {confirmText}
                      </button>
                      <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white/90 rounded-xl transition-all duration-200 font-medium border border-white/10 hover:border-white/20"
                      >
                        {cancelText}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white/90 rounded-xl transition-all duration-200 font-medium border border-white/10 hover:border-white/20"
                      >
                        {cancelText}
                      </button>
                      <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 ${buttonClasses[variant]} rounded-xl transition-all duration-200 font-medium hover:scale-105`}
                      >
                        {confirmText}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}