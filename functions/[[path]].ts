import app from '../src/index'
import type { Env } from '../src/types'

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const path = url.pathname

  // ✅ allow static files to be served from /public
  if (
    path.startsWith('/css/') ||
    path.startsWith('/images/') ||
    path.startsWith('/favicon') ||
    path === '/_headers' ||
    path === '/_redirects'
  ) {
    return context.next()
  }

  // 👉 everything else goes to Hono
  return app.fetch(
    context.request,
    context.env as Env,
    context as unknown as ExecutionContext
  )
}
