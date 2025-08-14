import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth'

const signupSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  }),
  name: z.string().min(1).max(100).trim(),
  inviteToken: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
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
    const validationResult = signupSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const { email, password, name, inviteToken } = validationResult.data

    // Проверяем, что пользователь не существует
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 } // Изменил статус на 409 Conflict
      )
    }

    // Если предоставлен токен приглашения, валидируем его
    if (inviteToken) {
      const invite = await prisma.invite.findUnique({
        where: { token: inviteToken },
      })

      if (!invite || invite.used || invite.expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Invalid or expired invite token' },
          { status: 400 }
        )
      }

      // Отмечаем приглашение как использованное
      await prisma.invite.update({
        where: { id: invite.id },
        data: { used: true },
      })
    }

    // Создаем пользователя
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
    })

    await setAuthCookie(token)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }, { status: 201 }) // Изменил статус на 201 Created
  } catch (error) {
    console.error('Signup error:', error)
    
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