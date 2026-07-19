import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { CustomerService } from '@/services/CustomerService';
import { CreateCustomerSchema } from '@/dtos/CustomerSchemas';
import { z } from 'zod';

const UpdateCustomerSchema = CreateCustomerSchema.partial();

export const PATCH = withApiHandler(async (ctx) => {
  const body = await ctx.req.json();
  const data = UpdateCustomerSchema.parse(body);
  const id = ctx.params.id;

  const customer = await CustomerService.updateCustomer(id, data);
  return NextResponse.json(customer);
});

// Customers are never deleted (per ADR-006 Soft Delete Policy)
export const DELETE = withApiHandler(async () => {
  return NextResponse.json({ error: "Customers cannot be deleted" }, { status: 403 });
});
