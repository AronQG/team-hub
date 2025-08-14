import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './db'

// Проверка наличия JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET || JWT_SECRET === 'your_jwt_secret_here_change_this') {
  throw new Error('JWT_SECRET must be set to a secure random string')
}

const SALT_ROUNDS = parseInt(process.env.HASH_SALT_ROUNDS || '12') // Увеличил с 10 до 12

export interface JWTPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '7d',
    issuer: 'team-hub',
    audience: 'team-hub-users'
  })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'team-hub',
      audience: 'team-hub-users'
    }) as JWTPayload
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')?.value
  
  if (!token) return null
  
  const payload = verifyToken(token)
  if (!payload) return null
  
  // Проверяем, что токен не истек
  if (payload.exp * 1000 < Date.now()) {
    return null
  }
  
  const user = await prisma.user.findUnique({
    where: { id: payload.userId }
  })
  
  return user
}

export async function setAuthCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // Изменил с 'lax' на 'strict' для большей безопасности
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
}

export async function clearAuthCookie() {
  const cookieStore = cookies()
  cookieStore.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // Устанавливаем maxAge в 0 для удаления куки
    path: '/'
  })
}