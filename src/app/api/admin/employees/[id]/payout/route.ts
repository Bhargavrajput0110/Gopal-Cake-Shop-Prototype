import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Pay monthly salary and deduct advances
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    const { monthYear, deductionAmount } = await request.json();
    if (!monthYear) {
      return NextResponse.json({ success: false, error: "Month-Year is required" }, { status: 400 });
    }

    const { data: employee, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const baseSalary = employee.baseSalary || 0;
    const currentAdvance = employee.advanceBalance || 0;

    // Determine how much to deduct
    const deduct = deductionAmount !== undefined 
      ? Math.min(deductionAmount, currentAdvance) 
      : currentAdvance; // default deduct all advances if not specified

    const amountPaid = Math.max(0, baseSalary - deduct);
    const advanceBalance = currentAdvance - deduct;
    
    const advancesLedger = Array.isArray(employee.advancesLedger) ? [...employee.advancesLedger] : [];
    let remainingToDeduct = deduct;
    
    for (let i = 0; i < advancesLedger.length; i++) {
      const adv = advancesLedger[i];
      if (adv.status === 'pending' && remainingToDeduct > 0) {
        if (adv.amount <= remainingToDeduct) {
          adv.status = 'deducted';
          adv.deductedAt = new Date().toISOString();
          remainingToDeduct -= adv.amount;
        } else {
          // Partially deduct
          const oldAmount = adv.amount;
          adv.amount = oldAmount - remainingToDeduct;
          advancesLedger.push({
            amount: remainingToDeduct,
            takenAt: adv.takenAt,
            deductedAt: new Date().toISOString(),
            status: 'deducted'
          });
          remainingToDeduct = 0;
        }
      }
    }

    const payoutsLedger = Array.isArray(employee.payoutsLedger) ? [...employee.payoutsLedger] : [];
    payoutsLedger.push({
      monthYear,
      amountPaid,
      deductions: deduct,
      paidAt: new Date().toISOString()
    });

    const { data: updatedEmployee, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ advanceBalance, advancesLedger, payoutsLedger, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, employee: updatedEmployee, payout: { amountPaid, deductions: deduct } });
  } catch (error: any) {
    console.error("Supabase employee payout update failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
