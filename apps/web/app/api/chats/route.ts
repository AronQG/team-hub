import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

const createChatSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  isPrivate: z.boolean().optional().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    // Валидация и санитизация поискового запроса
    if (search && (search.length > 100 || /[<>]/.test(search))) {
      return NextResponse.json(
        { error: 'Invalid search query' },
        { status: 400 }
      )
    }

    const chats = await prisma.chat.findMany({
      where: search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              {
                messages: {
                  some: { content: { contains: search, mode: 'insensitive' } },
                },
              },
            ],
          }
        : undefined,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { name: true, email: true } } },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ chats })
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    )
  }
}

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
    const validationResult = createChatSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { title, isPrivate } = validationResult.data

    const chat = await prisma.chat.create({
      data: { title, isPrivate },
    })

    return NextResponse.json({ chat }, { status: 201 })
  } catch (error) {
    console.error('Error creating chat:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    )
  }
}