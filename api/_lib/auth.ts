import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SignJWT, jwtVerify } from 'jose'

const COOKIE = 'oasis_session'
function secret() {
  const value = process.env.SESSION_SECRET
  if (!value || value.length < 24) throw new Error('SESSION_SECRET não configurado com segurança.')
  return new TextEncoder().encode(value)
}
function cookieMap(header?: string) {
  return Object.fromEntries((header ?? '').split(';').filter(Boolean).map((part) => { const [key, ...value] = part.trim().split('='); return [key, decodeURIComponent(value.join('='))] }))
}
export async function createSession(res: VercelResponse) {
  const token = await new SignJWT({ role: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setSubject('oasis-admin').setIssuedAt().setExpirationTime('30d').sign(secret())
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure}`)
}
export function clearSession(res: VercelResponse) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`)
}
export async function isAuthenticated(req: VercelRequest) {
  const token = cookieMap(req.headers.cookie)[COOKIE]; if (!token) return false
  try { const result = await jwtVerify(token, secret()); return result.payload.sub === 'oasis-admin' } catch { return false }
}
export async function requireAuth(req: VercelRequest, res: VercelResponse) {
  if (await isAuthenticated(req)) return true
  res.status(401).json({ error: 'Sessão inválida ou expirada.' }); return false
}
