'use client'

import { useState, useRef, useEffect } from 'react'
import { LLMModel, LLMMessage } from '@/lib/llm/types'

interface LLMChatProps {
  chatId: string
  initialMessages?: LLMMessage[]
}

const AVAILABLE_MODELS: { value: LLMModel; label: string }[] = [
  { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
  { value: 'gemini-pro', label: 'Gemini Pro' },
]

export default function LLMChat({ chatId, initialMessages = [] }: LLMChatProps) {
  const [messages, setMessages] = useState<LLMMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState<LLMModel>('gpt-3.5-turbo')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Очищаем ошибку при изменении модели
    setError(null)
  }, [selectedModel])

  async function sendMessage() {
    if (!input.trim() || isLoading) return

    const userMessage: LLMMessage = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    // Создаем новый AbortController для отмены запроса
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, userMessage],
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      // Добавляем сообщение ассистента сразу
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        assistantMessage += chunk

        // Обновляем последнее сообщение ассистента
        setMessages(prev => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          
          if (lastMessage?.role === 'assistant') {
            lastMessage.content = assistantMessage
          }
          
          return newMessages
        })
      }

      // Сохраняем сообщения в базу данных
      try {
        await fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { content: userMessage.content, isAI: false },
              { content: assistantMessage, isAI: true, llmModel: selectedModel },
            ],
          }),
        })
      } catch (dbError) {
        console.error('Failed to save messages to database:', dbError)
        // Не показываем ошибку пользователю, так как чат уже работает
      }
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Удаляем последнее сообщение ассистента если оно пустое
      setMessages(prev => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage?.role === 'assistant' && lastMessage.content === '') {
          newMessages.pop()
        }
        return newMessages
      })

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError('Request was cancelled')
        } else if (error.message.includes('API key')) {
          setError('AI service not configured. Please contact administrator.')
        } else if (error.message.includes('rate limit')) {
          setError('Rate limit exceeded. Please try again later.')
        } else {
          setError(error.message || 'An error occurred. Please try again.')
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function cancelRequest() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>Start a conversation with AI</p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 border-l-4 border-red-400">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="border-t p-4">
        <div className="flex gap-2 mb-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as LLMModel)}
            disabled={isLoading}
            className="px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {AVAILABLE_MODELS.map(model => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          
          {isLoading ? (
            <button
              onClick={cancelRequest}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  )
}