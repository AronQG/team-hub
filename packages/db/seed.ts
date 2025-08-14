import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Создаем тестового пользователя
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@teamhub.com' },
    update: {},
    create: {
      email: 'admin@teamhub.com',
      password: hashedPassword,
      name: 'Admin User',
    },
  })

  console.log('✅ Created user:', user.email)

  // Создаем тестовый чат
  const chat = await prisma.chat.create({
    data: {
      title: 'Welcome Chat',
      isPrivate: false,
    },
  })

  console.log('✅ Created chat:', chat.title)

  // Создаем тестовые сообщения
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        content: 'Welcome to Team Hub! This is your first chat.',
        chatId: chat.id,
        authorId: user.id,
        isAI: false,
      },
    }),
    prisma.message.create({
      data: {
        content: 'Hello! I\'m your AI assistant. How can I help you today?',
        chatId: chat.id,
        authorId: user.id,
        isAI: true,
        llmModel: 'gpt-3.5-turbo',
      },
    }),
  ])

  console.log('✅ Created messages:', messages.length)

  // Создаем тестовые задачи
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Welcome Task',
        description: 'This is your first task. You can edit, move, or delete it.',
        status: 'todo',
        order: 0,
        creatorId: user.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Explore Features',
        description: 'Try out the different features of Team Hub.',
        status: 'in_progress',
        order: 0,
        creatorId: user.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Completed Task',
        description: 'This task is already completed.',
        status: 'done',
        order: 0,
        creatorId: user.id,
      },
    }),
  ])

  console.log('✅ Created tasks:', tasks.length)

  // Создаем тестовое приглашение (проверяем существование)
  const existingInvite = await prisma.invite.findUnique({
    where: { token: 'test-invite-token-123' },
  })

  if (!existingInvite) {
    const invite = await prisma.invite.create({
      data: {
        email: 'invite@example.com',
        token: 'test-invite-token-123',
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })
    console.log('✅ Created invite:', invite.email)
  } else {
    console.log('✅ Invite already exists:', existingInvite.email)
  }

  console.log('🎉 Database seed completed successfully!')
  console.log('\n📋 Test credentials:')
  console.log('Email: admin@teamhub.com')
  console.log('Password: password123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
