import { createSwaggerSpec } from 'next-swagger-doc'
import { NextResponse } from 'next/server'

export const GET = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Gopal Cake Shop ERP API',
        version: '1.0.0',
        description: 'Core API Layer for the Gopal Cake Shop ERP',
      },
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'sb-access-token',
          },
        },
      },
      security: [{ cookieAuth: [] }],
    },
  })

  return NextResponse.json(spec)
}
