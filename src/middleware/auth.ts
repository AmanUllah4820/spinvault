import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie'
import { verifyJWT } from '../utils/crypto'
import type { Env, JWTPayload } from '../types'

declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload
  }
}

export const authMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const token = getCookie(c, 'session')
  if (!token) {
    return c.redirect('/login?redirect=' + encodeURIComponent(c.req.path))
  }
  const payload = await verifyJWT(token, c.env.JWT_SECRET)
  if (!payload) {
    return c.redirect('/login?session=expired')
  }
  c.set('user', payload)
  await next()
})

export const verifiedMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const user = c.get('user')
  if (!user.verified) {
    return c.redirect('/verify-email?email=' + encodeURIComponent(user.email))
  }
  await next()
})
