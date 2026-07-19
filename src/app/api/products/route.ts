import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export function invalidateProductsCache() {
  (globalThis as typeof globalThis & { productsCache?: unknown }).productsCache = null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const all = searchParams.get('all');

    const globalRef = globalThis as typeof globalThis & {
      productsCache?: unknown;
    };
    if (!globalRef.productsCache) {
      const { data, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .is('deletedAt', null)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      globalRef.productsCache = data;
    }

    interface SimpleProduct {
      status: string;
      categoryId: string;
    }

    let filtered = (globalRef.productsCache as SimpleProduct[]) || [];
    if (!all) {
      filtered = filtered.filter((p) => p.status === 'active');
    }
    if (category) {
      filtered = filtered.filter((p) => p.categoryId === category);
    }

    return NextResponse.json(filtered);
  } catch (error: any) {
    console.error('Products GET error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    // Invalidate products cache
    (globalThis as typeof globalThis & { productsCache?: unknown }).productsCache = null;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Products POST error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

