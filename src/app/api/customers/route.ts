import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { CustomerService } from '@/services/CustomerService';
import { CreateCustomerSchema } from '@/dtos/CustomerSchemas';

export const GET = withApiHandler(async (ctx) => {
  const customers = await CustomerService.listCustomers();
  return NextResponse.json(customers);
});

export const POST = withApiHandler(async (ctx) => {
  const body = await ctx.req.json();
  const data = CreateCustomerSchema.parse(body);

  const customer = await CustomerService.createCustomer(data);
  return NextResponse.json(customer, { status: 201 });
});
