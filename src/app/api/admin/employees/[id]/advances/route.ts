import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Record an advance taken by an employee
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const { amount } = await request.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }

    const { data: employee, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const advanceBalance = (employee.advanceBalance || 0) + amount;
    const advancesLedger = Array.isArray(employee.advancesLedger) ? [...employee.advancesLedger] : [];
    
    advancesLedger.push({
      amount,
      takenAt: new Date().toISOString(),
      status: 'pending'
    });

    const { data: updatedEmployee, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ advanceBalance, advancesLedger, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, employee: updatedEmployee });
  } catch (error: any) {
    console.error("Supabase employee advances update failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
