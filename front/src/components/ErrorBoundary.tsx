'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Здесь можно отправить ошибку в сервис аналитики
    // например, Sentry, LogRocket и т.д.
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-brand-dark">
          <div className="text-center p-8">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              Что-то пошло не так
            </h1>
            
            <p className="text-white/70 mb-6 max-w-md">
              Произошла непредвиденная ошибка. Пожалуйста, попробуйте обновить страницу или вернуться на главную.
            </p>
            
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Обновить страницу
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="btn btn-outline"
              >
                На главную
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-white/70 cursor-pointer">
                  Детали ошибки (только для разработки)
                </summary>
                <pre className="mt-2 p-4 bg-white/5 rounded text-xs text-white/60 overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Хук для обработки ошибок в функциональных компонентах
export function useErrorHandler() {
  return (error: Error) => {
    console.error('Error caught by useErrorHandler:', error)
    
    // Здесь можно отправить ошибку в сервис аналитики
    // или показать уведомление пользователю
  }
} 