import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Проверяем подключение к базе данных
    await prisma.$queryRaw`SELECT 1`
    
    // Проверяем наличие необходимых переменных окружения
    const requiredEnvVars = [
      'JWT_SECRET',
      'DATABASE_URL'
    ]
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Missing required environment variables',
          missing: missingEnvVars
        },
        { status: 500 }
      )
    }
    
    // Проверяем AI провайдеры
    const aiProviders = {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      google: !!process.env.GOOGLE_API_KEY
    }
    
    const hasAnyAIProvider = Object.values(aiProviders).some(Boolean)
    
    // Проверяем S3 конфигурацию
    const s3Configured = !!(
      process.env.AWS_REGION &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET
    )
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      database: 'connected',
      ai: {
        configured: hasAnyAIProvider,
        providers: aiProviders
      },
      storage: {
        s3: s3Configured
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
