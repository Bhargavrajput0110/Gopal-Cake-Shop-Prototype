import { NextRequest } from 'next/server'
import { IncomingMessage, ServerResponse } from 'http'

// Helper to convert supertest HTTP requests directly into Next.js App Router handler calls
// This allows incredibly fast API testing without starting a real Next.js server

export const makeNextRequest = (req: IncomingMessage, body: string, urlPath: string) => {
  const url = `http://localhost:3000${urlPath}`
  const headers = new Headers()
  
  for (let i = 0; i < req.rawHeaders.length; i += 2) {
    headers.append(req.rawHeaders[i], req.rawHeaders[i + 1])
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  }

  if (req.method !== 'GET' && req.method !== 'HEAD' && body) {
    init.body = body
  }

  return new NextRequest(url, init as any)
}
