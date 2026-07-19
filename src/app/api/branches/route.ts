import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { BranchService } from '@/services/BranchService';
import { CreateBranchSchema } from '@/dtos/BranchSchemas';

export const GET = withApiHandler(async (ctx) => {
  const branches = await BranchService.listBranches(true);
  return NextResponse.json(branches);
});

export const POST = withApiHandler(async (ctx) => {
  const body = await ctx.req.json();
  const data = CreateBranchSchema.parse(body);

  const branch = await BranchService.createBranch(data);
  return NextResponse.json(branch, { status: 201 });
});
