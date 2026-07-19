import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('categoryId', id)
      .is('deletedAt', null)
      .single();
    
    if (error || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Category GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update(body)
      .eq('categoryId', id)
      .select()
      .single();
    
    if (error || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Category PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update({ 
        deletedAt: new Date().toISOString(),
        status: 'inactive'
      })
      .eq('categoryId', id)
      .select()
      .single();
    
    if (error || !category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('Category DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
