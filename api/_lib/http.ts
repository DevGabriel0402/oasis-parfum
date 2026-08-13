import type { VercelRequest, VercelResponse } from '@vercel/node'

export function method(req: VercelRequest, res: VercelResponse, allowed: string[]) {
  if (allowed.includes(req.method ?? '')) return true
  res.setHeader('Allow', allowed.join(', ')); res.status(405).json({ error: 'Método não permitido.' }); return false
}
export function fail(res: VercelResponse, error: unknown, status = 500) {
  console.error(error)
  return res.status(status).json({ error: error instanceof Error ? error.message : 'Erro inesperado.' })
}
