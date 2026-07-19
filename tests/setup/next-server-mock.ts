export class NextRequest extends Request {}
export class NextResponse extends Response {
  static json(body: any, init?: any) {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: { ...init?.headers, 'Content-Type': 'application/json' },
    });
  }
}
