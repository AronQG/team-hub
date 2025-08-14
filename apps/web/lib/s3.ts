import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Проверяем наличие необходимых переменных окружения
const AWS_REGION = process.env.AWS_REGION
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET

if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
  console.warn('AWS S3 configuration incomplete. File uploads will not work.')
}

const s3Client = new S3Client({
  region: AWS_REGION!,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
})

export async function uploadFile(key: string, body: Buffer, contentType: string) {
  if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
    throw new Error('AWS S3 not configured')
  }

  // Валидация входных данных
  if (!key || key.length === 0) {
    throw new Error('File key is required')
  }
  
  if (!body || body.length === 0) {
    throw new Error('File content is required')
  }
  
  if (!contentType || contentType.length === 0) {
    throw new Error('Content type is required')
  }

  // Ограничиваем размер файла (50MB)
  const MAX_FILE_SIZE = 50 * 1024 * 1024
  if (body.length > MAX_FILE_SIZE) {
    throw new Error('File size exceeds maximum limit of 50MB')
  }

  try {
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Добавляем метаданные для безопасности
      Metadata: {
        'uploaded-at': new Date().toISOString(),
      },
    })

    await s3Client.send(command)
    return key
  } catch (error) {
    console.error('S3 upload error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Access Denied')) {
        throw new Error('Access denied to S3 bucket. Check your AWS credentials.')
      }
      if (error.message.includes('NoSuchBucket')) {
        throw new Error('S3 bucket does not exist. Check your AWS_S3_BUCKET configuration.')
      }
      if (error.message.includes('InvalidAccessKeyId')) {
        throw new Error('Invalid AWS access key. Check your AWS_ACCESS_KEY_ID.')
      }
    }
    
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600) {
  if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
    throw new Error('AWS S3 not configured')
  }

  if (!key || key.length === 0) {
    throw new Error('File key is required')
  }

  // Ограничиваем время жизни ссылки
  if (expiresIn < 60 || expiresIn > 86400) {
    throw new Error('Expiration time must be between 60 seconds and 24 hours')
  }

  try {
    const command = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
    })

    return getSignedUrl(s3Client, command, { expiresIn })
  } catch (error) {
    console.error('S3 signed URL error:', error)
    throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function deleteFile(key: string) {
  if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
    throw new Error('AWS S3 not configured')
  }

  if (!key || key.length === 0) {
    throw new Error('File key is required')
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
    })

    await s3Client.send(command)
  } catch (error) {
    console.error('S3 delete error:', error)
    throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}