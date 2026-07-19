import { NextRequest } from 'next/dist/server/web/spec-extension/request'

type RouteHandler = (req: NextRequest, ctx: any) => Promise<Response>

/**
 * A lightweight alternative to Supertest for testing Next.js App Router endpoints directly.
 * It strictly simulates HTTP requests, executing the `withApiHandler` wrapper.
 */
export const testApi = (handler: RouteHandler) => {
  return {
    get: async (url: string, headers: Record<string, string> = {}, params: Record<string, string> = {}) => {
      const req = new NextRequest(`http://localhost:3000${url}`, {
        method: 'GET',
        headers: new Headers(headers)
      })
      const res = await handler(req, { params })
      return {
        status: res.status,
        headers: res.headers,
        body: await parseBody(res)
      }
    },
    post: async (url: string, body: any, headers: Record<string, string> = {}, params: Record<string, string> = {}) => {
      const req = new NextRequest(`http://localhost:3000${url}`, {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          ...headers
        }),
        body: JSON.stringify(body)
      })
      const res = await handler(req, { params })
      return {
        status: res.status,
        headers: res.headers,
        body: await parseBody(res)
      }
    },
    patch: async (url: string, body: any, headers: Record<string, string> = {}, params: Record<string, string> = {}) => {
      const req = new NextRequest(`http://localhost:3000${url}`, {
        method: 'PATCH',
        headers: new Headers({
          'Content-Type': 'application/json',
          ...headers
        }),
        body: JSON.stringify(body)
      })
      const res = await handler(req, { params })
      return {
        status: res.status,
        headers: res.headers,
        body: await parseBody(res)
      }
    },
    put: async (url: string, body: any, headers: Record<string, string> = {}, params: Record<string, string> = {}) => {
      const req = new NextRequest(`http://localhost:3000${url}`, {
        method: 'PUT',
        headers: new Headers({
          'Content-Type': 'application/json',
          ...headers
        }),
        body: JSON.stringify(body)
      })
      const res = await handler(req, { params })
      return {
        status: res.status,
        headers: res.headers,
        body: await parseBody(res)
      }
    },
    delete: async (url: string, headers: Record<string, string> = {}, params: Record<string, string> = {}) => {
      const req = new NextRequest(`http://localhost:3000${url}`, {
        method: 'DELETE',
        headers: new Headers(headers)
      })
      const res = await handler(req, { params })
      return {
        status: res.status,
        headers: res.headers,
        body: await parseBody(res)
      }
    }
  }
}

async function parseBody(res: Response) {
  try {
    const text = await res.text()
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}
