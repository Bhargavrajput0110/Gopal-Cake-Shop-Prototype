import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export type ApiResponseData<T = any> = {
  success: boolean
  message: string
  data?: T
  code?: string
  details?: Array<{ field: string; message: string }>
  meta?: {
    page?: number
    limit?: number
    total?: number
    requestId?: string
  }
}

export function generateRequestId(): string {
  return `req_${uuidv4()}`
}

export function successResponse<T>(data: T, message: string = 'Success', requestId?: string) {
  return NextResponse.json(
    { success: true, message, data, meta: { requestId } },
    { status: 200 }
  )
}

export function createdResponse<T>(data: T, message: string = 'Resource created successfully', requestId?: string) {
  return NextResponse.json(
    { success: true, message, data, meta: { requestId } },
    { status: 201 }
  )
}

export function paginatedResponse(
  data: any[],
  page: number,
  limit: number,
  total: number,
  message: string = 'Success',
  requestId?: string
) {
  const totalPages = Math.ceil(total / limit)
  return NextResponse.json({
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    meta: requestId ? { requestId } : undefined
  })
}

export function noContentResponse() {
  return new NextResponse(null, { status: 204 })
}

export function errorResponse(
  message: string,
  code: string,
  status: number,
  details: Array<{ field: string; message: string }> = [],
  requestId?: string
) {
  return NextResponse.json(
    { success: false, message, code, details, meta: { requestId } },
    { status }
  )
}
