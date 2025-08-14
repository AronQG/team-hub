import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { generateLLMResponse } from '@/lib/llm/client'
import { LLMModel, LLMMessage } from '@/lib/llm/types'

const chatRequestSchema = z.object({
  model: z.enum(['gpt-4-turbo-preview', 'gpt-3.5-turbo', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'gemini-pro']),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().min(1).max(10000)
  })).min(1),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(4000).optional(),
  stream: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Валидация входных данных
    const validationResult = chatRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { model, messages, temperature, max_tokens, stream } = validationResult.data

    // Проверяем наличие API ключей
    const provider = model.startsWith('gpt') ? 'openai' : 
                    model.startsWith('claude') ? 'anthropic' : 'google'
    
    const apiKey = provider === 'openai' ? process.env.OPENAI_API_KEY :
                   provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY :
                   process.env.GOOGLE_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: `${provider} API key not configured` },
        { status: 500 }
      )
    }

    // Ограничиваем количество сообщений для предотвращения переполнения
    if (messages.length > 50) {
      return NextResponse.json(
        { error: 'Too many messages. Maximum 50 messages allowed.' },
        { status: 400 }
      )
    }

    // Проверяем общую длину контента
    const totalContentLength = messages.reduce((sum, msg) => sum + msg.content.length, 0)
    if (totalContentLength > 50000) {
      return NextResponse.json(
        { error: 'Total message content too long. Maximum 50,000 characters allowed.' },
        { status: 400 }
      )
    }

    if (stream) {
      // Создаем ReadableStream для стриминга
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const llmStream = await generateLLMResponse(model, messages, true)
            
            for await (const chunk of llmStream.textStream) {
              controller.enqueue(encoder.encode(chunk))
            }
            
            controller.close()
          } catch (error) {
            console.error('LLM streaming error:', error)
            controller.error(error)
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // Обычный ответ без стриминга
      const result = await generateLLMResponse(model, messages, false)
      
      return NextResponse.json({
        content: result.content,
        model,
        usage: result.usage
      })
    }
  } catch (error) {
    console.error('LLM API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    // Не раскрываем внутренние ошибки в продакшене
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
