import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export function invalidateCategoriesCache() {
  (globalThis as typeof globalThis & { categoriesCache?: unknown }).categoriesCache = null;
}

export async function GET() {
  try {
    const globalRef = globalThis as typeof globalThis & {
      categoriesCache?: unknown;
    };
    if (!globalRef.categoriesCache) {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .is('deletedAt', null)
        .order('displayOrder', { ascending: true });

      if (error) throw error;
      globalRef.categoriesCache = data;
    }
    return NextResponse.json(globalRef.categoriesCache);
  } catch (error: any) {
    console.error('Categories GET error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    // Invalidate categories cache
    (globalThis as typeof globalThis & { categoriesCache?: unknown }).categoriesCache = null;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Categories POST error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
