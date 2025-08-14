import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { uploadFile, getSignedDownloadUrl } from '@/lib/s3'
import { prisma } from '@/lib/db'
import { randomUUID } from 'crypto'

// Разрешенные типы файлов
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'text/markdown',
  'application/zip',
  'application/x-zip-compressed',
]

// Максимальный размер файла (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Валидация размера файла
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }

    // Валидация типа файла
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }

    // Валидация имени файла
    if (!file.name || file.name.length === 0) {
      return NextResponse.json(
        { error: 'Invalid file name' },
        { status: 400 }
      )
    }

    // Ограничиваем длину имени файла
    if (file.name.length > 255) {
      return NextResponse.json(
        { error: 'File name too long' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    // Проверяем расширение файла
    if (!fileExtension) {
      return NextResponse.json(
        { error: 'File must have an extension' },
        { status: 400 }
      )
    }

    const s3Key = `${session.id}/${randomUUID()}.${fileExtension}`

    try {
      await uploadFile(s3Key, buffer, file.type)
    } catch (error) {
      console.error('S3 upload error:', error)
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      )
    }

    const dbFile = await prisma.file.create({
      data: {
        filename: file.name,
        s3Key,
        size: file.size,
        mimeType: file.type,
        uploaderId: session.id,
      },
    })

    const downloadUrl = await getSignedDownloadUrl(s3Key)

    return NextResponse.json({
      file: dbFile,
      downloadUrl,
    })
  } catch (error) {
    console.error('File upload error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('S3 not configured')) {
        return NextResponse.json(
          { error: 'File storage not configured' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (fileId) {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
      })

      if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }

      // Проверяем права доступа (только владелец может скачать файл)
      if (file.uploaderId !== session.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      try {
        const downloadUrl = await getSignedDownloadUrl(file.s3Key)
        return NextResponse.json({ file, downloadUrl })
      } catch (error) {
        console.error('Failed to generate download URL:', error)
        return NextResponse.json(
          { error: 'Failed to generate download link' },
          { status: 500 }
        )
      }
    }

    // Получаем список файлов пользователя с пагинацией
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Ограничиваем размер страницы
    const validLimit = Math.min(Math.max(limit, 1), 100)
    const offset = (page - 1) * validLimit

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: { uploaderId: session.id },
        orderBy: { createdAt: 'desc' },
        take: validLimit,
        skip: offset,
      }),
      prisma.file.count({
        where: { uploaderId: session.id },
      })
    ])

    return NextResponse.json({ 
      files,
      pagination: {
        page,
        limit: validLimit,
        total,
        pages: Math.ceil(total / validLimit)
      }
    })
  } catch (error) {
    console.error('File retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve files' },
      { status: 500 }
    )
  }
}