import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

const messageSchema = z.object({
  messages: z.array(z.object({
    content: z.string().min(1).max(10000).trim(),
    isAI: z.boolean(),
    llmModel: z.string().max(50).optional(),
  })).min(1).max(10), // Ограничиваем количество сообщений за раз
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Валидация ID чата
    if (!params.id || params.id.length === 0) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 })
    }

    // Проверяем, что чат существует
    const chat = await prisma.chat.findUnique({
      where: { id: params.id },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Получаем параметры пагинации
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    // Ограничиваем размер страницы
    const validLimit = Math.min(Math.max(limit, 1), 100)
    const offset = (page - 1) * validLimit

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { chatId: params.id },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: validLimit,
        skip: offset,
      }),
      prisma.message.count({
        where: { chatId: params.id },
      })
    ])

    return NextResponse.json({ 
      messages,
      pagination: {
        page,
        limit: validLimit,
        total,
        pages: Math.ceil(total / validLimit)
      }
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Валидация ID чата
    if (!params.id || params.id.length === 0) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 })
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
    const validationResult = messageSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { messages } = validationResult.data

    // Проверяем, что чат существует
    const chat = await prisma.chat.findUnique({
      where: { id: params.id },
    })

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Создаем сообщения в транзакции
    const createdMessages = await prisma.$transaction(async (tx) => {
      const created = []
      
      for (const msg of messages) {
        const message = await tx.message.create({
          data: {
            content: msg.content,
            chatId: params.id,
            authorId: session.id,
            isAI: msg.isAI,
            llmModel: msg.llmModel,
          },
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
          },
        })
        created.push(message)
      }

      // Обновляем время последнего обновления чата
      await tx.chat.update({
        where: { id: params.id },
        data: { updatedAt: new Date() },
      })

      return created
    })

    return NextResponse.json({ messages: createdMessages }, { status: 201 })
  } catch (error) {
    console.error('Error creating messages:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create messages' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Валидация ID чата
    if (!params.id || params.id.length === 0) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')

    if (messageId) {
      // Удаляем конкретное сообщение
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        include: { author: true },
      })

      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 })
      }

      // Только автор сообщения может его удалить
      if (message.authorId !== session.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      await prisma.message.delete({
        where: { id: messageId },
      })

      return NextResponse.json({ success: true })
    } else {
      // Удаляем все сообщения в чате (только для приватных чатов)
      const chat = await prisma.chat.findUnique({
        where: { id: params.id },
        include: { messages: true },
      })

      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
      }

      // Проверяем, что пользователь является автором всех сообщений в чате
      const hasOtherAuthors = chat.messages.some(msg => msg.authorId !== session.id)
      if (hasOtherAuthors) {
        return NextResponse.json({ error: 'Cannot delete messages from shared chat' }, { status: 403 })
      }

      await prisma.message.deleteMany({
        where: { chatId: params.id },
      })

      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Error deleting messages:', error)
    return NextResponse.json(
      { error: 'Failed to delete messages' },
      { status: 500 }
    )
  }
}